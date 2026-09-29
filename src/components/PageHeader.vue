<script setup lang="ts">
defineProps<{
  judul: string
  deskripsi?: string
}>()
</script>

<template>
  <header class="kepala">
    <div class="teks">
      <h1 class="judul">{{ judul }}</h1>
      <p v-if="deskripsi" class="deskripsi">{{ deskripsi }}</p>
    </div>
    <div v-if="$slots.default" class="aksi">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}
.teks {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.judul {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 650;
  color: var(--ns-text);
  line-height: 1.2;
}
.deskripsi {
  margin: 0;
  max-width: 64ch;
  color: var(--ns-text-2);
  font-size: 0.9rem;
}
.aksi {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .aksi,
  .aksi :deep(.p-button) {
    width: 100%;
  }
}
</style>
