<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="app-section-title">Dashboard</h2>
          <p class="text-sm opacity-70">Clinic overview, trends, and operational report snapshot</p>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading" @click="refreshDashboard" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <article v-for="item in kpiCards" :key="item.label" class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <p class="text-xs uppercase tracking-wide opacity-70">{{ item.label }}</p>
          <p class="mt-1 text-2xl font-semibold">{{ item.value }}</p>
        </article>
      </div>

      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <h4 class="text-sm font-semibold mb-3">Marketing Channels</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="font-medium mb-2">Online Marketing</p>
            <ul class="space-y-1 opacity-80">
              <li>Social Media</li>
              <li>Website / Google Maps</li>
              <li>Paid Ads</li>
            </ul>
          </div>
          <div>
            <p class="font-medium mb-2">Offline Marketing</p>
            <ul class="space-y-1 opacity-80">
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
          <div class="w-full h-36 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-2 flex items-end">
            <div
              class="w-full rounded-md bg-[rgb(var(--app-secondary))] transition-all"
              :style="{ height: `${item.height}%` }"
              :title="`${item.label}: ${item.count} bookings`"
            />
          </div>
          <span class="text-[11px] opacity-70">{{ item.shortLabel }}</span>
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
            <div class="h-2 rounded-full bg-[rgb(var(--app-bg))] border border-[rgb(var(--app-border))] overflow-hidden">
              <div
                class="h-full rounded-full"
                :style="{ width: `${item.percent}%`, backgroundColor: item.color }"
              />
            </div>
          </div>
        </div>
      </article>

      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Recent Appointments</h3>
        <DataTable :value="recentAppointments" size="small" :loading="isLoading">
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
        <i class="pi pi-check-square text-[rgb(var(--app-secondary))]" />
        <span class="font-medium">PT Performance (Monthly Bookings)</span>
      </div>
      <DataTable :value="ptPerformance" size="small" :loading="isLoading">
        <Column field="pt_name" header="Physical Therapist" />
        <Column field="bookings" header="Monthly Bookings" />
        <Column header="Documentation Reminder" style="min-width: 220px">
          <template #body="{ data }">
            <Tag
              :value="data.documentationReminderCount > 0 ? `Complete ${data.documentationReminderCount} documentation` : 'Up to date'"
              :severity="data.documentationReminderCount > 0 ? 'warn' : 'success'"
            />
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-user-md text-[rgb(var(--app-secondary))]" />
        <span class="font-medium">Completed Sessions by Referring Doctor</span>
      </div>
      <DataTable :value="referringDoctorSummary" size="small" :loading="isLoading">
        <Column field="referring_doctor_name" header="Referring Doctor" />
        <Column field="completed_sessions_count" header="Completed Sessions" />
      </DataTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import {computed, ref} from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Tag from "primevue/tag"
import {errorToast} from "@/utils/toast.util"
import {useToast} from "primevue"
import {
  dashboardService,
  type DashboardDistributionItem,
  type DashboardRecentAppointment,
  type DashboardTrendItem,
} from "@/features/dashboard/api/dashboard.service"
import {billingPhase1Service} from "@/features/billing/api/billing-phase1.service"
import {
  appointmentPhase1Service,
  type PtCompletedSessionsItem,
  type ReferringDoctorCompletedSessionsItem,
} from "@/features/appointments/api/appointment-phase1.service"

const toast = useToast()
const isLoading = ref(false)

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
  color: string
}>>([
  {label: "UNBILLED", count: 0, percent: 0, color: "rgb(96 165 250)"},
  {label: "PENDING", count: 0, percent: 0, color: "rgb(251 191 36)"},
  {label: "PARTIAL", count: 0, percent: 0, color: "rgb(251 146 60)"},
  {label: "PAID", count: 0, percent: 0, color: "rgb(74 222 128)"},
])

const recentAppointments = ref<DashboardRecentAppointment[]>([])
const ptPerformance = ref<Array<{pt_name: string; bookings: number; documentationReminderCount: number}>>([])
const referringDoctorSummary = ref<ReferringDoctorCompletedSessionsItem[]>([])

const formatDateTime = (value: string): string => new Date(value).toLocaleString()
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP", maximumFractionDigits: 0}).format(value || 0)

