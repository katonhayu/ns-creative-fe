import { http, statusError } from '@/api/http'
import type { LaporanPayload } from './report.schema'
import type { Laporan, LaporanRow } from './report.types'

/** Laporan event. null jika belum dibuat (backend mengembalikan 404). */
export async function getLaporan(eventId: string): Promise<Laporan | null> {
  try {
    const { data } = await http.get<Laporan>(`/events/${eventId}/report`)
    return data
  } catch (error) {
    if (statusError(error) === 404) return null
    throw error
  }
}

/**
 * Buat laporan. Backend menolak (422) jika event belum selesai atau laporan sudah ada,
 * lalu membekukan total pengeluaran dari biaya aktual budget saat ini.
 */
export async function buatLaporan(eventId: string, payload: LaporanPayload): Promise<Laporan> {
  const { data } = await http.post<Laporan>(`/events/${eventId}/report`, payload)
  return data
}

/** Ubah isi naratif. Total pengeluaran tidak ikut berubah. */
export async function updateLaporan(eventId: string, payload: LaporanPayload): Promise<Laporan> {
  const { data } = await http.put<Laporan>(`/events/${eventId}/report`, payload)
  return data
}

/** Event selesai yang terlihat oleh pengguna (pic: miliknya) beserta status laporannya. */
export async function listLaporan(): Promise<LaporanRow[]> {
  const { data } = await http.get<LaporanRow[]>('/reports/events')
  return data
}
