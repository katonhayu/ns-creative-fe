import { AxiosError } from 'axios'
import { http, statusError } from '@/api/http'
import { namaFileDariHeader, simpanBlob } from '@/utils/file'
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

/** Event selesai yang terlihat oleh pengguna (crew: yang ia pegang atau tempat ia ditugaskan) beserta status laporannya. */
export async function listLaporan(): Promise<LaporanRow[]> {
  const { data } = await http.get<LaporanRow[]>('/reports/events')
  return data
}

/**
 * Filter rekap PDF. Periode "YYYY-MM-DD" (inklusif) dicocokkan dengan tanggal selesai event;
 * null = tanpa batas.
 */
export interface FilterRekapPdf {
  dari: string | null
  sampai: string | null
  /** true = sudah dibuat, false = belum dibuat, null = semua. */
  sudahDibuat: boolean | null
}

/**
 * Ambil PDF lalu simpan lewat unduhan browser. Nama file dari server (Content-Disposition).
 * Saat gagal, badan error ikut terbaca sebagai blob; diubah kembali ke JSON supaya
 * `pesanError` bisa menampilkan pesan dari backend.
 */
async function unduhPdf(url: string, cadangan: string, params?: Record<string, unknown>) {
  try {
    const res = await http.get<Blob>(url, { params, responseType: 'blob' })
    simpanBlob(res.data, namaFileDariHeader(res.headers['content-disposition']) ?? cadangan)
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        // Bukan JSON; biarkan pesanError memakai pesan cadangan.
      }
    }
    throw error
  }
}

/** PDF laporan pertanggungjawaban satu event. Backend menolak 404 jika laporan belum dibuat. */
export function unduhPdfLaporan(eventId: string, namaEvent: string) {
  return unduhPdf(`/events/${eventId}/report/pdf`, `Laporan ${namaEvent}.pdf`)
}

/** PDF rekap event selesai pada satu periode. Crew hanya mendapat event yang terlihat olehnya. */
export function unduhPdfRekap(filter: FilterRekapPdf) {
  return unduhPdf('/reports/rekap/pdf', 'Rekap Laporan.pdf', {
    dariTanggal: filter.dari ?? undefined,
    sampaiTanggal: filter.sampai ?? undefined,
    sudahDibuat: filter.sudahDibuat ?? undefined,
  })
}
