import type { InfoStatus } from '@/components/StatusBadge.vue'
import type { Skema } from '@/api/types'

export type StatusTalentEvent = Skema['TalentStatus']

export const STATUS_TALENT_EVENT: Record<StatusTalentEvent, InfoStatus> = {
  dihubungi: { label: 'Dihubungi', warna: 'abu' },
  deal: { label: 'Deal', warna: 'biru' },
  kontrak: { label: 'Kontrak', warna: 'hijau' },
  selesai: { label: 'Selesai', warna: 'ungu' },
  batal: { label: 'Batal', warna: 'merah' },
}

export type StatusPembayaran = Skema['StatusPembayaran']

export const STATUS_PEMBAYARAN: Record<StatusPembayaran, InfoStatus> = {
  belum_bayar: { label: 'Belum bayar', warna: 'merah' },
  dp: { label: 'DP', warna: 'kuning' },
  lunas: { label: 'Lunas', warna: 'hijau' },
}

export const pilihanDari = <K extends string>(peta: Record<K, InfoStatus>) =>
  (Object.keys(peta) as K[]).map((value) => ({ value, label: peta[value].label }))

/**
 * Penugasan talent. `jadwalTampil` dikirim backend dalam UTC ("...Z"); dayjs menampilkannya
 * dalam zona waktu browser. `biayaAktual` > 0 berarti penugasan tidak bisa dihapus.
 */
export type EventTalent = Skema['EventTalentDto']

/** Penugasan crew, beserta daftar bentrok jadwal di event lain (hanya peringatan). */
export type EventCrew = Skema['EventCrewDto']

/** Pilihan PIC task dan sesi rundown: PIC event, lalu crew yang ditugaskan di event itu. */
export type PenanggungJawab = Skema['PenanggungJawabDto']

/** Transaksi vendor. `biayaAktual` > 0 berarti transaksi tidak bisa dihapus. */
export type EventVendor = Skema['EventVendorDto']

/** Penugasan yang sama-sama memakai talent/crew/vendor pada tanggal yang beririsan. */
export interface Bentrok {
  eventId: string
  namaEvent: string
  tanggalMulai: string
  tanggalSelesai: string | null
  /** Keterangan tambahan, misalnya posisi crew atau jam tampil talent. */
  keterangan: string | null
}
