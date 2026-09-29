<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import StatusBadge from '@/components/StatusBadge.vue'
import { pesanError } from '@/api/http'
import { rentangTanggal, rupiah } from '@/utils/format'
import { getRingkasanEvent } from '../event.api'
import type { InfoStatus } from '@/components/StatusBadge.vue'
import { STATUS_TASK, type EventDetail } from '../event.types'
import { hitungMundur } from '../hitungMundur'

const props = defineProps<{ event: EventDetail }>()
const emit = defineEmits<{ bukaTab: [tab: string] }>()

const ringkasan = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'ringkasan']),
  queryFn: () => getRingkasanEvent(props.event.id),
})

const mundur = computed(() => hitungMundur(props.event))

const task = computed(() => {
  const t = ringkasan.data.value?.task
  if (!t) return null
  // Terlambat = deadline lewat dan belum selesai (dihitung backend), bagian dari yang belum selesai.
  const legenda: { info: InfoStatus; jumlah: number }[] = [
    { info: STATUS_TASK.selesai, jumlah: t.selesai },
    { info: { label: 'Belum selesai', warna: 'abu' }, jumlah: t.total - t.selesai - t.terlambat },
    { info: STATUS_TASK.terlambat, jumlah: t.terlambat },
  ]
  return { ...t, persen: Math.round(t.persenSelesai), legenda }
})

const budget = computed(() => {
  const b = ringkasan.data.value?.budget
  if (!b) return null
  return {
    estimasi: b.totalEstimasi,
    aktual: b.totalAktual,
    selisih: b.selisih,
    sponsorship: b.totalSponsorship,
    belumLunas: b.belumLunas,
    persen: b.totalEstimasi
      ? Math.min(100, Math.round((b.totalAktual / b.totalEstimasi) * 100))
      : 0,
  }
})

const penugasan = computed(() => {
  const r = ringkasan.data.value
  return [
    { tab: 'talent', label: 'Talent', ikon: 'pi-star', jumlah: r?.jumlahTalent ?? 0 },
    { tab: 'crew', label: 'Crew', ikon: 'pi-users', jumlah: r?.jumlahCrew ?? 0 },
    { tab: 'vendor', label: 'Vendor', ikon: 'pi-truck', jumlah: r?.jumlahVendor ?? 0 },
  ]
})
</script>

