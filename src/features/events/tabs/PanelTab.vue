<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { pesanError } from '@/api/http'

/**
 * Kerangka tab detail event (talent, crew, vendor, rundown, task, budget): judul, tombol tambah,
 * state loading/error/kosong, lalu tabel di slot default.
 */
defineProps<{
  judul: string
  deskripsi: string
  labelTambah: string
  ikonKosong: string
  pesanKosong: string
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: unknown
  kosong: boolean
  /** Sembunyikan tombol tambah, misalnya bagi pengguna yang hanya boleh melihat event ini. */
  tanpaTambah?: boolean
}>()
const emit = defineEmits<{ tambah: []; muatUlang: [] }>()

defineSlots<{
  default(): unknown
  /** Angka ringkasan di kanan judul, misalnya total fee. */
  ringkasan?(): unknown
}>()
</script>

<template>
  <section class="panel">
    <header class="kepala">
      <div>
        <h2>{{ judul }}</h2>
        <p>{{ deskripsi }}</p>
      </div>
      <div class="kanan">
        <slot name="ringkasan" />
        <Button
          v-if="!tanpaTambah"
          :label="labelTambah"
          icon="pi pi-plus"
          @click="emit('tambah')"
        />
      </div>
    </header>

    <Message v-if="isError" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Data tidak dapat dimuat. {{ pesanError(error) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="isFetching"
          @click="emit('muatUlang')"
        />
      </div>
    </Message>

    <div v-else-if="isPending" class="kosong">
      <i class="pi pi-spin pi-spinner" />
      <p>Memuat data…</p>
    </div>

    <div v-else-if="kosong" class="kosong">
      <span class="kosong__ikon"><i class="pi" :class="ikonKosong" /></span>
      <p>{{ pesanKosong }}</p>
      <Button
        v-if="!tanpaTambah"
        :label="labelTambah"
        icon="pi pi-plus"
        size="small"
        @click="emit('tambah')"
      />
    </div>

    <slot v-else />
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}
.kepala h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--ns-text);
}
.kepala p {
  margin: 0.15rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.kanan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
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
  padding: 2.5rem 1rem;
  border: 1px dashed var(--ns-border-strong);
  border-radius: var(--ns-radius-sm);
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
  font-size: 1.1rem;
}
.kosong p {
  margin: 0;
  max-width: 48ch;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .kanan,
  .kanan :deep(.p-button) {
    width: 100%;
  }
}
</style>
