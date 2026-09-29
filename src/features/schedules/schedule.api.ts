import { http } from '@/api/http'
import type { SchedulePayload } from './schedule.schema'
import type { ScheduleFilter, ScheduleRow } from './schedule.types'

/**
 * Sesi rundown lintas event yang terlihat oleh pengguna (pic: event miliknya, crew: event
 * tempat ia bertugas), urut tanggal dan jam. Semua filter opsional; maksimal 500 sesi terbaru.
 */
export async function listSchedules(filter: ScheduleFilter = {}): Promise<ScheduleRow[]> {
  const { data } = await http.get<ScheduleRow[]>('/schedules', {
    params: {
      eventId: filter.eventId,
      dariTanggal: filter.dari ?? undefined,
      sampaiTanggal: filter.sampai ?? undefined,
    },
  })
  return data
}

export async function createSchedule(
  eventId: string,
  payload: SchedulePayload,
): Promise<ScheduleRow> {
  const { data } = await http.post<ScheduleRow>(`/events/${eventId}/schedules`, payload)
  return data
}

export async function updateSchedule(
  eventId: string,
  id: string,
  payload: SchedulePayload,
): Promise<ScheduleRow> {
  const { data } = await http.put<ScheduleRow>(`/events/${eventId}/schedules/${id}`, payload)
  return data
}

export async function deleteSchedule(eventId: string, id: string): Promise<void> {
  await http.delete(`/events/${eventId}/schedules/${id}`)
}
