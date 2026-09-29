import type { Skema } from '@/api/types'

/**
 * Laporan evaluasi satu event (satu per event). `totalPengeluaran` adalah snapshot biaya
 * aktual saat laporan dibuat dan tidak ikut berubah; `totalAktualSaatIni` pembandingnya.
 */
export type Laporan = Skema['ReportDto']

/** Baris halaman Laporan: event yang sudah selesai beserta laporannya (null jika belum dibuat). */
export type LaporanRow = Skema['LaporanEventDto']
