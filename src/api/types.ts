import type { components } from './generated/api'

/**
 * Skema DTO dari OpenAPI backend (di-generate: `npm run gen:api`). Tipe modul memakai
 * alias dari sini supaya selalu sama dengan kontrak backend.
 */
export type Skema = components['schemas']

/** Respons daftar berhalaman dari backend (PagedResult<T>). */
export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

/** Query standar endpoint daftar: ?page=1&pageSize=20&search=&sortBy=nama&sortDir=asc */
export interface ListParams<TSort extends string = string> {
  search: string
  page: number
  pageSize: number
  sortBy: TSort
  sortDir: 'asc' | 'desc'
}

/** Kontrak fungsi API yang dibutuhkan useCrud untuk satu modul master data. */
export interface CrudApi<
  T,
  TPayload,
  TSort extends string = string,
  TFilter extends object = object,
> {
  list(params: ListParams<TSort> & TFilter): Promise<Paged<T>>
  create(payload: TPayload): Promise<T>
  update(id: string, payload: TPayload): Promise<T>
  remove(id: string): Promise<void>
}

/** Body error dari backend (ProblemDetails). Pesan untuk pengguna ada di `detail`. */
export interface ApiError {
  title?: string
  detail?: string
  status?: number
  traceId?: string
  /** Error validasi per field, key camelCase (misalnya "nama", "[2].kegiatan"). */
  errors?: Record<string, string[]>
}

/** Batas pageSize backend. Dipakai tab event yang menampilkan seluruh baris sekaligus. */
export const PAGE_SIZE_MAKS = 100
