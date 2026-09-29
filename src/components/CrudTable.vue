<script setup lang="ts" generic="T extends { id: string }">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import { pesanError } from '@/api/http'
import type { Crud } from '@/composables/useCrud'

/**
 * Kartu daftar master data: judul, pencarian, tombol tambah, tabel dengan
 * urutan dan pagination, kolom aksi, dan semua state (loading, error, kosong,
 * hasil cari kosong). Kolom data didefinisikan pemakai lewat slot default.
 */
const props = defineProps<{
  crud: Crud<T, never>
  /** Judul kartu, misalnya "Data Client". */
  judul: string
  placeholderCari: string
  /** Ikon PrimeIcons untuk keadaan kosong, misalnya 'pi-user'. */
  ikonKosong: string
  /** Kalimat saat belum ada data sama sekali. */
  pesanKosong: string
  /** Sembunyikan tombol hapus, misalnya untuk data yang dinonaktifkan, bukan dihapus. */
  tanpaHapus?: boolean
  /** Alasan baris tidak boleh dihapus. null = boleh. Tombol hapus dinonaktifkan jika ada alasan. */
  alasanTidakBisaHapus?: (item: T) => string | null
  /** Rute halaman detail. Jika diisi, kolom Aksi mendapat tombol lihat (ikon mata). */
  ruteDetail?: (item: T) => RouteLocationRaw
}>()

defineSlots<{
  /** Komponen <Column> untuk kolom data. */
  default(): unknown
  /** Filter tambahan di toolbar, di sebelah kotak pencarian. */
  filter?(): unknown
}>()

/** Lebar kolom Aksi mengikuti jumlah tombolnya. */
const lebarAksi = computed(() => {
  const jumlahTombol = 1 + (props.tanpaHapus ? 0 : 1) + (props.ruteDetail ? 1 : 0)
  return `${1.5 + jumlahTombol * 2.1}rem`
})

const labelTambah = computed(
  () => `Tambah ${props.crud.label.charAt(0).toUpperCase()}${props.crud.label.slice(1)}`,
)
</script>

