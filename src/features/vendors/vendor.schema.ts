import { z } from 'zod'
import { opsional, telepon, wajib } from '@/utils/schema'

/** Saran jenis jasa di dropdown. Kolomnya teks bebas. */
export const SARAN_JENIS_JASA = [
  'Sound & Lighting',
  'Catering',
  'Dokumentasi',
  'Tenda & Dekorasi',
  'Dekorasi Bunga',
  'Panggung & Rigging',
  'LED Screen',
  'Transportasi',
  'Genset',
  'Merchandise',
]

export const vendorSchema = z.object({
  nama: wajib('Nama vendor harus diisi.'),
  jenisJasa: wajib('Jenis jasa harus diisi.', 50),
  contactPerson: opsional(100),
  telepon: telepon(),
})

export type VendorFormValues = z.input<typeof vendorSchema>
export type VendorPayload = z.output<typeof vendorSchema>
