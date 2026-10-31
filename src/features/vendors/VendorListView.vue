<script setup lang="ts">
import Column from 'primevue/column'
import CrudTable from '@/components/CrudTable.vue'
import { useCrud } from '@/composables/useCrud'
import { useAuthStore } from '@/stores/auth'
import { vendorApi } from './vendor.api'
import VendorForm from './VendorForm.vue'

const auth = useAuthStore()

const crud = useCrud({
  key: 'vendors',
  api: vendorApi,
  label: 'vendor',
  namaItem: (v) => v.nama,
  sortFields: ['nama', 'jenisJasa'],
  pesanHapus: (v) =>
    `${v.nama} akan dihapus dari daftar vendor. Penugasan dan budget di event lama tetap tersimpan.`,
})
</script>

<template>
  <div class="halaman">
    <CrudTable
      :crud="crud"
      :hanya-lihat="!auth.isAdmin"
      judul="Data Vendor"
      placeholder-cari="Cari nama vendor atau jenis jasa/barang…"
      ikon-kosong="pi-truck"
      pesan-kosong="Belum ada vendor. Tambahkan vendor agar bisa ditugaskan ke event."
    >
      <Column field="nama" header="Nama Vendor" sortable style="min-width: 14rem">
        <template #body="{ data: v }">
          <span class="sel-orang__nama">{{ v.nama }}</span>
        </template>
      </Column>

      <Column field="jenisJasa" header="Jenis Jasa/Barang" sortable style="min-width: 10rem">
        <template #body="{ data: v }">
          <span class="sel-lencana">{{ v.jenisJasa }}</span>
        </template>
      </Column>

      <Column field="contactPerson" header="Contact Person" style="min-width: 10rem">
        <template #body="{ data: v }">
          <span v-if="v.contactPerson">{{ v.contactPerson }}</span>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>

      <Column field="telepon" header="No. Telepon" style="min-width: 9rem">
        <template #body="{ data: v }">
          <a
            v-if="v.telepon"
            :href="`tel:${v.telepon.replace(/[\s-]/g, '')}`"
            class="sel-tautan angka"
            >{{ v.telepon }}</a
          >
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>
    </CrudTable>

    <VendorForm
      v-model:visible="crud.formTerbuka"
      :vendor="crud.itemDipilih"
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
