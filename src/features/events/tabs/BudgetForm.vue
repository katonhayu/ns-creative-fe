<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { rupiah } from '@/utils/format'
import { budgetSchema, type BudgetFormValues, type BudgetPayload } from '../budget.schema'
import { LABEL_SUMBER, SARAN_KATEGORI_BUDGET, type BudgetItem } from '../budget.types'
import { STATUS_PEMBAYARAN, pilihanDari } from '../penugasan.types'

const props = defineProps<{
  budget: BudgetItem | null
  menyimpan: boolean
  simpan: (payload: BudgetPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.budget !== null)
/** Pos dari talent/vendor: nama, kategori, dan estimasi dikunci. */
const terkunci = computed(() => Boolean(props.budget?.sumberTipe))
const pesanGagal = ref('')
const PILIHAN_BAYAR = pilihanDari(STATUS_PEMBAYARAN)

function nilaiAwal(b: BudgetItem | null): BudgetFormValues {
  return {
    namaKebutuhan: b?.namaKebutuhan ?? '',
    kategori: b?.kategori ?? '',
    estimasiBiaya: b?.estimasiBiaya ?? null,
    biayaAktual: b?.biayaAktual ?? null,
    sponsorship: b?.sponsorship ?? null,
    statusPembayaran: b?.statusPembayaran ?? 'belum_bayar',
  }
}

const FIELD_FORM = [
  'namaKebutuhan',
  'kategori',
  'estimasiBiaya',
  'biayaAktual',
  'sponsorship',
  'statusPembayaran',
] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: skemaForm(budgetSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [namaKebutuhan, namaKebutuhanAttrs] = defineField('namaKebutuhan', lazy)
const [kategori] = defineField('kategori', lazy)
const [estimasiBiaya] = defineField('estimasiBiaya', lazy)
const [biayaAktual] = defineField('biayaAktual', lazy)
const [sponsorship] = defineField('sponsorship', lazy)
const [statusPembayaran] = defineField('statusPembayaran')

/** Pratinjau selisih selagi mengetik. */
const pratinjauSelisih = computed(() => {
  const estimasi = estimasiBiaya.value
  const aktual = biayaAktual.value
  return typeof estimasi === 'number' && typeof aktual === 'number' ? estimasi - aktual : null
})

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.budget) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Pos anggaran gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit pos anggaran' : 'Tambah pos anggaran'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <Message v-if="terkunci && budget?.sumberTipe" severity="info" :closable="false" size="small">
      Pos ini {{ LABEL_SUMBER[budget.sumberTipe].label.toLowerCase() }}. Nama, kategori, dan
      estimasi diubah dari tab {{ budget.sumberTipe === 'event_talent' ? 'Talent' : 'Vendor' }}. Di
      sini kamu mencatat realisasi dan pembayarannya.
    </Message>

    <div class="baris">
      <label for="bg-nama">Nama kebutuhan <span class="wajib">*</span></label>
      <InputText
        id="bg-nama"
        v-model="namaKebutuhan"
        v-bind="namaKebutuhanAttrs"
        :disabled="terkunci"
        :invalid="Boolean(errors.namaKebutuhan)"
        placeholder="Contoh: Sewa ballroom dan paket meeting"
        :autofocus="!terkunci"
        fluid
      />
      <small v-if="errors.namaKebutuhan" class="galat">{{ errors.namaKebutuhan }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="bg-kategori">Kategori <span class="wajib">*</span></label>
        <Select
          v-model="kategori"
          input-id="bg-kategori"
          :options="SARAN_KATEGORI_BUDGET"
          editable
          :disabled="terkunci"
          placeholder="Pilih atau ketik"
          :invalid="Boolean(errors.kategori)"
          fluid
        />
        <small v-if="errors.kategori" class="galat">{{ errors.kategori }}</small>
      </div>

      <div class="baris">
        <label for="bg-estimasi">Estimasi biaya <span class="wajib">*</span></label>
        <InputNumber
          v-model="estimasiBiaya"
          input-id="bg-estimasi"
          prefix="Rp "
          locale="id-ID"
          :min="0"
          :disabled="terkunci"
          :invalid="Boolean(errors.estimasiBiaya)"
          fluid
        />
        <small v-if="errors.estimasiBiaya" class="galat">{{ errors.estimasiBiaya }}</small>
      </div>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="bg-aktual">Biaya aktual</label>
        <InputNumber
          v-model="biayaAktual"
          input-id="bg-aktual"
          prefix="Rp "
          locale="id-ID"
          :min="0"
          :invalid="Boolean(errors.biayaAktual)"
          :autofocus="terkunci"
          fluid
        />
        <small v-if="errors.biayaAktual" class="galat">{{ errors.biayaAktual }}</small>
        <small v-else-if="pratinjauSelisih === null" class="bantuan">
          Kosongkan jika belum ada realisasi.
        </small>
        <small v-else-if="pratinjauSelisih < 0" class="galat">
          Melebihi estimasi {{ rupiah(-pratinjauSelisih) }}.
        </small>
        <small v-else class="hemat">Hemat {{ rupiah(pratinjauSelisih) }} dari estimasi.</small>
      </div>

      <div class="baris">
        <label for="bg-sponsor">Sponsorship</label>
        <InputNumber
          v-model="sponsorship"
          input-id="bg-sponsor"
          prefix="Rp "
          locale="id-ID"
          :min="0"
          :invalid="Boolean(errors.sponsorship)"
          fluid
        />
        <small v-if="errors.sponsorship" class="galat">{{ errors.sponsorship }}</small>
        <small v-else class="bantuan">Dana dari sponsor untuk pos ini.</small>
      </div>
    </div>

    <div class="baris">
      <label for="bg-bayar">Status pembayaran</label>
      <Select
        v-model="statusPembayaran"
        input-id="bg-bayar"
        :options="PILIHAN_BAYAR"
        option-label="label"
        option-value="value"
        fluid
      />
      <small v-if="budget?.sumberTipe === 'event_vendor'" class="bantuan">
        Ikut memperbarui status pembayaran di tab Vendor.
      </small>
    </div>
  </FormDialog>
</template>

<style scoped>
.hemat {
  color: var(--ns-success);
  font-size: 0.78rem;
}
</style>
