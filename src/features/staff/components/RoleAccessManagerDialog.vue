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
              <h3 class="text-base font-semibold text-[rgb(var(--app-fg))]">Allowed Screens and Actions</h3>
              <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/60">
                Choose what people with this job title can open and do in the system.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Tag :value="`${assignedPermissions.length} allowed`" severity="success" />
              <Tag :value="`${availablePermissions.length} more options`" severity="secondary" />
            </div>
          </div>

          <Message v-if="isCreateMode" severity="info" :closable="false" class="mt-4">
            Save this job title first, then choose what it can open and do.
          </Message>
          <Message v-else-if="isSelectedRoleLocked" severity="warn" :closable="false" class="mt-4">
            The Owner job title permissions are locked here to keep the top-level account safe.
          </Message>

          <div v-else class="mt-4 grid gap-4 lg:grid-cols-2">
            <div class="space-y-3">
              <IftaLabel>
                <InputText
                  v-model="assignedSearch"
                  fluid
                  placeholder="Search allowed items"
                  :disabled="isPermissionLoading || isBusy"
                />
                <label>Currently Allowed</label>
              </IftaLabel>

              <div class="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                <article
                  v-for="permission in filteredAssignedPermissions"
                  :key="`assigned-${permission.id}`"
                  class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="font-medium text-[rgb(var(--app-fg))]">{{ getPermissionTitle(permission) }}</div>
                      <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">
                        {{ getPermissionSubtitle(permission) }}
                      </div>
                      <Tag class="mt-2" :value="permission.module_name" severity="info" />
                    </div>
                    <Button
                      label="Remove"
                      icon="pi pi-minus"
                      size="small"
                      severity="danger"
                      text
                      :loading="activePermissionId === permission.id && activePermissionAction === 'revoke'"
                      :disabled="isBusy"
                      @click="revokePermission(permission.id)"
                    />
                  </div>
                </article>

                <div
                  v-if="!filteredAssignedPermissions.length && !isPermissionLoading"
                  class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-4 py-8 text-center text-sm text-[rgb(var(--app-fg))]/60"
                >
                  Nothing has been allowed yet.
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <IftaLabel>
                <InputText
                  v-model="availableSearch"
                  fluid
                  placeholder="Search more options"
                  :disabled="isPermissionLoading || isBusy"
                />
                <label>Other Options</label>
              </IftaLabel>

              <div class="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                <article
                  v-for="permission in filteredAvailablePermissions"
                  :key="`available-${permission.id}`"
                  class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="font-medium text-[rgb(var(--app-fg))]">{{ getPermissionTitle(permission) }}</div>
                      <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">
                        {{ getPermissionSubtitle(permission) }}
                      </div>
                      <Tag class="mt-2" :value="permission.module_name" severity="secondary" />
                    </div>
                    <Button
                      label="Allow"
                      icon="pi pi-plus"
                      size="small"
                      text
                      :loading="activePermissionId === permission.id && activePermissionAction === 'grant'"
                      :disabled="isBusy"
                      @click="grantPermission(permission.id)"
                    />
                  </div>
                </article>

                <div
                  v-if="!filteredAvailablePermissions.length && !isPermissionLoading"
                  class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-4 py-8 text-center text-sm text-[rgb(var(--app-fg))]/60"
                >
                  No more options found.
                </div>
              </div>
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

type PermissionAction = "grant" | "revoke" | null

type RoleFormState = {
  name: string
  appointment_provider_type: AppointmentProviderType
  requires_specialty_tag: boolean
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
const assignedSearch = ref("")
const availableSearch = ref("")
const statusFilter = ref<Status>(Status.ALL)
const isRoleLoading = ref(false)
const isPermissionLoading = ref(false)
const isSavingRole = ref(false)
const activePermissionId = ref<number | null>(null)
const activePermissionAction = ref<PermissionAction>(null)

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

const selectedRole = computed(() => roles.value.find(role => role.id === selectedRoleId.value))
const isCreateMode = computed(() => selectedRoleId.value == null)
const isSelectedRoleLocked = computed(() => selectedRole.value?.name === "Owner")
const isSpecialtyToggleDisabled = computed(() =>
  roleForm.value.appointment_provider_type === "NONE" || isSelectedRoleLocked.value
)
const isBusy = computed(() =>
  isRoleLoading.value || isPermissionLoading.value || isSavingRole.value || activePermissionAction.value !== null
)

const filteredAssignedPermissions = computed(() =>
  filterPermissions(assignedPermissions.value, assignedSearch.value)
)
const filteredAvailablePermissions = computed(() =>
  filterPermissions(availablePermissions.value, availableSearch.value)
)
const filteredRoles = computed(() => {
  return roles.value.filter(role => {
    if (statusFilter.value === Status.ACTIVE) return role.is_active
    if (statusFilter.value === Status.INACTIVE) return !role.is_active
    return true
  })
})

function filterPermissions(permissions: Permission[], query: string): Permission[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return permissions
  return permissions.filter(permission => {
    const haystack = [
      permission.name,
      permission.description,
      permission.module_name
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(normalized)
  })
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
  assignedSearch.value = ""
  availableSearch.value = ""

  try {
    const params = { role_id: roleId, page: 1, size: 500, status: "ACTIVE" }
    const [{ data: assigned }, { data: unassigned }] = await Promise.all([
      pamsAPI.get<Pageable<Permission>>("/references/permissions/assigned", { params }),
      pamsAPI.get<Pageable<Permission>>("/references/permissions/unassigned", { params })
    ])

    assignedPermissions.value = assigned?.content ?? []
    availablePermissions.value = unassigned?.content ?? []
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
  assignedSearch.value = ""
  availableSearch.value = ""
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

async function grantPermission(permissionId: number): Promise<void> {
  if (!selectedRoleId.value) return

  activePermissionId.value = permissionId
  activePermissionAction.value = "grant"
  try {
    await pamsAPI.post("/access-matrix", null, {
      params: {
        role_id: selectedRoleId.value,
        permission_id: permissionId
      }
    })
    successToast(toast, "Permission allowed")
    await refreshPermissions()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to allow permission"))
  } finally {
    activePermissionId.value = null
    activePermissionAction.value = null
  }
}

async function revokePermission(permissionId: number): Promise<void> {
  if (!selectedRoleId.value) return

  activePermissionId.value = permissionId
  activePermissionAction.value = "revoke"
  try {
    await pamsAPI.delete("/access-matrix", {
      params: {
        role_id: selectedRoleId.value,
        permission_id: permissionId
      }
    })
    successToast(toast, "Permission removed")
    await refreshPermissions()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to remove permission"))
  } finally {
    activePermissionId.value = null
    activePermissionAction.value = null
  }
}

async function open(): Promise<void> {
  visible.value = true
  await fetchRoles(selectedRoleId.value)
}

defineExpose({ open })
</script>
