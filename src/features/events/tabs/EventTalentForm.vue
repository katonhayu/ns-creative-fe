<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useQuery } from '@tanstack/vue-query'
import { usePilihan } from '@/composables/usePilihan'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { listPilihanTalent } from '@/features/talents/talent.api'
import { rupiah } from '@/utils/format'
import type { EventDetail } from '../event.types'
import { cekBentrokTalent } from '../penugasan.api'
import {
  eventTalentSchema,
  type EventTalentFormValues,
  type EventTalentPayload,
} from '../penugasan.schema'
import { STATUS_TALENT_EVENT, pilihanDari, type EventTalent } from '../penugasan.types'
import DaftarBentrok from './DaftarBentrok.vue'

const props = defineProps<{
  event: EventDetail
  /** Penugasan yang diedit. null berarti tambah talent. */
  penugasan: EventTalent | null
  /** talentId yang sudah aktif di event ini, disembunyikan dari pilihan. */
  sudahDitugaskan: string[]
  menyimpan: boolean
  simpan: (payload: EventTalentPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.penugasan !== null)
const pesanGagal = ref('')
const PILIHAN_STATUS = pilihanDari(STATUS_TALENT_EVENT)

const pilihanTalent = usePilihan({
  key: ['talents', 'pilihan'],
  ambil: listPilihanTalent,
  aktif: visible,
  terpilih: () =>
    props.penugasan && {
      id: props.penugasan.talentId,
      nama: props.penugasan.namaTalent,
      jenis: props.penugasan.jenisTalent,
      feeStandar: props.penugasan.feeStandar,
      riderDefault: null,
    },
})
const opsiTalent = computed(() =>
  pilihanTalent.opsi.filter(
    (t) => !props.sudahDitugaskan.includes(t.id) || t.id === props.penugasan?.talentId,
  ),
)

function nilaiAwal(p: EventTalent | null): EventTalentFormValues {
  return {
    talentId: p?.talentId ?? null,
    feeDeal: p?.feeDeal ?? null,
    durasiMenit: p?.durasiMenit ?? null,
    jadwalTampil: p?.jadwalTampil ? dayjs(p.jadwalTampil).toDate() : null,
    rider: p?.rider ?? '',
    status: p?.status ?? 'dihubungi',
  }
}

const FIELD_FORM = [
  'talentId',
  'feeDeal',
  'durasiMenit',
  'jadwalTampil',
  'rider',
  'status',
] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: computed(() => toTypedSchema(eventTalentSchema(props.event))),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [talentId] = defineField('talentId', lazy)
const [feeDeal] = defineField('feeDeal', lazy)
const [durasiMenit] = defineField('durasiMenit', lazy)
const [jadwalTampil] = defineField('jadwalTampil', lazy)
const [rider, riderAttrs] = defineField('rider', lazy)
const [status] = defineField('status')

const talentTerpilih = computed(() => pilihanTalent.cariId(talentId.value))

// Saat menambah, fee dan rider diisi dari data standar talent sebagai titik awal negosiasi.
watch(talentId, (id, lama) => {
  if (modeEdit.value || id === lama) return
  const t = pilihanTalent.cariId(id)
  if (!t) return
  feeDeal.value = t.feeStandar
  rider.value = t.riderDefault ?? ''
})

const bentrok = useQuery({
  queryKey: computed(() => ['bentrok', 'talent', props.event.id, talentId.value]),
  queryFn: () => cekBentrokTalent(props.event, talentId.value as string),
  enabled: computed(() => visible.value && talentId.value !== null),
  staleTime: 0,
})

const batasTanggal = computed(() => ({
  min: dayjs(props.event.tanggalMulai).startOf('day').toDate(),
  max: dayjs(props.event.tanggalSelesai ?? props.event.tanggalMulai)
    .endOf('day')
    .toDate(),
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
    pesanGagal.value = pesanError(error, 'Penugasan talent gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit penugasan talent' : 'Tambah talent ke event'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Tambahkan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    lebar="38rem"
    @submit="kirim"
  >
    <div class="baris">
      <label for="et-talent">Talent <span class="wajib">*</span></label>
      <Select
        v-model="talentId"
        input-id="et-talent"
        :options="opsiTalent"
        option-label="nama"
        option-value="id"
        :loading="pilihanTalent.memuat"
        :disabled="modeEdit"
        filter
        :filter-fields="['nama', 'jenis']"
        @filter="pilihanTalent.cari($event.value)"
        placeholder="Cari talent dari master data"
        empty-filter-message="Talent tidak ditemukan"
        :invalid="Boolean(errors.talentId)"
        fluid
      >
        <template #option="{ option }">
          <div class="opsi">
            <span>{{ option.nama }}</span>
            <small>{{ option.jenis }} · fee standar {{ rupiah(option.feeStandar) }}</small>
          </div>
        </template>
      </Select>
      <small v-if="errors.talentId" class="galat">{{ errors.talentId }}</small>
      <small v-else-if="pilihanTalent.gagal" class="galat">
        Daftar talent gagal dimuat. {{ pesanError(pilihanTalent.error) }}
      </small>
      <small v-else-if="modeEdit" class="bantuan">
        Talent tidak bisa diganti. Hapus penugasan ini lalu tambahkan talent lain.
      </small>
    </div>

    <DaftarBentrok
      v-if="talentId !== null"
      :bentrok="bentrok.data.value"
      :memuat="bentrok.isFetching.value"
      :nama="talentTerpilih?.nama ?? penugasan?.namaTalent ?? 'Talent ini'"
    />

    <div class="dua-kolom">
      <div class="baris">
        <label for="et-fee">Fee deal <span class="wajib">*</span></label>
        <InputNumber
          v-model="feeDeal"
          input-id="et-fee"
          prefix="Rp "
          locale="id-ID"
          :min="0"
          :invalid="Boolean(errors.feeDeal)"
          fluid
        />
        <small v-if="errors.feeDeal" class="galat">{{ errors.feeDeal }}</small>
        <small v-else class="bantuan">Otomatis tercatat sebagai pos budget event.</small>
      </div>

      <div class="baris">
        <label for="et-status">Status</label>
        <Select
          v-model="status"
          input-id="et-status"
          :options="PILIHAN_STATUS"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="et-jadwal">Jadwal tampil</label>
        <DatePicker
          v-model="jadwalTampil"
          input-id="et-jadwal"
          show-time
          hour-format="24"
          date-format="dd M yy"
          :min-date="batasTanggal.min"
          :max-date="batasTanggal.max"
          show-icon
          icon-display="input"
          :invalid="Boolean(errors.jadwalTampil)"
          fluid
        />
        <small v-if="errors.jadwalTampil" class="galat">{{ errors.jadwalTampil }}</small>
      </div>

      <div class="baris">
        <label for="et-durasi">Durasi tampil</label>
        <InputNumber
          v-model="durasiMenit"
          input-id="et-durasi"
          suffix=" menit"
          :min="1"
          :use-grouping="false"
          :invalid="Boolean(errors.durasiMenit)"
          fluid
        />
        <small v-if="errors.durasiMenit" class="galat">{{ errors.durasiMenit }}</small>
      </div>
    </div>

    <div class="baris">
      <label for="et-rider">Rider untuk event ini</label>
      <Textarea
        id="et-rider"
        v-model="rider"
        v-bind="riderAttrs"
        :invalid="Boolean(errors.rider)"
        rows="3"
        auto-resize
        fluid
      />
      <small v-if="errors.rider" class="galat">{{ errors.rider }}</small>
      <small v-else class="bantuan"
        >Diisi dari rider default talent, sesuaikan dengan kesepakatan.</small
      >
    </div>
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
