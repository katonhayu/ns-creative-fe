<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { errorPerField, pesanError } from '@/api/http'
import { buatLaporan, getLaporan, updateLaporan } from '@/features/reports/report.api'
import {
  laporanSchema,
  type LaporanFormValues,
  type LaporanPayload,
} from '@/features/reports/report.schema'
import type { Laporan } from '@/features/reports/report.types'
import { rupiah, tanggal } from '@/utils/format'
import { getRingkasanEvent } from '../event.api'
import { STATUS_EVENT, type EventDetail } from '../event.types'

const props = defineProps<{ event: EventDetail }>()
const emit = defineEmits<{ editEvent: []; bukaTab: [tab: string] }>()

const toast = useToast()
const queryClient = useQueryClient()

const laporan = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'report']),
  queryFn: () => getLaporan(props.event.id),
})
const ringkasan = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'ringkasan']),
  queryFn: () => getRingkasanEvent(props.event.id),
})

const sudahSelesai = computed(() => props.event.status === 'selesai')
const data = computed(() => laporan.data.value ?? null)

/** Angka yang ditarik otomatis dari modul lain. */
const angka = computed(() => {
  const r = ringkasan.data.value
  if (!r) return null
  return {
    totalTask: r.task.total,
    taskSelesai: r.task.selesai,
    persenTask: Math.round(r.task.persenSelesai),
    jumlahTalent: r.jumlahTalent,
    jumlahCrew: r.jumlahCrew,
    jumlahVendor: r.jumlahVendor,
    jumlahDokumen: r.jumlahDokumen,
    budget: {
      estimasi: r.budget.totalEstimasi,
      aktual: r.budget.totalAktual,
      sponsorship: r.budget.totalSponsorship,
      belumLunas: r.budget.belumLunas,
    },
  }
})

/** Budget dikoreksi setelah laporan dibuat: angka laporan tetap, tapi pengguna perlu tahu. */
const selisihSnapshot = computed(() => {
  const b = angka.value?.budget
  if (!data.value || !b) return 0
  return b.aktual - data.value.totalPengeluaran
})

// --- Form ----------------------------------------------------------------------

const modeEdit = ref(false)
const pesanGagal = ref('')

function nilaiAwal(l: Laporan | null): LaporanFormValues {
  return {
    hasilPelaksanaan: l?.hasilPelaksanaan ?? '',
    evaluasi: l?.evaluasi ?? '',
    kendala: l?.kendala ?? '',
    catatan: l?.catatan ?? '',
  }
}

