<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { RouterLink } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import StatusBadge from '@/components/StatusBadge.vue'
import { pesanError } from '@/api/http'
import { rentangTanggal, rupiah, tanggal } from '@/utils/format'
import { listLaporan } from './report.api'
import type { LaporanRow } from './report.types'

const daftar = useQuery({ queryKey: ['reports'], queryFn: listLaporan })
const semua = computed(() => daftar.data.value ?? [])

// --- Filter ------------------------------------------------------------------

type FilterStatus = 'semua' | 'sudah' | 'belum'
const filterStatus = ref<FilterStatus>('semua')
const filterTahun = ref<number | null>(null)
const kataKunci = ref('')

const jumlahBelum = computed(() => semua.value.filter((r) => !r.laporan).length)
const PILIHAN_STATUS = computed(() => [
  { value: 'semua', label: `Semua (${semua.value.length})` },
  { value: 'sudah', label: `Sudah dibuat (${semua.value.length - jumlahBelum.value})` },
  { value: 'belum', label: `Belum dibuat (${jumlahBelum.value})` },
])
const pilihanTahun = computed(() =>
  [...new Set(semua.value.map((r) => dayjs(r.tanggalSelesai ?? r.tanggalMulai).year()))].sort(
    (a, b) => b - a,
  ),
)

const tampil = computed(() => {
  const q = kataKunci.value.trim().toLowerCase()
  return semua.value.filter(
    (r) =>
      (filterStatus.value === 'semua' ||
        (filterStatus.value === 'sudah' ? r.laporan !== null : r.laporan === null)) &&
      (!filterTahun.value ||
        dayjs(r.tanggalSelesai ?? r.tanggalMulai).year() === filterTahun.value) &&
      (!q || [r.namaEvent, r.namaClient].some((v) => v.toLowerCase().includes(q))),
  )
})

const totalPengeluaran = computed(() =>
  tampil.value.reduce((s, r) => s + (r.laporan?.totalPengeluaran ?? 0), 0),
)

const ruteLaporan = (r: LaporanRow) => ({
  name: 'event-detail',
  params: { id: r.eventId },
  query: { tab: 'laporan' },
})
</script>

