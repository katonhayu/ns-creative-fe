<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'
import { pesanError } from '@/api/http'
import { loginSchema, type LoginPayload } from './auth.schema'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive<LoginPayload>({ email: '', password: '' })
const galatField = reactive<Partial<Record<keyof LoginPayload, string>>>({})
const sedangProses = ref(false)
const pesanGagal = ref('')
/** Diarahkan ke sini karena sesi habis (refresh token tidak berlaku lagi). */
const sesiBerakhir = route.query.sesi === 'berakhir'

async function kirim() {
  pesanGagal.value = ''
  galatField.email = undefined
  galatField.password = undefined

  const hasil = loginSchema.safeParse(form)
  if (!hasil.success) {
    for (const issue of hasil.error.issues) {
      const field = issue.path[0] as keyof LoginPayload
      galatField[field] ??= issue.message
    }
    return
  }

  sedangProses.value = true
  try {
    await auth.login(hasil.data)
    const lanjut = typeof route.query.lanjut === 'string' ? route.query.lanjut : '/'
    await router.push(lanjut)
  } catch (error) {
    pesanGagal.value = pesanError(error, 'Gagal masuk. Coba lagi.')
  } finally {
    sedangProses.value = false
  }
}
</script>

<template>
  <div class="kartu">
    <div class="kepala">
      <h1>Selamat datang kembali</h1>
      <p>Masuk dengan akun staf untuk melanjutkan.</p>
    </div>

    <Message v-if="sesiBerakhir && !pesanGagal" severity="warn" :closable="false">
      Sesi Anda sudah berakhir. Silakan masuk kembali.
    </Message>
    <Message v-if="pesanGagal" severity="error" :closable="false">
      {{ pesanGagal }}
    </Message>

    <form class="form" novalidate @submit.prevent="kirim">
      <div class="baris">
        <label for="login-email">Email</label>
        <InputText
          id="login-email"
          v-model="form.email"
          type="email"
          autocomplete="username"
          placeholder="nama@nscreative.id"
          :invalid="Boolean(galatField.email)"
          size="large"
          fluid
        />
        <small v-if="galatField.email" class="galat">{{ galatField.email }}</small>
      </div>

      <div class="baris">
        <label for="login-password">Kata sandi</label>
        <Password
          v-model="form.password"
          input-id="login-password"
          :feedback="false"
          toggle-mask
          autocomplete="current-password"
          :invalid="Boolean(galatField.password)"
          size="large"
          fluid
        />
        <small v-if="galatField.password" class="galat">{{ galatField.password }}</small>
      </div>

      <Button type="submit" label="Masuk" size="large" :loading="sedangProses" fluid />
    </form>
  </div>
</template>

<style scoped>
.kartu {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.kepala {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.kepala h1 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 650;
  color: var(--ns-text);
}
.kepala p {
  margin: 0;
  color: var(--ns-text-2);
  font-size: 0.9rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.baris {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.baris label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ns-text-2);
}
.galat {
  color: var(--ns-danger);
  font-size: 0.78rem;
}
</style>
