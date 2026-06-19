<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitleResolved"
    :style="{ width: '1120px' }"
    :breakpoints="{ '1280px': '96vw', '768px': '100vw' }"
  >
    <div class="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="text-sm font-semibold text-[rgb(var(--app-fg))]">Job Titles</div>
            <div class="text-xs text-[rgb(var(--app-fg))]/60">Set up the staff job titles your clinic will use.</div>
          </div>
          <Button
            label="New Job Title"
            icon="pi pi-plus"
            size="small"
            :disabled="isBusy"
            @click="startCreateRole"
          />
        </div>

        <div class="mt-4 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          <SelectButton
            v-model="statusFilter"
            class="mb-3"
            :options="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
            :disabled="isBusy"
          />

          <button
            v-for="role in filteredRoles"
            :key="role.id"
            type="button"
            :disabled="isBusy"
            :class="[
              'w-full rounded-2xl border px-3 py-3 text-left transition',
              selectedRoleId === role.id
                ? 'border-[rgb(var(--app-primary))] bg-[rgb(var(--app-card))] shadow-sm'
                : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] hover:bg-[rgb(var(--app-card))]'
            ]"
            @click="selectRole(role)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-medium text-[rgb(var(--app-fg))]">{{ role.name }}</div>
                <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">
                  {{ formatProviderType(role.appointment_provider_type) }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <Tag
                  :value="role.requires_specialty_tag ? 'Needs specialty' : 'No specialty required'"
                  :severity="role.requires_specialty_tag ? 'info' : 'secondary'"
                />
                <Tag
                  :value="role.is_active ? 'Active' : 'Inactive'"
                  :severity="role.is_active ? 'success' : 'secondary'"
                />
              </div>
            </div>
          </button>

          <div
            v-if="!filteredRoles.length && !isRoleLoading"
            class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-4 py-8 text-center text-sm text-[rgb(var(--app-fg))]/60"
          >
            No job titles match this filter.
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-[rgb(var(--app-fg))]">
                {{ isCreateMode ? "Create Job Title" : `Edit ${selectedRole?.name || "Job Title"}` }}
              </h3>
              <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/60">
                Choose what this job title is called, how it appears in appointments, and what people with this job title are allowed to do.
              </p>
            </div>
            <Tag
              :value="isCreateMode ? 'Draft' : (selectedRole?.is_active ? 'Active' : 'Inactive')"
              :severity="isCreateMode ? 'contrast' : (selectedRole?.is_active ? 'success' : 'secondary')"
            />
          </div>

          <Message v-if="isSelectedRoleLocked" severity="warn" :closable="false" class="mt-4 h-fit">
            The Owner job title is locked for safety. Create a new job title instead.
          </Message>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <IftaLabel>
              <InputText
                v-model="roleForm.name"
                fluid
                placeholder="Job title name"
                :disabled="isSelectedRoleLocked || isBusy"
              />
              <label>Job Title Name</label>
            </IftaLabel>

            <IftaLabel>
              <Select
                v-model="roleForm.appointment_provider_type"
                :options="filteredProviderTypeOptions"
                optionLabel="label"
                optionValue="value"
                fluid
                :disabled="isSelectedRoleLocked || isBusy"
              />
              <label>Used In Appointments As</label>
            </IftaLabel>
          </div>

          <label class="mt-4 flex items-start gap-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3">
            <input
              v-model="roleForm.requires_specialty_tag"
              type="checkbox"
              class="mt-1 h-4 w-4"
              :disabled="isSpecialtyToggleDisabled || isBusy"
            >
            <span class="text-sm text-[rgb(var(--app-fg))]">
              People with this job title must have a specialty, such as Neuro or Pediatric.
            </span>
          </label>

          <label
            v-if="canCreateOwnerEquivalent"
            class="mt-3 flex items-start gap-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3"
          >
            <input
              v-model="createAsOwnerEquivalent"
              type="checkbox"
              class="mt-1 h-4 w-4"
              :disabled="!isCreateMode || isBusy"
            >
            <span class="text-sm text-[rgb(var(--app-fg))]">
              Grant Owner-equivalent access after creating this job title.
            </span>
          </label>

	          <div class="mt-4 flex flex-wrap justify-end gap-2">
	            <Button
	              v-if="canCreateOwnerEquivalent && !isCreateMode && !isSelectedRoleLocked"
	              label="Grant Owner-Equivalent Access"
	              icon="pi pi-crown"
	              severity="secondary"
	              outlined
	              :disabled="isBusy"
	              @click="grantOwnerEquivalentAccess"
	            />
	            <Button
	              v-if="!isCreateMode"
	              :label="selectedRole?.is_active ? 'Deactivate Job Title' : 'Activate Job Title'"
	              :icon="selectedRole?.is_active ? 'pi pi-times-circle' : 'pi pi-refresh'"
              :severity="selectedRole?.is_active ? 'danger' : 'success'"
              outlined
              :disabled="isSelectedRoleLocked || isBusy"
              @click="toggleRoleStatus"
            />
            <Button
              label="Reset"
              icon="pi pi-refresh"
              outlined
              :disabled="isBusy"
              @click="resetRoleForm"
            />
            <Button
              :label="isCreateMode ? 'Create Job Title' : 'Save Job Title'"
              :icon="isCreateMode ? 'pi pi-plus' : 'pi pi-save'"
              :loading="isSavingRole"
              :disabled="isSelectedRoleLocked || isBusy"
              @click="saveRole"
            />
          </div>
        </section>

        <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-[rgb(var(--app-fg))]">Sidebar Access</h3>
              <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/60">
                Choose which sidebar tabs this job title can open. Technical backend permissions are updated automatically.
              </p>
            </div>
            <Tag :value="`${selectedSidebarAccess.length} tabs selected`" severity="info" />
          </div>

          <Message v-if="isCreateMode" severity="info" :closable="false" class="mt-4 h-fit">
            Save this job title first, then set its sidebar access.
          </Message>
          <Message v-else-if="isSelectedRoleLocked" severity="warn" :closable="false" class="mt-4 h-fit">
            The Owner job title permissions are locked here to keep the top-level account safe.
          </Message>

          <div v-else class="mt-4 space-y-4">
            <div class="flex flex-wrap gap-2">
              <Button
                v-if="props.providerScope !== 'ADMIN'"
                label="Apply PT Defaults"
                icon="pi pi-user"
                size="small"
                outlined
                :disabled="isBusy"
                @click="applyPhysicalTherapistDefaults"
              />
              <Button
                label="Select All Tabs"
                icon="pi pi-check-square"
                size="small"
                text
                :disabled="isBusy"
                @click="selectAllSidebarTabs"
              />
              <Button
                label="Clear All Tabs"
                icon="pi pi-times"
                size="small"
                text
                :disabled="isBusy"
                @click="clearAllSidebarTabs"
              />
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div
                v-for="option in visibleSidebarAccessOptions"
                :key="option.key"
                class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3"
              >
                <div class="flex items-start gap-3">
                  <input
                    type="checkbox"
                    class="mt-1 h-4 w-4"
                    :checked="selectedSidebarAccess.includes(option.key)"
                    :disabled="isBusy || !hasMappedPermissions(option.key)"
                    @change="toggleSidebarAccess(option.key)"
                  >
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold text-[rgb(var(--app-fg))]">{{ option.label }}</span>
                    <span class="mt-1 block text-xs text-[rgb(var(--app-fg))]/60">{{ option.description }}</span>
                    <div
                      v-if="isPermissionLevelSupported(option.key) && selectedSidebarAccess.includes(option.key)"
                      class="mt-2"
                    >
                      <div class="mb-1 text-[11px] font-medium uppercase tracking-wide text-[rgb(var(--app-fg))]/60">
                        Access level
                      </div>
                      <SelectButton
                        :modelValue="getPermissionLevel(option.key)"
                        :options="permissionLevelOptions"
                        optionLabel="label"
                        optionValue="value"
                        :allowEmpty="false"
                        :disabled="isBusy"
                        @update:modelValue="setPermissionLevel(option.key, $event)"
                      />
                    </div>
                    <Tag class="mt-2" :value="`${mappedPermissionCount(option.key)} mapped permission rules`" severity="secondary" />
                  </span>
                </div>

                <div class="mt-3">
                  <Button
                    :label="isAdvancedOpen(option.key) ? 'Hide Advanced Rules' : 'Advanced: Edit Rules'"
                    :icon="isAdvancedOpen(option.key) ? 'pi pi-chevron-up' : 'pi pi-sliders-h'"
                    size="small"
                    text
                    :disabled="isBusy || !hasMappedPermissions(option.key)"
                    @click="toggleAdvanced(option.key)"
                  />

                  <div v-if="isAdvancedOpen(option.key)" class="mt-2 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
                    <p class="text-xs text-[rgb(var(--app-fg))]/60">
                      Choose specific permission rules for this tab. If this tab is selected, only checked rules will be applied.
                    </p>

                    <div class="mt-2 flex flex-wrap gap-2">
                      <Button
                        label="Select All Rules"
                        icon="pi pi-check-square"
                        size="small"
                        text
                        :disabled="isBusy"
                        @click="selectAllAdvancedRules(option.key)"
                      />
                      <Button
                        label="Clear Rules"
                        icon="pi pi-times"
                        size="small"
                        text
                        :disabled="isBusy"
                        @click="clearAdvancedRules(option.key)"
                      />
                    </div>

                    <div class="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                      <label
                        v-for="permission in getPermissionsForSidebarAccess(option.key)"
                        :key="permission.id"
                        class="flex items-start gap-2 rounded-lg border border-[rgb(var(--app-border))] px-2 py-2"
                      >
                        <input
                          type="checkbox"
                          class="mt-1 h-4 w-4"
                          :checked="isAdvancedRuleChecked(option.key, permission.id)"
                          :disabled="isBusy"
                          @change="toggleAdvancedRule(option.key, permission.id)"
                        >
                        <span class="min-w-0">
                          <span class="block text-xs font-medium text-[rgb(var(--app-fg))]">{{ permission.name }}</span>
                          <span v-if="permission.description?.trim()" class="block text-[11px] text-[rgb(var(--app-fg))]/60">
                            {{ permission.description }}
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap justify-end gap-2">
              <Button
                label="Apply Sidebar Access"
                icon="pi pi-save"
                :loading="isPermissionSaving"
                :disabled="isBusy"
                @click="saveSidebarAccess"
              />
            </div>
          </div>
        </section>
      </section>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { storeToRefs } from "pinia"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
	import SelectButton from "primevue/selectbutton"
	import Tag from "primevue/tag"
	import { useConfirm } from "primevue/useconfirm"
	import { useToast } from "primevue/usetoast"

import type { Pageable } from "@/models/paging"
import type { AppointmentProviderType, Permission, Role } from "@/models/reference"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import { Status } from "@/utils/global.type"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { accessMatrixService } from "@/features/staff/api/access-matrix.service"
import { accessMatrixTanstackService } from "@/features/staff/queries/access-matrix.tanstack.service"
import { DASHBOARD_WIDGET_PERMISSIONS } from "@/shared/permissions"

type ProviderScope = "ALL" | "ADMIN" | "PT"

type RoleFormState = {
  name: string
  appointment_provider_type: AppointmentProviderType
  requires_specialty_tag: boolean
}

type SidebarAccessKey =
  | "dashboard"
  | "patients"
  | "appointments"
  | "patient-daily-log"
  | "billing"
  | "reports"
  | "offers-promotions"
  | "settings"
  | "clinics"
  | "staffs"

type SidebarAccessOption = {
  key: SidebarAccessKey
  label: string
  description: string
  matcher: (permission: Permission) => boolean
}

type PermissionLevel = "read" | "edit"
type PermissionLevelKey = "patients" | "appointments" | "billing" | "offers-promotions"

const emit = defineEmits<{
  (e: "rolesUpdated"): void
}>()

const props = withDefaults(defineProps<{
  providerScope?: ProviderScope
  dialogTitle?: string
}>(), {
  providerScope: "ALL",
  dialogTitle: "Job Titles and Permissions"
})

	const toast = useToast()
	const confirm = useConfirm()
const queryClient = useQueryClient()
const authSession = useAuthSessionStore()
const { roleName, isOwnerEquivalent } = storeToRefs(authSession)

const visible = ref(false)
const roles = ref<Role[]>([])
const selectedRoleId = ref<number | null>(null)
const assignedPermissions = ref<Permission[]>([])
const availablePermissions = ref<Permission[]>([])
const selectedSidebarAccess = ref<SidebarAccessKey[]>([])
const advancedOpenTabs = ref<SidebarAccessKey[]>([])
const advancedRulesByTab = ref<Partial<Record<SidebarAccessKey, number[]>>>({})
const permissionLevelByTab = ref<Partial<Record<PermissionLevelKey, PermissionLevel>>>({})
const statusFilter = ref<Status>(Status.ALL)
const isRoleLoading = ref(false)
const isPermissionLoading = ref(false)
const isSavingRole = ref(false)
const isPermissionSaving = ref(false)
const createAsOwnerEquivalent = ref(false)

const roleForm = ref<RoleFormState>({
  name: "",
  appointment_provider_type: "NONE",
  requires_specialty_tag: false
})

const providerTypeOptions: Array<{ label: string; value: AppointmentProviderType }> = [
  { label: "Not used in appointments", value: "NONE" },
  { label: "Doctor Consultant", value: "DOCTOR_CONSULTANT" },
  { label: "Physical Therapist", value: "PHYSICAL_THERAPIST" },
  { label: "PT Assistant", value: "PT_ASSISTANT" },
  { label: "Intern", value: "INTERN" }
]

const roleMatchesScope = (providerType: AppointmentProviderType): boolean => {
  if (props.providerScope === "PT") {
    return providerType === "DOCTOR_CONSULTANT" || providerType === "PHYSICAL_THERAPIST" || providerType === "PT_ASSISTANT" || providerType === "INTERN"
  }
  if (props.providerScope === "ADMIN") {
    return providerType === "NONE"
  }
  return true
}

const filteredProviderTypeOptions = computed(() =>
  providerTypeOptions.filter(option => roleMatchesScope(option.value))
)

const dialogTitleResolved = computed(() => props.dialogTitle)
const statusFilterOptions = [
  { label: "All", value: Status.ALL },
  { label: "Active", value: Status.ACTIVE },
  { label: "Inactive", value: Status.INACTIVE }
]
const permissionLevelOptions: Array<{ label: string; value: PermissionLevel }> = [
  { label: "Read Only", value: "read" },
  { label: "Can Edit", value: "edit" }
]

const startsWithAny = (permissionName: string, prefixes: string[]): boolean =>
  prefixes.some(prefix => permissionName.startsWith(prefix))

const sidebarAccessOptions: SidebarAccessOption[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Overview and snapshot cards.",
    // Unique: Dashboard::* is only used by this tab
    matcher: permission => permission.name.startsWith("Dashboard::")
  },
  {
    key: "patients",
    label: "Patient",
    description: "Open and manage patient records.",
    matcher: permission =>
      startsWithAny(permission.name, [
        "Patient::READ",
        "Patient::LOOKUP",
        "Patient::CREATE",
        "Patient::UPDATE",
        "Patient::DELETE",
        "Patient::MANAGE_APPOINTMENTS",
        "Patient::MANAGE_ATTACHMENTS",
        "Patient::MANAGE_MEDICAL_INFORMATION"
      ])
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Calendar, scheduling, and in-page workflow actions.",
    matcher: permission =>
      startsWithAny(permission.name, [
        "Appointment::READ",
        "Appointment::LOOKUP",
        "Appointment::CREATE",
        "Appointment::UPDATE",
        "Appointment::DELETE",
        "Appointment::MANAGE_STATUS",
        "Appointment::OVERRIDE_RESCHEDULE_LIMIT",
        "Appointment::MANAGE_BILL",
        "Patient::CREATE"
      ])
  },
  {
    key: "patient-daily-log",
    label: "Patient Daily Log",
    description: "Daily appointment and patient tracking view.",
    // Read-only appointment access — subset of appointments tab
    // Priority rule in syncSidebarAccessSelection prevents overlap with appointments
    matcher: permission => permission.name === "Appointment::READ" || permission.name === "Appointment::LOOKUP"
  },
  {
    key: "billing",
    label: "Billing",
    description: "Open the billing workspace and bill-specific workflows.",
    matcher: permission =>
      permission.name.startsWith("CashBill::") ||
      permission.name.startsWith("HMOBill::")
  },
  {
    key: "reports",
    label: "Finance & Reports",
    description: "View closeout and financial reports.",
    // Read-only access across appointments and patients for reporting
    // Priority rule prevents overlap when patients or appointments tabs are enabled
    matcher: permission => permission.name === "Appointment::READ" || permission.name === "Patient::READ"
  },
  {
    key: "offers-promotions",
    label: "Offers & Promotions",
    description: "All offers, coverage, and promotional workspaces.",
    // Unique: Reference::* is only used by this tab (settings now uses only AccessMatrix)
    matcher: permission => startsWithAny(permission.name, ["Reference::LOOKUP", "Reference::READ", "Reference::UPDATE", "Reference::CREATE"])
  },
  {
    key: "settings",
    label: "PT Team Setup",
    description: "Branch setup, specialties, and PT role access setup.",
    // Unique: AccessMatrix::* is exclusively for settings — Clinic/Staff/Reference now belong to their own tabs
    matcher: permission => permission.name.startsWith("AccessMatrix::")
  },
  {
    key: "clinics",
    label: "Clinic",
    description: "Clinic setup and treatment areas.",
    // Unique: Clinic::* only belongs to this tab
    matcher: permission => permission.name.startsWith("Clinic::")
  },
  {
    key: "staffs",
    label: "Admin Setup",
    description: "Admin staff directory and account maintenance.",
    // Unique: Staff::* only belongs to this tab
    matcher: permission => permission.name.startsWith("Staff::")
  }
]

