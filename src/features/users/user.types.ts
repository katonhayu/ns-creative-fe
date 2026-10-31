import type { InfoStatus } from '@/components/StatusBadge.vue'
import type { ListParams, Skema } from '@/api/types'
import { LABEL_PERAN, type Peran } from '@/features/auth/auth.types'

/** Baris daftar pengguna (termasuk jumlah event yang dipegang crew miliknya sebagai PIC). */
export type User = Skema['UserListDto']

export type UserSortField = 'nama' | 'email' | 'role'
export type UserListParams = ListParams<UserSortField>

/** Bentuk ringkas untuk dropdown (akun login yang ditautkan ke data crew). */
export type UserPilihan = Skema['UserLookupDto']

export const STATUS_PERAN: Record<Peran, InfoStatus> = {
  admin: { label: LABEL_PERAN.admin, warna: 'ungu' },
  event_manager: { label: LABEL_PERAN.event_manager, warna: 'biru' },
  crew: { label: LABEL_PERAN.crew, warna: 'abu' },
}

export const PILIHAN_PERAN: { value: Peran; label: string; keterangan: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    keterangan: 'Kelola semua modul dan semua event, termasuk data master dan pengguna.',
  },
  {
    value: 'event_manager',
    label: 'Event Manager',
    keterangan: 'Melihat semua menu dan semua event, termasuk fee dan budget, tanpa bisa mengubah.',
  },
  {
    value: 'crew',
    label: 'Crew',
    keterangan:
      'Kelola event yang dia buat (otomatis jadi PIC). Event lain tempat dia ditugaskan hanya bisa dilihat. Tautkan akun ini ke data crew di menu Crew.',
  },
]
