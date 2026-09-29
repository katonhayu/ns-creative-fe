<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import { pesanError } from '@/api/http'
import { ukuranFile, tanpaEkstensi } from '@/utils/file'
import { unggahDokumen } from '../document.api'
import { dokumenSchema } from '../document.schema'
import { SARAN_JENIS_DOKUMEN, ikonFile, tebakJenis } from '../document.types'
import type { EventDetail } from '../event.types'

/**
 * Antrean upload: setiap file punya nama dan jenis sendiri, tanggal dan
 * keterangan berlaku untuk semua. File diunggah satu per satu dengan progress.
 */
const props = defineProps<{ event: EventDetail; files: File[] }>()
const visible = defineModel<boolean>('visible', { required: true })

const toast = useToast()
const queryClient = useQueryClient()

interface Antrean {
  kunci: string
  file: File
  namaDokumen: string
  jenis: string
  status: 'menunggu' | 'mengunggah' | 'berhasil' | 'gagal'
  persen: number
  galat: string
}

const antrean = ref<Antrean[]>([])
const tanggal = ref<Date | null>(new Date())
const keterangan = ref('')
const galatUmum = ref('')
const berjalan = ref(false)

watch(visible, (buka) => {
  if (!buka) return
  galatUmum.value = ''
  tanggal.value = new Date()
  keterangan.value = ''
  antrean.value = props.files.map((file, i) => ({
    kunci: `${file.name}-${file.size}-${i}`,
    file,
    namaDokumen: tanpaEkstensi(file.name),
    jenis: tebakJenis(file.name),
    status: 'menunggu',
    persen: 0,
    galat: '',
  }))
})

const tersisa = computed(() => antrean.value.filter((a) => a.status !== 'berhasil'))

function buang(a: Antrean) {
  antrean.value = antrean.value.filter((x) => x !== a)
  if (!antrean.value.length) visible.value = false
}