const PT_SIDEBAR_KEYS = new Set<SidebarAccessKey>(["dashboard", "patients", "appointments", "patient-daily-log"])

const visibleSidebarAccessOptions = computed<SidebarAccessOption[]>(() => {
  if (props.providerScope !== "PT") return sidebarAccessOptions
  return sidebarAccessOptions.filter(option => PT_SIDEBAR_KEYS.has(option.key))
})

const selectedRole = computed(() => roles.value.find(role => role.id === selectedRoleId.value))
const isCreateMode = computed(() => selectedRoleId.value == null)
const canGrantOwnerEquivalentAccess = computed(() =>
  roleName.value === "Owner" || isOwnerEquivalent.value
)
const canCreateOwnerEquivalent = computed(() => props.providerScope === "ADMIN" && canGrantOwnerEquivalentAccess.value)
const isSelectedRoleLocked = computed(() => selectedRole.value?.name === "Owner")
const isSpecialtyToggleDisabled = computed(() =>
  roleForm.value.appointment_provider_type === "NONE" || isSelectedRoleLocked.value
)
const isBusy = computed(() =>
  isRoleLoading.value || isPermissionLoading.value || isSavingRole.value || isPermissionSaving.value
)

const allRolePermissions = computed(() => {
  const uniqueById = new Map<number, Permission>()
  for (const permission of [...assignedPermissions.value, ...availablePermissions.value]) {
    uniqueById.set(permission.id, permission)
  }
  return Array.from(uniqueById.values())
})

