<template>
  <main class="app-page-shell space-y-5">

    <!-- ── Admin Team Setup hero ───────────────────────────────────── -->
    <section
      class="app-hero-banner"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Admin Team Setup</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Manage your admin team members, clinics, and job titles. Configure who has access to what in the system.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Signed in as: {{ roleName || "Unknown role" }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">Clinics</div>
            <div class="mt-1 text-2xl font-semibold">{{ clinics.length }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">Admin Staff</div>
            <div class="mt-1 text-2xl font-semibold">{{ staffs?.total_elements ?? 0 }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">Job Titles</div>
            <div class="mt-1 text-2xl font-semibold">{{ adminRoles.length }}</div>
          </article>
        </div>
      </div>
    </section>

    <Message v-if="isError" severity="error">Something went wrong!</Message>

    <template v-if="!isError">

      <!-- ── Admin Staff Directory (main focus) ────────────────────── -->
      <section class="app-section-card-comfy space-y-4" id="staffs-directory">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 class="app-section-title">Admin Staff Directory</h3>
            <p class="text-sm opacity-70">
              Add and maintain admin-side staff accounts — clinic owners, managers, and billing staff — across all branches.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Add Admin"
              icon="pi pi-plus"
              :pt="ptPrimaryBtn"
              :disabled="!canCreateStaff || !activeAdminRoles.length"
              @click="openCreate"
            />
          </div>
        </div>

        <StaffsTable
          :staffs="staffs"
          :isLoading="isTableLoading"
          :page="page"
          :pageSize="pageSize"
          :rowPerPageOptions="rowPerPageOptions"
          @pageChange="onPageChangeDebounceFn($event, refetch)"
        >
          <template #header>
            <StaffsTableHeader
              v-model:selectedSearch="selectedSearch"
              v-model:selectedStatus="selectedStatus"
              :statuses="statuses"
              :isLoading="isUiLoading"
              :isExportLoading="isExportLoading"
              :canCreateStaff="canCreateStaff"
              :canManageRoles="canManageRoles"
              :canManageSpecialties="canManageSpecialties"
              @reset="resetFilters"
              @manageSpecialties="openSpecialtyManager"
              @manageRoles="openRoleManager"
              @export="onExportToExcelThrottleFn"
            />
          </template>

          <template #actions="{ staff }">
            <StaffRowActionsMenu
              :staff="staff"
              :disabled="isUiLoading"
              :canUpdate="canUpdateStaff"
              :canDelete="canDeleteStaff"
              @edit="openEdit"
              @toggleStatus="confirmToggleStatus"
              @hardDelete="confirmHardDelete"
            />
          </template>
        </StaffsTable>

        <Message v-if="!activeAdminRoles.length" severity="warn" :closable="false">
          No active admin job title found. Set up at least one in the Admin Job Titles section below.
        </Message>
      </section>

      <!-- ── Admin Job Titles (compact section) ────────────────────── -->
      <section class="app-section-card-comfy space-y-3" id="staffs-job-titles">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h3 class="app-section-title">Admin Job Titles</h3>
            <p class="text-sm opacity-70">Define admin roles. Access is configured per role.</p>
          </div>
          <Button
            label="Configure"
            icon="pi pi-shield"
            size="small"
            outlined
            :pt="ptOutlinedBtn"
            :disabled="!canManageRoles"
            @click="openRoleManager"
          />
        </div>

        <div class="max-h-52 overflow-y-auto space-y-1 pr-1">
          <div
            v-for="role in orderedAdminRoles"
            :key="role.id"
            class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-medium">{{ role.name }}</div>
              <Tag :value="role.is_active ? 'Active' : 'Inactive'" :severity="role.is_active ? 'success' : 'secondary'" />
            </div>
          </div>
          <div v-if="!orderedAdminRoles.length" class="text-sm opacity-70">
            No job titles yet.
          </div>
        </div>

        <Message v-if="!canManageRoles" severity="info" :closable="false">
          Your account does not have permission to manage admin job titles and permissions.
        </Message>
      </section>

    </template>

    <StaffEditorDialog
      ref="editor"
      formMode="ADMIN"
      :roles="adminRoles"
      :ptRoles="activePtRoles"
      :clinics="clinics"
      :specialties="specialties"
      :isLoading="isUiLoading"
      :canManageHighestRole="canManageHighestRole"
      :highestRoleIds="highestRoleIds"
    />
    <SpecialtyManagerDialog ref="specialtyManager" @specialtiesUpdated="handleSpecialtiesUpdated" />
    <RoleAccessManagerDialog
      ref="roleManager"
      providerScope="ADMIN"
      dialogTitle="Admin Job Titles and Permissions"
      @rolesUpdated="handleRolesUpdated"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { storeToRefs } from "pinia"
import Button from "primevue/button"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { useQueryClient } from "@tanstack/vue-query"
import { useThrottleFn, watchDebounced } from "@vueuse/core"
import type { AxiosResponse } from "axios"

import StaffsTable from "@/features/staff/components/StaffsTable.vue"
import StaffsTableHeader from "@/features/staff/components/StaffsTableHeader.vue"
import StaffRowActionsMenu from "@/features/staff/components/StaffRowActionsMenu.vue"
import StaffEditorDialog from "@/features/staff/components/StaffEditorDialog.vue"
import RoleAccessManagerDialog from "@/features/staff/components/RoleAccessManagerDialog.vue"
import SpecialtyManagerDialog from "@/features/staff/components/SpecialtyManagerDialog.vue"

import { staffTanstackService } from "@/features/staff/queries/staff.tanstack.service"
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
  rowPerPageOptions,
  Status,
} from "@/utils/global.type"
import {
  defaultPage,
  type Pageable,
  type PageRequestWithStatus,
} from "@/models/paging"
import type { Staff, StaffExportRequestParams, StaffRequestParams } from "@/features/staff/types/staff"
import type { Role, SpecialtyTag } from "@/models/reference"
import type { Lookup } from "@/models/global.model"
import { pamsAPI } from "@/utils/axios-interceptor"

import { createReferenceQueryService } from "@/services/reference.tanstack.service"
import { clinicStore } from "@/stores/clinic.store"
import { ptOutlinedBtn, ptPrimaryBtn } from "@/features/shared/table-header.styles"
import { ClinicTanstackKey, ReferenceTanstackKey, StaffTanstackKey } from "@/utils/keys/tanstack-key"
import { hasAnyStoredPermission, readStoredAuthSnapshot } from "@/utils/auth-user.util"

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()
const useClinicStore = clinicStore()
const { selectedClinicId } = storeToRefs(useClinicStore)

const editor = ref<InstanceType<typeof StaffEditorDialog> | null>(null)
const specialtyManager = ref<InstanceType<typeof SpecialtyManagerDialog> | null>(null)
const roleManager = ref<InstanceType<typeof RoleAccessManagerDialog> | null>(null)
const roleName = ref<string>("")
const permissionSet = ref<Set<string>>(new Set())
const canCreateStaff = computed(() => hasAnyStoredPermission(permissionSet.value, "Staff::CREATE"))
const canManageRoles = computed(() =>
  hasAnyStoredPermission(permissionSet.value, "Reference::CREATE", "Reference::UPDATE", "AccessMatrix::CREATE", "AccessMatrix::DELETE")
)
const canManageSpecialties = computed(() => false)
const canUpdateStaff = computed(() => hasAnyStoredPermission(permissionSet.value, "Staff::UPDATE"))
const canDeleteStaff = computed(() => hasAnyStoredPermission(permissionSet.value, "Staff::DELETE"))
const canManageHighestRole = computed(() => canManageRoles.value)

const activePtRoles = computed(() =>
  roles.value.filter((role) =>
    role.is_active
    && (role.appointment_provider_type === "PHYSICAL_THERAPIST"
      || role.appointment_provider_type === "PT_ASSISTANT"
      || role.appointment_provider_type === "INTERN")
  )
)
const activeAdminRoles = computed(() => adminRoles.value.filter((role) => role.is_active))
const orderedAdminRoles = computed(() => [...adminRoles.value].sort((a, b) => a.name.localeCompare(b.name)))

const isExportLoading = useIsLoading(StaffTanstackKey.STAFFS_EXPORT)
const isClinicLoading = useIsLoading(ClinicTanstackKey.CLINICS_LOOKUP)
const isRoleLoading = useIsLoading(ReferenceTanstackKey.ROLES)
const isSpecialtyLoading = useIsLoading(ReferenceTanstackKey.SPECIALTY_TAGS)
const isStaffLoading = useIsLoading(StaffTanstackKey.STAFFS)
const isTableLoading = computed(() => isStaffLoading.value)
const isUiLoading = computed(() =>
  isClinicLoading.value || isRoleLoading.value || isSpecialtyLoading.value || isStaffLoading.value
)

const roles = ref<Role[]>([])
const clinics = ref<Lookup[]>([])
const specialties = ref<SpecialtyTag[]>([])
const highestRoleIds = ref<number[]>([])
const rolePermissionSetCache = ref<Map<number, Set<number>>>(new Map())
const rolePermissionRequestCache = ref<Map<number, Promise<Set<number>>>>(new Map())

const adminRoles = computed(() =>
  roles.value.filter((role) =>
    role.appointment_provider_type !== "PHYSICAL_THERAPIST"
    && role.appointment_provider_type !== "PT_ASSISTANT"
    && role.appointment_provider_type !== "INTERN"
  )
)

	const selectedSearch = ref<string | undefined>()
	const selectedStatus = ref<Status>(Status.ACTIVE)
	
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
	      // Staff directory is meant to be cross-branch; do not implicitly filter by the global branch selector.
	      clinic_id: undefined,
	      staff_scope: "ADMIN",
	    }) satisfies StaffRequestParams
	)

