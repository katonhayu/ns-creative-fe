/**
 * Penugasan master data ke event (tabel pivot event_talents, event_crews, event_vendors).
 * Backend membuat, memperbarui, dan menghapus baris budget terkait dalam transaksi yang sama.
 */
import { ambilSemua, http } from '@/api/http'
import type { Skema } from '@/api/types'
import { tanggal, tanggalJam } from '@/utils/format'
import type { EventDetail } from './event.types'
import type { EventCrewPayload, EventTalentPayload, EventVendorPayload } from './penugasan.schema'
import type {
  Bentrok,
  EventCrew,
  EventTalent,
  EventVendor,
  PenanggungJawab,
} from './penugasan.types'

/** Rentang event yang dicek, tanpa menghitung penugasan di event ini sendiri. */
function rentang(event: Pick<EventDetail, 'id' | 'tanggalMulai' | 'tanggalSelesai'>) {
  return {
    tanggalMulai: event.tanggalMulai,
    tanggalSelesai: event.tanggalSelesai ?? event.tanggalMulai,
    kecualiEventId: event.id,
  }
}

// --- Talent ------------------------------------------------------------------

export function listEventTalents(eventId: string): Promise<EventTalent[]> {
  return ambilSemua<EventTalent>(`/events/${eventId}/talents`)
}

export async function createEventTalent(
  eventId: string,
  p: EventTalentPayload,
): Promise<EventTalent> {
  const { data } = await http.post<EventTalent>(`/events/${eventId}/talents`, p)
  return data
}

/** Isi penugasan lewat PUT; status berubah lewat PATCH terpisah (aturan backend). */
export async function updateEventTalent(
  eventId: string,
  id: string,
  p: EventTalentPayload,
): Promise<EventTalent> {
  const isi: Skema['UpdateEventTalentDto'] = {
    feeDeal: p.feeDeal,
    durasiMenit: p.durasiMenit,
    jadwalTampil: p.jadwalTampil,
    rider: p.rider,
  }
  const { data } = await http.put<EventTalent>(`/events/${eventId}/talents/${id}`, isi)
  if (data.status === p.status) return data
  const ubah = await http.patch<EventTalent>(`/events/${eventId}/talents/${id}/status`, {
    status: p.status,
  })
  return ubah.data
}

export async function deleteEventTalent(eventId: string, id: string): Promise<void> {
  await http.delete(`/events/${eventId}/talents/${id}`)
}

/** Event lain yang memakai talent ini pada tanggal yang beririsan dengan event ini. */
export async function cekBentrokTalent(event: EventDetail, talentId: string): Promise<Bentrok[]> {
  const { data } = await http.get<Skema['TalentBentrokDto'][]>(`/talents/${talentId}/conflicts`, {
    params: rentang(event),
  })
  return data.map((b) => ({
    eventId: b.eventId,
    namaEvent: b.eventNama,
    tanggalMulai: b.tanggalMulai,
    tanggalSelesai: b.tanggalSelesai,
    keterangan: b.jadwalTampil ? `Tampil ${tanggalJam(b.jadwalTampil)}` : null,
  }))
}

// --- Crew --------------------------------------------------------------------

export function listEventCrews(eventId: string): Promise<EventCrew[]> {
  return ambilSemua<EventCrew>(`/events/${eventId}/crews`)
}

export async function createEventCrew(eventId: string, p: EventCrewPayload): Promise<EventCrew> {
  const { data } = await http.post<EventCrew>(`/events/${eventId}/crews`, p)
  return data
}

export async function updateEventCrew(
  eventId: string,
  id: string,
  p: EventCrewPayload,
): Promise<EventCrew> {
  const isi: Skema['UpdateEventCrewDto'] = { posisi: p.posisi, tanggalBertugas: p.tanggalBertugas }
  const { data } = await http.put<EventCrew>(`/events/${eventId}/crews/${id}`, isi)
  return data
}

export async function deleteEventCrew(eventId: string, id: string): Promise<void> {
  await http.delete(`/events/${eventId}/crews/${id}`)
}

/**
 * Crew yang boleh menjadi PIC task atau sesi rundown di event ini: PIC event, lalu crew yang
 * ditugaskan (urut nama). Crew di luar daftar ini ditolak backend.
 */
export async function listPenanggungJawab(eventId: string): Promise<PenanggungJawab[]> {
  const { data } = await http.get<PenanggungJawab[]>(`/events/${eventId}/penanggung-jawab`)
  return data
}

/**
 * Event lain yang menugaskan crew ini pada tanggal yang sama. Jika tanggal bertugas belum
 * dipilih, dicek terhadap seluruh rentang event.
 */
export async function cekBentrokCrew(
  event: EventDetail,
  crewId: string,
  tanggalBertugas: string | null,
): Promise<Bentrok[]> {
  const params = tanggalBertugas
    ? { tanggalMulai: tanggalBertugas, tanggalSelesai: tanggalBertugas, kecualiEventId: event.id }
    : rentang(event)
  const { data } = await http.get<Skema['CrewBentrokDto'][]>(`/crews/${crewId}/conflicts`, {
    params,
  })
  return data.map((b) => ({
    eventId: b.eventId,
    namaEvent: b.eventNama,
    tanggalMulai: b.tanggalMulai,
    tanggalSelesai: b.tanggalSelesai,
    keterangan: b.tanggalBertugas
      ? `${b.posisi}, bertugas ${tanggal(b.tanggalBertugas)}`
      : b.posisi,
  }))
}

// --- Vendor ------------------------------------------------------------------

export function listEventVendors(eventId: string): Promise<EventVendor[]> {
  return ambilSemua<EventVendor>(`/events/${eventId}/vendors`)
}

export async function createEventVendor(
  eventId: string,
  p: EventVendorPayload,
): Promise<EventVendor> {
  const { data } = await http.post<EventVendor>(`/events/${eventId}/vendors`, p)
  return data
}

/** Kebutuhan dan biaya lewat PUT; status pembayaran lewat PATCH terpisah (aturan backend). */
export async function updateEventVendor(
  eventId: string,
  id: string,
  p: EventVendorPayload,
): Promise<EventVendor> {
  const isi: Skema['UpdateEventVendorDto'] = { kebutuhan: p.kebutuhan, biaya: p.biaya }
  const { data } = await http.put<EventVendor>(`/events/${eventId}/vendors/${id}`, isi)
  if (data.statusPembayaran === p.statusPembayaran) return data
  const ubah = await http.patch<EventVendor>(`/events/${eventId}/vendors/${id}/pembayaran`, {
    statusPembayaran: p.statusPembayaran,
  })
  return ubah.data
}

export async function deleteEventVendor(eventId: string, id: string): Promise<void> {
  await http.delete(`/events/${eventId}/vendors/${id}`)
}

/** Event lain yang memesan vendor ini pada tanggal yang beririsan (wajar, hanya info). */
export async function cekBentrokVendor(event: EventDetail, vendorId: string): Promise<Bentrok[]> {
  const { data } = await http.get<Skema['VendorBentrokDto'][]>(`/vendors/${vendorId}/conflicts`, {
    params: rentang(event),
  })
  return data.map((b) => ({
    eventId: b.eventId,
    namaEvent: b.eventNama,
    tanggalMulai: b.tanggalMulai,
    tanggalSelesai: b.tanggalSelesai,
    keterangan: b.kebutuhan,
  }))
}
