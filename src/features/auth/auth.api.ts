import { http } from '@/api/http'
import type { LoginPayload } from './auth.schema'
import type { LoginResponse, PenggunaAktif } from './auth.types'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/login', payload)
  return data
}

/** Tukar refresh token dengan pasangan token baru. Refresh token lama langsung tidak berlaku. */
export async function refresh(refreshToken: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/refresh', { refreshToken })
  return data
}

/** Cabut refresh token sesi ini di backend. */
export async function logout(refreshToken: string): Promise<void> {
  await http.post('/auth/logout', { refreshToken })
}

export async function me(): Promise<PenggunaAktif> {
  const { data } = await http.get<PenggunaAktif>('/auth/me')
  return data
}
