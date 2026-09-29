import type { InfoStatus } from '@/components/StatusBadge.vue'
import type { ListParams, Skema } from '@/api/types'
import { LABEL_PERAN, type Peran } from '@/features/auth/auth.types'

/** Baris daftar pengguna (termasuk jumlah event yang dia pegang sebagai PIC). */
export type User = Skema['UserListDto']

export type UserSortField = 'nama' | 'email' | 'role'
export type UserListParams = ListParams<UserSortField>

/** Bentuk ringkas untuk dropdown (PIC event, akun crew). */
export type UserPilihan = Skema['UserLookupDto']

export const STATUS_PERAN: Record<Peran, InfoStatus> = {
  admin: { label: LABEL_PERAN.admin, warna: 'ungu' },
  pic: { label: LABEL_PERAN.pic, warna: 'biru' },
  crew: { label: LABEL_PERAN.crew, warna: 'abu' },
}

export const PILIHAN_PERAN: { value: Peran; label: string; keterangan: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    keterangan: 'Semua modul dan semua event, termasuk fee dan budget.',
  },
  {
    value: 'pic',
    label: 'PIC',
    keterangan: 'Akses penuh, tapi hanya untuk event yang dia pegang.',
  },
  {
    value: 'crew',
    label: 'Crew',
    keterangan: 'Hanya rundown dan task miliknya. Tidak melihat fee dan budget.',
  },
]
