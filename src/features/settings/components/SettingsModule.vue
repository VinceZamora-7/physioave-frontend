<template>
  <main class="app-page-shell space-y-5">
    <section
      v-if="canSeeOperationsSetup"
      class="app-hero-banner"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">PT Team Setup</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Manage your PT team members, specialties, and clinic rooms. Job titles and access are pre-configured for standard PT workflows.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Signed in as: {{ currentUser?.role_name || "Unknown role" }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Active clinic: {{ selectedClinic?.name || "No clinic selected" }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">Clinics</div>
            <div class="mt-1 text-2xl font-semibold">{{ clinics.length }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">PTs</div>
            <div class="mt-1 text-2xl font-semibold">{{ ptStaffs.length }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">Specialties</div>
            <div class="mt-1 text-2xl font-semibold">{{ specialties.length }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3">
            <div class="text-xs uppercase tracking-wide text-slate-500">Job Titles</div>
            <div class="mt-1 text-2xl font-semibold">{{ roles.length }}</div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="canSeeMobileCalendarSection" class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 class="app-section-title">My Mobile Calendar</h3>
          <p class="text-sm opacity-70">
            Connect your Google Calendar once so your phone can show your daily route without opening the full EMR.
            This setting is available for PT, PT Assistant, and Intern mobile route users. The sync is one-way and only sends time, location, patient initials, and status.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            label="Connect Google Calendar"
            icon="pi pi-google"
            :pt="ptPrimaryBtn"
            :disabled="!canConnectGoogleCalendar || isCalendarSyncBusy"
            @click="connectMyGoogleCalendar"
          />
          <Button
            v-if="calendarSyncStatus?.connected"
            label="Push My Route Now"
            icon="pi pi-refresh"
            outlined
            :pt="ptOutlinedBtn"
            :loading="isCalendarSyncBusy"
            @click="resyncMyGoogleCalendar"
          />
          <Button
            v-if="calendarSyncStatus?.connected"
            label="Disconnect"
            icon="pi pi-times-circle"
            severity="danger"
            outlined
            :pt="ptOutlinedBtn"
            :disabled="isCalendarSyncBusy"
            @click="disconnectMyGoogleCalendar"
          />
        </div>
      </div>

      <Message v-if="calendarSyncFeedbackMessage" :severity="calendarSyncFeedbackSeverity" :closable="false">
        {{ calendarSyncFeedbackMessage }}
      </Message>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Sync Status</div>
          <div class="mt-2 font-semibold">
            {{ calendarSyncStatus?.connected ? "Connected" : "Not connected" }}
          </div>
          <div class="mt-1 text-sm opacity-70">
            {{ calendarSyncStatus?.sync_enabled ? "Future appointment changes will push to Google Calendar." : "No mobile route sync is active yet." }}
          </div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Google Account</div>
          <div class="mt-2 font-semibold break-all">
            {{ calendarSyncStatus?.google_email || currentUser?.email || "Not connected yet" }}
          </div>
          <div class="mt-1 text-sm opacity-70">
            Calendar: {{ calendarSyncStatus?.calendar_id || "primary" }}
          </div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Last Route Push</div>
          <div class="mt-2 font-semibold">
            {{ formatCalendarSyncDateTime(calendarSyncStatus?.last_synced_at) }}
          </div>
          <div class="mt-1 text-sm opacity-70">
            {{ calendarSyncStatus?.authorized_at
              ? `Authorized ${formatCalendarSyncDateTime(calendarSyncStatus.authorized_at)}`
              : "Authorize once to begin syncing." }}
          </div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Privacy Rule</div>
          <div class="mt-2 font-semibold">De-identified only</div>
          <div class="mt-1 text-sm opacity-70">
            Time, location, patient initials, and status only. No full patient names or clinical notes are sent.
          </div>
        </article>
      </div>

      <Message v-if="calendarSyncStatus && !calendarSyncStatus.google_oauth_configured" severity="warn" :closable="false">
        Google Calendar sync is not configured on this server yet. Add the Google OAuth credentials in the backend environment first.
      </Message>
      <Message v-else-if="calendarSyncStatus && !calendarSyncStatus.is_mobile_calendar_eligible" severity="info" :closable="false">
        Mobile route sync is available only for PT, PT Assistant, and Intern accounts because it is designed for field route visibility.
      </Message>
      <Message v-else-if="calendarSyncStatus?.last_error" severity="warn" :closable="false">
        Last Google Calendar sync issue: {{ calendarSyncStatus.last_error }}
      </Message>
    </section>

    <Message v-if="loadError" severity="error" :closable="false">
      {{ loadError }}
    </Message>

    <template v-if="canSeeOperationsSetup">
      <div class="space-y-5">
        <section v-if="canSeePtDirectorySection" class="app-section-card-comfy space-y-4" id="settings-pt-directory">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 class="app-section-title">PT Team Directory</h3>
              <p class="text-sm opacity-70">
                Add and maintain physical therapists for the selected clinic. Specialty assignments here will appear in appointment booking.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                label="Add PT"
                icon="pi pi-plus"
                :pt="ptPrimaryBtn"
                :disabled="!canManageStaff || !activePtRoles.length"
                @click="openCreatePt"
              />
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <IftaLabel>
              <InputText
                v-model="ptSearch"
                fluid
                placeholder="Search PT by name, email, specialty, or job title"
                :pt="ptInputText"
              />
              <label>Search PTs</label>
            </IftaLabel>
            <IftaLabel>
              <Select
                v-model="ptStatusFilter"
                :options="ptStatusOptions"
                optionLabel="label"
                optionValue="value"
                fluid
                :pt="ptSelect"
              />
              <label>Status</label>
            </IftaLabel>
          </div>

          <DataTable
            :value="filteredPtStaffs"
            :loading="isStaffLoading"
            dataKey="id"
            size="small"
            scrollable
            scrollHeight="420px"
          >
            <template #empty>
              <div class="py-8 text-center text-sm opacity-70">
                No physical therapist records match this branch and filter.
              </div>
            </template>
            <Column field="name" header="PT Name" />
            <Column field="email" header="Email" />
            <Column field="role_name" header="Job Title">
              <template #body="{ data }">
                {{ resolvePtRoleName(data) }}
              </template>
            </Column>
            <Column field="specialty_tag_name" header="Specialty">
              <template #body="{ data }">
                {{ resolvePtSpecialtyName(data) }}
              </template>
            </Column>
            <Column field="is_active" header="Status">
              <template #body="{ data }">
                <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column v-if="canManageStaff" header="Actions">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-2">
                  <Button size="small" text icon="pi pi-pencil" label="Edit" @click="openEditPt(data)" />
                  <Button
                    size="small"
                    text
                    :severity="data.is_active ? 'danger' : 'success'"
                    :icon="data.is_active ? 'pi pi-times-circle' : 'pi pi-refresh'"
                    :label="data.is_active ? 'Deactivate' : 'Activate'"
                    @click="confirmTogglePtStatus(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>

          <Message v-if="!canManageStaff" severity="info" :closable="false">
            PT records are visible here, but your account does not currently have staff create or update permission.
          </Message>
          <Message v-else-if="!activePtRoles.length" severity="warn" :closable="false">
            No active PT job title found. Set up at least one in the PT Job Titles section below.
          </Message>
        </section>

        <div v-if="canSeeSpecialtiesSection || canSeeRoleAccessSection" class="grid gap-5 xl:grid-cols-2">
          <section v-if="canSeeSpecialtiesSection" class="app-section-card-comfy space-y-3" id="settings-specialties">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="app-section-title">Specialties</h3>
                <p class="text-sm opacity-70">Used for PT assignments and appointment booking.</p>
              </div>
              <Button
                label="Manage"
                icon="pi pi-bookmark"
                size="small"
                outlined
                :pt="ptOutlinedBtn"
                :disabled="!canManageSpecialties"
                @click="openSpecialtyManager"
              />
            </div>

            <div v-if="canManageSpecialties" class="space-y-2">
              <div class="flex gap-2">
                <InputText
                  v-model="inlineSpecialtyName"
                  placeholder="Add specialty and press Enter..."
                  class="flex-1"
                  :pt="ptInputText"
                  @keydown.enter="quickAddSpecialty(inlineSpecialtyName)"
                />
                <Button
                  icon="pi pi-plus"
                  :pt="ptPrimaryBtn"
                  :loading="isAddingSpecialty"
                  :disabled="!inlineSpecialtyName.trim() || isAddingSpecialty"
                  @click="quickAddSpecialty(inlineSpecialtyName)"
                />
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs opacity-55">Quick add:</span>
                <button
                  v-for="preset in COMMON_SPECIALTY_PRESETS"
                  :key="preset"
                  :disabled="isAddingSpecialty || orderedSpecialties.some(s => s.name.toLowerCase() === preset.toLowerCase())"
                  class="rounded-full border border-[rgb(var(--app-border))] bg-white/70 px-3 py-1 text-xs transition-colors hover:bg-[#A91D8B]/10 hover:border-[#A91D8B]/40 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white/10"
                  @click="quickAddSpecialty(preset)"
                >
                  <span v-if="orderedSpecialties.some(s => s.name.toLowerCase() === preset.toLowerCase())" class="mr-1 text-xs text-emerald-500">✓</span>{{ preset }}
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 text-xs">
              <span class="app-pill-active">Active: {{ specialtySummary.active }}</span>
              <span class="app-pill-inactive">Inactive: {{ specialtySummary.inactive }}</span>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="opacity-60">Show:</span>
              <Button
                label="Active"
                size="small"
                :severity="specialtyDisplayFilter === 'ACTIVE' ? 'success' : 'secondary'"
                :outlined="specialtyDisplayFilter !== 'ACTIVE'"
                @click="specialtyDisplayFilter = 'ACTIVE'"
              />
              <Button
                label="All"
                size="small"
                :severity="specialtyDisplayFilter === 'ALL' ? 'info' : 'secondary'"
                :outlined="specialtyDisplayFilter !== 'ALL'"
                @click="specialtyDisplayFilter = 'ALL'"
              />
            </div>

            <div class="max-h-52 overflow-y-auto space-y-1 pr-1">
              <div
                v-for="specialty in visibleSpecialties"
                :key="specialty.id"
                class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="text-sm font-medium">{{ specialty.name }}</div>
                  <Tag :value="specialtyStatusLabel(specialty)" :severity="specialtyStatusSeverity(specialty)" />
                </div>
              </div>
              <span v-if="!visibleSpecialties.length" class="text-sm opacity-70">No specialties for this filter yet.</span>
            </div>

            <Message v-if="!canManageSpecialties" severity="info" :closable="false">
              Specialty updates are locked until this role is granted reference create or update permission.
            </Message>
          </section>

          <section v-if="canSeeRoleAccessSection" class="app-section-card-comfy space-y-3" id="settings-job-titles">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="app-section-title">PT Job Titles</h3>
                <p class="text-sm opacity-70">Define PT roles. Access is pre-configured for standard PT work.</p>
              </div>
              <Button
                label="Configure"
                icon="pi pi-shield"
                size="small"
                outlined
                :pt="ptOutlinedBtn"
                :disabled="!canManageRoleAccess"
                @click="openRoleManager"
              />
            </div>

            <Button
              v-if="canManageRoleAccess && hasMissingStandardPtRoles"
              :label="`Quick Setup: Add ${missingStandardPtProviderTypes.length} standard PT role${missingStandardPtProviderTypes.length > 1 ? 's' : ''}`"
              icon="pi pi-bolt"
              :pt="ptPrimaryBtn"
              :loading="isQuickSetupBusy"
              :disabled="isQuickSetupBusy"
              class="w-full"
              @click="quickSetupStandardRoles"
            />

            <div class="max-h-52 overflow-y-auto space-y-1 pr-1">
              <div
                v-for="role in orderedRoles"
                :key="role.id"
                class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="text-sm font-medium">{{ role.name }}</div>
                  <div class="flex flex-wrap gap-1">
                    <Tag :value="roleAppointmentUsageLabel(role)" :severity="roleAppointmentUsageSeverity(role)" />
                    <Tag :value="roleStatusLabel(role)" :severity="roleStatusSeverity(role)" />
                  </div>
                </div>
              </div>
              <div v-if="!orderedRoles.length" class="text-sm opacity-70">No job titles yet.</div>
            </div>

            <Message v-if="!canManageRoleAccess" severity="info" :closable="false">
              Only roles with job-title and access permissions can change these setup rules.
            </Message>
          </section>
        </div>

        <ClinicTreatmentAreasCard
          v-if="canSeeTreatmentAreasSection"
          :selectedClinic="selectedClinic"
          :canManage="canManageTreatmentAreas"
        />
      </div>
    </template>

    <StaffEditorDialog
      ref="staffEditor"
      formMode="PT"
      :roles="activePtRoles"
      :ptRoles="activePtRoles"
      :clinics="clinicLookups"
      :specialties="activeSpecialties"
      :isLoading="isModalBusy"
      @saved="handleStaffSaved"
      @specialty-created="fetchReferences"
    />
    <SpecialtyManagerDialog ref="specialtyManager" @specialtiesUpdated="handleSpecialtiesUpdated" />
    <RoleAccessManagerDialog
      ref="roleManager"
      providerScope="PT"
      dialogTitle="PT Job Titles and Permissions"
      @rolesUpdated="handleRolesUpdated"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import IftaLabel from "primevue/iftalabel"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"

import ClinicTreatmentAreasCard from "@/features/clinics/components/ClinicTreatmentAreasCard.vue"
import RoleAccessManagerDialog from "@/features/staff/components/RoleAccessManagerDialog.vue"
import SpecialtyManagerDialog from "@/features/staff/components/SpecialtyManagerDialog.vue"
import StaffEditorDialog from "@/features/staff/components/StaffEditorDialog.vue"
import { staffService } from "@/features/staff/api/staff.service"
import { authMeService, type AuthMe } from "@/services/auth-me.service"
import {
  googleCalendarSyncService,
  type GoogleCalendarSyncStatus
} from "@/services/google-calendar-sync.service"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import type { Lookup } from "@/models/global.model"
import type { Pageable } from "@/models/paging"
import { defaultPage } from "@/models/paging"
import { Status } from "@/utils/global.type"
import type { Clinic } from "@/features/clinics/types/clinic"
import type { Role, SpecialtyTag } from "@/models/reference"
import type { Staff } from "@/features/staff/types/staff"
import { errorToast, successToast } from "@/utils/toast.util"
import { ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect } from "@/features/shared/table-header.styles"
import { clinicStore } from "@/stores/clinic.store"

type StatusFilterValue = "ACTIVE" | "INACTIVE"
type SpecialtyDisplayFilter = "ACTIVE" | "ALL"

const toast = useToast()
const confirm = useConfirm()
const route = useRoute()
const globalClinicStore = clinicStore()
const { clinicOptions: clinics, selectedClinicId, selectedClinic } = storeToRefs(globalClinicStore)

const currentUser = ref<AuthMe>()
const calendarSyncStatus = ref<GoogleCalendarSyncStatus>()
const loadError = ref("")
const isInitializing = ref(false)
const isRefreshing = ref(false)
const isStaffLoading = ref(false)
const isReferenceLoading = ref(false)
const isCalendarSyncBusy = ref(false)

const roles = ref<Role[]>([])
const specialties = ref<SpecialtyTag[]>([])
const staffs = ref<Staff[]>([])

const ptSearch = ref("")
const ptStatusFilter = ref<StatusFilterValue>("ACTIVE")
const specialtyDisplayFilter = ref<SpecialtyDisplayFilter>("ACTIVE")

const staffEditor = ref<InstanceType<typeof StaffEditorDialog> | null>(null)
const specialtyManager = ref<InstanceType<typeof SpecialtyManagerDialog> | null>(null)
const roleManager = ref<InstanceType<typeof RoleAccessManagerDialog> | null>(null)

const isQuickSetupBusy = ref(false)
const inlineSpecialtyName = ref("")
const isAddingSpecialty = ref(false)

const STANDARD_PT_ROLES = [
  { name: "Physical Therapist", appointment_provider_type: "PHYSICAL_THERAPIST" as const, requires_specialty_tag: true },
  { name: "PT Assistant", appointment_provider_type: "PT_ASSISTANT" as const, requires_specialty_tag: false },
  { name: "Intern", appointment_provider_type: "INTERN" as const, requires_specialty_tag: false },
]

const PT_DEFAULT_PERMISSION_NAMES = new Set([
  "Patient::LOOKUP",
  "Patient::READ",
  "Patient::CREATE",
  "Patient::UPDATE",
  "Patient::DELETE",
  "Appointment::READ",
  "Appointment::LOOKUP",
  "Appointment::CREATE",
  "Appointment::UPDATE",
  "Appointment::DELETE",
  "Appointment::MANAGE_STATUS",
  "Dashboard::READ",
])

const COMMON_SPECIALTY_PRESETS = [
  "Neuro",
  "Orthopedic",
  "Pediatric",
  "Sports Rehab",
  "Geriatric",
  "Musculoskeletal",
  "Cardiopulmonary",
  "Burns & Wound Care",
]

const permissionSet = computed(() => new Set(currentUser.value?.permissions ?? []))
const hasAnyPermission = (...permissions: string[]): boolean =>
  permissions.some(permission => permissionSet.value.has(permission))

const canReadClinics = computed(() => hasAnyPermission("Clinic::READ", "Clinic::LOOKUP", "Clinic::UPDATE", "Clinic::CREATE"))
const canReadStaff = computed(() => hasAnyPermission("Staff::READ", "Staff::LOOKUP", "Staff::UPDATE", "Staff::CREATE"))
const canReadReferences = computed(() => hasAnyPermission("Reference::LOOKUP", "Reference::UPDATE", "Reference::CREATE"))
const canManageTreatmentAreas = computed(() => hasAnyPermission("Clinic::UPDATE"))
const canManageStaff = computed(() => hasAnyPermission("Staff::CREATE", "Staff::UPDATE"))
const canManageSpecialties = computed(() => hasAnyPermission("Reference::CREATE", "Reference::UPDATE"))
const canManageRoleAccess = computed(() =>
  hasAnyPermission("Reference::CREATE", "Reference::UPDATE")
  && hasAnyPermission("AccessMatrix::CREATE", "AccessMatrix::DELETE")
)
const canViewSettings = computed(() =>
  canReadClinics.value || canReadStaff.value || canReadReferences.value || canManageTreatmentAreas.value || canManageStaff.value
)
const canSeePtDirectorySection = computed(() => canReadStaff.value || canManageStaff.value)
const canSeeTreatmentAreasSection = computed(() => canReadClinics.value || canManageTreatmentAreas.value)
const canSeeSpecialtiesSection = computed(() => canReadReferences.value || canManageSpecialties.value)
const canSeeRoleAccessSection = computed(() => canReadReferences.value || canManageRoleAccess.value)
const canSeeOperationsSetup = computed(() =>
  canSeePtDirectorySection.value
  || canSeeTreatmentAreasSection.value
  || canSeeSpecialtiesSection.value
  || canSeeRoleAccessSection.value
)
const canSeeBranchScopeSection = computed(() =>
  canSeePtDirectorySection.value || canSeeTreatmentAreasSection.value
)
const isMobileCalendarEligibleRole = computed(() => {
  const providerType = String(currentUser.value?.appointment_provider_type ?? "").trim().toUpperCase()
  return providerType === "PHYSICAL_THERAPIST" || providerType === "PT_ASSISTANT" || providerType === "INTERN"
})
const canSeeMobileCalendarSection = computed(() =>
  isMobileCalendarEligibleRole.value
)
const canConnectGoogleCalendar = computed(() =>
  Boolean(calendarSyncStatus.value?.google_oauth_configured)
  && Boolean(calendarSyncStatus.value?.is_mobile_calendar_eligible)
  && Boolean(calendarSyncStatus.value?.is_staff_active)
)
const calendarSyncFeedbackSeverity = computed(() =>
  route.query.calendar_sync === "connected" ? "success" : "warn"
)
const calendarSyncFeedbackMessage = computed(() => {
  const status = String(route.query.calendar_sync ?? "").trim().toLowerCase()
  const errorCode = String(route.query.calendar_sync_error ?? "").trim().toLowerCase()

  if (status === "connected") {
    return "Google Calendar is connected. Your phone calendar will now receive de-identified route updates."
  }
  if (status === "failed") {
    if (errorCode === "google_account_mismatch") {
      return "Use the same Google account as your EMR email when connecting your mobile calendar."
    }
    if (errorCode === "pt_only") {
      return "Only PT, PT Assistant, and Intern accounts can connect a mobile route calendar right now."
    }
    if (errorCode === "google_not_configured") {
      return "Google Calendar sync is not configured on this server yet."
    }
    if (errorCode === "access_denied") {
      return "Google Calendar authorization was cancelled before access was granted."
    }
    return "Google Calendar connection did not finish. Please try again."
  }
  return ""
})

const isModalBusy = computed(() =>
  isInitializing.value || isStaffLoading.value || isReferenceLoading.value
)

const clinicLookups = computed<Lookup[]>(() =>
  clinics.value.map(clinic => ({ id: clinic.id, name: clinic.name }))
)
const ptRoles = computed(() =>
  roles.value.filter(role =>
    role.appointment_provider_type === "PHYSICAL_THERAPIST"
    || role.appointment_provider_type === "PT_ASSISTANT"
    || role.appointment_provider_type === "INTERN"
  )
)
const activePtRoles = computed(() =>
  ptRoles.value.filter(role => role.is_active)
)
const orderedRoles = computed(() =>
  [...ptRoles.value].sort((left, right) => left.name.localeCompare(right.name))
)
const orderedSpecialties = computed(() =>
  [...specialties.value].sort((left, right) => left.name.localeCompare(right.name))
)
const activeSpecialties = computed(() =>
  specialties.value.filter(specialty => specialty.is_active)
)
const visibleSpecialties = computed(() =>
  specialtyDisplayFilter.value === "ACTIVE"
    ? orderedSpecialties.value.filter(specialty => specialty.is_active)
    : orderedSpecialties.value
)
const missingStandardPtProviderTypes = computed(() => {
  const existing = new Set(ptRoles.value.map(r => r.appointment_provider_type))
  return STANDARD_PT_ROLES.filter(t => !existing.has(t.appointment_provider_type))
})
const hasMissingStandardPtRoles = computed(() => missingStandardPtProviderTypes.value.length > 0)

const specialtySummary = computed(() => ({
  active: specialties.value.filter(specialty => specialty.is_active).length,
  inactive: specialties.value.filter(specialty => !specialty.is_active).length
}))
const isPtProviderType = (providerType?: string | null): boolean =>
  providerType === "PHYSICAL_THERAPIST" || providerType === "PT_ASSISTANT" || providerType === "INTERN"
const resolvePtRoleName = (staff: Staff): string =>
  isPtProviderType(staff.appointment_provider_type)
    ? staff.role_name
    : (staff.secondary_role_name || staff.role_name)
const resolvePtSpecialtyName = (staff: Staff): string =>
  staff.specialty_tag_name || "Not assigned"
const ptStaffs = computed(() =>
  staffs.value.filter(staff =>
    isPtProviderType(staff.appointment_provider_type)
    || isPtProviderType(staff.secondary_appointment_provider_type)
  )
)
const filteredPtStaffs = computed(() => {
  const query = ptSearch.value.trim().toLowerCase()

  return ptStaffs.value.filter(staff => {
    if (selectedClinicId.value && staff.clinic_id !== selectedClinicId.value) return false
    if (ptStatusFilter.value === "ACTIVE" && !staff.is_active) return false
    if (ptStatusFilter.value === "INACTIVE" && staff.is_active) return false

    if (!query) return true

    const haystack = [
      staff.name,
      staff.email,
      resolvePtRoleName(staff),
      resolvePtSpecialtyName(staff),
      staff.clinic_name
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
})

const ptStatusOptions: Array<{ label: string; value: StatusFilterValue }> = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" }
]

const roleAppointmentUsageLabel = (role: Role): string => {
  if (role.appointment_provider_type === "PHYSICAL_THERAPIST") return "Used as PT"
  if (role.appointment_provider_type === "DOCTOR_CONSULTANT") return "Used as Doctor"
  if (role.appointment_provider_type === "PT_ASSISTANT") return "Used as PT Assistant"
  if (role.appointment_provider_type === "INTERN") return "Used as Intern"
  return "Not used in appointments"
}

const roleAppointmentUsageSeverity = (role: Role): "success" | "info" | "warn" | "secondary" => {
  if (role.appointment_provider_type === "PHYSICAL_THERAPIST") return "success"
  if (role.appointment_provider_type === "DOCTOR_CONSULTANT") return "info"
  if (role.appointment_provider_type === "PT_ASSISTANT") return "warn"
  if (role.appointment_provider_type === "INTERN") return "warn"
  return "secondary"
}

const roleSpecialtyLabel = (role: Role): string => {
  if (role.appointment_provider_type === "NONE") return "No specialty needed"
  return role.requires_specialty_tag ? "Specialty required" : "Specialty optional"
}

const roleSpecialtySeverity = (role: Role): "warn" | "contrast" | "secondary" => {
  if (role.appointment_provider_type === "NONE") return "secondary"
  return role.requires_specialty_tag ? "warn" : "contrast"
}

const roleStatusLabel = (role: Role): string =>
  role.is_active ? "Active" : "Inactive"

const roleStatusSeverity = (role: Role): "success" | "secondary" =>
  role.is_active ? "success" : "secondary"

const specialtyStatusLabel = (specialty: SpecialtyTag): string =>
  specialty.is_active ? "Active" : "Inactive"

const specialtyStatusSeverity = (specialty: SpecialtyTag): "success" | "secondary" =>
  specialty.is_active ? "success" : "secondary"

const roleAppointmentHelpText = (role: Role): string => {
  if (role.appointment_provider_type === "PHYSICAL_THERAPIST") {
    return "This job title can be selected as a PT during appointment booking."
  }
  if (role.appointment_provider_type === "DOCTOR_CONSULTANT") {
    return "This job title can be selected as a doctor consultant during appointment booking."
  }
  if (role.appointment_provider_type === "PT_ASSISTANT") {
    return "This job title can be selected as PT Assistant during appointment booking."
  }
  if (role.appointment_provider_type === "INTERN") {
    return "This job title can be selected as Intern during appointment booking."
  }
  return "This job title is for staff access and reporting only, not for appointment provider selection."
}

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Settings access in Role Access",
    invalidInputHint: "Some settings inputs are invalid. Review the fields and try again.",
    retryHint: "Please try again."
  })
const formatCalendarSyncDateTime = (value?: string): string => {
  if (!value) return "Not yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not yet"
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

const fetchCurrentUser = async (): Promise<void> => {
  const me = await authMeService.get()
  if (!me) {
    throw new Error("Unable to load your account profile.")
  }
  currentUser.value = me
  localStorage.setItem("auth_user", JSON.stringify(me))
}

const fetchCalendarSyncStatus = async (): Promise<void> => {
  calendarSyncStatus.value = await googleCalendarSyncService.getMyStatus()
}

const fetchClinics = async (): Promise<void> => {
  if (!canReadClinics.value) {
    return
  }
  await globalClinicStore.loadClinics()
}

const fetchReferences = async (): Promise<void> => {
  if (!canReadReferences.value) {
    roles.value = []
    specialties.value = []
    return
  }

  isReferenceLoading.value = true
  try {
    const [rolesResponse, specialtiesResponse] = await Promise.all([
      pamsAPI.get<Pageable<Role>>("/references/roles", {
        params: { page: 1, size: 500, status: "ALL" }
      }),
      pamsAPI.get<Pageable<SpecialtyTag>>("/references/specialty-tags", {
        params: { page: 1, size: 500, status: "ALL" }
      })
    ])

    roles.value = rolesResponse.data?.content ?? []
    specialties.value = specialtiesResponse.data?.content ?? []
  } finally {
    isReferenceLoading.value = false
  }
}

const fetchStaffs = async (): Promise<void> => {
  if (!canReadStaff.value) {
    staffs.value = []
    return
  }

  isStaffLoading.value = true
  try {
    const response = await staffService.getAll({
      clinic_id: selectedClinicId.value,
      pageable_request: {
        page: 1,
        size: 300,
        status: Status.ALL,
        name: undefined
      },
      staff_scope: "PT"
    })
    staffs.value = response?.content ?? []
  } finally {
    isStaffLoading.value = false
  }
}

const refreshAll = async (): Promise<void> => {
  if (!currentUser.value) return

  isRefreshing.value = true
  loadError.value = ""
  try {
    await Promise.all([
      fetchClinics(),
      fetchReferences(),
      fetchCalendarSyncStatus()
    ])
    await fetchStaffs()
  } catch (error: unknown) {
    loadError.value = extractApiErrorMessage(error, "Failed to refresh the operations settings dashboard")
  } finally {
    isRefreshing.value = false
  }
}

const openCreatePt = (): void => {
  if (!canManageStaff.value) return
  if (!activePtRoles.value.length) {
    errorToast(toast, "Add and activate at least one Physical Therapist job title first.")
    return
  }
  staffEditor.value?.openCreate()
}

const openEditPt = (staff: Staff): void => {
  if (!canManageStaff.value) return
  staffEditor.value?.openEdit(staff)
}

const confirmTogglePtStatus = (staff: Staff): void => {
  if (!canManageStaff.value) return

  confirm.require({
    message: `If you proceed, ${staff.name} will become ${staff.is_active ? "inactive" : "active"}.`,
    header: `${staff.is_active ? "Deactivate" : "Activate"} PT`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true
    },
    acceptProps: {
      label: staff.is_active ? "Deactivate" : "Activate",
      severity: staff.is_active ? "danger" : "success"
    },
    accept: async () => {
      try {
        await staffService.toggleStatus(staff.id)
        successToast(toast, staff.is_active ? "PT deactivated" : "PT activated")
        await fetchStaffs()
      } catch (error: unknown) {
        errorToast(toast, extractApiErrorMessage(error, "Failed to update PT status"))
      }
    }
  })
}

const openSpecialtyManager = async (): Promise<void> => {
  if (!canManageSpecialties.value) return
  await specialtyManager.value?.open()
}

const quickSetupStandardRoles = async (): Promise<void> => {
  if (!canManageRoleAccess.value || isQuickSetupBusy.value) return
  isQuickSetupBusy.value = true
  loadError.value = ""
  try {
    const toCreate = missingStandardPtProviderTypes.value
    if (!toCreate.length) {
      toast.add({ severity: "info", summary: "Already set up", detail: "All standard PT job titles already exist.", life: 3000 })
      return
    }

    await Promise.all(
      toCreate.map(template =>
        pamsAPI.post("/references/roles", {
          name: template.name,
          appointment_provider_type: template.appointment_provider_type,
          requires_specialty_tag: template.requires_specialty_tag,
        })
      )
    )

    await fetchReferences()

    const newRoles = ptRoles.value.filter(role =>
      toCreate.some(t => t.appointment_provider_type === role.appointment_provider_type)
    )

    await Promise.all(
      newRoles.map(async (role) => {
        const { data } = await pamsAPI.get<Pageable<{ id: number; name: string }>>("/references/permissions/unassigned", {
          params: { role_id: role.id, page: 1, size: 500, status: "ACTIVE" }
        })
        const ptPermissionIds = (data?.content ?? [])
          .filter((p) => PT_DEFAULT_PERMISSION_NAMES.has(p.name))
          .map((p) => p.id)

        await Promise.all(
          ptPermissionIds.map((permissionId) =>
            pamsAPI.post("/access-matrix", null, {
              params: { role_id: role.id, permission_id: permissionId }
            })
          )
        )
      })
    )

    await fetchReferences()
    successToast(toast, `${toCreate.length} standard PT job title${toCreate.length > 1 ? "s" : ""} created with default access`)
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to create standard PT job titles"))
  } finally {
    isQuickSetupBusy.value = false
  }
}

const quickAddSpecialty = async (name: string): Promise<void> => {
  const trimmed = name.trim()
  if (!trimmed || isAddingSpecialty.value) return
  if (orderedSpecialties.value.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
    toast.add({ severity: "info", summary: "Already exists", detail: `"${trimmed}" is already in the specialty list.`, life: 2500 })
    inlineSpecialtyName.value = ""
    return
  }

  isAddingSpecialty.value = true
  try {
    await pamsAPI.post("/references/specialty-tags", { name: trimmed })
    successToast(toast, `"${trimmed}" added to specialties`)
    inlineSpecialtyName.value = ""
    await fetchReferences()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to add specialty"))
  } finally {
    isAddingSpecialty.value = false
  }
}

const openRoleManager = async (): Promise<void> => {
  if (!canManageRoleAccess.value) return
  await roleManager.value?.open()
}

const handleSpecialtiesUpdated = async (): Promise<void> => {
  await fetchReferences()
  await fetchStaffs()
}

const handleRolesUpdated = async (): Promise<void> => {
  await fetchReferences()
  await fetchStaffs()
}

const handleStaffSaved = async (): Promise<void> => {
  await fetchStaffs()
}

const connectMyGoogleCalendar = (): void => {
  if (!canConnectGoogleCalendar.value) return
  googleCalendarSyncService.startAuthorization("/settings")
}

const resyncMyGoogleCalendar = async (): Promise<void> => {
  if (!calendarSyncStatus.value?.connected) return

  isCalendarSyncBusy.value = true
  try {
    const result = await googleCalendarSyncService.resync()
    successToast(
      toast,
      `Your Google Calendar route was refreshed${typeof result?.synced_appointments === "number" ? ` for ${result.synced_appointments} appointment${result.synced_appointments === 1 ? "" : "s"}` : ""}.`
    )
    await fetchCalendarSyncStatus()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to push your route to Google Calendar"))
  } finally {
    isCalendarSyncBusy.value = false
  }
}

const disconnectMyGoogleCalendar = (): void => {
  if (!calendarSyncStatus.value?.connected) return

  confirm.require({
    message: "This will stop future one-way route updates to Google Calendar and remove previously synced route events when possible.",
    header: "Disconnect Google Calendar",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true
    },
    acceptProps: {
      label: "Disconnect",
      severity: "danger"
    },
    accept: async () => {
      isCalendarSyncBusy.value = true
      try {
        await googleCalendarSyncService.disconnect()
        successToast(toast, "Google Calendar route sync disconnected")
        await fetchCalendarSyncStatus()
      } catch (error: unknown) {
        errorToast(toast, extractApiErrorMessage(error, "Failed to disconnect Google Calendar"))
      } finally {
        isCalendarSyncBusy.value = false
      }
    }
  })
}

watch(selectedClinicId, async (clinicId, previousClinicId) => {
  if (!currentUser.value) return
  if (clinicId === previousClinicId) return
  await fetchStaffs()
})

onMounted(async () => {
  isInitializing.value = true
  loadError.value = ""
  try {
    await fetchCurrentUser()
    await fetchCalendarSyncStatus()
    if (!canViewSettings.value) return
    await Promise.all([
      fetchClinics(),
      fetchReferences()
    ])
    await fetchStaffs()
  } catch (error: unknown) {
    loadError.value = extractApiErrorMessage(error, "Failed to load the operations settings dashboard")
  } finally {
    isInitializing.value = false
  }
})
</script>
