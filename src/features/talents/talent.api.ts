import { http } from '@/api/http'
import type { CrudApi, Paged } from '@/api/types'
import type { TalentPayload } from './talent.schema'
import type { Talent, TalentListParams, TalentPilihan, TalentSortField } from './talent.types'

export async function listTalents(params: TalentListParams): Promise<Paged<Talent>> {
  const { data } = await http.get<Paged<Talent>>('/talents', { params })
  return data
}

/** Pilihan talent untuk dropdown penugasan (maksimal 50, dicari di server). */
export async function listPilihanTalent(search = ''): Promise<TalentPilihan[]> {
  const { data } = await http.get<TalentPilihan[]>('/talents/lookup', { params: { search } })
  return data
}

export async function createTalent(payload: TalentPayload): Promise<Talent> {
  const { data } = await http.post<Talent>('/talents', payload)
  return data
}

export async function updateTalent(id: string, payload: TalentPayload): Promise<Talent> {
  const { data } = await http.put<Talent>(`/talents/${id}`, payload)
  return data
}

export async function deleteTalent(id: string): Promise<void> {
  await http.delete(`/talents/${id}`)
}

export const talentApi: CrudApi<Talent, TalentPayload, TalentSortField> = {
  list: listTalents,
  create: createTalent,
  update: updateTalent,
  remove: deleteTalent,
}
