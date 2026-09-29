<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="laman">
    <div class="kartu">
      <span class="kode">404</span>
      <h1>Halaman tidak ditemukan</h1>
      <p>Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
      <RouterLink to="/" class="tautan">
        <i class="pi pi-arrow-left" /> Kembali ke halaman utama
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.laman {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: var(--ns-bg);
}
.kartu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 2.5rem 2rem;
  max-width: 420px;
  width: 100%;
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-lg);
  box-shadow: var(--ns-shadow);
  text-align: center;
}
.kode {
  padding: 0.15rem 0.7rem;
  border-radius: 999px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}
h1 {
  margin: 0.6rem 0 0;
  font-size: 1.25rem;
  font-weight: 650;
  color: var(--ns-text);
}
p {
  margin: 0;
  color: var(--ns-text-2);
  font-size: 0.9rem;
}
.tautan {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ns-accent-text);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}
.tautan:hover {
  text-decoration: underline;
}
.tautan i {
  font-size: 0.75rem;
}
</style>