<template>
  <section class="kartu">
    <div class="kepala">
      <div>
        <h1>Laporan &amp; Dokumentasi</h1>
        <p>Hasil pelaksanaan dan evaluasi setiap event yang sudah selesai.</p>
      </div>
      <span v-if="jumlahBelum" class="peringatan">
        <i class="pi pi-exclamation-circle" /> {{ jumlahBelum }} event selesai belum punya laporan
      </span>
    </div>

    <div class="toolbar">
      <SelectButton
        v-model="filterStatus"
        :options="PILIHAN_STATUS"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        size="small"
        aria-label="Filter status laporan"
      />
      <Select
        v-model="filterTahun"
        :options="pilihanTahun"
        placeholder="Semua tahun"
        show-clear
        aria-label="Filter tahun"
        class="filter-tahun"
      />
      <IconField class="cari">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="kataKunci"
          placeholder="Cari event atau client…"
          aria-label="Cari laporan"
          fluid
        />
      </IconField>
    </div>

    <Message v-if="daftar.isError.value" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Daftar laporan tidak dapat dimuat. {{ pesanError(daftar.error.value) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="daftar.isFetching.value"
          @click="daftar.refetch()"
        />
      </div>
    </Message>

    <div v-else-if="daftar.isPending.value" class="kosong">
      <i class="pi pi-spin pi-spinner" />
      <p>Memuat laporan…</p>
    </div>

    <div v-else-if="!semua.length" class="kosong">
      <span class="kosong__ikon"><i class="pi pi-file" /></span>
      <p>Belum ada event yang selesai. Laporan bisa dibuat setelah status event Selesai.</p>
    </div>

    <div v-else-if="!tampil.length" class="kosong">
      <span class="kosong__ikon"><i class="pi pi-search" /></span>
      <p>Tidak ada laporan yang cocok dengan filter.</p>
    </div>

    <template v-else>
      <DataTable
        :value="tampil"
        data-key="eventId"
        scrollable
        row-hover
        paginator
        :rows="10"
        :rows-per-page-options="[10, 20, 50]"
        paginator-template="CurrentPageReport RowsPerPageDropdown PrevPageLink PageLinks NextPageLink"
        current-page-report-template="Menampilkan {first}–{last} dari {totalRecords} data"
        class="ns-tabel tabel"
      >
        <Column header="Event" style="min-width: 16rem">
          <template #body="{ data: r }">
            <div class="event">
              <span class="event__nama">{{ r.namaEvent }}</span>
              <small
                >{{ r.namaClient }} · {{ rentangTanggal(r.tanggalMulai, r.tanggalSelesai) }}</small
              >
            </div>
          </template>
        </Column>
        <Column header="Laporan" style="min-width: 9rem">
          <template #body="{ data: r }">
            <div v-if="r.laporan" class="status">
              <StatusBadge :status="{ label: 'Sudah dibuat', warna: 'hijau' }" />
              <small>{{ tanggal(r.laporan.tanggalDibuat) }}</small>
            </div>
            <StatusBadge v-else :status="{ label: 'Belum dibuat', warna: 'kuning' }" />
          </template>
        </Column>
        <Column header="Hasil Pelaksanaan" style="min-width: 16rem; max-width: 22rem">
          <template #body="{ data: r }">
            <span v-if="r.laporan" class="sel-terpotong" :title="r.laporan.hasilPelaksanaan">
              {{ r.laporan.hasilPelaksanaan }}
            </span>
            <span v-else class="sel-redup">—</span>
          </template>
        </Column>
        <Column header="Total Pengeluaran" style="min-width: 10rem" class="kanan">
          <template #body="{ data: r }">
            <span v-if="r.laporan" class="angka">{{ rupiah(r.laporan.totalPengeluaran) }}</span>
            <span v-else class="sel-redup">—</span>
          </template>
        </Column>
        <Column header="Kendala" style="min-width: 12rem; max-width: 18rem">
          <template #body="{ data: r }">
            <span v-if="r.laporan?.kendala" class="sel-terpotong" :title="r.laporan.kendala">
              {{ r.laporan.kendala }}
            </span>
            <span v-else class="sel-redup">—</span>
          </template>
        </Column>
        <Column header="Dokumentasi" style="min-width: 8rem">
          <template #body="{ data: r }">
            <span v-if="r.jumlahDokumen">
              <i class="pi pi-paperclip" /> {{ r.jumlahDokumen }} dokumen
            </span>
            <span v-else class="sel-redup">Belum ada</span>
          </template>
        </Column>
        <Column header="Aksi" frozen align-frozen="right" style="width: 7rem">
          <template #body="{ data: r }">
            <Button
              v-if="r.laporan"
              :as="RouterLink"
              :to="ruteLaporan(r)"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat laporan ${r.namaEvent}`"
              title="Lihat laporan"
            />
            <Button
              v-else
              :as="RouterLink"
              :to="ruteLaporan(r)"
              label="Buat"
              icon="pi pi-plus"
              size="small"
              outlined
              :aria-label="`Buat laporan ${r.namaEvent}`"
            />
          </template>
        </Column>
      </DataTable>

      <p class="total">
        Total pengeluaran {{ tampil.length }} event:
        <strong class="angka">{{ rupiah(totalPengeluaran) }}</strong>
        <span class="sel-redup">(hanya event yang laporannya sudah dibuat)</span>
      </p>
    </template>
  </section>
</template>

<style scoped>
.kartu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.35rem 1.5rem 1.1rem;
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius);
  box-shadow: var(--ns-shadow-sm);
}
.kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}
.kepala h1 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}
.kepala p {
  margin: 0.2rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.83rem;
}
.peringatan {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  background: var(--ns-warn-soft);
  color: var(--ns-warn);
  font-size: 0.8rem;
  font-weight: 600;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.filter-tahun {
  width: 10rem;
}
.cari {
  flex: 1 1 220px;
  max-width: 320px;
  margin-left: auto;
}
.galat-muat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}
.kosong {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--ns-text-2);
}
.kosong > i {
  color: var(--ns-text-3);
}
.kosong__ikon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
}
.kosong p {
  margin: 0;
  font-size: 0.875rem;
}
.event,
.status {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.event__nama {
  color: var(--ns-text);
  font-weight: 600;
}
.event small,
.status small {
  color: var(--ns-text-3);
  font-size: 0.76rem;
}
.status {
  align-items: flex-start;
  gap: 0.2rem;
}
.tabel :deep(.kanan) {
  text-align: right;
}
.tabel :deep(th.kanan .p-datatable-column-header-content) {
  justify-content: flex-end;
}
.tabel :deep(.p-paginator) {
  justify-content: flex-end;
  padding: 0.85rem 0 0.25rem;
  background: transparent;
}
.tabel :deep(.p-paginator-current) {
  margin-right: auto;
  padding: 0;
  color: var(--ns-text-3);
  font-size: 0.8rem;
}
.total {
  margin: 0;
  color: var(--ns-text-2);
  font-size: 0.85rem;
}
.total strong {
  color: var(--ns-text);
}

@media (max-width: 640px) {
  .kartu {
    padding: 1rem;
  }
  .filter-tahun,
  .cari {
    width: 100%;
    max-width: none;
    margin-left: 0;
  }
}
</style>
