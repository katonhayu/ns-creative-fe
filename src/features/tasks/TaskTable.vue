<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import StatusBadge from '@/components/StatusBadge.vue'
import { tanggal } from '@/utils/format'
import {
  PILIHAN_STATUS_TASK,
  STATUS_TASK,
  lewatDeadline,
  sisaHari,
  type StatusTask,
  type TaskRow,
} from './task.types'

/**
 * Tabel task. Dipakai di tab Task (satu event) dan halaman Task (lintas event).
 * Status bisa diubah langsung dari tabel oleh pengguna yang berhak.
 */
const props = withDefaults(
  defineProps<{
    items: TaskRow[]
    /** Tampilkan kolom event (untuk daftar lintas event). */
    tampilkanEvent?: boolean
    /**
     * Tombol lihat (ikon mata) ke tab Task di detail event. Hanya berlaku jika
     * kolom event tampil. Crew tidak punya akses ke detail event.
     */
    tautanEvent?: boolean
    /** Tampilkan tombol edit dan hapus. */
    bisaKelola?: boolean
    bisaUbahStatus: (t: TaskRow) => boolean
    /** id task yang statusnya sedang disimpan. */
    idUbahStatus?: string | null
    idDihapus?: string | null
  }>(),
  {
    tampilkanEvent: false,
    tautanEvent: true,
    bisaKelola: false,
    idUbahStatus: null,
    idDihapus: null,
  },
)
const emit = defineEmits<{
  edit: [t: TaskRow]
  hapus: [t: TaskRow]
  ubahStatus: [t: TaskRow, status: StatusTask]
}>()

const PILIHAN_STATUS = PILIHAN_STATUS_TASK

/** Tombol lihat hanya di daftar lintas event, dan hanya bagi yang bisa membuka detail event. */
const adaTombolLihat = computed(() => props.tampilkanEvent && props.tautanEvent)

function penandaDeadline(t: TaskRow) {
  if (t.status === 'selesai' || !t.deadline) return null
  const sisa = sisaHari(t.deadline)
  if (lewatDeadline(t)) return { teks: `Lewat ${-sisa} hari`, kelas: 'lewat' }
  if (sisa === 0) return { teks: 'Hari ini', kelas: 'dekat' }
  if (sisa <= 3) return { teks: `${sisa} hari lagi`, kelas: 'dekat' }
  return null
}

const kelasBaris = (t: TaskRow) => (lewatDeadline(t) ? 'baris-lewat' : undefined)
</script>

<template>
  <DataTable
    :value="items"
    data-key="id"
    scrollable
    row-hover
    :row-class="kelasBaris"
    class="ns-tabel tabel-task"
  >
    <Column header="Tugas" style="min-width: 16rem">
      <template #body="{ data: t }">
        <div class="tugas" :class="{ selesai: t.status === 'selesai' }">
          <span class="tugas__nama">{{ t.namaTugas }}</span>
          <small v-if="t.deskripsi" class="tugas__deskripsi">{{ t.deskripsi }}</small>
        </div>
      </template>
    </Column>

    <Column v-if="tampilkanEvent" header="Event" style="min-width: 13rem">
      <template #body="{ data: t }">
        {{ t.namaEvent }}
      </template>
    </Column>

    <Column header="PIC" style="min-width: 9rem">
      <template #body="{ data: t }">{{ t.namaPic }}</template>
    </Column>

    <Column header="Deadline" style="min-width: 9rem">
      <template #body="{ data: t }">
        <div class="deadline">
          <span class="angka">{{ tanggal(t.deadline) }}</span>
          <small v-if="penandaDeadline(t)" :class="penandaDeadline(t)?.kelas">
            <i v-if="penandaDeadline(t)?.kelas === 'lewat'" class="pi pi-exclamation-circle" />
            {{ penandaDeadline(t)?.teks }}
          </small>
        </div>
      </template>
    </Column>

    <Column header="Status" style="min-width: 10rem">
      <template #body="{ data: t }">
        <Select
          v-if="bisaUbahStatus(t)"
          :model-value="t.status"
          :options="PILIHAN_STATUS"
          option-label="label"
          option-value="value"
          :loading="idUbahStatus === t.id"
          :disabled="idUbahStatus === t.id"
          :aria-label="`Status ${t.namaTugas}`"
          size="small"
          class="pilih-status"
          @update:model-value="(s: StatusTask) => s !== t.status && emit('ubahStatus', t, s)"
        >
          <template #value="{ value }">
            <StatusBadge v-if="value" :status="STATUS_TASK[value as StatusTask]" />
          </template>
          <template #option="{ option }">
            <StatusBadge :status="STATUS_TASK[option.value as StatusTask]" />
          </template>
        </Select>
        <StatusBadge v-else :status="STATUS_TASK[t.status as StatusTask]" />
      </template>
    </Column>

    <Column header="Catatan" style="min-width: 12rem; max-width: 18rem">
      <template #body="{ data: t }">
        <span v-if="t.catatan" class="sel-terpotong" :title="t.catatan">{{ t.catatan }}</span>
        <span v-else class="sel-redup">—</span>
      </template>
    </Column>

    <Column
      v-if="bisaKelola || adaTombolLihat"
      header="Aksi"
      frozen
      align-frozen="right"
      :style="{ width: `${1.5 + ((bisaKelola ? 2 : 0) + (adaTombolLihat ? 1 : 0)) * 2.1}rem` }"
    >
      <template #body="{ data: t }">
        <div class="aksi">
          <Button
            v-if="adaTombolLihat"
            :as="RouterLink"
            :to="{ name: 'event-detail', params: { id: t.eventId }, query: { tab: 'task' } }"
            icon="pi pi-eye"
            text
            rounded
            severity="secondary"
            size="small"
            :aria-label="`Lihat ${t.namaTugas} di event ${t.namaEvent}`"
            title="Lihat di detail event"
          />
          <template v-if="bisaKelola">
            <Button
              icon="pi pi-pen-to-square"
              text
              rounded
              size="small"
              :aria-label="`Edit ${t.namaTugas}`"
              title="Edit"
              @click="emit('edit', t)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              :aria-label="`Hapus ${t.namaTugas}`"
              title="Hapus"
              :loading="idDihapus === t.id"
              @click="emit('hapus', t)"
            />
          </template>
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.tugas {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  line-height: 1.35;
}
.tugas__nama {
  color: var(--ns-text);
  font-weight: 600;
}
.tugas__deskripsi {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}
.tugas.selesai .tugas__nama {
  color: var(--ns-text-3);
  text-decoration: line-through;
}

.deadline {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.deadline small {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.deadline small i {
  font-size: 0.72rem;
}
.lewat {
  color: var(--ns-danger);
}
.dekat {
  color: var(--ns-warn);
}

.tabel-task :deep(.baris-lewat > td:first-child) {
  box-shadow: inset 3px 0 0 var(--ns-danger);
}

.pilih-status {
  min-width: 9rem;
}
.pilih-status :deep(.p-select-label) {
  padding-block: 0.3rem;
}

.aksi {
  display: flex;
  gap: 0.1rem;
}
</style>
