<template>
  <section :class="sectionCardClass">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 :class="sectionTitleClass">
            Appointments
          </h3>
          <span class="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold  ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-400/20">
            {{ selectedDateLabel }}
          </span>
        </div>
        <p class="app-appointment-muted max-w-2xl text-sm leading-6">
          Search, filter, review, reschedule, cancel, and export appointment records from one table.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          size="small"
          :loading="isLoading"
          :pt="ptOutlinedBtn"
          @click="refresh"
        />
        <Button
          label="Export CSV"
          icon="pi pi-download"
          severity="secondary"
          outlined
          size="small"
          :disabled="isLoading || totalElements === 0"
          :pt="ptOutlinedBtn"
          @click="onExportCsv"
        />
      </div>
    </div>

    <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))]/60 p-3 dark:bg-white/[0.03]">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
        <IftaLabel class="xl:col-span-4">
          <InputText
            v-model="recordFilter"
            fluid
            placeholder="Search patient, record ID, clinic, PT, status, or date"
            :pt="ptInputText"
          />
          <!-- <label>Search Appointment</label> -->
        </IftaLabel>

        <IftaLabel class="xl:col-span-2">
          <Select
            v-model="statusFilter"
            :options="appointmentStatusOptions"
            showClear
            fluid
            placeholder="All statuses"
            :pt="ptSelect"
          />
          <label>Status</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-2">
          <Select
            v-model="phaseFilter"
            :options="appointmentPhaseOptions"
            optionLabel="label"
            optionValue="value"
            showClear
            fluid
            placeholder="All phases"
            :pt="ptSelect"
          />
          <label>Phase</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-3">
          <Select
            v-model="ptFilter"
            :options="ptFilterOptions"
            optionLabel="label"
            optionValue="value"
            showClear
            filter
            fluid
            placeholder="All assigned PTs"
            :pt="ptSelect"
          />
          <label>Assigned PT</label>
        </IftaLabel>

        <div class="flex items-end xl:col-span-1">
          <Button
            label="Clear"
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            size="small"
            class="w-full"
            :disabled="!hasActiveFilters || isLoading"
            @click="clearFilters"
          />
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex flex-wrap items-center gap-2 text-[rgb(var(--app-fg))]/60">
          <span class="rounded-full bg-white px-2.5 py-1 font-semibold ring-1 ring-[rgb(var(--app-border))] dark:bg-white/5">
            {{ tableSummaryLabel }}
          </span>
          <span v-if="recordFilter.trim()" class="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20">
            Smart search ignores date and clinic filters
          </span>
        </div>

        <span v-if="hasActiveFilters" class="font-medium text-[rgb(var(--app-fg))]/50">
          Filters active
        </span>
      </div>
    </div>

    <div class="app-appointment-table-shell overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] shadow-sm">
      <DataTable
        :value="appointments"
        dataKey="id"
        paginator
        :rows="pageSize"
        :first="(page - 1) * pageSize"
        :totalRecords="totalElements"
        :loading="isLoading"
        selectionMode="single"
        stripedRows
        rowHover
        scrollable
        scrollHeight="560px"
        responsiveLayout="scroll"
        @page="onPage"
        @rowSelect="onSelectRow"
        :pt="{
          root: { class: 'text-sm' },
          table: { class: 'min-w-[1180px]' },
          headerRow: { class: 'bg-[rgb(var(--app-bg-soft))]' },
          column: {
            headerCell: {
              class: 'app-appointment-table-th whitespace-nowrap bg-[rgb(var(--app-bg-soft))] text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55'
            },
            bodyCell: {
              class: 'app-appointment-table-td align-top'
            }
          },
          paginator: {
            root: { class: 'border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))]/70' }
          }
        }"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-300">
              <i class="pi pi-calendar-times text-xl" />
            </div>
            <div class="space-y-1">
              <p class="font-semibold text-[rgb(var(--app-fg))]">No appointments found</p>
              <p class="app-appointment-muted text-sm">Try clearing filters, changing the selected date, or switching clinics.</p>
            </div>
            <Button
              v-if="hasActiveFilters"
              label="Clear filters"
              icon="pi pi-filter-slash"
              severity="secondary"
              outlined
              size="small"
              @click="clearFilters"
            />
          </div>
        </template>

        <Column field="patient_name" header="Patient" frozen>
          <template #body="{ data }">
            <div class="min-w-[180px] space-y-1">
              <button
                type="button"
                class="block max-w-[220px] truncate text-left font-semibold  hover:underline dark:text-violet-300"
                @click.stop="emit('appointment-click', data)"
              >
                {{ data.patient_name || "Unnamed Patient" }}
              </button>
              <p class="text-xs text-[rgb(var(--app-fg))]/45">
                ID: {{ data.record_id || data.id }}
              </p>
            </div>
          </template>
        </Column>

        <Column field="doctor_name" header="Assigned PT">
          <template #body="{ data }">
            <div class="min-w-[150px]">
              <p class="font-medium text-[rgb(var(--app-fg))]">{{ data.doctor_name || "Unassigned" }}</p>
              <p v-if="!data.doctor_name" class="text-xs text-amber-600 dark:text-amber-300">Needs assignment</p>
            </div>
          </template>
        </Column>

        <Column field="starts_at" header="Schedule">
          <template #body="{ data }">
            <div class="min-w-[170px] space-y-1">
              <p class="font-medium text-[rgb(var(--app-fg))]">{{ formatDateTime(data.starts_at) }}</p>
              <p class="text-xs text-[rgb(var(--app-fg))]/45">
                Ends {{ formatDateTime(data.ends_at) }}
              </p>
            </div>
          </template>
        </Column>

        <Column field="appointment_status" header="Status">
          <template #body="{ data }">
            <Tag
              :value="displayAppointmentStatus(data.appointment_status)"
              :severity="appointmentSeverity(data.appointment_status)"
              rounded
            />
          </template>
        </Column>

        <Column field="appointment_phase" header="Phase">
          <template #body="{ data }">
            <Tag
              :value="displayAppointmentPhase(data.appointment_phase)"
              :severity="appointmentPhaseSeverity(data.appointment_phase)"
              rounded
            />
          </template>
        </Column>

        <Column field="location_context" header="Location">
          <template #body="{ data }">
            <Tag
              :value="displayLocationContext(data.location_context)"
              :severity="appointmentLocationContextSeverity(data.location_context)"
              rounded
            />
          </template>
        </Column>

        <Column field="specialty_tag_name" header="Specialty">
          <template #body="{ data }">
            <div class="min-w-[150px] space-y-1">
              <p class="truncate font-medium">{{ data.specialty_tag_name || "N/A" }}</p>
              <Tag
                v-if="data.specialty_tag_name && data.specialty_tag_is_active === false"
                value="Inactive"
                severity="secondary"
                class="text-xs"
                rounded
              />
            </div>
          </template>
        </Column>

        <Column field="treatment_area_name" header="Clinic Room">
          <template #body="{ data }">
            <div class="min-w-[150px] space-y-1">
              <TreatmentAreaChip
                :name="data.treatment_area_name"
                :color="data.treatment_area_color"
              />
              <Tag
                v-if="data.treatment_area_name && data.treatment_area_is_active === false"
                value="Inactive"
                severity="secondary"
                class="text-xs"
                rounded
              />
            </div>
          </template>
        </Column>

        <Column field="billing_status" header="Billing">
          <template #body="{ data }">
            <Tag
              :value="displayBillingStatus(data.billing_status, data.billing_type)"
              :severity="billingSeverity(data.billing_status, data.billing_type)"
              rounded
            />
          </template>
        </Column>

        <Column field="reschedule_count" header="Reschedules">
          <template #body="{ data }">
            <span class="inline-flex min-w-8 justify-center rounded-full bg-[rgb(var(--app-bg-soft))] px-2 py-1 text-xs font-bold text-[rgb(var(--app-fg))]/70 ring-1 ring-[rgb(var(--app-border))]">
              {{ data.reschedule_count ?? 0 }}
            </span>
          </template>
        </Column>

        <Column header="Actions" frozen alignFrozen="right">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
                            <Button
                v-if="canCancelAppointment(data)"
                size="small"
                text
                rounded
                severity="warn"
                icon="pi pi-ban"
                aria-label="Cancel appointment"
                v-tooltip.top="'Cancel appointment'"
                :loading="isCancellingAppointment(data)"
                :disabled="isCancellingAppointment(data)"
                @click.stop="onCancelAppointment(data)"
              />
              <Button
                size="small"
                text
                rounded
                icon="pi pi-eye"
                aria-label="View appointment"
                v-tooltip.top="'View appointment'"
                @click.stop="emit('appointment-click', data)"
              />
              <Button
                size="small"
                text
                rounded
                icon="pi pi-calendar-plus"
                aria-label="Reschedule appointment"
                v-tooltip.top="'Reschedule appointment'"
                @click.stop="emit('reschedule', data)"
              />

              <!-- <Button
                v-if="canDeleteAppointments"
                size="small"
                text
                rounded
                severity="danger"
                icon="pi pi-trash"
                aria-label="Delete appointment"
                v-tooltip.top="'Delete appointment'"
                @click.stop="emit('delete', data)"
              /> -->
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue"
import { storeToRefs } from "pinia"
import DataTable from "primevue/datatable"
import type { DataTablePageEvent } from "primevue/datatable"
import Column from "primevue/column"
import Tag from "primevue/tag"
import Button from "primevue/button"
import Select from "primevue/select"
import InputText from "primevue/inputtext"
import IftaLabel from "primevue/iftalabel"
import { useToast } from "primevue/usetoast"
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue"
import {
  appointmentPhase1Service,
  type AppointmentListItem,
  type AppointmentLocationContext,
  type AppointmentPhase,
} from "@/features/appointments/api/appointment-phase1.service"
import { exportToExcel } from "@/utils/export-excel.util"
import { getApiErrorMessage, type ApiErrorMessageOptions } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import { defaultPage } from "@/models/paging"
import { Status } from "@/utils/global.type"
import type { Staff } from "@/features/staff/types/staff"
import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"
import { ptInputText, ptOutlinedBtn, ptSelect } from "@/features/shared/table-header.styles"
import { clinicStore } from "@/stores/clinic.store"
import { useAuthSessionStore } from "@/stores/auth-session.store"

