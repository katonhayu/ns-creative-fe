<script lang="ts">
export type WarnaStatus = 'abu' | 'biru' | 'hijau' | 'kuning' | 'merah' | 'ungu'

export interface InfoStatus {
  label: string
  warna: WarnaStatus
}
</script>

<script setup lang="ts">
defineProps<{ status: InfoStatus }>()
</script>

<template>
  <span class="badge" :class="`badge--${status.warna}`">{{ status.label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}
.badge--abu {
  background: #eef1f5;
  color: #5b6475;
}
.badge--biru {
  background: #e3ecff;
  color: #1d4ed8;
}
.badge--hijau {
  background: #dcf5e6;
  color: #177245;
}
.badge--kuning {
  background: #fff1d6;
  color: #9a5b00;
}
.badge--merah {
  background: #fde4e4;
  color: #b42323;
}
.badge--ungu {
  background: #efe7ff;
  color: #6a35c9;
}
</style>
