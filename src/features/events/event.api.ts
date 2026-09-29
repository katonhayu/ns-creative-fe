import { http } from '@/api/http'
import type { CrudApi, Paged, Skema } from '@/api/types'
import type { EventPayload } from './event.schema'
import type {
  EventDetail,
  EventFilter,
  EventListParams,
  EventRow,
  EventSortField,
  RingkasanEvent,
  StatusEvent,
} from './event.types'

/** Daftar event. Backend otomatis membatasi pic ke event miliknya dan crew ke event tempat ia bertugas. */
export async function listEvents(params: EventListParams): Promise<Paged<EventRow>> {
  const { dari, sampai, status, ...sisa } = params
  const { data } = await http.get<Paged<EventRow>>('/events', {
    params: {
      ...sisa,
      status: status ?? undefined,
      dariTanggal: dari ?? undefined,
      sampaiTanggal: sampai ?? undefined,
    },
  })
  return data
}

export async function getEvent(id: string): Promise<EventDetail> {
  const { data } = await http.get<EventDetail>(`/events/${id}`)
  return data
}

/** Isi event tanpa status: event baru selalu draft, status diubah lewat PATCH. */
function badan(p: EventPayload): Skema['CreateEventDto'] {
  return {
    clientId: p.clientId,
    picUserId: p.picUserId,
    nama: p.nama,
    jenis: p.jenis,
    tanggalMulai: p.tanggalMulai,
    tanggalSelesai: p.tanggalSelesai,
    lokasi: p.lokasi,
    deskripsi: p.deskripsi,
  }
}

export async function createEvent(payload: EventPayload): Promise<EventDetail> {
  const { data } = await http.post<EventDetail>('/events', badan(payload))
  return data
}

/**
 * Simpan isi event, lalu ubah statusnya jika berbeda. Backend memisahkan keduanya
 * (PUT untuk data, PATCH untuk status) dan menolak transisi status yang tidak sah.
 */
export async function updateEvent(id: string, payload: EventPayload): Promise<EventDetail> {
  const { data } = await http.put<EventDetail>(`/events/${id}`, badan(payload))
  return data.status === payload.status ? data : ubahStatusEvent(id, payload.status)
}

export async function ubahStatusEvent(id: string, status: StatusEvent): Promise<EventDetail> {
  const { data } = await http.patch<EventDetail>(`/events/${id}/status`, { status })
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  await http.delete(`/events/${id}`)
}

export async function getRingkasanEvent(id: string): Promise<RingkasanEvent> {
  const { data } = await http.get<RingkasanEvent>(`/events/${id}/summary`)
  return data
}

export const eventApi: CrudApi<EventRow, EventPayload, EventSortField, EventFilter> = {
  list: listEvents,
  create: createEvent,
  update: updateEvent,
  remove: deleteEvent,
}
