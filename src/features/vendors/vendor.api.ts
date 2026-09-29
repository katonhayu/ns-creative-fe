import { http } from '@/api/http'
import type { CrudApi, Paged } from '@/api/types'
import type { VendorPayload } from './vendor.schema'
import type { Vendor, VendorListParams, VendorPilihan, VendorSortField } from './vendor.types'

export async function listVendors(params: VendorListParams): Promise<Paged<Vendor>> {
  const { data } = await http.get<Paged<Vendor>>('/vendors', { params })
  return data
}

/** Pilihan vendor untuk dropdown penugasan (maksimal 50, dicari di server). */
export async function listPilihanVendor(search = ''): Promise<VendorPilihan[]> {
  const { data } = await http.get<VendorPilihan[]>('/vendors/lookup', { params: { search } })
  return data
}

export async function createVendor(payload: VendorPayload): Promise<Vendor> {
  const { data } = await http.post<Vendor>('/vendors', payload)
  return data
}

export async function updateVendor(id: string, payload: VendorPayload): Promise<Vendor> {
  const { data } = await http.put<Vendor>(`/vendors/${id}`, payload)
  return data
}

export async function deleteVendor(id: string): Promise<void> {
  await http.delete(`/vendors/${id}`)
}

export const vendorApi: CrudApi<Vendor, VendorPayload, VendorSortField> = {
  list: listVendors,
  create: createVendor,
  update: updateVendor,
  remove: deleteVendor,
}
