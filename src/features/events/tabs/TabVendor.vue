<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import StatusBadge from '@/components/StatusBadge.vue'
import { pesanError } from '@/api/http'
import { rupiah } from '@/utils/format'
import type { EventDetail } from '../event.types'
import {
  createEventVendor,
  deleteEventVendor,
  listEventVendors,
  updateEventVendor,
} from '../penugasan.api'
import type { EventVendorPayload } from '../penugasan.schema'
import { STATUS_PEMBAYARAN, type EventVendor, type StatusPembayaran } from '../penugasan.types'
import EventVendorForm from './EventVendorForm.vue'
import PanelTab from './PanelTab.vue'

const props = defineProps<{ event: EventDetail }>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'vendors']),
  queryFn: () => listEventVendors(props.event.id),
})

const totalBiaya = computed(() => (daftar.data.value ?? []).reduce((s, v) => s + v.biaya, 0))
const belumLunas = computed(
  () => (daftar.data.value ?? []).filter((v) => v.statusPembayaran !== 'lunas').length,
)

const segarkan = () => queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })

const formTerbuka = ref(false)
const dipilih = ref<EventVendor | null>(null)

function bukaTambah() {
  dipilih.value = null
  formTerbuka.value = true
}
function bukaEdit(v: EventVendor) {
  dipilih.value = v
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: EventVendorPayload) =>
    dipilih.value
      ? updateEventVendor(props.event.id, dipilih.value.id, payload)
      : createEventVendor(props.event.id, payload),
  onSuccess: (hasil) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: dipilih.value ? 'Penugasan diperbarui' : 'Vendor ditambahkan',
      detail: `${hasil.namaVendor} · ${rupiah(hasil.biaya)} tercatat di budget.`,
      life: 3500,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: EventVendorPayload) {
  await mutasiSimpan.mutateAsync(payload)
}

const mutasiHapus = useMutation({
  mutationFn: (v: EventVendor) => deleteEventVendor(props.event.id, v.id),
  onSuccess: (_, v) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: 'Vendor dilepas',
      detail: `${v.namaVendor} tidak lagi ditugaskan di event ini.`,
      life: 3000,
    })
  },
  onError: (err, v) => {
    toast.add({
      severity: 'error',
      summary: `Gagal melepas ${v.namaVendor}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(v: EventVendor) {
  confirm.require({
    header: 'Lepas vendor dari event?',
    message: `${v.namaVendor} (${v.kebutuhan}) akan dilepas dari event ini, dan pos budget-nya ikut dihapus.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Lepas vendor', severity: 'danger' },
    accept: () => mutasiHapus.mutate(v),
  })
}
</script>

<template>
  <PanelTab
    judul="Vendor"
    deskripsi="Penyedia jasa dan barang untuk event ini beserta status pembayarannya."
    label-tambah="Tambah vendor"
    ikon-kosong="pi-truck"
    pesan-kosong="Belum ada vendor di event ini. Pilih dari master data vendor."
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
        Total biaya <strong class="angka">{{ rupiah(totalBiaya) }}</strong>
        <template v-if="belumLunas"> · {{ belumLunas }} belum lunas</template>
      </span>
    </template>

    <DataTable :value="daftar.data.value" data-key="id" scrollable row-hover class="ns-tabel">
      <Column header="Nama Vendor" style="min-width: 12rem">
        <template #body="{ data: v }">
          <div class="nama">
            <span class="sel-orang__nama">{{ v.namaVendor }}</span>
            <small>{{ v.jenisJasa }}</small>
          </div>
        </template>
      </Column>
      <Column header="Kebutuhan" style="min-width: 14rem; max-width: 20rem">
        <template #body="{ data: v }">
          <span class="sel-terpotong" :title="v.kebutuhan">{{ v.kebutuhan }}</span>
        </template>
      </Column>
      <Column header="Biaya" style="min-width: 9rem">
        <template #body="{ data: v }">
          <span class="angka">{{ rupiah(v.biaya) }}</span>
        </template>
      </Column>
      <Column header="Pembayaran" style="min-width: 8rem">
        <template #body="{ data: v }">
          <StatusBadge :status="STATUS_PEMBAYARAN[v.statusPembayaran as StatusPembayaran]" />
        </template>
      </Column>
      <Column header="Aksi" frozen align-frozen="right" style="width: 5.5rem">
        <template #body="{ data: v }">
          <div class="aksi">
            <Button
              icon="pi pi-pen-to-square"
              text
              rounded
              size="small"
              :aria-label="`Edit ${v.namaVendor}`"
              title="Edit"
              @click="bukaEdit(v)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              :aria-label="`Lepas ${v.namaVendor}`"
              title="Lepas dari event"
              :loading="mutasiHapus.isPending.value && mutasiHapus.variables.value?.id === v.id"
              @click="konfirmasiHapus(v)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </PanelTab>

  <EventVendorForm
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
  margin-left: 0.3rem;
  color: var(--ns-text);
  font-size: 0.95rem;
}
.nama {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.nama small {
  color: var(--ns-text-3);
  font-size: 0.76rem;
}
.aksi {
  display: flex;
  gap: 0.1rem;
}
</style>
