/**
 * Anggaran event. Pos dari talent/vendor (terkunci) dibuat dan diubah lewat penugasan;
 * di sini hanya realisasinya yang dicatat (PATCH realisasi).
 */
import { ambilSemua, http } from '@/api/http'
import type { Skema } from '@/api/types'
import type { BudgetPayload } from './budget.schema'
import type { BudgetItem, SumberBudget } from './budget.types'

type BudgetDto = Skema['BudgetDto']

/** 0 dari backend berarti belum diisi. */
const kosongJikaNol = (n: number) => (n === 0 ? null : n)

function keItem(b: BudgetDto): BudgetItem {
  return {
    id: b.id,
    eventId: b.eventId,
    namaKebutuhan: b.namaKebutuhan,
    kategori: b.kategori,
    estimasiBiaya: b.estimasiBiaya,
    biayaAktual: kosongJikaNol(b.biayaAktual),
    sponsorship: kosongJikaNol(b.sponsorship),
    statusPembayaran: b.statusPembayaran,
    sumberTipe: b.sumberTipe as SumberBudget | null,
    sumberId: b.sumberId,
    keteranganSumber: null,
  }
}

export async function listBudgets(eventId: string): Promise<BudgetItem[]> {
  return (await ambilSemua<BudgetDto>(`/events/${eventId}/budgets`)).map(keItem)
}

/** Hanya pos manual. */
export async function createBudget(eventId: string, p: BudgetPayload): Promise<BudgetItem> {
  const isi: Skema['CreateBudgetDto'] = {
    namaKebutuhan: p.namaKebutuhan,
    kategori: p.kategori,
    estimasiBiaya: p.estimasiBiaya,
    biayaAktual: p.biayaAktual ?? 0,
    sponsorship: p.sponsorship ?? 0,
    statusPembayaran: p.statusPembayaran,
  }
  const { data } = await http.post<BudgetDto>(`/events/${eventId}/budgets`, isi)
  return keItem(data)
}

/**
 * Pos manual: ubah semua isinya (PUT). Pos terkunci: hanya realisasi (biaya aktual,
 * sponsorship, status pembayaran); untuk pos vendor, status pembayaran transaksinya ikut berubah.
 */
export async function updateBudget(
  eventId: string,
  budget: BudgetItem,
  p: BudgetPayload,
): Promise<BudgetItem> {
  if (budget.sumberTipe) {
    const realisasi: Skema['UpdateRealisasiDto'] = {
      biayaAktual: p.biayaAktual ?? 0,
      statusPembayaran: p.statusPembayaran,
      sponsorship: p.sponsorship ?? 0,
    }
    const { data } = await http.patch<BudgetDto>(
      `/events/${eventId}/budgets/${budget.id}/realisasi`,
      realisasi,
    )
    return keItem(data)
  }

  const isi: Skema['UpdateBudgetDto'] = {
    namaKebutuhan: p.namaKebutuhan,
    kategori: p.kategori,
    estimasiBiaya: p.estimasiBiaya,
    biayaAktual: p.biayaAktual ?? 0,
    sponsorship: p.sponsorship ?? 0,
    statusPembayaran: p.statusPembayaran,
  }
  const { data } = await http.put<BudgetDto>(`/events/${eventId}/budgets/${budget.id}`, isi)
  return keItem(data)
}

/** Pos terkunci ditolak backend (422); lepas penugasannya di tab Talent/Vendor. */
export async function deleteBudget(eventId: string, id: string): Promise<void> {
  await http.delete(`/events/${eventId}/budgets/${id}`)
}