const kpiCards = computed(() => ([
  {label: "Monthly Total Appointments", value: metrics.value.monthlyTotalAppointments},
  {label: "Active Patients", value: metrics.value.activePatients},
  {label: "Appointments Today", value: metrics.value.appointmentsToday},
  {label: "Rescheduling/Cancellation Index", value: `${metrics.value.rescheduleCancellationIndex}%`},
  {label: "HMO (Bookings) Monthly Total", value: metrics.value.hmoBookingsMonthlyTotal},
  {label: "LGU (Bookings) Monthly Total", value: metrics.value.lguBookingsMonthlyTotal},
  {label: "Pending Billings", value: metrics.value.pendingBillings},
  {label: "Paid Billings", value: metrics.value.paidBillings},
  {label: "HMO Revenue", value: formatCurrency(metrics.value.hmoRevenue)},
  {label: "LGU Revenue", value: formatCurrency(metrics.value.lguRevenue)},
  {label: "Online Marketing Revenue", value: formatCurrency(metrics.value.onlineMarketingRevenue)},
  {label: "Direct Marketing Revenue", value: formatCurrency(metrics.value.directMarketingRevenue)},
]))

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
  const [summaryResult, monthlyTrendResult, monthBillingsResult, monthHmoBillingsResult, monthAppointmentsResult] = await Promise.allSettled([
    dashboardService.getSummary(),
    dashboardService.getAppointmentTrend(monthRange.days),
    billingPhase1Service.getAll({page: 1, size: 500, from_date: monthRange.from, to_date: monthRange.to}),
    billingPhase1Service.getAll({page: 1, size: 500, service_type: "HMO", from_date: monthRange.from, to_date: monthRange.to}),
    appointmentPhase1Service.getAll({page: 1, size: 500}),
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
  const lguPaidRows = paidRows.filter(item => containsLgu(item.package_name) || containsLgu(item.service_name))

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
    lguRevenue: lguPaidRows.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0),
    onlineMarketingRevenue: 0,
    directMarketingRevenue: 0,
  }
}

const loadPtPerformance = async (): Promise<void> => {
  const monthRange = getMonthRange()
  const report = await appointmentPhase1Service.getCompletedSessionsByPt(monthRange.from, monthRange.to)
  const rows: PtCompletedSessionsItem[] = report?.physical_therapists ?? []
  ptPerformance.value = rows
    .map(item => ({
      pt_name: item.pt_name?.trim() || "Unassigned",
      bookings: Number(item.completed_sessions_count ?? 0),
      documentationReminderCount: Number(item.documentation_reminder_count ?? 0),
    }))
    .sort((a, b) => b.bookings - a.bookings)
}

const loadReferringDoctorSummary = async (): Promise<void> => {
  const monthRange = getMonthRange()
  const report = await appointmentPhase1Service.getCompletedSessionsByReferringDoctor(monthRange.from, monthRange.to)
  referringDoctorSummary.value = (report?.doctors ?? [])
    .map(item => ({
      ...item,
      referring_doctor_name: item.referring_doctor_name?.trim() || "Unassigned",
      completed_sessions_count: Number(item.completed_sessions_count ?? 0),
    }))
    .sort((a, b) => b.completed_sessions_count - a.completed_sessions_count)
}

const loadTrend = async (): Promise<void> => {
  const trend: DashboardTrendItem[] = (await dashboardService.getAppointmentTrend(7)) ?? []
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
  const paletteByStatus: Record<string, string> = {
    UNBILLED: "rgb(96 165 250)",
    PENDING: "rgb(251 191 36)",
    PARTIAL: "rgb(251 146 60)",
    PAID: "rgb(74 222 128)",
  }
  const defaults = ["UNBILLED", "PENDING", "PARTIAL", "PAID"]
  const distribution: DashboardDistributionItem[] = (await dashboardService.getBillingDistribution()) ?? []

  const indexed = new Map(distribution.map(item => [item.label.toUpperCase(), item.count]))
  const normalized = defaults.map(label => ({
    label,
    color: paletteByStatus[label],
    count: indexed.get(label) ?? 0,
  }))

  const total = Math.max(1, normalized.reduce((sum, item) => sum + item.count, 0))
  billingDistribution.value = normalized.map(item => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
}

const loadRecentAppointments = async (): Promise<void> => {
  recentAppointments.value = (await dashboardService.getRecentAppointments(8)) ?? []
}

const refreshDashboard = async (): Promise<void> => {
  try {
    isLoading.value = true
    await Promise.all([
      loadMetrics(),
      loadTrend(),
      loadBillingDistribution(),
      loadRecentAppointments(),
      loadPtPerformance(),
      loadReferringDoctorSummary(),
    ])
  } catch {
    errorToast(toast, "Failed to load dashboard data")
  } finally {
    isLoading.value = false
  }
}

void refreshDashboard()
</script>
