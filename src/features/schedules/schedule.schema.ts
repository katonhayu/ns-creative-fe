import dayjs from 'dayjs'
import { z } from 'zod'
import type { RentangEvent } from '@/features/events/penugasan.schema'
import { isoTanggal, tanggal } from '@/utils/format'
import { opsional, wajib, wajibPilih, wajibTanggal } from '@/utils/schema'

/** Jam dari DatePicker time-only ke "HH:mm". */
const keJam = (d: Date) => dayjs(d).format('HH:mm')

/** "HH:mm" ke Date (tanggal diabaikan) untuk DatePicker time-only. */
export function dariJam(jam: string) {
  const [h = 0, m = 0] = jam.split(':').map(Number)
  return dayjs().hour(h).minute(m).second(0).millisecond(0).toDate()
}

export function scheduleSchema(r: RentangEvent) {
  return z
    .object({
      kegiatan: wajib('Kegiatan harus diisi.', 200),
      tanggal: wajibTanggal('Tanggal harus diisi.')
        .refine(
          (v) =>
            !dayjs(v).isBefore(r.tanggalMulai, 'day') &&
            !dayjs(v).isAfter(r.tanggalSelesai ?? r.tanggalMulai, 'day'),
          (r.tanggalSelesai ?? r.tanggalMulai) === r.tanggalMulai
            ? `Tanggal harus ${tanggal(r.tanggalMulai)}.`
            : `Tanggal harus di antara ${tanggal(r.tanggalMulai)} dan ${tanggal(r.tanggalSelesai)}.`,
        )
        .transform(isoTanggal),
      waktuMulai: wajibTanggal('Jam mulai harus diisi.').transform(keJam),
      waktuSelesai: wajibTanggal('Jam selesai harus diisi.').transform(keJam),
      picCrewId: wajibPilih('PIC sesi harus dipilih.'),
      lokasi: opsional(200),
    })
    .superRefine((v, ctx) => {
      if (v.waktuSelesai <= v.waktuMulai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['waktuSelesai'],
          message: 'Jam selesai harus setelah jam mulai.',
        })
      }
    })
}

export type ScheduleFormValues = z.input<ReturnType<typeof scheduleSchema>>
export type SchedulePayload = z.output<ReturnType<typeof scheduleSchema>>
