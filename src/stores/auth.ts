import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/features/auth/auth.api'
import type { LoginPayload } from '@/features/auth/auth.schema'
import type { LoginResponse, PenggunaAktif } from '@/features/auth/auth.types'

const KUNCI_SESI = 'ns.sesi'

interface Sesi {
  accessToken: string
  refreshToken: string
  user: PenggunaAktif
}

function bacaSesi(): Sesi | null {
  try {
    const mentah = localStorage.getItem(KUNCI_SESI)
    return mentah ? (JSON.parse(mentah) as Sesi) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const awal = bacaSesi()
  const accessToken = ref<string | null>(awal?.accessToken ?? null)
  const refreshToken = ref<string | null>(awal?.refreshToken ?? null)
  const user = ref<PenggunaAktif | null>(awal?.user ?? null)

  const sudahLogin = computed(() => Boolean(accessToken.value && user.value))
  const peran = computed(() => user.value?.role ?? null)
  const isAdmin = computed(() => peran.value === 'admin')

  /**
   * Penentu apakah angka fee dan anggaran boleh ditampilkan.
   * Ini hanya untuk menyembunyikan menu. Penjagaan sebenarnya ada di backend.
   */
  const bolehLihatUang = computed(() => peran.value === 'admin' || peran.value === 'pic')

  function simpanSesi(hasil: LoginResponse) {
    accessToken.value = hasil.accessToken
    refreshToken.value = hasil.refreshToken
    user.value = hasil.user
    localStorage.setItem(
      KUNCI_SESI,
      JSON.stringify({
        accessToken: hasil.accessToken,
        refreshToken: hasil.refreshToken,
        user: hasil.user,
      }),
    )
  }

  function hapusSesi() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem(KUNCI_SESI)
  }

  async function login(payload: LoginPayload) {
    simpanSesi(await authApi.login(payload))
  }

  /** Keluar: cabut refresh token di backend (jika gagal tetap keluar di sisi browser). */
  async function logout() {
    const token = refreshToken.value
    if (token) {
      try {
        await authApi.logout(token)
      } catch {
        // Sesi lokal tetap dihapus walau backend tidak bisa dihubungi.
      }
    }
    hapusSesi()
  }

  let refreshBerjalan: Promise<boolean> | null = null

  /**
   * Perbarui access token dengan refresh token. Semua pemanggil yang bersamaan menunggu
   * satu permintaan yang sama: backend mencabut semua sesi jika refresh token dipakai dua kali.
   * Menghasilkan false jika sesi sudah tidak berlaku (harus login ulang).
   */
  function perbarui(): Promise<boolean> {
    const token = refreshToken.value
    if (!token) return Promise.resolve(false)
    refreshBerjalan ??= authApi
      .refresh(token)
      .then((hasil) => {
        simpanSesi(hasil)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshBerjalan = null
      })
    return refreshBerjalan
  }

  return {
    accessToken,
    refreshToken,
    user,
    sudahLogin,
    peran,
    isAdmin,
    bolehLihatUang,
    login,
    logout,
    hapusSesi,
    perbarui,
  }
})
