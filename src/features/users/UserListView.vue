<script setup lang="ts">
import Column from 'primevue/column'
import CrudTable from '@/components/CrudTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCrud } from '@/composables/useCrud'
import { useAuthStore } from '@/stores/auth'
import { inisial } from '@/utils/format'
import { userApi } from './user.api'
import { STATUS_PERAN } from './user.types'
import UserForm from './UserForm.vue'

const auth = useAuthStore()

const crud = useCrud({
  key: 'users',
  api: userApi,
  label: 'pengguna',
  namaItem: (u) => u.nama,
  sortFields: ['nama', 'email', 'role'],
})
</script>

<template>
  <div class="halaman">
    <CrudTable
      :crud="crud"
      judul="Data Pengguna"
      placeholder-cari="Cari nama atau email pengguna…"
      ikon-kosong="pi-id-card"
      pesan-kosong="Belum ada pengguna."
      tanpa-hapus
    >
      <Column field="nama" header="Nama" sortable style="min-width: 14rem">
        <template #body="{ data: u }">
          <div class="sel-orang">
            <span class="sel-orang__avatar" aria-hidden="true">{{ inisial(u.nama) }}</span>
            <span class="sel-orang__nama">{{ u.nama }}</span>
            <span v-if="u.id === auth.user?.id" class="sel-lencana">Kamu</span>
          </div>
        </template>
      </Column>

      <Column field="email" header="Email" sortable style="min-width: 14rem">
        <template #body="{ data: u }">
          <a :href="`mailto:${u.email}`" class="sel-tautan">{{ u.email }}</a>
        </template>
      </Column>

      <Column field="role" header="Peran" sortable style="min-width: 7rem">
        <template #body="{ data: u }">
          <StatusBadge :status="STATUS_PERAN[u.role as keyof typeof STATUS_PERAN]" />
        </template>
      </Column>

      <Column field="isAktif" header="Status" style="min-width: 7rem">
        <template #body="{ data: u }">
          <StatusBadge
            :status="
              u.isAktif ? { label: 'Aktif', warna: 'hijau' } : { label: 'Nonaktif', warna: 'abu' }
            "
          />
        </template>
      </Column>
    </CrudTable>

    <UserForm
      v-model:visible="crud.formTerbuka"
      :user="crud.itemDipilih"
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
