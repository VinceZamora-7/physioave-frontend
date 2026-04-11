<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue"
import {useConfirm, useToast} from "primevue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import {
  appointmentPhase1Service,
  type AppointmentDailyLogItem,
  type AppointmentDailyLogResponse,
  type AppointmentDailyLogSignatureState,
  type AppointmentLocationContext,
  type AppointmentPhase,
  type PtCompletedSessionsReport,
  type ReferringDoctorCompletedSessionsReport
} from "@/features/appointments/api/appointment-phase1.service"
import {billingPhase1Service, type DailyIncomeExpenseReport} from "@/features/billing/api/billing-phase1.service"
import {clinicService} from "@/features/clinics/api/clinic.service"
import type {Clinic} from "@/features/clinics/types/clinic"
import {ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect} from "@/features/shared/table-header.styles"
import {staffService} from "@/features/staff/api/staff.service"
import type {Staff} from "@/features/staff/types/staff"
import {defaultPage} from "@/models/paging"
import {Status} from "@/utils/global.type"
import {errorToast, successToast} from "@/utils/toast.util"

const toast = useToast()
const confirm = useConfirm()

// ── Tab state ──────────────────────────────────────────────────────────────
const activeTab = ref(0)
const tabs = [
  {id: 0, label: "Daily Log", icon: "pi-clipboard"},
  {id: 1, label: "Daily Finance", icon: "pi-receipt"},
  {id: 2, label: "Referring Doctors", icon: "pi-id-card"},
  {id: 3, label: "PT Performance", icon: "pi-star"},
]

// ── Shared helpers ─────────────────────────────────────────────────────────
const toDateParam = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDate = (value: Date): string =>
  value.toLocaleDateString("en-PH", {year: "numeric", month: "short", day: "numeric"})

const asCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP", maximumFractionDigits: 2}).format(Number(value ?? 0))

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {hour: "numeric", minute: "2-digit"})

const formatTimeRange = (startsAt: string, endsAt: string): string =>
  `${formatTime(startsAt)} – ${formatTime(endsAt)}`

const formatFullDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-PH", {weekday: "short", month: "short", day: "numeric", year: "numeric"})

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("en-PH", {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"})

const formatOptionalDateTime = (value?: string): string => (value ? formatDateTime(value) : "--")

// ── TAB 0 – DAILY LOG ──────────────────────────────────────────────────────
type SelectOption = {label: string; value: number | null}
type SignaturePreviewState = {title: string; subtitle: string; imageUrl: string}

const logIsLoading = ref(false)
const logDate = ref(new Date())
const logClinicId = ref<number | null>(null)
const logDoctorId = ref<number | null>(null)
const logSearchText = ref("")
const dailyLog = ref<AppointmentDailyLogResponse>()
const clinics = ref<Clinic[]>([])
const clinicalProviders = ref<Staff[]>([])
const signaturePreviewVisible = ref(false)
const signaturePreview = ref<SignaturePreviewState>()

const logDateLabel = computed(() =>
  logDate.value.toLocaleDateString("en-PH", {weekday: "long", year: "numeric", month: "long", day: "numeric"})
)

const clinicFilterOptions = computed<SelectOption[]>(() => [
  {label: "All clinics", value: null},
  ...clinics.value.map((c) => ({label: c.name, value: c.id}))
])

const doctorFilterOptions = computed<SelectOption[]>(() => {
  const filtered = logClinicId.value == null
    ? clinicalProviders.value
    : clinicalProviders.value.filter((p) => p.clinic_id === logClinicId.value)
  return [
    {label: "All providers", value: null},
    ...filtered.map((p) => ({label: p.name, value: p.id}))
  ]
})

const logSummaryCards = computed(() => {
  const s = dailyLog.value?.summary
  return [
    {label: "Total Entries", value: s?.total_entries ?? 0, caption: "All scheduled records for the day"},
    {label: "Completed", value: s?.completed_count ?? 0, caption: "Sessions marked completed"},
    {label: "Fully Signed", value: s?.fully_signed_count ?? 0, caption: "Both PT & patient signatures"},
    {label: "Patient Signed", value: s?.patient_signature_count ?? 0, caption: "Patient acknowledged"},
    {label: "PT Signed", value: s?.pt_signature_count ?? 0, caption: "PT completion confirmed"},
    {label: "Pending", value: s?.pending_signature_count ?? 0, caption: "Still missing signatures"},
  ]
})

const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}
const displayAppointmentStatus = (status?: string): string =>
  String(status ?? "PENDING").trim().toUpperCase().split("_").join(" ")
const displayLocationContext = (lc?: AppointmentLocationContext): string =>
  lc === "HOME_CARE" ? "HOME CARE" : "IN-CLINIC"
const displayBillingStatus = (status?: string): string => (status?.trim() || "UNBILLED").toUpperCase()
const displaySignatureState = (state: AppointmentDailyLogSignatureState): string => {
  switch (state) {
    case "PATIENT_SIGNED": return "Patient Signed"
    case "PT_SIGNED": return "PT Signed"
    case "FULLY_SIGNED": return "Fully Signed"
    case "NO_SHOW": return "No Show"
    default: return "Pending"
  }
}
const appointmentStatusSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const n = String(status ?? "PENDING").trim().toUpperCase().split(" ").join("_")
  if (n === "COMPLETED") return "success"
  if (n === "RESCHEDULED") return "warn"
  if (n === "CANCELLED" || n === "NO_SHOW") return "danger"
  return "info"
}
const appointmentPhaseSeverity = (phase?: AppointmentPhase): "contrast" | "info" | "warn" => {
  if (phase === "EVAL") return "info"
  if (phase === "RE_EVAL") return "warn"
  return "contrast"
}
const locationSeverity = (lc?: AppointmentLocationContext): "success" | "warn" =>
  lc === "HOME_CARE" ? "warn" : "success"
const billingSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const n = displayBillingStatus(status)
  if (n === "PAID" || n === "BILLED") return "success"
  if (n === "PARTIAL" || n === "PENDING") return "warn"
  if (n === "VOID") return "danger"
  return "info"
}
const signatureStateSeverity = (state: AppointmentDailyLogSignatureState): "success" | "warn" | "danger" | "info" => {
  switch (state) {
    case "FULLY_SIGNED": return "success"
    case "PATIENT_SIGNED":
    case "PT_SIGNED": return "info"
    case "NO_SHOW": return "danger"
    default: return "warn"
  }
}
const providerLabel = (row: AppointmentDailyLogItem): string =>
  row.pt_confirmed_by_name?.trim() || row.doctor_name?.trim() || "Unassigned provider"

const openSignaturePreview = (title: string, imageUrl: string, subtitle: string): void => {
  signaturePreview.value = {title, subtitle, imageUrl}
  signaturePreviewVisible.value = true
}

const refreshDailyLog = async (): Promise<void> => {
  try {
    logIsLoading.value = true
    dailyLog.value = await appointmentPhase1Service.getDailyLog({
      date: toDateParam(logDate.value),
      clinic_id: logClinicId.value ?? undefined,
      doctor_id: logDoctorId.value ?? undefined,
      search: logSearchText.value.trim() || undefined
    })
  } catch {
    errorToast(toast, "Failed to load patient daily log")
  } finally {
    logIsLoading.value = false
  }
}

const loadLookups = async (): Promise<void> => {
  const [clinicsRes, staffRes] = await Promise.all([
    clinicService.getAll({page: defaultPage, size: 100, status: Status.ACTIVE, name: undefined}),
    staffService.getAll({clinic_id: undefined, pageable_request: {page: defaultPage, size: 200, status: Status.ACTIVE, name: undefined}})
  ])
  clinics.value = clinicsRes?.content ?? []
  clinicalProviders.value = (staffRes?.content ?? []).filter(
    (s) => s.appointment_provider_type === "PHYSICAL_THERAPIST" || s.appointment_provider_type === "DOCTOR_CONSULTANT"
  )
}

