<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import { jam } from '@/utils/format'
import {
  bertumpukDenganSebelumnya,
  kelompokkanPerTanggal,
  type ScheduleRow,
} from './schedule.types'

/**
 * Rundown dikelompokkan per tanggal dan diurutkan jam. Dipakai di tab Rundown
 * (satu event) dan halaman Jadwal (lintas event).
 */
const props = withDefaults(
  defineProps<{
    items: ScheduleRow[]
    /** Tampilkan nama event di tiap sesi (untuk daftar lintas event). */
    tampilkanEvent?: boolean
    /**
     * Tombol lihat (ikon mata) ke tab Rundown di detail event. Hanya berlaku jika
     * nama event tampil. Crew tidak punya akses ke detail event.
     */
    tautanEvent?: boolean
    bisaKelola?: boolean
    /** Tanggal mulai event, untuk label "Hari ke-n" di tab Rundown. */
    tanggalMulaiEvent?: string
    /** Sesi yang PIC-nya pengguna ini diberi sorotan. */
    sorotUserId?: string | null
    idDihapus?: string | null
  }>(),
  {
    tampilkanEvent: false,
    tautanEvent: true,
    bisaKelola: false,
    tanggalMulaiEvent: undefined,
    sorotUserId: null,
    idDihapus: null,
  },
)
const emit = defineEmits<{ edit: [s: ScheduleRow]; hapus: [s: ScheduleRow] }>()

const grup = computed(() => kelompokkanPerTanggal(props.items))

/** Tombol lihat hanya di daftar lintas event, dan hanya bagi yang bisa membuka detail event. */
const adaTombolLihat = computed(() => props.tampilkanEvent && props.tautanEvent)

const sekarang = dayjs()
const hariIni = sekarang.format('YYYY-MM-DD')
const jamSekarang = sekarang.format('HH:mm')

function labelHari(tgl: string) {
  const d = dayjs(tgl)
  if (tgl === hariIni) return 'Hari ini'
  if (d.isSame(sekarang.add(1, 'day'), 'day')) return 'Besok'
  if (props.tanggalMulaiEvent) return `Hari ke-${d.diff(props.tanggalMulaiEvent, 'day') + 1}`
  return null
}

// Jam backend "HH:mm:ss" dibandingkan sebagai teks dengan "HH:mm"; sesi tanpa jam selesai
// dianggap berjalan sampai akhir hari.
const sedangBerjalan = (s: ScheduleRow) =>
  s.tanggal === hariIni &&
  s.waktuMulai.slice(0, 5) <= jamSekarang &&
  jamSekarang < (s.waktuSelesai?.slice(0, 5) ?? '24:00')
</script>

<template>
  <div class="rundown">
    <section v-for="g in grup" :key="g.tanggal" class="hari">
      <header class="hari__kepala">
        <h3>{{ dayjs(g.tanggal).format('dddd, DD MMM YYYY') }}</h3>
        <span
          v-if="labelHari(g.tanggal)"
          class="hari__label"
          :class="{ kini: g.tanggal === hariIni }"
        >
          {{ labelHari(g.tanggal) }}
        </span>
        <span class="hari__jumlah">{{ g.sesi.length }} sesi</span>
      </header>

      <ol class="sesi-daftar">
        <li
          v-for="(s, i) in g.sesi"
          :key="s.id"
          class="sesi"
          :class="{
            'sesi--kini': sedangBerjalan(s),
            'sesi--sorot': sorotUserId !== null && s.picUserId === sorotUserId,
          }"
        >
          <div class="sesi__jam angka">
            <strong>{{ jam(s.waktuMulai) }}</strong>
            <span>{{ jam(s.waktuSelesai) }}</span>
          </div>

          <div class="sesi__isi">
            <div class="sesi__judul">
              <span>{{ s.kegiatan }}</span>
              <span v-if="sedangBerjalan(s)" class="lencana lencana--kini">Sedang berlangsung</span>
              <span
                v-if="sorotUserId !== null && s.picUserId === sorotUserId"
                class="lencana lencana--sorot"
              >
                Kamu PIC
              </span>
            </div>
            <div class="sesi__meta">
              <span v-if="tampilkanEvent"><i class="pi pi-calendar" />{{ s.namaEvent }}</span>
              <span v-if="s.lokasi"><i class="pi pi-map-marker" />{{ s.lokasi }}</span>
              <span><i class="pi pi-user" />{{ s.namaPic }}</span>
            </div>
            <small v-if="bertumpukDenganSebelumnya(g.sesi, i)" class="tumpuk">
              <i class="pi pi-info-circle" /> Jamnya bertumpuk dengan sesi lain di lokasi yang sama.
            </small>
          </div>

          <div v-if="bisaKelola || adaTombolLihat" class="sesi__aksi">
            <Button
              v-if="adaTombolLihat"
              :as="RouterLink"
              :to="{ name: 'event-detail', params: { id: s.eventId }, query: { tab: 'rundown' } }"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat rundown ${s.namaEvent}`"
              title="Lihat di detail event"
            />
            <template v-if="bisaKelola">
              <Button
                icon="pi pi-pen-to-square"
                text
                rounded
                size="small"
                :aria-label="`Edit ${s.kegiatan}`"
                title="Edit"
                @click="emit('edit', s)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                :aria-label="`Hapus ${s.kegiatan}`"
                title="Hapus"
                :loading="idDihapus === s.id"
                @click="emit('hapus', s)"
              />
            </template>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.rundown {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hari {
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  overflow: hidden;
}
.hari__kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.6rem;
  padding: 0.7rem 1rem;
  background: var(--ns-surface-2);
  border-bottom: 1px solid var(--ns-border);
}
.hari__kepala h3 {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 650;
  color: var(--ns-text);
}
.hari__label {
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 0.72rem;
  font-weight: 600;
}
.hari__label.kini {
  background: var(--ns-success-soft);
  color: var(--ns-success);
}
.hari__jumlah {
  margin-left: auto;
  color: var(--ns-text-3);
  font-size: 0.78rem;
}

.sesi-daftar {
  margin: 0;
  padding: 0;
  list-style: none;
}
.sesi {
  display: grid;
  grid-template-columns: 4.5rem 1fr auto;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ns-border);
  background: var(--ns-surface);
}
.sesi:last-child {
  border-bottom: none;
}
.sesi--sorot {
  box-shadow: inset 3px 0 0 var(--ns-accent);
}
.sesi--kini {
  background: #f2fbf6;
  box-shadow: inset 3px 0 0 var(--ns-success);
}

.sesi__jam {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.sesi__jam strong {
  color: var(--ns-text);
  font-size: 0.92rem;
  font-weight: 650;
}
.sesi__jam span {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}

.sesi__isi {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.sesi__judul {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  color: var(--ns-text);
  font-size: 0.9rem;
  font-weight: 600;
}
.sesi__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1rem;
  color: var(--ns-text-2);
  font-size: 0.8rem;
}
.sesi__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.sesi__meta i {
  color: var(--ns-text-3);
  font-size: 0.72rem;
}
.tumpuk {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--ns-warn);
  font-size: 0.75rem;
}

.lencana {
  padding: 0.05rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}
.lencana--kini {
  background: var(--ns-success-soft);
  color: var(--ns-success);
}
.lencana--sorot {
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
}

.sesi__aksi {
  display: flex;
  align-items: flex-start;
  gap: 0.1rem;
}

@media (max-width: 640px) {
  .sesi {
    grid-template-columns: 3.75rem 1fr;
  }
  .sesi__aksi {
    grid-column: 2;
  }
}
</style>