const { data: staffs, isError, error, refetch } = staffTanstackService.getAll(requestParams)

useRefreshToken<Pageable<Staff> | undefined>(error, refetch)

	watchDebounced(
	  [selectedClinicId, selectedSearch, selectedStatus],
	  () => {
	    page.value = 1
	    void refetch()
	  },
	  { debounce: defaultFilterDebounce, flush: "post" }
	)

const resetFilters = () => {
  selectedSearch.value = undefined
  selectedStatus.value = Status.ACTIVE
}

const openCreate = () => {
  if (!canCreateStaff.value) return
  editor.value?.openCreate()
}
const openEdit = (staff: Staff) => editor.value?.openEdit(staff)
const openSpecialtyManager = () => {
  if (!canManageRoles.value) return
  void specialtyManager.value?.open()
}
const openRoleManager = () => {
  if (!canManageRoles.value) return
  void roleManager.value?.open()
}

const statusLabel = (isActive: boolean) => (isActive ? "Active" : "Inactive")

const { mutate: toggleStatusMutation } = staffTanstackService.toggleStatus()
const { mutate: hardDeleteMutation } = staffTanstackService.hardDelete()

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
      loading: isUiLoading.value,
    },
    acceptProps: {
      label: "Toggle Status",
      severity: "warning",
      icon: "pi pi-exclamation-triangle",
      loading: isUiLoading.value,
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
          const status = (err as any)?.status ?? (err as any)?.response?.status
          const message = `${(err as any)?.message ?? ""}`.toLowerCase()
          const isPermissionDenied =
            status === 403 ||
            message.includes("forbidden") ||
            message.includes("access denied") ||
            message.includes("permission")

          if (isPermissionDenied) {
            toast.add({
              severity: "error",
              summary: "Permission Denied",
              detail: "Toggle status failed: you do not have permission (403).",
              life: 3000,
            })
            await resetQueries()
            return
          }
          errorToast(toast, `Toggle status failed ${err.message}`)
          await resetQueries()
        },
      })
    },
  })
}