// ── TAB 1 – DAILY FINANCE ──────────────────────────────────────────────────
const financeIsLoading = ref(false)
const financeIsSavingExpense = ref(false)
const financeDate = ref(new Date())
const financeReport = ref<DailyIncomeExpenseReport>()
const expenseForm = ref({item_name: "", amount: 0, notes: ""})

const financeDateLabel = computed(() =>
  financeDate.value.toLocaleDateString("en-PH", {weekday: "long", year: "numeric", month: "long", day: "numeric"})
)

const financeSummaryCards = computed(() => [
  {label: "Gross Daily Charges", value: asCurrency(financeReport.value?.summary.gross_income ?? 0), caption: "Total billed value for the day"},
  {label: "Cash Collected", value: asCurrency(financeReport.value?.summary.cash_collected ?? 0), caption: "Actual payments received"},
  {label: "Outstanding", value: asCurrency(financeReport.value?.summary.outstanding_balance ?? 0), caption: "Remaining balance across entries"},
  {label: "Expenses", value: asCurrency(financeReport.value?.summary.expense_total ?? 0), caption: "Manually entered operating expenses"},
  {label: "Net Cash", value: asCurrency(financeReport.value?.summary.net_cash ?? 0), caption: "Cash collected minus expenses"},
])

const billingRouteSeverity = (value: string): "success" | "info" | "warn" | "contrast" => {
  const n = value.trim().toUpperCase()
  if (n === "HMO") return "info"
  if (n === "LGU") return "warn"
  if (n === "PACKAGE") return "contrast"
  return "success"
}

const refreshFinanceReport = async (): Promise<void> => {
  try {
    financeIsLoading.value = true
    financeReport.value = await billingPhase1Service.getDailyIncomeExpense(toDateParam(financeDate.value))
  } catch {
    errorToast(toast, "Failed to load daily finance report")
  } finally {
    financeIsLoading.value = false
  }
}

const resetExpenseForm = (): void => {
  expenseForm.value = {item_name: "", amount: 0, notes: ""}
}

const saveExpense = async (): Promise<void> => {
  if (!expenseForm.value.item_name.trim()) {
    errorToast(toast, "Expense item name is required")
    return
  }
  if (!Number(expenseForm.value.amount)) {
    errorToast(toast, "Expense amount must be greater than zero")
    return
  }
  try {
    financeIsSavingExpense.value = true
    await billingPhase1Service.addDailyExpense({
      expense_date: toDateParam(financeDate.value),
      item_name: expenseForm.value.item_name.trim(),
      amount: Number(expenseForm.value.amount ?? 0),
      notes: expenseForm.value.notes.trim() || undefined
    })
    successToast(toast, "Expense added")
    resetExpenseForm()
    await refreshFinanceReport()
  } catch {
    errorToast(toast, "Failed to save expense")
  } finally {
    financeIsSavingExpense.value = false
  }
}

const confirmDeleteExpense = (id: number, itemName: string): void => {
  confirm.require({
    message: `Delete expense entry for ${itemName}?`,
    header: "Delete Expense",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {label: "Cancel", severity: "secondary", outlined: true},
    acceptProps: {label: "Delete", severity: "danger", icon: "pi pi-trash"},
    accept: async () => {
      try {
        await billingPhase1Service.deleteDailyExpense(id)
        successToast(toast, "Expense deleted")
        await refreshFinanceReport()
      } catch {
        errorToast(toast, "Failed to delete expense")
      }
    }
  })
}

// ── TAB 2 – REFERRING DOCTOR SESSIONS ─────────────────────────────────────
const referringIsLoading = ref(false)
const referringDateRange = ref<Date[] | null>(null)
const referringReport = ref<ReferringDoctorCompletedSessionsReport>()

const initReferringDateRange = (): void => {
  if (referringDateRange.value && referringDateRange.value.length === 2) return
  const today = new Date()
  referringDateRange.value = [new Date(today.getFullYear(), today.getMonth(), 1), today]
}

const referringRangeLabel = computed(() => {
  const range = referringDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) return "Select a complete date range"
  return `${formatDate(range[0])} to ${formatDate(range[1])}`
})

