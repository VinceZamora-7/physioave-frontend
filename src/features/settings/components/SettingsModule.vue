<template>
  <main class="app-page-shell space-y-5">
    <section class="rounded-3xl border border-[#A91D8B]/20 bg-[linear-gradient(120deg,rgba(36,39,87,0.12),rgba(94,24,105,0.08),rgba(169,29,139,0.12))] p-5 shadow-[0_18px_40px_rgba(36,39,87,0.08)]">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Clinic Setup Center</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Use one guided page to set up job titles, specialties, PTs, and clinic rooms without needing technical help.
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

    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 class="app-section-title">My Mobile Calendar</h3>
          <p class="text-sm opacity-70">
            Connect your Google Calendar once so your phone can show your daily route without opening the full EMR.
            The sync is one-way and only sends time, location, patient initials, and status.
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
      <Message v-else-if="calendarSyncStatus && !calendarSyncStatus.is_physical_therapist" severity="info" :closable="false">
        Mobile route sync is currently limited to Physical Therapist accounts because it is designed for field route visibility.
      </Message>
      <Message v-else-if="calendarSyncStatus?.last_error" severity="warn" :closable="false">
        Last Google Calendar sync issue: {{ calendarSyncStatus.last_error }}
      </Message>
    </section>

    <Message v-if="loadError" severity="error" :closable="false">
      {{ loadError }}
    </Message>

    <Message v-else-if="!canViewSettings" severity="warn" :closable="false">
      Your account can sign in, but it does not yet have the permissions needed to manage operations settings.
    </Message>

    <template v-else>
      <section class="app-section-card-comfy space-y-4">
        <div>
          <h3 class="app-section-title">Start Here</h3>
          <p class="text-sm opacity-70">
            Follow this order when setting up a new branch or refreshing your clinic workflow.
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Step 1</div>
            <div class="mt-2 font-semibold">Set Job Titles and Access</div>
            <p class="mt-1 text-sm opacity-70">
              Decide which positions exist in the clinic and what each one is allowed to do.
            </p>
          </article>

          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Step 2</div>
            <div class="mt-2 font-semibold">Add Specialties</div>
            <p class="mt-1 text-sm opacity-70">
              Create specialties like Neuro, Pediatric, Sports Rehab, or any branch-specific focus area.
            </p>
          </article>

          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Step 3</div>
            <div class="mt-2 font-semibold">Assign PT Team Members</div>
            <p class="mt-1 text-sm opacity-70">
              Add PT staff, choose their job title, and assign their specialty so appointments are easier to book.
            </p>
          </article>

          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Step 4</div>
            <div class="mt-2 font-semibold">Set Clinic Rooms</div>
            <p class="mt-1 text-sm opacity-70">
              Add the treatment areas or rooms available in each branch so appointments can be assigned correctly.
            </p>
          </article>
        </div>

        <Message severity="info" :closable="false">
          Highest-position accounts stay protected. Only an existing Owner can view, add, or update another Owner account. Use the Staffs page only when you need to manage Owner accounts.
        </Message>
      </section>

      <section class="app-section-card-comfy space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 class="app-section-title">Branch Scope</h3>
            <p class="text-sm opacity-70">
              Choose the clinic branch you want to work on. Clinic rooms are branch-specific, while job titles and specialties can be reused across branches.
            </p>
          </div>

          <div class="flex flex-wrap items-end gap-2">
            <IftaLabel class="min-w-[280px]">
              <Select
                v-model="selectedClinicId"
                :options="clinics"
                optionLabel="name"
                optionValue="id"
                filter
                fluid
                placeholder="Select clinic"
                :disabled="isInitializing || !clinics.length"
                :pt="ptSelect"
              />
              <label>Clinic Branch</label>
            </IftaLabel>
            <Button label="Refresh" icon="pi pi-refresh" outlined :pt="ptOutlinedBtn" :loading="isRefreshing" @click="refreshAll" />
          </div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <section class="space-y-5">
          <section class="app-section-card-comfy space-y-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 class="app-section-title">PT Directory</h3>
                <p class="text-sm opacity-70">
                  Manage the active physical therapists available for the selected clinic. Specialty assignments here flow into appointment creation.
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
              <Column field="role_name" header="Job Title" />
              <Column field="specialty_tag_name" header="Specialty">
                <template #body="{ data }">
                  {{ data.specialty_tag_name || "Not assigned" }}
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
              No active job title is currently marked as Physical Therapist. Open Job Titles and Access first, then activate at least one PT job title.
            </Message>
          </section>

          <ClinicTreatmentAreasCard
            :selectedClinic="selectedClinic"
            :canManage="canManageTreatmentAreas"
          />
        </section>

        <aside class="space-y-5">
          <section class="app-section-card-comfy space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 class="app-section-title">Specialty Directory</h3>
                <p class="text-sm opacity-70">
                  Maintain the specialties used by PTs and appointment booking, such as Neuro, Pediatric, and Sports Rehab.
                </p>
              </div>
              <Button
                label="Manage Specialties"
                icon="pi pi-bookmark"
                outlined
                :pt="ptOutlinedBtn"
                :disabled="!canManageSpecialties"
                @click="openSpecialtyManager"
              />
            </div>

            <div class="flex flex-wrap gap-2 text-xs">
              <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
                Active: {{ specialtySummary.active }}
              </span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                Inactive: {{ specialtySummary.inactive }}
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="specialty in orderedSpecialties"
                :key="specialty.id"
                class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="font-medium">{{ specialty.name }}</div>
                  <Tag :value="specialtyStatusLabel(specialty)" :severity="specialtyStatusSeverity(specialty)" />
                </div>
              </div>
              <span v-if="!orderedSpecialties.length" class="text-sm opacity-70">No specialties configured yet.</span>
            </div>

            <Message v-if="!canManageSpecialties" severity="info" :closable="false">
              Specialty updates are locked until this role is granted reference create or update permission.
            </Message>
          </section>

          <section class="app-section-card-comfy space-y-4">
            <div>
              <h3 class="app-section-title">Job Titles and Access</h3>
              <p class="text-sm opacity-70">
                Create plain-language job titles, decide whether they are used in appointments, and choose whether that title requires a specialty.
              </p>
            </div>

            <div class="space-y-3">
              <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
                <div class="text-xs uppercase tracking-wide opacity-60">Current Job Titles</div>
                <div class="mt-3 space-y-2">
                  <div
                    v-for="role in orderedRoles"
                    :key="role.id"
                    class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2"
                  >
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="font-medium">{{ role.name }}</div>
                      <div class="flex flex-wrap gap-2">
                        <Tag :value="roleAppointmentUsageLabel(role)" :severity="roleAppointmentUsageSeverity(role)" />
                        <Tag :value="roleSpecialtyLabel(role)" :severity="roleSpecialtySeverity(role)" />
                        <Tag :value="roleStatusLabel(role)" :severity="roleStatusSeverity(role)" />
                      </div>
                    </div>
                    <div class="mt-1 text-xs opacity-65">
                      {{ roleAppointmentHelpText(role) }}
                    </div>
                  </div>
                  <div v-if="!orderedRoles.length" class="text-sm opacity-70">
                    No job titles configured yet.
                  </div>
                </div>
              </div>

              <Button
                label="Open Job Titles and Access"
                icon="pi pi-shield"
                :pt="ptPrimaryBtn"
                :disabled="!canManageRoleAccess"
                @click="openRoleManager"
              />
            </div>

            <Message v-if="!canManageRoleAccess" severity="info" :closable="false">
              Only roles with job-title and access permissions can change these setup rules.
            </Message>
          </section>
        </aside>
      </div>
    </template>

    <StaffEditorDialog
      ref="staffEditor"
      :roles="activePtRoles"
      :clinics="clinicLookups"
      :specialties="activeSpecialties"
      :isLoading="isModalBusy"
      @saved="handleStaffSaved"
    />
    <SpecialtyManagerDialog ref="specialtyManager" @specialtiesUpdated="handleSpecialtiesUpdated" />
    <RoleAccessManagerDialog ref="roleManager" @rolesUpdated="handleRolesUpdated" />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import axios from "axios"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import IftaLabel from "primevue/iftalabel"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useConfirm, useToast } from "primevue"