const confirmHardDelete = (staff: Staff) => {
  confirm.require({
    message: `Delete ${staff.name}? This permanently removes the record.`,
    header: "Permanently Delete Staff",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: isUiLoading.value,
    },
    acceptProps: {
      label: "Permanently Delete",
      severity: "danger",
      icon: "pi pi-times-circle",
      loading: isUiLoading.value,
    },
    accept: () => {
      hardDeleteMutation(staff.id, {
        async onSuccess() {
          successToast(toast, "Delete success")
          await resetQueries()
        },
        async onError(err: APIError) {
          errorToast(toast, `Delete failed ${err.message}`)
          await resetQueries()
        },
      })
    },
  })
}

const onExportToExcelThrottleFn = useThrottleFn(async () => {
  const params: StaffExportRequestParams = {
      clinic_id: undefined,
    page_request: {
      status: selectedStatus.value,
      name: selectedSearch.value?.trim() || undefined,
    },
    staff_scope: "ADMIN",
  }

  const response: AxiosResponse<Blob> | undefined = await staffTanstackService.export(queryClient, params)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const areSameNumberSets = (left: Set<number>, right: Set<number>): boolean => {
  if (left.size !== right.size) return false
  for (const value of left) {
    if (!right.has(value)) return false
  }
  return true
}

const clearRolePermissionSetCache = (): void => {
  rolePermissionSetCache.value = new Map()
  rolePermissionRequestCache.value = new Map()
}

const fetchAssignedPermissionIdSet = async (roleId: number): Promise<Set<number>> => {
  const cached = rolePermissionSetCache.value.get(roleId)
  if (cached) {
    return cached
  }

  const inFlight = rolePermissionRequestCache.value.get(roleId)
  if (inFlight) {
    return inFlight
  }

  const request = (async () => {
    const { data } = await pamsAPI.get<Pageable<{ id: number }>>("/references/permissions/assigned", {
      params: { role_id: roleId, page: 1, size: 500, status: "ACTIVE" }
    })

    const permissionSet = new Set((data?.content ?? []).map(permission => permission.id))
    rolePermissionSetCache.value.set(roleId, permissionSet)
    return permissionSet
  })()

  rolePermissionRequestCache.value.set(roleId, request)

  try {
    return await request
  } finally {
    rolePermissionRequestCache.value.delete(roleId)
  }
}

const refreshHighestRoleIds = async (availableRoles: Role[]): Promise<void> => {
  const ownerRole = availableRoles.find(role => role.name === "Owner")
  if (!ownerRole?.id) {
    highestRoleIds.value = []
    return
  }

  try {
    const rolePermissionPairs = await Promise.all(
      availableRoles.map(async role => ({
        roleId: role.id,
        permissionIds: await fetchAssignedPermissionIdSet(role.id),
      }))
    )

    const ownerPermissionIds = rolePermissionPairs.find(pair => pair.roleId === ownerRole.id)?.permissionIds
    if (!ownerPermissionIds) {
      highestRoleIds.value = [ownerRole.id]
      return
    }

    const equivalentRoleIds = rolePermissionPairs
      .filter(pair => areSameNumberSets(ownerPermissionIds, pair.permissionIds))
      .map(pair => pair.roleId)

    highestRoleIds.value = equivalentRoleIds
  } catch {
    highestRoleIds.value = [ownerRole.id]
  }
}

const initializeDropdowns = async () => {
  const roleRequest: PageRequestWithStatus = {
    page: defaultPage,
    size: 100,
    status: Status.ACTIVE,
  }

  const [fetchedClinics, fetchedRoles, fetchedSpecialties] = await Promise.all([
    clinicTanstackService.getAllLookup(queryClient, defaultPage, undefined),
    createReferenceQueryService<Role>(queryClient, ReferenceTanstackKey.ROLES, roleRequest),
    createReferenceQueryService<SpecialtyTag>(queryClient, ReferenceTanstackKey.SPECIALTY_TAGS, roleRequest),
  ])

  roles.value = fetchedRoles?.content ?? []
  clinics.value = fetchedClinics?.content ?? []
  specialties.value = fetchedSpecialties?.content ?? []

  await refreshHighestRoleIds(roles.value)
}

const handleRolesUpdated = async () => {
  clearRolePermissionSetCache()
  await initializeDropdowns()
}

const handleSpecialtiesUpdated = async () => {
  await initializeDropdowns()
}

const syncRoleFromStorage = () => {
  const snapshot = readStoredAuthSnapshot()
  roleName.value = snapshot.roleName
  permissionSet.value = snapshot.permissions
}

onMounted(async () => {
  syncRoleFromStorage()
  await initializeDropdowns()
})
</script>
