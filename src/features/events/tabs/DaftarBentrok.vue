<script setup lang="ts">
import Message from 'primevue/message'
import { rentangTanggal } from '@/utils/format'
import type { Bentrok } from '../penugasan.types'

/**
 * Peringatan jadwal bentrok saat memilih talent/crew/vendor.
 * Tidak memblokir penyimpanan: keputusan tetap di tangan PIC.
 */
withDefaults(
  defineProps<{
    bentrok: Bentrok[] | undefined
    memuat: boolean
    /** Nama yang dicek, untuk kalimat peringatan. */
    nama: string
    /** 'peringatan' untuk talent/crew, 'info' untuk vendor yang wajar melayani banyak event. */
    tingkat?: 'peringatan' | 'info'
  }>(),
  { tingkat: 'peringatan' },
)
</script>

<template>
  <p v-if="memuat" class="cek"><i class="pi pi-spin pi-spinner" /> Mengecek jadwal {{ nama }}…</p>

  <Message
    v-else-if="bentrok && bentrok.length > 0"
    :severity="tingkat === 'peringatan' ? 'warn' : 'info'"
    :closable="false"
  >
    <div class="isi">
      <strong v-if="tingkat === 'peringatan'">
        {{ nama }} juga ditugaskan di {{ bentrok.length }} event lain pada tanggal yang sama:
      </strong>
      <strong v-else>{{ nama }} juga melayani event lain pada tanggal yang beririsan:</strong>
      <ul>
        <li v-for="b in bentrok" :key="`${b.eventId}-${b.keterangan}`">
          {{ b.namaEvent }} ({{ rentangTanggal(b.tanggalMulai, b.tanggalSelesai) }})
          <span v-if="b.keterangan" class="ket">· {{ b.keterangan }}</span>
        </li>
      </ul>
      <span v-if="tingkat === 'peringatan'" class="saran">
        Pastikan jadwalnya tidak bertabrakan sebelum menyimpan.
      </span>
    </div>
  </Message>
</template>

<style scoped>
.cek {
  margin: 0;
  color: var(--ns-text-3);
  font-size: 0.8rem;
}
.isi {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.83rem;
}
.isi ul {
  margin: 0;
  padding-left: 1.1rem;
}
.ket {
  opacity: 0.8;
}
.saran {
  opacity: 0.85;
}
</style>
