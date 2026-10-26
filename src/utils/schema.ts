import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

/**
 * Pengganti toTypedSchema untuk useForm. Bawaan vee-validate memanggil `cast`
 * (= zod parse lengkap dengan transform) setiap useForm/resetForm menerima
 * nilai awal. Saat edit data yang valid, transform ikut jalan sehingga Date di
 * form berubah jadi string "2026-12-18" dan DatePicker crash. Transform cukup
 * dijalankan saat submit, jadi cast dimatikan.
 */
export function skemaForm<T extends z.ZodTypeAny>(skema: T) {
  return { ...toTypedSchema(skema), cast: undefined }
}

/** Teks wajib diisi, dipangkas spasinya. */
export const wajib = (pesan: string, maks = 100) =>
  z.string().trim().min(1, pesan).max(maks, `Maksimal ${maks} karakter.`)

/** Teks opsional: kosong dikirim ke backend sebagai null. */
export const opsional = (maks: number) =>
  z
    .string()
    .trim()
    .max(maks, `Maksimal ${maks} karakter.`)
    .transform((v) => v || null)

/** Nomor telepon Indonesia, boleh memakai spasi atau tanda strip. */
export const telepon = () =>
  z
    .string()
    .trim()
    .min(1, 'Nomor telepon harus diisi.')
    .regex(/^(\+62|0)[0-9\s-]{7,16}$/, 'Nomor telepon tidak valid. Contoh: 0812-3456-7890.')

/**
 * Nilai wajib dari komponen yang bisa bernilai null (InputNumber, Select,
 * DatePicker). Input form boleh null, output setelah validasi dijamin terisi.
 */
export function wajibNilai<T extends z.ZodTypeAny>(skema: T, pesan: string) {
  return skema.nullable().transform((v, ctx): z.output<T> => {
    if (v === null || v === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: pesan })
      return z.NEVER
    }
    return v
  })
}

/** Angka rupiah wajib, tidak boleh negatif. */
export const wajibRupiah = (pesan: string) =>
  wajibNilai(z.number().min(0, 'Nominal tidak boleh negatif.'), pesan)

/** id (Guid) pilihan dropdown yang wajib dipilih. */
export const wajibPilih = (pesan: string) => wajibNilai(z.string(), pesan)

/** Tanggal wajib dari DatePicker. */
export const wajibTanggal = (pesan: string) => wajibNilai(z.date(), pesan)
