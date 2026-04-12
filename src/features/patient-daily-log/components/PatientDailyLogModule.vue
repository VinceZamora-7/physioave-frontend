<template>
  <main class="app-page-shell space-y-5">
    <section class="rounded-3xl border border-[#A91D8B]/25 bg-[linear-gradient(120deg,rgba(36,39,87,0.14),rgba(94,24,105,0.10),rgba(169,29,139,0.18))] p-5 shadow-[0_18px_40px_rgba(36,39,87,0.10)]">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Patient Daily Log Dashboard</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Review one day of attendance, PT completion, and patient sign-off without opening each appointment one by one.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Date: {{ selectedDateLabel }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Clinic: {{ selectedClinicLabel }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Primary PT: {{ selectedDoctorLabel }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Today" icon="pi pi-calendar" outlined :pt="ptOutlinedBtn" @click="resetToToday" />
          <Button label="Refresh" icon="pi pi-refresh" :loading="isLoading" :pt="ptPrimaryBtn" @click="refreshDailyLog" />
        </div>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Log Date</label>
          <DatePicker
            v-model="selectedDate"
            showIcon
            fluid
            :manualInput="false"
            dateFormat="mm/dd/yy"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Clinic Branch</label>
          <Select
            v-model="selectedClinicId"
            :options="clinicFilterOptions"
            optionLabel="label"
            optionValue="value"
            fluid
            filter
            placeholder="All clinics"
            :pt="ptSelect"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Primary PT</label>
          <Select
            v-model="selectedDoctorId"
            :options="doctorFilterOptions"
            optionLabel="label"
            optionValue="value"
            fluid
            filter
            placeholder="All primary PT"
            :pt="ptSelect"
          />
        </div>

        <div class="space-y-2 xl:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Search</label>
          <InputText
            v-model="searchText"
            fluid
            placeholder="Patient name, record ID, primary PT, assistant PT, intern, or slip number"
            :pt="ptInputText"
          />
        </div>
      </div>

      <p class="text-sm opacity-70">
        This digital view mirrors the paper daily log but adds live PT and patient signature previews for faster attendance review.
      </p>
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <article v-for="card in summaryCards" :key="card.label" class="app-section-card-comfy space-y-1">
        <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
        <div class="text-2xl font-semibold">{{ card.value }}</div>
        <div class="text-xs opacity-60">{{ card.caption }}</div>
      </article>
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="app-section-title">Attendance Summary</h3>
          <p class="text-sm opacity-70">
            PT sign-off indicates session completion. Patient sign-off indicates the encounter ticket was processed.
          </p>
        </div>
        <div class="text-sm opacity-70">
          {{ dailyLog?.summary.total_entries ?? 0 }} entr{{ dailyLog?.summary.total_entries === 1 ? "y" : "ies" }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <DataTable
          :value="dailyLog?.items ?? []"
          dataKey="id"
          paginator
          :rows="10"
          size="small"
          :loading="isLoading"
          scrollable
        >
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">
              No attendance records matched the selected filters for {{ selectedDateLabel }}.
            </div>
          </template>

          <Column header="#" style="width: 56px">
            <template #body="{ index }">
              <span class="text-sm font-medium opacity-70">{{ index + 1 }}</span>
            </template>
          </Column>

          <Column header="Patient" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold">{{ data.patient_name }}</div>
                <div class="text-xs opacity-65">{{ data.patient_public_id }}</div>
                <div class="text-xs opacity-65">{{ data.public_id }}</div>
              </div>
            </template>
          </Column>

          <Column header="Schedule" style="min-width: 220px">
            <template #body="{ data }">
              <div class="space-y-2">
                <div class="font-medium">{{ formatTimeRange(data.starts_at, data.ends_at) }}</div>
                <div class="text-xs opacity-65">{{ formatFullDate(data.starts_at) }}</div>
                <div class="flex flex-wrap gap-2">
                  <Tag :value="displayAppointmentPhase(data.appointment_phase)" :severity="appointmentPhaseSeverity(data.appointment_phase)" />
                  <Tag :value="displayAppointmentStatus(data.appointment_status)" :severity="appointmentStatusSeverity(data.appointment_status)" />
                </div>
              </div>
            </template>
          </Column>

          <Column header="Log In / Out" style="min-width: 190px">
            <template #body="{ data }">
              <div class="space-y-2 text-sm">
                <div>
                  <div class="text-[11px] uppercase tracking-wide opacity-55">Log In</div>
                  <div class="font-medium">{{ formatOptionalDateTime(data.attended_at) }}</div>
                </div>
                <div>
                  <div class="text-[11px] uppercase tracking-wide opacity-55">Log Out</div>
                  <div class="font-medium">{{ formatOptionalDateTime(data.signed_off_at) }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Branch / Visit Type" style="min-width: 200px">
            <template #body="{ data }">
              <div class="space-y-2">
                <div class="font-medium">{{ data.clinic_name || "No clinic assigned" }}</div>
                <div class="flex flex-wrap gap-2">
                  <Tag :value="displayLocationContext(data.location_context)" :severity="locationSeverity(data.location_context)" />
                  <Tag :value="displayBillingStatus(data.billing_status)" :severity="billingSeverity(data.billing_status)" />
                </div>
                <div v-if="data.slip_number" class="text-xs opacity-65">Slip: {{ data.slip_number }}</div>
              </div>
            </template>
          </Column>

          <Column header="Primary PT" style="min-width: 200px">
            <template #body="{ data }">
              <div class="space-y-2">
                <div class="font-medium">{{ providerLabel(data) }}</div>
                <div class="text-xs opacity-65">
                  PT signed: {{ formatOptionalDateTime(data.pt_confirmed_at) }}
                </div>
                <div v-if="data.pt_completion_tag" class="text-xs opacity-65">
                  Note: {{ data.pt_completion_tag }}
                </div>
              </div>
            </template>
          </Column>

          <Column header="Assistant PT / Intern" style="min-width: 190px">
            <template #body="{ data }">
              <div v-if="data.support_staff_name" class="space-y-2">
                <div class="font-medium">{{ data.support_staff_name }}</div>
                <div class="text-xs opacity-65">{{ data.support_staff_role_name || 'Support staff' }}</div>
                <Button
                  label="View details"
                  icon="pi pi-eye"
                  text
                  size="small"
                  class="px-0"
                  @click="openSupportStaffDetails(data)"
                />
              </div>
              <div v-else class="text-xs opacity-60">No assistant PT or intern assigned</div>
            </template>
          </Column>

          <Column header="Primary PT Signature" style="min-width: 180px">
            <template #body="{ data }">
              <button
                v-if="data.pt_signature_data_url"
                type="button"
                class="w-full rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-2 text-left transition hover:border-[#A91D8B]/40 hover:shadow-sm"
                @click="openSignaturePreview('PT Signature', data.pt_signature_data_url, providerLabel(data))"
              >
                <img :src="data.pt_signature_data_url" alt="PT signature preview" class="h-16 w-full rounded-xl object-contain bg-white/80" />
                <div class="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Signed</div>
              </button>
              <div v-else class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-3 py-5 text-center text-xs opacity-60">
                PT signature pending
              </div>
            </template>
          </Column>

          <Column header="Patient Signature" style="min-width: 180px">
            <template #body="{ data }">
              <button
                v-if="data.patient_signature_data_url"
                type="button"
                class="w-full rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-2 text-left transition hover:border-[#A91D8B]/40 hover:shadow-sm"
                @click="openSignaturePreview('Patient Signature', data.patient_signature_data_url, data.patient_name)"
              >
                <img :src="data.patient_signature_data_url" alt="Patient signature preview" class="h-16 w-full rounded-xl object-contain bg-white/80" />
                <div class="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Signed</div>
              </button>
              <div v-else class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-3 py-5 text-center text-xs opacity-60">
                Patient signature pending
              </div>
            </template>
          </Column>

          <Column header="Session Status" style="min-width: 210px">
            <template #body="{ data }">
              <div class="space-y-2">
                <div class="flex flex-wrap gap-2">
                  <Tag :value="displaySignatureState(data.signature_state)" :severity="signatureStateSeverity(data.signature_state)" />
                  <Tag v-if="data.record_locked" value="Locked" severity="contrast" />
                  <Tag v-if="data.attendance_status" :value="data.attendance_status" :severity="data.attendance_status === 'ATTENDED' ? 'success' : 'danger'" />
                </div>
                <div class="text-xs opacity-65">
                  Patient sign-off: {{ formatOptionalDateTime(data.signed_off_at) }}
                </div>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

    <Dialog
      v-model:visible="signaturePreviewVisible"
      modal
      :header="signaturePreview?.title || 'Signature Preview'"
      :style="{ width: '520px' }"
      :breakpoints="{ '1024px': '92vw', '768px': '100vw' }"
    >
      <div v-if="signaturePreview" class="space-y-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-sm font-medium">{{ signaturePreview.subtitle }}</div>
          <div class="mt-4 rounded-2xl border border-[rgb(var(--app-border))] bg-white p-4">
            <img :src="signaturePreview.imageUrl" :alt="signaturePreview.title" class="mx-auto max-h-[320px] w-full object-contain" />
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="supportStaffDetailsVisible"
      modal
      header="Assistant PT / Intern Details"
      :style="{ width: '540px' }"
      :breakpoints="{ '1024px': '92vw', '768px': '100vw' }"
    >
      <div v-if="selectedSupportStaffEntry" class="space-y-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div class="text-[11px] uppercase tracking-wide opacity-55">Primary PT</div>
              <div class="mt-1 font-medium">{{ providerLabel(selectedSupportStaffEntry) }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wide opacity-55">Assistant PT / Intern</div>
              <div class="mt-1 font-medium">{{ selectedSupportStaffEntry.support_staff_name || 'N/A' }}</div>
              <div class="text-xs opacity-65">{{ selectedSupportStaffEntry.support_staff_role_name || 'Support staff' }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wide opacity-55">Patient</div>
              <div class="mt-1 font-medium">{{ selectedSupportStaffEntry.patient_name }}</div>
              <div class="text-xs opacity-65">{{ selectedSupportStaffEntry.patient_public_id }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wide opacity-55">Schedule</div>
              <div class="mt-1 font-medium">{{ formatTimeRange(selectedSupportStaffEntry.starts_at, selectedSupportStaffEntry.ends_at) }}</div>
              <div class="text-xs opacity-65">{{ formatFullDate(selectedSupportStaffEntry.starts_at) }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wide opacity-55">Clinic</div>
              <div class="mt-1 font-medium">{{ selectedSupportStaffEntry.clinic_name || 'No clinic assigned' }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wide opacity-55">Visit Type</div>
              <div class="mt-1 flex flex-wrap gap-2">
                <Tag :value="displayAppointmentPhase(selectedSupportStaffEntry.appointment_phase)" :severity="appointmentPhaseSeverity(selectedSupportStaffEntry.appointment_phase)" />
                <Tag :value="displayLocationContext(selectedSupportStaffEntry.location_context)" :severity="locationSeverity(selectedSupportStaffEntry.location_context)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue"
import {useToast} from "primevue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import {
  appointmentPhase1Service,
  type AppointmentDailyLogItem,
  type AppointmentDailyLogResponse,
  type AppointmentDailyLogSignatureState,
  type AppointmentLocationContext,
  type AppointmentPhase
} from "@/features/appointments/api/appointment-phase1.service"
import {clinicService} from "@/features/clinics/api/clinic.service"
import type {Clinic} from "@/features/clinics/types/clinic"
import {ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect} from "@/features/shared/table-header.styles"
import {staffService} from "@/features/staff/api/staff.service"
import type {Staff} from "@/features/staff/types/staff"
import {defaultPage} from "@/models/paging"
import {Status} from "@/utils/global.type"
import {errorToast} from "@/utils/toast.util"

const toast = useToast()

type SelectOption = {
  label: string
  value: number | null
}

type SignaturePreviewState = {
  title: string
  subtitle: string
  imageUrl: string
}

const isLoading = ref(false)
const selectedDate = ref(new Date())
const selectedClinicId = ref<number | null>(null)
const selectedDoctorId = ref<number | null>(null)
const searchText = ref("")
const dailyLog = ref<AppointmentDailyLogResponse>()
const clinics = ref<Clinic[]>([])
const clinicalProviders = ref<Staff[]>([])
const signaturePreviewVisible = ref(false)
const signaturePreview = ref<SignaturePreviewState>()
const supportStaffDetailsVisible = ref(false)
const selectedSupportStaffEntry = ref<AppointmentDailyLogItem>()

const selectedDateLabel = computed(() =>
  selectedDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const selectedClinicLabel = computed(() => {
  if (selectedClinicId.value == null) return "All clinics"
  return clinics.value.find((clinic) => clinic.id === selectedClinicId.value)?.name || "Selected clinic"
})

const selectedDoctorLabel = computed(() => {
  if (selectedDoctorId.value == null) return "All primary PT"
  return clinicalProviders.value.find((provider) => provider.id === selectedDoctorId.value)?.name || "Selected primary PT"
})

const clinicFilterOptions = computed<SelectOption[]>(() => [
  {label: "All clinics", value: null},
  ...clinics.value.map((clinic) => ({
    label: clinic.name,
    value: clinic.id
  }))
])

const doctorFilterOptions = computed<SelectOption[]>(() => {
  const filteredProviders = selectedClinicId.value == null
    ? clinicalProviders.value
    : clinicalProviders.value.filter((provider) => provider.clinic_id === selectedClinicId.value)

  return [
    {label: "All primary PT", value: null},
    ...filteredProviders.map((provider) => ({
      label: provider.name,
      value: provider.id
    }))
  ]
})

const summaryCards = computed(() => {
  const summary = dailyLog.value?.summary
  return [
    {
      label: "Total Entries",
      value: summary?.total_entries ?? 0,
      caption: "All scheduled records for the selected day"
    },
    {
      label: "Completed Sessions",
      value: summary?.completed_count ?? 0,
      caption: "Appointments already marked completed"
    },
    {
      label: "Fully Signed",
      value: summary?.fully_signed_count ?? 0,
      caption: "Both PT and patient signatures captured"
    },
    {
      label: "Patient Signed",
      value: summary?.patient_signature_count ?? 0,
      caption: "Encounter tickets already acknowledged"
    },
    {
      label: "PT Signed",
      value: summary?.pt_signature_count ?? 0,
      caption: "PT completion already confirmed"
    },
    {
      label: "Pending",
      value: summary?.pending_signature_count ?? 0,
      caption: "Still missing one or both signatures"
    }
  ]
})

const toDateParam = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatFullDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  })

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  })

const formatTimeRange = (startsAt: string, endsAt: string): string =>
  `${formatTime(startsAt)} - ${formatTime(endsAt)}`

const formatOptionalDateTime = (value?: string): string =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : "--"

const providerLabel = (row: AppointmentDailyLogItem): string =>
  row.pt_confirmed_by_name?.trim() || row.doctor_name?.trim() || "Unassigned provider"

const openSupportStaffDetails = (row: AppointmentDailyLogItem): void => {
  selectedSupportStaffEntry.value = row
  supportStaffDetailsVisible.value = true
}

const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}

const displayAppointmentStatus = (status?: string): string =>
  String(status ?? "PENDING").trim().toUpperCase().split("_").join(" ")

const displayLocationContext = (locationContext?: AppointmentLocationContext): string =>
  locationContext === "HOME_CARE" ? "HOME CARE" : "IN-CLINIC"

const displayBillingStatus = (status?: string): string =>
  (status?.trim() || "UNBILLED").toUpperCase()

const displaySignatureState = (state: AppointmentDailyLogSignatureState): string => {
  switch (state) {
    case "PATIENT_SIGNED":
      return "Patient Signed"
    case "PT_SIGNED":
      return "PT Signed"
    case "FULLY_SIGNED":
      return "Fully Signed"
    case "NO_SHOW":
      return "No Show"
    default:
      return "Pending"
  }
}

const appointmentStatusSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = String(status ?? "PENDING").trim().toUpperCase().split(" ").join("_")
  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger"
  return "info"
}

const appointmentPhaseSeverity = (phase?: AppointmentPhase): "contrast" | "info" | "warn" => {
  if (phase === "EVAL") return "info"
  if (phase === "RE_EVAL") return "warn"
  return "contrast"
}

const locationSeverity = (locationContext?: AppointmentLocationContext): "success" | "warn" =>
  locationContext === "HOME_CARE" ? "warn" : "success"

const billingSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = displayBillingStatus(status)
  if (normalized === "PAID" || normalized === "BILLED") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}

const signatureStateSeverity = (state: AppointmentDailyLogSignatureState): "success" | "warn" | "danger" | "info" => {
  switch (state) {
    case "FULLY_SIGNED":
      return "success"
    case "PATIENT_SIGNED":
    case "PT_SIGNED":
      return "info"
    case "NO_SHOW":
      return "danger"
    default:
      return "warn"
  }
}

const loadLookups = async (): Promise<void> => {
  const [clinicsResponse, staffResponse] = await Promise.all([
    clinicService.getAll({
      page: defaultPage,
      size: 100,
      status: Status.ACTIVE,
      name: undefined
    }),
    staffService.getAll({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: 200,
        status: Status.ACTIVE,
        name: undefined
      }
    })
  ])

  clinics.value = clinicsResponse?.content ?? []
  clinicalProviders.value = (staffResponse?.content ?? []).filter((staff) =>
    staff.appointment_provider_type === "PHYSICAL_THERAPIST" || staff.appointment_provider_type === "DOCTOR_CONSULTANT"
  )
}

const refreshDailyLog = async (): Promise<void> => {
  try {
    isLoading.value = true
    dailyLog.value = await appointmentPhase1Service.getDailyLog({
      date: toDateParam(selectedDate.value),
      clinic_id: selectedClinicId.value ?? undefined,
      doctor_id: selectedDoctorId.value ?? undefined,
      search: searchText.value.trim() || undefined
    })
  } catch {
    errorToast(toast, "Failed to load patient daily log")
  } finally {
    isLoading.value = false
  }
}

const resetToToday = (): void => {
  selectedDate.value = new Date()
}

const openSignaturePreview = (title: string, imageUrl: string, subtitle: string): void => {
  signaturePreview.value = {
    title,
    subtitle,
    imageUrl
  }
  signaturePreviewVisible.value = true
}

watch(selectedClinicId, (clinicId) => {
  if (clinicId == null) return
  const providerExists = doctorFilterOptions.value.some((option) => option.value === selectedDoctorId.value)
  if (!providerExists) {
    selectedDoctorId.value = null
  }
})

watch([selectedDate, selectedClinicId, selectedDoctorId], () => {
  void refreshDailyLog()
})

let searchDebounceHandle: ReturnType<typeof setTimeout> | undefined
watch(searchText, () => {
  if (searchDebounceHandle) {
    clearTimeout(searchDebounceHandle)
  }

  searchDebounceHandle = setTimeout(() => {
    void refreshDailyLog()
  }, 250)
})

onMounted(async () => {
  await loadLookups()
  await refreshDailyLog()
})
</script>
