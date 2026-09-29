import { z } from 'zod'
import { opsional, wajib } from '@/utils/schema'

/** Isi naratif laporan. Angka total tidak diisi manual; backend yang menghitungnya. */
export const laporanSchema = z.object({
  hasilPelaksanaan: wajib('Hasil pelaksanaan harus diisi.', 3000),
  evaluasi: wajib('Evaluasi harus diisi.', 3000),
  kendala: opsional(3000),
  catatan: opsional(3000),
})

export type LaporanFormValues = z.input<typeof laporanSchema>
export type LaporanPayload = z.output<typeof laporanSchema>
