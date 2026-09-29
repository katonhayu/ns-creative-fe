<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { RouterLink } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { pesanError } from '@/api/http'
import { STATUS_EVENT } from '@/features/events/event.types'
import { STATUS_PEMBAYARAN } from '@/features/events/penugasan.types'
import { STATUS_TASK } from '@/features/tasks/task.types'
import { useAuthStore } from '@/stores/auth'
import { rentangTanggal, rupiah, tanggal } from '@/utils/format'
import { getDashboard, HARI_DEADLINE } from './dashboard.api'

const auth = useAuthStore()

const jam = new Date().getHours()
const salam =
  jam < 11
    ? 'Selamat pagi'
    : jam < 15
      ? 'Selamat siang'
      : jam < 18
        ? 'Selamat sore'
        : 'Selamat malam'
const namaDepan = auth.user?.nama.split(' ')[0] ?? ''
const hariIni = dayjs().format('dddd, DD MMM YYYY')

const dashboard = useQuery({
  queryKey: ['dashboard'],
  queryFn: getDashboard,
  // Angka depan sebaiknya segar setiap kali halaman dibuka.
  staleTime: 0,
})
const d = computed(() => dashboard.data.value)

const jumlahTerlambat = computed(
  () => d.value?.taskMendekatiDeadline.filter((t) => t.isTerlambat).length ?? 0,
)
const totalBelumLunas = computed(
  () => d.value?.vendorBelumLunas.reduce((s, v) => s + v.biaya, 0) ?? 0,
)

/** Kartu angka. Warna ikon hanya penanda kategori; artinya selalu tertulis di label. */
const kotak = computed(() => {
  const x = d.value
  if (!x) return []
  return [
    {
      label: 'Event berlangsung',
      nilai: String(x.eventBerlangsung.length),
      sub:
        x.eventTerdekat[0] !== undefined
          ? `Berikutnya H-${x.eventTerdekat[0].hariLagi}`
          : 'Tidak ada event terjadwal',
      ikon: 'pi-calendar',
      warna: 'aksen',
    },
    {
      label: `Task ${HARI_DEADLINE} hari ke depan`,
      nilai: String(x.taskMendekatiDeadline.length),
      sub: jumlahTerlambat.value
        ? `${jumlahTerlambat.value} sudah lewat deadline`
        : 'Semua masih sesuai jadwal',
      ikon: 'pi-check-square',
      warna: jumlahTerlambat.value ? 'merah' : 'kuning',
    },
    {
      label: 'Pembayaran vendor belum lunas',
      nilai: rupiah(totalBelumLunas.value),
      sub: `${x.vendorBelumLunas.length} tagihan`,
      ikon: 'pi-wallet',
      warna: 'kuning',
    },
    {
      label: `Event tahun ${dayjs().year()}`,
      nilai: String(x.statistik.totalEventTahunIni),
      sub: `${x.statistik.totalEventSelesai} selesai · ${x.statistik.totalClientAktif} client`,
      ikon: 'pi-chart-bar',
      warna: 'ungu',
    },
  ]
})

function labelDeadline(t: { deadline: string; isTerlambat: boolean }) {
  const sisa = dayjs(t.deadline).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (t.isTerlambat) return `Lewat ${-sisa} hari`
  if (sisa === 0) return 'Hari ini'
  if (sisa === 1) return 'Besok'
  return `${sisa} hari lagi`
}

function hariKe(mulai: string, selesai: string | null) {
  const total = dayjs(selesai ?? mulai).diff(mulai, 'day') + 1
  const ke = dayjs().startOf('day').diff(dayjs(mulai), 'day') + 1
  return total > 1 ? `Hari ke-${ke} dari ${total}` : 'Hari-H'
}

const rute = (id: string, tab?: string) => ({
  name: 'event-detail',
  params: { id },
  query: tab ? { tab } : undefined,
})
</script>

