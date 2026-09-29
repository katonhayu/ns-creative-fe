import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable'
import { pesanError } from '@/api/http'
import type { CrudApi, ListParams } from '@/api/types'

export interface UseCrudOptions<
  T extends { id: string },
  TPayload,
  TSort extends string,
  TFilter extends object = object,
> {
  /** Kunci cache TanStack Query, misalnya 'clients'. */
  key: string
  api: CrudApi<T, TPayload, TSort, TFilter>
  /** Arah urutan awal. Default 'asc'. */
  urutanAwal?: 'asc' | 'desc'
  /**
   * Filter tambahan selain pencarian (dibaca secara reaktif). Nilainya ikut
   * dikirim ke api.list dan halaman kembali ke 1 setiap filter berubah.
   */
  filter?: () => TFilter
  /** Nama entitas huruf kecil untuk teks antarmuka, misalnya 'client'. */
  label: string
  /** Nama yang mewakili satu baris di pesan toast dan konfirmasi. */
  namaItem: (item: T) => string
  /** Kolom yang boleh dipakai untuk mengurutkan. Yang pertama jadi urutan awal. */
  sortFields: readonly [TSort, ...TSort[]]
  /** Isi dialog konfirmasi hapus. Default: "<nama> akan dihapus dari daftar <label>." */
  pesanHapus?: (item: T) => string
  pageSize?: number
}

/** State dan aksi satu halaman CRUD. Dipakai bersama CrudTable dan form dialog modul. */
export interface Crud<T extends { id: string }, TPayload> {
  label: string
  namaItem(item: T): string

  // Daftar
  readonly kataKunci: string
  readonly search: string
  readonly page: number
  readonly pageSize: number
  readonly sortField: string
  readonly sortOrder: 'asc' | 'desc'
  readonly items: T[]
  readonly total: number
  /** true setelah data pertama berhasil dimuat. */
  readonly sudahDimuat: boolean
  readonly isPending: boolean
  readonly isFetching: boolean
  readonly isError: boolean
  readonly error: unknown
  cari(teks: string): void
  resetPencarian(): void
  gantiHalaman(e: DataTablePageEvent): void
  gantiUrutan(e: DataTableSortEvent): void
  muatUlang(): void

  // Tambah & edit
  formTerbuka: boolean
  readonly itemDipilih: T | null
  readonly sedangMenyimpan: boolean
  bukaTambah(): void
  bukaEdit(item: T): void
  /** Simpan isi form. Reject jika gagal supaya form bisa menampilkan errornya. */
  simpan(payload: TPayload): Promise<void>

  // Hapus
  /** id baris yang sedang dihapus, untuk spinner di tombol hapus. */
  readonly idDihapus: string | null
  konfirmasiHapus(item: T): void
}

const JEDA_CARI = 300

export function useCrud<
  T extends { id: string },
  TPayload,
  TSort extends string,
  TFilter extends object = object,
