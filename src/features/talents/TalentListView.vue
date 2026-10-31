<script setup lang="ts">
import Column from 'primevue/column'
import CrudTable from '@/components/CrudTable.vue'
import { useCrud } from '@/composables/useCrud'
import { useAuthStore } from '@/stores/auth'
import { inisial, rupiah } from '@/utils/format'
import { talentApi } from './talent.api'
import TalentForm from './TalentForm.vue'

const auth = useAuthStore()

const crud = useCrud({
  key: 'talents',
  api: talentApi,
  label: 'talent',
  namaItem: (t) => t.nama,
  sortFields: ['nama', 'jenis', 'feeStandar'],
  pesanHapus: (t) =>
    `${t.nama} akan dihapus dari daftar talent. Penugasan di event lama tetap tersimpan.`,
})
</script>

<template>
  <div class="halaman">
    <CrudTable
      :crud="crud"
      :hanya-lihat="!auth.isAdmin"
      judul="Data Talent"
      placeholder-cari="Cari nama talent atau jenis talent…"
      ikon-kosong="pi-star"
      pesan-kosong="Belum ada talent. Tambahkan talent agar bisa ditugaskan ke event."
    >
      <Column field="nama" header="Nama Talent" sortable style="min-width: 14rem">
        <template #body="{ data: t }">
          <div class="sel-orang">
            <span class="sel-orang__avatar" aria-hidden="true">{{ inisial(t.nama) }}</span>
            <span class="sel-orang__nama">{{ t.nama }}</span>
          </div>
        </template>
      </Column>

      <Column field="jenis" header="Jenis Talent" sortable style="min-width: 8rem">
        <template #body="{ data: t }">
          <span class="sel-lencana">{{ t.jenis }}</span>
        </template>
      </Column>

      <Column field="contactPerson" header="Contact Person" style="min-width: 10rem">
        <template #body="{ data: t }">
          <span v-if="t.contactPerson">{{ t.contactPerson }}</span>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>

      <Column field="telepon" header="No. Telepon" style="min-width: 9rem">
        <template #body="{ data: t }">
          <a
            v-if="t.telepon"
            :href="`tel:${t.telepon.replace(/[\s-]/g, '')}`"
            class="sel-tautan angka"
            >{{ t.telepon }}</a
          >
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>

      <Column field="feeStandar" header="Fee Standar" sortable style="min-width: 9rem">
        <template #body="{ data: t }">
          <span class="angka">{{ rupiah(t.feeStandar) }}</span>
        </template>
      </Column>

      <Column field="riderDefault" header="Rider" style="min-width: 14rem; max-width: 18rem">
        <template #body="{ data: t }">
          <span v-if="t.riderDefault" class="sel-terpotong" :title="t.riderDefault">{{
            t.riderDefault
          }}</span>
          <span v-else class="sel-redup">—</span>
        </template>
      </Column>
    </CrudTable>

    <TalentForm
      v-model:visible="crud.formTerbuka"
      :talent="crud.itemDipilih"
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
