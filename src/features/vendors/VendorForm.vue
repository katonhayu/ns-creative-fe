<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import {
  SARAN_JENIS_JASA,
  vendorSchema,
  type VendorFormValues,
  type VendorPayload,
} from './vendor.schema'
import type { Vendor } from './vendor.types'

const props = defineProps<{
  vendor: Vendor | null
  menyimpan: boolean
  simpan: (payload: VendorPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.vendor !== null)
const pesanGagal = ref('')

function nilaiAwal(v: Vendor | null): VendorFormValues {
  return {
    nama: v?.nama ?? '',
    jenisJasa: v?.jenisJasa ?? '',
    contactPerson: v?.contactPerson ?? '',
    telepon: v?.telepon ?? '',
  }
}

const FIELD_FORM = ['nama', 'jenisJasa', 'contactPerson', 'telepon'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: toTypedSchema(vendorSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [nama, namaAttrs] = defineField('nama', lazy)
const [jenisJasa] = defineField('jenisJasa', lazy)
const [contactPerson, contactPersonAttrs] = defineField('contactPerson', lazy)
const [telepon, teleponAttrs] = defineField('telepon', lazy)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.vendor) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Vendor gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit vendor' : 'Tambah vendor'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="vendor-nama">Nama vendor <span class="wajib">*</span></label>
      <InputText
        id="vendor-nama"
        v-model="nama"
        v-bind="namaAttrs"
        :invalid="Boolean(errors.nama)"
        placeholder="Nama usaha atau perusahaan"
        autofocus
        fluid
      />
      <small v-if="errors.nama" class="galat">{{ errors.nama }}</small>
    </div>

    <div class="baris">
      <label for="vendor-jasa">Jenis jasa / barang <span class="wajib">*</span></label>
      <Select
        v-model="jenisJasa"
        input-id="vendor-jasa"
        :options="SARAN_JENIS_JASA"
        editable
        placeholder="Pilih atau ketik"
        :invalid="Boolean(errors.jenisJasa)"
        fluid
      />
      <small v-if="errors.jenisJasa" class="galat">{{ errors.jenisJasa }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="vendor-cp">Contact person</label>
        <InputText
          id="vendor-cp"
          v-model="contactPerson"
          v-bind="contactPersonAttrs"
          :invalid="Boolean(errors.contactPerson)"
          fluid
        />
        <small v-if="errors.contactPerson" class="galat">{{ errors.contactPerson }}</small>
      </div>

      <div class="baris">
        <label for="vendor-telepon">Telepon <span class="wajib">*</span></label>
        <InputText
          id="vendor-telepon"
          v-model="telepon"
          v-bind="teleponAttrs"
          :invalid="Boolean(errors.telepon)"
          type="tel"
          placeholder="0812-3456-7890"
          fluid
        />
        <small v-if="errors.telepon" class="galat">{{ errors.telepon }}</small>
      </div>
    </div>
  </FormDialog>
</template>
