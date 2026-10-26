<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import { useQuery } from '@tanstack/vue-query'
import { usePilihan } from '@/composables/usePilihan'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { listPilihanCrew } from '@/features/crews/crew.api'
import { SARAN_KEAHLIAN } from '@/features/crews/crew.schema'
import { isoTanggal } from '@/utils/format'
import type { EventDetail } from '../event.types'
import { cekBentrokCrew } from '../penugasan.api'
import {
  eventCrewSchema,
  type EventCrewFormValues,
  type EventCrewPayload,
} from '../penugasan.schema'
import type { EventCrew } from '../penugasan.types'
import DaftarBentrok from './DaftarBentrok.vue'

const props = defineProps<{
  event: EventDetail
  penugasan: EventCrew | null
  menyimpan: boolean
  simpan: (payload: EventCrewPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.penugasan !== null)
const pesanGagal = ref('')
const satuHari = computed(
  () => !props.event.tanggalSelesai || props.event.tanggalMulai === props.event.tanggalSelesai,
)

const pilihanCrew = usePilihan({
  key: ['crews', 'pilihan'],
  ambil: listPilihanCrew,
  aktif: visible,
  terpilih: () =>
    props.penugasan && {
      id: props.penugasan.crewId,
      nama: props.penugasan.namaCrew,
      keahlian: props.penugasan.keahlian,
    },
})

function nilaiAwal(p: EventCrew | null): EventCrewFormValues {
  return {
    crewId: p?.crewId ?? null,
    posisi: p?.posisi ?? '',
    // Event satu hari: tanggal bertugas langsung terisi.
    tanggalBertugas: p?.tanggalBertugas
      ? dayjs(p.tanggalBertugas).toDate()
      : satuHari.value
        ? dayjs(props.event.tanggalMulai).toDate()
        : null,
  }
}

const FIELD_FORM = ['crewId', 'posisi', 'tanggalBertugas'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: computed(() => skemaForm(eventCrewSchema(props.event))),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [crewId] = defineField('crewId', lazy)
const [posisi] = defineField('posisi', lazy)
const [tanggalBertugas] = defineField('tanggalBertugas', lazy)

const crewTerpilih = computed(() => pilihanCrew.cariId(crewId.value))

// Posisi default mengikuti keahlian crew.
watch(crewId, (id, lama) => {
  if (modeEdit.value || id === lama) return
  const c = pilihanCrew.cariId(id)
  if (c?.keahlian) posisi.value = c.keahlian
})

const tanggalIso = computed(() =>
  tanggalBertugas.value ? isoTanggal(tanggalBertugas.value) : null,
)

const bentrok = useQuery({
  queryKey: computed(() => ['bentrok', 'crew', props.event.id, crewId.value, tanggalIso.value]),
  queryFn: () => cekBentrokCrew(props.event, crewId.value as string, tanggalIso.value),
  enabled: computed(() => visible.value && crewId.value !== null),
  staleTime: 0,
})

const batasTanggal = computed(() => ({
  min: dayjs(props.event.tanggalMulai).toDate(),
  max: dayjs(props.event.tanggalSelesai ?? props.event.tanggalMulai).toDate(),
}))

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.penugasan) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Penugasan crew gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit penugasan crew' : 'Tambah crew ke event'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Tambahkan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="ec-crew">Crew <span class="wajib">*</span></label>
      <Select
        v-model="crewId"
        input-id="ec-crew"
        :options="pilihanCrew.opsi"
        option-label="nama"
        option-value="id"
        :loading="pilihanCrew.memuat"
        @filter="pilihanCrew.cari($event.value)"
        :disabled="modeEdit"
        filter
        :filter-fields="['nama', 'keahlian']"
        placeholder="Cari crew dari master data"
        empty-filter-message="Crew tidak ditemukan"
        :invalid="Boolean(errors.crewId)"
        fluid
      >
        <template #option="{ option }">
          <div class="opsi">
            <span>{{ option.nama }}</span>
            <small>{{ option.keahlian }}</small>
          </div>
        </template>
      </Select>
      <small v-if="errors.crewId" class="galat">{{ errors.crewId }}</small>
      <small v-else-if="pilihanCrew.gagal" class="galat">
        Daftar crew gagal dimuat. {{ pesanError(pilihanCrew.error) }}
      </small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="ec-posisi">Posisi di event <span class="wajib">*</span></label>
        <Select
          v-model="posisi"
          input-id="ec-posisi"
          :options="SARAN_KEAHLIAN"
          editable
          placeholder="Pilih atau ketik"
          :invalid="Boolean(errors.posisi)"
          fluid
        />
        <small v-if="errors.posisi" class="galat">{{ errors.posisi }}</small>
      </div>

      <div class="baris">
        <label for="ec-tanggal">Tanggal bertugas <span class="wajib">*</span></label>
        <DatePicker
          v-model="tanggalBertugas"
          input-id="ec-tanggal"
          date-format="dd M yy"
          :min-date="batasTanggal.min"
          :max-date="batasTanggal.max"
          show-icon
          icon-display="input"
          :invalid="Boolean(errors.tanggalBertugas)"
          fluid
        />
        <small v-if="errors.tanggalBertugas" class="galat">{{ errors.tanggalBertugas }}</small>
        <small v-else-if="!satuHari" class="bantuan">
          Crew yang bertugas beberapa hari ditambahkan sekali per tanggal.
        </small>
      </div>
    </div>

    <DaftarBentrok
      v-if="crewId !== null"
      :bentrok="bentrok.data.value"
      :memuat="bentrok.isFetching.value"
      :nama="crewTerpilih?.nama ?? penugasan?.namaCrew ?? 'Crew ini'"
    />
  </FormDialog>
</template>

<style scoped>
.opsi {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.opsi small {
  color: var(--ns-text-3);
}
</style>
