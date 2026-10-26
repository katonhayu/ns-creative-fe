<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { clientSchema, type ClientFormValues, type ClientPayload } from './client.schema'
import type { Client } from './client.types'

const props = defineProps<{
  /** Client yang diedit. null berarti tambah client baru. */
  client: Client | null
  menyimpan: boolean
  simpan: (payload: ClientPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.client !== null)
const pesanGagal = ref('')

function nilaiAwal(c: Client | null): ClientFormValues {
  return {
    nama: c?.nama ?? '',
    perusahaan: c?.perusahaan ?? '',
    telepon: c?.telepon ?? '',
    email: c?.email ?? '',
    alamat: c?.alamat ?? '',
  }
}

const FIELD_FORM = ['nama', 'perusahaan', 'telepon', 'email', 'alamat'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: skemaForm(clientSchema),
  initialValues: nilaiAwal(null),
})

// Error muncul saat field ditinggalkan atau form dikirim, lalu diperbarui
// selagi mengetik supaya hilang begitu isiannya sudah benar.
const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [nama, namaAttrs] = defineField('nama', lazy)
const [perusahaan, perusahaanAttrs] = defineField('perusahaan', lazy)
const [telepon, teleponAttrs] = defineField('telepon', lazy)
const [email, emailAttrs] = defineField('email', lazy)
const [alamat, alamatAttrs] = defineField('alamat', lazy)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.client) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Client gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit client' : 'Tambah client'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="client-nama">Nama <span class="wajib">*</span></label>
      <InputText
        id="client-nama"
        v-model="nama"
        v-bind="namaAttrs"
        :invalid="Boolean(errors.nama)"
        placeholder="Nama contact person"
        autofocus
        fluid
      />
      <small v-if="errors.nama" class="galat">{{ errors.nama }}</small>
    </div>

    <div class="baris">
      <label for="client-perusahaan">Perusahaan / instansi</label>
      <InputText
        id="client-perusahaan"
        v-model="perusahaan"
        v-bind="perusahaanAttrs"
        :invalid="Boolean(errors.perusahaan)"
        fluid
      />
      <small v-if="errors.perusahaan" class="galat">{{ errors.perusahaan }}</small>
      <small v-else class="bantuan">Kosongkan untuk client perorangan.</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="client-telepon">Telepon <span class="wajib">*</span></label>
        <InputText
          id="client-telepon"
          v-model="telepon"
          v-bind="teleponAttrs"
          :invalid="Boolean(errors.telepon)"
          type="tel"
          placeholder="0812-3456-7890"
          fluid
        />
        <small v-if="errors.telepon" class="galat">{{ errors.telepon }}</small>
      </div>

      <div class="baris">
        <label for="client-email">Email</label>
        <InputText
          id="client-email"
          v-model="email"
          v-bind="emailAttrs"
          :invalid="Boolean(errors.email)"
          type="email"
          placeholder="nama@perusahaan.co.id"
          fluid
        />
        <small v-if="errors.email" class="galat">{{ errors.email }}</small>
      </div>
    </div>

    <div class="baris">
      <label for="client-alamat">Alamat</label>
      <Textarea
        id="client-alamat"
        v-model="alamat"
        v-bind="alamatAttrs"
        :invalid="Boolean(errors.alamat)"
        rows="3"
        auto-resize
        fluid
      />
      <small v-if="errors.alamat" class="galat">{{ errors.alamat }}</small>
    </div>
  </FormDialog>
</template>
