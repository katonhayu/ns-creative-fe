import type { ListParams, Skema } from '@/api/types'

/** Baris daftar crew, termasuk email akun yang ditautkan dan jumlah event. */
export type CrewRow = Skema['CrewListDto']

export type CrewSortField = 'nama' | 'keahlian'
export type CrewListParams = ListParams<CrewSortField>

/** Bentuk ringkas untuk dropdown penugasan crew ke event. */
export type CrewPilihan = Skema['CrewLookupDto']
