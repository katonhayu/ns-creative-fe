import { z } from 'zod'
import { opsional, telepon, wajib } from '@/utils/schema'

export const clientSchema = z.object({
  nama: wajib('Nama harus diisi.'),
  perusahaan: opsional(100),
  telepon: telepon(),
  email: z
    .string()
    .trim()
    .max(100, 'Maksimal 100 karakter.')
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Format email tidak valid.')
    .transform((v) => v || null),
  alamat: opsional(255),
})

/** Nilai mentah di form (semua string). */
export type ClientFormValues = z.input<typeof clientSchema>
/** Payload yang dikirim ke backend setelah divalidasi. */
export type ClientPayload = z.output<typeof clientSchema>
