<template>
  <Message v-if="isError" severity="error"> Something went wrong! </Message>
  <Dialog
    v-else
    v-model:visible="visible"
    :style="{ width: '72rem', maxWidth: '95vw' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @show="onShow"
  >
    <section class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputText
          v-model="searchTerm"
          :disabled="isLoading"
          placeholder="Search medical imaging"
          class="w-full sm:max-w-sm"
        />
        <div class="flex gap-3">
          <Button
            :loading="isLoading"
            icon="pi pi-save"
            severity="info"
            :pt="ptModalPrimaryBtn"
            label="Add medical imaging"
            @click="onSave()"
          />
          <Button
            :loading="isLoading"
            icon="pi pi-file-export"
            severity="info"
            :pt="ptModalPrimaryBtn"
            label="Export to excel"
            @click="onExportToExcelThrottleFn"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-surface-200 bg-surface-0 p-3">
        <SkeletonLoader :loading="isLoading">
          <div class="grid gap-3">
            <div
              v-for="medicalImaging in filteredMedicalImagings"
              :key="medicalImaging.id"
              class="rounded-xl border px-4 py-3 transition-colors"
              :class="isImagingSelected(medicalImaging.id)
                ? 'border-[rgba(var(--app-accent),0.40)] bg-[linear-gradient(135deg,rgba(var(--app-primary),0.08),rgba(var(--app-accent),0.10))]'
                : 'border-surface-200 bg-surface-0'"
            >
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-start gap-3">
                  <Checkbox
                    binary
                    :modelValue="isImagingSelected(medicalImaging.id)"
                    disabled
                  />
                  <div>
                    <div class="font-medium">{{ medicalImaging.name }}</div>
                    <div class="text-xs opacity-70">
                      {{ isImagingSelected(medicalImaging.id) ? 'Attachment uploaded' : 'No attachment uploaded yet' }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <Button
                    v-if="!getAssignedImaging(medicalImaging.id)"
                    :loading="isLoading"
                    icon="pi pi-upload"
                    severity="info"
                    :pt="ptModalPrimaryBtn"
                    label="Upload attachment"
                    @click="onSave(medicalImaging)"
                  />
                  <template v-else>
                    <Button
                      :loading="isLoading"
                      icon="pi pi-file"
                      severity="info"
                      :pt="ptModalPrimaryBtn"
                      label="Preview attachment"
                      @click="filePreviewFn(getAssignedImaging(medicalImaging.id)?.file_id)"
                    />
                    <Button
                      :loading="isLoading"
                      icon="pi pi-trash"
                      severity="danger"
                      label="Remove"
                      @click="onDelete(getAssignedImaging(medicalImaging.id)!)"
                    />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </SkeletonLoader>

        <div
          v-if="!isLoading && !filteredMedicalImagings.length"
          class="py-8 text-center text-sm opacity-70"
        >
          No medical imagings found.
        </div>
      </div>
    </section>
  </Dialog>

  <PatientMedicalImagingDialogForm
    ref="patientMedicalImagingDialogForm"
    v-bind="patientMedicalImagingDialogFormProps"
    @on-submit="onPatientMedicalDialogFormSubmit"
    @on-close="selectedMedicalImagingDraft = undefined"
  />
</template>

<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query"
import type { AxiosResponse } from "axios"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import { useConfirm, useToast } from "primevue"
import { computed, ref, toRefs, useTemplateRef } from "vue"
import { useThrottleFn, useToggle } from "@vueuse/core"
import type {
  PatientMedicalImagingDialogFormProps,
  PatientMedicalImagingDialogFormSubmitEvent,
  PatientMedicalImagingDialogProps
} from "@/components/patient.type.ts"
import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import PatientMedicalImagingDialogForm from "@/components/PatientMedicalImagingDialogForm.vue"
import { useFileDelete } from "@/composables/file-delete.composable.ts"
import { useFilePreview } from "@/composables/file-preview.composable.ts"
import { useFileSave } from "@/composables/file-save.composable.ts"
import { useRefreshToken } from "@/composables/refresh-token.composable.ts"
import { useIsLoading } from "@/composables/tanstack-loader.composable.ts"
import type { APIError } from "@/utils/error-handler.ts"
import type { FileDTO } from "@/models/file-server.ts"
import type {
  PatientMedicalImaging,
  PatientMedicalImagingPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts"
import type { MedicalImaging } from "@/models/reference.ts"
import { patientMedicalImagingTanstackService } from "@/services/patient-medical-imaging.tanstack.service.ts"
import { exportToExcel } from "@/utils/export-excel.util.ts"
import { defaultThrottle, type DialogExpose } from "@/utils/global.type.ts"
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles"
import { FileServerTanstackKey, PatientTanstackKey } from "@/utils/keys/tanstack-key.ts"
import { errorToast, successToast, warningToast } from "@/utils/toast.util.ts"

const patientMedicalImagingDialogForm = useTemplateRef<InstanceType<typeof PatientMedicalImagingDialogForm>>("patientMedicalImagingDialogForm")

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const props = defineProps<PatientMedicalImagingDialogProps>()
const { patient, medicalImagings } = toRefs(props)

const patientId = computed<number>(() => patient.value?.id ?? 0)
const [visible, toggle] = useToggle()
const searchTerm = ref("")
const selectedMedicalImagingDraft = ref<MedicalImaging | undefined>()

const isExportLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_IMAGING_EXPORT)
const isPatientMedicalImagingLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_IMAGING)
const isFSALoading = useIsLoading(FileServerTanstackKey.FSA)
const isLoading = computed<boolean>(() => isExportLoading.value || isPatientMedicalImagingLoading.value || isFSALoading.value)

