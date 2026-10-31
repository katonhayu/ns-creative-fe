<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import Row from 'primevue/row'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Select from 'primevue/select'
import StatusBadge from '@/components/StatusBadge.vue'
import { pesanError } from '@/api/http'
import { rupiah } from '@/utils/format'
import { createBudget, deleteBudget, listBudgets, updateBudget } from '../budget.api'
import type { BudgetPayload } from '../budget.schema'
import {
  LABEL_SUMBER,
  hitungTotal,
  melebihiEstimasi,
  selisih,
  type BudgetItem,
  type SumberBudget,
} from '../budget.types'
import type { EventDetail } from '../event.types'
import { STATUS_PEMBAYARAN, pilihanDari, type StatusPembayaran } from '../penugasan.types'
import BudgetForm from './BudgetForm.vue'
import PanelTab from './PanelTab.vue'

const props = defineProps<{ event: EventDetail }>()
const emit = defineEmits<{ bukaTab: [tab: string] }>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'budgets']),
  queryFn: () => listBudgets(props.event.id),
})

const semua = computed(() => daftar.data.value ?? [])
const segarkan = () => queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })

// --- Filter ------------------------------------------------------------------

const filterKategori = ref<string | null>(null)
const filterBayar = ref<StatusPembayaran | null>(null)
const hanyaMelebihi = ref(false)

const pilihanKategori = computed(() =>
  [...new Set(semua.value.map((b) => b.kategori))].sort((a, b) => a.localeCompare(b, 'id')),
)
const PILIHAN_BAYAR = pilihanDari(STATUS_PEMBAYARAN)

const tampil = computed(() =>
  semua.value.filter(
    (b) =>
      (!filterKategori.value || b.kategori === filterKategori.value) &&
      (!filterBayar.value || b.statusPembayaran === filterBayar.value) &&
      (!hanyaMelebihi.value || melebihiEstimasi(b)),
  ),
)
const adaFilter = computed(
  () => Boolean(filterKategori.value || filterBayar.value) || hanyaMelebihi.value,
)
function resetFilter() {
  filterKategori.value = null
  filterBayar.value = null
  hanyaMelebihi.value = false
}

/** Total seluruh pos, untuk kartu ringkasan. */
const totalSemua = computed(() => hitungTotal(semua.value))
/** Total pos yang sedang tampil, untuk baris total tabel. */
const totalTampil = computed(() => hitungTotal(tampil.value))

function formatSelisih(nilai: number | null) {
  if (nilai === null) return '—'
  if (nilai < 0) return `−${rupiah(-nilai)}`
  return rupiah(nilai)
}
const kelasSelisih = (nilai: number | null) =>
  nilai === null ? 'sel-redup' : nilai < 0 ? 'minus' : nilai > 0 ? 'plus' : ''

const kelasBaris = (b: BudgetItem) => ({
  'baris-lebih': melebihiEstimasi(b),
  'baris-batal': b.keteranganSumber === 'Batal',
})

// --- Tambah & edit -----------------------------------------------------------

const formTerbuka = ref(false)
const dipilih = ref<BudgetItem | null>(null)

