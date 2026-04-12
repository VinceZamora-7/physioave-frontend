<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Job Titles and Permissions"
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

          <Message v-if="isSelectedRoleLocked" severity="warn" :closable="false" class="mt-4">
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
                :options="providerTypeOptions"
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

          <div class="mt-4 flex flex-wrap justify-end gap-2">
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

          <Message v-if="isCreateMode" severity="info" :closable="false" class="mt-4">
            Save this job title first, then set its sidebar access.
          </Message>
          <Message v-else-if="isSelectedRoleLocked" severity="warn" :closable="false" class="mt-4">
            The Owner job title permissions are locked here to keep the top-level account safe.
          </Message>

          <div v-else class="mt-4 space-y-4">
            <div class="flex flex-wrap gap-2">
              <Button
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
                v-for="option in sidebarAccessOptions"
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
import axios from "axios"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import SelectButton from "primevue/selectbutton"
import Tag from "primevue/tag"
import { useToast } from "primevue/usetoast"

import type { Pageable } from "@/models/paging"
import type { AppointmentProviderType, Permission, Role } from "@/models/reference"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast } from "@/utils/toast.util"
import { Status } from "@/utils/global.type"

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
  | "promos-offers"
  | "promos-offers-single-service"
  | "promos-offers-package-service"
  | "promos-offers-hmo"
  | "promos-offers-lgu"
  | "settings"
  | "clinics"
  | "staffs"

type SidebarAccessOption = {
  key: SidebarAccessKey
  label: string
  description: string
  matcher: (permission: Permission) => boolean
}

const emit = defineEmits<{
  (e: "rolesUpdated"): void
}>()

const toast = useToast()

const visible = ref(false)
const roles = ref<Role[]>([])
const selectedRoleId = ref<number | null>(null)
const assignedPermissions = ref<Permission[]>([])
const availablePermissions = ref<Permission[]>([])
const selectedSidebarAccess = ref<SidebarAccessKey[]>([])
const advancedOpenTabs = ref<SidebarAccessKey[]>([])
const advancedRulesByTab = ref<Partial<Record<SidebarAccessKey, number[]>>>({})
const statusFilter = ref<Status>(Status.ALL)
const isRoleLoading = ref(false)
const isPermissionLoading = ref(false)
const isSavingRole = ref(false)
const isPermissionSaving = ref(false)

const roleForm = ref<RoleFormState>({
  name: "",
  appointment_provider_type: "NONE",
  requires_specialty_tag: false
})

const providerTypeOptions: Array<{ label: string; value: AppointmentProviderType }> = [
  { label: "Not used in appointments", value: "NONE" },
  { label: "Doctor Consultant", value: "DOCTOR_CONSULTANT" },
  { label: "Physical Therapist", value: "PHYSICAL_THERAPIST" },
  { label: "PT Assistant / Intern", value: "PT_ASSISTANT" }
]
const statusFilterOptions = [
  { label: "All", value: Status.ALL },
  { label: "Active", value: Status.ACTIVE },
  { label: "Inactive", value: Status.INACTIVE }
]

const startsWithAny = (permissionName: string, prefixes: string[]): boolean =>
  prefixes.some(prefix => permissionName.startsWith(prefix))

