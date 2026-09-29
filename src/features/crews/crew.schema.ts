import { z } from 'zod'
import { telepon, wajib } from '@/utils/schema'

/** Saran keahlian di dropdown. Kolomnya teks bebas. */
export const SARAN_KEAHLIAN = [
  'Stage Manager',
  'Floor Director',
  'Sound Engineer',
  'Lighting',
  'Rigging',
  'Liaison Officer',
  'Registrasi & Usher',
  'Runner',
  'Logistik',
  'Driver',
  'Videografer',
  'Makeup Artist',
]

export const crewSchema = z.object({
  /** Akun pengguna yang ditautkan (peran crew). Kosong jika crew tidak login ke aplikasi. */
  userId: z.string().nullable(),
  nama: wajib('Nama crew harus diisi.'),
  telepon: telepon(),
  keahlian: wajib('Keahlian harus diisi.', 100),
})

export type CrewFormValues = z.input<typeof crewSchema>
export type CrewPayload = z.output<typeof crewSchema>