>(opsi: UseCrudOptions<T, TPayload, TSort, TFilter>): Crud<T, TPayload> {
  const toast = useToast()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const Label = opsi.label.charAt(0).toUpperCase() + opsi.label.slice(1)

  // --- Pencarian, urutan, halaman -------------------------------------------

  const kataKunci = ref('')
  const search = ref('')
  const page = ref(1)
  const pageSize = ref(opsi.pageSize ?? 10)
  const sortField = ref(opsi.sortFields[0]) as Ref<TSort>
  const sortOrder = ref<'asc' | 'desc'>(opsi.urutanAwal ?? 'asc')

  let timerCari: ReturnType<typeof setTimeout> | undefined
  function cari(teks: string) {
    kataKunci.value = teks
    clearTimeout(timerCari)
    timerCari = setTimeout(() => {
      search.value = teks.trim()
      page.value = 1
    }, JEDA_CARI)
  }
  onBeforeUnmount(() => clearTimeout(timerCari))

  function resetPencarian() {
    clearTimeout(timerCari)
    kataKunci.value = ''
    search.value = ''
    page.value = 1
  }

  const params = computed(
    () =>
      ({
        search: search.value,
        page: page.value,
        pageSize: pageSize.value,
        sortBy: sortField.value,
        sortDir: sortOrder.value,
        ...opsi.filter?.(),
      }) as ListParams<TSort> & TFilter,
  )

  if (opsi.filter) {
    watch(opsi.filter, () => (page.value = 1), { deep: true })
  }

  const query = useQuery({
    queryKey: [opsi.key, params],
    queryFn: () => opsi.api.list(params.value),
    placeholderData: keepPreviousData,
  })

  // Halaman terakhir bisa kosong setelah baris terakhirnya dihapus.
  watch(query.data, (d) => {
    if (d && d.items.length === 0 && d.totalItems > 0 && page.value > 1) {
      page.value = Math.max(1, d.totalPages)
    }
  })

  function gantiHalaman(e: DataTablePageEvent) {
    page.value = e.page + 1
    pageSize.value = e.rows
  }

  function gantiUrutan(e: DataTableSortEvent) {
    const field = opsi.sortFields.find((f) => f === e.sortField)
    if (!field) return
    sortField.value = field
    sortOrder.value = e.sortOrder === -1 ? 'desc' : 'asc'
    page.value = 1
  }

  // --- Tambah & edit --------------------------------------------------------

  const formTerbuka = ref(false)
  const itemDipilih = ref(null) as Ref<T | null>

  function bukaTambah() {
    itemDipilih.value = null
    formTerbuka.value = true
  }

  function bukaEdit(item: T) {
    itemDipilih.value = item
    formTerbuka.value = true
  }

  const mutasiSimpan = useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: TPayload }) =>
      id === null ? opsi.api.create(payload) : opsi.api.update(id, payload),
    onSuccess: (hasil, { id }) => {
      queryClient.invalidateQueries({ queryKey: [opsi.key] })
      toast.add({
        severity: 'success',
        summary: id === null ? `${Label} ditambahkan` : 'Perubahan disimpan',
        detail: `${opsi.namaItem(hasil)} berhasil disimpan.`,
        life: 3000,
      })
      formTerbuka.value = false
    },
  })

  async function simpan(payload: TPayload) {
    await mutasiSimpan.mutateAsync({ id: itemDipilih.value?.id ?? null, payload })
  }

  // --- Hapus ----------------------------------------------------------------

  const mutasiHapus = useMutation({
    mutationFn: (item: T) => opsi.api.remove(item.id),
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: [opsi.key] })
      toast.add({
        severity: 'success',
        summary: `${Label} dihapus`,
        detail: `${opsi.namaItem(item)} telah dihapus dari daftar ${opsi.label}.`,
        life: 3000,
      })
    },
    onError: (err, item) => {
      toast.add({
        severity: 'error',
        summary: `Gagal menghapus ${opsi.namaItem(item)}`,
        detail: pesanError(err),
        life: 5000,
      })
    },
  })

  function konfirmasiHapus(item: T) {
    confirm.require({
      header: `Hapus ${opsi.label}?`,
      message:
        opsi.pesanHapus?.(item) ?? `${opsi.namaItem(item)} akan dihapus dari daftar ${opsi.label}.`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
      acceptProps: { label: 'Hapus', severity: 'danger' },
      accept: () => mutasiHapus.mutate(item),
    })
  }

  // reactive() membuka semua ref supaya template cukup menulis crud.page, bukan
  // crud.page.value. Cast diperlukan karena TypeScript tidak bisa membuka ref
  // bertipe generik T; bentuk hasilnya dijamin oleh interface Crud di atas.
  return reactive({
    label: opsi.label,
    namaItem: opsi.namaItem,

    kataKunci,
    search,
    page,
    pageSize,
    sortField,
    sortOrder,
    items: computed(() => query.data.value?.items ?? []),
    total: computed(() => query.data.value?.totalItems ?? 0),
    sudahDimuat: computed(() => query.data.value !== undefined),
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    cari,
    resetPencarian,
    gantiHalaman,
    gantiUrutan,
    muatUlang: () => void query.refetch(),

    formTerbuka,
    itemDipilih,
    sedangMenyimpan: mutasiSimpan.isPending,
    bukaTambah,
    bukaEdit,
    simpan,

    idDihapus: computed(() =>
      mutasiHapus.isPending.value ? (mutasiHapus.variables.value?.id ?? null) : null,
    ),
    konfirmasiHapus,
  }) as unknown as Crud<T, TPayload>
}