const props = defineProps<{
  calendarDate: Date
}>()

const emit = defineEmits<{
  "appointment-click": [appointment: AppointmentListItem]
  reschedule: [appointment: AppointmentListItem]
  delete: [appointment: AppointmentListItem]
  "data-updated": [data: { appointments: AppointmentListItem[]; totalElements: number }]
}>()

const toast = useToast()
const globalClinicStore = clinicStore()
const { selectedClinicId } = storeToRefs(globalClinicStore)
const authSession = useAuthSessionStore()



const canCancelAppointments = computed(() =>
  authSession.hasAnyPermission("Appointment::UPDATE", "Appointment::CANCEL")
)

const appointments = ref<AppointmentListItem[]>([])
const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const isLoading = ref(false)
const cancellingAppointmentIds = ref<Set<number>>(new Set())
let fetchRequestId = 0

const recordFilter = ref("")
const statusFilter = ref<string>()
const phaseFilter = ref<AppointmentPhase>()

type DoctorConsultantFilterValue = number | "UNASSIGNED"

const ptFilter = ref<DoctorConsultantFilterValue>()

const ptDoctorOptions = ref<Array<{ id: number; label: string }>>([])

const ptFilterOptions = computed(() => [
  { label: "Unassigned", value: "UNASSIGNED" as const },
  ...ptDoctorOptions.value.map((option) => ({ label: option.label, value: option.id })),
])

