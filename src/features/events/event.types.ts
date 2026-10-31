import type { InfoStatus } from '@/components/StatusBadge.vue'
import type { ListParams, Skema } from '@/api/types'

export type StatusEvent = Skema['EventStatus']

export const STATUS_EVENT: Record<StatusEvent, InfoStatus> = {
  draft: { label: 'Draft', warna: 'abu' },
  perencanaan: { label: 'Perencanaan', warna: 'kuning' },
  dikonfirmasi: { label: 'Dikonfirmasi', warna: 'hijau' },
  berlangsung: { label: 'Berlangsung', warna: 'biru' },
  selesai: { label: 'Selesai', warna: 'ungu' },
  dibatalkan: { label: 'Dibatalkan', warna: 'merah' },
}

export const PILIHAN_STATUS_EVENT = (Object.keys(STATUS_EVENT) as StatusEvent[]).map((value) => ({
  value,
  label: STATUS_EVENT[value].label,
}))

/**
 * Transisi status yang sah, sama dengan aturan backend (yang tetap menjadi penentu).
 * Dipakai untuk membatasi pilihan status di form edit.
 */
export const TRANSISI_STATUS: Record<StatusEvent, StatusEvent[]> = {
  draft: ['perencanaan', 'dibatalkan'],
  perencanaan: ['dikonfirmasi', 'dibatalkan'],
  dikonfirmasi: ['berlangsung', 'dibatalkan'],
  berlangsung: ['selesai'],
  selesai: [],
  dibatalkan: [],
}

/** Event hanya boleh dihapus selama belum berjalan. Selain itu, batalkan saja. */
export const STATUS_BOLEH_HAPUS: StatusEvent[] = ['draft', 'dibatalkan']

/** Event selesai/dibatalkan: talent, crew, vendor, jadwal, task, dan budget tidak bisa diubah. */
export const STATUS_TERKUNCI: StatusEvent[] = ['selesai', 'dibatalkan']

/** Baris daftar event, dengan nama client dan PIC. Tanggal berformat "YYYY-MM-DD". */
export type EventRow = Skema['EventListDto']

/** Field event yang dibutuhkan form edit, sama di baris daftar maupun detail. */
export type EventItem = Pick<
  EventRow,
  | 'id'
  | 'nama'
  | 'jenis'
  | 'tanggalMulai'
  | 'tanggalSelesai'
  | 'lokasi'
  | 'deskripsi'
  | 'status'
  | 'clientId'
  | 'namaClient'
  | 'perusahaanClient'
  | 'picCrewId'
  | 'namaPic'
>

/** Detail event: kontak client, email PIC, dan status berikutnya yang diizinkan. */
export type EventDetail = Skema['EventDto']

export type EventSortField = 'tanggalMulai' | 'nama' | 'status'

export interface EventFilter {
  status: StatusEvent | null
  /** Rentang tanggal "YYYY-MM-DD". Event yang beririsan dengan rentang ikut tampil. */
  dari: string | null
  sampai: string | null
}

export type EventListParams = ListParams<EventSortField> & EventFilter

// --- Ringkasan (TabRingkasan) ------------------------------------------------

export type StatusTask = Skema['TaskItemStatus']

export const STATUS_TASK: Record<StatusTask, InfoStatus> = {
  belum: { label: 'Belum', warna: 'abu' },
  dikerjakan: { label: 'Dikerjakan', warna: 'biru' },
  selesai: { label: 'Selesai', warna: 'hijau' },
  terlambat: { label: 'Terlambat', warna: 'merah' },
}

/** Ringkasan tab Ringkasan: hitung mundur, progres task, budget, jumlah penugasan. */
export type RingkasanEvent = Skema['EventSummaryDto']
