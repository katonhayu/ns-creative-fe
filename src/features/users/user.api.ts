import { http } from '@/api/http'
import type { CrudApi, Paged } from '@/api/types'
import type { Peran } from '@/features/auth/auth.types'
import type { UserPayload } from './user.schema'
import type { User, UserListParams, UserPilihan, UserSortField } from './user.types'

export async function listUsers(params: UserListParams): Promise<Paged<User>> {
  const { data } = await http.get<Paged<User>>('/users', { params })
  return data
}

/** Pengguna aktif untuk dropdown (maksimal 50), bisa dibatasi per peran. */
export async function listPilihanUser(peran?: Peran[], search = ''): Promise<UserPilihan[]> {
  const { data } = await http.get<UserPilihan[]>('/users/lookup', {
    params: { role: peran, search },
  })
  return data
}

export async function createUser(payload: UserPayload): Promise<User> {
  const { data } = await http.post<User>('/users', {
    nama: payload.nama,
    email: payload.email,
    role: payload.role,
    password: payload.password ?? '',
  })
  // Akun baru selalu aktif; status nonaktif dari form langsung diterapkan.
  return payload.isAktif ? data : ubahStatus(data.id, false)
}

/**
 * Form edit menyimpan sekaligus nama/email/peran, status aktif, dan kata sandi baru.
 * Di backend ketiganya endpoint terpisah, jadi dipanggil berurutan.
 */
export async function updateUser(id: string, payload: UserPayload): Promise<User> {
  await http.put(`/users/${id}`, { nama: payload.nama, email: payload.email, role: payload.role })
  const hasil = await ubahStatus(id, payload.isAktif)
  if (payload.password) {
    await http.post(`/users/${id}/reset-password`, { passwordBaru: payload.password })
  }
  return hasil
}

async function ubahStatus(id: string, isAktif: boolean): Promise<User> {
  const { data } = await http.patch<User>(`/users/${id}/status`, { isAktif })
  return data
}

export const userApi: CrudApi<User, UserPayload, UserSortField> = {
  list: listUsers,
  create: createUser,
  update: updateUser,
  // Pengguna tidak dihapus dari halaman ini, hanya dinonaktifkan lewat form edit.
  remove: () =>
    Promise.reject(new Error('Pengguna tidak bisa dihapus. Nonaktifkan lewat form edit.')),
}
