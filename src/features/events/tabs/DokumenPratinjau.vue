<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { pesanError } from '@/api/http'
import { tanggal } from '@/utils/format'
import { ukuranFile } from '@/utils/file'
import { ambilFileDokumen } from '../document.api'
import { jenisPratinjau, type Dokumen } from '../document.types'

const props = defineProps<{ dokumen: Dokumen | null }>()
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ unduh: [d: Dokumen] }>()

const jenis = computed(() => (props.dokumen ? jenisPratinjau(props.dokumen) : null))

const file = useQuery({
  queryKey: computed(() => ['dokumen-file', props.dokumen?.id]),
  queryFn: () => ambilFileDokumen(props.dokumen!.id),
  enabled: computed(() => visible.value && props.dokumen !== null && jenis.value !== null),
  // File tidak berubah (hanya metadata yang bisa diedit), jadi aman disimpan lama.
  staleTime: Infinity,
  gcTime: 60_000,
})

// URL objek dibuat per blob dan selalu dilepas agar memori tidak bocor.
const url = ref<string | null>(null)
watch(
  () => file.data.value,
  (blob) => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = blob ? URL.createObjectURL(blob) : null
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    maximizable
    :header="dokumen?.namaDokumen ?? 'Pratinjau'"
    :draggable="false"
    :style="{ width: '64rem', height: '85vh' }"
    :breakpoints="{ '640px': '96vw' }"
    :content-style="{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: 0 }"
  >
    <template v-if="dokumen">
      <p class="meta">
        {{ dokumen.jenis }} · {{ tanggal(dokumen.tanggal) }} · {{ dokumen.namaFile }} ·
        {{ ukuranFile(dokumen.ukuran) }}
      </p>

      <div class="bingkai">
        <div v-if="!jenis" class="keadaan">
          <i class="pi pi-eye-slash" />
          <p>Pratinjau tidak tersedia untuk tipe file ini. Unduh untuk membukanya.</p>
          <Button label="Unduh" icon="pi pi-download" @click="emit('unduh', dokumen)" />
        </div>
        <div v-else-if="file.isPending.value" class="keadaan">
          <i class="pi pi-spin pi-spinner" />
          <p>Memuat file…</p>
        </div>
        <div v-else-if="file.isError.value" class="keadaan">
          <i class="pi pi-exclamation-circle" />
          <p>File tidak dapat dimuat. {{ pesanError(file.error.value) }}</p>
          <Button
            label="Coba lagi"
            icon="pi pi-refresh"
            outlined
            :loading="file.isFetching.value"
            @click="file.refetch()"
          />
        </div>
        <img v-else-if="jenis === 'gambar' && url" :src="url" :alt="dokumen.namaDokumen" />
        <iframe v-else-if="jenis === 'pdf' && url" :src="url" :title="dokumen.namaDokumen" />
      </div>
    </template>

    <template #footer>
      <Button label="Tutup" severity="secondary" outlined @click="visible = false" />
      <Button v-if="dokumen" label="Unduh" icon="pi pi-download" @click="emit('unduh', dokumen)" />
    </template>
  </Dialog>
</template>

<style scoped>
.meta {
  margin: 0 0 0.75rem;
  color: var(--ns-text-3);
  font-size: 0.8rem;
  word-break: break-all;
}
.bingkai {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: auto;
  border: 1px solid var(--ns-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-surface-2);
}
.bingkai img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.bingkai iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
.keadaan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem;
  text-align: center;
  color: var(--ns-text-2);
}
.keadaan i {
  font-size: 1.6rem;
  color: var(--ns-text-3);
}
.keadaan p {
  margin: 0;
  max-width: 44ch;
  font-size: 0.875rem;
}
</style>