const managedPermissionIds = computed(() => {
  const ids = new Set<number>()
  for (const option of sidebarAccessOptions) {
    for (const permission of allRolePermissions.value) {
      if (option.matcher(permission)) ids.add(permission.id)
    }
  }
  return ids
})
const filteredRoles = computed(() => {
  return roles.value.filter(role => {
    if (!roleMatchesScope(role.appointment_provider_type)) return false
    if (statusFilter.value === Status.ACTIVE) return role.is_active
    if (statusFilter.value === Status.INACTIVE) return !role.is_active
    return true
  })
})

const assignedPermissionIdSet = computed(() => new Set(assignedPermissions.value.map(permission => permission.id)))

const getPermissionsForSidebarAccess = (key: SidebarAccessKey): Permission[] => {
  const option = sidebarAccessOptions.find(entry => entry.key === key)
  if (!option) return []
  return allRolePermissions.value.filter(permission => option.matcher(permission))
}

const mappedPermissionCount = (key: SidebarAccessKey): number => getPermissionsForSidebarAccess(key).length
const hasMappedPermissions = (key: SidebarAccessKey): boolean => mappedPermissionCount(key) > 0

const getMappedPermissionIds = (key: SidebarAccessKey): number[] =>
  getPermissionsForSidebarAccess(key).map(permission => permission.id)

