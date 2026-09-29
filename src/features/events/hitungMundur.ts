import dayjs, { type Dayjs } from 'dayjs'
import type { WarnaStatus } from '@/components/StatusBadge.vue'
import type { EventItem } from './event.types'

export interface HitungMundur {
  /** Teks utama, misalnya "H-14", "Hari ke-2", "Selesai". */
  judul: string
  /** Penjelasan singkat di bawah teks utama. */
  sub: string
  warna: WarnaStatus
}

/** Status waktu event relatif terhadap hari ini. */
export function hitungMundur(
  e: Pick<EventItem, 'tanggalMulai' | 'tanggalSelesai' | 'status'>,
  sekarang: Dayjs = dayjs(),
): HitungMundur {
  if (e.status === 'dibatalkan') {
    return { judul: 'Dibatalkan', sub: 'Event tidak jadi dilaksanakan', warna: 'merah' }
  }

  const hariIni = sekarang.startOf('day')
  const mulai = dayjs(e.tanggalMulai).startOf('day')
  const selesai = dayjs(e.tanggalSelesai ?? e.tanggalMulai).startOf('day')
  const menuju = mulai.diff(hariIni, 'day')

  if (menuju > 0) {
    return {
      judul: `H-${menuju}`,
      sub: menuju === 1 ? 'Hari-H besok' : `${menuju} hari menuju hari-H`,
      warna: menuju <= 7 ? 'kuning' : 'biru',
    }
  }

  if (!hariIni.isAfter(selesai)) {
    const total = selesai.diff(mulai, 'day') + 1
    const ke = hariIni.diff(mulai, 'day') + 1
    return total > 1
      ? { judul: `Hari ke-${ke}`, sub: `dari ${total} hari pelaksanaan`, warna: 'hijau' }
      : { judul: 'Hari-H', sub: 'Event berlangsung hari ini', warna: 'hijau' }
  }

  const lalu = hariIni.diff(selesai, 'day')
  return { judul: 'Selesai', sub: lalu === 1 ? 'Kemarin' : `${lalu} hari yang lalu`, warna: 'abu' }
}
