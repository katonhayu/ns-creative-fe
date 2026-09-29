import dayjs from 'dayjs'
import { z } from 'zod'
import { isoTanggal, isoTanggalJam, tanggal } from '@/utils/format'
import { opsional, wajib, wajibPilih, wajibRupiah, wajibTanggal } from '@/utils/schema'

/** Rentang tanggal event, dipakai untuk memvalidasi jadwal penugasan. Selesai kosong = satu hari. */
export interface RentangEvent {
  tanggalMulai: string
  tanggalSelesai: string | null
}

const akhir = (r: RentangEvent) => r.tanggalSelesai ?? r.tanggalMulai

function diLuarRentang(nilai: Date, r: RentangEvent) {
  return dayjs(nilai).isBefore(r.tanggalMulai, 'day') || dayjs(nilai).isAfter(akhir(r), 'day')
}

const pesanRentang = (label: string, r: RentangEvent) =>
  r.tanggalMulai === akhir(r)
    ? `${label} harus pada ${tanggal(r.tanggalMulai)}.`
    : `${label} harus di antara ${tanggal(r.tanggalMulai)} dan ${tanggal(akhir(r))}.`

// --- Talent ------------------------------------------------------------------

export function eventTalentSchema(r: RentangEvent) {
  return z.object({
    talentId: wajibPilih('Talent harus dipilih.'),
    feeDeal: wajibRupiah('Fee deal harus diisi.'),
    durasiMenit: z
      .number()
      .int('Durasi harus bilangan bulat.')
      .positive('Durasi harus lebih dari 0 menit.')
      .nullable(),
    jadwalTampil: z
      .date()
      .nullable()
      .refine((v) => !v || !diLuarRentang(v, r), pesanRentang('Jadwal tampil', r))
      .transform((v) => (v ? isoTanggalJam(v) : null)),
    rider: opsional(1000),
    status: z.enum(['dihubungi', 'deal', 'kontrak', 'selesai', 'batal']),
  })
}

export type EventTalentFormValues = z.input<ReturnType<typeof eventTalentSchema>>
export type EventTalentPayload = z.output<ReturnType<typeof eventTalentSchema>>

// --- Crew --------------------------------------------------------------------

export function eventCrewSchema(r: RentangEvent) {
  return z.object({
    crewId: wajibPilih('Crew harus dipilih.'),
    posisi: wajib('Posisi harus diisi.'),
    tanggalBertugas: wajibTanggal('Tanggal bertugas harus diisi.')
      .refine((v) => !diLuarRentang(v, r), pesanRentang('Tanggal bertugas', r))
      .transform(isoTanggal),
  })
}

export type EventCrewFormValues = z.input<ReturnType<typeof eventCrewSchema>>
export type EventCrewPayload = z.output<ReturnType<typeof eventCrewSchema>>

// --- Vendor ------------------------------------------------------------------

export const eventVendorSchema = z.object({
  vendorId: wajibPilih('Vendor harus dipilih.'),
  kebutuhan: wajib('Kebutuhan harus diisi.', 255),
  biaya: wajibRupiah('Biaya harus diisi.'),
  statusPembayaran: z.enum(['belum_bayar', 'dp', 'lunas']),
})

export type EventVendorFormValues = z.input<typeof eventVendorSchema>
export type EventVendorPayload = z.output<typeof eventVendorSchema>