const sidebarAccessOptions: SidebarAccessOption[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Overview and snapshot cards.",
    matcher: permission => startsWithAny(permission.name, ["Appointment::READ", "Patient::READ", "Billing::READ"])
  },
  {
    key: "patients",
    label: "Patient",
    description: "Open and manage patient records.",
    matcher: permission => permission.name.startsWith("Patient::")
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Calendar, scheduling, and appointment actions.",
    matcher: permission => permission.name.startsWith("Appointment::")
  },
  {
    key: "patient-daily-log",
    label: "Patient Daily Log",
    description: "Daily appointment and patient tracking view.",
    matcher: permission => startsWithAny(permission.name, ["Appointment::READ", "Appointment::LOOKUP", "Patient::READ", "Patient::LOOKUP"])
  },
  {
    key: "billing",
    label: "Billing",
    description: "Payment and billing workflows.",
    matcher: permission => startsWithAny(permission.name, ["Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"])
  },
  {
    key: "reports",
    label: "Finance & Reports",
    description: "View closeout and financial reports.",
    matcher: permission => startsWithAny(permission.name, ["Appointment::READ", "Patient::READ", "Patient::MANAGE_BILLS", "Appointment::MANAGE_BILL"])
  },
  {
    key: "promos-offers",
    label: "Offers Overview",
    description: "Open offers and coverage workspaces.",
    matcher: permission => startsWithAny(permission.name, ["Reference::LOOKUP", "Reference::READ", "Reference::UPDATE", "Reference::CREATE"])
  },
  {
    key: "promos-offers-single-service",
    label: "Single Pay: Single Service",
    description: "Single service catalog workspace.",
    matcher: permission => startsWithAny(permission.name, ["Reference::LOOKUP", "Reference::READ", "Reference::UPDATE", "Reference::CREATE"])
  },
  {
    key: "promos-offers-package-service",
    label: "Self-Pay: Package Service",
    description: "Package service workspace.",
    matcher: permission => startsWithAny(permission.name, ["Reference::LOOKUP", "Reference::READ", "Reference::UPDATE", "Reference::CREATE"])
  },
  {
    key: "promos-offers-hmo",
    label: "HMO",
    description: "HMO workspace and negotiated service rates.",
    matcher: permission => startsWithAny(permission.name, ["Reference::LOOKUP", "Reference::READ", "Reference::UPDATE", "Reference::CREATE"])
  },
  {
    key: "promos-offers-lgu",
    label: "LGU",
    description: "LGU budget and service workspace.",
    matcher: permission => startsWithAny(permission.name, ["Reference::LOOKUP", "Reference::READ", "Reference::UPDATE", "Reference::CREATE"])
  },
  {
    key: "settings",
    label: "Settings",
    description: "Branch setup, specialties, and role access setup.",
    matcher: permission => startsWithAny(permission.name, ["Clinic::", "Staff::", "Reference::", "AccessMatrix::"])
  },
  {
    key: "clinics",
    label: "Clinic",
    description: "Clinic setup and treatment areas.",
    matcher: permission => permission.name.startsWith("Clinic::")
  },
  {
    key: "staffs",
    label: "Staff",
    description: "Staff directory and account maintenance.",
    matcher: permission => permission.name.startsWith("Staff::")
  }
]

const selectedRole = computed(() => roles.value.find(role => role.id === selectedRoleId.value))
const isCreateMode = computed(() => selectedRoleId.value == null)
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

const syncSidebarAccessSelection = (): void => {
  selectedSidebarAccess.value = sidebarAccessOptions
    .filter(option => getPermissionsForSidebarAccess(option.key).some(permission => assignedPermissionIdSet.value.has(permission.id)))
    .map(option => option.key)
}

const toggleSidebarAccess = (key: SidebarAccessKey): void => {
  if (!hasMappedPermissions(key)) return
  if (selectedSidebarAccess.value.includes(key)) {
    selectedSidebarAccess.value = selectedSidebarAccess.value.filter(entry => entry !== key)
    return
  }
  selectedSidebarAccess.value = [...selectedSidebarAccess.value, key]
}

const selectAllSidebarTabs = (): void => {
  selectedSidebarAccess.value = sidebarAccessOptions
    .filter(option => hasMappedPermissions(option.key))
    .map(option => option.key)
}

const clearAllSidebarTabs = (): void => {
  selectedSidebarAccess.value = []
}

const applyPhysicalTherapistDefaults = (): void => {
  const defaults: SidebarAccessKey[] = ["patients", "appointments", "patient-daily-log"]
  selectedSidebarAccess.value = defaults.filter(key => hasMappedPermissions(key))
}