import ClinicTreatmentAreasCard from "@/features/clinics/components/ClinicTreatmentAreasCard.vue"
import RoleAccessManagerDialog from "@/features/staff/components/RoleAccessManagerDialog.vue"
import SpecialtyManagerDialog from "@/features/staff/components/SpecialtyManagerDialog.vue"
import StaffEditorDialog from "@/features/staff/components/StaffEditorDialog.vue"
import { clinicService } from "@/features/clinics/api/clinic.service"
import { staffService } from "@/features/staff/api/staff.service"
import { authMeService, type AuthMe } from "@/services/auth-me.service"
import {
  googleCalendarSyncService,
  type GoogleCalendarSyncStatus
} from "@/services/google-calendar-sync.service"
import { pamsAPI } from "@/utils/axios-interceptor"
import type { Lookup } from "@/models/global.model"
import type { Pageable } from "@/models/paging"
import { defaultPage } from "@/models/paging"
import { Status } from "@/utils/global.type"
import type { Clinic } from "@/features/clinics/types/clinic"
import type { Role, SpecialtyTag } from "@/models/reference"
import type { Staff } from "@/features/staff/types/staff"
import { errorToast, successToast } from "@/utils/toast.util"
import { ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect } from "@/features/shared/table-header.styles"

type StatusFilterValue = "ALL" | "ACTIVE" | "INACTIVE"

