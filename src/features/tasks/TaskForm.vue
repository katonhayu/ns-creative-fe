<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { skemaForm } from '@/utils/schema'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FormDialog from '@/components/FormDialog.vue'
import { errorPerField, pesanError } from '@/api/http'
import { usePilihan } from '@/composables/usePilihan'
import { listPilihanUser } from '@/features/users/user.api'
import { LABEL_PERAN } from '@/features/auth/auth.types'
import { taskSchema, type TaskFormValues, type TaskPayload } from './task.schema'
import { PILIHAN_STATUS_TASK, type TaskRow } from './task.types'

const props = defineProps<{
  task: TaskRow | null
  menyimpan: boolean
  simpan: (payload: TaskPayload) => Promise<void>
}>()
const visible = defineModel<boolean>('visible', { required: true })

const modeEdit = computed(() => props.task !== null)
const pesanGagal = ref('')
const PILIHAN_STATUS = PILIHAN_STATUS_TASK

const pilihanPic = usePilihan({
  key: ['users', 'pilihan', 'semua'],
  ambil: (search) => listPilihanUser(undefined, search),
  aktif: visible,
  terpilih: () =>
    props.task?.picUserId
      ? {
          id: props.task.picUserId,
          nama: props.task.namaPic ?? '',
          email: '',
          role: 'crew' as const,
        }
      : null,
})

function nilaiAwal(t: TaskRow | null): TaskFormValues {
  return {
    namaTugas: t?.namaTugas ?? '',
    picUserId: t?.picUserId ?? null,
    deadline: t?.deadline ? dayjs(t.deadline).toDate() : null,
    // Data lama berstatus terlambat diperlakukan sebagai belum.
    status: t && t.status !== 'terlambat' ? t.status : 'belum',
    deskripsi: t?.deskripsi ?? '',
    catatan: t?.catatan ?? '',
  }
}

const FIELD_FORM = ['namaTugas', 'picUserId', 'deadline', 'status', 'deskripsi', 'catatan'] as const

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: skemaForm(taskSchema),
  initialValues: nilaiAwal(null),
})

const lazy = (state: { errors: string[] }) => ({ validateOnModelUpdate: state.errors.length > 0 })
const [namaTugas, namaTugasAttrs] = defineField('namaTugas', lazy)
const [picUserId] = defineField('picUserId', lazy)
const [deadline] = defineField('deadline', lazy)
const [status] = defineField('status')
const [deskripsi, deskripsiAttrs] = defineField('deskripsi', lazy)
const [catatan, catatanAttrs] = defineField('catatan', lazy)

watch(visible, (buka) => {
  if (buka) {
    pesanGagal.value = ''
    resetForm({ values: nilaiAwal(props.task) })
  }
})

const kirim = handleSubmit(async (values) => {
  pesanGagal.value = ''
  try {
    await props.simpan(values)
  } catch (error) {
    const fieldErrors = errorPerField(error, FIELD_FORM)
    if (fieldErrors) setErrors(fieldErrors)
    pesanGagal.value = pesanError(error, 'Task gagal disimpan. Coba lagi.')
  }
})
</script>

<template>
  <FormDialog
    v-model:visible="visible"
    :judul="modeEdit ? 'Edit task' : 'Tambah task'"
    :label-simpan="modeEdit ? 'Simpan perubahan' : 'Simpan'"
    :menyimpan="menyimpan"
    :pesan-gagal="pesanGagal"
    @submit="kirim"
  >
    <div class="baris">
      <label for="task-nama">Nama tugas <span class="wajib">*</span></label>
      <InputText
        id="task-nama"
        v-model="namaTugas"
        v-bind="namaTugasAttrs"
        :invalid="Boolean(errors.namaTugas)"
        placeholder="Contoh: Konfirmasi rooming list peserta"
        autofocus
        fluid
      />
      <small v-if="errors.namaTugas" class="galat">{{ errors.namaTugas }}</small>
    </div>

    <div class="dua-kolom">
      <div class="baris">
        <label for="task-pic">PIC tugas <span class="wajib">*</span></label>
        <Select
          v-model="picUserId"
          input-id="task-pic"
          :options="pilihanPic.opsi"
          option-label="nama"
          option-value="id"
          :loading="pilihanPic.memuat"
          @filter="pilihanPic.cari($event.value)"
          filter
          placeholder="Pilih penanggung jawab"
          :invalid="Boolean(errors.picUserId)"
          fluid
        >
          <template #option="{ option }">
            <div class="opsi">
              <span>{{ option.nama }}</span>
              <small>{{ LABEL_PERAN[option.role as keyof typeof LABEL_PERAN] }}</small>
            </div>
          </template>
        </Select>
        <small v-if="errors.picUserId" class="galat">{{ errors.picUserId }}</small>
        <small v-else-if="pilihanPic.gagal" class="galat">
          Daftar pengguna gagal dimuat. {{ pesanError(pilihanPic.error) }}
        </small>
      </div>

      <div class="baris">
        <label for="task-deadline">Deadline <span class="wajib">*</span></label>
        <DatePicker
          v-model="deadline"
          input-id="task-deadline"
          date-format="dd M yy"
          show-icon
          icon-display="input"
          :invalid="Boolean(errors.deadline)"
          fluid
        />
        <small v-if="errors.deadline" class="galat">{{ errors.deadline }}</small>
      </div>
    </div>

    <div class="baris">
      <label for="task-status">Status</label>
      <Select
        v-model="status"
        input-id="task-status"
        :options="PILIHAN_STATUS"
        option-label="label"
        option-value="value"
        fluid
      />
    </div>

    <div class="baris">
      <label for="task-deskripsi">Deskripsi</label>
      <Textarea
        id="task-deskripsi"
        v-model="deskripsi"
        v-bind="deskripsiAttrs"
        :invalid="Boolean(errors.deskripsi)"
        rows="2"
        auto-resize
        placeholder="Apa yang harus dikerjakan"
        fluid
      />
      <small v-if="errors.deskripsi" class="galat">{{ errors.deskripsi }}</small>
    </div>

    <div class="baris">
      <label for="task-catatan">Catatan</label>
      <Textarea
        id="task-catatan"
        v-model="catatan"
        v-bind="catatanAttrs"
        :invalid="Boolean(errors.catatan)"
        rows="2"
        auto-resize
        placeholder="Kendala atau progres terakhir"
        fluid
      />
      <small v-if="errors.catatan" class="galat">{{ errors.catatan }}</small>
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