function formatProviderType(providerType: AppointmentProviderType): string {
  if (providerType === "DOCTOR_CONSULTANT") return "Doctor Consultant"
  if (providerType === "PHYSICAL_THERAPIST") return "Physical Therapist"
  if (providerType === "PT_ASSISTANT") return "PT Assistant / Intern"
  return "Not used in appointments"
}

function getPermissionTitle(permission: Permission): string {
  return permission.description?.trim() || permission.name
}

function getPermissionSubtitle(permission: Permission): string {
  return permission.description?.trim() ? `System code: ${permission.name}` : "System permission"
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.message || error.response?.data?.detail || error.message
    return detail ? `${fallback}: ${detail}` : fallback
  }
  return error instanceof Error && error.message ? `${fallback}: ${error.message}` : fallback
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
        appointment_provider_type: "NONE",
        requires_specialty_tag: false
      }
}

async function fetchRoles(preferredRoleId?: number | null): Promise<void> {
  isRoleLoading.value = true
  try {
    const { data } = await pamsAPI.get<Pageable<Role>>("/references/roles", {
      params: { page: 1, size: 500, status: "ALL" }
    })

    roles.value = data?.content ?? []
    const nextRole =
      roles.value.find(role => role.id === preferredRoleId) ??
      roles.value.find(role => role.id === selectedRoleId.value) ??
      roles.value[0]

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

  try {
    const params = { role_id: roleId, page: 1, size: 500, status: "ACTIVE" }
    const [{ data: assigned }, { data: unassigned }] = await Promise.all([
      pamsAPI.get<Pageable<Permission>>("/references/permissions/assigned", { params }),
      pamsAPI.get<Pageable<Permission>>("/references/permissions/unassigned", { params })
    ])

    assignedPermissions.value = assigned?.content ?? []
    availablePermissions.value = unassigned?.content ?? []
    syncAdvancedRulesSelection()
    syncSidebarAccessSelection()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to load permissions"))
  } finally {
    isPermissionLoading.value = false
  }
}

async function selectRole(role: Role): Promise<void> {
  selectedRoleId.value = role.id
  applyRoleToForm(role)
  await fetchPermissions(role.id)
}

function startCreateRole(): void {
  selectedRoleId.value = null
  assignedPermissions.value = []
  availablePermissions.value = []
  selectedSidebarAccess.value = []
  advancedOpenTabs.value = []
  advancedRulesByTab.value = {}
  applyRoleToForm()
}

function resetRoleForm(): void {
  if (selectedRole.value) {
    applyRoleToForm(selectedRole.value)
    return
  }

  applyRoleToForm()
}

async function saveRole(): Promise<void> {
  const name = roleForm.value.name.trim()
  if (!name) {
    errorToast(toast, "Job title name is required")
    return
  }

  const wasCreating = isCreateMode.value

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

    emit("rolesUpdated")
    await fetchRoles(selectedRoleId.value)
    if (wasCreating) {
      const createdRole = roles.value.find(role => role.name.toLowerCase() === name.toLowerCase())
      if (createdRole) {
        await selectRole(createdRole)
      }
    }
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
    await Promise.all([
      ...toGrant.map(permissionId =>
        pamsAPI.post("/access-matrix", null, {
          params: { role_id: selectedRoleId.value, permission_id: permissionId }
        })
      ),
      ...toRevoke.map(permissionId =>
        pamsAPI.delete("/access-matrix", {
          params: { role_id: selectedRoleId.value, permission_id: permissionId }
        })
      )
    ])

    try {
      await pamsAPI.post("/refresh-tokens")
      const { data } = await pamsAPI.get("/auth/me")
      localStorage.setItem("auth_user", JSON.stringify(data))
      window.dispatchEvent(new CustomEvent("auth-user-updated"))
    } catch {
      // Ignore refresh errors; access changes were already saved.
    }

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
  await fetchRoles(selectedRoleId.value)
}

defineExpose({ open })
</script>