<template>
  <div class="ringkasan">
    <!-- Kolom kiri: informasi event -->
    <section class="kartu info">
      <h2>Informasi event</h2>
      <p v-if="event.deskripsi" class="deskripsi">{{ event.deskripsi }}</p>
      <p v-else class="deskripsi kosong-teks">Belum ada deskripsi.</p>

      <dl class="daftar">
        <div>
          <dt>Jenis</dt>
          <dd>{{ event.jenis }}</dd>
        </div>
        <div>
          <dt>Tanggal</dt>
          <dd>{{ rentangTanggal(event.tanggalMulai, event.tanggalSelesai) }}</dd>
        </div>
        <div>
          <dt>Lokasi</dt>
          <dd>{{ event.lokasi }}</dd>
        </div>
        <div>
          <dt>Client</dt>
          <dd>
            {{ event.namaClient }}
            <span v-if="event.perusahaanClient" class="redup">· {{ event.perusahaanClient }}</span>
            <span class="kontak">
              <a
                v-if="event.teleponClient"
                :href="`tel:${event.teleponClient.replace(/[\s-]/g, '')}`"
              >
                <i class="pi pi-phone" /> {{ event.teleponClient }}
              </a>
              <a v-if="event.emailClient" :href="`mailto:${event.emailClient}`">
                <i class="pi pi-envelope" /> {{ event.emailClient }}
              </a>
            </span>
          </dd>
        </div>
        <div>
          <dt>PIC</dt>
          <dd>
            {{ event.namaPic }}
            <span v-if="event.emailPic" class="redup">· {{ event.emailPic }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Kolom kanan: angka-angka -->
    <div class="samping">
      <section class="kartu mundur" :class="`mundur--${mundur.warna}`">
        <span class="mundur__label">Hitung mundur</span>
        <strong class="mundur__judul">{{ mundur.judul }}</strong>
        <span class="mundur__sub">{{ mundur.sub }}</span>
      </section>

      <Message v-if="ringkasan.isError.value" severity="error" :closable="false">
        <div class="galat-muat">
          <span>Ringkasan tidak dapat dimuat. {{ pesanError(ringkasan.error.value) }}</span>
          <Button
            label="Coba lagi"
            size="small"
            severity="danger"
            outlined
            :loading="ringkasan.isFetching.value"
            @click="ringkasan.refetch()"
          />
        </div>
      </Message>

      <section class="kartu">
        <h2>Penugasan</h2>
        <div class="tugas">
          <button
            v-for="p in penugasan"
            :key="p.tab"
            type="button"
            class="tugas__item"
            @click="emit('bukaTab', p.tab)"
          >
            <i class="pi" :class="p.ikon" />
            <strong class="angka">{{ ringkasan.isPending.value ? '…' : p.jumlah }}</strong>
            <span>{{ p.label }}</span>
          </button>
        </div>
      </section>
    </div>

    <section class="kartu">
      <div class="judul-baris">
        <h2>Progres task</h2>
        <span v-if="task && task.total" class="angka redup">
          {{ task.selesai }} dari {{ task.total }} selesai
        </span>
      </div>

      <p v-if="ringkasan.isPending.value" class="redup">Memuat…</p>
      <p v-else-if="task && task.total === 0" class="kosong-teks">
        Belum ada task untuk event ini. Tambahkan lewat tab Task.
      </p>
      <template v-else-if="task">
        <ProgressBar :value="task.persen" class="progres" :show-value="false" />
        <span class="persen angka">{{ task.persen }}%</span>
        <div class="legenda">
          <span v-for="l in task.legenda" :key="l.info.label" class="legenda__item">
            <StatusBadge :status="l.info" />
            <strong class="angka">{{ l.jumlah }}</strong>
          </span>
        </div>
        <Message v-if="task.terlambat > 0" severity="warn" :closable="false" size="small">
          {{ task.terlambat }} task melewati deadline.
        </Message>
      </template>
    </section>

    <section v-if="budget || ringkasan.isPending.value" class="kartu">
      <div class="judul-baris">
        <h2>Ringkasan budget</h2>
      </div>

      <p v-if="ringkasan.isPending.value" class="redup">Memuat…</p>
      <template v-else-if="budget">
        <div class="angka-budget">
          <div>
            <span>Estimasi</span>
            <strong class="angka">{{ rupiah(budget.estimasi) }}</strong>
          </div>
          <div>
            <span>Biaya aktual</span>
            <strong class="angka">{{ rupiah(budget.aktual) }}</strong>
          </div>
          <div>
            <span>Selisih</span>
            <strong class="angka" :class="budget.selisih < 0 ? 'minus' : 'plus'">
              {{ budget.selisih < 0 ? '−' : '' }}{{ rupiah(Math.abs(budget.selisih)) }}
            </strong>
          </div>
          <div>
            <span>Sponsorship</span>
            <strong class="angka">{{ rupiah(budget.sponsorship) }}</strong>
          </div>
        </div>
        <ProgressBar :value="budget.persen" class="progres" :show-value="false" />
        <span class="persen redup">Realisasi {{ budget.persen }}% dari estimasi</span>
        <Message v-if="budget.belumLunas > 0" severity="secondary" :closable="false" size="small">
          {{ budget.belumLunas }} pos anggaran belum lunas. Rinciannya di tab Budget.
        </Message>
      </template>
    </section>
  </div>
</template>

<style scoped>
.ringkasan {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 1rem;
}

.kartu {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface);
}
.kartu h2 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--ns-text);
}
.judul-baris {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.redup {
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.kosong-teks {
  margin: 0;
  color: var(--ns-text-3);
  font-size: 0.85rem;
}

/* Informasi */
.deskripsi {
  margin: 0;
  color: var(--ns-text-2);
  font-size: 0.875rem;
  line-height: 1.6;
}
.daftar {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0.25rem 0 0;
}
.daftar > div {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 0.75rem;
}
.daftar dt {
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.daftar dd {
  margin: 0;
  color: var(--ns-text);
  font-size: 0.875rem;
}
.kontak {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: 0.25rem;
}
.kontak a {
  color: var(--ns-accent-text);
  font-size: 0.82rem;
  text-decoration: none;
}
.kontak a:hover {
  text-decoration: underline;
}
.kontak i {
  font-size: 0.75rem;
}

/* Samping */
.samping {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.mundur {
  gap: 0.15rem;
}
.mundur__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.8;
}
.mundur__judul {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.mundur__sub {
  font-size: 0.85rem;
  opacity: 0.85;
}
.mundur--biru {
  background: #eef3ff;
  border-color: #cfdcff;
  color: #1d4ed8;
}
.mundur--kuning {
  background: #fff6e5;
  border-color: #fbe0a8;
  color: #9a5b00;
}
.mundur--hijau {
  background: #e7f7ee;
  border-color: #bfe8cf;
  color: #177245;
}
.mundur--merah {
  background: #fdecec;
  border-color: #f6c6c6;
  color: #b42323;
}
.mundur--abu,
.mundur--ungu {
  background: var(--ns-surface-2);
  color: var(--ns-text-2);
}

.tugas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.tugas__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface-2);
  color: var(--ns-text-2);
  font: inherit;
  font-size: 0.8rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.12s,
    background 0.12s;
}
.tugas__item:hover {
  border-color: var(--ns-accent);
  background: var(--ns-accent-soft);
}
.tugas__item i {
  color: var(--ns-accent-text);
  font-size: 0.85rem;
}
.tugas__item strong {
  color: var(--ns-text);
  font-size: 1.35rem;
  font-weight: 650;
}

/* Progres */
.progres {
  height: 0.55rem;
}
.persen {
  margin-top: -0.4rem;
  font-size: 0.8rem;
  color: var(--ns-text-2);
}
.legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.legenda__item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.legenda__item strong {
  color: var(--ns-text);
  font-size: 0.875rem;
}

/* Budget */
.angka-budget {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}
.angka-budget div {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.angka-budget span {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}
.angka-budget strong {
  color: var(--ns-text);
  font-size: 0.98rem;
  font-weight: 650;
}
.angka-budget .plus {
  color: var(--ns-success);
}
.angka-budget .minus {
  color: var(--ns-danger);
}

.galat-muat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 900px) {
  .ringkasan {
    grid-template-columns: 1fr;
  }
}
</style>
