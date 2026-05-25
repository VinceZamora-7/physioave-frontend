<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy  space-y-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 class="app-section-title">Dashboard</h2>
                      <Button
              :icon="hideSensitiveDashboardData ? 'pi pi-eye-slash' : 'pi pi-eye'"
              severity="secondary"
              outlined
              rounded
              :aria-label="hideSensitiveDashboardData ? 'Show sensitive dashboard data' : 'Hide sensitive dashboard data'"
              :title="hideSensitiveDashboardData ? 'Show sensitive data' : 'Hide sensitive data'"
              @click="toggleSensitiveDashboardData"
            />
          </div>
          <p class="app-muted-text text-sm">Clinic overview, trends, and operational report snapshot</p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <span class="app-filter-pill">
            Branch: {{ selectedClinic?.name || "All branches" }}
          </span>

          <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading" @click="refreshDashboard" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <article
          v-for="item in kpiCards"
          :key="item.label"
          class="app-dashboard-kpi-card"
          :style="{
            borderLeftWidth: '4px',
            borderLeftColor: item.accent,
            background: `linear-gradient(135deg, ${item.accent}18, rgb(var(--app-surface)), ${item.accent}0a)`
          }"
        >
          <p class="text-xs uppercase tracking-wide opacity-60">{{ item.label }}</p>
          <p class="mt-1 text-2xl font-semibold" :style="{color: item.accent}">{{ item.value }}</p>
        </article>
      </div>

      <div class="app-dashboard-panel">
        <button
          class="flex w-full items-center justify-between text-left"
          @click="marketingChannelsOpen = !marketingChannelsOpen"
        >
          <h4 class="text-sm font-semibold">Marketing Channels</h4>
          <i :class="marketingChannelsOpen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-xs opacity-50" />
        </button>
        <div v-if="marketingChannelsOpen" class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="font-medium mb-2">Online Marketing</p>
            <ul class="app-muted-text space-y-1">
              <li>Social Media</li>
              <li>Website / Google Maps</li>
              <li>Paid Ads</li>
            </ul>
          </div>
          <div>
            <p class="font-medium mb-2">Offline Marketing</p>
            <ul class="app-muted-text space-y-1">
              <li>Doctor's Referrals</li>
              <li>Patient's Referrals</li>
              <li>Walk-ins</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-4">
      <h3 class="app-section-title">7-Day Appointments Trend</h3>
      <div class="grid grid-cols-7 gap-2">
        <div v-for="item in appointmentTrend" :key="item.date" class="flex flex-col items-center gap-2">
          <div class="app-chart-track w-full h-36 p-2 flex items-end">
            <div
              class="app-chart-bar w-full rounded-md transition-all"
              :style="{ height: `${item.height}%` }"
              :title="`${item.label}: ${item.count} bookings`"
            />
          </div>
          <span class="app-muted-text text-[11px]">{{ item.shortLabel }}</span>
          <span class="text-xs font-medium">{{ item.count }}</span>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Billing Status Distribution</h3>
        <div class="space-y-2">
          <div v-for="item in billingDistribution" :key="item.label" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span>{{ item.label }}</span>
              <span class="font-medium">{{ item.count }}</span>
            </div>
            <div class="app-progress-track h-2">
              <div
                class="h-full rounded-full"
                :class="item.statusClass"
                :style="{ width: `${item.percent}%` }"
              />
            </div>
          </div>
        </div>
      </article>

      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Recent Appointments</h3>
        <DataTable class="app-data-table" :value="recentAppointments" size="small" :loading="isLoading">
          <Column field="patient_name" header="Patient" />
          <Column field="starts_at" header="Start">
            <template #body="{ data }">{{ formatDateTime(data.starts_at) }}</template>
          </Column>
          <Column field="appointment_status" header="Status" />
          <Column field="billing_status" header="Billing" />
        </DataTable>
      </article>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex items-center gap-2 text-sm">
        <i class="app-section-icon pi pi-check-square" />
        <span class="font-medium">PT Performance (Monthly Bookings)</span>
      </div>
      <DataTable class="app-data-table" :value="ptPerformance" size="small" :loading="isLoading">
        <Column field="pt_name" header="Physical Therapist" />
        <Column field="bookings" header="Monthly Bookings" />
        <Column header="Documentation Reminder" style="min-width: 220px">
          <template #body="{ data }">
            <Tag
              v-if="data.redAlertCount > 0"
              :value="`⚠ ${data.redAlertCount} session${data.redAlertCount > 1 ? 's' : ''} missing Evaluation Visit Log`"
              severity="danger"
            />
            <Tag
              v-else-if="data.documentationReminderCount > 0"
              :value="`Complete ${data.documentationReminderCount} documentation`"
              severity="warn"
            />
            <Tag
              v-else
              value="Up to date"
              severity="success"
            />
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="app-section-title">Completed Sessions by Referring Doctor</h2>
          <p class="text-sm opacity-70">Operations view for completed treatment sessions grouped by referring doctor over a selected date range.</p>
        </div>
        <div class="text-sm opacity-70">
          Total Completed Sessions: {{ doctorSessionsReport?.total_completed_sessions ?? 0 }}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(280px,360px)_auto_1fr] md:items-end">
        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Date Range</label>
          <DatePicker
            v-model="doctorSessionsDateRange"
            selectionMode="range"
            showIcon
            fluid
            :manualInput="false"
            dateFormat="mm/dd/yy"
          />
        </div>
        <div>
          <Button
            label="Generate"
            icon="pi pi-chart-bar"
            :loading="isDoctorSessionsLoading"
            :pt="ptPrimaryBtn"
            @click="refreshDoctorSessionsReport"
          />
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-sm opacity-75">
          {{ selectedDoctorSessionsRangeLabel }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <DataTable :value="doctorSessionsReport?.doctors ?? []" size="small" :loading="isDoctorSessionsLoading" scrollable>
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">
              No completed sessions found for the selected range.
            </div>
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
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue"
import {storeToRefs} from "pinia"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Tag from "primevue/tag"
import {errorToast} from "@/utils/toast.util"
import {useToast} from "primevue/usetoast"
import {getApiErrorMessage} from "@/utils/actionable-error.util"
import {ptPrimaryBtn} from "@/features/shared/table-header.styles"
import {
  dashboardService,
  type DashboardConfidentialRevenue,
  type DashboardDistributionItem,
  type DashboardRecentAppointment,
  type DashboardTrendItem,
} from "@/features/dashboard/api/dashboard.service"
import {billingPhase1Service} from "@/features/billing/api/billing-phase1.service"
import {
  appointmentPhase1Service,
  type PtCompletedSessionsItem,
  type ReferringDoctorCompletedSessionsReport,
} from "@/features/appointments/api/appointment-phase1.service"
import { clinicStore } from "@/stores/clinic.store"

const toast = useToast()
const isLoading = ref(false)
const globalClinicStore = clinicStore()
const { selectedClinicId, selectedClinic } = storeToRefs(globalClinicStore)

const metrics = ref({
  monthlyTotalAppointments: 0,
  activePatients: 0,
  appointmentsToday: 0,
  rescheduleCancellationIndex: 0,
  hmoBookingsMonthlyTotal: 0,
  lguBookingsMonthlyTotal: 0,
  pendingBillings: 0,
  paidBillings: 0,
  hmoRevenue: 0,
  lguRevenue: 0,
  onlineMarketingRevenue: 0,
  directMarketingRevenue: 0,
})

const appointmentTrend = ref<Array<{
  date: string
  shortLabel: string
  label: string
  count: number
  height: number
}>>([])

const billingDistribution = ref<Array<{
  label: string
  count: number
  percent: number
  statusClass: string
}>>([
  {label: "Unbilled", count: 0, percent: 0, statusClass: "app-status-unbilled"},
  {label: "Pending", count: 0, percent: 0, statusClass: "app-status-pending"},
  {label: "Partial", count: 0, percent: 0, statusClass: "app-status-partial"},
  {label: "Paid", count: 0, percent: 0, statusClass: "app-status-paid"},
])

const recentAppointments = ref<DashboardRecentAppointment[]>([])
const ptPerformance = ref<Array<{pt_name: string; bookings: number; documentationReminderCount: number; redAlertCount: number}>>([])
const isDoctorSessionsLoading = ref(false)
const doctorSessionsDateRange = ref<Date[] | null>(null)
const doctorSessionsReport = ref<ReferringDoctorCompletedSessionsReport>()
const canViewConfidentialRevenueCards = ref(false)
const hideSensitiveDashboardData = ref(localStorage.getItem("dashboard.hideSensitiveData") === "true")

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const formatDate = (value: Date): string =>
  value.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const toDateParam = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const selectedDoctorSessionsRangeLabel = computed(() => {
  const range = doctorSessionsDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) return "Select a complete date range"
  return `${formatDate(range[0])} to ${formatDate(range[1])}`
})
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP", maximumFractionDigits: 0}).format(value || 0)
const sensitivePlaceholder = "••••••"
const formatSensitiveCurrency = (value: number): string =>
  hideSensitiveDashboardData.value ? sensitivePlaceholder : formatCurrency(value)