const appointmentStatusOptions = ["Pending", "Completed", "Cancelled"]

const appointmentPhaseOptions: Array<{ label: string; value: AppointmentPhase }> = [
  { label: "Evaluation", value: "EVAL" },
  { label: "Re-Evaluation", value: "RE_EVAL" },
  { label: "Session", value: "SESSION" },
]

const selectedDoctorConsultantId = computed(() =>
  typeof ptFilter.value === "number" ? ptFilter.value : undefined
)

const isUnassignedDoctorConsultantFilter = computed(() => ptFilter.value === "UNASSIGNED")

const selectedDateIso = computed((): string => {
  const date = props.calendarDate

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
})


const selectedDateLabel = computed(() =>
  props.calendarDate.toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
)

const hasActiveFilters = computed(() =>
  !!recordFilter.value.trim() ||
  !!statusFilter.value ||
  !!phaseFilter.value ||
  !!ptFilter.value
)

const tableSummaryLabel = computed(() => {
  const start = totalElements.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, totalElements.value)

  return totalElements.value === 0
    ? "No appointments to show"
    : `Showing ${start}-${end} of ${totalElements.value} appointments`
})

const clearFilters = (): void => {
  recordFilter.value = ""
  statusFilter.value = undefined
  phaseFilter.value = undefined
  ptFilter.value = undefined
  page.value = 1
  void fetchAppointments()
}

