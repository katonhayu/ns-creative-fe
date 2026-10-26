<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import { userSchema, type UserFormValues, type UserPayload } from './user.schema'
import { PILIHAN_PERAN, type User } from './user.types'

const props = defineProps<{
  /** Pengguna yang diedit. null berarti tambah pengguna baru. */
  user: User | null
  menyimpan: boolean
  simpan: (payload: UserPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const auth = useAuthStore()
const modeEdit = computed(() => props.user !== null)
/** Admin tidak boleh mengubah peran atau menonaktifkan dirinya sendiri. */
const diriSendiri = computed(() => props.user !== null && props.user.id === auth.user?.id)
const pesanGagal = ref('')

function nilaiAwal(u: User | null): UserFormValues {
  return {
    nama: u?.nama ?? '',
    email: u?.email ?? '',
    role: u?.role ?? 'crew',
    isAktif: u?.isAktif ?? true,
    password: '',
  }
}

const FIELD_FORM = ['nama', 'email', 'role', 'isAktif', 'password'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: computed(() => skemaForm(userSchema(modeEdit.value))),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [nama, namaAttrs] = defineField('nama', lazy)
const [email, emailAttrs] = defineField('email', lazy)
const [role] = defineField('role')
const [isAktif] = defineField('isAktif')
const [password, passwordAttrs] = defineField('password', lazy)

const keteranganPeran = computed(
  () => PILIHAN_PERAN.find((p) => p.value === role.value)?.keterangan ?? '',
)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.user) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Pengguna gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit pengguna' : 'Tambah pengguna'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="dua-kolom">
      <div class="baris">
        <label for="user-nama">Nama <span class="wajib">*</span></label>
        <InputText
          id="user-nama"
          v-model="nama"
          v-bind="namaAttrs"
          :invalid="Boolean(errors.nama)"
          autofocus
          fluid
        />
        <small v-if="errors.nama" class="galat">{{ errors.nama }}</small>
      </div>

      <div class="baris">
        <label for="user-email">Email <span class="wajib">*</span></label>
        <InputText
          id="user-email"
          v-model="email"
          v-bind="emailAttrs"
          :invalid="Boolean(errors.email)"
          type="email"
          placeholder="nama@nscreative.id"
          fluid
        />
        <small v-if="errors.email" class="galat">{{ errors.email }}</small>
      </div>
    </div>

    <div class="baris">
      <label for="user-role">Peran <span class="wajib">*</span></label>
      <Select
        v-model="role"
        input-id="user-role"
        :options="PILIHAN_PERAN"
        option-label="label"
        option-value="value"
        :disabled="diriSendiri"
        :invalid="Boolean(errors.role)"
        fluid
      />
      <small v-if="errors.role" class="galat">{{ errors.role }}</small>
      <small v-else-if="diriSendiri" class="bantuan"
        >Kamu tidak bisa mengubah peranmu sendiri.</small
      >
      <small v-else class="bantuan">{{ keteranganPeran }}</small>
    </div>

    <div class="baris">
      <label for="user-password">
        {{ modeEdit ? 'Kata sandi baru' : 'Kata sandi' }}
        <span v-if="!modeEdit" class="wajib">*</span>
      </label>
      <Password
        v-model="password"
        v-bind="passwordAttrs"
        input-id="user-password"
        :feedback="false"
        toggle-mask
        autocomplete="new-password"
        :invalid="Boolean(errors.password)"
        fluid
      />
      <small v-if="errors.password" class="galat">{{ errors.password }}</small>
      <small v-else class="bantuan">
        {{ modeEdit ? 'Kosongkan jika kata sandi tidak diganti.' : 'Minimal 8 karakter.' }}
      </small>
    </div>

    <div class="saklar">
      <ToggleSwitch v-model="isAktif" input-id="user-aktif" :disabled="diriSendiri" />
      <label for="user-aktif">
        <strong>Akun aktif</strong>
        <span class="bantuan">
          {{
            diriSendiri
              ? 'Kamu tidak bisa menonaktifkan akunmu sendiri.'
              : 'Akun nonaktif tidak bisa login, tapi riwayatnya tetap tersimpan.'
          }}
        </span>
      </label>
    </div>
  </FormDialog>
</template>

<style scoped>
.saklar {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface-2);
}
.saklar label {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.85rem;
  color: var(--ns-text);
}
.saklar .bantuan {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}
</style>
