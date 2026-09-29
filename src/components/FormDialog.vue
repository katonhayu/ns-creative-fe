<script setup lang="ts">
import { useId } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'

/**
 * Kerangka dialog form: judul, pesan error umum, tombol Batal/Simpan, dan
 * penguncian dialog selama menyimpan. Field diisi pemakai lewat slot default.
 *
 * Kelas bantu untuk isi slot: .baris (satu field), .dua-kolom (dua field
 * berdampingan), .wajib (tanda *), .galat (pesan error), .bantuan (teks bantu).
 */
withDefaults(
  defineProps<{
    judul: string
    menyimpan: boolean
    /** Pesan error umum di atas form. Kosong = tidak tampil. */
    pesanGagal?: string
    labelSimpan?: string
    lebar?: string
  }>(),
  { pesanGagal: '', labelSimpan: 'Simpan', lebar: '34rem' },
)
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ submit: [] }>()

const formId = `form-${useId()}`
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="judul"
    :closable="!menyimpan"
    :close-on-escape="!menyimpan"
    :draggable="false"
    :style="{ width: lebar }"
    :breakpoints="{ '575px': '94vw' }"
  >
    <form :id="formId" class="form" novalidate @submit.prevent="emit('submit')">
      <Message v-if="pesanGagal" severity="error" :closable="false">{{ pesanGagal }}</Message>
      <slot />
    </form>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        outlined
        :disabled="menyimpan"
        @click="visible = false"
      />
      <Button type="submit" :form="formId" :label="labelSimpan" :loading="menyimpan" />
    </template>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form :deep(.baris) {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.form :deep(.baris > label) {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ns-text-2);
}
.form :deep(.dua-kolom) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form :deep(.wajib) {
  color: var(--ns-danger);
}
.form :deep(.galat) {
  color: var(--ns-danger);
  font-size: 0.78rem;
}
.form :deep(.bantuan) {
  color: var(--ns-text-3);
  font-size: 0.78rem;
}

@media (max-width: 575px) {
  .form :deep(.dua-kolom) {
    grid-template-columns: 1fr;
  }
}
</style>