const permissionLevelKeys: PermissionLevelKey[] = ["patients", "appointments", "billing", "offers-promotions"]

const isPermissionLevelSupported = (key: SidebarAccessKey): key is PermissionLevelKey =>
  permissionLevelKeys.includes(key as PermissionLevelKey)

const getPermissionLevel = (key: SidebarAccessKey): PermissionLevel => {
  if (!isPermissionLevelSupported(key)) return "edit"
  return permissionLevelByTab.value[key] ?? "edit"
}

const getPermissionIdsByNames = (key: SidebarAccessKey, names: string[]): number[] => {
  const targets = new Set(names)
  return getPermissionsForSidebarAccess(key)
    .filter(permission => targets.has(permission.name))
    .map(permission => permission.id)
}

const getPermissionIdsByPrefix = (key: SidebarAccessKey, prefixes: string[]): number[] =>
  getPermissionsForSidebarAccess(key)
    .filter(permission => prefixes.some(prefix => permission.name.startsWith(prefix)))
    .map(permission => permission.id)

const getReadPermissionIdsForTab = (key: PermissionLevelKey): number[] => {
  if (key === "offers-promotions") {
    return getPermissionIdsByNames(key, ["Reference::LOOKUP", "Reference::READ"])
  }

  if (key === "patients") {
    return getPermissionIdsByNames(key, ["Patient::READ", "Patient::LOOKUP"])
  }

  if (key === "appointments") {
    return getPermissionIdsByNames(key, ["Appointment::READ", "Appointment::LOOKUP"])
  }

  return getPermissionIdsByNames(key, [
    "CashBill::READ",
    "CashBill::LOOKUP",
    "HMOBill::READ",
    "HMOBill::LOOKUP"
  ])
}