<template>
  <section class="kartu">
    <h1 class="judul">{{ judul }}</h1>

    <Message v-if="crud.isError" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Daftar {{ crud.label }} tidak dapat dimuat. {{ pesanError(crud.error) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="crud.isFetching"
          @click="crud.muatUlang()"
        />
      </div>
    </Message>

    <div class="toolbar">
      <IconField class="cari">
        <InputIcon class="pi pi-search" />
        <InputText
          :model-value="crud.kataKunci"
          :placeholder="placeholderCari"
          :aria-label="`Cari ${crud.label}`"
          fluid
          @update:model-value="crud.cari($event ?? '')"
        />
        <InputIcon
          v-if="crud.kataKunci"
          class="pi pi-times hapus-cari"
          role="button"
          aria-label="Hapus pencarian"
          @click="crud.resetPencarian()"
        />
      </IconField>

      <slot name="filter" />

      <Button :label="labelTambah" icon="pi pi-plus" class="tambah" @click="crud.bukaTambah()" />
    </div>

    <p v-if="crud.search && crud.sudahDimuat" class="info-cari">
      {{ crud.total }} {{ crud.label }} cocok dengan “{{ crud.search }}”
    </p>

    <DataTable
      :value="crud.items"
      data-key="id"
      lazy
      paginator
      :rows="crud.pageSize"
      :first="(crud.page - 1) * crud.pageSize"
      :total-records="crud.total"
      :rows-per-page-options="[10, 20, 50]"
      :loading="crud.isFetching"
      :sort-field="crud.sortField"
      :sort-order="crud.sortOrder === 'asc' ? 1 : -1"
      paginator-template="CurrentPageReport RowsPerPageDropdown PrevPageLink PageLinks NextPageLink"
      current-page-report-template="Menampilkan {first}–{last} dari {totalRecords} data"
      scrollable
      row-hover
      class="tabel ns-tabel"
      @page="crud.gantiHalaman"
      @sort="crud.gantiUrutan"
    >
      <template #empty>
        <div class="kosong">
          <template v-if="crud.isPending">
            <p>Memuat daftar {{ crud.label }}…</p>
          </template>
          <template v-else-if="crud.isError">
            <p>Data belum tersedia karena terjadi kesalahan.</p>
          </template>
          <template v-else-if="crud.search">
            <span class="kosong__ikon"><i class="pi pi-search" /></span>
            <p>Tidak ada {{ crud.label }} yang cocok dengan “{{ crud.search }}”.</p>
            <Button label="Hapus pencarian" text size="small" @click="crud.resetPencarian()" />
          </template>
          <template v-else>
            <span class="kosong__ikon"><i class="pi" :class="ikonKosong" /></span>
            <p>{{ pesanKosong }}</p>
            <Button
              :label="labelTambah"
              icon="pi pi-plus"
              size="small"
              @click="crud.bukaTambah()"
            />
          </template>
        </div>
      </template>

      <slot />

      <Column header="Aksi" frozen align-frozen="right" :style="{ width: lebarAksi }">
        <template #body="{ data: item }">
          <div class="aksi">
            <Button
              v-if="ruteDetail"
              :as="RouterLink"
              :to="ruteDetail(item)"
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              size="small"
              :aria-label="`Lihat detail ${crud.namaItem(item)}`"
              title="Lihat detail"
            />
            <Button
              icon="pi pi-pen-to-square"
              text
              rounded
              size="small"
              :aria-label="`Edit ${crud.namaItem(item)}`"
              title="Edit"
              @click="crud.bukaEdit(item)"
            />
            <span v-if="!tanpaHapus" :title="alasanTidakBisaHapus?.(item) ?? 'Hapus'">
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                :aria-label="`Hapus ${crud.namaItem(item)}`"
                :disabled="Boolean(alasanTidakBisaHapus?.(item))"
                :loading="crud.idDihapus === item.id"
                @click="crud.konfirmasiHapus(item)"
              />
            </span>
          </div>
        </template>
      </Column>
    </DataTable>
  </section>
</template>

<style scoped>
.kartu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.35rem 1.5rem 1rem;
  background: var(--ns-surface);
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius);
  box-shadow: var(--ns-shadow-sm);
}

.judul {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  color: var(--ns-text);
}

.galat-muat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.cari {
  flex: 1 1 280px;
  max-width: 380px;
}
.hapus-cari {
  cursor: pointer;
}
.tambah {
  margin-left: auto;
}

.info-cari {
  margin: -0.25rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.8rem;
}

/* Footer: "Menampilkan x–y dari n data" di kiri, halaman di kanan. */
.tabel :deep(.p-paginator) {
  justify-content: flex-end;
  gap: 0.25rem;
  padding: 0.85rem 0 0.25rem;
  background: transparent;
}
.tabel :deep(.p-paginator-current) {
  margin-right: auto;
  padding: 0;
  color: var(--ns-text-3);
  font-size: 0.8rem;
}
.tabel :deep(.p-paginator-page),
.tabel :deep(.p-paginator-prev),
.tabel :deep(.p-paginator-next) {
  min-width: 2rem;
  height: 2rem;
  border: 1px solid var(--ns-border);
  border-radius: 6px;
  font-size: 0.8rem;
}
.tabel :deep(.p-paginator-page.p-paginator-page-selected) {
  border-color: var(--ns-accent);
  background: var(--ns-accent);
  color: #fff;
}
.tabel :deep(.p-paginator-rpp-dropdown) {
  margin-right: 0.5rem;
}

.kosong {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--ns-text-2);
}
.kosong__ikon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 0.25rem;
  border-radius: 12px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 1.1rem;
}
.kosong p {
  margin: 0;
  font-size: 0.875rem;
}

.aksi {
  display: flex;
  gap: 0.1rem;
}

@media (max-width: 640px) {
  .kartu {
    padding: 1rem;
  }
  .cari {
    max-width: none;
  }
  .tambah {
    width: 100%;
  }
  .tabel :deep(.p-paginator) {
    justify-content: center;
  }
  .tabel :deep(.p-paginator-current) {
    width: 100%;
    margin: 0 0 0.25rem;
    text-align: center;
  }
}
</style>
