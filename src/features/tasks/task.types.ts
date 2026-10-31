import dayjs from 'dayjs'
import type { Skema } from '@/api/types'
import { STATUS_TASK } from '@/features/events/event.types'

export { STATUS_TASK, type StatusTask } from '@/features/events/event.types'

/**
 * Task beserta nama event dan PIC. `status` hanya belum/dikerjakan/selesai (yang tersimpan);
 * terlambat dihitung backend dan dikirim sebagai `isTerlambat`.
 */
export type TaskRow = Skema['TaskDto']

/** Status yang bisa dipilih. Terlambat tidak bisa dipilih karena dihitung dari deadline. */
export const PILIHAN_STATUS_TASK = (['belum', 'dikerjakan', 'selesai'] as const).map((value) => ({
  value,
  label: STATUS_TASK[value].label,
}))

export interface TaskFilter {
  /** Kosong = semua event yang boleh dilihat pengguna. */
  eventId?: string
  /** Hanya task yang PIC-nya crew milik pengguna saat ini. */
  milikSaya?: boolean
}

/**
 * Status task boleh diubah oleh admin dan PIC event (`bolehKelola`), atau oleh crew yang
 * menjadi PIC task itu sendiri. Hanya untuk menyembunyikan kontrol; backend tetap menegakkannya.
 */
export function bolehUbahStatus(
  t: Pick<TaskRow, 'bolehKelola' | 'picCrewId'>,
  crewId: string | null,
) {
  return t.bolehKelola || (crewId !== null && t.picCrewId === crewId)
}

/** Deadline sudah lewat tapi task belum selesai. Task tanpa deadline tidak pernah terlambat. */
export function lewatDeadline(t: Pick<TaskRow, 'deadline' | 'status'>, hariIni = dayjs()) {
  return t.status !== 'selesai' && t.deadline !== null && dayjs(t.deadline).isBefore(hariIni, 'day')
}

/** Selisih hari ke deadline: negatif = lewat, 0 = hari ini. */
export function sisaHari(deadline: string, hariIni = dayjs()) {
  return dayjs(deadline).startOf('day').diff(hariIni.startOf('day'), 'day')
}