const getEditPermissionIdsForTab = (key: PermissionLevelKey): number[] => {
  if (key === "offers-promotions") {
    return [
      ...getReadPermissionIdsForTab(key),
      ...getPermissionIdsByNames(key, ["Reference::CREATE", "Reference::UPDATE"])
    ]
  }

  if (key === "patients") {
    return [
      ...getReadPermissionIdsForTab(key),
      ...getPermissionIdsByNames(key, ["Patient::CREATE", "Patient::UPDATE", "Patient::DELETE"])
    ]
  }

  if (key === "appointments") {
    return [
      ...getReadPermissionIdsForTab(key),
      ...getPermissionIdsByNames(key, [
        "Appointment::CREATE",
        "Appointment::UPDATE",
        "Appointment::DELETE",
        "Appointment::MANAGE_STATUS",
        "Appointment::OVERRIDE_RESCHEDULE_LIMIT",
        "Appointment::MANAGE_BILL",
        "Patient::CREATE"
      ])
    ]
  }

  return [
    ...getReadPermissionIdsForTab(key),
    ...getPermissionIdsByPrefix(key, ["CashBill::", "HMOBill::"])
  ]
}

const applyPermissionLevelToAdvancedRules = (key: PermissionLevelKey, level: PermissionLevel): void => {
  const ids = level === "read" ? getReadPermissionIdsForTab(key) : getEditPermissionIdsForTab(key)
  setAdvancedRules(key, ids)
}

const setPermissionLevel = (key: SidebarAccessKey, level: PermissionLevel): void => {
  if (!isPermissionLevelSupported(key)) return
  permissionLevelByTab.value = {
    ...permissionLevelByTab.value,
    [key]: level
  }
  applyPermissionLevelToAdvancedRules(key, level)
}

const setDefaultRulesForTab = (key: SidebarAccessKey): void => {
  if (isPermissionLevelSupported(key)) {
    applyPermissionLevelToAdvancedRules(key, getPermissionLevel(key))
    return
  }
  setAdvancedRules(key, getMappedPermissionIds(key))
}

const isAdvancedOpen = (key: SidebarAccessKey): boolean => advancedOpenTabs.value.includes(key)

const toggleAdvanced = (key: SidebarAccessKey): void => {
  if (!hasMappedPermissions(key)) return

  if (isAdvancedOpen(key)) {
    advancedOpenTabs.value = advancedOpenTabs.value.filter(entry => entry !== key)
    return
  }

  advancedOpenTabs.value = [...advancedOpenTabs.value, key]
}

const setAdvancedRules = (key: SidebarAccessKey, permissionIds: number[]): void => {
  const mapped = new Set(getMappedPermissionIds(key))
  advancedRulesByTab.value = {
    ...advancedRulesByTab.value,
    [key]: permissionIds.filter(id => mapped.has(id))
  }
}

const isAdvancedRuleChecked = (key: SidebarAccessKey, permissionId: number): boolean => {
  const selected = advancedRulesByTab.value[key] ?? []
  return selected.includes(permissionId)
}

const toggleAdvancedRule = (key: SidebarAccessKey, permissionId: number): void => {
  const selected = advancedRulesByTab.value[key] ?? []
  if (selected.includes(permissionId)) {
    setAdvancedRules(key, selected.filter(id => id !== permissionId))
    return
  }

  setAdvancedRules(key, [...selected, permissionId])
}

const selectAllAdvancedRules = (key: SidebarAccessKey): void => {
  setAdvancedRules(key, getMappedPermissionIds(key))
}

const clearAdvancedRules = (key: SidebarAccessKey): void => {
  setAdvancedRules(key, [])
}

const getEffectivePermissionIdsForSidebarAccess = (key: SidebarAccessKey): number[] => {
  const mappedIds = getMappedPermissionIds(key)
  const selectedIds = advancedRulesByTab.value[key] ?? []
  const mappedSet = new Set(mappedIds)
  return selectedIds.filter(id => mappedSet.has(id))
}

