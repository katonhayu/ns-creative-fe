import dayjs from 'dayjs'
import { z } from 'zod'
import { isoTanggal } from '@/utils/format'
import { opsional, wajib, wajibPilih, wajibTanggal } from '@/utils/schema'

/** Saran jenis event di dropdown. Kolomnya teks bebas. */
export const SARAN_JENIS_EVENT = [
  'Corporate Event',
  'Gathering',
  'Launching Produk',
  'Seminar',
  'Konser',
  'Festival',
  'Pameran',
  'Wedding',
  'Wisuda',
  'Acara Pemerintahan',
]

export const eventSchema = z
  .object({
    nama: wajib('Nama event harus diisi.', 150),
    clientId: wajibPilih('Client harus dipilih.'),
    picCrewId: wajibPilih('PIC harus dipilih.'),
    jenis: wajib('Jenis event harus diisi.', 50),
    tanggalMulai: wajibTanggal('Tanggal mulai harus diisi.'),
    tanggalSelesai: wajibTanggal('Tanggal selesai harus diisi.'),
    lokasi: wajib('Lokasi harus diisi.', 200),
    deskripsi: opsional(2000),
    status: z.enum([
      'draft',
      'perencanaan',
      'dikonfirmasi',
      'berlangsung',
      'selesai',
      'dibatalkan',
    ]),
  })
  .superRefine((v, ctx) => {
    if (dayjs(v.tanggalSelesai).isBefore(v.tanggalMulai, 'day')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tanggalSelesai'],
        message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
      })
    }
  })
  .transform((v) => ({
    ...v,
    tanggalMulai: isoTanggal(v.tanggalMulai),
    tanggalSelesai: isoTanggal(v.tanggalSelesai),
  }))

export type EventFormValues = z.input<typeof eventSchema>
export type EventPayload = z.output<typeof eventSchema>
