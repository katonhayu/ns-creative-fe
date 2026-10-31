<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { pesanError } from '@/api/http'
import { tanggal } from '@/utils/format'
import { simpanBlob, ukuranFile } from '@/utils/file'
import { ambilFileDokumen, deleteDokumen, listDokumen, updateDokumen } from '../document.api'
import type { DokumenPayload } from '../document.schema'
import {
  ACCEPT_INPUT,
  alasanFileDitolak,
  ikonFile,
  jenisPratinjau,
  type Dokumen,
} from '../document.types'
import type { EventDetail } from '../event.types'
import DokumenForm from './DokumenForm.vue'
import DokumenPratinjau from './DokumenPratinjau.vue'
import DokumenUnggah from './DokumenUnggah.vue'

const props = defineProps<{ event: EventDetail }>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const daftar = useQuery({
  queryKey: computed(() => ['events', props.event.id, 'documents']),
  queryFn: () => listDokumen(props.event.id),
})
const semua = computed(() => daftar.data.value ?? [])
const segarkan = () => queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })

// --- Filter ------------------------------------------------------------------

const kataKunci = ref('')
const filterJenis = ref<string | null>(null)
const pilihanJenis = computed(() =>
  [...new Set(semua.value.map((d) => d.jenis))].sort((a, b) => a.localeCompare(b, 'id')),
)
const tampil = computed(() => {
  const q = kataKunci.value.trim().toLowerCase()
  return semua.value.filter(
    (d) =>
      (!filterJenis.value || d.jenis === filterJenis.value) &&
      (!q || [d.namaDokumen, d.namaFile, d.keterangan].some((v) => v?.toLowerCase().includes(q))),
  )
})
const totalUkuran = computed(() => semua.value.reduce((s, d) => s + d.ukuran, 0))

// --- Drag and drop & pilih file ------------------------------------------------

const inputFile = useTemplateRef<HTMLInputElement>('inputFile')
const sedangDiseret = ref(false)
/** Hitung dragenter/dragleave supaya sorotan tidak berkedip saat melewati elemen anak. */
let hitungSeret = 0
const antreanFile = ref<File[]>([])
const unggahTerbuka = ref(false)
const ditolak = ref<{ nama: string; alasan: string }[]>([])

function terimaFile(files: FileList | File[] | null | undefined) {
  if (!files?.length) return
  const boleh: File[] = []
  const tolak: { nama: string; alasan: string }[] = []
  for (const f of Array.from(files)) {
    const alasan = alasanFileDitolak(f)
    if (alasan) tolak.push({ nama: f.name, alasan })
    else boleh.push(f)
  }
  ditolak.value = tolak
  if (boleh.length) {
    antreanFile.value = boleh
    unggahTerbuka.value = true
  }
}

function bukaPemilih() {
  inputFile.value?.click()
}
function saatPilih(e: Event) {
  const input = e.target as HTMLInputElement
  terimaFile(input.files)
  input.value = ''
}
function saatMasuk(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  hitungSeret++
  sedangDiseret.value = true
}
function saatKeluar() {
  hitungSeret = Math.max(0, hitungSeret - 1)
  if (hitungSeret === 0) sedangDiseret.value = false
}
function saatLepas(e: DragEvent) {
  hitungSeret = 0
  sedangDiseret.value = false
  terimaFile(e.dataTransfer?.files)
}

// --- Pratinjau & unduh ---------------------------------------------------------

const pratinjauTerbuka = ref(false)
const dipratinjau = ref<Dokumen | null>(null)
function bukaPratinjau(d: Dokumen) {
  dipratinjau.value = d
  pratinjauTerbuka.value = true
}

const idDiunduh = ref<string | null>(null)
async function unduh(d: Dokumen) {
  idDiunduh.value = d.id
  try {
    const blob = await queryClient.fetchQuery({
      queryKey: ['dokumen-file', d.id],
      queryFn: () => ambilFileDokumen(d.id),
      staleTime: Infinity,
    })
    simpanBlob(blob, d.namaFile)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: `Gagal mengunduh ${d.namaDokumen}`,
      detail: pesanError(error),
      life: 5000,
    })
  } finally {
    idDiunduh.value = null
  }
}

// --- Edit metadata -------------------------------------------------------------

const formTerbuka = ref(false)
const diedit = ref<Dokumen | null>(null)
function bukaEdit(d: Dokumen) {
  diedit.value = d
  formTerbuka.value = true
}

const mutasiSimpan = useMutation({
  mutationFn: (payload: DokumenPayload) => updateDokumen(diedit.value!.id, payload),
  onSuccess: (hasil) => {
    segarkan()
    toast.add({
      severity: 'success',
      summary: 'Dokumen diperbarui',
      detail: hasil.namaDokumen,
      life: 3000,
    })
    formTerbuka.value = false
  },
})
async function simpan(payload: DokumenPayload) {
  await mutasiSimpan.mutateAsync(payload)
}

