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
          placeholder="Search medical category"
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
              v-for="medicalCategory in filteredMedicalCategories"
              :key="medicalCategory.id"
              class="flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors"
              :class="isCategorySelected(medicalCategory.id)
                ? 'border-[rgba(var(--app-accent),0.40)] bg-[linear-gradient(135deg,rgba(var(--app-primary),0.08),rgba(var(--app-accent),0.10))]'
                : 'border-surface-200 bg-surface-0'"
            >
              <Checkbox
                binary
                :modelValue="isCategorySelected(medicalCategory.id)"
                :disabled="isLoading || isCategoryBusy(medicalCategory.id)"
                @update:modelValue="onMedicalCategoryToggle(medicalCategory, $event)"
              />
              <div class="min-w-0 flex-1">
                <div class="font-medium">
                  {{ medicalCategory.name }}
                </div>
                <div
                  v-if="isCategoryBusy(medicalCategory.id)"
                  class="text-xs opacity-70"
                >
                  Updating...
                </div>
              </div>
            </label>
          </div>
        </SkeletonLoader>

        <div
          v-if="!isLoading && !filteredMedicalCategories.length"
          class="py-8 text-center text-sm opacity-70"
        >
          No medical categories found.
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
import { useToast } from "primevue/usetoast"
import { computed, ref, toRefs } from "vue"
import { useThrottleFn, useToggle } from "@vueuse/core"
import type { PatientMedicalCategoryDialogProps } from "@/components/patient.type.ts"
import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import { useRefreshToken } from "@/composables/refresh-token.composable.ts"
import { useIsLoading } from "@/composables/tanstack-loader.composable.ts"
import type { APIError } from "@/utils/error-handler.ts"
import type { MedicalCategory } from "@/models/reference.ts"
import type {
  PatientMedicalCategoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts"
import { patientMedicalCategoryTanstackService } from "@/services/patient-medical-category.tanstack.service.ts"
import { exportToExcel } from "@/utils/export-excel.util.ts"
import { defaultThrottle, type DialogExpose } from "@/utils/global.type.ts"
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles"
import { PatientTanstackKey } from "@/utils/keys/tanstack-key.ts"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util.ts"

const toast = useToast()
const queryClient = useQueryClient()

const props = defineProps<PatientMedicalCategoryDialogProps>()
const { patient, medicalCategories } = toRefs(props)

const patientId = computed<number>(() => patient.value?.id ?? 0)
const [visible, toggle] = useToggle()
const searchTerm = ref("")
const pendingCategoryIds = ref<number[]>([])

const isExportLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_CATEGORY_EXPORT)
const isPatientMedicalCategoryLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_CATEGORIES)
const isLoading = computed<boolean>(() => isExportLoading.value || isPatientMedicalCategoryLoading.value)

const apiRequestPayload = computed(() => ({
  patient_id: patientId.value,
  page_request: {
    page: 1,
    size: Math.max(medicalCategories.value.length, 1)
  }
}) satisfies PatientMedicalRequestPayload)

const {
  data: patientMedicalCategories,
  isError,
  refetch,
  error
} = patientMedicalCategoryTanstackService.getAll(apiRequestPayload)
useRefreshToken(error, refetch)

const {
  mutate: saveMutation
} = patientMedicalCategoryTanstackService.save()

const {
  mutate: removeMutation
} = patientMedicalCategoryTanstackService.remove()

const assignedCategoryIds = computed(() => new Set(
  patientMedicalCategories.value?.content.map((category) => category.medical_category_id) ?? []
))

const filteredMedicalCategories = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) {
    return medicalCategories.value
  }

  return medicalCategories.value.filter((category) =>
    category.name.toLowerCase().includes(keyword)
  )
})

const isCategorySelected = (medicalCategoryId: number): boolean => assignedCategoryIds.value.has(medicalCategoryId)

const isCategoryBusy = (medicalCategoryId: number): boolean => pendingCategoryIds.value.includes(medicalCategoryId)

const clearPendingCategory = (medicalCategoryId: number): void => {
  pendingCategoryIds.value = pendingCategoryIds.value.filter((id) => id !== medicalCategoryId)
}

const refreshAssignments = async (): Promise<void> => {
  await refetch()
}

const onMedicalCategoryToggle = async (medicalCategory: MedicalCategory, checked: boolean): Promise<void> => {
  if (isCategoryBusy(medicalCategory.id)) {
    return
  }

  const payload: PatientMedicalCategoryPayload = {
    patient_id: patientId.value,
    medical_category_id: medicalCategory.id
  }

  pendingCategoryIds.value = [...pendingCategoryIds.value, medicalCategory.id]

  const mutation = checked ? saveMutation : removeMutation
  const successMessage = checked ? "Record successfully added." : "Record successfully removed."
  const errorPrefix = checked ? "Failed to add record" : "Failed to remove record"

  mutation(payload, {
    async onSuccess() {
      successToast(toast, successMessage)
      clearPendingCategory(medicalCategory.id)
      await refreshAssignments()
    },
    async onError(error: APIError) {
      errorToast(toast, getApiErrorMessage(error, {
        baseMessage: errorPrefix,
        permissionHint: "Patient access (Can Edit) in Role Access",
        invalidInputHint: "The selected medical category value is invalid. Refresh and try again.",
        retryHint: "Please try again."
      }))
      clearPendingCategory(medicalCategory.id)
      await refreshAssignments()
    }
  })
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const response: AxiosResponse<Blob> | undefined = await patientMedicalCategoryTanstackService.export(queryClient, patientId.value)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onShow = async (): Promise<void> => {
  searchTerm.value = ""
  pendingCategoryIds.value = []
  await refetch()
}

defineExpose<DialogExpose>({
  toggleDialog: toggle
})
</script>