<template>
  <div class="halaman">
    <PageHeader
      :judul="`${salam}, ${namaDepan}.`"
      :deskripsi="`Ringkasan operasional · ${hariIni}`"
    >
      <Button
        icon="pi pi-refresh"
        label="Muat ulang"
        severity="secondary"
        outlined
        :loading="dashboard.isFetching.value"
        @click="dashboard.refetch()"
      />
    </PageHeader>

    <Message v-if="dashboard.isError.value" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Ringkasan tidak dapat dimuat. {{ pesanError(dashboard.error.value) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="dashboard.isFetching.value"
          @click="dashboard.refetch()"
        />
      </div>
    </Message>

    <!-- Kartu angka -->
    <div class="kisi">
      <template v-if="dashboard.isPending.value">
        <div v-for="i in 4" :key="i" class="kotak">
          <Skeleton width="36px" height="36px" border-radius="10px" />
          <Skeleton width="60%" height="1.6rem" />
          <Skeleton width="80%" height="0.9rem" />
        </div>
      </template>
      <div v-for="k in kotak" v-else :key="k.label" class="kotak">
        <span class="kotak__ikon" :class="`kotak__ikon--${k.warna}`">
          <i class="pi" :class="k.ikon" />
        </span>
        <span class="kotak__nilai angka">{{ k.nilai }}</span>
        <span class="kotak__label">{{ k.label }}</span>
        <small class="kotak__sub">{{ k.sub }}</small>
      </div>
    </div>

    <div v-if="d" class="dua">
      <!-- Event berlangsung -->
      <section class="panel">
        <header class="panel__kepala">
          <h2><i class="pi pi-play-circle" /> Event berlangsung</h2>
          <RouterLink :to="{ name: 'events' }" class="lihat">Semua event</RouterLink>
        </header>
        <p v-if="!d.eventBerlangsung.length" class="kosong">
          Tidak ada event yang sedang berlangsung hari ini.
        </p>
        <ul v-else class="daftar">
          <li v-for="e in d.eventBerlangsung" :key="e.id" class="baris">
            <div class="baris__isi">
              <span class="baris__judul">{{ e.nama }}</span>
              <small>
                {{ hariKe(e.tanggalMulai, e.tanggalSelesai) }} · {{ e.lokasi }} · PIC
                {{ e.namaPic }}
              </small>
              <div class="progres">
                <ProgressBar :value="e.persenTask" :show-value="false" class="progres__bar" />
                <small class="angka">{{ e.persenTask }}% task selesai</small>
              </div>
            </div>
            <Button
              :as="RouterLink"
              :to="rute(e.id, 'rundown')"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat ${e.nama}`"
              title="Lihat rundown"
            />
          </li>
        </ul>
      </section>

      <!-- Event terdekat -->
      <section class="panel">
        <header class="panel__kepala">
          <h2><i class="pi pi-calendar-clock" /> Event terdekat</h2>
          <RouterLink :to="{ name: 'events' }" class="lihat">Semua event</RouterLink>
        </header>
        <p v-if="!d.eventTerdekat.length" class="kosong">Belum ada event yang dijadwalkan.</p>
        <ul v-else class="daftar">
          <li v-for="e in d.eventTerdekat" :key="e.id" class="baris">
            <span class="hitung angka" :class="{ 'hitung--dekat': e.hariLagi <= 7 }">
              <strong>H-{{ e.hariLagi }}</strong>
            </span>
            <div class="baris__isi">
              <span class="baris__judul">{{ e.nama }}</span>
              <small>{{ rentangTanggal(e.tanggalMulai, e.tanggalSelesai) }} · {{ e.lokasi }}</small>
            </div>
            <StatusBadge :status="STATUS_EVENT[e.status]" />
            <Button
              :as="RouterLink"
              :to="rute(e.id)"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat ${e.nama}`"
              title="Lihat detail"
            />
          </li>
        </ul>
      </section>

      <!-- Task mendekati deadline -->
      <section class="panel">
        <header class="panel__kepala">
          <h2><i class="pi pi-check-square" /> Task mendekati deadline</h2>
          <RouterLink :to="{ name: 'tasks' }" class="lihat">Semua task</RouterLink>
        </header>
        <p v-if="!d.taskMendekatiDeadline.length" class="kosong">
          Tidak ada task dengan deadline dalam {{ HARI_DEADLINE }} hari ke depan.
        </p>
        <ul v-else class="daftar daftar--gulir">
          <li v-for="t in d.taskMendekatiDeadline" :key="t.id" class="baris">
            <div class="baris__isi">
              <span class="baris__judul">{{ t.namaTugas }}</span>
              <small>{{ t.eventNama }} · {{ t.namaPic ?? 'Belum ada PIC' }}</small>
            </div>
            <div class="deadline">
              <span class="angka">{{ tanggal(t.deadline) }}</span>
              <small :class="t.isTerlambat ? 'lewat' : 'dekat'">
                <i v-if="t.isTerlambat" class="pi pi-exclamation-circle" />
                {{ labelDeadline(t) }}
              </small>
            </div>
            <StatusBadge :status="STATUS_TASK[t.status]" />
            <Button
              :as="RouterLink"
              :to="rute(t.eventId, 'task')"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat ${t.namaTugas}`"
              title="Lihat di tab Task"
            />
          </li>
        </ul>
      </section>

      <!-- Vendor belum lunas -->
      <section class="panel">
        <header class="panel__kepala">
          <h2><i class="pi pi-wallet" /> Pembayaran vendor belum lunas</h2>
          <span class="total angka">{{ rupiah(totalBelumLunas) }}</span>
        </header>
        <p v-if="!d.vendorBelumLunas.length" class="kosong">Semua pembayaran vendor sudah lunas.</p>
        <ul v-else class="daftar daftar--gulir">
          <li v-for="v in d.vendorBelumLunas" :key="v.eventVendorId" class="baris">
            <div class="baris__isi">
              <span class="baris__judul">{{ v.vendorNama }}</span>
              <small class="sel-terpotong" :title="`${v.kebutuhan} · ${v.eventNama}`">
                {{ v.kebutuhan }} · {{ v.eventNama }}
              </small>
            </div>
            <span class="biaya angka">{{ rupiah(v.biaya) }}</span>
            <StatusBadge :status="STATUS_PEMBAYARAN[v.statusPembayaran]" />
            <Button
              :as="RouterLink"
              :to="rute(v.eventId, 'vendor')"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat ${v.vendorNama} di ${v.eventNama}`"
              title="Lihat di tab Vendor"
            />
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.halaman {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.galat-muat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

/* Kartu angka */
.kisi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}
.kotak {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1.15rem 1.25rem;
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius);
  box-shadow: var(--ns-shadow-sm);
}
.kotak__ikon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 0.6rem;
  border-radius: 10px;
  font-size: 0.95rem;
}
.kotak__ikon--aksen {
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
}
.kotak__ikon--ungu {
  background: #f1eaff;
  color: #7a3fd9;
}
.kotak__ikon--kuning {
  background: var(--ns-warn-soft);
  color: var(--ns-warn);
}
.kotak__ikon--merah {
  background: var(--ns-danger-soft);
  color: var(--ns-danger);
}
.kotak__nilai {
  color: var(--ns-text);
  font-size: 1.6rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.kotak__label {
  color: var(--ns-text-2);
  font-size: 0.83rem;
  font-weight: 500;
}
.kotak__sub {
  color: var(--ns-text-3);
  font-size: 0.76rem;
}

/* Panel daftar */
.dua {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius);
  box-shadow: var(--ns-shadow-sm);
}
.panel__kepala {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.95rem 1.15rem;
  border-bottom: 1px solid var(--ns-border);
}
.panel__kepala h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--ns-text);
  font-size: 0.92rem;
  font-weight: 650;
}
.panel__kepala h2 i {
  color: var(--ns-accent-text);
  font-size: 0.9rem;
}
.lihat {
  color: var(--ns-accent-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}
.lihat:hover {
  text-decoration: underline;
}
.total {
  color: var(--ns-text);
  font-size: 0.9rem;
  font-weight: 650;
}
.kosong {
  margin: 0;
  padding: 2rem 1.15rem;
  color: var(--ns-text-3);
  font-size: 0.85rem;
  text-align: center;
}

.daftar {
  margin: 0;
  padding: 0;
  list-style: none;
}
.daftar--gulir {
  max-height: 22rem;
  overflow-y: auto;
}
.baris {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.15rem;
  border-bottom: 1px solid var(--ns-border);
}
.baris:last-child {
  border-bottom: none;
}
.baris__isi {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.baris__judul {
  overflow: hidden;
  color: var(--ns-text);
  font-size: 0.87rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.baris__isi small {
  color: var(--ns-text-3);
  font-size: 0.76rem;
}
.progres {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.3rem;
}
.progres__bar {
  flex: 1;
  height: 0.4rem;
}
.hitung {
  display: grid;
  place-items: center;
  flex: none;
  min-width: 3.4rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 0.85rem;
}
.hitung--dekat {
  background: var(--ns-warn-soft);
  color: var(--ns-warn);
}
.deadline {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
  font-size: 0.8rem;
  color: var(--ns-text-2);
}
.deadline small {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.74rem;
  font-weight: 600;
}
.lewat {
  color: var(--ns-danger);
}
.dekat {
  color: var(--ns-warn);
}
.biaya {
  flex: none;
  color: var(--ns-text);
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .dua {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .baris {
    flex-wrap: wrap;
  }
  .baris__isi {
    flex-basis: 100%;
  }
}
</style>
