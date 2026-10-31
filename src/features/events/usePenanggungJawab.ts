import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listPenanggungJawab } from './penugasan.api'
import type { PenanggungJawab } from './penugasan.types'

/**
 * Pilihan PIC task dan sesi rundown di satu event: PIC event dan crew yang ditugaskan.
 * Daftarnya pendek dan tidak dicari di server, jadi pakai filter bawaan Select.
 * Kunci cache di bawah ['events', id], sehingga ikut diperbarui saat penugasan crew berubah.
 */
export function usePenanggungJawab(opsi: {
  eventId: MaybeRefOrGetter<string>
  /** Query hanya berjalan saat bernilai true, misalnya ketika dialog terbuka. */
  aktif: MaybeRefOrGetter<boolean>
  /**
   * PIC yang sedang dipegang. Tetap ikut di daftar walau crew-nya sudah tidak ditugaskan,
   * supaya labelnya tampil di form edit.
   */
  terpilih?: MaybeRefOrGetter<{ crewId: string | null; nama: string | null } | null | undefined>
}) {
  const query = useQuery({
    queryKey: computed(() => ['events', toValue(opsi.eventId), 'penanggung-jawab']),
    queryFn: () => listPenanggungJawab(toValue(opsi.eventId)),
    enabled: computed(() => toValue(opsi.aktif)),
  })

  const daftar = computed<PenanggungJawab[]>(() => {
    const hasil = query.data.value ?? []
    const pilih = toValue(opsi.terpilih)
    if (!pilih?.crewId || hasil.some((p) => p.crewId === pilih.crewId)) return hasil
    return [
      ...hasil,
      {
        crewId: pilih.crewId,
        nama: pilih.nama ?? '',
        keterangan: 'Tidak lagi ditugaskan',
        punyaAkun: false,
      },
    ]
  })

  return {
    get opsi() {
      return daftar.value
    },
    get memuat() {
      return query.isPending.value
    },
    get gagal() {
      return query.isError.value
    },
    get error() {
      return query.error.value
    },
  }
}