const {
  previewFn: filePreviewFn
} = useFilePreview(patient)

const {
  saveFn: fileSaveFn
} = useFileSave(patient)

const {
  deleteFn: fileDeleteFn
} = useFileDelete(patient)

const patientMedicalImagingDialogFormProps = computed(() => ({
  isLoading: isLoading.value,
  header: `Add medical imaging for ${patient.value?.full_name}`,
  medicalImagings: medicalImagings.value,
  selectedMedicalImaging: selectedMedicalImagingDraft.value
}) satisfies PatientMedicalImagingDialogFormProps)

const requestPayload = computed(() => ({
  patient_id: patientId.value,
  page_request: {
    page: 1,
    size: Math.max(medicalImagings.value.length, 1)
  }
}) satisfies PatientMedicalRequestPayload)

const {
  data: patientMedicalImagings,
  isError,
  refetch,
  error
} = patientMedicalImagingTanstackService.getAll(requestPayload)
useRefreshToken(error, refetch)

const {
  mutate: saveMutation
} = patientMedicalImagingTanstackService.save()

const {
  mutate: removeMutation
} = patientMedicalImagingTanstackService.remove()

const assignedImagingMap = computed(() => new Map(
  (patientMedicalImagings.value?.content ?? []).map((imaging) => [imaging.medical_imaging_id, imaging])
))

const filteredMedicalImagings = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) {
    return medicalImagings.value
  }

  return medicalImagings.value.filter((imaging) =>
    imaging.name.toLowerCase().includes(keyword)
  )
})

const getAssignedImaging = (medicalImagingId: number): PatientMedicalImaging | undefined => assignedImagingMap.value.get(medicalImagingId)

const isImagingSelected = (medicalImagingId: number): boolean => assignedImagingMap.value.has(medicalImagingId)

const refreshImagings = async (): Promise<void> => {
  await refetch()
}

const onDelete = async (patientMedicalImaging: PatientMedicalImaging): Promise<void> => {
  confirm.require({
    message: `Are you sure you want to remove "${patientMedicalImaging.medical_imaging_name}" from this patient’s medical record? This action cannot be undone.`,
    header: "Remove patient medical imaging",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: isLoading.value
    },
    acceptProps: {
      label: "Remove",
      severity: "danger",
      icon: "pi pi-trash",
      loading: isLoading.value
    },
    accept: async () => {
      removeMutation({
        patient_id: patientMedicalImaging.patient_id,
        medical_imaging_id: patientMedicalImaging.medical_imaging_id
      }, {
        async onSuccess() {
          successToast(toast, "Record successfully removed.")
          await Promise.all([
            refreshImagings(),
            fileDeleteFn(patientMedicalImaging.file_id)
          ])
        },
        async onError(error: APIError) {
          errorToast(toast, `Failed to uploaded record: ${error.message}`)
          await refreshImagings()
        }
      })
    }
  })
}

const onSave = (medicalImaging?: MedicalImaging): void => {
  selectedMedicalImagingDraft.value = medicalImaging
  patientMedicalImagingDialogForm.value?.toggleDialog()
}

const onPatientMedicalDialogFormSubmit = (event: PatientMedicalImagingDialogFormSubmitEvent): void => {
  confirm.require({
    message: `Are you sure you want to save "${event.medicalImaging?.name}" from this patient’s medical record?`,
    header: "Save patient medical imaging confirmation",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: isLoading.value
    },
    acceptProps: {
      label: "Save patient medical imaging",
      severity: "info",
      icon: "pi pi-save",
      loading: isLoading.value
    },
    accept: async () => {
      if (!patient.value) {
        warningToast(toast, "No selected patient")
        return
      }

      if (!event.medicalImaging) {
        warningToast(toast, "Medical imaging is required")
        return
      }

      const fileDTO: FileDTO | undefined = await fileSaveFn(event.attachment)
      if (!fileDTO) {
        errorToast(toast, "File failed to be saved")
        return
      }

      const payload: PatientMedicalImagingPayload = {
        patient_id: patient.value.id,
        medical_imaging_id: event.medicalImaging.id,
        attachment: {
          file_id: fileDTO.file_id,
          checksum: fileDTO.checksum,
          media_type: fileDTO.media_type,
          extension: fileDTO.extension
        }
      }

      saveMutation(payload, {
        async onSuccess() {
          successToast(toast, "Record successfully uploaded.")
          await refreshImagings()
          selectedMedicalImagingDraft.value = undefined
          patientMedicalImagingDialogForm.value?.toggleDialog()
        },
        async onError(error: APIError) {
          errorToast(toast, `Failed to uploaded record: ${error.message}`)
          await Promise.all([
            fileDeleteFn(fileDTO.file_id),
            refreshImagings()
          ])
        }
      })
    }
  })
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  if (!patient.value) {
    warningToast(toast, "Patient is required")
    return
  }

  const response: AxiosResponse<Blob> | undefined = await patientMedicalImagingTanstackService.export(queryClient, patient.value.id)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onShow = async (): Promise<void> => {
  searchTerm.value = ""
  await refetch()
}

defineExpose<DialogExpose>({
  toggleDialog: toggle
})
</script>
