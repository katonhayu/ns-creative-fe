<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Menu from 'primevue/menu'
import Toolbar from 'primevue/toolbar'
import { useAuthStore } from '@/stores/auth'
import { LABEL_PERAN } from '@/features/auth/auth.types'
import { inisial } from '@/utils/format'
import logo from '@/assets/NsCreativeLogo.png'

const auth = useAuthStore()
const queryClient = useQueryClient()
const route = useRoute()
const router = useRouter()

/** Menu yang ditandai aktif. Halaman turunan (misalnya detail event) menunjuk menu induknya. */
const menuAktif = computed(() => route.meta.menu ?? route.name)
const judulHalaman = computed(() => route.meta.judul ?? '')

const sidebarTerbuka = ref(false)

interface ItemMenu {
  nama: string
  label: string
  ikon: string
}

interface GrupMenu {
  /** Judul grup. null = tanpa judul (menu utama di paling atas). */
  judul: string | null
  item: ItemMenu[]
}

// Data transaksi (per event) dipisah dari data master yang dipakai ulang di banyak event.
const GRUP_MENU: GrupMenu[] = [
  {
    judul: null,
    item: [{ nama: 'dashboard', label: 'Dashboard', ikon: 'pi-home' }],
  },
  {
    judul: 'Transaksi',
    item: [
      { nama: 'events', label: 'Event & Budgeting', ikon: 'pi-calendar' },
      { nama: 'schedules', label: 'Jadwal', ikon: 'pi-clock' },
      { nama: 'tasks', label: 'Task', ikon: 'pi-check-square' },
      { nama: 'reports', label: 'Laporan', ikon: 'pi-file' },
    ],
  },
  {
    judul: 'Data Master',
    item: [
      { nama: 'clients', label: 'Client', ikon: 'pi-user' },
      { nama: 'talents', label: 'Talent', ikon: 'pi-star' },
      { nama: 'crews', label: 'Crew', ikon: 'pi-users' },
      { nama: 'vendors', label: 'Vendor', ikon: 'pi-truck' },
      { nama: 'users', label: 'Pengguna', ikon: 'pi-id-card' },
    ],
  },
]

// Hak akses dibaca dari meta rute supaya menu dan route guard tidak bisa berbeda.
function bolehBuka(nama: string) {
  const izin = router.resolve({ name: nama }).meta.peran
  return !izin || (auth.peran !== null && izin.includes(auth.peran))
}

/** Grup yang semua menunya tidak boleh dibuka ikut disembunyikan. */
const menu = computed(() =>
  GRUP_MENU.map((g) => ({ ...g, item: g.item.filter((i) => bolehBuka(i.nama)) })).filter(
    (g) => g.item.length > 0,
  ),
)

const inisialUser = computed(() => inisial(auth.user?.nama ?? ''))
const labelPeran = computed(() => (auth.peran ? LABEL_PERAN[auth.peran] : ''))

const menuAkun = useTemplateRef<{ toggle: (e: Event) => void }>('menuAkun')
const itemAkun = computed(() => [
  {
    label: auth.user?.email ?? '',
    items: [{ label: 'Keluar', icon: 'pi pi-sign-out', command: keluar }],
  },
])

