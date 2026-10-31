<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import { pesanError } from '@/api/http'
import { pilihanDari } from '@/features/events/penugasan.types'
import { useAuthStore } from '@/stores/auth'
import { listTasks, updateStatusTask } from './task.api'
import {
  STATUS_TASK,
  bolehUbahStatus,
  lewatDeadline,
  type StatusTask,
  type TaskRow,
} from './task.types'
import TaskTable from './TaskTable.vue'

const auth = useAuthStore()
const toast = useToast()
const queryClient = useQueryClient()

/**
 * "Task saya" = task yang PIC-nya crew milik pengguna, jadi hanya berarti bagi akun yang
 * ditautkan ke data crew. Untuk mereka saklar ini menyala sejak awal.
 */
const hanyaMilikSaya = ref(auth.crewId !== null)
const kataKunci = ref('')
type Filter = StatusTask | 'lewat' | 'aktif'
const filterStatus = ref<Filter | null>('aktif')

const PILIHAN_FILTER = [
  { value: 'aktif', label: 'Belum selesai' },
  { value: 'lewat', label: 'Lewat deadline' },
  ...pilihanDari(STATUS_TASK),
]

const daftar = useQuery({
  queryKey: computed(() => ['tasks', { milikSaya: hanyaMilikSaya.value }]),
  queryFn: () => listTasks({ milikSaya: hanyaMilikSaya.value }),
})

const tampil = computed(() => {
  const q = kataKunci.value.trim().toLowerCase()
  return (daftar.data.value ?? []).filter((t) => {
    const f = filterStatus.value
    const cocokStatus =
      !f ||
      (f === 'aktif' ? t.status !== 'selesai' : f === 'lewat' ? lewatDeadline(t) : t.status === f)
    const cocokCari =
      !q || [t.namaTugas, t.namaEvent, t.namaPic].some((v) => v?.toLowerCase().includes(q))
    return cocokStatus && cocokCari
  })
})

const jumlahLewat = computed(() => (daftar.data.value ?? []).filter((t) => lewatDeadline(t)).length)

const bisaUbahStatus = (t: TaskRow) => bolehUbahStatus(t, auth.crewId)

const mutasiStatus = useMutation({
  mutationFn: ({ t, status }: { t: TaskRow; status: StatusTask }) =>
    updateStatusTask(t.eventId, t.id, status),
  onSuccess: (hasil) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['events', hasil.eventId] })
    toast.add({
      severity: 'success',
      summary: 'Status diperbarui',
      detail: `${hasil.namaTugas}: ${STATUS_TASK[hasil.status].label}.`,
      life: 2500,
    })
  },
  onError: (err, { t }) => {
    toast.add({
      severity: 'error',
      summary: `Status ${t.namaTugas} gagal diubah`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})
</script>

<template>
  <section class="kartu">
    <div class="kepala">
      <div>
        <h1>{{ hanyaMilikSaya ? 'Task Saya' : 'Data Task' }}</h1>
        <p>
          {{
            hanyaMilikSaya
              ? 'Tugas yang ditugaskan kepadamu di semua event. Ubah statusnya begitu ada progres.'
              : 'Tugas dari semua event yang bisa kamu akses. Tambah dan edit task dari halaman detail event.'
          }}
        </p>
      </div>
      <span v-if="jumlahLewat" class="peringatan">
        <i class="pi pi-exclamation-circle" /> {{ jumlahLewat }} task lewat deadline
      </span>
    </div>

    <div class="toolbar">
      <IconField class="cari">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="kataKunci"
          placeholder="Cari nama tugas, event, atau PIC…"
          aria-label="Cari task"
          fluid
        />
      </IconField>
      <Select
        v-model="filterStatus"
        :options="PILIHAN_FILTER"
        option-label="label"
        option-value="value"
        placeholder="Semua status"
        show-clear
        aria-label="Filter status"
        class="filter-status"
      />
      <label v-if="auth.crewId" class="saklar">
        <ToggleSwitch v-model="hanyaMilikSaya" />
        <span>Hanya tugas saya</span>
      </label>
    </div>

    <Message v-if="daftar.isError.value" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Daftar task tidak dapat dimuat. {{ pesanError(daftar.error.value) }}</span>
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
      <p>Memuat task…</p>
    </div>

    <div v-else-if="!tampil.length" class="kosong">
      <span class="kosong__ikon"><i class="pi pi-check-square" /></span>
      <p v-if="(daftar.data.value ?? []).length === 0">
        {{
          hanyaMilikSaya
            ? 'Belum ada task yang ditugaskan kepadamu.'
            : 'Belum ada task di event yang bisa kamu akses.'
        }}
      </p>
      <p v-else>Tidak ada task yang cocok dengan filter.</p>
    </div>

    <template v-else>
      <TaskTable
        :items="tampil"
        tampilkan-event
        :bisa-ubah-status="bisaUbahStatus"
        :id-ubah-status="mutasiStatus.isPending.value ? mutasiStatus.variables.value?.t.id : null"
        @ubah-status="(t, status) => mutasiStatus.mutate({ t, status })"
      />
      <p class="jumlah">
        Menampilkan {{ tampil.length }} dari {{ daftar.data.value?.length }} task
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
  background: var(--ns-danger-soft);
  color: var(--ns-danger);
  font-size: 0.8rem;
  font-weight: 600;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.cari {
  flex: 1 1 260px;
  max-width: 360px;
}
.filter-status {
  width: 12rem;
}
.saklar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  color: var(--ns-text-2);
  font-size: 0.85rem;
  cursor: pointer;
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
.jumlah {
  margin: 0;
  color: var(--ns-text-3);
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .kartu {
    padding: 1rem;
  }
  .cari,
  .filter-status {
    max-width: none;
    width: 100%;
  }
  .saklar {
    margin-left: 0;
  }
}
</style>
