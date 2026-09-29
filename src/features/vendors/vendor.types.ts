import type { ListParams, Skema } from '@/api/types'

/** Baris daftar vendor (termasuk jumlah event). */
export type Vendor = Skema['VendorListDto']

export type VendorSortField = 'nama' | 'jenisJasa'
export type VendorListParams = ListParams<VendorSortField>

/** Bentuk ringkas untuk dropdown penugasan vendor ke event. */
export type VendorPilihan = Skema['VendorLookupDto']
