import type { Skema } from '@/api/types'

export type Peran = Skema['UserRole']

export const LABEL_PERAN: Record<Peran, string> = {
  admin: 'Admin',
  event_manager: 'Event Manager',
  crew: 'Crew',
}

/** Pengguna login: id, nama, email, role, dan crewId (data crew yang ditautkan ke akun, untuk peran crew). */
export type PenggunaAktif = Skema['AuthUserDto']

/** Respons login, refresh, dan ganti kata sandi. */
export type LoginResponse = Skema['LoginResponseDto']