// --- Hapus ---------------------------------------------------------------------

const mutasiHapus = useMutation({
  mutationFn: (d: Dokumen) => deleteDokumen(d.id),
  onSuccess: (_, d) => {
    segarkan()
    queryClient.removeQueries({ queryKey: ['dokumen-file', d.id] })
    toast.add({
      severity: 'success',
      summary: 'Dokumen dihapus',
      detail: d.namaDokumen,
      life: 3000,
    })
  },
  onError: (err, d) => {
    toast.add({
      severity: 'error',
      summary: `Gagal menghapus ${d.namaDokumen}`,
      detail: pesanError(err),
      life: 5000,
    })
  },
})

function konfirmasiHapus(d: Dokumen) {
  confirm.require({
    header: 'Hapus dokumen?',
    message: `"${d.namaDokumen}" (${d.namaFile}) akan dihapus beserta file-nya. Tindakan ini tidak bisa dibatalkan.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Hapus', severity: 'danger' },
    accept: () => mutasiHapus.mutate(d),
  })
}
</script>

<template>
  <section class="panel">
    <header class="kepala">
      <div>
        <h2>Dokumen</h2>
        <p>Kontrak, proposal, invoice, desain, dan berkas lain untuk event ini.</p>
      </div>
      <div class="kanan">
        <span v-if="semua.length" class="total">
          <strong class="angka">{{ semua.length }}</strong> dokumen ·
          {{ ukuranFile(totalUkuran) }}
        </span>
        <Button
          v-if="event.bolehKelola"
          label="Unggah dokumen"
          icon="pi pi-upload"
          @click="bukaPemilih"
        />
      </div>
    </header>

    <input
      ref="inputFile"
      type="file"
      multiple
      :accept="ACCEPT_INPUT"
      class="tersembunyi"
      tabindex="-1"
      aria-hidden="true"
      @change="saatPilih"
    />

    <!-- Area lepas file. Bisa juga diklik atau difokus lalu Enter untuk memilih file. -->
    <div
      v-if="event.bolehKelola"
      class="dropzone"
      :class="{ 'dropzone--aktif': sedangDiseret, 'dropzone--besar': !semua.length }"
      role="button"
      tabindex="0"
      aria-label="Seret file ke sini atau tekan Enter untuk memilih file"
      @click="bukaPemilih"
      @keydown.enter.prevent="bukaPemilih"
      @keydown.space.prevent="bukaPemilih"
      @dragenter.prevent="saatMasuk"
      @dragover.prevent
      @dragleave="saatKeluar"
      @drop.prevent="saatLepas"
    >
      <span class="dropzone__ikon"><i class="pi pi-cloud-upload" /></span>
      <strong>{{ sedangDiseret ? 'Lepaskan untuk mengunggah' : 'Seret file ke sini' }}</strong>
      <span>
        atau <u>pilih dari komputer</u> · PDF, Word, Excel, JPG, PNG · maks. 10 MB per file
      </span>
    </div>

    <Message v-if="ditolak.length" severity="warn" :closable="false" size="small">
      <div class="ditolak">
        <strong>{{ ditolak.length }} file tidak bisa diunggah:</strong>
        <ul>
          <li v-for="t in ditolak" :key="t.nama">{{ t.nama }}: {{ t.alasan }}</li>
        </ul>
        <Button label="Tutup" text size="small" @click="ditolak = []" />
      </div>
    </Message>

    <Message v-if="daftar.isError.value" severity="error" :closable="false">
      <div class="galat-muat">
        <span>Daftar dokumen tidak dapat dimuat. {{ pesanError(daftar.error.value) }}</span>
        <Button
          label="Coba lagi"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          :loading="daftar.isFetching.value"
          @click="daftar.refetch()"
        />
      </div>
    </Message>

    <p v-else-if="daftar.isPending.value" class="keadaan">
      <i class="pi pi-spin pi-spinner" /> Memuat dokumen…
    </p>

    <p v-else-if="!semua.length" class="keadaan">Belum ada dokumen untuk event ini.</p>

    <template v-else>
      <div class="filter">
        <IconField class="cari">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="kataKunci"
            placeholder="Cari nama dokumen atau file…"
            aria-label="Cari dokumen"
            fluid
          />
        </IconField>
        <Select
          v-model="filterJenis"
          :options="pilihanJenis"
          placeholder="Semua jenis"
          show-clear
          aria-label="Filter jenis dokumen"
          class="filter__jenis"
        />
      </div>

      <p v-if="!tampil.length" class="keadaan">Tidak ada dokumen yang cocok dengan filter.</p>

      <DataTable v-else :value="tampil" data-key="id" scrollable row-hover class="ns-tabel">
        <Column header="Dokumen" style="min-width: 18rem">
          <template #body="{ data: d }">
            <div class="dok">
              <span class="dok__ikon"><i class="pi" :class="ikonFile(d.namaFile)" /></span>
              <div class="dok__teks">
                <span class="dok__nama">{{ d.namaDokumen }}</span>
                <small class="sel-terpotong" :title="d.namaFile">
                  {{ d.namaFile }} · {{ ukuranFile(d.ukuran) }}
                </small>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Jenis" style="min-width: 8rem">
          <template #body="{ data: d }">
            <span class="sel-lencana">{{ d.jenis }}</span>
          </template>
        </Column>
        <Column header="Tanggal" style="min-width: 8rem">
          <template #body="{ data: d }">
            <span class="angka">{{ tanggal(d.tanggal) }}</span>
          </template>
        </Column>
        <Column header="Keterangan" style="min-width: 12rem; max-width: 18rem">
          <template #body="{ data: d }">
            <span v-if="d.keterangan" class="sel-terpotong" :title="d.keterangan">{{
              d.keterangan
            }}</span>
            <span v-else class="sel-redup">—</span>
          </template>
        </Column>
        <Column header="Aksi" frozen align-frozen="right" style="width: 10rem">
          <template #body="{ data: d }">
            <div class="aksi">
              <span
                :title="jenisPratinjau(d) ? 'Pratinjau' : 'Pratinjau hanya untuk PDF dan gambar'"
              >
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  severity="secondary"
                  size="small"
                  :disabled="!jenisPratinjau(d)"
                  :aria-label="`Pratinjau ${d.namaDokumen}`"
                  @click="bukaPratinjau(d)"
                />
              </span>
              <Button
                icon="pi pi-download"
                text
                rounded
                severity="secondary"
                size="small"
                :aria-label="`Unduh ${d.namaDokumen}`"
                title="Unduh"
                :loading="idDiunduh === d.id"
                @click="unduh(d)"
              />
              <Button
                v-if="event.bolehKelola"
                icon="pi pi-pen-to-square"
                text
                rounded
                size="small"
                :aria-label="`Edit ${d.namaDokumen}`"
                title="Edit"
                @click="bukaEdit(d)"
              />
              <Button
                v-if="event.bolehKelola"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                :aria-label="`Hapus ${d.namaDokumen}`"
                title="Hapus"
                :loading="mutasiHapus.isPending.value && mutasiHapus.variables.value?.id === d.id"
                @click="konfirmasiHapus(d)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </section>

  <DokumenUnggah v-model:visible="unggahTerbuka" :event="event" :files="antreanFile" />
  <DokumenPratinjau v-model:visible="pratinjauTerbuka" :dokumen="dipratinjau" @unduh="unduh" />
  <DokumenForm
    v-model:visible="formTerbuka"
    :dokumen="diedit"
    :menyimpan="mutasiSimpan.isPending.value"
    :simpan="simpan"
  />
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.kepala {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}
.kepala h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
}
.kepala p {
  margin: 0.15rem 0 0;
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.kanan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
}
.total {
  color: var(--ns-text-3);
  font-size: 0.82rem;
}
.total strong {
  color: var(--ns-text);
}
.tersembunyi {
  display: none;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1.1rem 1rem;
  border: 2px dashed var(--ns-border-strong);
  border-radius: var(--ns-radius);
  background: var(--ns-surface-2);
  color: var(--ns-text-2);
  font-size: 0.82rem;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.dropzone--besar {
  padding: 2.5rem 1rem;
}
.dropzone:hover,
.dropzone:focus-visible {
  border-color: var(--ns-accent);
}
.dropzone--aktif {
  border-color: var(--ns-accent);
  background: var(--ns-accent-soft);
}
.dropzone strong {
  color: var(--ns-text);
  font-size: 0.9rem;
}
.dropzone u {
  color: var(--ns-accent-text);
}
.dropzone__ikon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-bottom: 0.2rem;
  border-radius: 12px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
  font-size: 1.15rem;
}
/* Elemen anak tidak menangkap event seret, jadi hitungan masuk/keluar tetap akurat. */
.dropzone > * {
  pointer-events: none;
}

.ditolak {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.82rem;
}
.ditolak ul {
  margin: 0;
  padding-left: 1.1rem;
}
.galat-muat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}
.keadaan {
  margin: 0;
  padding: 1rem;
  color: var(--ns-text-3);
  font-size: 0.85rem;
  text-align: center;
}

.filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.cari {
  flex: 1 1 240px;
  max-width: 340px;
}
.filter__jenis {
  width: 12rem;
}

.dok {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}
.dok__ikon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
}
.dok__teks {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}
.dok__nama {
  color: var(--ns-text);
  font-weight: 600;
}
.dok__teks small {
  color: var(--ns-text-3);
  font-size: 0.76rem;
}
.aksi {
  display: flex;
  gap: 0.1rem;
}

@media (max-width: 640px) {
  .kanan,
  .kanan :deep(.p-button),
  .cari,
  .filter__jenis {
    width: 100%;
    max-width: none;
  }
}
</style>
