import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { Peran } from '@/features/auth/auth.types'

declare module 'vue-router' {
  interface RouteMeta {
    judul?: string
    /** Rute yang bisa dibuka tanpa login. */
    publik?: boolean
    /** Peran yang boleh membuka rute ini. Kosong = semua pengguna yang login. */
    peran?: Peran[]
    /** Nama rute menu sidebar yang ditandai aktif, jika berbeda dari rute ini. */
    menu?: string
  }
}

/**
 * Data master dan pengguna: admin mengelola, event manager hanya melihat. Crew tidak membuka
 * menunya; ia cukup memilih data master dari dropdown di form event.
 * Halaman event, jadwal, task, dan laporan terbuka untuk semua peran: isinya disaring backend
 * (crew hanya melihat event yang ia pegang atau tempat ia ditugaskan).
 */
const PEMANTAU: Peran[] = ['admin', 'event_manager']

/** Halaman pertama setelah login. Dashboard sudah disaring per pengguna oleh backend. */
export const BERANDA = { name: 'dashboard' }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: AuthLayout,
      meta: { publik: true },
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/features/auth/LoginView.vue'),
          meta: { judul: 'Masuk' },
        },
      ],
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/features/dashboard/DashboardView.vue'),
          meta: { judul: 'Dashboard' },
        },
        {
          path: 'events',
          name: 'events',
          component: () => import('@/features/events/EventListView.vue'),
          meta: { judul: 'Event' },
        },
        {
          path: 'events/:id',
          name: 'event-detail',
          component: () => import('@/features/events/EventDetailView.vue'),
          props: (route) => ({ id: String(route.params.id) }),
          meta: { judul: 'Detail Event & Budgeting', menu: 'events' },
        },
        {
          path: 'schedules',
          name: 'schedules',
          component: () => import('@/features/schedules/ScheduleListView.vue'),
          meta: { judul: 'Jadwal' },
        },
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('@/features/tasks/TaskListView.vue'),
          meta: { judul: 'Task' },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/features/reports/ReportListView.vue'),
          meta: { judul: 'Laporan' },
        },
        {
          path: 'clients',
          name: 'clients',
          component: () => import('@/features/clients/ClientListView.vue'),
          meta: { judul: 'Client', peran: PEMANTAU },
        },
        {
          path: 'talents',
          name: 'talents',
          component: () => import('@/features/talents/TalentListView.vue'),
          meta: { judul: 'Talent', peran: PEMANTAU },
        },
        {
          path: 'crews',
          name: 'crews',
          component: () => import('@/features/crews/CrewListView.vue'),
          meta: { judul: 'Crew', peran: PEMANTAU },
        },
        {
          path: 'vendors',
          name: 'vendors',
          component: () => import('@/features/vendors/VendorListView.vue'),
          meta: { judul: 'Vendor', peran: PEMANTAU },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/features/users/UserListView.vue'),
          meta: { judul: 'Pengguna', peran: PEMANTAU },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'tidak-ditemukan',
      component: () => import('@/features/errors/NotFoundView.vue'),
      meta: { publik: true, judul: 'Halaman tidak ditemukan' },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!to.meta.publik && !auth.sudahLogin) {
    return { name: 'login', query: { lanjut: to.fullPath } }
  }

  if (to.name === 'login' && auth.sudahLogin) {
    return BERANDA
  }

  // Hanya menyembunyikan halaman. Penegakan hak akses tetap di backend.
  if (to.meta.peran && (!auth.peran || !to.meta.peran.includes(auth.peran))) {
    return BERANDA
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.judul ? `${to.meta.judul} · NS Creative` : 'NS Creative'
})

export default router
