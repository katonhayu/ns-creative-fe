<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import SelectButton from 'primevue/selectbutton'
import StatusBadge from '@/components/StatusBadge.vue'
import { pesanError } from '@/api/http'
import { rentangTanggal } from '@/utils/format'
import { getEvent, updateEvent } from './event.api'
import type { EventPayload } from './event.schema'
import { STATUS_EVENT } from './event.types'
import EventForm from './EventForm.vue'
import { hitungMundur } from './hitungMundur'
import TabBudget from './tabs/TabBudget.vue'
import TabCrew from './tabs/TabCrew.vue'
import TabRingkasan from './tabs/TabRingkasan.vue'
import TabRundown from './tabs/TabRundown.vue'
import TabDokumen from './tabs/TabDokumen.vue'
import TabLaporan from './tabs/TabLaporan.vue'
import TabTalent from './tabs/TabTalent.vue'
import TabTask from './tabs/TabTask.vue'
import TabVendor from './tabs/TabVendor.vue'

const props = defineProps<{ id: string }>()

const route = useRoute()
const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()

const detail = useQuery({
  queryKey: computed(() => ['events', props.id]),
  queryFn: () => getEvent(props.id),
})
const event = computed(() => detail.data.value)
const mundur = computed(() => (event.value ? hitungMundur(event.value) : null))

// Judul tab browser memakai nama event.
watch(event, (e) => {
  if (e) document.title = `${e.nama} · NS Creative`
})

// --- Tab ---------------------------------------------------------------------

// Semua yang bisa membuka event melihat semua tab, termasuk Budget. Tombol ubah di tiap tab
// hanya muncul jika event.bolehKelola (admin atau crew PIC event ini).
const TAB = [
  { value: 'ringkasan', label: 'Ringkasan', ikon: 'pi-th-large' },
  { value: 'talent', label: 'Talent', ikon: 'pi-star' },
  { value: 'crew', label: 'Crew', ikon: 'pi-users' },
  { value: 'vendor', label: 'Vendor', ikon: 'pi-truck' },
  { value: 'rundown', label: 'Rundown', ikon: 'pi-clock' },
  { value: 'task', label: 'Task', ikon: 'pi-check-square' },
  { value: 'budget', label: 'Budget', ikon: 'pi-wallet' },
  { value: 'dokumen', label: 'Dokumen', ikon: 'pi-folder' },
  { value: 'laporan', label: 'Laporan', ikon: 'pi-file' },
]

const tabAktif = computed({
  get: () => {
    const q = route.query.tab
    return typeof q === 'string' && TAB.some((t) => t.value === q) ? q : 'ringkasan'
  },
  set: (tab: string) => {
    router.replace({ query: { ...route.query, tab: tab === 'ringkasan' ? undefined : tab } })
  },
})

// --- Edit event --------------------------------------------------------------

const formTerbuka = ref(false)

const mutasiSimpan = useMutation({
  mutationFn: (payload: EventPayload) => updateEvent(props.id, payload),
  onSuccess: (hasil) => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
    toast.add({
      severity: 'success',
      summary: 'Perubahan disimpan',
      detail: `${hasil.nama} berhasil diperbarui.`,
      life: 3000,
    })
    formTerbuka.value = false
  },
})

async function simpan(payload: EventPayload) {
  await mutasiSimpan.mutateAsync(payload)
}
</script>