const toggleSensitiveDashboardData = (): void => {
  hideSensitiveDashboardData.value = !hideSensitiveDashboardData.value
  localStorage.setItem("dashboard.hideSensitiveData", String(hideSensitiveDashboardData.value))
}

const marketingChannelsOpen = ref(localStorage.getItem("dashboard.marketingChannelsOpen") !== "false")
watch(marketingChannelsOpen, (val) => localStorage.setItem("dashboard.marketingChannelsOpen", String(val)))

const kpiCards = computed(() => {
  const cards = [
    {label: "Monthly Total Appointments", value: metrics.value.monthlyTotalAppointments, accent: '#3b82f6'},
    {label: "Active Patients", value: metrics.value.activePatients, accent: '#8b5cf6'},
    {label: "Appointments Today", value: metrics.value.appointmentsToday, accent: '#06b6d4'},
    {label: "Rescheduling/Cancellation Index", value: `${metrics.value.rescheduleCancellationIndex}%`, accent: '#f59e0b'},
    {label: "HMO (Bookings) Monthly Total", value: metrics.value.hmoBookingsMonthlyTotal, accent: '#14b8a6'},
    {label: "LGU (Bookings) Monthly Total", value: metrics.value.lguBookingsMonthlyTotal, accent: '#10b981'},
    {label: "Pending Billings", value: metrics.value.pendingBillings, accent: '#f97316'},
    {label: "Paid Billings", value: metrics.value.paidBillings, accent: '#22c55e'},
    {label: "HMO Revenue", value: formatSensitiveCurrency(metrics.value.hmoRevenue), accent: '#14b8a6'},
  ]

  if (canViewConfidentialRevenueCards.value) {
    cards.push(
      {label: "LGU Revenue", value: formatSensitiveCurrency(metrics.value.lguRevenue), accent: '#10b981'},
      {label: "Online Marketing Revenue", value: formatSensitiveCurrency(metrics.value.onlineMarketingRevenue), accent: '#a855f7'},
      {label: "Direct Marketing Revenue", value: formatSensitiveCurrency(metrics.value.directMarketingRevenue), accent: '#ec4899'},
    )
  }

  return cards
})

