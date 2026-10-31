<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/vue-query'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import SelectButton from 'primevue/selectbutton'
import { pesanError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import { listSchedules } from './schedule.api'
import RundownList from './RundownList.vue'

const auth = useAuthStore()

type Rentang = 'hari-ini' | '7' | '30' | 'semua'
const rentang = ref<Rentang>('7')
const PILIHAN_RENTANG = [
  { value: 'hari-ini', label: 'Hari ini' },
  { value: '7', label: '7 hari ke depan' },
  { value: '30', label: '30 hari ke depan' },
  { value: 'semua', label: 'Semua' },
]

const filter = computed(() => {
  const hariIni = dayjs().format('YYYY-MM-DD')
  switch (rentang.value) {
    case 'hari-ini':
      return { dari: hariIni, sampai: hariIni }
    case '7':
      return { dari: hariIni, sampai: dayjs().add(6, 'day').format('YYYY-MM-DD') }
    case '30':
      return { dari: hariIni, sampai: dayjs().add(29, 'day').format('YYYY-MM-DD') }
    default:
      return {}
  }
})

const daftar = useQuery({
  queryKey: computed(() => ['schedules', filter.value]),
  queryFn: () => listSchedules(filter.value),
})

const kataKunci = ref('')
const tampil = computed(() => {
  const q = kataKunci.value.trim().toLowerCase()
  return (daftar.data.value ?? []).filter(
    (s) =>
      !q ||
      [s.kegiatan, s.namaEvent, s.lokasi, s.namaPic].some((v) => v?.toLowerCase().includes(q)),
  )
})
const jumlahEvent = computed(() => new Set(tampil.value.map((s) => s.eventId)).size)
</script>

<template>
  <section class="kartu">
    <div class="kepala">
      <div>
        <h1>{{ auth.peran === 'crew' ? 'Jadwal Saya' : 'Jadwal' }}</h1>
        <p>
          {{
            auth.peran === 'crew'
              ? 'Rundown event yang kamu pegang atau tempat kamu ditugaskan. Sesi yang kamu pegang diberi tanda.'
              : 'Rundown dari semua event yang bisa kamu akses. Ubah sesi dari tab Rundown di detail event.'
          }}
        </p>
      </div>
    </div>

    <div class="toolbar">
      <SelectButton
        v-model="rentang"
        :options="PILIHAN_RENTANG"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        size="small"
        aria-label="Rentang jadwal"
      />
      <IconField class="cari">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="kataKunci"
          placeholder="Cari kegiatan, event, lokasi, atau PIC…"
          aria-label="Cari jadwal"
          fluid
        />
      </IconField>
    </div>

    <Message v-if="daftar.isError.value" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Jadwal tidak dapat dimuat. {{ pesanError(daftar.error.value) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="daftar.isFetching.value"
          @click="daftar.refetch()"
        />
      </div>
    </Message>

    <div v-else-if="daftar.isPending.value" class="kosong">
      <i class="pi pi-spin pi-spinner" />
      <p>Memuat jadwal…</p>
    </div>

    <div v-else-if="!tampil.length" class="kosong">
      <span class="kosong__ikon"><i class="pi pi-clock" /></span>
      <p v-if="kataKunci">Tidak ada sesi yang cocok dengan “{{ kataKunci }}”.</p>
      <p v-else-if="rentang !== 'semua'">
        Tidak ada jadwal pada rentang ini.
        <Button label="Lihat semua jadwal" text size="small" @click="rentang = 'semua'" />
      </p>
      <p v-else-if="auth.peran === 'crew'">
        Kamu belum memegang atau ditugaskan di event mana pun.
      </p>
      <p v-else>Belum ada rundown di event yang bisa kamu akses.</p>
    </div>

    <template v-else>
      <p class="jumlah">{{ tampil.length }} sesi dari {{ jumlahEvent }} event</p>
      <RundownList :items="tampil" tampilkan-event :sorot-crew-id="auth.crewId" />
    </template>
  </section>
</template>

<style scoped>
.kartu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.35rem 1.5rem 1.25rem;
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius);
  box-shadow: var(--ns-shadow-sm);
}
.kepala h1 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}
.kepala p {
  margin: 0.2rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.83rem;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.cari {
  flex: 1 1 240px;
  max-width: 360px;
  margin-left: auto;
}
.galat-muat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}
.kosong {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--ns-text-2);
}
.kosong > i {
  color: var(--ns-text-3);
}
.kosong__ikon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
}
.kosong p {
  margin: 0;
  font-size: 0.875rem;
}
.jumlah {
  margin: -0.25rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .kartu {
    padding: 1rem;
  }
  .cari {
    max-width: none;
    margin-left: 0;
  }
}
</style>
