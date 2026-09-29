<script setup lang="ts">
import { RouterView } from 'vue-router'
import logo from '@/assets/NsCreativeLogo.png'

const keunggulan = [
  {
    ikon: 'pi-calendar-clock',
    judul: 'Satu halaman per event',
    teks: 'Talent, crew, vendor, rundown, task, budget, dan dokumen dalam satu tempat.',
  },
  {
    ikon: 'pi-users',
    judul: 'Master data dipakai ulang',
    teks: 'Talent, crew, dan vendor diinput sekali, lalu ditugaskan ke banyak event.',
  },
  {
    ikon: 'pi-wallet',
    judul: 'Budget selalu sinkron',
    teks: 'Fee talent dan biaya vendor otomatis masuk ke anggaran event.',
  },
]
</script>

<template>
  <div class="laman">
    <aside class="panel">
      <div class="panel__cahaya" aria-hidden="true" />

      <div class="brand">
        <img :src="logo" alt="Logo" class="brand__logo" />
        <span class="brand__nama">NS Creative</span>
      </div>

      <div class="panel__isi">
        <h2>Seluruh operasional event, dari brief sampai laporan.</h2>
        <ul class="fitur">
          <li v-for="f in keunggulan" :key="f.judul">
            <i class="pi" :class="f.ikon" />
            <div>
              <strong>{{ f.judul }}</strong>
              <p>{{ f.teks }}</p>
            </div>
          </li>
        </ul>
      </div>

      <footer class="panel__kaki">
        © {{ new Date().getFullYear() }} NS Creative · Aplikasi internal
      </footer>
    </aside>

    <main class="isi">
      <div class="brand brand--mobile">
        <img :src="logo" alt="Logo" class="brand__logo" />
        <span class="brand__nama">NS Creative</span>
      </div>

      <div class="isi__tengah">
        <RouterView />
      </div>

      <footer class="isi__kaki">© {{ new Date().getFullYear() }} NS Creative</footer>
    </main>
  </div>
</template>

<style scoped>
.laman {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  min-height: 100vh;
}

/* ---- Panel kiri -------------------------------------------------------- */
.panel {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 2.5rem 3rem;
  background: linear-gradient(160deg, #22305a 0%, var(--ns-side-bg) 60%);
  color: var(--ns-side-text);
}
.panel__cahaya {
  position: absolute;
  top: -20%;
  right: -30%;
  width: 70%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 110, 255, 0.38) 0%, rgba(59, 110, 255, 0) 65%);
  pointer-events: none;
}

.brand {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.brand__logo {
  width: auto;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(47, 107, 255, 0.45));
}
.brand__nama {
  color: var(--ns-side-text-strong);
  font-weight: 600;
  font-size: 0.95rem;
}

.panel__isi {
  position: relative;
  margin: auto 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 440px;
}
.panel__isi h2 {
  margin: 0;
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--ns-side-text-strong);
}

.fitur {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.fitur li {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}
.fitur i {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--ns-side-active);
  color: var(--ns-side-active-text);
  font-size: 0.95rem;
}
.fitur strong {
  display: block;
  color: var(--ns-side-text-strong);
  font-size: 0.92rem;
  font-weight: 600;
}
.fitur p {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--ns-side-text);
}

.panel__kaki {
  position: relative;
  font-size: 0.75rem;
  color: var(--ns-side-muted);
}

/* ---- Sisi form ---------------------------------------------------------- */
.isi {
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  background: var(--ns-surface);
}
.brand--mobile {
  display: none;
}
.isi__tengah {
  flex: 1;
  display: grid;
  place-items: center;
}
.isi__kaki {
  display: none;
  font-size: 0.75rem;
  color: var(--ns-text-3);
  text-align: center;
}

@media (max-width: 900px) {
  .laman {
    grid-template-columns: 1fr;
  }
  .panel {
    display: none;
  }
  .isi {
    background: var(--ns-bg);
    padding: 1.5rem 1rem;
    gap: 1.5rem;
  }
  .brand--mobile {
    display: flex;
    justify-content: center;
  }
  .brand--mobile .brand__nama {
    color: var(--ns-text);
  }
  .isi__kaki {
    display: block;
  }
}
</style>
