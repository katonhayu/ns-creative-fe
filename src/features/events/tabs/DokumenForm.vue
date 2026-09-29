<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { ukuranFile } from '@/utils/file'
import { dokumenSchema, type DokumenFormValues, type DokumenPayload } from '../document.schema'
import { SARAN_JENIS_DOKUMEN, type Dokumen } from '../document.types'

/** Edit metadata dokumen. File-nya tidak bisa diganti dari sini. */
const props = defineProps<{
  dokumen: Dokumen | null
  menyimpan: boolean
  simpan: (payload: DokumenPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const pesanGagal = ref('')

function nilaiAwal(d: Dokumen | null): DokumenFormValues {
  return {
    namaDokumen: d?.namaDokumen ?? '',
    jenis: d?.jenis ?? '',
    tanggal: d ? dayjs(d.tanggal).toDate() : new Date(),
    keterangan: d?.keterangan ?? '',
  }
}

const FIELD_FORM = ['namaDokumen', 'jenis', 'tanggal', 'keterangan'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: toTypedSchema(dokumenSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [namaDokumen, namaDokumenAttrs] = defineField('namaDokumen', lazy)
const [jenis] = defineField('jenis', lazy)
const [tanggal] = defineField('tanggal', lazy)
const [keterangan, keteranganAttrs] = defineField('keterangan', lazy)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.dokumen) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Dokumen gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    judul="Edit dokumen"
    label-simpan="Simpan perubahan"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <p v-if="dokumen" class="file">
      <i class="pi pi-paperclip" /> {{ dokumen.namaFile }} · {{ ukuranFile(dokumen.ukuran) }}
    </p>

    <div class="baris">
      <label for="dokedit-nama">Nama dokumen <span class="wajib">*</span></label>
      <InputText
        id="dokedit-nama"
        v-model="namaDokumen"
        v-bind="namaDokumenAttrs"
        :invalid="Boolean(errors.namaDokumen)"
        autofocus
        fluid
      />
      <small v-if="errors.namaDokumen" class="galat">{{ errors.namaDokumen }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="dokedit-jenis">Jenis <span class="wajib">*</span></label>
        <Select
          v-model="jenis"
          input-id="dokedit-jenis"
          :options="SARAN_JENIS_DOKUMEN"
          editable
          :invalid="Boolean(errors.jenis)"
          fluid
        />
        <small v-if="errors.jenis" class="galat">{{ errors.jenis }}</small>
      </div>
      <div class="baris">
        <label for="dokedit-tanggal">Tanggal <span class="wajib">*</span></label>
        <DatePicker
          v-model="tanggal"
          input-id="dokedit-tanggal"
          date-format="dd M yy"
          show-icon
          icon-display="input"
          :invalid="Boolean(errors.tanggal)"
          fluid
        />
        <small v-if="errors.tanggal" class="galat">{{ errors.tanggal }}</small>
      </div>
    </div>

    <div class="baris">
      <label for="dokedit-ket">Keterangan</label>
      <Textarea
        id="dokedit-ket"
        v-model="keterangan"
        v-bind="keteranganAttrs"
        :invalid="Boolean(errors.keterangan)"
        rows="2"
        auto-resize
        fluid
      />
      <small v-if="errors.keterangan" class="galat">{{ errors.keterangan }}</small>
      <small v-else class="bantuan">
        File tidak bisa diganti. Unggah dokumen baru jika ada revisi.
      </small>
    </div>
  </FormDialog>
</template>

<style scoped>
.file {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0.55rem 0.75rem;
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface-2);
  color: var(--ns-text-2);
  font-size: 0.82rem;
  word-break: break-all;
}
</style>
