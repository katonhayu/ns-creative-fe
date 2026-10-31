<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { usePilihan } from '@/composables/usePilihan'
import { listPilihanClient } from '@/features/clients/client.api'
import { listPilihanCrew } from '@/features/crews/crew.api'
import { useAuthStore } from '@/stores/auth'
import {
  SARAN_JENIS_EVENT,
  eventSchema,
  type EventFormValues,
  type EventPayload,
} from './event.schema'
import { STATUS_EVENT, TRANSISI_STATUS, type EventItem } from './event.types'

const props = defineProps<{
  /** Event yang diedit. null berarti buat event baru. */
  event: EventItem | null
  menyimpan: boolean
  simpan: (payload: EventPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const auth = useAuthStore()
const modeEdit = computed(() => props.event !== null)
/**
 * Hanya admin yang memilih dan memindahkan PIC. Crew yang membuat event otomatis menjadi PIC
 * lewat data crew yang ditautkan ke akunnya.
 */
const picTerkunci = computed(() => !auth.isAdmin)
const pesanGagal = ref('')

const pilihanClient = usePilihan({
  key: ['clients', 'pilihan'],
  ambil: listPilihanClient,
  aktif: visible,
  terpilih: () =>
    props.event && {
      id: props.event.clientId,
      nama: props.event.namaClient,
      perusahaan: props.event.perusahaanClient,
    },
})
// PIC event = crew yang punya akun login aktif, karena PIC-lah yang mengelola event.
const pilihanPic = usePilihan({
  key: ['crews', 'pilihan', 'pic'],
  ambil: (search) => listPilihanCrew(search, true),
  aktif: () => visible.value && !picTerkunci.value,
  // PIC yang sedang dipegang (atau diri sendiri saat crew membuat event) selalu ada di daftar.
  terpilih: () =>
    props.event
      ? { id: props.event.picCrewId, nama: props.event.namaPic, keahlian: null, punyaAkun: true }
      : picTerkunci.value && auth.crewId
        ? { id: auth.crewId, nama: auth.user?.nama ?? '', keahlian: null, punyaAkun: true }
        : null,
})

/** Saat edit: status sekarang dan status berikutnya yang sah. Event baru selalu draft. */
const pilihanStatus = computed(() => {
  const sekarang = props.event?.status ?? 'draft'
  return [sekarang, ...TRANSISI_STATUS[sekarang]].map((value) => ({
    value,
    label: STATUS_EVENT[value].label,
  }))
})

function nilaiAwal(e: EventItem | null): EventFormValues {
  return {
    nama: e?.nama ?? '',
    clientId: e?.clientId ?? null,
    picCrewId: e?.picCrewId ?? (picTerkunci.value ? auth.crewId : null),
    jenis: e?.jenis ?? '',
    tanggalMulai: e ? dayjs(e.tanggalMulai).toDate() : null,
    tanggalSelesai: e ? dayjs(e.tanggalSelesai ?? e.tanggalMulai).toDate() : null,
    lokasi: e?.lokasi ?? '',
    deskripsi: e?.deskripsi ?? '',
    status: e?.status ?? 'draft',
  }
}

const FIELD_FORM = [
  'nama',
  'clientId',
  'picCrewId',
  'jenis',
  'tanggalMulai',
  'tanggalSelesai',
  'lokasi',
  'deskripsi',
  'status',
] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: skemaForm(eventSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [nama, namaAttrs] = defineField('nama', lazy)
const [clientId] = defineField('clientId', lazy)
const [picCrewId] = defineField('picCrewId', lazy)
const [jenis] = defineField('jenis', lazy)
const [tanggalMulai] = defineField('tanggalMulai', lazy)
const [tanggalSelesai] = defineField('tanggalSelesai', lazy)
const [lokasi, lokasiAttrs] = defineField('lokasi', lazy)
const [deskripsi, deskripsiAttrs] = defineField('deskripsi', lazy)
const [status] = defineField('status')

// Tanggal selesai mengikuti tanggal mulai jika belum diisi atau jadi lebih awal.
watch(tanggalMulai, (mulai) => {
  if (mulai && (!tanggalSelesai.value || dayjs(tanggalSelesai.value).isBefore(mulai, 'day'))) {
    tanggalSelesai.value = mulai
  }
})

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.event) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Event gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit event' : 'Buat event'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Buat event'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    lebar="42rem"
    @submit="kirim"
  >
    <div class="baris">
      <label for="event-nama">Nama event <span class="wajib">*</span></label>
      <InputText
        id="event-nama"
        v-model="nama"
        v-bind="namaAttrs"
        :invalid="Boolean(errors.nama)"
        placeholder="Contoh: Annual Meeting PT Nusantara Digital 2026"
        autofocus
        fluid
      />
      <small v-if="errors.nama" class="galat">{{ errors.nama }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="event-client">Client <span class="wajib">*</span></label>
        <Select
          v-model="clientId"
          input-id="event-client"
          :options="pilihanClient.opsi"
          option-label="nama"
          option-value="id"
          :loading="pilihanClient.memuat"
          filter
          :filter-fields="['nama', 'perusahaan']"
          @filter="pilihanClient.cari($event.value)"
          placeholder="Pilih client"
          :invalid="Boolean(errors.clientId)"
          fluid
        >
          <template #option="{ option }">
            <div class="opsi">
              <span>{{ option.nama }}</span>
              <small>{{ option.perusahaan ?? 'Perorangan' }}</small>
            </div>
          </template>
        </Select>
        <small v-if="errors.clientId" class="galat">{{ errors.clientId }}</small>
        <small v-else-if="pilihanClient.gagal" class="galat">
          Daftar client gagal dimuat. {{ pesanError(pilihanClient.error) }}
        </small>
      </div>

      <div class="baris">
        <label for="event-jenis">Jenis event <span class="wajib">*</span></label>
        <Select
          v-model="jenis"
          input-id="event-jenis"
          :options="SARAN_JENIS_EVENT"
          editable
          placeholder="Pilih atau ketik"
          :invalid="Boolean(errors.jenis)"
          fluid
        />
        <small v-if="errors.jenis" class="galat">{{ errors.jenis }}</small>
      </div>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="event-mulai">Tanggal mulai <span class="wajib">*</span></label>
        <DatePicker
          v-model="tanggalMulai"
          input-id="event-mulai"
          date-format="dd M yy"
          show-icon
          icon-display="input"
          :invalid="Boolean(errors.tanggalMulai)"
          fluid
        />
        <small v-if="errors.tanggalMulai" class="galat">{{ errors.tanggalMulai }}</small>
      </div>

      <div class="baris">
        <label for="event-selesai">Tanggal selesai <span class="wajib">*</span></label>
        <DatePicker
          v-model="tanggalSelesai"
          input-id="event-selesai"
          date-format="dd M yy"
          show-icon
          icon-display="input"
          :min-date="tanggalMulai ?? undefined"
          :invalid="Boolean(errors.tanggalSelesai)"
          fluid
        />
        <small v-if="errors.tanggalSelesai" class="galat">{{ errors.tanggalSelesai }}</small>
      </div>
    </div>

    <div class="baris">
      <label for="event-lokasi">Lokasi <span class="wajib">*</span></label>
      <InputText
        id="event-lokasi"
        v-model="lokasi"
        v-bind="lokasiAttrs"
        :invalid="Boolean(errors.lokasi)"
        placeholder="Nama venue dan kota"
        fluid
      />
      <small v-if="errors.lokasi" class="galat">{{ errors.lokasi }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="event-pic">PIC <span class="wajib">*</span></label>
        <Select
          v-model="picCrewId"
          input-id="event-pic"
          :options="pilihanPic.opsi"
          option-label="nama"
          option-value="id"
          :loading="!picTerkunci && pilihanPic.memuat"
          :disabled="picTerkunci"
          filter
          @filter="pilihanPic.cari($event.value)"
          placeholder="Pilih crew PIC"
          :invalid="Boolean(errors.picCrewId)"
          fluid
        />
        <small v-if="errors.picCrewId" class="galat">{{ errors.picCrewId }}</small>
        <small v-else-if="picTerkunci && !modeEdit" class="bantuan"
          >Event yang kamu buat otomatis kamu pegang.</small
        >
        <small v-else-if="picTerkunci" class="bantuan"
          >Hanya admin yang bisa memindahkan event ke PIC lain.</small
        >
        <small v-else class="bantuan"
          >Hanya crew yang punya akun login yang bisa menjadi PIC.</small
        >
      </div>

      <div v-if="modeEdit" class="baris">
        <label for="event-status">Status</label>
        <Select
          v-model="status"
          input-id="event-status"
          :options="pilihanStatus"
          option-label="label"
          option-value="value"
          fluid
        />
        <small class="bantuan">Hanya status berikutnya yang sah yang bisa dipilih.</small>
      </div>
    </div>

    <div class="baris">
      <label for="event-deskripsi">Deskripsi</label>
      <Textarea
        id="event-deskripsi"
        v-model="deskripsi"
        v-bind="deskripsiAttrs"
        :invalid="Boolean(errors.deskripsi)"
        rows="3"
        auto-resize
        placeholder="Konsep acara, jumlah peserta, catatan penting dari client"
        fluid
      />
      <small v-if="errors.deskripsi" class="galat">{{ errors.deskripsi }}</small>
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
