<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import FormDialog from '@/components/FormDialog.vue'
import { pesanError } from '@/api/http'
import { isoTanggal } from '@/utils/format'
import { unduhPdfRekap } from './report.api'
import type { LaporanRow } from './report.types'

type StatusLaporan = 'semua' | 'sudah' | 'belum'

const props = defineProps<{
  /** Event selesai yang terlihat oleh pengguna, untuk pratinjau jumlah isi rekap. */
  laporan: LaporanRow[]
  /** Tahun yang sedang difilter di halaman Laporan, jadi periode awal. Null = tahun ini. */
  tahunAwal: number | null
  statusAwal: StatusLaporan
}>()
const visible = defineModel<boolean>('visible', { required: true })

/** [awal, akhir]. Selama baru satu tanggal yang dipilih, dianggap satu hari. */
const rentang = ref<(Date | null)[] | null>(null)
const status = ref<StatusLaporan>('semua')
const menyimpan = ref(false)
const pesanGagal = ref('')

const PILIHAN_STATUS = [
  { value: 'semua', label: 'Semua' },
  { value: 'sudah', label: 'Sudah dibuat' },
  { value: 'belum', label: 'Belum dibuat' },
]

const PRESET: { label: string; ambil: () => [Dayjs, Dayjs] }[] = [
  { label: 'Bulan ini', ambil: () => [dayjs().startOf('month'), dayjs().endOf('month')] },
  {
    label: 'Bulan lalu',
    ambil: () => {
      const b = dayjs().subtract(1, 'month')
      return [b.startOf('month'), b.endOf('month')]
    },
  },
  { label: 'Tahun ini', ambil: () => [dayjs().startOf('year'), dayjs().endOf('year')] },
  {
    label: 'Tahun lalu',
    ambil: () => {
      const t = dayjs().subtract(1, 'year')
      return [t.startOf('year'), t.endOf('year')]
    },
  },
]

function pakaiPreset(p: (typeof PRESET)[number]) {
  const [awal, akhir] = p.ambil()
  rentang.value = [awal.toDate(), akhir.toDate()]
}

// Setiap dibuka, mulai dari filter halaman Laporan: tahun yang dipilih (atau tahun ini) dan statusnya.
watch(visible, (buka) => {
  if (!buka) return
  pesanGagal.value = ''
  const awal = dayjs()
    .year(props.tahunAwal ?? dayjs().year())
    .startOf('year')
  rentang.value = [awal.toDate(), awal.endOf('year').toDate()]
  status.value = props.statusAwal
})

/** Periode terpilih sebagai "YYYY-MM-DD". Kosong = semua periode. */
const periode = computed(() => {
  const [awal, akhir] = rentang.value ?? []
  if (!awal) return { dari: null, sampai: null }
  const dari = isoTanggal(awal)
  return { dari, sampai: akhir ? isoTanggal(akhir) : dari }
})

// Aturannya sama dengan backend: event dihitung pada tanggal selesainya.
const isiRekap = computed(() => {
  const { dari, sampai } = periode.value
  return props.laporan.filter((r) => {
    const t = r.tanggalSelesai ?? r.tanggalMulai
    return (
      (!dari || t >= dari) &&
      (!sampai || t <= sampai) &&
      (status.value === 'semua' || (status.value === 'sudah') === (r.laporan !== null))
    )
  })
})
const jumlahSudah = computed(() => isiRekap.value.filter((r) => r.laporan).length)

async function kirim() {
  menyimpan.value = true
  pesanGagal.value = ''
  try {
    await unduhPdfRekap({
      ...periode.value,
      sudahDibuat: status.value === 'semua' ? null : status.value === 'sudah',
    })
    visible.value = false
  } catch (error) {
    pesanGagal.value = pesanError(error, 'Rekap PDF gagal dibuat. Coba lagi.')
  } finally {
    menyimpan.value = false
  }
}
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    judul="Unduh rekap PDF"
    label-simpan="Unduh PDF"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    lebar="32rem"
    @submit="kirim"
  >
    <div class="baris">
      <label for="rekap-periode">Periode</label>
      <DatePicker
        v-model="rentang"
        input-id="rekap-periode"
        selection-mode="range"
        date-format="dd M yy"
        placeholder="Semua periode"
        show-icon
        icon-display="input"
        show-button-bar
        :manual-input="false"
        fluid
      />
      <div class="preset" role="group" aria-label="Pilihan cepat periode">
        <Button
          v-for="p in PRESET"
          :key="p.label"
          :label="p.label"
          size="small"
          text
          @click="pakaiPreset(p)"
        />
        <Button label="Semua periode" size="small" text @click="rentang = null" />
      </div>
      <small class="bantuan">Event dihitung pada tanggal selesainya.</small>
    </div>

    <div class="baris">
      <label id="rekap-status">Status laporan</label>
      <SelectButton
        v-model="status"
        :options="PILIHAN_STATUS"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        size="small"
        aria-labelledby="rekap-status"
      />
    </div>

    <p class="pratinjau" :class="{ 'pratinjau--kosong': !isiRekap.length }">
      <i class="pi" :class="isiRekap.length ? 'pi-file-pdf' : 'pi-info-circle'" />
      <span v-if="isiRekap.length">
        <strong>{{ isiRekap.length }} event</strong> masuk rekap, {{ jumlahSudah }} di antaranya
        sudah punya laporan.
      </span>
      <span v-else
        >Tidak ada event selesai pada periode ini. PDF tetap bisa diunduh, isinya kosong.</span
      >
    </p>
  </FormDialog>
</template>

<style scoped>
.preset {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  margin: 0.15rem 0 0 -0.6rem;
}
.pratinjau {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: var(--ns-radius-sm);
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 0.85rem;
}
.pratinjau i {
  margin-top: 0.15rem;
}
.pratinjau--kosong {
  background: var(--ns-surface-2);
  color: var(--ns-text-2);
}
</style>
