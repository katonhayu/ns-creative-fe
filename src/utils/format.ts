import dayjs from 'dayjs'

/** Dua huruf awal nama untuk avatar, misalnya "Rizal Pratama" → "RP". */
export function inisial(nama: string) {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k.charAt(0).toUpperCase())
    .join('')
}

const formatAngka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/** Rupiah dengan pemisah ribuan titik, tanpa desimal: "Rp 15.000.000". */
export function rupiah(nilai: number | null | undefined) {
  return nilai === null || nilai === undefined ? '—' : `Rp ${formatAngka.format(nilai)}`
}

/** Format tanggal tampilan: "20 Des 2026". */
export function tanggal(nilai: string | Date | null | undefined) {
  return nilai ? dayjs(nilai).format('DD MMM YYYY') : '—'
}

/** Tanggal dan jam: "20 Des 2026, 19.30". */
export function tanggalJam(nilai: string | Date | null | undefined) {
  return nilai ? dayjs(nilai).format('DD MMM YYYY, HH.mm') : '—'
}

/**
 * Rentang tanggal yang ringkas:
 * satu hari (atau tanggal selesai kosong) → "20 Des 2026", bulan sama → "20–22 Des 2026",
 * tahun sama → "30 Nov – 2 Des 2026", selain itu tanggal lengkap keduanya.
 */
export function rentangTanggal(mulai: string, selesai: string | null) {
  const a = dayjs(mulai)
  const b = dayjs(selesai ?? mulai)
  if (a.isSame(b, 'day')) return a.format('DD MMM YYYY')
  if (a.isSame(b, 'month')) return `${a.format('DD')}–${b.format('DD MMM YYYY')}`
  if (a.isSame(b, 'year')) return `${a.format('DD MMM')} – ${b.format('DD MMM YYYY')}`
  return `${a.format('DD MMM YYYY')} – ${b.format('DD MMM YYYY')}`
}

/** Tanggal ke string ISO tanpa jam untuk payload: "2026-12-20". */
export function isoTanggal(nilai: Date) {
  return dayjs(nilai).format('YYYY-MM-DD')
}

/** Tanggal dan jam ke string ISO lokal untuk payload: "2026-12-20T19:30". */
export function isoTanggalJam(nilai: Date) {
  return dayjs(nilai).format('YYYY-MM-DDTHH:mm')
}

/** Jam dari backend ("19:30:00" atau "19:30") untuk tampilan: "19.30". Kosong → "—". */
export function jam(nilai: string | null | undefined) {
  return nilai ? nilai.slice(0, 5).replace(':', '.') : '—'
}
