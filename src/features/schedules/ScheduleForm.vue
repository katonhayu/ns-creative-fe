<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { usePilihan } from '@/composables/usePilihan'
import { LABEL_PERAN } from '@/features/auth/auth.types'
import type { EventDetail } from '@/features/events/event.types'
import { listPilihanUser } from '@/features/users/user.api'
import {
  dariJam,
  scheduleSchema,
  type ScheduleFormValues,
  type SchedulePayload,
} from './schedule.schema'
import type { ScheduleRow } from './schedule.types'

const props = defineProps<{
  event: EventDetail
  sesi: ScheduleRow | null
  /** Tanggal awal saat menambah sesi baru, misalnya tanggal sesi terakhir. */
  tanggalAwal?: string | null
  menyimpan: boolean
  simpan: (payload: SchedulePayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.sesi !== null)
const pesanGagal = ref('')

const pilihanPic = usePilihan({
  key: ['users', 'pilihan', 'semua'],
  ambil: (search) => listPilihanUser(undefined, search),
  aktif: visible,
  terpilih: () =>
    props.sesi?.picUserId
      ? {
          id: props.sesi.picUserId,
          nama: props.sesi.namaPic ?? '',
          email: '',
          role: 'crew' as const,
        }
      : {
          id: props.event.picUserId,
          nama: props.event.namaPic,
          email: props.event.emailPic,
          role: 'pic' as const,
        },
})

function nilaiAwal(s: ScheduleRow | null): ScheduleFormValues {
  const tgl = s?.tanggal ?? props.tanggalAwal ?? props.event.tanggalMulai
  return {
    kegiatan: s?.kegiatan ?? '',
    tanggal: dayjs(tgl).toDate(),
    waktuMulai: s ? dariJam(s.waktuMulai) : null,
    waktuSelesai: s?.waktuSelesai ? dariJam(s.waktuSelesai) : null,
    picUserId: s?.picUserId ?? props.event.picUserId,
    lokasi: s?.lokasi ?? '',
  }
}

const FIELD_FORM = [
  'kegiatan',
  'tanggal',
  'waktuMulai',
  'waktuSelesai',
  'picUserId',
  'lokasi',
] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: computed(() => toTypedSchema(scheduleSchema(props.event))),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [kegiatan, kegiatanAttrs] = defineField('kegiatan', lazy)
const [tanggal] = defineField('tanggal', lazy)
const [waktuMulai] = defineField('waktuMulai', lazy)
const [waktuSelesai] = defineField('waktuSelesai', lazy)
const [picUserId] = defineField('picUserId', lazy)
const [lokasi, lokasiAttrs] = defineField('lokasi', lazy)

// Jam selesai default satu jam setelah jam mulai.
watch(waktuMulai, (mulai) => {
  if (mulai && !waktuSelesai.value) waktuSelesai.value = dayjs(mulai).add(1, 'hour').toDate()
})

const batasTanggal = computed(() => ({
  min: dayjs(props.event.tanggalMulai).toDate(),
  max: dayjs(props.event.tanggalSelesai ?? props.event.tanggalMulai).toDate(),
}))
const satuHari = computed(
  () => !props.event.tanggalSelesai || props.event.tanggalMulai === props.event.tanggalSelesai,
)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.sesi) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Sesi rundown gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit sesi rundown' : 'Tambah sesi rundown'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="sesi-kegiatan">Kegiatan <span class="wajib">*</span></label>
      <InputText
        id="sesi-kegiatan"
        v-model="kegiatan"
        v-bind="kegiatanAttrs"
        :invalid="Boolean(errors.kegiatan)"
        placeholder="Contoh: Registrasi peserta"
        autofocus
        fluid
      />
      <small v-if="errors.kegiatan" class="galat">{{ errors.kegiatan }}</small>
    </div>

    <div class="baris">
      <label for="sesi-tanggal">Tanggal <span class="wajib">*</span></label>
      <DatePicker
        v-model="tanggal"
        input-id="sesi-tanggal"
        date-format="DD, dd M yy"
        :min-date="batasTanggal.min"
        :max-date="batasTanggal.max"
        :disabled="satuHari"
        show-icon
        icon-display="input"
        :invalid="Boolean(errors.tanggal)"
        fluid
      />
      <small v-if="errors.tanggal" class="galat">{{ errors.tanggal }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="sesi-mulai">Jam mulai <span class="wajib">*</span></label>
        <DatePicker
          v-model="waktuMulai"
          input-id="sesi-mulai"
          time-only
          hour-format="24"
          :step-minute="5"
          placeholder="08:00"
          :invalid="Boolean(errors.waktuMulai)"
          fluid
        />
        <small v-if="errors.waktuMulai" class="galat">{{ errors.waktuMulai }}</small>
      </div>

      <div class="baris">
        <label for="sesi-selesai">Jam selesai <span class="wajib">*</span></label>
        <DatePicker
          v-model="waktuSelesai"
          input-id="sesi-selesai"
          time-only
          hour-format="24"
          :step-minute="5"
          placeholder="09:00"
          :invalid="Boolean(errors.waktuSelesai)"
          fluid
        />
        <small v-if="errors.waktuSelesai" class="galat">{{ errors.waktuSelesai }}</small>
      </div>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="sesi-pic">PIC sesi <span class="wajib">*</span></label>
        <Select
          v-model="picUserId"
          input-id="sesi-pic"
          :options="pilihanPic.opsi"
          option-label="nama"
          option-value="id"
          :loading="pilihanPic.memuat"
          filter
          @filter="pilihanPic.cari($event.value)"
          :invalid="Boolean(errors.picUserId)"
          fluid
        >
          <template #option="{ option }">
            <div class="opsi">
              <span>{{ option.nama }}</span>
              <small>{{ LABEL_PERAN[option.role as keyof typeof LABEL_PERAN] }}</small>
            </div>
          </template>
        </Select>
        <small v-if="errors.picUserId" class="galat">{{ errors.picUserId }}</small>
      </div>

      <div class="baris">
        <label for="sesi-lokasi">Lokasi</label>
        <InputText
          id="sesi-lokasi"
          v-model="lokasi"
          v-bind="lokasiAttrs"
          :invalid="Boolean(errors.lokasi)"
          placeholder="Contoh: Panggung utama"
          fluid
        />
        <small v-if="errors.lokasi" class="galat">{{ errors.lokasi }}</small>
      </div>
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
