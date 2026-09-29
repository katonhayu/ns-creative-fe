import { computed, onBeforeUnmount, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'

export interface UsePilihanOptions<T extends { id: string }> {
  /** Awalan kunci cache, misalnya ['clients', 'pilihan']. */
  key: unknown[]
  /** Ambil pilihan dari endpoint lookup (maksimal 50 baris) untuk teks pencarian. */
  ambil: (search: string) => Promise<T[]>
  /** Query hanya berjalan saat bernilai true, misalnya ketika dialog terbuka. */
  aktif?: MaybeRefOrGetter<boolean>
  /**
   * Nilai yang sedang terpilih (misalnya client event yang diedit). Selalu ikut di daftar
   * supaya labelnya tampil walau tidak termasuk 50 hasil teratas.
   */
  terpilih?: MaybeRefOrGetter<T | null | undefined>
}

const JEDA_CARI = 300

/**
 * Pilihan dropdown dari endpoint lookup backend yang dibatasi 50 baris. Ketikan di kotak
 * filter Select dikirim ke server (dengan jeda), jadi data di luar 50 teratas tetap bisa dicari.
 * Pasang di Select: `:options="p.opsi"` dan `@filter="p.cari($event.value)"`.
 */
export function usePilihan<T extends { id: string }>(opsi: UsePilihanOptions<T>) {
  const search = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined

  function cari(teks: string) {
    clearTimeout(timer)
    timer = setTimeout(() => (search.value = teks.trim()), JEDA_CARI)
  }
  onBeforeUnmount(() => clearTimeout(timer))

  const query = useQuery({
    queryKey: computed(() => [...opsi.key, search.value]),
    queryFn: () => opsi.ambil(search.value),
    enabled: computed(() => toValue(opsi.aktif ?? true)),
    placeholderData: (lama) => lama,
  })

  const daftar = computed(() => {
    const hasil = query.data.value ?? []
    const pilih = toValue(opsi.terpilih)
    return pilih && !hasil.some((x) => x.id === pilih.id) ? [pilih, ...hasil] : hasil
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
    /** Temukan pilihan berdasarkan id dari daftar yang sudah dimuat. */
    cariId: (id: string | null | undefined) => daftar.value.find((x) => x.id === id),
    cari,
  }
}
