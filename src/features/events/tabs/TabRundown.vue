<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { pesanError } from '@/api/http'
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from '@/features/schedules/schedule.api'
import type { SchedulePayload } from '@/features/schedules/schedule.schema'
import type { ScheduleRow } from '@/features/schedules/schedule.types'
import RundownList from '@/features/schedules/RundownList.vue'
import ScheduleForm from '@/features/schedules/ScheduleForm.vue'
import { jam, tanggal } from '@/utils/format'
import type { EventDetail } from '../event.types'
import PanelTab from './PanelTab.vue'

const props = defineProps<{ event: EventDetail }>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'schedules']),
  queryFn: () => listSchedules({ eventId: props.event.id }),
})

const semua = computed(() => daftar.data.value ?? [])
const jumlahHari = computed(() => new Set(semua.value.map((s) => s.tanggal)).size)

function segarkan() {
  queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })
  queryClient.invalidateQueries({ queryKey: ['schedules'] })
}

// --- Tambah & edit -----------------------------------------------------------

const formTerbuka = ref(false)
const dipilih = ref<ScheduleRow | null>(null)
/** Sesi baru langsung memakai tanggal sesi yang terakhir disimpan. */
const tanggalTerakhir = ref<string | null>(null)

function bukaTambah() {
  dipilih.value = null
  formTerbuka.value = true
}
function bukaEdit(s: ScheduleRow) {
  dipilih.value = s
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: SchedulePayload) =>
    dipilih.value
      ? updateSchedule(props.event.id, dipilih.value.id, payload)
      : createSchedule(props.event.id, payload),
  onSuccess: (hasil) => {
    tanggalTerakhir.value = hasil.tanggal
    segarkan()
    toast.add({
      severity: 'success',
      summary: dipilih.value ? 'Sesi diperbarui' : 'Sesi ditambahkan',
      detail: `${hasil.kegiatan} · ${tanggal(hasil.tanggal)}, ${jam(hasil.waktuMulai)}–${jam(hasil.waktuSelesai)}`,
      life: 3000,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: SchedulePayload) {
  await mutasiSimpan.mutateAsync(payload)
}

// --- Hapus -------------------------------------------------------------------

const mutasiHapus = useMutation({
  mutationFn: (s: ScheduleRow) => deleteSchedule(props.event.id, s.id),
  onSuccess: (_, s) => {
    segarkan()
    toast.add({ severity: 'success', summary: 'Sesi dihapus', detail: s.kegiatan, life: 3000 })
  },
  onError: (err, s) => {
    toast.add({
      severity: 'error',
      summary: `Gagal menghapus ${s.kegiatan}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(s: ScheduleRow) {
  confirm.require({
    header: 'Hapus sesi rundown?',
    message: `"${s.kegiatan}" (${tanggal(s.tanggal)}, ${jam(s.waktuMulai)}–${jam(s.waktuSelesai)}) akan dihapus dari rundown.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Hapus', severity: 'danger' },
    accept: () => mutasiHapus.mutate(s),
  })
}
</script>

<template>
  <PanelTab
    judul="Rundown"
    deskripsi="Susunan acara per tanggal, diurutkan menurut jam."
    label-tambah="Tambah sesi"
    ikon-kosong="pi-clock"
    pesan-kosong="Rundown masih kosong. Tambahkan sesi pertama, misalnya registrasi atau loading barang."
    :is-pending="daftar.isPending.value"
    :is-error="daftar.isError.value"
    :is-fetching="daftar.isFetching.value"
    :error="daftar.error.value"
    :kosong="semua.length === 0"
    @tambah="bukaTambah"
    @muat-ulang="daftar.refetch()"
  >
    <template #ringkasan>
      <span class="total">
        <strong class="angka">{{ semua.length }}</strong> sesi dalam
        <strong class="angka">{{ jumlahHari }}</strong> hari
      </span>
    </template>

    <RundownList
      :items="semua"
      bisa-kelola
      :tanggal-mulai-event="event.tanggalMulai"
      :id-dihapus="mutasiHapus.isPending.value ? mutasiHapus.variables.value?.id : null"
      @edit="bukaEdit"
      @hapus="konfirmasiHapus"
    />
  </PanelTab>

  <ScheduleForm
    v-model:visible="formTerbuka"
    :event="event"
    :sesi="dipilih"
    :tanggal-awal="tanggalTerakhir"
    :menyimpan="mutasiSimpan.isPending.value"
    :simpan="simpan"
  />
</template>

<style scoped>
.total {
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.total strong {
  color: var(--ns-text);
}
</style>
