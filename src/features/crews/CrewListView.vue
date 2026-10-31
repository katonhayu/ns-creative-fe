<script setup lang="ts">
import Column from 'primevue/column'
import CrudTable from '@/components/CrudTable.vue'
import { useCrud } from '@/composables/useCrud'
import { useAuthStore } from '@/stores/auth'
import { inisial } from '@/utils/format'
import { crewApi } from './crew.api'
import CrewForm from './CrewForm.vue'

const auth = useAuthStore()

const crud = useCrud({
  key: 'crews',
  api: crewApi,
  label: 'crew',
  namaItem: (c) => c.nama,
  sortFields: ['nama', 'keahlian'],
  pesanHapus: (c) =>
    `${c.nama} akan dihapus dari daftar crew. Penugasan di event lama tetap tersimpan.`,
})
</script>

<template>
  <div class="halaman">
    <CrudTable
      :crud="crud"
      :hanya-lihat="!auth.isAdmin"
      judul="Data Crew"
      placeholder-cari="Cari nama crew atau keahlian…"
      ikon-kosong="pi-users"
      pesan-kosong="Belum ada crew. Tambahkan crew agar bisa ditugaskan ke event."
    >
      <Column field="nama" header="Nama Crew" sortable style="min-width: 14rem">
        <template #body="{ data: c }">
          <div class="sel-orang">
            <span class="sel-orang__avatar" aria-hidden="true">{{ inisial(c.nama) }}</span>
            <span class="sel-orang__nama">{{ c.nama }}</span>
          </div>
        </template>
      </Column>

      <Column field="keahlian" header="Keahlian" sortable style="min-width: 10rem">
        <template #body="{ data: c }">
          <span class="sel-lencana">{{ c.keahlian }}</span>
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

      <Column field="emailAkun" header="Akun Login" style="min-width: 13rem">
        <template #body="{ data: c }">
          <span v-if="c.emailAkun">{{ c.emailAkun }}</span>
          <span v-else class="sel-redup">Tidak ditautkan</span>
        </template>
      </Column>
    </CrudTable>

    <CrewForm
      v-model:visible="crud.formTerbuka"
      :crew="crud.itemDipilih"
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
