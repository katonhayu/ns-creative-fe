<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import { useQuery } from '@tanstack/vue-query'
import { usePilihan } from '@/composables/usePilihan'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { listPilihanVendor } from '@/features/vendors/vendor.api'
import type { EventDetail } from '../event.types'
import { cekBentrokVendor } from '../penugasan.api'
import {
  eventVendorSchema,
  type EventVendorFormValues,
  type EventVendorPayload,
} from '../penugasan.schema'
import { STATUS_PEMBAYARAN, pilihanDari, type EventVendor } from '../penugasan.types'
import DaftarBentrok from './DaftarBentrok.vue'

const props = defineProps<{
  event: EventDetail
  penugasan: EventVendor | null
  menyimpan: boolean
  simpan: (payload: EventVendorPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.penugasan !== null)
const pesanGagal = ref('')
const PILIHAN_BAYAR = pilihanDari(STATUS_PEMBAYARAN)

const pilihanVendor = usePilihan({
  key: ['vendors', 'pilihan'],
  ambil: listPilihanVendor,
  aktif: visible,
  terpilih: () =>
    props.penugasan && {
      id: props.penugasan.vendorId,
      nama: props.penugasan.namaVendor,
      jenisJasa: props.penugasan.jenisJasa,
    },
})

function nilaiAwal(p: EventVendor | null): EventVendorFormValues {
  return {
    vendorId: p?.vendorId ?? null,
    kebutuhan: p?.kebutuhan ?? '',
    biaya: p?.biaya ?? null,
    statusPembayaran: p?.statusPembayaran ?? 'belum_bayar',
  }
}

const FIELD_FORM = ['vendorId', 'kebutuhan', 'biaya', 'statusPembayaran'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: skemaForm(eventVendorSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [vendorId] = defineField('vendorId', lazy)
const [kebutuhan, kebutuhanAttrs] = defineField('kebutuhan', lazy)
const [biaya] = defineField('biaya', lazy)
const [statusPembayaran] = defineField('statusPembayaran')

const vendorTerpilih = computed(() => pilihanVendor.cariId(vendorId.value))

const bentrok = useQuery({
  queryKey: computed(() => ['bentrok', 'vendor', props.event.id, vendorId.value]),
  queryFn: () => cekBentrokVendor(props.event, vendorId.value as string),
  enabled: computed(() => visible.value && vendorId.value !== null),
  staleTime: 0,
})

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.penugasan) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Penugasan vendor gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit penugasan vendor' : 'Tambah vendor ke event'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Tambahkan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="ev-vendor">Vendor <span class="wajib">*</span></label>
      <Select
        v-model="vendorId"
        input-id="ev-vendor"
        :options="pilihanVendor.opsi"
        option-label="nama"
        option-value="id"
        :loading="pilihanVendor.memuat"
        @filter="pilihanVendor.cari($event.value)"
        :disabled="modeEdit"
        filter
        :filter-fields="['nama', 'jenisJasa']"
        placeholder="Cari vendor dari master data"
        empty-filter-message="Vendor tidak ditemukan"
        :invalid="Boolean(errors.vendorId)"
        fluid
      >
        <template #option="{ option }">
          <div class="opsi">
            <span>{{ option.nama }}</span>
            <small>{{ option.jenisJasa }}</small>
          </div>
        </template>
      </Select>
      <small v-if="errors.vendorId" class="galat">{{ errors.vendorId }}</small>
      <small v-else-if="pilihanVendor.gagal" class="galat">
        Daftar vendor gagal dimuat. {{ pesanError(pilihanVendor.error) }}
      </small>
    </div>

    <DaftarBentrok
      v-if="vendorId !== null"
      :bentrok="bentrok.data.value"
      :memuat="bentrok.isFetching.value"
      :nama="vendorTerpilih?.nama ?? penugasan?.namaVendor ?? 'Vendor ini'"
      tingkat="info"
    />

    <div class="baris">
      <label for="ev-kebutuhan">Kebutuhan yang disediakan <span class="wajib">*</span></label>
      <InputText
        id="ev-kebutuhan"
        v-model="kebutuhan"
        v-bind="kebutuhanAttrs"
        :invalid="Boolean(errors.kebutuhan)"
        placeholder="Contoh: Sound system 10.000 watt + lighting panggung"
        fluid
      />
      <small v-if="errors.kebutuhan" class="galat">{{ errors.kebutuhan }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="ev-biaya">Biaya <span class="wajib">*</span></label>
        <InputNumber
          v-model="biaya"
          input-id="ev-biaya"
          prefix="Rp "
          locale="id-ID"
          :min="0"
          :invalid="Boolean(errors.biaya)"
          fluid
        />
        <small v-if="errors.biaya" class="galat">{{ errors.biaya }}</small>
        <small v-else class="bantuan">Otomatis tercatat sebagai pos budget event.</small>
      </div>

      <div class="baris">
        <label for="ev-bayar">Status pembayaran</label>
        <Select
          v-model="statusPembayaran"
          input-id="ev-bayar"
          :options="PILIHAN_BAYAR"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
    </div>
  </FormDialog>
</template>

<style scoped>
.opsi {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.opsi small {
  color: var(--ns-text-3);
}
</style>
