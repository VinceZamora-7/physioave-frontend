<template>
  <Message severity="error" v-if="isError"> Something went wrong!</Message>
  <Dialog
    v-else
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @show="onShow"
  >
    <DataTable
      :value="patientMedicalHistories?.content"
      :show-gridlines="true"
      :removable-sort="true"
      :scrollable="true"
      :pt="{
        root: { class: 'flex flex-col h-full' },
        column: {
          headerCell: {
            class: 'text-center',
          },
          bodyCell: { class: 'text-center' },
          columnTitle: { class: 'mx-auto font-semibold' },
        },

      }"
    >
      <template v-slot:empty>
        <div class="text-center font-bold text-2xl">
          <SkeletonLoader :loading="isLoading">
            <span>No records found.</span>
          </SkeletonLoader>
        </div>
      </template>

      <template v-slot:header>
        <section class="flex justify-end items-center w-full">
          <div class="flex gap-4">
            <Select
              @value-change="onMedicalHistoryChange"
              :fluid="true"
              :loading="isLoading"
              :options="medicalHistories"
              placeholder="Select Medical History"
              :filter="true"
              :filter-fields="['name']"
              class="w-60">
              <template v-slot:value="slotProps">
                <div v-if="slotProps.value" class="flex items-center">
                  <div>{{ slotProps.value?.name }}</div>
                </div>
                <span v-else>
                {{ slotProps.placeholder }}
              </span>
              </template>
              <template v-slot:option="slotProps">
                <div class="flex items-center">
                  <div>{{ slotProps.option?.name }}</div>
                </div>
              </template>
            </Select>
            <Button
              :loading="isLoading"
              icon="pi pi-file-export"
              severity="info"
              label="Export to excel"
              @click="onExportToExcelThrottleFn"
            />
          </div>
        </section>
      </template>

      <Column :sortable="true" header="Medical history" field="medical_history_name">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            {{ slotProps.data?.medical_history_name }}
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Actions">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Button
              :loading="isLoading"
              icon="pi pi-trash"
              severity="danger"
              label="Remove this record"
              @click="onDelete(slotProps.data)"
            />
          </SkeletonLoader>
        </template>
      </Column>

      <template v-slot:footer>
        <Paginator
          current-page-report-template="Showing {first} to {last} of {totalRecords} records (Page {currentPage} of {totalPages})"
          template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
          :first="(page - 1) * pageSize"
          :rows="pageSize"
          :totalRecords="patientMedicalHistories?.total_elements"
          :rowsPerPageOptions="rowPerPageOptions"
          @page="onPageChangeDebounceFn($event, refetch)"
        />
      </template>
    </DataTable>
  </Dialog>
</template>

<script setup lang="ts">

import Dialog from "primevue/dialog";
import {useThrottleFn, useToggle} from "@vueuse/core";
import {defaultThrottle, type DialogExpose, rowPerPageOptions} from "@/utils/global.type.ts";
import type {PatientMedicalHistoryDialogProps} from "@/components/patient.type.ts";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import type {Pageable} from "@/models/paging.ts";
import {computed, toRefs} from "vue";
import type {
  PatientMedicalHistory,
  PatientMedicalHistoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {useQueryClient} from "@tanstack/vue-query";
import SkeletonLoader from "@/composables/SkeletonLoader.vue";
import {Paginator, useConfirm, useToast} from "primevue";
import DataTable from "primevue/datatable";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import Message from "primevue/message";
import Column from "primevue/column";
import Button from "primevue/button";
import type {AxiosResponse} from "axios";
import {exportToExcel} from "@/utils/export-excel.util.ts";
import {errorToast, successToast} from "@/utils/toast.util.ts";
import type {APIError} from "@/utils/error-handler.ts";
import Select from "primevue/select";
import type {MedicalHistory} from "@/models/reference.ts";
import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import {
  patientMedicalHistoryTanstackService
} from "@/services/patient-medical-history.tanstack.service.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const props = defineProps<PatientMedicalHistoryDialogProps>()
const {patient} = toRefs(props)

const patientId = computed<number>(() => patient.value?.id ?? 0)

const isExportLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_HISTORY_EXPORT)
const isPatientMedicalHistoryLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_HISTORY)
const isLoading = computed<boolean>(() => isExportLoading.value || isPatientMedicalHistoryLoading.value)

const [visible, toggle] = useToggle()

const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<PatientMedicalHistory> | undefined>()

const apiRequestPayload = computed(() => ({
  patient_id: patientId.value,
  page_request: {
    page: page.value,
    size: pageSize.value
  }
}) satisfies PatientMedicalRequestPayload)

const {
  data: patientMedicalHistories,
  isError,
  refetch,
  error
} = patientMedicalHistoryTanstackService.getAll(apiRequestPayload)
useRefreshToken<Pageable<PatientMedicalHistory> | undefined>(error, refetch)

const {
  mutate: saveMutation
} = patientMedicalHistoryTanstackService.save()

const {
  mutate: removeMutation
} = patientMedicalHistoryTanstackService.remove()

const onMedicalHistoryChange = async (medicalHistory: MedicalHistory): Promise<void> => {
  const payload: PatientMedicalHistoryPayload = {
    patient_id: patientId.value,
    medical_history_id: medicalHistory.id
  }

  saveMutation(payload, {
    async onSuccess() {
      successToast(toast, 'Record successfully added.')
      await resetQueries()
    },
    async onError(error: APIError) {
      errorToast(toast, `Failed to add record: ${error.message}`)
      await resetQueries()
    },
  })
}

const onDelete = async (patientMedicalHistory: PatientMedicalHistory): Promise<void> => {
  confirm.require({
    message: `Are you sure you want to remove "${patientMedicalHistory.medical_history_name}" from this patient’s medical record? This action cannot be undone.`,
    header: `Remove Medical History`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: 'Remove',
      severity: 'danger',
      icon: 'pi pi-trash',
      loading: isLoading
    },
    accept: () => {
      const payload: PatientMedicalHistoryPayload = {
        patient_id: patientMedicalHistory.patient_id,
        medical_history_id: patientMedicalHistory.medical_history_id
      }

      removeMutation(payload, {
        async onSuccess() {
          successToast(toast, 'Record successfully removed.')
          await resetQueries()
        },
        async onError(error: APIError) {
          errorToast(toast, `Failed to remove record: ${error.message}`)
          await resetQueries()
        },
      })
    },
  })

}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const response: AxiosResponse<Blob> | undefined = await patientMedicalHistoryTanstackService.export(queryClient, patientId.value)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onShow = async (): Promise<void> => {
  await refetch()
}

const resetQueries = async (): Promise<void> => {
  await queryClient.prefetchQuery({queryKey: [PatientTanstackKey.PATIENT_MEDICAL_HISTORY]})
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>
