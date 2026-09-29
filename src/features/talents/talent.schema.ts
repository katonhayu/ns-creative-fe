import { z } from 'zod'
import { opsional, telepon, wajib, wajibRupiah } from '@/utils/schema'

/** Saran jenis talent di dropdown. Kolomnya teks bebas, jadi jenis lain tetap bisa diketik. */
export const SARAN_JENIS_TALENT = [
  'MC',
  'Penyanyi',
  'Band',
  'DJ',
  'Akustik',
  'Orkestra',
  'Penari',
  'Model',
  'Komika',
  'Pesulap',
]

export const talentSchema = z.object({
  nama: wajib('Nama talent harus diisi.'),
  jenis: wajib('Jenis talent harus diisi.', 50),
  contactPerson: opsional(100),
  telepon: telepon(),
  feeStandar: wajibRupiah('Fee standar harus diisi.'),
  riderDefault: opsional(1000),
})

export type TalentFormValues = z.input<typeof talentSchema>
export type TalentPayload = z.output<typeof talentSchema>