function bukaTambah() {
  dipilih.value = null
  formTerbuka.value = true
}
function bukaEdit(b: BudgetItem) {
  dipilih.value = b
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: BudgetPayload) =>
    dipilih.value
      ? updateBudget(props.event.id, dipilih.value, payload)
      : createBudget(props.event.id, payload),
  onSuccess: (hasil) => {
    segarkan()
    const s = selisih(hasil)
    toast.add({
      severity: s !== null && s < 0 ? 'warn' : 'success',
      summary: dipilih.value ? 'Pos anggaran diperbarui' : 'Pos anggaran ditambahkan',
      detail:
        s !== null && s < 0
          ? `${hasil.namaKebutuhan} melebihi estimasi ${rupiah(-s)}.`
          : hasil.namaKebutuhan,
      life: 3500,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: BudgetPayload) {
  await mutasiSimpan.mutateAsync(payload)
}

// --- Hapus (hanya pos manual) -------------------------------------------------

const mutasiHapus = useMutation({
  mutationFn: (b: BudgetItem) => deleteBudget(props.event.id, b.id),
  onSuccess: (_, b) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: 'Pos anggaran dihapus',
      detail: b.namaKebutuhan,
      life: 3000,
    })
  },
  onError: (err, b) => {
    toast.add({
      severity: 'error',
      summary: `Gagal menghapus ${b.namaKebutuhan}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(b: BudgetItem) {
  confirm.require({
    header: 'Hapus pos anggaran?',
    message: `"${b.namaKebutuhan}" (${rupiah(b.estimasiBiaya)}) akan dihapus dari budget event ini.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Hapus', severity: 'danger' },
    accept: () => mutasiHapus.mutate(b),
  })
}

const alasanTidakBisaHapus = (b: BudgetItem) =>
  b.sumberTipe
    ? `Pos ${LABEL_SUMBER[b.sumberTipe].label.toLowerCase()}. Lepas penugasannya di tab ${b.sumberTipe === 'event_talent' ? 'Talent' : 'Vendor'} untuk menghapus.`
    : null
</script>

<template>
  <PanelTab
    judul="Budget"
    deskripsi="Estimasi, realisasi, dan pembayaran tiap pos anggaran. Fee talent dan biaya vendor tercatat otomatis."
    label-tambah="Tambah pos anggaran"
    :tanpa-tambah="!event.bolehKelola"
    ikon-kosong="pi-wallet"
    pesan-kosong="Belum ada pos anggaran. Tambahkan pos manual seperti sewa venue, atau tugaskan talent dan vendor."
    :is-pending="daftar.isPending.value"
    :is-error="daftar.isError.value"
    :is-fetching="daftar.isFetching.value"
    :error="daftar.error.value"
    :kosong="semua.length === 0"
    @tambah="bukaTambah"
    @muat-ulang="daftar.refetch()"
  >
    <div class="isi">
      <!-- Ringkasan -->
      <div class="stat">
        <div class="stat__item">
          <span>Total estimasi</span>
          <strong class="angka">{{ rupiah(totalSemua.estimasi) }}</strong>
          <small>{{ semua.length }} pos anggaran</small>
        </div>
        <div class="stat__item">
          <span>Biaya aktual</span>
          <strong class="angka">{{ rupiah(totalSemua.aktual) }}</strong>
          <small>{{ totalSemua.jumlahTerealisasi }} pos sudah terealisasi</small>
        </div>
        <div class="stat__item" :class="{ 'stat__item--minus': totalSemua.selisih < 0 }">
          <span>Selisih</span>
          <strong class="angka" :class="kelasSelisih(totalSemua.selisih)">
            {{ formatSelisih(totalSemua.selisih) }}
          </strong>
          <small>{{ totalSemua.selisih < 0 ? 'Melebihi estimasi' : 'Hemat dari estimasi' }}</small>
        </div>
        <div class="stat__item">
          <span>Sponsorship</span>
          <strong class="angka">{{ rupiah(totalSemua.sponsorship) }}</strong>
          <small>{{ totalSemua.jumlahBelumLunas }} pos belum lunas</small>
        </div>
      </div>

      <Message v-if="totalSemua.jumlahMelebihi > 0" severity="warn" :closable="false" size="small">
        <div class="peringatan">
          <span>
            {{ totalSemua.jumlahMelebihi }} pos anggaran biaya aktualnya melebihi estimasi.
          </span>
          <Button
            :label="hanyaMelebihi ? 'Tampilkan semua' : 'Lihat pos tersebut'"
            text
            size="small"
            @click="hanyaMelebihi = !hanyaMelebihi"
          />
        </div>
      </Message>

      <!-- Filter -->
      <div class="filter">
        <Select
          v-model="filterKategori"
          :options="pilihanKategori"
          placeholder="Semua kategori"
          show-clear
          aria-label="Filter kategori"
          class="filter__pilih"
        />
        <Select
          v-model="filterBayar"
          :options="PILIHAN_BAYAR"
          option-label="label"
          option-value="value"
          placeholder="Semua status bayar"
          show-clear
          aria-label="Filter status pembayaran"
          class="filter__pilih"
        />
        <Button v-if="adaFilter" label="Reset filter" text size="small" @click="resetFilter" />
      </div>

      <p v-if="!tampil.length" class="kosong-filter">Tidak ada pos anggaran dengan filter ini.</p>

      <DataTable
        v-else
        :value="tampil"
        data-key="id"
        scrollable
        row-hover
        :row-class="kelasBaris"
        class="ns-tabel tabel-budget"
      >
        <Column header="Kebutuhan" style="min-width: 16rem">
          <template #body="{ data: b }">
            <div class="kebutuhan">
              <span class="kebutuhan__nama">
                {{ b.namaKebutuhan }}
                <i
                  v-if="melebihiEstimasi(b)"
                  class="pi pi-exclamation-triangle lebih-ikon"
                  title="Biaya aktual melebihi estimasi"
                />
              </span>
              <button
                v-if="b.sumberTipe"
                type="button"
                class="sumber"
                :title="`Buka tab ${b.sumberTipe === 'event_talent' ? 'Talent' : 'Vendor'}`"
                @click="emit('bukaTab', LABEL_SUMBER[b.sumberTipe as SumberBudget].tab)"
              >
                <i class="pi pi-link" />
                {{ LABEL_SUMBER[b.sumberTipe as SumberBudget].label }}
                <template v-if="b.keteranganSumber"> · {{ b.keteranganSumber }}</template>
              </button>
            </div>
          </template>
        </Column>
        <Column header="Kategori" style="min-width: 8rem">
          <template #body="{ data: b }">
            <span class="sel-lencana">{{ b.kategori }}</span>
          </template>
        </Column>
        <Column header="Estimasi" style="min-width: 9rem" class="kanan">
          <template #body="{ data: b }">
            <span class="angka">{{ rupiah(b.estimasiBiaya) }}</span>
          </template>
        </Column>
        <Column header="Biaya Aktual" style="min-width: 9rem" class="kanan">
          <template #body="{ data: b }">
            <span v-if="b.biayaAktual !== null" class="angka">{{ rupiah(b.biayaAktual) }}</span>
            <span v-else class="sel-redup">Belum ada</span>
          </template>
        </Column>
        <Column header="Selisih" style="min-width: 9rem" class="kanan">
          <template #body="{ data: b }">
            <span class="angka" :class="kelasSelisih(selisih(b))">
              {{ formatSelisih(selisih(b)) }}
            </span>
          </template>
        </Column>
        <Column header="Sponsorship" style="min-width: 9rem" class="kanan">
          <template #body="{ data: b }">
            <span v-if="b.sponsorship" class="angka">{{ rupiah(b.sponsorship) }}</span>
            <span v-else class="sel-redup">—</span>
          </template>
        </Column>
        <Column header="Pembayaran" style="min-width: 8rem">
          <template #body="{ data: b }">
            <StatusBadge :status="STATUS_PEMBAYARAN[b.statusPembayaran as StatusPembayaran]" />
          </template>
        </Column>
        <Column v-if="event.bolehKelola" header="Aksi" style="width: 5.5rem">
          <template #body="{ data: b }">
            <div class="aksi">
              <Button
                icon="pi pi-pen-to-square"
                text
                rounded
                size="small"
                :aria-label="`Edit ${b.namaKebutuhan}`"
                title="Edit"
                @click="bukaEdit(b)"
              />
              <span :title="alasanTidakBisaHapus(b) ?? 'Hapus'">
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  size="small"
                  :aria-label="`Hapus ${b.namaKebutuhan}`"
                  :disabled="Boolean(b.sumberTipe)"
                  :loading="mutasiHapus.isPending.value && mutasiHapus.variables.value?.id === b.id"
                  @click="konfirmasiHapus(b)"
                />
              </span>
            </div>
          </template>
        </Column>

        <ColumnGroup type="footer">
          <Row>
            <Column
              :footer="adaFilter ? `Total (${tampil.length} pos terfilter)` : 'Total'"
              :colspan="2"
            />
            <Column :footer="rupiah(totalTampil.estimasi)" footer-class="kanan angka" />
            <Column :footer="rupiah(totalTampil.aktual)" footer-class="kanan angka" />
            <Column
              :footer="formatSelisih(totalTampil.selisih)"
              :footer-class="`kanan angka ${kelasSelisih(totalTampil.selisih)}`"
            />
            <Column :footer="rupiah(totalTampil.sponsorship)" footer-class="kanan angka" />
            <Column :colspan="event.bolehKelola ? 2 : 1" />
          </Row>
        </ColumnGroup>
      </DataTable>

      <p class="catatan">
        Selisih = estimasi − biaya aktual, hanya untuk pos yang sudah punya biaya aktual. Angka
        merah berarti melebihi estimasi.
      </p>
    </div>
  </PanelTab>

  <BudgetForm
    v-model:visible="formTerbuka"
    :budget="dipilih"
    :menyimpan="mutasiSimpan.isPending.value"
    :simpan="simpan"
  />
</template>

<style scoped>
.isi {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}
.stat__item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface-2);
}
.stat__item span {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}
.stat__item strong {
  color: var(--ns-text);
  font-size: 1.1rem;
  font-weight: 650;
}
.stat__item small {
  color: var(--ns-text-3);
  font-size: 0.74rem;
}
.stat__item--minus {
  border-color: #f6c6c6;
  background: var(--ns-danger-soft);
}

