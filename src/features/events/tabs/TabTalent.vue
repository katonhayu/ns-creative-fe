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
import { inisial, rupiah, tanggalJam } from '@/utils/format'
import type { EventDetail } from '../event.types'
import {
  createEventTalent,
  deleteEventTalent,
  listEventTalents,
  updateEventTalent,
} from '../penugasan.api'
import type { EventTalentPayload } from '../penugasan.schema'
import { STATUS_TALENT_EVENT, type EventTalent, type StatusTalentEvent } from '../penugasan.types'
import EventTalentForm from './EventTalentForm.vue'
import PanelTab from './PanelTab.vue'

const props = defineProps<{ event: EventDetail }>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'talents']),
  queryFn: () => listEventTalents(props.event.id),
})

const aktif = computed(() => (daftar.data.value ?? []).filter((t) => t.status !== 'batal'))
const totalFee = computed(() => aktif.value.reduce((s, t) => s + t.feeDeal, 0))
const sudahDitugaskan = computed(() => aktif.value.map((t) => t.talentId))

// Detail event, ringkasan, dan budget ikut berubah saat penugasan berubah.
const segarkan = () => queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })

// --- Tambah & edit ---------------------------------------------------------

const formTerbuka = ref(false)
const dipilih = ref<EventTalent | null>(null)

function bukaTambah() {
  dipilih.value = null
  formTerbuka.value = true
}
function bukaEdit(t: EventTalent) {
  dipilih.value = t
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: EventTalentPayload) =>
    dipilih.value
      ? updateEventTalent(props.event.id, dipilih.value.id, payload)
      : createEventTalent(props.event.id, payload),
  onSuccess: (hasil) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: dipilih.value ? 'Penugasan diperbarui' : 'Talent ditambahkan',
      detail: `${hasil.namaTalent} · fee ${rupiah(hasil.feeDeal)} tercatat di budget.`,
      life: 3500,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: EventTalentPayload) {
  await mutasiSimpan.mutateAsync(payload)
}

// --- Hapus -----------------------------------------------------------------

const mutasiHapus = useMutation({
  mutationFn: (t: EventTalent) => deleteEventTalent(props.event.id, t.id),
  onSuccess: (_, t) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: 'Talent dilepas',
      detail: `${t.namaTalent} tidak lagi ditugaskan di event ini.`,
      life: 3000,
    })
  },
  onError: (err, t) => {
    toast.add({
      severity: 'error',
      summary: `Gagal melepas ${t.namaTalent}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(t: EventTalent) {
  confirm.require({
    header: 'Lepas talent dari event?',
    message: `${t.namaTalent} akan dilepas dari event ini, dan pos budget fee-nya ikut dihapus. Jika talent batal tampil, ubah statusnya ke Batal agar riwayatnya tetap tercatat.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Lepas talent', severity: 'danger' },
    accept: () => mutasiHapus.mutate(t),
  })
}
</script>

<template>
  <PanelTab
    judul="Talent"
    deskripsi="Talent dari master data beserta kesepakatan khusus event ini."
    label-tambah="Tambah talent"
    :tanpa-tambah="!event.bolehKelola"
    ikon-kosong="pi-star"
    pesan-kosong="Belum ada talent di event ini. Pilih dari master data talent."
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
        Total fee <strong class="angka">{{ rupiah(totalFee) }}</strong>
      </span>
    </template>

    <DataTable :value="daftar.data.value" data-key="id" scrollable row-hover class="ns-tabel">
      <Column header="Talent" style="min-width: 14rem">
        <template #body="{ data: t }">
          <div class="sel-orang" :class="{ batal: t.status === 'batal' }">
            <span class="sel-orang__avatar" aria-hidden="true">{{ inisial(t.namaTalent) }}</span>
            <div class="nama">
              <span class="sel-orang__nama">{{ t.namaTalent }}</span>
              <small>{{ t.jenisTalent }}</small>
            </div>
          </div>
        </template>
      </Column>
      <Column header="Fee Deal" style="min-width: 9rem">
        <template #body="{ data: t }">
          <span class="angka" :class="{ coret: t.status === 'batal' }">{{
            rupiah(t.feeDeal)
          }}</span>
        </template>
      </Column>
      <Column header="Jadwal Tampil" style="min-width: 11rem">
        <template #body="{ data: t }">
          <span v-if="t.jadwalTampil" class="angka">{{ tanggalJam(t.jadwalTampil) }}</span>
          <span v-else class="sel-redup">Belum dijadwalkan</span>
        </template>
      </Column>
      <Column header="Durasi" style="min-width: 6rem">
        <template #body="{ data: t }">
          <span v-if="t.durasiMenit" class="angka">{{ t.durasiMenit }} menit</span>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>
      <Column header="Status" style="min-width: 7rem">
        <template #body="{ data: t }">
          <StatusBadge :status="STATUS_TALENT_EVENT[t.status as StatusTalentEvent]" />
        </template>
      </Column>
      <Column header="Rider" style="min-width: 12rem; max-width: 16rem">
        <template #body="{ data: t }">
          <span v-if="t.rider" class="sel-terpotong" :title="t.rider">{{ t.rider }}</span>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>
      <Column
        v-if="event.bolehKelola"
        header="Aksi"
        frozen
        align-frozen="right"
        style="width: 5.5rem"
      >
        <template #body="{ data: t }">
          <div class="aksi">
            <Button
              icon="pi pi-pen-to-square"
              text
              rounded
              size="small"
              :aria-label="`Edit ${t.namaTalent}`"
              title="Edit"
              @click="bukaEdit(t)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              :aria-label="`Lepas ${t.namaTalent}`"
              title="Lepas dari event"
              :loading="mutasiHapus.isPending.value && mutasiHapus.variables.value?.id === t.id"
              @click="konfirmasiHapus(t)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </PanelTab>

  <EventTalentForm
    v-model:visible="formTerbuka"
    :event="event"
    :penugasan="dipilih"
    :sudah-ditugaskan="sudahDitugaskan"
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
.batal {
  opacity: 0.55;
}
.coret {
  text-decoration: line-through;
  color: var(--ns-text-3);
}
.aksi {
  display: flex;
  gap: 0.1rem;
}
</style>
