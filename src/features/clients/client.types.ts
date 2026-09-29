import type { ListParams, Skema } from '@/api/types'

/** Baris daftar client (termasuk jumlah event). */
export type Client = Skema['ClientListDto']

export type ClientSortField = 'nama' | 'perusahaan'

export type ClientListParams = ListParams<ClientSortField>

/** Bentuk ringkas untuk dropdown pilihan client. */
export type ClientPilihan = Skema['ClientLookupDto']