const toast = useToast()
const confirm = useConfirm()
const route = useRoute()

const currentUser = ref<AuthMe>()
const calendarSyncStatus = ref<GoogleCalendarSyncStatus>()
const loadError = ref("")
const isInitializing = ref(false)
const isRefreshing = ref(false)
const isStaffLoading = ref(false)
const isReferenceLoading = ref(false)
const isCalendarSyncBusy = ref(false)

const clinics = ref<Clinic[]>([])
const roles = ref<Role[]>([])
const specialties = ref<SpecialtyTag[]>([])
const staffs = ref<Staff[]>([])

const selectedClinicId = ref<number>()
const ptSearch = ref("")
const ptStatusFilter = ref<StatusFilterValue>("ALL")

const staffEditor = ref<InstanceType<typeof StaffEditorDialog> | null>(null)
const specialtyManager = ref<InstanceType<typeof SpecialtyManagerDialog> | null>(null)
const roleManager = ref<InstanceType<typeof RoleAccessManagerDialog> | null>(null)

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
const canConnectGoogleCalendar = computed(() =>
  Boolean(calendarSyncStatus.value?.google_oauth_configured)
  && Boolean(calendarSyncStatus.value?.is_physical_therapist)
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
      return "Only Physical Therapist accounts can connect a mobile route calendar right now."
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

const selectedClinic = computed(() =>
  clinics.value.find(clinic => clinic.id === selectedClinicId.value)
)
const clinicLookups = computed<Lookup[]>(() =>
  clinics.value.map(clinic => ({ id: clinic.id, name: clinic.name }))
)
const ptRoles = computed(() =>
  roles.value.filter(role => role.appointment_provider_type === "PHYSICAL_THERAPIST")
)
const activePtRoles = computed(() =>
  ptRoles.value.filter(role => role.is_active)
)
const orderedRoles = computed(() =>
  [...roles.value].sort((left, right) => left.name.localeCompare(right.name))
)
const orderedSpecialties = computed(() =>
  [...specialties.value].sort((left, right) => left.name.localeCompare(right.name))
)
const activeSpecialties = computed(() =>
  specialties.value.filter(specialty => specialty.is_active)
)
const specialtySummary = computed(() => ({
  active: specialties.value.filter(specialty => specialty.is_active).length,
  inactive: specialties.value.filter(specialty => !specialty.is_active).length
}))
const ptStaffs = computed(() =>
  staffs.value.filter(staff => staff.appointment_provider_type === "PHYSICAL_THERAPIST")
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
      staff.role_name,
      staff.specialty_tag_name ?? "",
      staff.clinic_name
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
})

const ptStatusOptions: Array<{ label: string; value: StatusFilterValue }> = [
  { label: "All PTs", value: "ALL" },
  { label: "Active only", value: "ACTIVE" },
  { label: "Inactive only", value: "INACTIVE" }
]

const roleAppointmentUsageLabel = (role: Role): string => {
  if (role.appointment_provider_type === "PHYSICAL_THERAPIST") return "Used as PT"
  if (role.appointment_provider_type === "DOCTOR_CONSULTANT") return "Used as Doctor"
  return "Not used in appointments"
}

const roleAppointmentUsageSeverity = (role: Role): "success" | "info" | "secondary" => {
  if (role.appointment_provider_type === "PHYSICAL_THERAPIST") return "success"
  if (role.appointment_provider_type === "DOCTOR_CONSULTANT") return "info"
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
  return "This job title is for staff access and reporting only, not for appointment provider selection."
}

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.message || error.response?.data?.detail || error.message
    return detail ? `${fallback}: ${detail}` : fallback
  }
  return error instanceof Error && error.message ? `${fallback}: ${error.message}` : fallback
}
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
    clinics.value = []
    selectedClinicId.value = undefined
    return
  }

  const response = await clinicService.getAll({
    page: defaultPage,
    size: 200,
    status: Status.ACTIVE,
    name: undefined
  })

  clinics.value = response?.content ?? []
  if (!selectedClinicId.value || !clinics.value.some(clinic => clinic.id === selectedClinicId.value)) {
    selectedClinicId.value = clinics.value[0]?.id
  }
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
      }
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
