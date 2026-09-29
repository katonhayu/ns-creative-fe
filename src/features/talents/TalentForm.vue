<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import {
  SARAN_JENIS_TALENT,
  talentSchema,
  type TalentFormValues,
  type TalentPayload,
} from './talent.schema'
import type { Talent } from './talent.types'

const props = defineProps<{
  talent: Talent | null
  menyimpan: boolean
  simpan: (payload: TalentPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.talent !== null)
const pesanGagal = ref('')

function nilaiAwal(t: Talent | null): TalentFormValues {
  return {
    nama: t?.nama ?? '',
    jenis: t?.jenis ?? '',
    contactPerson: t?.contactPerson ?? '',
    telepon: t?.telepon ?? '',
    feeStandar: t?.feeStandar ?? null,
    riderDefault: t?.riderDefault ?? '',
  }
}

const FIELD_FORM = [
  'nama',
  'jenis',
  'contactPerson',
  'telepon',
  'feeStandar',
  'riderDefault',
] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: toTypedSchema(talentSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [nama, namaAttrs] = defineField('nama', lazy)
const [jenis] = defineField('jenis', lazy)
const [contactPerson, contactPersonAttrs] = defineField('contactPerson', lazy)
const [telepon, teleponAttrs] = defineField('telepon', lazy)
const [feeStandar] = defineField('feeStandar', lazy)
const [riderDefault, riderDefaultAttrs] = defineField('riderDefault', lazy)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.talent) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Talent gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit talent' : 'Tambah talent'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="talent-nama">Nama talent <span class="wajib">*</span></label>
      <InputText
        id="talent-nama"
        v-model="nama"
        v-bind="namaAttrs"
        :invalid="Boolean(errors.nama)"
        placeholder="Nama artis, grup, atau manajemen"
        autofocus
        fluid
      />
      <small v-if="errors.nama" class="galat">{{ errors.nama }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="talent-jenis">Jenis <span class="wajib">*</span></label>
        <Select
          v-model="jenis"
          input-id="talent-jenis"
          :options="SARAN_JENIS_TALENT"
          editable
          placeholder="Pilih atau ketik"
          :invalid="Boolean(errors.jenis)"
          fluid
        />
        <small v-if="errors.jenis" class="galat">{{ errors.jenis }}</small>
      </div>

      <div class="baris">
        <label for="talent-fee">Fee standar <span class="wajib">*</span></label>
        <InputNumber
          v-model="feeStandar"
          input-id="talent-fee"
          prefix="Rp "
          locale="id-ID"
          :min="0"
          :invalid="Boolean(errors.feeStandar)"
          fluid
        />
        <small v-if="errors.feeStandar" class="galat">{{ errors.feeStandar }}</small>
        <small v-else class="bantuan">Jadi nilai awal saat talent ditugaskan ke event.</small>
      </div>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="talent-cp">Contact person</label>
        <InputText
          id="talent-cp"
          v-model="contactPerson"
          v-bind="contactPersonAttrs"
          :invalid="Boolean(errors.contactPerson)"
          placeholder="Manajer atau perwakilan"
          fluid
        />
        <small v-if="errors.contactPerson" class="galat">{{ errors.contactPerson }}</small>
      </div>

      <div class="baris">
        <label for="talent-telepon">Telepon <span class="wajib">*</span></label>
        <InputText
          id="talent-telepon"
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

    <div class="baris">
      <label for="talent-rider">Rider default</label>
      <Textarea
        id="talent-rider"
        v-model="riderDefault"
        v-bind="riderDefaultAttrs"
        :invalid="Boolean(errors.riderDefault)"
        rows="3"
        auto-resize
        placeholder="Kebutuhan teknis dan hospitality standar talent"
        fluid
      />
      <small v-if="errors.riderDefault" class="galat">{{ errors.riderDefault }}</small>
    </div>
  </FormDialog>
</template>
