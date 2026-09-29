import type { StatusPembayaran } from './penugasan.types'

export type SumberBudget = 'event_talent' | 'event_vendor'

export const LABEL_SUMBER: Record<SumberBudget, { label: string; tab: string }> = {
  event_talent: { label: 'Dari talent', tab: 'talent' },
  event_vendor: { label: 'Dari vendor', tab: 'vendor' },
}

/** Saran kategori di dropdown. Kolomnya teks bebas. */
export const SARAN_KATEGORI_BUDGET = [
  'Venue',
  'Konsumsi',
  'Transportasi',
  'Akomodasi',
  'Dekorasi',
  'Produksi',
  'Perizinan',
  'Promosi',
  'Lain-lain',
]

/**
 * Pos budget untuk tampilan. Backend menyimpan 0 untuk biaya aktual dan sponsorship yang
 * belum diisi; di sini 0 dipetakan ke null supaya "belum terealisasi" bisa dibedakan.
 */
export interface BudgetItem {
  id: string
  eventId: string
  namaKebutuhan: string
  kategori: string
  estimasiBiaya: number
  /** null = belum ada realisasi. */
  biayaAktual: number | null
  sponsorship: number | null
  statusPembayaran: StatusPembayaran
  /** Pos otomatis dari penugasan talent/vendor. null = pos manual. */
  sumberTipe: SumberBudget | null
  sumberId: string | null
  /** Status penugasan asal, misalnya "Kontrak" atau "Batal". Belum dikirim backend. */
  keteranganSumber: string | null
}

/**
 * Selisih = estimasi − aktual, dihitung di frontend (tidak disimpan).
 * Positif = hemat, negatif = melebihi estimasi, null = belum terealisasi.
 */
export function selisih(b: Pick<BudgetItem, 'estimasiBiaya' | 'biayaAktual'>) {
  return b.biayaAktual === null ? null : b.estimasiBiaya - b.biayaAktual
}

export function melebihiEstimasi(b: Pick<BudgetItem, 'estimasiBiaya' | 'biayaAktual'>) {
  return b.biayaAktual !== null && b.biayaAktual > b.estimasiBiaya
}

export interface TotalBudget {
  estimasi: number
  aktual: number
  /** Selisih total, hanya dari pos yang sudah punya biaya aktual. */
  selisih: number
  sponsorship: number
  jumlahTerealisasi: number
  jumlahMelebihi: number
  jumlahBelumLunas: number
}

export function hitungTotal(items: BudgetItem[]): TotalBudget {
  const t: TotalBudget = {
    estimasi: 0,
    aktual: 0,
    selisih: 0,
    sponsorship: 0,
    jumlahTerealisasi: 0,
    jumlahMelebihi: 0,
    jumlahBelumLunas: 0,
  }
  for (const b of items) {
    t.estimasi += b.estimasiBiaya
    t.sponsorship += b.sponsorship ?? 0
    if (b.statusPembayaran !== 'lunas') t.jumlahBelumLunas++
    const s = selisih(b)
    if (s !== null) {
      t.aktual += b.biayaAktual ?? 0
      t.selisih += s
      t.jumlahTerealisasi++
    }
    if (melebihiEstimasi(b)) t.jumlahMelebihi++
  }
  return t
}
