/** Ukuran file yang mudah dibaca: "820 KB", "2,4 MB". */
export function ukuranFile(byte: number) {
  if (byte < 1024) return `${byte} B`
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`
  return `${(byte / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`
}

/** Ekstensi huruf kecil tanpa titik, misalnya "pdf". Kosong jika tidak ada. */
export function ekstensi(namaFile: string) {
  const i = namaFile.lastIndexOf('.')
  return i > 0 ? namaFile.slice(i + 1).toLowerCase() : ''
}

/** Nama file tanpa ekstensi, untuk usulan nama dokumen. */
export function tanpaEkstensi(namaFile: string) {
  const i = namaFile.lastIndexOf('.')
  return (i > 0 ? namaFile.slice(0, i) : namaFile).replace(/[_-]+/g, ' ').trim()
}

/** Simpan blob sebagai file lewat unduhan browser. */
export function simpanBlob(blob: Blob, namaFile: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Beri waktu browser memulai unduhan sebelum URL dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
