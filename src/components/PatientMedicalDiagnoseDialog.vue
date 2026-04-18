<template>
  <Message v-if="isError" severity="error"> Something went wrong! </Message>
  <Dialog
    v-else
    v-model:visible="visible"
    :style="{ width: '52rem', maxWidth: '95vw' }"
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
          placeholder="Search medical diagnosis"
          class="w-full sm:max-w-sm"
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

      <div class="rounded-2xl border border-surface-200 bg-surface-0 p-3">
        <SkeletonLoader :loading="isLoading">
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="medicalDiagnose in filteredMedicalDiagnoses"
              :key="medicalDiagnose.id"
              class="flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors"
              :class="isDiagnoseSelected(medicalDiagnose.id)
                ? 'border-[rgba(var(--app-accent),0.40)] bg-[linear-gradient(135deg,rgba(var(--app-primary),0.08),rgba(var(--app-accent),0.10))]'
                : 'border-surface-200 bg-surface-0'"
            >
              <Checkbox
                binary
                :modelValue="isDiagnoseSelected(medicalDiagnose.id)"
                :disabled="isLoading || isDiagnoseBusy(medicalDiagnose.id)"
                @update:modelValue="onMedicalDiagnoseToggle(medicalDiagnose, $event)"
              />
              <div class="min-w-0 flex-1">
                <div class="font-medium">
                  {{ medicalDiagnose.name }}
                </div>
                <div
                  v-if="isDiagnoseBusy(medicalDiagnose.id)"
                  class="text-xs opacity-70"
                >
                  Updating...
                </div>
              </div>
            </label>
          </div>
        </SkeletonLoader>

        <div
          v-if="!isLoading && !filteredMedicalDiagnoses.length"
          class="py-8 text-center text-sm opacity-70"
        >
          No medical diagnoses found.
        </div>
      </div>
    </section>
  </Dialog>
</template>

<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query"
import type { AxiosResponse } from "axios"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import { useToast } from "primevue"
import { computed, ref, toRefs } from "vue"
import { useThrottleFn, useToggle } from "@vueuse/core"
import type { PatientMedicalDiagnoseDialogProps } from "@/components/patient.type.ts"
import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import { useRefreshToken } from "@/composables/refresh-token.composable.ts"
import { useIsLoading } from "@/composables/tanstack-loader.composable.ts"
import type { APIError } from "@/utils/error-handler.ts"
import type { MedicalDiagnose } from "@/models/reference.ts"
import type {
  PatientMedicalDiagnosePayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts"
import { patientMedicalDiagnoseTanstackService } from "@/services/patient-medical-diagnose.tanstack.service.ts"
import { exportToExcel } from "@/utils/export-excel.util.ts"
import { defaultThrottle, type DialogExpose } from "@/utils/global.type.ts"
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles"
import { PatientTanstackKey } from "@/utils/keys/tanstack-key.ts"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util.ts"

const toast = useToast()
const queryClient = useQueryClient()

const props = defineProps<PatientMedicalDiagnoseDialogProps>()
const { patient, medicalDiagnoses } = toRefs(props)

const patientId = computed<number>(() => patient.value?.id ?? 0)
const [visible, toggle] = useToggle()
const searchTerm = ref("")
const pendingDiagnoseIds = ref<number[]>([])

const isExportLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_DIAGNOSES_EXPORT)
const isPatientMedicalDiagnoseLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_DIAGNOSES)
const isLoading = computed<boolean>(() => isExportLoading.value || isPatientMedicalDiagnoseLoading.value)

const apiRequestPayload = computed(() => ({
  patient_id: patientId.value,
  page_request: {
    page: 1,
    size: Math.max(medicalDiagnoses.value.length, 1)
  }
}) satisfies PatientMedicalRequestPayload)

const {
  data: patientMedicalDiagnoses,
  isError,
  refetch,
  error
} = patientMedicalDiagnoseTanstackService.getAll(apiRequestPayload)
useRefreshToken(error, refetch)

const {
  mutate: saveMutation
} = patientMedicalDiagnoseTanstackService.save()

const {
  mutate: removeMutation
} = patientMedicalDiagnoseTanstackService.remove()

const assignedDiagnoseIds = computed(() => new Set(
  patientMedicalDiagnoses.value?.content.map((diagnose) => diagnose.medical_diagnose_id) ?? []
))

const filteredMedicalDiagnoses = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) {
    return medicalDiagnoses.value
  }

  return medicalDiagnoses.value.filter((diagnose) =>
    diagnose.name.toLowerCase().includes(keyword)
  )
})

const isDiagnoseSelected = (medicalDiagnoseId: number): boolean => assignedDiagnoseIds.value.has(medicalDiagnoseId)

const isDiagnoseBusy = (medicalDiagnoseId: number): boolean => pendingDiagnoseIds.value.includes(medicalDiagnoseId)

const clearPendingDiagnose = (medicalDiagnoseId: number): void => {
  pendingDiagnoseIds.value = pendingDiagnoseIds.value.filter((id) => id !== medicalDiagnoseId)
}

const refreshAssignments = async (): Promise<void> => {
  await refetch()
}

const onMedicalDiagnoseToggle = async (medicalDiagnose: MedicalDiagnose, checked: boolean): Promise<void> => {
  if (isDiagnoseBusy(medicalDiagnose.id)) {
    return
  }

  const payload: PatientMedicalDiagnosePayload = {
    patient_id: patientId.value,
    medical_diagnose_id: medicalDiagnose.id
  }

  pendingDiagnoseIds.value = [...pendingDiagnoseIds.value, medicalDiagnose.id]

  const mutation = checked ? saveMutation : removeMutation
  const successMessage = checked ? "Record successfully added." : "Record successfully removed."
  const errorPrefix = checked ? "Failed to add record" : "Failed to remove record"

  mutation(payload, {
    async onSuccess() {
      successToast(toast, successMessage)
      clearPendingDiagnose(medicalDiagnose.id)
      await refreshAssignments()
    },
    async onError(error: APIError) {
      errorToast(toast, getApiErrorMessage(error, {
        baseMessage: errorPrefix,
        permissionHint: "Patient access (Can Edit) in Role Access",
        invalidInputHint: "The selected medical diagnosis value is invalid. Refresh and try again.",
        retryHint: "Please try again."
      }))
      clearPendingDiagnose(medicalDiagnose.id)
      await refreshAssignments()
    }
  })
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const response: AxiosResponse<Blob> | undefined = await patientMedicalDiagnoseTanstackService.export(queryClient, patientId.value)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onShow = async (): Promise<void> => {
  searchTerm.value = ""
  pendingDiagnoseIds.value = []
  await refetch()
}

defineExpose<DialogExpose>({
  toggleDialog: toggle
})
</script>
