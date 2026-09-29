import { z } from 'zod'
import { isoTanggal } from '@/utils/format'
import { opsional, wajib, wajibTanggal } from '@/utils/schema'

/** Metadata dokumen. File-nya sendiri divalidasi terpisah (tipe dan ukuran). */
export const dokumenSchema = z.object({
  namaDokumen: wajib('Nama dokumen harus diisi.', 200),
  jenis: wajib('Jenis dokumen harus diisi.', 50),
  tanggal: wajibTanggal('Tanggal harus diisi.').transform(isoTanggal),
  keterangan: opsional(500),
})

export type DokumenFormValues = z.input<typeof dokumenSchema>
export type DokumenPayload = z.output<typeof dokumenSchema>
