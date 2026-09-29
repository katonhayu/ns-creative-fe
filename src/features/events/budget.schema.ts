import { z } from 'zod'
import { wajib, wajibRupiah } from '@/utils/schema'

const rupiahOpsional = z.number().min(0, 'Nominal tidak boleh negatif.').nullable()

export const budgetSchema = z.object({
  namaKebutuhan: wajib('Nama kebutuhan harus diisi.', 200),
  kategori: wajib('Kategori harus diisi.', 50),
  estimasiBiaya: wajibRupiah('Estimasi biaya harus diisi.'),
  biayaAktual: rupiahOpsional,
  sponsorship: rupiahOpsional,
  statusPembayaran: z.enum(['belum_bayar', 'dp', 'lunas']),
})

export type BudgetFormValues = z.input<typeof budgetSchema>
export type BudgetPayload = z.output<typeof budgetSchema>