.peringatan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}
.filter__pilih {
  width: 12rem;
}

.kosong-filter {
  margin: 0;
  padding: 1.5rem;
  border: 1px dashed var(--ns-border-strong);
  border-radius: var(--ns-radius-sm);
  color: var(--ns-text-3);
  font-size: 0.85rem;
  text-align: center;
}

.kebutuhan {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}
.kebutuhan__nama {
  color: var(--ns-text);
  font-weight: 600;
}
.lebih-ikon {
  margin-left: 0.25rem;
  color: var(--ns-danger);
  font-size: 0.8rem;
}
.sumber {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.05rem 0.45rem;
  border: 1px solid #cfdcff;
  border-radius: 6px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}
.sumber:hover {
  border-color: var(--ns-accent);
}
.sumber i {
  font-size: 0.65rem;
}

.plus {
  color: var(--ns-success);
  font-weight: 600;
}
.minus {
  color: var(--ns-danger);
  font-weight: 700;
}

.tabel-budget :deep(.kanan) {
  text-align: right;
}
.tabel-budget :deep(th.kanan .p-datatable-column-header-content) {
  justify-content: flex-end;
}
.tabel-budget :deep(.baris-lebih > td) {
  background: #fff6f6;
}
.tabel-budget :deep(.baris-lebih > td:first-child) {
  box-shadow: inset 3px 0 0 var(--ns-danger);
}
.tabel-budget :deep(.baris-batal) {
  opacity: 0.55;
}

.aksi {
  display: flex;
  gap: 0.1rem;
}

.catatan {
  margin: 0;
  color: var(--ns-text-3);
  font-size: 0.76rem;
}

@media (max-width: 900px) {
  .stat {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .filter__pilih {
    width: 100%;
  }
}
</style>
