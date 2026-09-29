import type { ListParams, Skema } from '@/api/types'

/** Baris daftar talent (termasuk jumlah event). */
export type Talent = Skema['TalentListDto']

export type TalentSortField = 'nama' | 'jenis' | 'feeStandar'
export type TalentListParams = ListParams<TalentSortField>

/** Bentuk ringkas untuk dropdown penugasan talent ke event. */
export type TalentPilihan = Skema['TalentLookupDto']