const loadConfidentialRevenue = async (): Promise<void> => {
  const result: DashboardConfidentialRevenue | undefined = await dashboardService.getConfidentialRevenue(selectedClinicId.value)
  canViewConfidentialRevenueCards.value = true
  metrics.value = {
    ...metrics.value,
    lguRevenue: Number(result?.lgu_revenue ?? 0),
    onlineMarketingRevenue: Number(result?.online_marketing_revenue ?? 0),
    directMarketingRevenue: Number(result?.direct_marketing_revenue ?? 0),
  }
}

const getMonthRange = (): {from: string; to: string; days: number} => {
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  return {
    from,
    to,
    days: now.getDate(),
  }
}

const containsLgu = (name?: string): boolean => String(name ?? "").toUpperCase().includes("LGU")

const loadMetrics = async (): Promise<void> => {
  const monthRange = getMonthRange()
  const clinicId = selectedClinicId.value
  const [summaryResult, monthlyTrendResult, monthBillingsResult, monthHmoBillingsResult, monthAppointmentsResult] = await Promise.allSettled([
    dashboardService.getSummary(clinicId),
    dashboardService.getAppointmentTrend(monthRange.days, clinicId),
    billingPhase1Service.getAll({page: 1, size: 500, from_date: monthRange.from, to_date: monthRange.to, ...(clinicId ? {clinic_id: clinicId} : {})}),
    billingPhase1Service.getAll({page: 1, size: 500, service_type: "HMO", from_date: monthRange.from, to_date: monthRange.to, ...(clinicId ? {clinic_id: clinicId} : {})}),
    appointmentPhase1Service.getAll({page: 1, size: 500, ...(clinicId ? {clinic_id: clinicId} : {})}),
  ])

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : undefined
  const monthlyTrend = monthlyTrendResult.status === "fulfilled" ? monthlyTrendResult.value : undefined
  const monthBillings = monthBillingsResult.status === "fulfilled" ? monthBillingsResult.value : undefined
  const monthHmoBillings = monthHmoBillingsResult.status === "fulfilled" ? monthHmoBillingsResult.value : undefined
  const monthAppointments = monthAppointmentsResult.status === "fulfilled" ? monthAppointmentsResult.value : undefined

  const billingRows = monthBillings?.content ?? []
  const hmoRows = monthHmoBillings?.content ?? []
  const appointmentRows = monthAppointments?.content ?? []
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  const monthAppointmentsRows = appointmentRows.filter(item => item.starts_at?.startsWith(monthKey))
  const reschedOrCancelled = monthAppointmentsRows.filter(item =>
    item.reschedule_count > 0 || String(item.appointment_status).toUpperCase().includes("CANCEL")
  ).length
  const rescheduleCancellationIndex = monthAppointmentsRows.length
    ? Math.round((reschedOrCancelled / monthAppointmentsRows.length) * 100)
    : 0

  const paidRows = billingRows.filter(item => String(item.billing_status).toUpperCase() === "PAID")
  const lguRows = billingRows.filter(item => containsLgu(item.package_name) || containsLgu(item.service_name))

  metrics.value = {
    monthlyTotalAppointments: (monthlyTrend ?? []).reduce((sum, item) => sum + item.count, 0),
    activePatients: summary?.active_patients ?? 0,
    appointmentsToday: summary?.appointments_today ?? 0,
    rescheduleCancellationIndex,
    hmoBookingsMonthlyTotal: hmoRows.length,
    lguBookingsMonthlyTotal: lguRows.length,
    pendingBillings: summary?.pending_billings ?? 0,
    paidBillings: summary?.paid_billings_month_to_date ?? paidRows.length,
    hmoRevenue: hmoRows.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0),
    lguRevenue: metrics.value.lguRevenue,
    onlineMarketingRevenue: metrics.value.onlineMarketingRevenue,
    directMarketingRevenue: metrics.value.directMarketingRevenue,
  }
}

