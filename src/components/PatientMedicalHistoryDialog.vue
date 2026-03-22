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
          placeholder="Search medical history"
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
              v-for="medicalHistory in filteredMedicalHistories"
              :key="medicalHistory.id"
              class="flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors"
              :class="isHistorySelected(medicalHistory.id)
                ? 'border-[rgba(var(--app-accent),0.40)] bg-[linear-gradient(135deg,rgba(var(--app-primary),0.08),rgba(var(--app-accent),0.10))]'
                : 'border-surface-200 bg-surface-0'"
            >
              <Checkbox
                binary
                :modelValue="isHistorySelected(medicalHistory.id)"
                :disabled="isLoading || isHistoryBusy(medicalHistory.id)"
                @update:modelValue="onMedicalHistoryToggle(medicalHistory, $event)"
              />
              <div class="min-w-0 flex-1">
                <div class="font-medium">
                  {{ medicalHistory.name }}
                </div>
                <div
                  v-if="isHistoryBusy(medicalHistory.id)"
                  class="text-xs opacity-70"
                >
                  Updating...
                </div>
              </div>
            </label>
          </div>
        </SkeletonLoader>

        <div
          v-if="!isLoading && !filteredMedicalHistories.length"
          class="py-8 text-center text-sm opacity-70"
        >
          No medical histories found.
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
import type { PatientMedicalHistoryDialogProps } from "@/components/patient.type.ts"
import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import { useRefreshToken } from "@/composables/refresh-token.composable.ts"
import { useIsLoading } from "@/composables/tanstack-loader.composable.ts"
import type { APIError } from "@/utils/error-handler.ts"
import type { MedicalHistory } from "@/models/reference.ts"
import type {
  PatientMedicalHistoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts"
import { patientMedicalHistoryTanstackService } from "@/services/patient-medical-history.tanstack.service.ts"
import { exportToExcel } from "@/utils/export-excel.util.ts"
import { defaultThrottle, type DialogExpose } from "@/utils/global.type.ts"
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles"
import { PatientTanstackKey } from "@/utils/keys/tanstack-key.ts"
import { errorToast, successToast } from "@/utils/toast.util.ts"

const toast = useToast()
const queryClient = useQueryClient()

const props = defineProps<PatientMedicalHistoryDialogProps>()
const { patient, medicalHistories } = toRefs(props)

const patientId = computed<number>(() => patient.value?.id ?? 0)
const [visible, toggle] = useToggle()
const searchTerm = ref("")
const pendingHistoryIds = ref<number[]>([])

const isExportLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_HISTORY_EXPORT)
const isPatientMedicalHistoryLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_HISTORY)
const isLoading = computed<boolean>(() => isExportLoading.value || isPatientMedicalHistoryLoading.value)

const apiRequestPayload = computed(() => ({
  patient_id: patientId.value,
  page_request: {
    page: 1,
    size: Math.max(medicalHistories.value.length, 1)
  }
}) satisfies PatientMedicalRequestPayload)

const {
  data: patientMedicalHistories,
  isError,
  refetch,
  error
} = patientMedicalHistoryTanstackService.getAll(apiRequestPayload)
useRefreshToken(error, refetch)

const {
  mutate: saveMutation
} = patientMedicalHistoryTanstackService.save()

const {
  mutate: removeMutation
} = patientMedicalHistoryTanstackService.remove()

const assignedHistoryIds = computed(() => new Set(
  patientMedicalHistories.value?.content.map((history) => history.medical_history_id) ?? []
))

const filteredMedicalHistories = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) {
    return medicalHistories.value
  }

  return medicalHistories.value.filter((history) =>
    history.name.toLowerCase().includes(keyword)
  )
})

const isHistorySelected = (medicalHistoryId: number): boolean => assignedHistoryIds.value.has(medicalHistoryId)

const isHistoryBusy = (medicalHistoryId: number): boolean => pendingHistoryIds.value.includes(medicalHistoryId)

const clearPendingHistory = (medicalHistoryId: number): void => {
  pendingHistoryIds.value = pendingHistoryIds.value.filter((id) => id !== medicalHistoryId)
}

const refreshAssignments = async (): Promise<void> => {
  await refetch()
}

const onMedicalHistoryToggle = async (medicalHistory: MedicalHistory, checked: boolean): Promise<void> => {
  if (isHistoryBusy(medicalHistory.id)) {
    return
  }

  const payload: PatientMedicalHistoryPayload = {
    patient_id: patientId.value,
    medical_history_id: medicalHistory.id
  }

  pendingHistoryIds.value = [...pendingHistoryIds.value, medicalHistory.id]

  const mutation = checked ? saveMutation : removeMutation
  const successMessage = checked ? "Record successfully added." : "Record successfully removed."
  const errorPrefix = checked ? "Failed to add record" : "Failed to remove record"

  mutation(payload, {
    async onSuccess() {
      successToast(toast, successMessage)
      clearPendingHistory(medicalHistory.id)
      await refreshAssignments()
    },
    async onError(error: APIError) {
      errorToast(toast, `${errorPrefix}: ${error.message}`)
      clearPendingHistory(medicalHistory.id)
      await refreshAssignments()
    }
  })
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const response: AxiosResponse<Blob> | undefined = await patientMedicalHistoryTanstackService.export(queryClient, patientId.value)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onShow = async (): Promise<void> => {
  searchTerm.value = ""
  pendingHistoryIds.value = []
  await refetch()
}

defineExpose<DialogExpose>({
  toggleDialog: toggle
})
</script>
