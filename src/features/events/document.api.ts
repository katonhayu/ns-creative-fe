/**
 * Dokumen event. Upload lewat multipart; file hanya bisa diambil lewat endpoint download
 * (butuh login), jadi pratinjau dan unduhan diambil sebagai blob lewat axios.
 */
import { ambilSemua, http } from '@/api/http'
import type { Skema } from '@/api/types'
import type { DokumenPayload } from './document.schema'
import type { Dokumen } from './document.types'

type DocumentDto = Skema['DocumentDto']

function keDokumen(d: DocumentDto): Dokumen {
  return {
    id: d.id,
    eventId: d.eventId,
    namaDokumen: d.namaDokumen,
    jenis: d.jenis,
    tanggal: d.tanggal,
    namaFile: d.namaFile,
    tipeFile: d.contentType ?? 'application/octet-stream',
    ukuran: d.ukuranByte,
    keterangan: d.keterangan,
  }
}

export async function listDokumen(eventId: string): Promise<Dokumen[]> {
  return (await ambilSemua<DocumentDto>(`/events/${eventId}/documents`)).map(keDokumen)
}

/**
 * Unggah satu file beserta metadatanya. Tipe dan ukuran dicek lagi di backend
 * (maksimal 10 MB, isi file harus sesuai ekstensinya).
 * @param onProgress dipanggil dengan persentase 0–100 selama upload berjalan.
 */
export async function unggahDokumen(
  eventId: string,
  file: File,
  meta: DokumenPayload,
  onProgress?: (persen: number) => void,
): Promise<Dokumen> {
  const form = new FormData()
  form.append('file', file)
  form.append('namaDokumen', meta.namaDokumen)
  form.append('jenis', meta.jenis)
  form.append('tanggal', meta.tanggal)
  if (meta.keterangan) form.append('keterangan', meta.keterangan)

  const { data } = await http.post<DocumentDto>(`/events/${eventId}/documents`, form, {
    // Header JSON bawaan instance harus diganti, kalau tidak axios mengubah FormData jadi JSON.
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
    },
  })
  return keDokumen(data)
}

/** Ubah metadata saja. File tidak bisa diganti; unggah dokumen baru bila perlu. */
export async function updateDokumen(id: string, payload: DokumenPayload): Promise<Dokumen> {
  const { data } = await http.put<DocumentDto>(`/documents/${id}`, payload)
  return keDokumen(data)
}

/** Hapus metadata dan file fisiknya. */
export async function deleteDokumen(id: string): Promise<void> {
  await http.delete(`/documents/${id}`)
}

/** Isi file untuk pratinjau dan unduhan. */
export async function ambilFileDokumen(id: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/documents/${id}/download`, { responseType: 'blob' })
  return data
}