const ensureDashboardReadPermission = (selectedPermissionIds: Set<number>): void => {
  const dashboardReadPermission = getPermissionsForSidebarAccess("dashboard").find(permission => permission.name === "Dashboard::READ")
  if (!dashboardReadPermission) return

  const selectedDashboardWidgetPermissions = getPermissionsForSidebarAccess("dashboard")
    .filter(permission => DASHBOARD_WIDGET_PERMISSIONS.includes(permission.name as typeof DASHBOARD_WIDGET_PERMISSIONS[number]))
    .some(permission => selectedPermissionIds.has(permission.id))

  if (selectedDashboardWidgetPermissions) {
    selectedPermissionIds.add(dashboardReadPermission.id)
  }
}

const syncAdvancedRulesSelection = (): void => {
  const assignedIds = assignedPermissionIdSet.value
  const next: Partial<Record<SidebarAccessKey, number[]>> = {}

  for (const option of sidebarAccessOptions) {
    const mappedIds = getMappedPermissionIds(option.key)
    const assignedMapped = mappedIds.filter(id => assignedIds.has(id))
    next[option.key] = assignedMapped
  }

  advancedRulesByTab.value = next
}

const syncPermissionLevelsSelection = (): void => {
  const assignedIds = assignedPermissionIdSet.value
  const next: Partial<Record<PermissionLevelKey, PermissionLevel>> = {}

  for (const key of permissionLevelKeys) {
    const editIds = new Set(getEditPermissionIdsForTab(key))
    const readIds = new Set(getReadPermissionIdsForTab(key))

    const hasAnyRead = Array.from(readIds).some(id => assignedIds.has(id))
    const hasAnyEditOnly = Array.from(editIds).some(id => assignedIds.has(id) && !readIds.has(id))

    next[key] = hasAnyEditOnly || !hasAnyRead ? "edit" : "read"
  }

  permissionLevelByTab.value = next
}

const syncSidebarAccessSelection = (): void => {
  const assignedIds = assignedPermissionIdSet.value

  const hasMatchingAssigned = (matcher: (p: Permission) => boolean): boolean =>
    allRolePermissions.value.some(p => matcher(p) && assignedIds.has(p.id))

  // These are the "exclusive" write/lookup permissions that uniquely identify
  // whether a tab was intentionally enabled vs being a read-only side effect.
  const hasAppointmentWriteAssigned = hasMatchingAssigned(
    p => p.name === "Appointment::CREATE" || p.name === "Appointment::UPDATE"
  )
  const hasAppointmentWorkflowAssigned = hasMatchingAssigned(
    p =>
      p.name === "Appointment::CREATE" ||
      p.name === "Appointment::UPDATE" ||
      p.name === "Appointment::DELETE" ||
      p.name === "Appointment::MANAGE_STATUS" ||
      p.name === "Appointment::OVERRIDE_RESCHEDULE_LIMIT" ||
      p.name === "Appointment::MANAGE_BILL"
  )
  const hasExclusivePatientAssigned = hasMatchingAssigned(
    p => p.name === "Patient::LOOKUP" || p.name === "Patient::READ" || p.name === "Patient::UPDATE"
  )
  const hasPatientPageAssigned = hasMatchingAssigned(
    p => p.name === "Patient::LOOKUP" || p.name === "Patient::READ" || p.name === "Patient::UPDATE" || p.name === "Patient::DELETE"
  )

  selectedSidebarAccess.value = sidebarAccessOptions
    .filter(option => {
      const hasAny = getPermissionsForSidebarAccess(option.key).some(p => assignedIds.has(p.id))
      if (!hasAny) return false

      switch (option.key) {
        case "patients":
          return hasPatientPageAssigned

        // appointments: only if write perms are assigned (CREATE or UPDATE).
        // If only READ/LOOKUP assigned → patient-daily-log gets credit instead.
        case "appointments":
          return hasAppointmentWorkflowAssigned

        // patient-daily-log: only if READ/LOOKUP assigned but no write perms.
        // When appointments (write) is enabled, it already grants READ/LOOKUP access.
        case "patient-daily-log":
          return !hasAppointmentWriteAssigned

        // reports: only if read-only permissions are the cause — not a side effect of
        // patients (write/lookup) or appointments (write) being enabled.
        case "reports":
          return !hasAppointmentWriteAssigned && !hasExclusivePatientAssigned

        // All other tabs are independent (unique permission sets) — show if any assigned.
        default:
          return true
      }
    })
    .map(option => option.key)
}

const toggleSidebarAccess = (key: SidebarAccessKey): void => {
  if (!hasMappedPermissions(key)) return
  if (selectedSidebarAccess.value.includes(key)) {
    selectedSidebarAccess.value = selectedSidebarAccess.value.filter(entry => entry !== key)
    // Clear advanced rules when unchecking main sidebar tab
    setAdvancedRules(key, [])
    return
  }
  selectedSidebarAccess.value = [...selectedSidebarAccess.value, key]
  setDefaultRulesForTab(key)
}

const selectAllSidebarTabs = (): void => {
  selectedSidebarAccess.value = visibleSidebarAccessOptions.value
    .filter(option => hasMappedPermissions(option.key))
    .map(option => option.key)

  for (const key of selectedSidebarAccess.value) {
    setDefaultRulesForTab(key)
  }
}

