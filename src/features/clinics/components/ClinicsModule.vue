<!-- src/features/clinics/components/ClinicsModule.vue -->
<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <Message v-if="isError" severity="error" class="mb-3">
      Something went wrong!
    </Message>

    <section
      v-else
      class="h-full rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3 sm:p-4"
    >
      <ClinicsTable
        :clinics="clinics"
        :isLoading="isLoading"
        :page="page"
        :pageSize="pageSize"
        :rowPerPageOptions="rowPerPageOptions"
        @pageChange="onPageChangeDebounceFn($event, refetch)"
      >
        <template #header>
          <ClinicsTableHeader
            v-model:selectedSearch="selectedSearch"
            v-model:selectedStatus="selectedStatus"
            :statuses="statuses"
            :isLoading="isLoading"
            :isExportLoading="isExportLoading"
            @reset="resetFilters"
            @save="openCreate"
            @export="onExportToExcelThrottleFn"
          />
        </template>

        <template #actions="{ clinic }">
          <ClinicRowActionsMenu
            :clinic="clinic"
            :disabled="isLoading"
            @edit="openEdit"
            @toggleStatus="confirmToggleStatus"
            @managePatients="managePatients"
            @manageStaffs="manageStaffs"
          />
        </template>
      </ClinicsTable>

      <ClinicEditorDialog ref="editor" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import Message from "primevue/message"
import { useConfirm, useToast } from "primevue"
import { useQueryClient } from "@tanstack/vue-query"
import { useThrottleFn, watchDebounced } from "@vueuse/core"
import type { AxiosResponse } from "axios"
import { useRouter } from "vue-router"

import ClinicsTable from "@/features/clinics/components/ClinicsTable.vue"
import ClinicsTableHeader from "@/features/clinics/components/ClinicsTableHeader.vue"
import ClinicRowActionsMenu from "@/features/clinics/components/ClinicRowActionsMenu.vue"
import ClinicEditorDialog from "@/features/clinics/components/ClinicEditorDialog.vue"

import { clinicTanstackService } from "@/features/clinics/queries/clinic.tanstack.service"
import { useIsLoading } from "@/composables/tanstack-loader.composable"
import { useRefreshToken } from "@/composables/refresh-token.composable"
import { usePaginationDebounce } from "@/composables/pagination-debounce.composable"
import { exportToExcel } from "@/utils/export-excel.util"
import { errorToast, successToast, warningToast } from "@/utils/toast.util"
import type { APIError } from "@/utils/error-handler"

import {
  defaultFilterDebounce,
  defaultThrottle,
  statuses,
  type Status,
  rowPerPageOptions,
} from "@/utils/global.type"
import {
  defaultStatus,
  type Pageable,
  type PageableRequest,
  type PageRequestWithNameAndStatus,
} from "@/models/paging"
import type { Clinic } from "@/features/clinics/types/clinic"
import { ClinicTanstackKey } from "@/utils/keys/tanstack-key"
import { clinicStore } from "@/stores/clinic.store"

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()
const useClinicStore = clinicStore()

const editor = ref<InstanceType<typeof ClinicEditorDialog> | null>(null)

// loading states
const isExportLoading = useIsLoading(ClinicTanstackKey.CLINICS_EXPORT)
const isClinicLoading = useIsLoading(ClinicTanstackKey.CLINICS)
const isLoading = computed(() => isClinicLoading.value || isExportLoading.value)

// filters + pagination
const selectedSearch = ref<string | undefined>()
const selectedStatus = ref<Status>(defaultStatus)

const { page, pageSize, onPageChangeDebounceFn } =
  usePaginationDebounce<Pageable<Clinic> | undefined>()

const requestParams = computed(
  () =>
    ({
      page: page.value,
      size: pageSize.value,
      name: selectedSearch.value?.trim() || undefined,
      status: selectedStatus.value,
    }) satisfies PageableRequest
)

// query
const { data: clinics, isError, error, refetch } = clinicTanstackService.getAll(requestParams)
useRefreshToken<Pageable<Clinic> | undefined>(error, refetch)

// ✅ prevent stacking (no await)
watchDebounced(
  [selectedSearch, selectedStatus],
  () => {
    page.value = 1
    void refetch()
  },
  { debounce: defaultFilterDebounce, flush: "post" }
)

const resetFilters = () => {
  selectedSearch.value = undefined
  selectedStatus.value = defaultStatus
}

// open dialog
const openCreate = () => editor.value?.openCreate()
const openEdit = (clinic: Clinic) => editor.value?.openEdit(clinic)

// actions
const statusLabel = (isActive: boolean) => (isActive ? "Operational" : "Non operational")

const resetQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: [ClinicTanstackKey.CLINICS] })
}

const { mutate: toggleStatusMutation } = clinicTanstackService.toggleStatus()

const confirmToggleStatus = (clinic: Clinic) => {
  confirm.require({
    message: `If you proceed this clinic will be updated from ${statusLabel(clinic.is_active)} to ${statusLabel(!clinic.is_active)}.`,
    header: `Toggle Status for ${clinic.name}`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: isLoading.value, // ✅ boolean
    },
    acceptProps: {
      label: "Toggle Status",
      severity: "warning",
      icon: "pi pi-exclamation-triangle",
      loading: isLoading.value, // ✅ boolean
    },
    accept: () => {
      if (!clinic.id) {
        warningToast(toast, "No clinic selected")
        return
      }

      toggleStatusMutation(clinic.id, {
        async onSuccess() {
          successToast(toast, "Toggle status success")
          await resetQueries()
        },
        async onError(err: APIError) {
          errorToast(toast, `Toggle status failed ${err.message}`)
          await resetQueries()
        },
      })
    },
  })
}

const managePatients = async (clinic: Clinic) => {
  useClinicStore.clinic = clinic
  await router.push("/patients")
}

const manageStaffs = async (clinic: Clinic) => {
  useClinicStore.clinic = clinic
  await router.push("/staffs")
}

const onExportToExcelThrottleFn = useThrottleFn(async () => {
  const request: PageRequestWithNameAndStatus = {
    status: selectedStatus.value,
    name: selectedSearch.value?.trim() || undefined,
  }

  const response: AxiosResponse<Blob> | undefined = await clinicTanstackService.export(queryClient, request)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)
</script>
