import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import type { ApiError, Paged } from './types'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  // Array query ditulis ?role=admin&role=pic (format ASP.NET), bukan role[]=admin.
  paramsSerializer: { indexes: null },
})

// Sisipkan access token ke setiap request.
http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

type ConfigUlang = InternalAxiosRequestConfig & { _sudahDiulang?: boolean }

/** Endpoint yang 401-nya berarti kredensial salah, bukan token kedaluwarsa. */
const TANPA_REFRESH = ['/auth/login', '/auth/refresh']

// Access token kedaluwarsa (401) → perbarui lewat refresh token, lalu ulangi request sekali.
// Refresh dijalankan satu kali untuk semua request yang gagal bersamaan (lihat auth.perbarui),
// karena backend mencabut semua sesi jika refresh token yang sama dipakai dua kali.
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ConfigUlang | undefined
    const auth = useAuthStore()
    const bolehRefresh =
      error.response?.status === 401 &&
      config &&
      !config._sudahDiulang &&
      !TANPA_REFRESH.some((u) => config.url?.endsWith(u)) &&
      auth.refreshToken

    if (bolehRefresh) {
      config._sudahDiulang = true
      if (await auth.perbarui()) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`
        return http(config)
      }
    }

    if (error.response?.status === 401 && !TANPA_REFRESH.some((u) => config?.url?.endsWith(u))) {
      auth.hapusSesi()
      // Diimpor saat dibutuhkan untuk memutus siklus import
      // router → layout → store → api → http → router.
      const { default: router } = await import('@/router')
      const sekarang = router.currentRoute.value
      if (sekarang.name !== 'login') {
        router.push({ name: 'login', query: { lanjut: sekarang.fullPath, sesi: 'berakhir' } })
      }
    }
    return Promise.reject(error)
  },
)

/** Ambil pesan error yang layak ditampilkan ke pengguna (field `detail` ProblemDetails). */
export function pesanError(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.') {
  if (error instanceof AxiosError) {
    if (!error.response) return 'Tidak dapat terhubung ke server. Periksa koneksi internet.'
    const data = error.response.data as ApiError | undefined
    return data?.detail ?? data?.title ?? fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Kode status HTTP dari error axios, null jika bukan error respons. */
export function statusError(error: unknown) {
  return error instanceof AxiosError ? (error.response?.status ?? null) : null
}

/**
 * Ambil error validasi per field dari respons backend (key camelCase) lalu petakan ke
 * nama field form. Hanya field yang dikenal yang dikembalikan.
 */
export function errorPerField<K extends string>(
  error: unknown,
  fields: readonly K[],
): Partial<Record<K, string>> | null {
  if (!(error instanceof AxiosError)) return null
  const daftar = (error.response?.data as ApiError | undefined)?.errors
  if (!daftar) return null

  const hasil: Partial<Record<K, string>> = {}
  for (const [key, pesan] of Object.entries(daftar)) {
    const field = fields.find((f) => f === key.charAt(0).toLowerCase() + key.slice(1))
    if (field && pesan[0]) hasil[field] = pesan[0]
  }
  return hasil
}

/**
 * Ambil semua baris daftar berhalaman untuk tab event yang menampilkan seluruh data
 * (penugasan, budget, dokumen). Satu halaman berisi hingga 100 baris.
 */
export async function ambilSemua<T>(
  url: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const { data } = await http.get<Paged<T>>(url, { params: { pageSize: 100, ...params } })
  return data.items
}