const clearAllSidebarTabs = (): void => {
  selectedSidebarAccess.value = []
}

const applyPhysicalTherapistDefaults = (): void => {
  const defaults: SidebarAccessKey[] = ["dashboard", "patients", "appointments", "patient-daily-log"]
  selectedSidebarAccess.value = defaults.filter(key => hasMappedPermissions(key))
  for (const key of selectedSidebarAccess.value) {
    setDefaultRulesForTab(key)
  }
}

function formatProviderType(providerType: AppointmentProviderType): string {
  if (providerType === "DOCTOR_CONSULTANT") return "Doctor Consultant"
  if (providerType === "PHYSICAL_THERAPIST") return "Physical Therapist"
  if (providerType === "PT_ASSISTANT") return "PT Assistant"
  if (providerType === "INTERN") return "Intern"
  return "Not used in appointments"
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Reference and Access Matrix permissions in Role Access",
    invalidInputHint: "Some role or permission values are invalid. Review inputs and try again.",
    retryHint: "Please try again."
  })
}

function applyRoleToForm(role?: Role): void {
  roleForm.value = role
    ? {
        name: role.name,
        appointment_provider_type: role.appointment_provider_type,
        requires_specialty_tag: role.requires_specialty_tag
      }
    : {
        name: "",
        appointment_provider_type: filteredProviderTypeOptions.value[0]?.value ?? "NONE",
        requires_specialty_tag: false
      }
}

async function fetchRoles(preferredRoleId?: number | null): Promise<void> {
  isRoleLoading.value = true
  try {
    const roleScopeParam = props.providerScope === "ALL" ? undefined : props.providerScope
    const { data } = await pamsAPI.get<Pageable<Role>>("/references/roles", {
      params: { page: 1, size: 500, status: "ALL", ...(roleScopeParam ? { role_scope: roleScopeParam } : {}) }
    })

    roles.value = data?.content ?? []
    const scopedRoles = roles.value.filter(role => roleMatchesScope(role.appointment_provider_type))
    const nextRole =
      scopedRoles.find(role => role.id === preferredRoleId) ??
      scopedRoles.find(role => role.id === selectedRoleId.value) ??
      scopedRoles[0]

    if (nextRole) {
      await selectRole(nextRole)
      return
    }

    startCreateRole()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to load job titles"))
  } finally {
    isRoleLoading.value = false
  }
}

async function toggleRoleStatus(): Promise<void> {
  if (!selectedRoleId.value || isSelectedRoleLocked.value) return

  isSavingRole.value = true
  try {
    await pamsAPI.patch(`/references/roles/${selectedRoleId.value}/status`)
    successToast(toast, selectedRole.value?.is_active ? "Job title deactivated" : "Job title activated")
    emit("rolesUpdated")
    await fetchRoles(selectedRoleId.value)
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to update job title status"))
  } finally {
    isSavingRole.value = false
  }
}

async function fetchPermissions(roleId: number): Promise<void> {
  isPermissionLoading.value = true
  assignedPermissions.value = []
  availablePermissions.value = []
  selectedSidebarAccess.value = []
  advancedOpenTabs.value = []
  advancedRulesByTab.value = {}
  permissionLevelByTab.value = {}

  try {
    const [assigned, unassigned] = await Promise.all([
      accessMatrixTanstackService.fetchAssignedPermissions(queryClient, roleId),
      accessMatrixTanstackService.fetchUnassignedPermissions(queryClient, roleId)
    ])

    assignedPermissions.value = assigned.content ?? []
    availablePermissions.value = unassigned.content ?? []
    syncAdvancedRulesSelection()
    syncPermissionLevelsSelection()
    syncSidebarAccessSelection()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to load permissions"))
  } finally {
    isPermissionLoading.value = false
  }
}

async function refreshCurrentAuthSnapshot(): Promise<void> {
  try {
    await authSession.refresh()
    window.dispatchEvent(new CustomEvent("auth-user-updated"))
  } catch {
    // Ignore refresh errors; access changes were already saved.
  }
}

async function grantOwnerEquivalentPermissionsToRole(targetRoleId: number): Promise<void> {
  await accessMatrixService.grantOwnerEquivalent(targetRoleId)
  await accessMatrixTanstackService.invalidateRole(queryClient, targetRoleId)
}

async function selectRole(role: Role): Promise<void> {
  selectedRoleId.value = role.id
  applyRoleToForm(role)
  await fetchPermissions(role.id)
}

function startCreateRole(): void {
  selectedRoleId.value = null
  createAsOwnerEquivalent.value = false
  assignedPermissions.value = []
  availablePermissions.value = []
  selectedSidebarAccess.value = []
  advancedOpenTabs.value = []
  advancedRulesByTab.value = {}
  permissionLevelByTab.value = {
    patients: "edit",
    appointments: "edit",
    billing: "edit",
    "offers-promotions": "edit"
  }
  applyRoleToForm()

  if (props.providerScope === "PT") {
    applyPhysicalTherapistDefaults()
  }
}