const FIELD_FORM = ['hasilPelaksanaan', 'evaluasi', 'kendala', 'catatan'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors, meta } = useForm({
  validationSchema: skemaForm(laporanSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [hasilPelaksanaan, hasilAttrs] = defineField('hasilPelaksanaan', lazy)
const [evaluasi, evaluasiAttrs] = defineField('evaluasi', lazy)
const [kendala, kendalaAttrs] = defineField('kendala', lazy)
const [catatan, catatanAttrs] = defineField('catatan', lazy)

watch(data, (l) => resetForm({ values: nilaiAwal(l) }), { immediate: true })

function mulaiEdit() {
  pesanGagal.value = ''
  resetForm({ values: nilaiAwal(data.value) })
  modeEdit.value = true
}
function batalEdit() {
  resetForm({ values: nilaiAwal(data.value) })
  modeEdit.value = false
}

const mutasi = useMutation({
  mutationFn: (payload: LaporanPayload) =>
    data.value ? updateLaporan(props.event.id, payload) : buatLaporan(props.event.id, payload),
  onSuccess: (hasil) => {
    const baru = !data.value
    queryClient.setQueryData(['events', props.event.id, 'report'], hasil)
    queryClient.invalidateQueries({ queryKey: ['reports'] })
    toast.add({
      severity: 'success',
      summary: baru ? 'Laporan dibuat' : 'Laporan diperbarui',
      detail: baru
        ? `Total pengeluaran ${rupiah(hasil.totalPengeluaran)} dibekukan per ${tanggal(hasil.tanggalDibuat)}.`
        : 'Isi laporan tersimpan.',
      life: 4000,
    })
    modeEdit.value = false
  },
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await mutasi.mutateAsync(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Laporan gagal disimpan. Coba lagi.')
  }
})

// Hanya admin dan PIC event yang membuat atau mengubah laporan; pengguna lain hanya membaca.
const tampilForm = computed(
  () => props.event.bolehKelola && sudahSelesai.value && (!data.value || modeEdit.value),
)
</script>

<template>
  <section class="panel">
    <header class="kepala">
      <div>
        <h2>Laporan</h2>
        <p>Evaluasi pelaksanaan event. Angka total ditarik otomatis dari budget dan task.</p>
      </div>
      <Button
        v-if="data && !modeEdit && sudahSelesai && event.bolehKelola"
        label="Edit laporan"
        icon="pi pi-pen-to-square"
        outlined
        @click="mulaiEdit"
      />
    </header>

    <!-- Loading & error -->
    <p v-if="laporan.isPending.value" class="keadaan">
      <i class="pi pi-spin pi-spinner" /> Memuat laporan…
    </p>
    <Message v-else-if="laporan.isError.value" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Laporan tidak dapat dimuat. {{ pesanError(laporan.error.value) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="laporan.isFetching.value"
          @click="laporan.refetch()"
        />
      </div>
    </Message>

    <!-- Event belum selesai dan laporan belum ada: terkunci -->
    <div v-else-if="!sudahSelesai && !data" class="terkunci">
      <span class="terkunci__ikon"><i class="pi pi-lock" /></span>
      <h3>Laporan belum bisa dibuat</h3>
      <p>
        Laporan aktif setelah status event <strong>Selesai</strong>. Status sekarang:
        <strong>{{ STATUS_EVENT[event.status].label }}</strong
        >.
      </p>
      <Button
        v-if="event.status !== 'dibatalkan' && event.bolehKelola"
        label="Ubah status event"
        icon="pi pi-pen-to-square"
        outlined
        size="small"
        @click="emit('editEvent')"
      />
    </div>

    <template v-else>
      <!-- Angka otomatis -->
      <div class="angka">
        <div class="angka__item angka__item--utama">
          <span>{{ data ? 'Total pengeluaran (dibekukan)' : 'Total pengeluaran saat ini' }}</span>
          <strong class="nilai">
            {{
              data
                ? rupiah(data.totalPengeluaran)
                : angka?.budget
                  ? rupiah(angka.budget.aktual)
                  : '—'
            }}
          </strong>
          <small v-if="data">Per {{ tanggal(data.tanggalDibuat) }}</small>
          <small v-else>Akan dibekukan saat laporan dibuat</small>
        </div>
        <div v-if="angka?.budget" class="angka__item">
          <span>Estimasi budget</span>
          <strong class="nilai">{{ rupiah(angka.budget.estimasi) }}</strong>
          <small>Sponsorship {{ rupiah(angka.budget.sponsorship) }}</small>
        </div>
        <div class="angka__item">
          <span>Task selesai</span>
          <strong class="nilai">
            {{ angka ? `${angka.taskSelesai}/${angka.totalTask}` : '—' }}
          </strong>
          <small>{{ angka ? `${angka.persenTask}% dari seluruh task` : '' }}</small>
        </div>
        <div class="angka__item">
          <span>Yang terlibat</span>
          <strong class="nilai">
            {{ angka ? angka.jumlahTalent + angka.jumlahCrew + angka.jumlahVendor : '—' }}
          </strong>
          <small v-if="angka">
            {{ angka.jumlahTalent }} talent · {{ angka.jumlahCrew }} crew ·
            {{ angka.jumlahVendor }} vendor
          </small>
        </div>
        <button
          v-if="angka"
          type="button"
          class="angka__item angka__item--tautan"
          @click="emit('bukaTab', 'dokumen')"
        >
          <span>Dokumentasi</span>
          <strong class="nilai">{{ angka.jumlahDokumen }}</strong>
          <small>dokumen · lihat di tab Dokumen</small>
        </button>
      </div>

      <Message v-if="data && selisihSnapshot !== 0" severity="info" :closable="false" size="small">
        Biaya aktual di budget sekarang {{ rupiah(angka?.budget?.aktual ?? 0) }}, berbeda
        {{ rupiah(Math.abs(selisihSnapshot)) }} dari angka laporan. Total di laporan sengaja tidak
        ikut berubah karena dibekukan saat laporan dibuat.
      </Message>
      <Message
        v-else-if="!data && angka?.budget && angka.budget.belumLunas > 0"
        severity="warn"
        :closable="false"
        size="small"
      >
        <div class="peringatan">
          <span>
            Masih ada {{ angka.budget.belumLunas }} pos budget yang belum lunas. Pastikan biaya
            aktual sudah lengkap, karena totalnya dibekukan saat laporan dibuat.
          </span>
          <Button label="Buka tab Budget" text size="small" @click="emit('bukaTab', 'budget')" />
        </div>
      </Message>

      <!-- Form buat / edit -->
      <form v-if="tampilForm" class="form" novalidate @submit.prevent="kirim">
        <Message v-if="pesanGagal" severity="error" :closable="false">{{ pesanGagal }}</Message>

        <div class="baris">
          <label for="lap-hasil">Hasil pelaksanaan <span class="wajib">*</span></label>
          <Textarea
            id="lap-hasil"
            v-model="hasilPelaksanaan"
            v-bind="hasilAttrs"
            :invalid="Boolean(errors.hasilPelaksanaan)"
            rows="4"
            auto-resize
            placeholder="Apakah acara berjalan sesuai rencana? Jumlah peserta, ketepatan waktu, hal yang menonjol."
            fluid
          />
          <small v-if="errors.hasilPelaksanaan" class="galat">{{ errors.hasilPelaksanaan }}</small>
        </div>

        <div class="baris">
          <label for="lap-kendala">Kendala</label>
          <Textarea
            id="lap-kendala"
            v-model="kendala"
            v-bind="kendalaAttrs"
            :invalid="Boolean(errors.kendala)"
            rows="3"
            auto-resize
            placeholder="Masalah di lapangan dan cara penanganannya. Kosongkan jika tidak ada."
            fluid
          />
          <small v-if="errors.kendala" class="galat">{{ errors.kendala }}</small>
        </div>

        <div class="baris">
          <label for="lap-evaluasi">Evaluasi <span class="wajib">*</span></label>
          <Textarea
            id="lap-evaluasi"
            v-model="evaluasi"
            v-bind="evaluasiAttrs"
            :invalid="Boolean(errors.evaluasi)"
            rows="4"
            auto-resize
            placeholder="Pelajaran untuk event berikutnya dan tanggapan client."
            fluid
          />
          <small v-if="errors.evaluasi" class="galat">{{ errors.evaluasi }}</small>
        </div>

        <div class="baris">
          <label for="lap-catatan">Catatan</label>
          <Textarea
            id="lap-catatan"
            v-model="catatan"
            v-bind="catatanAttrs"
            :invalid="Boolean(errors.catatan)"
            rows="2"
            auto-resize
            fluid
          />
          <small v-if="errors.catatan" class="galat">{{ errors.catatan }}</small>
        </div>

        <div class="tombol">
          <Button
            v-if="data"
            label="Batal"
            severity="secondary"
            outlined
            :disabled="mutasi.isPending.value"
            @click="batalEdit"
          />
          <Button
            type="submit"
            :label="data ? 'Simpan perubahan' : 'Buat laporan'"
            :icon="data ? 'pi pi-check' : 'pi pi-file-check'"
            :loading="mutasi.isPending.value"
            :disabled="Boolean(data) && !meta.dirty"
          />
        </div>
      </form>

      <!-- Tampilan laporan -->
      <div v-else-if="data" class="isi-laporan">
        <section>
          <h3>Hasil pelaksanaan</h3>
          <p>{{ data.hasilPelaksanaan }}</p>
        </section>
        <section>
          <h3>Kendala</h3>
          <p v-if="data.kendala">{{ data.kendala }}</p>
          <p v-else class="redup">Tidak ada kendala yang dicatat.</p>
        </section>
        <section>
          <h3>Evaluasi</h3>
          <p>{{ data.evaluasi }}</p>
        </section>
        <section v-if="data.catatan">
          <h3>Catatan</h3>
          <p>{{ data.catatan }}</p>
        </section>
        <p v-if="!sudahSelesai" class="redup kecil">
          Status event sudah bukan Selesai, jadi laporan tidak bisa diedit.
        </p>
      </div>
      <p v-else class="redup">Laporan belum dibuat. Laporan dibuat oleh PIC event atau admin.</p>
    </template>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}
.kepala h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
}
.kepala p {
  margin: 0.15rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.keadaan {
  margin: 0;
  padding: 1.5rem;
  color: var(--ns-text-3);
  font-size: 0.85rem;
  text-align: center;
}
.galat-muat,
.peringatan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  width: 100%;
}

.terkunci {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--ns-border-strong);
  border-radius: var(--ns-radius-sm);
  text-align: center;
}
.terkunci__ikon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: 0.25rem;
  border-radius: 12px;
  background: var(--ns-surface-2);
  color: var(--ns-text-3);
  font-size: 1.1rem;
}
.terkunci h3 {
  margin: 0;
  font-size: 0.98rem;
}
.terkunci p {
  margin: 0 0 0.4rem;
  max-width: 50ch;
  color: var(--ns-text-2);
  font-size: 0.86rem;
}

.angka {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}
.angka__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface-2);
  font: inherit;
  text-align: left;
}
.angka__item span {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}
.angka__item small {
  color: var(--ns-text-3);
  font-size: 0.74rem;
}
.nilai {
  color: var(--ns-text);
  font-size: 1.15rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.angka__item--utama {
  border-color: #cfdcff;
  background: var(--ns-accent-soft);
}
.angka__item--utama .nilai {
  color: var(--ns-accent-text);
}
.angka__item--tautan {
  cursor: pointer;
  transition: border-color 0.12s;
}
.angka__item--tautan:hover {
  border-color: var(--ns-accent);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 52rem;
}
.baris {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.baris label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ns-text-2);
}
.wajib,
.galat {
  color: var(--ns-danger);
}
.galat {
  font-size: 0.78rem;
}
.tombol {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.isi-laporan {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 52rem;
}
.isi-laporan h3 {
  margin: 0 0 0.3rem;
  color: var(--ns-text-3);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.isi-laporan p {
  margin: 0;
  color: var(--ns-text);
  font-size: 0.9rem;
  line-height: 1.65;
  white-space: pre-line;
}
.redup {
  color: var(--ns-text-3) !important;
}
.kecil {
  font-size: 0.8rem !important;
}
</style>
