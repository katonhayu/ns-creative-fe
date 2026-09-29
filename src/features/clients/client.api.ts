import { http } from '@/api/http'
import type { CrudApi, Paged } from '@/api/types'
import type { ClientPayload } from './client.schema'
import type { Client, ClientListParams, ClientPilihan, ClientSortField } from './client.types'

export async function listClients(params: ClientListParams): Promise<Paged<Client>> {
  const { data } = await http.get<Paged<Client>>('/clients', { params })
  return data
}

/** Pilihan client untuk dropdown (maksimal 50, dicari di server). */
export async function listPilihanClient(search = ''): Promise<ClientPilihan[]> {
  const { data } = await http.get<ClientPilihan[]>('/clients/lookup', { params: { search } })
  return data
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const { data } = await http.post<Client>('/clients', payload)
  return data
}

export async function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  const { data } = await http.put<Client>(`/clients/${id}`, payload)
  return data
}

export async function deleteClient(id: string): Promise<void> {
  await http.delete(`/clients/${id}`)
}

export const clientApi: CrudApi<Client, ClientPayload, ClientSortField> = {
  list: listClients,
  create: createClient,
  update: updateClient,
  remove: deleteClient,
}
