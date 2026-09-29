import { http } from '@/api/http'
import type { Dashboard } from './dashboard.types'

/** Task dianggap mendekati deadline jika tenggatnya dalam 7 hari ke depan atau sudah lewat (sama dengan backend). */
export const HARI_DEADLINE = 7

/** Ringkasan halaman depan. Untuk pic, backend hanya menghitung event miliknya. */
export async function getDashboard(): Promise<Dashboard> {
  const { data } = await http.get<Dashboard>('/dashboard')
  return data
}
