<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'

defineProps<{
  judul: string
  deskripsi: string
  /** Tahap roadmap tempat modul ini dikerjakan, misalnya "Tahap 2". */
  tahap: string
}>()
</script>

<template>
  <div class="halaman">
    <PageHeader :judul="judul" :deskripsi="deskripsi" />

    <div class="kosong">
      <span class="kosong__ikon"><i class="pi pi-inbox" /></span>
      <h2>Modul {{ judul }} belum dibuat</h2>
      <p>Halaman ini masih kerangka. Isinya menyusul sesuai urutan roadmap.</p>
      <span class="tahap">{{ tahap }}</span>
    </div>
  </div>
</template>

<style scoped>
.halaman {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.kosong {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 4rem 1.5rem;
  background: var(--ns-surface);
  border: 1px dashed var(--ns-border-strong);
  border-radius: var(--ns-radius);
  text-align: center;
}
.kosong__ikon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
  border-radius: 14px;
  background: var(--ns-surface-2);
  color: var(--ns-text-3);
  font-size: 1.25rem;
}
.kosong h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ns-text);
}
.kosong p {
  margin: 0;
  max-width: 46ch;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--ns-text-2);
}
.tahap {
  margin-top: 0.6rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 0.72rem;
  font-weight: 600;
}
</style>
