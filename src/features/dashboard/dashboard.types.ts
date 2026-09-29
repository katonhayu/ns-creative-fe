import type { Skema } from '@/api/types'

/**
 * Ringkasan halaman depan (`GET /api/dashboard`): event berlangsung dan terdekat, task
 * mendekati deadline, vendor belum lunas, dan statistik tahun ini.
 */
export type Dashboard = Skema['DashboardDto']
