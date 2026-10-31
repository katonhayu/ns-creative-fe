<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import { pesanError } from '@/api/http'
import { inisial, tanggal } from '@/utils/format'
import type { EventDetail } from '../event.types'
import { createEventCrew, deleteEventCrew, listEventCrews, updateEventCrew } from '../penugasan.api'
import type { EventCrewPayload } from '../penugasan.schema'
import type { EventCrew } from '../penugasan.types'
import EventCrewForm from './EventCrewForm.vue'
import PanelTab from './PanelTab.vue'

const props = defineProps<{ event: EventDetail }>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'crews']),
  queryFn: () => listEventCrews(props.event.id),
})

const jumlahOrang = computed(() => new Set((daftar.data.value ?? []).map((c) => c.crewId)).size)

const segarkan = () => queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })

const formTerbuka = ref(false)
const dipilih = ref<EventCrew | null>(null)

function bukaTambah() {
  dipilih.value = null
  formTerbuka.value = true
}
function bukaEdit(c: EventCrew) {
  dipilih.value = c
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: EventCrewPayload) =>
    dipilih.value
      ? updateEventCrew(props.event.id, dipilih.value.id, payload)
      : createEventCrew(props.event.id, payload),
  onSuccess: (hasil) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: dipilih.value ? 'Penugasan diperbarui' : 'Crew ditambahkan',
      detail: `${hasil.namaCrew} bertugas sebagai ${hasil.posisi} pada ${tanggal(hasil.tanggalBertugas)}.`,
      life: 3500,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: EventCrewPayload) {
  await mutasiSimpan.mutateAsync(payload)
}

const mutasiHapus = useMutation({
  mutationFn: (c: EventCrew) => deleteEventCrew(props.event.id, c.id),
  onSuccess: (_, c) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: 'Crew dilepas',
      detail: `${c.namaCrew} tidak lagi bertugas pada ${tanggal(c.tanggalBertugas)}.`,
      life: 3000,
    })
  },
  onError: (err, c) => {
    toast.add({
      severity: 'error',
      summary: `Gagal melepas ${c.namaCrew}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(c: EventCrew) {
  confirm.require({
    header: 'Lepas crew dari event?',
    message: `${c.namaCrew} (${c.posisi}) tidak lagi bertugas pada ${tanggal(c.tanggalBertugas)}.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Lepas crew', severity: 'danger' },
    accept: () => mutasiHapus.mutate(c),
  })
}
</script>

<template>
  <PanelTab
    judul="Crew"
    deskripsi="Tim lapangan yang bertugas, per tanggal dan posisi."
    label-tambah="Tambah crew"
    :tanpa-tambah="!event.bolehKelola"
    ikon-kosong="pi-users"
    pesan-kosong="Belum ada crew di event ini. Pilih dari master data crew."
    :is-pending="daftar.isPending.value"
    :is-error="daftar.isError.value"
    :is-fetching="daftar.isFetching.value"
    :error="daftar.error.value"
    :kosong="(daftar.data.value ?? []).length === 0"
    @tambah="bukaTambah"
    @muat-ulang="daftar.refetch()"
  >
    <template #ringkasan>
      <span class="total">
        <strong class="angka">{{ jumlahOrang }}</strong> orang ·
        <strong class="angka">{{ daftar.data.value?.length ?? 0 }}</strong> jadwal tugas
      </span>
    </template>

    <DataTable :value="daftar.data.value" data-key="id" scrollable row-hover class="ns-tabel">
      <Column header="Nama Crew" style="min-width: 13rem">
        <template #body="{ data: c }">
          <div class="sel-orang">
            <span class="sel-orang__avatar" aria-hidden="true">{{ inisial(c.namaCrew) }}</span>
            <span class="sel-orang__nama">{{ c.namaCrew }}</span>
          </div>
        </template>
      </Column>
      <Column header="Posisi" style="min-width: 9rem">
        <template #body="{ data: c }">{{ c.posisi }}</template>
      </Column>
      <Column header="Keahlian" style="min-width: 9rem">
        <template #body="{ data: c }">
          <span class="sel-lencana">{{ c.keahlian }}</span>
        </template>
      </Column>
      <Column header="Tanggal Bertugas" style="min-width: 9rem">
        <template #body="{ data: c }">
          <span class="angka">{{ tanggal(c.tanggalBertugas) }}</span>
        </template>
      </Column>
      <Column
        v-if="event.bolehKelola"
        header="Aksi"
        frozen
        align-frozen="right"
        style="width: 5.5rem"
      >
        <template #body="{ data: c }">
          <div class="aksi">
            <Button
              icon="pi pi-pen-to-square"
              text
              rounded
              size="small"
              :aria-label="`Edit ${c.namaCrew}`"
              title="Edit"
              @click="bukaEdit(c)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              :aria-label="`Lepas ${c.namaCrew}`"
              title="Lepas dari event"
              :loading="mutasiHapus.isPending.value && mutasiHapus.variables.value?.id === c.id"
              @click="konfirmasiHapus(c)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </PanelTab>

  <EventCrewForm
    v-model:visible="formTerbuka"
    :event="event"
    :penugasan="dipilih"
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
.aksi {
  display: flex;
  gap: 0.1rem;
}
</style>
