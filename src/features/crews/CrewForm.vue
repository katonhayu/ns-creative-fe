<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useQuery } from '@tanstack/vue-query'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { listPilihanUser } from '@/features/users/user.api'
import { SARAN_KEAHLIAN, crewSchema, type CrewFormValues, type CrewPayload } from './crew.schema'
import type { CrewRow } from './crew.types'

const props = defineProps<{
  crew: CrewRow | null
  menyimpan: boolean
  simpan: (payload: CrewPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.crew !== null)
const pesanGagal = ref('')

const akunCrew = useQuery({
  queryKey: ['users', 'pilihan', 'crew'],
  queryFn: () => listPilihanUser(['crew']),
  enabled: visible,
})

function nilaiAwal(c: CrewRow | null): CrewFormValues {
  return {
    userId: c?.userId ?? null,
    nama: c?.nama ?? '',
    telepon: c?.telepon ?? '',
    keahlian: c?.keahlian ?? '',
  }
}

const FIELD_FORM = ['userId', 'nama', 'telepon', 'keahlian'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: toTypedSchema(crewSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [userId] = defineField('userId')
const [nama, namaAttrs] = defineField('nama', lazy)
const [telepon, teleponAttrs] = defineField('telepon', lazy)
const [keahlian] = defineField('keahlian', lazy)

// Memilih akun mengisi nama crew jika masih kosong.
watch(userId, (id) => {
  const akun = akunCrew.data.value?.find((u) => u.id === id)
  if (akun && !nama.value) nama.value = akun.nama
})

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.crew) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Crew gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit crew' : 'Tambah crew'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="crew-nama">Nama crew <span class="wajib">*</span></label>
      <InputText
        id="crew-nama"
        v-model="nama"
        v-bind="namaAttrs"
        :invalid="Boolean(errors.nama)"
        autofocus
        fluid
      />
      <small v-if="errors.nama" class="galat">{{ errors.nama }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="crew-keahlian">Keahlian <span class="wajib">*</span></label>
        <Select
          v-model="keahlian"
          input-id="crew-keahlian"
          :options="SARAN_KEAHLIAN"
          editable
          placeholder="Pilih atau ketik"
          :invalid="Boolean(errors.keahlian)"
          fluid
        />
        <small v-if="errors.keahlian" class="galat">{{ errors.keahlian }}</small>
      </div>

      <div class="baris">
        <label for="crew-telepon">Telepon <span class="wajib">*</span></label>
        <InputText
          id="crew-telepon"
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
      <label for="crew-akun">Akun login</label>
      <Select
        v-model="userId"
        input-id="crew-akun"
        :options="akunCrew.data.value ?? []"
        option-label="email"
        option-value="id"
        :loading="akunCrew.isPending.value"
        placeholder="Tidak ditautkan"
        show-clear
        filter
        :invalid="Boolean(errors.userId)"
        fluid
      >
        <template #option="{ option }">
          <div class="opsi-akun">
            <span>{{ option.nama }}</span>
            <small>{{ option.email }}</small>
          </div>
        </template>
      </Select>
      <small v-if="errors.userId" class="galat">{{ errors.userId }}</small>
      <small v-else-if="akunCrew.isError.value" class="galat">
        Daftar akun gagal dimuat. {{ pesanError(akunCrew.error.value) }}
      </small>
      <small v-else class="bantuan">
        Tautkan jika crew ini perlu login untuk melihat rundown dan task miliknya.
      </small>
    </div>
  </FormDialog>
</template>

<style scoped>
.opsi-akun {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.opsi-akun small {
  color: var(--ns-text-3);
}
</style>
