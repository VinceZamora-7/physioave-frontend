<template>
  <Message severity="error" v-if="isError"> Something went wrong!</Message>
  <Dialog
    v-else
    v-model:visible="visible"
    :style="{ width: '70rem' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @show="onShow"
  >
    <DataTable
      :value="patientMedicalImagings?.content"
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
        <section class="flex justify-end items-center gap-4 w-full">
          <Button
            :loading="isLoading"
            icon="pi pi-save"
            severity="info"
            label="Add medical imaging"
            @click="onSave"
          />
          <Button
            :loading="isLoading"
            icon="pi pi-file-export"
            severity="info"
            label="Export to excel"
            @click="onExportToExcelThrottleFn"
          />
        </section>
      </template>

      <Column :sortable="true" header="Medical imaging" field="medical_imaging_name">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            {{ slotProps.data?.medical_imaging_name }}
          </SkeletonLoader>
        </template>
      </Column>

      <Column
        :sortable="true"
        header="Attachment"
        field="file_id"
      >
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Button
              :loading="isLoading"
              icon="pi pi-file"
              severity="info"
              v-tooltip="slotProps.data.file_id"
              label="Preview attachment"
              @click="filePreviewFn(slotProps.data?.file_id)"
            />
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
          :totalRecords="patientMedicalImagings?.total_elements"
          :rowsPerPageOptions="rowPerPageOptions"
          @page="onPageChangeDebounceFn($event, refetch)"
        />
      </template>
    </DataTable>
  </Dialog>
  <PatientMedicalImagingDialogForm
    ref="patientMedicalImagingDialogForm"
    v-bind="patientMedicalImagingDialogFormProps"
    @on-submit="onPatientMedicalDialogFormSubmit"
  />
</template>

<script setup lang="ts">

import Dialog from "primevue/dialog";
import {useThrottleFn, useToggle} from "@vueuse/core";
import {defaultThrottle, type DialogExpose, rowPerPageOptions} from "@/utils/global.type.ts";
import type {
  PatientMedicalImagingDialogFormProps,
  PatientMedicalImagingDialogFormSubmitEvent,
  PatientMedicalImagingDialogProps
} from "@/components/patient.type.ts";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import {type Pageable} from "@/models/paging.ts";
import {computed, toRefs, useTemplateRef} from "vue";
import type {
  PatientMedicalImaging,
  PatientMedicalImagingDeletePayload,
  PatientMedicalImagingPayload,
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
import {errorToast, successToast, warningToast} from "@/utils/toast.util.ts";
import type {APIError} from "@/utils/error-handler.ts";
import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import {
  patientMedicalImagingTanstackService
} from "@/services/patient-medical-imaging.tanstack.service.ts";
import PatientMedicalImagingDialogForm from "@/components/PatientMedicalImagingDialogForm.vue";
import type {FileDTO} from "@/models/file-server.ts";
import {FileServerTanstackKey, PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";
import {useFileDelete} from "@/composables/file-delete.composable.ts";
import {useFileSave} from "@/composables/file-save.composable.ts";
import {useFilePreview} from "@/composables/file-preview.composable.ts";

const patientMedicalImagingDialogForm = useTemplateRef<InstanceType<typeof PatientMedicalImagingDialogForm>>('patientMedicalImagingDialogForm')

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const props = defineProps<PatientMedicalImagingDialogProps>()
const {patient, medicalImagings} = toRefs(props)

const patientId = computed<number>(() => patient.value?.id ?? 0)

const isExportLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_IMAGING_EXPORT)
const isPatientMedicalImagingLoading = useIsLoading(PatientTanstackKey.PATIENT_MEDICAL_IMAGING)
const isFSALoading = useIsLoading(FileServerTanstackKey.FSA)
const isLoading = computed<boolean>(() => isExportLoading.value || isPatientMedicalImagingLoading.value || isFSALoading.value)

const [visible, toggle] = useToggle()

const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<PatientMedicalImaging> | undefined>()

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
  medicalImagings: medicalImagings.value
}) satisfies PatientMedicalImagingDialogFormProps)

const requestPayload = computed(() => ({
  patient_id: patientId.value,
  page_request: {
    page: page.value,
    size: pageSize.value,
  }
}) satisfies PatientMedicalRequestPayload)

const {
  data: patientMedicalImagings,
  isError,
  refetch,
  error
} = patientMedicalImagingTanstackService.getAll(requestPayload)
useRefreshToken<Pageable<PatientMedicalImaging> | undefined>(error, refetch)

const {
  mutate: saveMutation
} = patientMedicalImagingTanstackService.save()

const {
  mutate: removeMutation
} = patientMedicalImagingTanstackService.remove()

const onDelete = async (patientMedicalImaging: PatientMedicalImaging): Promise<void> => {
  confirm.require({
    message: `Are you sure you want to remove "${patientMedicalImaging.medical_imaging_name}" from this patient’s medical record? This action cannot be undone.`,
    header: `Remove patient medical imaging`,
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
    accept: async () => {
      const payload: PatientMedicalImagingDeletePayload = {
        patient_id: patientMedicalImaging.patient_id,
        medical_imaging_id: patientMedicalImaging.medical_imaging_id
      }

      removeMutation(payload, {
        async onSuccess() {
          successToast(toast, 'Record successfully removed.')
          await Promise.all([
            resetQueries(),
            fileDeleteFn(patientMedicalImaging.file_id),
          ])
        },
        async onError(error: APIError) {
          errorToast(toast, `Failed to uploaded record: ${error.message}`)
          await resetQueries()
        }
      })
    },
  })

}

const onSave = (): void => {
  patientMedicalImagingDialogForm.value?.toggleDialog()
}

const onPatientMedicalDialogFormSubmit = (event: PatientMedicalImagingDialogFormSubmitEvent): void => {
  confirm.require({
    message: `Are you sure you want to save "${event.medicalImaging?.name}" from this patient’s medical record?`,
    header: `Save patient medical imaging confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: `Save patient medical imaging`,
      severity: `info`,
      icon: `pi pi-save`,
      loading: isLoading
    },
    accept: async () => {
      if (!patient.value) {
        warningToast(toast, 'No selected patient')
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
          successToast(toast, 'Record successfully uploaded.')
          await resetQueries()
          patientMedicalImagingDialogForm.value?.toggleDialog()
        },
        async onError(error: APIError) {
          errorToast(toast, `Failed to uploaded record: ${error.message}`)
          await Promise.all([
            fileDeleteFn(fileDTO.file_id),
            resetQueries()
          ])
        },
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
  await refetch()
}

const resetQueries = async (): Promise<void> => {
  await queryClient.prefetchQuery({queryKey: [PatientTanstackKey.PATIENT_MEDICAL_IMAGING]})
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>