const loadPtPerformance = async (): Promise<void> => {
  const monthRange = getMonthRange()
  const clinicId = selectedClinicId.value
  const report = await appointmentPhase1Service.getCompletedSessionsByPt(monthRange.from, monthRange.to, clinicId)
  const rows: PtCompletedSessionsItem[] = report?.physical_therapists ?? []
  ptPerformance.value = rows
    .map(item => ({
      pt_name: item.pt_name?.trim() || "Unassigned",
      bookings: Number(item.completed_sessions_count ?? 0),
      documentationReminderCount: Number(item.documentation_reminder_count ?? 0),
      redAlertCount: Number(item.red_alert_count ?? 0),
    }))
    .sort((a, b) => b.bookings - a.bookings)
}

const initializeDoctorSessionsDateRange = (): void => {
  if (doctorSessionsDateRange.value && doctorSessionsDateRange.value.length === 2) return
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  doctorSessionsDateRange.value = [monthStart, today]
}

const refreshDoctorSessionsReport = async (): Promise<void> => {
  const range = doctorSessionsDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) {
    errorToast(toast, "Select both Start Date and End Date, then click Generate.")
    return
  }
  const fromDate = range[0]
  const toDate = range[1]
  if (fromDate.getTime() > toDate.getTime()) {
    errorToast(toast, "Start Date cannot be later than End Date.")
    return
  }
  try {
    isDoctorSessionsLoading.value = true
    doctorSessionsReport.value = await appointmentPhase1Service.getCompletedSessionsByReferringDoctor(
      toDateParam(fromDate),
      toDateParam(toDate),
      selectedClinicId.value
    )
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, { baseMessage: "Completed sessions report could not be loaded" }))
  } finally {
    isDoctorSessionsLoading.value = false
  }
}