const refreshReferringReport = async (): Promise<void> => {
  const range = referringDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) {
    errorToast(toast, "Please select a start and end date")
    return
  }
  if (range[0].getTime() > range[1].getTime()) {
    errorToast(toast, "Start date must be on or before end date")
    return
  }
  try {
    referringIsLoading.value = true
    referringReport.value = await appointmentPhase1Service.getCompletedSessionsByReferringDoctor(
      toDateParam(range[0]), toDateParam(range[1])
    )
  } catch {
    errorToast(toast, "Failed to load referring doctor sessions report")
  } finally {
    referringIsLoading.value = false
  }
}

// ── TAB 3 – PT PERFORMANCE ────────────────────────────────────────────────
const ptIsLoading = ref(false)
const ptDateRange = ref<Date[] | null>(null)
const ptReport = ref<PtCompletedSessionsReport>()

const initPtDateRange = (): void => {
  if (ptDateRange.value && ptDateRange.value.length === 2) return
  const today = new Date()
  ptDateRange.value = [new Date(today.getFullYear(), today.getMonth(), 1), today]
}

const ptRangeLabel = computed(() => {
  const range = ptDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) return "Select a complete date range"
  return `${formatDate(range[0])} to ${formatDate(range[1])}`
})

const refreshPtReport = async (): Promise<void> => {
  const range = ptDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) {
    errorToast(toast, "Please select a start and end date")
    return
  }
  if (range[0].getTime() > range[1].getTime()) {
    errorToast(toast, "Start date must be on or before end date")
    return
  }
  try {
    ptIsLoading.value = true
    ptReport.value = await appointmentPhase1Service.getCompletedSessionsByPt(
      toDateParam(range[0]), toDateParam(range[1])
    )
  } catch {
    errorToast(toast, "Failed to load PT performance report")
  } finally {
    ptIsLoading.value = false
  }
}

// ── Watchers ──────────────────────────────────────────────────────────────
watch(logDate, () => { void refreshDailyLog() })
watch([logClinicId, logDoctorId], () => { void refreshDailyLog() })
watch(logClinicId, (clinicId) => {
  if (clinicId == null) return
  const exists = doctorFilterOptions.value.some((o) => o.value === logDoctorId.value)
  if (!exists) logDoctorId.value = null
})

let logSearchDebounce: ReturnType<typeof setTimeout> | undefined
watch(logSearchText, () => {
  if (logSearchDebounce) clearTimeout(logSearchDebounce)
  logSearchDebounce = setTimeout(() => { void refreshDailyLog() }, 250)
})

watch(financeDate, () => { void refreshFinanceReport() })

onMounted(async () => {
  initReferringDateRange()
  initPtDateRange()
  await loadLookups()
  await refreshDailyLog()
  await refreshFinanceReport()
  void refreshReferringReport()
  void refreshPtReport()
})
</script>

