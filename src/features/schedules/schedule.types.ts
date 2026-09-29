import type { Skema } from '@/api/types'

/**
 * Sesi rundown, dengan nama event dan PIC. Jam berformat "HH:mm:ss" dari backend;
 * `diLuarRentangEvent` menandai tanggal sesi di luar tanggal event (hanya peringatan).
 */
export type ScheduleRow = Skema['ScheduleDto']

export interface ScheduleFilter {
  /** Kosong = semua event yang boleh dilihat pengguna. */
  eventId?: string
  /** Rentang tanggal "YYYY-MM-DD" (inklusif). */
  dari?: string | null
  sampai?: string | null
}

/** Sesi dikelompokkan per tanggal, urut jam. */
export interface GrupRundown {
  tanggal: string
  sesi: ScheduleRow[]
}

export function kelompokkanPerTanggal(items: ScheduleRow[]): GrupRundown[] {
  const urut = [...items].sort(
    (a, b) =>
      a.tanggal.localeCompare(b.tanggal) ||
      a.waktuMulai.localeCompare(b.waktuMulai) ||
      (a.waktuSelesai ?? '').localeCompare(b.waktuSelesai ?? ''),
  )
  const grup: GrupRundown[] = []
  for (const s of urut) {
    const terakhir = grup.at(-1)
    if (terakhir?.tanggal === s.tanggal) terakhir.sesi.push(s)
    else grup.push({ tanggal: s.tanggal, sesi: [s] })
  }
  return grup
}

/**
 * true jika sesi ini bertumpuk jam dengan sesi sebelumnya di event dan lokasi
 * yang sama. Sesi paralel di lokasi berbeda (misalnya booth dan panggung) wajar.
 * Sesi tanpa jam selesai dianggap tidak bertumpuk.
 */
export function bertumpukDenganSebelumnya(sesi: ScheduleRow[], i: number) {
  const ini = sesi[i]
  if (!ini?.lokasi) return false
  const lokasi = ini.lokasi.trim().toLowerCase()
  return sesi
    .slice(0, i)
    .some(
      (s) =>
        s.eventId === ini.eventId &&
        s.lokasi?.trim().toLowerCase() === lokasi &&
        s.waktuSelesai !== null &&
        s.waktuSelesai > ini.waktuMulai,
    )
}