const sectionCardClass = "app-appointment-card space-y-4"
const sectionTitleClass = "app-appointment-title text-lg"

const isPhysicalTherapistProviderType = (providerType?: string | null): boolean =>
  String(providerType ?? "").trim().toUpperCase() === "PHYSICAL_THERAPIST"

const normalizeBillingTypeForCalendar = (value?: string): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")

const normalizeAppointmentStatus = (status?: string): string =>
  (status || "PENDING").trim().toUpperCase().split(" ").join("_")

const displayAppointmentStatus = (status?: string): string =>
  normalizeAppointmentStatus(status).split("_").join(" ")

const appointmentSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeAppointmentStatus(status)

  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger"

  return "info"
}

const appointmentPhaseSeverity = (phase?: AppointmentPhase): "info" | "contrast" | "warn" => {
  if (phase === "EVAL") return "info"
  if (phase === "RE_EVAL") return "warn"

  return "contrast"
}

const appointmentLocationContextSeverity = (
  locationContext?: AppointmentLocationContext
): "success" | "warn" => {
  if (locationContext === "HOME_CARE") return "warn"

  return "success"
}

const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"

  return phase ?? "SESSION"
}

const displayLocationContext = (locationContext?: AppointmentLocationContext): string => {
  if (locationContext === "HOME_CARE") return "HOME CARE"

  return "IN-CLINIC"
}

const billingSeverity = (
  status?: string,
  billingType?: string
): "success" | "warn" | "danger" | "info" => {
  const normalized = (status || "UNBILLED").trim().toUpperCase()
  const normalizedBillingType = normalizeBillingTypeForCalendar(billingType)

  if (normalized === "PAID") return "success"

  if (normalized === "BILLED") {
    return normalizedBillingType === "HMO_BILLING" || normalizedBillingType === "LGU_BILLING"
      ? "success"
      : "info"
  }

  if (normalized === "PARTIAL" || normalized === "PENDING" || normalized === "UNBILLED") {
    return "warn"
  }

  if (normalized === "VOID") return "danger"

  return "info"
}

const displayBillingStatus = (status?: string, billingType?: string): string => {
  const normalized = (status?.trim() || "UNBILLED").toUpperCase()
  const normalizedBillingType = normalizeBillingTypeForCalendar(billingType)
  const isHmoOrLgu =
    normalizedBillingType === "HMO_BILLING" || normalizedBillingType === "LGU_BILLING"

  if (normalized === "PAID") return "Paid"
  if (normalized === "BILLED") return "Paid"

  if (normalized === "PARTIAL") {
    return isHmoOrLgu ? "Pending" : "Partial (The patient paid some of current balance)"
  }

  if (normalized === "PENDING" || normalized === "UNBILLED") {
    return isHmoOrLgu ? "Pending" : "Pending (Not yet Billed)"
  }

  if (normalized === "VOID") return "Void"

  return normalized
}

const canCancelAppointment = (appointment: AppointmentListItem): boolean => {
  const status = normalizeAppointmentStatus(appointment.appointment_status)

  return canCancelAppointments.value &&
    status !== "CANCELLED" &&
    status !== "COMPLETED"
}

