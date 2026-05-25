<template>
  <section :class="sectionCardClass">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <h3 :class="sectionTitleClass">
          Appointments Table
        </h3>
        <p class="app-appointment-muted max-w-2xl text-sm leading-6">
          Filter, review, page through, and export appointment records for the selected date.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      <IftaLabel>
        <InputText
          v-model="recordFilter"
          fluid
          placeholder="Search patient or record ID"
          :pt="ptInputText"
        />
        <label>Record Search</label>
      </IftaLabel>

      <IftaLabel>
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

      <IftaLabel>
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

      <IftaLabel>
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

      <div class="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:items-end xl:col-span-2">
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="refresh"
        />

        <Button
          label="Export CSV"
          icon="pi pi-download"
          severity="secondary"
          outlined
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="onExportCsv"
        />
      </div>

      <p
        v-if="recordFilter.trim()"
        class="app-appointment-muted text-xs leading-5 md:col-span-2 xl:col-span-6"
      >
        Record search checks across clinics, assigned PTs, statuses, and dates. Clear the search to return to the selected table filters.
      </p>
    </div>

    <div class="app-appointment-table-shell">
      <DataTable
        :value="appointments"
        dataKey="id"
        paginator
        :rows="pageSize"
        :first="(page - 1) * pageSize"
        :totalRecords="totalElements"
        :loading="isLoading"
        selectionMode="single"
        @page="onPage"
        @rowSelect="onSelectRow"
        :pt="{
          column: {
            headerCell: {
              class: 'app-appointment-table-th'
            },
            bodyCell: {
              class: 'app-appointment-table-td'
            }
          }
        }"
      >
        <template #empty>
          <div class="app-appointment-empty">
            No appointments found for the selected date and filters.
          </div>
        </template>

        <Column field="patient_name" header="Patient" />

        <Column field="doctor_name" header="Assigned PT">
          <template #body="{ data }">
            {{ data.doctor_name || "Unassigned" }}
          </template>
        </Column>

        <Column field="starts_at" header="Start">
          <template #body="{ data }">
            {{ formatDateTime(data.starts_at) }}
          </template>
        </Column>

        <Column field="appointment_status" header="Status">
          <template #body="{ data }">
            <Tag
              :value="displayAppointmentStatus(data.appointment_status)"
              :severity="appointmentSeverity(data.appointment_status)"
            />
          </template>
        </Column>

        <Column field="appointment_phase" header="Phase">
          <template #body="{ data }">
            <Tag
              :value="displayAppointmentPhase(data.appointment_phase)"
              :severity="appointmentPhaseSeverity(data.appointment_phase)"
            />
          </template>
        </Column>

        <Column field="location_context" header="Location">
          <template #body="{ data }">
            <Tag
              :value="displayLocationContext(data.location_context)"
              :severity="appointmentLocationContextSeverity(data.location_context)"
            />
          </template>
        </Column>

        <Column field="specialty_tag_name" header="Specialty">
          <template #body="{ data }">
            <div class="space-y-1">
              <p>{{ data.specialty_tag_name || "N/A" }}</p>

              <Tag
                v-if="data.specialty_tag_name && data.specialty_tag_is_active === false"
                value="Inactive Specialty"
                severity="secondary"
                class="text-xs"
              />
            </div>
          </template>
        </Column>

        <Column field="treatment_area_name" header="Clinic Room">
          <template #body="{ data }">
            <div class="space-y-1">
              <TreatmentAreaChip
                :name="data.treatment_area_name"
                :color="data.treatment_area_color"
              />

              <Tag
                v-if="data.treatment_area_name && data.treatment_area_is_active === false"
                value="Inactive Room"
                severity="secondary"
                class="text-xs"
              />
            </div>
          </template>
        </Column>

        <Column field="billing_status" header="Billing Status">
          <template #body="{ data }">
            <Tag
              :value="displayBillingStatus(data.billing_status, data.billing_type)"
              :severity="billingSeverity(data.billing_status, data.billing_type)"
            />
          </template>
        </Column>

        <Column field="reschedule_count" header="Reschedules">
          <template #body="{ data }">
            <span class="font-medium">
              {{ data.reschedule_count }}
            </span>
          </template>
        </Column>

        <Column header="Actions">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button
                size="small"
                text
                rounded
                icon="pi pi-eye"
                aria-label="View appointment"
                @click.stop="emit('appointment-click', data)"
              />

              <Button
                size="small"
                text
                rounded
                icon="pi pi-calendar-plus"
                aria-label="Reschedule appointment"
                @click.stop="emit('reschedule', data)"
              />

              <Button
                v-if="canDeleteAppointments"
                size="small"
                text
                rounded
                severity="danger"
                icon="pi pi-trash"
                aria-label="Delete appointment"
                @click.stop="emit('delete', data)"
              />
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
import { errorToast } from "@/utils/toast.util"
import { defaultPage } from "@/models/paging"
import { Status } from "@/utils/global.type"
import type { Staff } from "@/features/staff/types/staff"
import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"
import { ptInputText, ptOutlinedBtn, ptSelect } from "@/features/shared/table-header.styles"
import { hasAnyStoredPermission, readStoredAuthSnapshot } from "@/utils/auth-user.util"
import { clinicStore } from "@/stores/clinic.store"

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

