<script setup lang="ts">
import Column from 'primevue/column'
import CrudTable from '@/components/CrudTable.vue'
import { useCrud } from '@/composables/useCrud'
import { useAuthStore } from '@/stores/auth'
import { inisial } from '@/utils/format'
import { clientApi } from './client.api'
import ClientForm from './ClientForm.vue'

const auth = useAuthStore()

const crud = useCrud({
  key: 'clients',
  api: clientApi,
  label: 'client',
  namaItem: (c) => c.nama,
  sortFields: ['nama', 'perusahaan'],
  pesanHapus: (c) =>
    `${c.nama}${c.perusahaan ? ` (${c.perusahaan})` : ''} akan dihapus dari daftar client. ` +
    'Data event lama yang memakai client ini tetap tersimpan.',
})
</script>

<template>
  <div class="halaman">
    <CrudTable
      :crud="crud"
      :hanya-lihat="!auth.isAdmin"
      judul="Data Client"
      placeholder-cari="Cari nama client, perusahaan, atau email…"
      ikon-kosong="pi-user"
      pesan-kosong="Belum ada client. Tambahkan client pertama sebelum membuat event."
    >
      <Column field="nama" header="Nama Client" sortable style="min-width: 15rem">
        <template #body="{ data: c }">
          <div class="sel-orang">
            <span class="sel-orang__avatar" aria-hidden="true">{{ inisial(c.nama) }}</span>
            <span class="sel-orang__nama">{{ c.nama }}</span>
          </div>
        </template>
      </Column>

      <Column field="perusahaan" header="Perusahaan" sortable style="min-width: 14rem">
        <template #body="{ data: c }">
          <span v-if="c.perusahaan">{{ c.perusahaan }}</span>
          <span v-else class="sel-lencana">Perorangan</span>
        </template>
      </Column>

      <Column field="telepon" header="No. Telepon" style="min-width: 9rem">
        <template #body="{ data: c }">
          <a
            v-if="c.telepon"
            :href="`tel:${c.telepon.replace(/[\s-]/g, '')}`"
            class="sel-tautan angka"
            >{{ c.telepon }}</a
          >
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>

      <Column field="email" header="Email" style="min-width: 13rem">
        <template #body="{ data: c }">
          <a v-if="c.email" :href="`mailto:${c.email}`" class="sel-tautan">{{ c.email }}</a>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>

      <Column field="alamat" header="Alamat" style="min-width: 14rem; max-width: 20rem">
        <template #body="{ data: c }">
          <span v-if="c.alamat" class="sel-terpotong" :title="c.alamat">{{ c.alamat }}</span>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>
    </CrudTable>

    <ClientForm
      v-model:visible="crud.formTerbuka"
      :client="crud.itemDipilih"
      :menyimpan="crud.sedangMenyimpan"
      :simpan="crud.simpan"
    />
  </div>
</template>

<style scoped>
.halaman {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
