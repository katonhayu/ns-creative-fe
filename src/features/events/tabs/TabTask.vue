<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import SelectButton from 'primevue/selectbutton'
import { pesanError } from '@/api/http'
import {
  createTask,
  deleteTask,
  listTasks,
  updateStatusTask,
  updateTask,
} from '@/features/tasks/task.api'
import type { TaskPayload } from '@/features/tasks/task.schema'
import {
  STATUS_TASK,
  bolehUbahStatus,
  lewatDeadline,
  type StatusTask,
  type TaskRow,
} from '@/features/tasks/task.types'
import TaskForm from '@/features/tasks/TaskForm.vue'
import TaskTable from '@/features/tasks/TaskTable.vue'
import { useAuthStore } from '@/stores/auth'
import type { EventDetail } from '../event.types'
import PanelTab from './PanelTab.vue'

const props = defineProps<{ event: EventDetail }>()

const auth = useAuthStore()
const bisaUbahStatus = (t: TaskRow) => bolehUbahStatus(t, auth.crewId)

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'tasks']),
  queryFn: () => listTasks({ eventId: props.event.id }),
})

// Ringkasan event dan halaman Task lintas event ikut diperbarui.
function segarkan() {
  queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
}

// --- Filter ------------------------------------------------------------------

type Filter = 'semua' | 'lewat' | StatusTask
const filter = ref<Filter>('semua')

const semua = computed(() => daftar.data.value ?? [])
const jumlah = computed(() => {
  const j: Record<Filter, number> = {
    semua: semua.value.length,
    lewat: 0,
    belum: 0,
    dikerjakan: 0,
    selesai: 0,
    terlambat: 0,
  }
  for (const t of semua.value) {
    j[t.status]++
    if (lewatDeadline(t)) j.lewat++
  }
  return j
})

const pilihanFilter = computed(() => [
  { value: 'semua', label: `Semua (${jumlah.value.semua})` },
  ...(['belum', 'dikerjakan', 'selesai', 'terlambat'] as StatusTask[]).map((s) => ({
    value: s,
    label: `${STATUS_TASK[s].label} (${jumlah.value[s]})`,
  })),
  { value: 'lewat', label: `Lewat deadline (${jumlah.value.lewat})` },
])

const tampil = computed(() =>
  semua.value.filter((t) =>
    filter.value === 'semua'
      ? true
      : filter.value === 'lewat'
        ? lewatDeadline(t)
        : t.status === filter.value,
  ),
)

// --- Tambah & edit -----------------------------------------------------------

const formTerbuka = ref(false)
const dipilih = ref<TaskRow | null>(null)

function bukaTambah() {
  dipilih.value = null
  formTerbuka.value = true
}
function bukaEdit(t: TaskRow) {
  dipilih.value = t
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: TaskPayload) =>
    dipilih.value
      ? updateTask(props.event.id, dipilih.value.id, payload)
      : createTask(props.event.id, payload),
  onSuccess: (hasil) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: dipilih.value ? 'Task diperbarui' : 'Task ditambahkan',
      detail: `${hasil.namaTugas} · PIC ${hasil.namaPic}.`,
      life: 3000,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: TaskPayload) {
  await mutasiSimpan.mutateAsync(payload)
}

// --- Ubah status langsung dari tabel -----------------------------------------

const mutasiStatus = useMutation({
  mutationFn: ({ t, status }: { t: TaskRow; status: StatusTask }) =>
    updateStatusTask(props.event.id, t.id, status),
  onSuccess: (hasil) => {
    segarkan()
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

// --- Hapus -------------------------------------------------------------------

const mutasiHapus = useMutation({
  mutationFn: (t: TaskRow) => deleteTask(props.event.id, t.id),
  onSuccess: (_, t) => {
    segarkan()
    toast.add({ severity: 'success', summary: 'Task dihapus', detail: t.namaTugas, life: 3000 })
  },
  onError: (err, t) => {
    toast.add({
      severity: 'error',
      summary: `Gagal menghapus ${t.namaTugas}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(t: TaskRow) {
  confirm.require({
    header: 'Hapus task?',
    message: `"${t.namaTugas}" akan dihapus dari event ini.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Hapus', severity: 'danger' },
    accept: () => mutasiHapus.mutate(t),
  })
}
</script>

<template>
  <PanelTab
    judul="Task"
    deskripsi="Tugas persiapan dan pelaksanaan event beserta penanggung jawabnya."
    label-tambah="Tambah task"
    :tanpa-tambah="!event.bolehKelola"
    ikon-kosong="pi-check-square"
    pesan-kosong="Belum ada task. Pecah persiapan event jadi tugas-tugas kecil dengan PIC dan deadline."
    :is-pending="daftar.isPending.value"
    :is-error="daftar.isError.value"
    :is-fetching="daftar.isFetching.value"
    :error="daftar.error.value"
    :kosong="semua.length === 0"
    @tambah="bukaTambah"
    @muat-ulang="daftar.refetch()"
  >
    <div class="isi">
      <SelectButton
        v-model="filter"
        :options="pilihanFilter"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        size="small"
        aria-label="Filter status task"
        class="filter"
      />

      <TaskTable
        v-if="tampil.length"
        :items="tampil"
        :bisa-kelola="event.bolehKelola"
        :bisa-ubah-status="bisaUbahStatus"
        :id-ubah-status="mutasiStatus.isPending.value ? mutasiStatus.variables.value?.t.id : null"
        :id-dihapus="mutasiHapus.isPending.value ? mutasiHapus.variables.value?.id : null"
        @edit="bukaEdit"
        @hapus="konfirmasiHapus"
        @ubah-status="(t, status) => mutasiStatus.mutate({ t, status })"
      />
      <p v-else class="kosong-filter">Tidak ada task dengan filter ini.</p>
    </div>
  </PanelTab>

  <TaskForm
    v-model:visible="formTerbuka"
    :event-id="event.id"
    :task="dipilih"
    :menyimpan="mutasiSimpan.isPending.value"
    :simpan="simpan"
  />
</template>

<style scoped>
.isi {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.filter {
  flex-wrap: wrap;
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
</style>