<template>
  <div class="halaman">
    <RouterLink :to="{ name: 'events' }" class="kembali">
      <i class="pi pi-arrow-left" /> Kembali ke daftar event
    </RouterLink>

    <!-- Loading -->
    <section v-if="detail.isPending.value" class="kartu kepala">
      <Skeleton width="55%" height="1.6rem" />
      <Skeleton width="80%" height="1rem" />
      <Skeleton width="100%" height="2.5rem" />
    </section>

    <!-- Error: tidak ditemukan / tidak punya akses / jaringan -->
    <section v-else-if="detail.isError.value || !event" class="kartu galat">
      <span class="galat__ikon"><i class="pi pi-exclamation-circle" /></span>
      <h1>Event tidak dapat dibuka</h1>
      <p>{{ pesanError(detail.error.value) }}</p>
      <div class="galat__aksi">
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          outlined
          :loading="detail.isFetching.value"
          @click="detail.refetch()"
        />
        <Button label="Ke daftar event" @click="router.push({ name: 'events' })" />
      </div>
    </section>

    <template v-else>
      <section class="kartu kepala">
        <div class="kepala__atas">
          <div class="kepala__judul">
            <div class="judul-baris">
              <h1>{{ event.nama }}</h1>
              <StatusBadge :status="STATUS_EVENT[event.status]" />
            </div>
            <ul class="meta">
              <li>
                <i class="pi pi-calendar" />{{
                  rentangTanggal(event.tanggalMulai, event.tanggalSelesai)
                }}
              </li>
              <li><i class="pi pi-map-marker" />{{ event.lokasi }}</li>
              <li>
                <i class="pi pi-user" />{{ event.namaClient
                }}<template v-if="event.perusahaanClient"> · {{ event.perusahaanClient }}</template>
              </li>
              <li><i class="pi pi-id-card" />PIC {{ event.namaPic }}</li>
            </ul>
          </div>

          <div class="kepala__kanan">
            <span
              v-if="mundur"
              class="mundur"
              :class="`mundur--${mundur.warna}`"
              :title="mundur.sub"
            >
              {{ mundur.judul }}
            </span>
            <Button
              v-if="event.bolehKelola"
              label="Edit event"
              icon="pi pi-pen-to-square"
              outlined
              @click="formTerbuka = true"
            />
            <span
              v-else
              class="hanya-lihat"
              title="Hanya admin dan PIC event yang bisa mengubah data"
            >
              <i class="pi pi-eye" /> Hanya lihat
            </span>
          </div>
        </div>
      </section>

      <section class="kartu tab-kartu">
        <nav class="tab-nav">
          <SelectButton
            v-model="tabAktif"
            :options="TAB"
            option-value="value"
            option-label="label"
            data-key="value"
            :allow-empty="false"
            aria-label="Bagian detail event"
            class="tab-pilih"
          >
            <template #option="{ option }">
              <i class="pi" :class="option.ikon" />
              <span>{{ option.label }}</span>
            </template>
          </SelectButton>
        </nav>

        <!-- Hanya bagian aktif yang dirender; datanya tetap tersimpan di cache TanStack Query. -->
        <div
          class="tab-isi"
          role="region"
          :aria-label="TAB.find((t) => t.value === tabAktif)?.label"
        >
          <TabRingkasan
            v-if="tabAktif === 'ringkasan'"
            :event="event"
            @buka-tab="tabAktif = $event"
          />
          <TabTalent v-else-if="tabAktif === 'talent'" :event="event" />
          <TabCrew v-else-if="tabAktif === 'crew'" :event="event" />
          <TabVendor v-else-if="tabAktif === 'vendor'" :event="event" />
          <TabRundown v-else-if="tabAktif === 'rundown'" :event="event" />
          <TabTask v-else-if="tabAktif === 'task'" :event="event" />
          <TabBudget
            v-else-if="tabAktif === 'budget'"
            :event="event"
            @buka-tab="tabAktif = $event"
          />
          <TabDokumen v-else-if="tabAktif === 'dokumen'" :event="event" />
          <TabLaporan
            v-else-if="tabAktif === 'laporan'"
            :event="event"
            @edit-event="formTerbuka = true"
            @buka-tab="tabAktif = $event"
          />
        </div>
      </section>

      <EventForm
        v-model:visible="formTerbuka"
        :event="event"
        :menyimpan="mutasiSimpan.isPending.value"
        :simpan="simpan"
      />
    </template>
  </div>
</template>

<style scoped>
.halaman {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.kembali {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: fit-content;
  color: var(--ns-text-2);
  font-size: 0.85rem;
  text-decoration: none;
}
.kembali:hover {
  color: var(--ns-accent-text);
}
.kembali i {
  font-size: 0.75rem;
}

.kartu {
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius);
  box-shadow: var(--ns-shadow-sm);
}

/* Header event */
.kepala {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.35rem 1.5rem;
}
.kepala__atas {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem 1.5rem;
}
.kepala__judul {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.judul-baris {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
}
.judul-baris h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 650;
  color: var(--ns-text);
  line-height: 1.25;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ns-text-2);
  font-size: 0.85rem;
}
.meta li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.meta i {
  color: var(--ns-text-3);
  font-size: 0.8rem;
}
.kepala__kanan {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mundur {
  padding: 0.4rem 0.85rem;
  border-radius: var(--ns-radius-sm);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.mundur--biru {
  background: #e3ecff;
  color: #1d4ed8;
}
.mundur--kuning {
  background: #fff1d6;
  color: #9a5b00;
}
.mundur--hijau {
  background: #dcf5e6;
  color: #177245;
}
.mundur--merah {
  background: #fde4e4;
  color: #b42323;
}
.mundur--abu,
.mundur--ungu {
  background: var(--ns-surface-2);
  color: var(--ns-text-2);
}

.hanya-lihat {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  color: var(--ns-text-2);
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Error */
.galat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
}
.galat__ikon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--ns-danger-soft);
  color: var(--ns-danger);
  font-size: 1.3rem;
}
.galat h1 {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
  font-weight: 650;
}
.galat p {
  margin: 0;
  color: var(--ns-text-2);
}
.galat__aksi {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

/* Tab */
.tab-kartu {
  overflow: hidden;
}
/* Navigasi bagian: SelectButton, bisa digeser ke samping di layar sempit. */
.tab-nav {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--ns-border);
  overflow-x: auto;
}
.tab-pilih {
  display: inline-flex;
  flex-wrap: nowrap;
}
.tab-pilih :deep(.p-togglebutton) {
  flex: none;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}
.tab-pilih :deep(.p-togglebutton-content) {
  gap: 0.45rem;
}
.tab-pilih :deep(.p-togglebutton i) {
  font-size: 0.82rem;
}
.tab-pilih :deep(.p-togglebutton-checked i) {
  color: var(--ns-accent);
}
.tab-isi {
  padding: 1.25rem 1.5rem 1.5rem;
}

@media (max-width: 640px) {
  .kepala {
    padding: 1rem;
  }
  .kepala__kanan {
    width: 100%;
    justify-content: space-between;
  }
  .tab-nav {
    padding: 0.75rem 1rem;
  }
  .tab-isi {
    padding: 1rem;
  }
}
</style>
