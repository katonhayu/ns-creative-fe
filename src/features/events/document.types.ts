import { ekstensi } from '@/utils/file'

export interface Dokumen {
  id: string
  eventId: string
  namaDokumen: string
  jenis: string
  /** "YYYY-MM-DD" */
  tanggal: string
  /** Nama file saat diunduh (nama dokumen + ekstensi). Di server file disimpan dengan nama acak. */
  namaFile: string
  tipeFile: string
  /** Ukuran dalam byte. */
  ukuran: number
  keterangan: string | null
}

/** Saran jenis dokumen di dropdown. Kolomnya teks bebas. */
export const SARAN_JENIS_DOKUMEN = [
  'Kontrak',
  'Proposal',
  'Penawaran',
  'Invoice',
  'Kwitansi',
  'Rundown',
  'Desain',
  'Foto',
  'Perizinan',
  'Lainnya',
]

/** Batas upload, sama dengan aturan backend. */
export const MAKS_UKURAN = 10 * 1024 * 1024
export const EKSTENSI_DIIZINKAN = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']
export const ACCEPT_INPUT = EKSTENSI_DIIZINKAN.map((e) => `.${e}`).join(',')

export type JenisPratinjau = 'gambar' | 'pdf' | null

/** Hanya gambar dan PDF yang bisa dipratinjau langsung di browser. */
export function jenisPratinjau(d: Pick<Dokumen, 'namaFile'>): JenisPratinjau {
  const ext = ekstensi(d.namaFile)
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'gambar'
  if (ext === 'pdf') return 'pdf'
  return null
}

/** Ikon PrimeIcons sesuai tipe file. */
export function ikonFile(namaFile: string) {
  const ext = ekstensi(namaFile)
  if (ext === 'pdf') return 'pi-file-pdf'
  if (['doc', 'docx'].includes(ext)) return 'pi-file-word'
  if (['xls', 'xlsx'].includes(ext)) return 'pi-file-excel'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'pi-image'
  return 'pi-file'
}

/** Alasan file ditolak sebelum diunggah. null = boleh. */
export function alasanFileDitolak(file: File): string | null {
  if (!EKSTENSI_DIIZINKAN.includes(ekstensi(file.name))) {
    return 'Tipe file tidak didukung. Gunakan PDF, Word, Excel, JPG, atau PNG.'
  }
  if (file.size > MAKS_UKURAN) return 'Ukuran file melebihi 10 MB.'
  if (file.size === 0) return 'File kosong.'
  return null
}

/** Tebak jenis dokumen dari nama file, sebagai isian awal. */
export function tebakJenis(namaFile: string) {
  const n = namaFile.toLowerCase()
  if (/kontrak|perjanjian|mou|spk/.test(n)) return 'Kontrak'
  if (/proposal/.test(n)) return 'Proposal'
  if (/penawaran|quotation|rab/.test(n)) return 'Penawaran'
  if (/invoice|faktur|tagihan/.test(n)) return 'Invoice'
  if (/kwitansi|bukti|transfer/.test(n)) return 'Kwitansi'
  if (/rundown|susunan/.test(n)) return 'Rundown'
  if (/izin|perizinan/.test(n)) return 'Perizinan'
  if (/desain|layout|denah|backdrop/.test(n)) return 'Desain'
  if (['jpg', 'jpeg', 'png'].includes(ekstensi(n))) return 'Foto'
  return 'Lainnya'
}