<template>
  <main class="app-page-shell space-y-5">

    <!-- ── Header Banner ───────────────────────────────────────────────── -->
    <section class="rounded-3xl border border-[#A91D8B]/25 bg-[linear-gradient(120deg,rgba(36,39,87,0.14),rgba(94,24,105,0.10),rgba(169,29,139,0.18))] p-5 shadow-[0_18px_40px_rgba(36,39,87,0.10)]">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Operations Dashboard</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Unified view for Operations Managers — patient attendance, daily finance, referring doctor sessions, and PT performance in one place.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">Daily Log</span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">Daily Finance</span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">Referring Doctors</span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">PT Performance</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Tab Bar ─────────────────────────────────────────────────────── -->
    <section class="app-section-card-comfy !p-2">
      <div class="flex flex-wrap gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B] text-white shadow'
              : 'text-[rgb(var(--app-fg))] hover:bg-[rgba(169,29,139,0.08)]'
          ]"
          @click="activeTab = tab.id"
        >
          <i :class="['pi', tab.icon, 'text-[14px]']" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════
         TAB 0 — DAILY LOG
         ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 0">

      <section class="app-section-card-comfy space-y-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Log Date</label>
            <DatePicker v-model="logDate" showIcon fluid :manualInput="false" dateFormat="mm/dd/yy" />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Clinic Branch</label>
            <Select v-model="logClinicId" :options="clinicFilterOptions" optionLabel="label" optionValue="value" fluid filter placeholder="All clinics" :pt="ptSelect" />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Provider</label>
            <Select v-model="logDoctorId" :options="doctorFilterOptions" optionLabel="label" optionValue="value" fluid filter placeholder="All providers" :pt="ptSelect" />
          </div>

          <div class="space-y-2 xl:col-span-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Search</label>
            <InputText v-model="logSearchText" fluid placeholder="Patient name, record ID, or slip number" :pt="ptInputText" />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Today" icon="pi pi-calendar" outlined :pt="ptOutlinedBtn" @click="logDate = new Date()" />
          <Button label="Refresh" icon="pi pi-refresh" :loading="logIsLoading" :pt="ptPrimaryBtn" @click="refreshDailyLog" />
        </div>

        <p class="text-sm opacity-70">
          Date: {{ logDateLabel }}
        </p>
      </section>

      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article v-for="card in logSummaryCards" :key="card.label" class="app-section-card-comfy space-y-1">
          <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
          <div class="text-2xl font-semibold">{{ card.value }}</div>
          <div class="text-xs opacity-60">{{ card.caption }}</div>
        </article>
      </section>

      <section class="app-section-card-comfy space-y-4">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="app-section-title">Attendance Summary</h2>
            <p class="text-sm opacity-70">PT sign-off indicates session completion. Patient sign-off confirms the encounter ticket was processed.</p>
          </div>
          <div class="text-sm opacity-70">
            {{ dailyLog?.summary.total_entries ?? 0 }} entr{{ dailyLog?.summary.total_entries === 1 ? "y" : "ies" }}
          </div>
        </div>

        <div class="overflow-x-auto">
          <DataTable :value="dailyLog?.items ?? []" dataKey="id" paginator :rows="10" size="small" :loading="logIsLoading" scrollable>
            <template #empty>
              <div class="py-10 text-center text-sm opacity-70">No attendance records for {{ logDateLabel }}.</div>
            </template>

            <Column header="#" style="width: 56px">
              <template #body="{ index }"><span class="text-sm font-medium opacity-70">{{ index + 1 }}</span></template>
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

            <Column header="Branch / Visit" style="min-width: 200px">
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

            <Column header="PT / Provider" style="min-width: 200px">
              <template #body="{ data }">
                <div class="space-y-2">
                  <div class="font-medium">{{ providerLabel(data) }}</div>
                  <div class="text-xs opacity-65">PT signed: {{ formatOptionalDateTime(data.pt_confirmed_at) }}</div>
                  <div v-if="data.pt_completion_tag" class="text-xs opacity-65">Note: {{ data.pt_completion_tag }}</div>
                </div>
              </template>
            </Column>

            <Column header="PT Signature" style="min-width: 175px">
              <template #body="{ data }">
                <button
                  v-if="data.pt_signature_data_url"
                  type="button"
                  class="w-full rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-2 text-left transition hover:border-[#A91D8B]/40"
                  @click="openSignaturePreview('PT Signature', data.pt_signature_data_url, providerLabel(data))"
                >
                  <img :src="data.pt_signature_data_url" alt="PT signature" class="h-16 w-full rounded-xl object-contain bg-white/80" />
                  <div class="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Signed</div>
                </button>
                <div v-else class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-3 py-5 text-center text-xs opacity-60">PT signature pending</div>
              </template>
            </Column>

            <Column header="Patient Signature" style="min-width: 175px">
              <template #body="{ data }">
                <button
                  v-if="data.patient_signature_data_url"
                  type="button"
                  class="w-full rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-2 text-left transition hover:border-[#A91D8B]/40"
                  @click="openSignaturePreview('Patient Signature', data.patient_signature_data_url, data.patient_name)"
                >
                  <img :src="data.patient_signature_data_url" alt="Patient signature" class="h-16 w-full rounded-xl object-contain bg-white/80" />
                  <div class="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Signed</div>
                </button>
                <div v-else class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-3 py-5 text-center text-xs opacity-60">Patient signature pending</div>
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
                  <div class="text-xs opacity-65">Sign-off: {{ formatOptionalDateTime(data.signed_off_at) }}</div>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

    </template>

    <!-- ════════════════════════════════════════════════════════════════════
         TAB 1 — DAILY FINANCE
         ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 1">

      <section class="app-section-card-comfy space-y-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,320px)_1fr]">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Report Date</label>
            <DatePicker v-model="financeDate" showIcon fluid :manualInput="false" dateFormat="mm/dd/yy" />
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-sm opacity-75">
            {{ financeDateLabel }}. The income table uses saved billings for the selected day. The expense table is manually maintained.
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button label="Today" icon="pi pi-calendar" outlined :pt="ptOutlinedBtn" @click="financeDate = new Date()" />
          <Button label="Refresh" icon="pi pi-refresh" :loading="financeIsLoading" :pt="ptPrimaryBtn" @click="refreshFinanceReport" />
        </div>
      </section>

      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article v-for="card in financeSummaryCards" :key="card.label" class="app-section-card-comfy space-y-1">
          <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
          <div class="text-2xl font-semibold">{{ card.value }}</div>
          <div class="text-xs opacity-60">{{ card.caption }}</div>
        </article>
      </section>

      <section class="app-section-card-comfy space-y-4">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="app-section-title">Daily Income</h2>
            <p class="text-sm opacity-70">Live billing records and calculated balances for the selected day.</p>
          </div>
          <div class="text-sm opacity-70">
            Gross {{ asCurrency(financeReport?.summary.gross_income ?? 0) }} · Cash {{ asCurrency(financeReport?.summary.cash_collected ?? 0) }}
          </div>
        </div>

        <div class="overflow-x-auto">
          <DataTable :value="financeReport?.incomes ?? []" size="small" :loading="financeIsLoading" scrollable>
            <template #empty>
              <div class="py-10 text-center text-sm opacity-70">No billing activity for {{ financeDateLabel }}.</div>
            </template>
            <Column header="No." style="width: 64px">
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column header="Patient Name" style="min-width: 220px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-semibold">{{ data.patient_name }}</div>
                  <div class="text-xs opacity-60">{{ data.patient_public_id }}</div>
                </div>
              </template>
            </Column>
            <Column header="PT Service" style="min-width: 220px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-medium">{{ data.pt_service }}</div>
                  <div class="text-xs opacity-60">{{ formatTime(data.created_at) }}</div>
                </div>
              </template>
            </Column>
            <Column header="Sponsor" style="min-width: 150px">
              <template #body="{ data }">
                <Tag :value="data.billing_route" :severity="billingRouteSeverity(data.billing_route)" />
              </template>
            </Column>
            <Column header="Payment" style="min-width: 150px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-medium">{{ asCurrency(data.payment_amount) }}</div>
                  <div class="text-xs opacity-60">Collected {{ asCurrency(data.collected_amount) }}</div>
                </div>
              </template>
            </Column>
            <Column header="Mode of Payment" style="min-width: 160px">
              <template #body="{ data }">{{ data.mode_of_payment || "--" }}</template>
            </Column>
            <Column header="Ref No. / HMO / LGU" style="min-width: 200px">
              <template #body="{ data }">{{ data.sponsor_reference || "--" }}</template>
            </Column>
            <Column header="Balance" style="min-width: 120px">
              <template #body="{ data }">
                <span :class="data.balance > 0 ? 'text-amber-700 dark:text-amber-300 font-medium' : ''">{{ asCurrency(data.balance) }}</span>
              </template>
            </Column>
            <Column header="Invoice No." style="min-width: 180px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-medium">{{ data.invoice_number }}</div>
                  <div class="text-xs opacity-60">{{ data.public_id }}</div>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <section class="app-section-card-comfy space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 class="app-section-title">Expenses</h2>
            <p class="text-sm opacity-70">Add daily operating expenses to keep the net cash view complete.</p>
          </div>
          <div class="text-sm opacity-70">Total {{ asCurrency(financeReport?.summary.expense_total ?? 0) }}</div>
        </div>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_180px_minmax(0,1fr)_auto]">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Item Name</label>
            <InputText v-model="expenseForm.item_name" fluid placeholder="e.g. Supplies, transportation" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Amount</label>
            <InputNumber v-model="expenseForm.amount" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Notes</label>
            <InputText v-model="expenseForm.notes" fluid placeholder="Optional note or receipt detail" />
          </div>
          <div class="flex items-end">
            <Button label="Add Expense" icon="pi pi-plus" :loading="financeIsSavingExpense" :pt="ptPrimaryBtn" @click="saveExpense" />
          </div>
        </div>

        <div class="overflow-x-auto">
          <DataTable :value="financeReport?.expenses ?? []" size="small" :loading="financeIsLoading" scrollable>
            <template #empty>
              <div class="py-10 text-center text-sm opacity-70">No expense entries for {{ financeDateLabel }}.</div>
            </template>
            <Column header="No." style="width: 64px">
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column header="Item Name" style="min-width: 260px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-medium">{{ data.item_name }}</div>
                  <div v-if="data.notes" class="text-xs opacity-60">{{ data.notes }}</div>
                </div>
              </template>
            </Column>
            <Column header="Price" style="min-width: 140px">
              <template #body="{ data }">{{ asCurrency(data.amount) }}</template>
            </Column>
            <Column header="Created By" style="min-width: 160px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div>{{ data.created_by_name || "--" }}</div>
                  <div class="text-xs opacity-60">{{ formatDateTime(data.created_at) }}</div>
                </div>
              </template>
            </Column>
            <Column header="Actions" style="width: 96px">
              <template #body="{ data }">
                <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeleteExpense(data.id, data.item_name)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <section class="app-section-card-comfy space-y-3">
        <h2 class="app-section-title">Daily Totals</h2>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Cash Collected</div>
            <div class="mt-2 text-2xl font-semibold">{{ asCurrency(financeReport?.summary.cash_collected ?? 0) }}</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Expense Total</div>
            <div class="mt-2 text-2xl font-semibold">{{ asCurrency(financeReport?.summary.expense_total ?? 0) }}</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Net Cash</div>
            <div class="mt-2 text-2xl font-semibold">{{ asCurrency(financeReport?.summary.net_cash ?? 0) }}</div>
          </div>
        </div>
      </section>

    </template>

    <!-- ════════════════════════════════════════════════════════════════════
         TAB 2 — REFERRING DOCTOR SESSIONS
         ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 2">

      <section class="app-section-card-comfy space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 class="app-section-title">Completed Sessions by Referring Doctor</h2>
            <p class="text-sm opacity-70">Total completed treatment sessions grouped by referring doctor for the selected date range.</p>
          </div>
          <div class="text-sm opacity-70">
            Total: {{ referringReport?.total_completed_sessions ?? 0 }} sessions
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(280px,360px)_auto_1fr] md:items-end">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Date Range</label>
            <DatePicker v-model="referringDateRange" selectionMode="range" showIcon fluid :manualInput="false" dateFormat="mm/dd/yy" />
          </div>
          <div>
            <Button label="Generate" icon="pi pi-chart-bar" :loading="referringIsLoading" :pt="ptPrimaryBtn" @click="refreshReferringReport" />
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-sm opacity-75">
            {{ referringRangeLabel }}
          </div>
        </div>

        <div class="overflow-x-auto">
          <DataTable :value="referringReport?.doctors ?? []" size="small" :loading="referringIsLoading" scrollable>
            <template #empty>
              <div class="py-10 text-center text-sm opacity-70">No completed sessions for the selected range.</div>
            </template>
            <Column header="Rank" style="width: 80px">
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column header="Referring Doctor" style="min-width: 320px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-medium">{{ data.referring_doctor_name }}</div>
                  <div class="text-xs opacity-60">ID: {{ data.referring_doctor_id }}</div>
                </div>
              </template>
            </Column>
            <Column header="Completed Sessions" style="min-width: 180px">
              <template #body="{ data }">
                <span class="font-semibold">{{ data.completed_sessions_count }}</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

    </template>

    <!-- ════════════════════════════════════════════════════════════════════
         TAB 3 — PT PERFORMANCE
         ════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 3">

      <section class="rounded-3xl border border-emerald-500/20 bg-[linear-gradient(120deg,rgba(16,185,129,0.06),rgba(5,150,105,0.08))] p-5">
        <div class="space-y-2">
          <div class="text-base font-semibold tracking-tight">PT Monthly Performance Report</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            As an Operations Manager, use this report to view total completed sessions per Primary Physical Therapist over any date range — ideal for monthly performance evaluation, throughput calculation, and bonus distribution.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-900/20 px-3 py-1">
              Total PT Sessions: {{ ptReport?.total_completed_sessions ?? 0 }}
            </span>
            <span class="rounded-full border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-900/20 px-3 py-1">
              {{ ptRangeLabel }}
            </span>
          </div>
        </div>
      </section>

      <section class="app-section-card-comfy space-y-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(280px,360px)_auto_1fr] md:items-end">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Date Range</label>
            <DatePicker v-model="ptDateRange" selectionMode="range" showIcon fluid :manualInput="false" dateFormat="mm/dd/yy" />
          </div>
          <div>
            <Button label="Generate" icon="pi pi-chart-bar" :loading="ptIsLoading" :pt="ptPrimaryBtn" @click="refreshPtReport" />
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-sm opacity-75">
            {{ ptRangeLabel }}
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Total Completed Sessions</div>
            <div class="mt-2 text-3xl font-semibold">{{ ptReport?.total_completed_sessions ?? 0 }}</div>
            <div class="mt-1 text-xs opacity-60">Across all PT providers</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Active PT Providers</div>
            <div class="mt-2 text-3xl font-semibold">{{ ptReport?.physical_therapists?.length ?? 0 }}</div>
            <div class="mt-1 text-xs opacity-60">With at least 1 session</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Avg Sessions / PT</div>
            <div class="mt-2 text-3xl font-semibold">
              {{
                ptReport?.physical_therapists?.length
                  ? Math.round((ptReport.total_completed_sessions / ptReport.physical_therapists.length) * 10) / 10
                  : 0
              }}
            </div>
            <div class="mt-1 text-xs opacity-60">Average throughput</div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <DataTable :value="ptReport?.physical_therapists ?? []" size="small" :loading="ptIsLoading" scrollable>
            <template #empty>
              <div class="py-10 text-center text-sm opacity-70">
                No completed sessions found. Select a date range and click Generate.
              </div>
            </template>

            <Column header="Rank" style="width: 80px">
              <template #body="{ index }">
                <span
                  :class="[
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                    index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                    index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                    'bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]/60'
                  ]"
                >{{ index + 1 }}</span>
              </template>
            </Column>

            <Column header="Physical Therapist" style="min-width: 280px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-semibold">{{ data.pt_name }}</div>
                  <div class="text-xs opacity-60">Staff ID: {{ data.pt_id }}</div>
                </div>
              </template>
            </Column>

            <Column header="Completed Sessions" style="min-width: 180px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <span class="text-lg font-bold">{{ data.completed_sessions_count }}</span>
                  <div class="text-xs opacity-60">sessions</div>
                </div>
              </template>
            </Column>

            <Column header="Share" style="min-width: 200px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--app-border))]">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]"
                        :style="{ width: ptReport?.total_completed_sessions ? `${Math.round(data.completed_sessions_count / ptReport.total_completed_sessions * 100)}%` : '0%' }"
                      />
                    </div>
                    <span class="text-sm font-medium w-10 text-right">
                      {{ ptReport?.total_completed_sessions ? Math.round(data.completed_sessions_count / ptReport.total_completed_sessions * 100) : 0 }}%
                    </span>
                  </div>
                  <div class="text-xs opacity-60">of total sessions</div>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

    </template>

    <!-- ── Signature Preview Dialog ───────────────────────────────────── -->
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

  </main>
</template>