async function unggahSemua() {
  galatUmum.value = ''

  // Validasi semua baris dulu, supaya tidak ada yang terunggah setengah jalan karena isian salah.
  let valid = true
  const hasil = tersisa.value.map((a) => {
    const r = dokumenSchema.safeParse({
      namaDokumen: a.namaDokumen,
      jenis: a.jenis,
      tanggal: tanggal.value,
      keterangan: keterangan.value,
    })
    a.galat = r.success ? '' : (r.error.issues[0]?.message ?? 'Isian belum lengkap.')
    if (!r.success) valid = false
    return { a, r }
  })
  if (!valid) {
    galatUmum.value = 'Lengkapi isian yang ditandai merah.'
    return
  }

  berjalan.value = true
  let berhasil = 0
  for (const { a, r } of hasil) {
    if (!r.success) continue
    a.status = 'mengunggah'
    a.persen = 0
    a.galat = ''
    try {
      await unggahDokumen(props.event.id, a.file, r.data, (p) => (a.persen = p))
      a.status = 'berhasil'
      berhasil++
    } catch (error) {
      a.status = 'gagal'
      a.galat = pesanError(error, 'Upload gagal.')
    }
  }
  berjalan.value = false

  if (berhasil) {
    queryClient.invalidateQueries({ queryKey: ['events', props.event.id] })
    toast.add({
      severity: 'success',
      summary: 'Dokumen diunggah',
      detail: `${berhasil} dokumen berhasil disimpan.`,
      life: 3000,
    })
  }
  // Tutup otomatis hanya jika semuanya berhasil; yang gagal tetap tampil untuk dicoba lagi.
  if (!tersisa.value.length) visible.value = false
  else
    galatUmum.value = `${tersisa.value.length} file gagal diunggah. Periksa pesannya lalu coba lagi.`
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Unggah dokumen"
    :closable="!berjalan"
    :close-on-escape="!berjalan"
    :draggable="false"
    :style="{ width: '44rem' }"
    :breakpoints="{ '640px': '96vw' }"
  >
    <div class="isi">
      <Message v-if="galatUmum" severity="error" :closable="false">{{ galatUmum }}</Message>

      <ul class="daftar">
        <li v-for="a in antrean" :key="a.kunci" class="file" :class="`file--${a.status}`">
          <span class="file__ikon"><i class="pi" :class="ikonFile(a.file.name)" /></span>
          <div class="file__isi">
            <div class="file__asli">
              <span class="sel-terpotong" :title="a.file.name">{{ a.file.name }}</span>
              <small>{{ ukuranFile(a.file.size) }}</small>
            </div>
            <div class="file__isian">
              <InputText
                v-model="a.namaDokumen"
                :disabled="berjalan || a.status === 'berhasil'"
                :invalid="Boolean(a.galat) && a.status !== 'gagal'"
                :aria-label="`Nama dokumen untuk ${a.file.name}`"
                placeholder="Nama dokumen"
                size="small"
                fluid
              />
              <Select
                v-model="a.jenis"
                :options="SARAN_JENIS_DOKUMEN"
                editable
                :disabled="berjalan || a.status === 'berhasil'"
                :aria-label="`Jenis dokumen untuk ${a.file.name}`"
                size="small"
                class="file__jenis"
              />
            </div>
            <ProgressBar
              v-if="a.status === 'mengunggah'"
              :value="a.persen"
              :show-value="false"
              class="file__progres"
            />
            <small v-if="a.status === 'berhasil'" class="file__ok">
              <i class="pi pi-check-circle" /> Tersimpan
            </small>
            <small v-else-if="a.galat" class="galat">{{ a.galat }}</small>
          </div>
          <Button
            v-if="a.status !== 'berhasil'"
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            size="small"
            :disabled="berjalan"
            :aria-label="`Batalkan ${a.file.name}`"
            title="Keluarkan dari antrean"
            @click="buang(a)"
          />
        </li>
      </ul>

      <div class="bersama">
        <div class="baris">
          <label for="dok-tanggal">Tanggal dokumen <span class="wajib">*</span></label>
          <DatePicker
            v-model="tanggal"
            input-id="dok-tanggal"
            date-format="dd M yy"
            :max-date="dayjs().add(1, 'year').toDate()"
            show-icon
            icon-display="input"
            :disabled="berjalan"
            fluid
          />
        </div>
        <div class="baris">
          <label for="dok-keterangan">Keterangan</label>
          <Textarea
            id="dok-keterangan"
            v-model="keterangan"
            rows="1"
            auto-resize
            :disabled="berjalan"
            placeholder="Berlaku untuk semua file di atas"
            fluid
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        outlined
        :disabled="berjalan"
        @click="visible = false"
      />
      <Button
        :label="`Unggah ${tersisa.length} file`"
        icon="pi pi-upload"
        :loading="berjalan"
        :disabled="!tersisa.length"
        @click="unggahSemua"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.isi {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.daftar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  max-height: 22rem;
  overflow-y: auto;
  list-style: none;
}
.file {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface);
}
.file--berhasil {
  border-color: #bfe8cf;
  background: #f4fbf7;
}
.file--gagal {
  border-color: #f6c6c6;
  background: #fff8f8;
}
.file__ikon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--ns-accent-soft);
  color: var(--ns-accent-text);
}
.file__isi {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}
.file__asli {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
  font-size: 0.8rem;
  color: var(--ns-text-2);
}
.file__asli small {
  flex: none;
  color: var(--ns-text-3);
}
.file__isian {
  display: grid;
  grid-template-columns: 1fr 10rem;
  gap: 0.5rem;
}
.file__jenis {
  width: 100%;
}
.file__progres {
  height: 0.4rem;
}
.file__ok {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--ns-success);
  font-size: 0.78rem;
  font-weight: 600;
}
.galat {
  color: var(--ns-danger);
  font-size: 0.78rem;
}
.bersama {
  display: grid;
  grid-template-columns: 14rem 1fr;
  gap: 1rem;
}
.baris {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.baris label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ns-text-2);
}
.wajib {
  color: var(--ns-danger);
}

@media (max-width: 640px) {
  .file__isian,
  .bersama {
    grid-template-columns: 1fr;
  }
}
</style>
