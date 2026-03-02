<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <Message v-if="isError" severity="error" class="mb-3">Something went wrong!</Message>

    <section
      v-else
      class="h-full rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3 sm:p-4"
    >
      <StaffsTable
        :staffs="staffs"
        :isLoading="isLoading"
        :page="page"
        :pageSize="pageSize"
        :rowPerPageOptions="rowPerPageOptions"
        @pageChange="onPageChangeDebounceFn($event, refetch)"
      >
        <template #header>
          <StaffsTableHeader
            v-model:selectedSearch="selectedSearch"
            v-model:selectedStatus="selectedStatus"
            v-model:selectedClinic="selectedClinic"
            :statuses="statuses"
            :clinics="clinics"
            :isLoading="isLoading"
            :isExportLoading="isExportLoading"
            @reset="resetFilters"
            @save="openCreate"
            @export="onExportToExcelThrottleFn"
          />
        </template>

        <template #actions="{ staff }">
          <StaffRowActionsMenu
            :staff="staff"
            :disabled="isLoading"
            @edit="openEdit"
            @toggleStatus="confirmToggleStatus"
            @viewAppointments="viewAppointments"
          />
        </template>
      </StaffsTable>

      <StaffEditorDialog ref="editor" :roles="roles" :clinics="clinics" :isLoading="isLoading" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import Message from "primevue/message"
import { useConfirm, useToast } from "primevue"
import { useQueryClient } from "@tanstack/vue-query"
import { useThrottleFn, watchDebounced } from "@vueuse/core"
import type { AxiosResponse } from "axios"

import StaffsTable from "@/features/staff/components/StaffsTable.vue"
import StaffsTableHeader from "@/features/staff/components/StaffsTableHeader.vue"
import StaffRowActionsMenu from "@/features/staff/components/StaffRowActionsMenu.vue"
import StaffEditorDialog from "@/features/staff/components/StaffEditorDialog.vue"

import { staffTanstackService } from "@/features/staff/queries/staff.tanstack.service"
import { clinicTanstackService } from "@/features/clinics/queries/clinic.tanstack.service"

import { useIsLoading } from "@/composables/tanstack-loader.composable"
import { useRefreshToken } from "@/composables/refresh-token.composable"
import { usePaginationDebounce } from "@/composables/pagination-debounce.composable"
import { exportToExcel } from "@/utils/export-excel.util"
import { errorToast, infoToast, successToast, warningToast } from "@/utils/toast.util"
import type { APIError } from "@/utils/error-handler"

import {
  defaultFilterDebounce,
  defaultThrottle,
  statuses,
  rowPerPageOptions,
  Status,
} from "@/utils/global.type"
import {
  defaultPage,
  defaultPageSize,
  type Pageable,
  type PageRequestWithStatus,
} from "@/models/paging"
import type { Staff, StaffExportRequestParams, StaffRequestParams } from "@/features/staff/types/staff"
import type { Role } from "@/models/reference"
import type { Lookup } from "@/models/global.model"

import { createReferenceQueryService } from "@/services/reference.tanstack.service"
import { clinicStore } from "@/stores/clinic.store"
import { appointmentStore } from "@/stores/appointment.store"
import { ClinicTanstackKey, ReferenceTanstackKey, StaffTanstackKey } from "@/utils/keys/tanstack-key"
import {useRouter} from "vue-router";

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()
const useClinicStore = clinicStore()
const useAppointmentStore = appointmentStore()
const router = useRouter()

const editor = ref<InstanceType<typeof StaffEditorDialog> | null>(null)

const isExportLoading = useIsLoading(StaffTanstackKey.STAFFS_EXPORT)
const isClinicLoading = useIsLoading(ClinicTanstackKey.CLINICS_LOOKUP)
const isRoleLoading = useIsLoading(ReferenceTanstackKey.ROLES)
const isStaffLoading = useIsLoading(StaffTanstackKey.STAFFS)
const isLoading = computed(() => isClinicLoading.value || isRoleLoading.value || isStaffLoading.value)

const roles = ref<Role[]>([])
const clinics = ref<Lookup[]>([])

const selectedClinic = ref<Lookup | undefined>()
const selectedSearch = ref<string | undefined>()
const selectedStatus = ref<Status>(Status.ALL)

const { page, pageSize, onPageChangeDebounceFn } = usePaginationDebounce<Pageable<Staff> | undefined>()

const requestParams = computed(
  () =>
    ({
      pageable_request: {
        page: page.value,
        size: pageSize.value,
        name: selectedSearch.value?.trim() || undefined,
        status: selectedStatus.value,
      },
      clinic_id: selectedClinic.value?.id,
    }) satisfies StaffRequestParams
)

const { data: staffs, isError, error, refetch } = staffTanstackService.getAll(requestParams)
useRefreshToken<Pageable<Staff> | undefined>(error, refetch)

watchDebounced(
  [selectedClinic, selectedSearch, selectedStatus],
  () => {
    page.value = 1
    void refetch()
  },
  { debounce: defaultFilterDebounce, flush: "post" }
)

const resetFilters = () => {
  selectedSearch.value = undefined
  selectedStatus.value = Status.ALL
  selectedClinic.value = undefined
}

const openCreate = () => editor.value?.openCreate()
const openEdit = (staff: Staff) => editor.value?.openEdit(staff)

const statusLabel = (isActive: boolean) => (isActive ? "Active" : "Inactive")

const { mutate: toggleStatusMutation } = staffTanstackService.toggleStatus()

const resetQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: [StaffTanstackKey.STAFFS] })
}

const confirmToggleStatus = (staff: Staff) => {
  confirm.require({
    message: `If you proceed this staff will be updated from ${statusLabel(staff.is_active)} to ${statusLabel(!staff.is_active)}.`,
    header: `Toggle Status for ${staff.name}`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: isLoading.value,
    },
    acceptProps: {
      label: "Toggle Status",
      severity: "warning",
      icon: "pi pi-exclamation-triangle",
      loading: isLoading.value,
    },
    accept: () => {
      if (!staff.id) {
        warningToast(toast, "No selected staff")
        return
      }

      toggleStatusMutation(staff.id, {
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

const viewAppointments = async (staff: Staff) => {
  useAppointmentStore.staff = staff
  infoToast(toast, `Viewing appointments for ${staff.name}`)
  await router.push("/appointments")
}

const onExportToExcelThrottleFn = useThrottleFn(async () => {
  const params: StaffExportRequestParams = {
    clinic_id: selectedClinic.value?.id,
    page_request: {
      status: selectedStatus.value,
      name: selectedSearch.value?.trim() || undefined,
    },
  }

  const response: AxiosResponse<Blob> | undefined = await staffTanstackService.export(queryClient, params)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const initializeDropdowns = async () => {
  const roleRequest: PageRequestWithStatus = {
    page: defaultPage,
    size: defaultPageSize,
    status: Status.ACTIVE,
  }

  const [fetchedClinics, fetchedRoles] = await Promise.all([
    clinicTanstackService.getAllLookup(queryClient, defaultPage, undefined),
    createReferenceQueryService<Role>(queryClient, ReferenceTanstackKey.ROLES, roleRequest),
  ])

  roles.value = fetchedRoles?.content ?? []
  clinics.value = fetchedClinics?.content ?? []
}

const applyClinicRedirect = async () => {
  const clinicFromStore = useClinicStore.clinic
  if (!clinicFromStore) return

  selectedClinic.value = clinics.value.find((c) => c.id === clinicFromStore.id)
  useClinicStore.resetClinic()
}

onMounted(async () => {
  await initializeDropdowns()
  await applyClinicRedirect()
})
</script>