const getAppointmentId = (appointment: AppointmentListItem): number =>
  Number((appointment as AppointmentListItem & { id: number }).id)

const isCancellingAppointment = (appointment: AppointmentListItem): boolean =>
  cancellingAppointmentIds.value.has(getAppointmentId(appointment))

const setAppointmentCancelling = (appointmentId: number, value: boolean): void => {
  const next = new Set(cancellingAppointmentIds.value)

  if (value) {
    next.add(appointmentId)
  } else {
    next.delete(appointmentId)
  }

  cancellingAppointmentIds.value = next
}

const onCancelAppointment = async (appointment: AppointmentListItem): Promise<void> => {
  const appointmentId = getAppointmentId(appointment)

  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    errorToast(toast, "Invalid appointment selected")
    return
  }

  if (!canCancelAppointment(appointment)) {
    errorToast(toast, "This appointment cannot be cancelled")
    return
  }

  const patientName = String(appointment.patient_name ?? "this appointment").trim() || "this appointment"
  const confirmed = window.confirm(`Cancel ${patientName}? This will mark the appointment as Cancelled.`)

  if (!confirmed) return

  setAppointmentCancelling(appointmentId, true)

  try {
    await pamsAPI.patch<void>(`/appointments/${appointmentId}/status`, {
      appointment_status: "CANCELLED"
    })

    appointments.value = appointments.value.map(item =>
      getAppointmentId(item) === appointmentId
        ? { ...item, appointment_status: "Cancelled" }
        : item
    )

    publishTableData()
    successToast(toast, "Appointment cancelled")
    await fetchAppointments()
  } catch (error: unknown) {
    errorToast(
      toast,
      getApiErrorMessage(error, {
        baseMessage: "Could not cancel appointment",
        permissionHint: "Appointment::UPDATE permission is required to cancel appointments.",
        notFoundHint: "This appointment may no longer exist.",
        invalidInputHint: "Only active, pending, or rescheduled appointments can be cancelled.",
        retryHint: "Refresh the table and try again."
      })
    )
  } finally {
    setAppointmentCancelling(appointmentId, false)
  }
}

const formatDateTime = (value: string | Date): string => new Date(value).toLocaleString()

const resolveTableErrorOptions = (action: "load" | "export"): ApiErrorMessageOptions => {
  if (action === "export") {
    return {
      baseMessage: "Could not export appointments CSV",
      permissionHint: "Appointment::READ and Export permission for the selected clinic",
      notFoundHint: "No exportable appointments were found for the current filters. Try widening the date or status filters.",
      invalidInputHint: "Check filters before exporting: Date, Clinic, Assigned PT, Status, and Phase.",
      retryHint: "Click Export CSV again after adjusting filters."
    }
  }

  return {
    baseMessage: "Could not load appointments",
    permissionHint: "Appointment::READ permission for the selected clinic",
    notFoundHint: "Some selected filters point to records that no longer exist. Clear filters and click Refresh.",
    invalidInputHint: "Check selected Date, Clinic, Assigned PT, Status, and Phase filters.",
    retryHint: "Click Refresh. If it still fails, switch clinic and return."
  }
}

const extractApiErrorMessage = (error: unknown, action: "load" | "export"): string =>
  getApiErrorMessage(error, resolveTableErrorOptions(action))

const publishTableData = (): void => {
  emit("data-updated", {
    appointments: appointments.value,
    totalElements: totalElements.value,
  })
}

const loadPtFilterOptions = async (): Promise<void> => {
  if (!selectedClinicId.value) {
    ptDoctorOptions.value = []
    return
  }

  try {
    const response = await pamsAPI.get<Pageable<Staff>>("/staffs/lookup", {
      params: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined,
        clinic_id: selectedClinicId.value,
      },
    })

    ptDoctorOptions.value = (response.data?.content ?? [])
      .filter(
        (staff: Staff) =>
          isPhysicalTherapistProviderType(staff.appointment_provider_type) ||
          isPhysicalTherapistProviderType(staff.secondary_appointment_provider_type)
      )
      .map((staff: Staff) => ({ id: staff.id, label: staff.name }))

    if (
      typeof ptFilter.value === "number" &&
      !ptDoctorOptions.value.some((option) => option.id === ptFilter.value)
    ) {
      ptFilter.value = undefined
    }
  } catch {
    ptDoctorOptions.value = []

    if (typeof ptFilter.value === "number") {
      ptFilter.value = undefined
    }
  }
}