async function keluar() {
  // Tunggu sesi terhapus dulu; kalau tidak, guard router masih menganggap sudah login.
  await auth.logout()
  queryClient.clear()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell" :class="{ 'shell--terbuka': sidebarTerbuka }">
    <aside class="sidebar">
      <div class="brand">
        <img :src="logo" alt="Logo NS Creative" class="brand__logo" />
        <span class="brand__teks">NS Creative</span>
      </div>

      <nav class="nav">
        <div
          v-for="grup in menu"
          :key="grup.judul ?? 'utama'"
          class="nav__grup"
          role="group"
          :aria-label="grup.judul ?? 'Menu utama'"
        >
          <span v-if="grup.judul" class="nav__judul">{{ grup.judul }}</span>
          <RouterLink
            v-for="item in grup.item"
            :key="item.nama"
            :to="{ name: item.nama }"
            class="nav__item"
            :class="{ 'nav__item--aktif': menuAktif === item.nama }"
            :aria-current="menuAktif === item.nama ? 'page' : undefined"
            @click="sidebarTerbuka = false"
          >
            <i class="pi" :class="item.ikon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <p class="sidebar__kaki">© {{ new Date().getFullYear() }} NS Creative</p>
    </aside>

    <div class="utama">
      <Toolbar class="topbar" role="banner">
        <template #start>
          <button
            class="ikon-btn topbar__menu"
            type="button"
            aria-label="Buka menu"
            @click="sidebarTerbuka = !sidebarTerbuka"
          >
            <i class="pi pi-bars" />
          </button>
          <span class="topbar__judul">{{ judulHalaman }}</span>
        </template>

        <template #end>
          <button
            class="akun"
            type="button"
            aria-haspopup="true"
            aria-controls="menu-akun"
            @click="menuAkun?.toggle($event)"
          >
            <span class="akun__avatar" aria-hidden="true">{{ inisialUser }}</span>
            <span class="akun__teks">
              <strong>{{ auth.user?.nama }}</strong>
              <small>{{ labelPeran }}</small>
            </span>
            <i class="pi pi-chevron-down akun__panah" />
          </button>
          <Menu id="menu-akun" ref="menuAkun" :model="itemAkun" popup />
        </template>
      </Toolbar>

      <main class="konten">
        <RouterView />
      </main>
    </div>

    <div class="tirai" @click="sidebarTerbuka = false" />
    <Toast position="top-right" />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.shell {
  /* Jarak kartu sidebar dari tepi layar. */
  --jarak-sidebar: 0.85rem;
  display: grid;
  grid-template-columns: calc(240px + var(--jarak-sidebar)) 1fr;
  min-height: 100vh;
  background: var(--ns-bg);
}

/* ---- Sidebar ---------------------------------------------------------- */
/* Sidebar berupa kartu mengambang, menempel saat halaman di-scroll. */
.sidebar {
  position: sticky;
  top: var(--jarak-sidebar);
  height: calc(100vh - var(--jarak-sidebar) * 2);
  margin: var(--jarak-sidebar) 0 var(--jarak-sidebar) var(--jarak-sidebar);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.1rem 0.85rem;
  background: linear-gradient(180deg, var(--ns-side-bg-2) 0%, var(--ns-side-bg) 55%);
  color: var(--ns-side-text);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--ns-radius-lg);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.08),
    0 12px 32px -12px rgba(24, 33, 61, 0.45);
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem 0.5rem 0.75rem;
  border-bottom: 1px solid var(--ns-side-border);
}
.brand__logo {
  width: auto;
  height: 32px;
  object-fit: contain;
}
.brand__teks {
  color: var(--ns-side-text-strong);
  font-size: 0.95rem;
  font-weight: 650;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  overflow-y: auto;
  /* Scrollbar terang tipis, baru terlihat saat kursor di atas sidebar. */
  --ns-scroll-thumb: transparent;
  --ns-scroll-thumb-hover: rgba(255, 255, 255, 0.32);
  margin-right: -0.4rem;
  padding-right: 0.4rem;
}
.sidebar:hover .nav,
.nav:focus-within {
  --ns-scroll-thumb: rgba(255, 255, 255, 0.16);
}
.nav__grup {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.nav__judul {
  padding: 0 0.8rem 0.35rem;
  color: var(--ns-side-muted);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.nav__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  color: var(--ns-side-text);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}
.nav__item:hover {
  background: var(--ns-side-hover);
  color: var(--ns-side-text-strong);
}
.nav__item--aktif {
  background: var(--ns-side-active);
  color: var(--ns-side-active-text);
  font-weight: 600;
  box-shadow: 0 6px 16px -8px rgba(47, 107, 255, 0.9);
}
.nav__item i {
  width: 1.1rem;
  font-size: 0.95rem;
  text-align: center;
}

.sidebar__kaki {
  margin: auto 0 0;
  padding: 0 0.5rem;
  color: var(--ns-side-muted);
  font-size: 0.7rem;
}

/* ---- Area utama ------------------------------------------------------- */
.utama {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Toolbar PrimeVue: bingkai bawaannya dilepas, jadi bar penuh selebar area utama. */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 60px;
  padding: 0 1.75rem;
  /* Kaca buram: konten yang di-scroll di bawahnya tetap samar terlihat. */
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  backdrop-filter: blur(12px) saturate(160%);
  border: none;
  border-bottom: 1px solid rgba(228, 233, 242, 0.8);
  border-radius: 0;
}
.topbar :deep(.p-toolbar-start),
.topbar :deep(.p-toolbar-end) {
  gap: 0.75rem;
}
.topbar__menu {
  display: none;
}
.topbar__judul {
  color: var(--ns-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.akun {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.5rem 0.3rem 0.3rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.akun:hover {
  background: var(--ns-surface-2);
}
.akun__avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 50%;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 0.75rem;
  font-weight: 700;
}
.akun__teks {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.akun__teks strong {
  color: var(--ns-text);
  font-size: 0.83rem;
  font-weight: 600;
}
.akun__teks small {
  color: var(--ns-text-3);
  font-size: 0.72rem;
}
.akun__panah {
  color: var(--ns-text-3);
  font-size: 0.7rem;
}

.ikon-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ns-text-2);
  cursor: pointer;
}
.ikon-btn:hover {
  background: var(--ns-surface-2);
}

.konten {
  flex: 1;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 1.5rem 1.75rem;
  min-width: 0;
}

.tirai {
  display: none;
}

/* ---- Mobile ----------------------------------------------------------- */
@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: fixed;
    inset: var(--jarak-sidebar) auto var(--jarak-sidebar) var(--jarak-sidebar);
    width: 260px;
    height: auto;
    margin: 0;
    transform: translateX(calc(-100% - var(--jarak-sidebar) * 2));
    transition: transform 0.22s ease;
    z-index: 30;
    box-shadow: var(--ns-shadow-lg);
  }
  .shell--terbuka .sidebar {
    transform: translateX(0);
  }
  .shell--terbuka .tirai {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(10, 15, 30, 0.5);
    z-index: 20;
  }
  .topbar {
    padding: 0 1rem;
  }
  .topbar__menu {
    display: grid;
  }
  .konten {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .akun__teks {
    display: none;
  }
}
</style>
