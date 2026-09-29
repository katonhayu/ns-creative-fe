import { http } from '@/api/http'
import type { CrudApi, Paged } from '@/api/types'
import type { CrewPayload } from './crew.schema'
import type { CrewListParams, CrewPilihan, CrewRow, CrewSortField } from './crew.types'

export async function listCrews(params: CrewListParams): Promise<Paged<CrewRow>> {
  const { data } = await http.get<Paged<CrewRow>>('/crews', { params })
  return data
}

/** Pilihan crew untuk dropdown penugasan (maksimal 50, dicari di server). */
export async function listPilihanCrew(search = ''): Promise<CrewPilihan[]> {
  const { data } = await http.get<CrewPilihan[]>('/crews/lookup', { params: { search } })
  return data
}

export async function createCrew(payload: CrewPayload): Promise<CrewRow> {
  const { data } = await http.post<CrewRow>('/crews', payload)
  return data
}

export async function updateCrew(id: string, payload: CrewPayload): Promise<CrewRow> {
  const { data } = await http.put<CrewRow>(`/crews/${id}`, payload)
  return data
}

export async function deleteCrew(id: string): Promise<void> {
  await http.delete(`/crews/${id}`)
}

export const crewApi: CrudApi<CrewRow, CrewPayload, CrewSortField> = {
  list: listCrews,
  create: createCrew,
  update: updateCrew,
  remove: deleteCrew,
}