const fetchAppointments = async (): Promise<void> => {
  const requestId = ++fetchRequestId

  try {
    isLoading.value = true

    const normalizedRecordFilter = recordFilter.value.trim()
    const isRecordSearchActive = !!normalizedRecordFilter

    const response = await appointmentPhase1Service.getAll({
      page: page.value,
      size: pageSize.value,
      clinic_id: isRecordSearchActive ? undefined : selectedClinicId.value,
      doctor_id: isRecordSearchActive ? undefined : selectedDoctorConsultantId.value,
      unassigned: isRecordSearchActive
        ? undefined
        : isUnassignedDoctorConsultantFilter.value || undefined,
      search: normalizedRecordFilter || undefined,
      status: isRecordSearchActive ? undefined : statusFilter.value?.trim() || undefined,
      phase: isRecordSearchActive ? undefined : phaseFilter.value,
      date: isRecordSearchActive ? undefined : selectedDateIso.value,
    })

    if (requestId !== fetchRequestId) return

    appointments.value = response?.content ?? []
    totalElements.value = response?.total_elements ?? 0

    publishTableData()
  } catch (error: unknown) {
    if (requestId !== fetchRequestId) return

    errorToast(
      toast,
      extractApiErrorMessage(error, "load")
    )
  } finally {
    if (requestId === fetchRequestId) {
      isLoading.value = false
    }
  }
}

const refresh = async (): Promise<void> => {
  await fetchAppointments()
}

defineExpose({ refresh })

const onPage = async (event: DataTablePageEvent): Promise<void> => {
  page.value = Math.floor((event.first ?? 0) / (event.rows ?? pageSize.value)) + 1
  pageSize.value = event.rows ?? pageSize.value

  await fetchAppointments()
}

const onSelectRow = (event: { data: AppointmentListItem }): void => {
  emit("appointment-click", event.data)
}

const onExportCsv = async (): Promise<void> => {
  try {
    const normalizedRecordFilter = recordFilter.value.trim()
    const isRecordSearchActive = !!normalizedRecordFilter

    const response = await appointmentPhase1Service.exportCsv({
      clinic_id: isRecordSearchActive ? undefined : selectedClinicId.value,
      doctor_id: isRecordSearchActive ? undefined : selectedDoctorConsultantId.value,
      unassigned: isRecordSearchActive
        ? undefined
        : isUnassignedDoctorConsultantFilter.value || undefined,
      search: normalizedRecordFilter || undefined,
      status: isRecordSearchActive ? undefined : statusFilter.value?.trim() || undefined,
      phase: isRecordSearchActive ? undefined : phaseFilter.value,
      date: isRecordSearchActive ? undefined : selectedDateIso.value,
    })

    if (!response) return

    exportToExcel(response)
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "export"))
  }
}

watch([() => props.calendarDate, statusFilter, phaseFilter], () => {
  page.value = 1
  void fetchAppointments()
})

watch(ptFilter, () => {
  page.value = 1
  void fetchAppointments()
})

let recordFilterDebounceHandle: ReturnType<typeof setTimeout> | undefined

watch(recordFilter, () => {
  page.value = 1

  if (recordFilterDebounceHandle) {
    clearTimeout(recordFilterDebounceHandle)
  }

  recordFilterDebounceHandle = setTimeout(() => {
    void fetchAppointments()
  }, 250)
})

watch(selectedClinicId, async () => {
  fetchRequestId += 1
  appointments.value = []
  totalElements.value = 0
  publishTableData()

  await loadPtFilterOptions()

  page.value = 1
  void fetchAppointments()
})

onMounted(async () => {
  await authSession.ensureLoaded()
  await loadPtFilterOptions()
})
</script>
