<script setup lang="ts">
import { computed, ref } from 'vue'
import Column from 'primevue/column'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import CrudTable from '@/components/CrudTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCrud } from '@/composables/useCrud'
import { useAuthStore } from '@/stores/auth'
import { isoTanggal, rentangTanggal } from '@/utils/format'
import { eventApi } from './event.api'
import {
  PILIHAN_STATUS_EVENT,
  STATUS_BOLEH_HAPUS,
  STATUS_EVENT,
  type EventFilter,
  type EventRow,
  type StatusEvent,
} from './event.types'
import EventForm from './EventForm.vue'

const auth = useAuthStore()

const filterStatus = ref<StatusEvent | null>(null)
/** [mulai, selesai]. Selama baru satu tanggal yang dipilih, dianggap rentang satu hari. */
const filterRentang = ref<(Date | null)[] | null>(null)

const filter = computed<EventFilter>(() => {
  const [dari, sampai] = filterRentang.value ?? []
  return {
    status: filterStatus.value,
    dari: dari ? isoTanggal(dari) : null,
    sampai: sampai ? isoTanggal(sampai) : dari ? isoTanggal(dari) : null,
  }
})

const crud = useCrud({
  key: 'events',
  api: eventApi,
  label: 'event',
  namaItem: (e) => e.nama,
  sortFields: ['tanggalMulai', 'nama', 'status'],
  urutanAwal: 'desc',
  filter: () => filter.value,
  pesanHapus: (e) =>
    `${e.nama} beserta semua penugasan, budget, dan task-nya akan dihapus permanen.`,
})

function alasanTidakBisaHapus(e: EventRow) {
  return STATUS_BOLEH_HAPUS.includes(e.status)
    ? null
    : 'Hanya event berstatus Draft atau Dibatalkan yang bisa dihapus.'
}
</script>

<template>
  <div class="halaman">
    <CrudTable
      :crud="crud"
      judul="Data Event"
      placeholder-cari="Cari nama event, jenis, lokasi, atau client…"
      ikon-kosong="pi-calendar"
      pesan-kosong="Belum ada event. Buat event pertama dari client yang sudah terdaftar."
      :alasan-tidak-bisa-hapus="alasanTidakBisaHapus"
      :rute-detail="(e) => ({ name: 'event-detail', params: { id: e.id } })"
      :tanpa-tambah="!auth.bolehBuatEvent"
      :tanpa-hapus="!auth.isAdmin"
      :bisa-ubah="(e) => e.bolehKelola"
    >
      <template #filter>
        <Select
          v-model="filterStatus"
          :options="PILIHAN_STATUS_EVENT"
          option-label="label"
          option-value="value"
          placeholder="Semua status"
          show-clear
          aria-label="Filter status"
          class="filter-status"
        />
        <DatePicker
          v-model="filterRentang"
          selection-mode="range"
          date-format="dd M yy"
          placeholder="Rentang tanggal"
          show-icon
          icon-display="input"
          show-button-bar
          :manual-input="false"
          aria-label="Filter rentang tanggal"
          class="filter-tanggal"
        />
      </template>

      <Column field="nama" header="Nama Event" sortable style="min-width: 16rem">
        <template #body="{ data: e }">
          <span class="nama-event">{{ e.nama }}</span>
        </template>
      </Column>

      <Column field="jenis" header="Jenis Event" style="min-width: 9rem">
        <template #body="{ data: e }">{{ e.jenis }}</template>
      </Column>

      <Column field="tanggalMulai" header="Tanggal" sortable style="min-width: 10rem">
        <template #body="{ data: e }">
          <span class="angka">{{ rentangTanggal(e.tanggalMulai, e.tanggalSelesai) }}</span>
        </template>
      </Column>

      <Column field="lokasi" header="Lokasi" style="min-width: 12rem; max-width: 16rem">
        <template #body="{ data: e }">
          <span class="sel-terpotong" :title="e.lokasi">{{ e.lokasi }}</span>
        </template>
      </Column>

      <Column field="namaClient" header="Client" style="min-width: 11rem">
        <template #body="{ data: e }">
          <div class="client">
            <span>{{ e.namaClient }}</span>
            <small v-if="e.perusahaanClient">{{ e.perusahaanClient }}</small>
          </div>
        </template>
      </Column>

      <Column field="status" header="Status" sortable style="min-width: 8rem">
        <template #body="{ data: e }">
          <StatusBadge :status="STATUS_EVENT[e.status as StatusEvent]" />
        </template>
      </Column>

      <Column field="namaPic" header="PIC" style="min-width: 8rem">
        <template #body="{ data: e }">{{ e.namaPic }}</template>
      </Column>
    </CrudTable>

    <EventForm
      v-model:visible="crud.formTerbuka"
      :event="crud.itemDipilih"
      :menyimpan="crud.sedangMenyimpan"
      :simpan="crud.simpan"
    />
  </div>
</template>

<style scoped>
.halaman {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.filter-status {
  width: 11rem;
}
.filter-tanggal {
  width: 15rem;
}
.nama-event {
  color: var(--ns-text);
  font-weight: 600;
}
.client {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.client small {
  color: var(--ns-text-3);
  font-size: 0.76rem;
}

@media (max-width: 640px) {
  .filter-status,
  .filter-tanggal {
    width: 100%;
  }
}
</style>