// Permissions
const permissionSet = ref<Set<string>>(new Set())
const canDeleteAppointments = computed(() =>
  hasAnyStoredPermission(permissionSet.value, "Appointment::DELETE")
)

// Table state
const appointments = ref<AppointmentListItem[]>([])
const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const isLoading = ref(false)
let fetchRequestId = 0

// Filter state
const recordFilter = ref("")
const statusFilter = ref<string>()
const phaseFilter = ref<AppointmentPhase>()
type DoctorConsultantFilterValue = number | "UNASSIGNED"
const ptFilter = ref<DoctorConsultantFilterValue>()

// PT filter options
const ptDoctorOptions = ref<Array<{ id: number; label: string }>>([])
const ptFilterOptions = computed(() => [
  { label: "Unassigned", value: "UNASSIGNED" as const },
  ...ptDoctorOptions.value.map((o) => ({ label: o.label, value: o.id })),
])

// Static options
const appointmentStatusOptions = ["Pending", "Rescheduled", "No show", "Cancelled", "Completed"]
const appointmentPhaseOptions: Array<{ label: string; value: AppointmentPhase }> = [
  { label: "Evaluation", value: "EVAL" },
  { label: "Re-Evaluation", value: "RE_EVAL" },
  { label: "Session", value: "SESSION" },
]

// Derived computeds
const selectedDoctorConsultantId = computed(() =>
  typeof ptFilter.value === "number" ? ptFilter.value : undefined
)
const isUnassignedDoctorConsultantFilter = computed(() => ptFilter.value === "UNASSIGNED")
const selectedDateIso = computed((): string => {
  const d = props.calendarDate
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
})

// Styles
const sectionCardClass = "app-appointment-card space-y-4"
const sectionTitleClass = "app-appointment-title text-lg"

// Formatter helpers
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
  if (normalized === "PARTIAL" || normalized === "PENDING" || normalized === "UNBILLED")
    return "warn"
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
    return isHmoOrLgu ? "Pending" : "Partial (The patient payed some of current balance)"
  }
  if (normalized === "PENDING" || normalized === "UNBILLED") {
    return isHmoOrLgu ? "Pending" : "Pending (Not yet Billed)"
  }
  if (normalized === "VOID") return "Void"
  return normalized
}

const formatDateTime = (value: string | Date): string => new Date(value).toLocaleString()

// Error helper
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

// Load PT filter staff from API
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
        (s: Staff) =>
          isPhysicalTherapistProviderType(s.appointment_provider_type) ||
          isPhysicalTherapistProviderType(s.secondary_appointment_provider_type)
      )
      .map((s: Staff) => ({ id: s.id, label: s.name }))
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

// Fetch appointments
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

// Watchers
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
  const snapshot = readStoredAuthSnapshot()
  permissionSet.value = snapshot.permissions
  // Initial data fetch is triggered by parent's onMounted calling refresh() after clinics are loaded
  await loadPtFilterOptions()
})
</script>
