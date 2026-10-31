import { z } from 'zod'
import { wajib } from '@/utils/schema'

/**
 * Kata sandi wajib saat membuat pengguna. Saat edit boleh dikosongkan,
 * artinya kata sandi lama tidak diganti.
 */
export function userSchema(modeEdit: boolean) {
  const password = modeEdit
    ? z
        .string()
        .refine((v) => v === '' || v.length >= 8, 'Kata sandi minimal 8 karakter.')
        .transform((v): string | null => v || null)
    : z
        .string()
        .min(1, 'Kata sandi harus diisi.')
        .min(8, 'Kata sandi minimal 8 karakter.')
        .transform((v): string | null => v)

  return z.object({
    nama: wajib('Nama harus diisi.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email harus diisi.')
      .max(100, 'Maksimal 100 karakter.')
      .email('Format email tidak valid.')
      .transform((v) => v.toLowerCase()),
    role: z.enum(['admin', 'event_manager', 'crew'], { message: 'Peran harus dipilih.' }),
    isAktif: z.boolean(),
    password,
  })
}

export type UserFormValues = z.input<ReturnType<typeof userSchema>>
export type UserPayload = z.output<ReturnType<typeof userSchema>>