const loadTrend = async (): Promise<void> => {
  const trend: DashboardTrendItem[] = (await dashboardService.getAppointmentTrend(7, selectedClinicId.value)) ?? []
  const maxCount = Math.max(1, ...trend.map(item => item.count))

  appointmentTrend.value = trend.map(item => {
    const date = new Date(`${item.date}T00:00:00`)
    return {
      date: item.date,
      shortLabel: date.toLocaleDateString("en-PH", {weekday: "short"}),
      label: date.toLocaleDateString("en-PH", {weekday: "long", month: "short", day: "numeric"}),
      count: item.count,
      height: Math.max(8, Math.round((item.count / maxCount) * 100)),
    }
  })
}

const loadBillingDistribution = async (): Promise<void> => {
  const classByStatus: Record<string, string> = {
    Unbilled: "app-status-unbilled",
    Pending: "app-status-pending",
    Partial: "app-status-partial",
    Paid: "app-status-paid",
  }
  const defaults = ["Unbilled", "Pending", "Partial", "Paid"]
  const distribution: DashboardDistributionItem[] = (await dashboardService.getBillingDistribution(selectedClinicId.value)) ?? []

  const indexed = new Map(distribution.map(item => [item.label.toUpperCase(), item.count]))
  const normalized = defaults.map(label => ({
    label,
    statusClass: classByStatus[label],
    count: indexed.get(label.toUpperCase()) ?? 0,
  }))

  const total = Math.max(1, normalized.reduce((sum, item) => sum + item.count, 0))
  billingDistribution.value = normalized.map(item => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
}

const loadRecentAppointments = async (): Promise<void> => {
  recentAppointments.value = (await dashboardService.getRecentAppointments(8, selectedClinicId.value)) ?? []
}

const refreshDashboard = async (): Promise<void> => {
  try {
    isLoading.value = true
    const results = await Promise.allSettled([
      loadMetrics(),
      loadConfidentialRevenue(),
      loadTrend(),
      loadBillingDistribution(),
      loadRecentAppointments(),
      loadPtPerformance(),
    ])

    const confidentialRevenueResult = results[1]
    if (confidentialRevenueResult.status === "rejected") {
      canViewConfidentialRevenueCards.value = false
      metrics.value = {
        ...metrics.value,
        lguRevenue: 0,
        onlineMarketingRevenue: 0,
        directMarketingRevenue: 0,
      }
    }

    const failedResults = results.filter(result => result.status === 'rejected')
    if (failedResults.length > 0) {
      console.warn('Some dashboard data failed to load:', failedResults)
      // Only show error for critical failures (metrics and trend are most important).
      const criticalFailures = [results[0], results[2]].filter(result => result.status === "rejected")
      if (criticalFailures.length > 0) {
        errorToast(toast, "Failed to load some dashboard data")
      }
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    await globalClinicStore.loadClinics()
  } catch {
    errorToast(toast, "Failed to load clinic list")
  }
  initializeDoctorSessionsDateRange()
  void refreshDashboard()
  void refreshDoctorSessionsReport()
})

// Refresh dashboard when clinic selection changes
watch(selectedClinicId, () => {
  void refreshDashboard()
  void refreshDoctorSessionsReport()
})
</script>