function resetRoleForm(): void {
  if (selectedRole.value) {
    applyRoleToForm(selectedRole.value)
    return
  }

  createAsOwnerEquivalent.value = false
  applyRoleToForm()
}

	async function grantOwnerEquivalentAccess(): Promise<void> {
	  const roleId = selectedRoleId.value
	  if (!roleId || isCreateMode.value || isSelectedRoleLocked.value) return

	  confirm.require({
	    message: `Grant ${selectedRole.value?.name ?? "this role"} the same permissions as Owner?`,
	    header: "Owner-Equivalent Access",
	    icon: "pi pi-exclamation-triangle",
	    rejectProps: {
	      label: "Cancel",
	      severity: "secondary",
	      outlined: true,
	      loading: isBusy.value
	    },
	    acceptProps: {
	      label: "Grant Access",
	      severity: "info",
	      icon: "pi pi-check",
	      loading: isBusy.value
	    },
	    accept: async () => {
	      isPermissionSaving.value = true
	      try {
	        await grantOwnerEquivalentPermissionsToRole(roleId)
          await refreshCurrentAuthSnapshot()
	        successToast(toast, "Owner-equivalent access applied")
	        await fetchPermissions(roleId)
	        emit("rolesUpdated")
	      } catch (error: unknown) {
	        errorToast(toast, extractApiErrorMessage(error, "Failed to grant Owner-equivalent access"))
	      } finally {
	        isPermissionSaving.value = false
	      }
	    }
	  })
	}

	async function saveRole(): Promise<void> {
	  const name = roleForm.value.name.trim()
	  if (!name) {
	    errorToast(toast, "Job title name is required")
	    return
	  }

  const wasCreating = isCreateMode.value
  const shouldCreateOwnerEquivalent = wasCreating && canCreateOwnerEquivalent.value && createAsOwnerEquivalent.value

  const payload = {
    name,
    appointment_provider_type: roleForm.value.appointment_provider_type,
    requires_specialty_tag:
      roleForm.value.appointment_provider_type === "NONE" ? false : roleForm.value.requires_specialty_tag
  }

  isSavingRole.value = true
  try {
    if (isCreateMode.value) {
      await pamsAPI.post("/references/roles", payload)
      successToast(toast, "Job title created")
    } else if (selectedRoleId.value) {
      await pamsAPI.put(`/references/roles/${selectedRoleId.value}`, payload)
      successToast(toast, "Job title updated")
    }

    await fetchRoles(selectedRoleId.value)
    if (wasCreating) {
      const createdRole = roles.value.find(role => role.name.toLowerCase() === name.toLowerCase())
      if (createdRole) {
        if (shouldCreateOwnerEquivalent) {
          await grantOwnerEquivalentPermissionsToRole(createdRole.id)
          await refreshCurrentAuthSnapshot()
          successToast(toast, "Owner-equivalent access applied")
          createAsOwnerEquivalent.value = false
          await fetchRoles(createdRole.id)
        }
        await selectRole(createdRole)
      }
    }

    emit("rolesUpdated")
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to save job title"))
  } finally {
    isSavingRole.value = false
  }
}

async function refreshPermissions(): Promise<void> {
  if (!selectedRoleId.value) return
  await fetchPermissions(selectedRoleId.value)
}

async function saveSidebarAccess(): Promise<void> {
  if (!selectedRoleId.value || isCreateMode.value || isSelectedRoleLocked.value) return

  const selectedKeys = new Set(selectedSidebarAccess.value)
  const assignedIds = assignedPermissionIdSet.value

  const selectedPermissionIds = new Set<number>()
  for (const option of sidebarAccessOptions) {
    if (!selectedKeys.has(option.key)) continue
    for (const permissionId of getEffectivePermissionIdsForSidebarAccess(option.key)) {
      selectedPermissionIds.add(permissionId)
    }
  }

  if (selectedKeys.has("dashboard")) {
    ensureDashboardReadPermission(selectedPermissionIds)
  }

  const selectedTabsWithoutRules = sidebarAccessOptions
    .filter(option => selectedKeys.has(option.key))
    .filter(option => getEffectivePermissionIdsForSidebarAccess(option.key).length === 0)

  if (selectedTabsWithoutRules.length) {
    errorToast(
      toast,
      `Select at least one advanced permission rule for: ${selectedTabsWithoutRules.map(option => option.label).join(", ")}`
    )
    return
  }

  const toGrant: number[] = []
  const toRevoke: number[] = []

  for (const permissionId of managedPermissionIds.value) {
    const shouldHave = selectedPermissionIds.has(permissionId)
    const hasNow = assignedIds.has(permissionId)

    if (shouldHave && !hasNow) toGrant.push(permissionId)
    if (!shouldHave && hasNow) toRevoke.push(permissionId)
  }

  if (!toGrant.length && !toRevoke.length) {
    successToast(toast, "Sidebar access is already up to date")
    return
  }

  isPermissionSaving.value = true
  try {
    await accessMatrixService.applyPermissionChanges(selectedRoleId.value, {
      grant_permission_ids: toGrant,
      revoke_permission_ids: toRevoke,
    })
    await accessMatrixTanstackService.invalidateRole(queryClient, selectedRoleId.value)

    await refreshCurrentAuthSnapshot()

    successToast(toast, "Sidebar access updated")
    await refreshPermissions()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to update sidebar access"))
  } finally {
    isPermissionSaving.value = false
  }
}

async function open(): Promise<void> {
  visible.value = true
  await authSession.ensureLoaded()
  await fetchRoles(selectedRoleId.value)
}

defineExpose({ open })
</script>
