import { http } from '@/api/http'
import type { Skema } from '@/api/types'
import type { TaskPayload } from './task.schema'
import type { StatusTask, TaskFilter, TaskRow } from './task.types'

/** Task lintas event (maksimal 500, urut deadline). Crew otomatis hanya melihat task miliknya. */
export async function listTasks(filter: TaskFilter = {}): Promise<TaskRow[]> {
  const { data } = await http.get<TaskRow[]>('/tasks', { params: filter })
  return data
}

function isi(p: TaskPayload): Skema['CreateTaskDto'] {
  return {
    namaTugas: p.namaTugas,
    deskripsi: p.deskripsi,
    deadline: p.deadline,
    catatan: p.catatan,
    picUserId: p.picUserId,
  }
}

/** Task baru selalu berstatus belum di backend; status lain dari form diterapkan sesudahnya. */
export async function createTask(eventId: string, payload: TaskPayload): Promise<TaskRow> {
  const { data } = await http.post<TaskRow>(`/events/${eventId}/tasks`, isi(payload))
  return data.status === payload.status ? data : updateStatusTask(eventId, data.id, payload.status)
}

/** Isi task lewat PUT; status lewat PATCH terpisah (aturan backend). */
export async function updateTask(
  eventId: string,
  id: string,
  payload: TaskPayload,
): Promise<TaskRow> {
  const { data } = await http.put<TaskRow>(`/events/${eventId}/tasks/${id}`, isi(payload))
  return data.status === payload.status ? data : updateStatusTask(eventId, id, payload.status)
}

/** Crew boleh memakai ini untuk task miliknya sendiri. */
export async function updateStatusTask(
  eventId: string,
  id: string,
  status: StatusTask,
): Promise<TaskRow> {
  const { data } = await http.patch<TaskRow>(`/events/${eventId}/tasks/${id}/status`, { status })
  return data
}

export async function deleteTask(eventId: string, id: string): Promise<void> {
  await http.delete(`/events/${eventId}/tasks/${id}`)
}
