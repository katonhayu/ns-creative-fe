import { z } from 'zod'
import { isoTanggal } from '@/utils/format'
import { opsional, wajib, wajibPilih, wajibTanggal } from '@/utils/schema'

export const taskSchema = z.object({
  namaTugas: wajib('Nama tugas harus diisi.', 200),
  picUserId: wajibPilih('PIC tugas harus dipilih.'),
  deadline: wajibTanggal('Deadline harus diisi.').transform(isoTanggal),
  // Terlambat tidak bisa dipilih: dihitung backend dari deadline.
  status: z.enum(['belum', 'dikerjakan', 'selesai']),
  deskripsi: opsional(1000),
  catatan: opsional(1000),
})

export type TaskFormValues = z.input<typeof taskSchema>
export type TaskPayload = z.output<typeof taskSchema>
