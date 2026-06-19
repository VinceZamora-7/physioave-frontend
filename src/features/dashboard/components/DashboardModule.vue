<template>
  <main class="app-page-shell space-y-5">
    <section v-if="isPtDashboard" class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="app-section-title">Therapist Dashboard</h2>
          <p class="app-muted-text text-sm">
            Weekly and monthly attendance for {{ staffName || "your account" }}
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <span class="app-filter-pill">
            Branch: {{ selectedClinic?.name || "All branches" }}
          </span>
          <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading" @click="refreshDashboard" />
        </div>
      </div>

      <div v-if="canViewPtAttendance" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article
          v-for="item in ptAttendanceCards"
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
          <p class="app-muted-text mt-1 text-xs">{{ item.range }}</p>
        </article>
      </div>

      <article v-if="canViewPtDocumentationReminders" class="app-dashboard-panel space-y-3">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="text-sm font-semibold">PT Documentation Reminder</h3>
            <p class="app-muted-text mt-1 text-xs">
              Complete today's Evaluation Visit Logs before the day ends.
            </p>
          </div>
          <Tag
            :value="`${ptDocumentationReminders?.reminder_count ?? 0} pending`"
            :severity="(ptDocumentationReminders?.reminder_count ?? 0) > 0 ? 'warn' : 'success'"
          />
        </div>

        <DataTable class="app-data-table" :value="ptDocumentationReminders?.reminders ?? []" size="small" :loading="isLoading">
          <template #empty>
            <div class="py-6 text-center text-sm opacity-70">No pending documentation for today.</div>
          </template>
          <Column field="patient_name" header="Patient">
            <template #body="{ data }">
              <button type="button" class="font-medium hover:underline" @click="openPatientDocumentation(data)">
                {{ data.patient_name || "Unnamed patient" }}
              </button>
            </template>
          </Column>
          <Column field="starts_at" header="Schedule">
            <template #body="{ data }">{{ formatTimeRange(data.starts_at, data.ends_at) }}</template>
          </Column>
          <Column field="appointment_phase" header="Phase" />
          <Column field="appointment_status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.appointment_status" severity="secondary" />
            </template>
          </Column>
          <Column header="Action" style="width: 120px">
            <template #body="{ data }">
              <Button label="Open" size="small" text @click="openPatientDocumentation(data)" />
            </template>
          </Column>
        </DataTable>
      </article>

      <article v-if="canViewPtAssignedAppointments" class="app-dashboard-panel space-y-3">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="text-sm font-semibold">Today's Assigned Appointments</h3>
            <p class="app-muted-text mt-1 text-xs">Appointments assigned to you for today.</p>
          </div>
          <Tag
            :value="`${ptTodayAssignedAppointments.length} assigned`"
            :severity="ptTodayAssignedAppointments.length > 0 ? 'info' : 'secondary'"
          />
        </div>

        <DataTable class="app-data-table" :value="ptTodayAssignedAppointments" size="small" :loading="isLoading">
          <template #empty>
            <div class="py-6 text-center text-sm opacity-70">No assigned appointments for today.</div>
          </template>
          <Column field="patient_name" header="Patient" />
          <Column field="starts_at" header="Schedule">
            <template #body="{ data }">{{ formatTimeRange(data.starts_at, data.ends_at) }}</template>
          </Column>
          <Column field="clinic_name" header="Branch" />
          <Column field="appointment_status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.appointment_status" severity="secondary" />
            </template>
          </Column>
        </DataTable>
      </article>

      <div v-if="canViewPtAttendance" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article class="app-dashboard-panel space-y-3">
          <h3 class="text-sm font-semibold">Weekly Attendance</h3>
          <DataTable class="app-data-table" :value="ptAttendance?.weekly.days ?? []" size="small" :loading="isLoading">
            <template #empty>
              <div class="py-6 text-center text-sm opacity-70">No attendance found for this week.</div>
            </template>
            <Column field="date" header="Date">
              <template #body="{ data }">{{ formatDateKey(data.date) }}</template>
            </Column>
            <Column field="count" header="Attendance" />
          </DataTable>
        </article>

        <article class="app-dashboard-panel space-y-3">
          <h3 class="text-sm font-semibold">Monthly Attendance</h3>
          <DataTable class="app-data-table" :value="ptAttendance?.monthly.days ?? []" size="small" :loading="isLoading">
            <template #empty>
              <div class="py-6 text-center text-sm opacity-70">No attendance found for this month.</div>
            </template>
            <Column field="date" header="Date">
              <template #body="{ data }">{{ formatDateKey(data.date) }}</template>
            </Column>
            <Column field="count" header="Attendance" />
          </DataTable>
        </article>
      </div>

      <article v-if="!hasAnyPtDashboardWidget" class="app-dashboard-panel py-8 text-center text-sm opacity-70">
        No dashboard cards are enabled for this position yet.
      </article>
    </section>

    <section v-if="!isPtDashboard" class="app-section-card-comfy  space-y-3">
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

      <div v-if="canViewSummaryCards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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

      <div v-if="canViewMarketingChannels" class="app-dashboard-panel">
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

      <article v-if="!hasAnyAdminDashboardWidget" class="app-dashboard-panel py-8 text-center text-sm opacity-70">
        No dashboard cards are enabled for this position yet.
      </article>
    </section>

    <section v-if="!isPtDashboard && canViewAppointmentTrend" class="app-section-card-comfy space-y-4">
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

    <section v-if="!isPtDashboard && (canViewBillingDistribution || canViewRecentAppointments)" class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <article v-if="canViewBillingDistribution" class="app-section-card-comfy space-y-3">
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

      <article v-if="canViewRecentAppointments" class="app-section-card-comfy space-y-3">
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

    <section v-if="!isPtDashboard && canViewPtPerformance" class="app-section-card-comfy space-y-3">
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

    <section v-if="!isPtDashboard && canViewReferringDoctorSessions" class="app-section-card-comfy space-y-4">
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
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue"
import {useRouter} from "vue-router"
import {storeToRefs} from "pinia"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Tag from "primevue/tag"
import {errorToast, infoToast} from "@/utils/toast.util"
import {useToast} from "primevue/usetoast"
import {getApiErrorMessage} from "@/utils/actionable-error.util"
import {ptPrimaryBtn} from "@/features/shared/table-header.styles"
import {
  dashboardService,
  type DashboardConfidentialRevenue,
  type DashboardDistributionItem,
  type DashboardPtAssignedAppointment,
  type DashboardPtAttendance,
  type DashboardPtDocumentationReminderItem,
  type DashboardPtDocumentationReminders,
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
import {useAuthSessionStore} from "@/stores/auth-session.store"
import {isPtAppointmentProvider} from "@/utils/appointment-provider.util"

const toast = useToast()
const router = useRouter()
const isLoading = ref(false)
const globalClinicStore = clinicStore()
const { selectedClinicId, selectedClinic } = storeToRefs(globalClinicStore)
const authSession = useAuthSessionStore()
const {currentUser, staffName, roleName} = storeToRefs(authSession)
const isPtDashboard = computed(() => isPtAppointmentProvider(currentUser.value))
const isOwnerRole = computed(() => roleName.value.trim().toLowerCase() === "owner")

const canViewDashboardPermission = (permission: string): boolean =>
  isOwnerRole.value || authSession.hasAnyPermission(permission)

const canViewDashboardCardPermission = (permission: string): boolean =>
  canViewDashboardPermission(permission)
const canViewMonthlyTotalAppointments = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_MONTHLY_TOTAL_APPOINTMENTS"))
const canViewActivePatients = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_ACTIVE_PATIENTS"))
const canViewAppointmentsToday = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_APPOINTMENTS_TODAY"))
const canViewReschedulingCancellationIndex = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_RESCHEDULING_CANCELLATION_INDEX"))
const canViewHmoBookingsMonthlyTotal = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_HMO_BOOKINGS_MONTHLY_TOTAL"))
const canViewLguBookingsMonthlyTotal = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_LGU_BOOKINGS_MONTHLY_TOTAL"))
const canViewPendingBillings = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_PENDING_BILLINGS"))
const canViewPaidBillings = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_PAID_BILLINGS"))
const canViewHmoRevenue = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_HMO_REVENUE"))
const canViewLguRevenue = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_LGU_REVENUE"))
const canViewOnlineMarketingRevenue = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_ONLINE_MARKETING_REVENUE"))
const canViewDirectMarketingRevenue = computed(() => canViewDashboardCardPermission("Dashboard::VIEW_DIRECT_MARKETING_REVENUE"))
const canViewSummaryCards = computed(() =>
  canViewMonthlyTotalAppointments.value ||
  canViewActivePatients.value ||
  canViewAppointmentsToday.value ||
  canViewReschedulingCancellationIndex.value ||
  canViewHmoBookingsMonthlyTotal.value ||
  canViewLguBookingsMonthlyTotal.value ||
  canViewPendingBillings.value ||
  canViewPaidBillings.value ||
  canViewHmoRevenue.value ||
  canViewLguRevenue.value ||
  canViewOnlineMarketingRevenue.value ||
  canViewDirectMarketingRevenue.value
)
const canViewAnyConfidentialRevenueCard = computed(() =>
  canViewLguRevenue.value ||
  canViewOnlineMarketingRevenue.value ||
  canViewDirectMarketingRevenue.value
)
const canViewMarketingChannels = computed(() => canViewDashboardPermission("Dashboard::VIEW_MARKETING_CHANNELS"))
const canViewAppointmentTrend = computed(() => canViewDashboardPermission("Dashboard::VIEW_APPOINTMENT_TREND"))
const canViewBillingDistribution = computed(() => canViewDashboardPermission("Dashboard::VIEW_BILLING_DISTRIBUTION"))
const canViewRecentAppointments = computed(() => canViewDashboardPermission("Dashboard::VIEW_RECENT_APPOINTMENTS"))
const canViewPtPerformance = computed(() => canViewDashboardPermission("Dashboard::VIEW_PT_PERFORMANCE"))
const canViewReferringDoctorSessions = computed(() => canViewDashboardPermission("Dashboard::VIEW_REFERRING_DOCTOR_SESSIONS"))
const canViewConfidentialRevenue = computed(() => canViewAnyConfidentialRevenueCard.value)
const canViewPtAttendance = computed(() => canViewDashboardPermission("Dashboard::VIEW_PT_ATTENDANCE"))
const canViewPtDocumentationReminders = computed(() => canViewDashboardPermission("Dashboard::VIEW_PT_DOCUMENTATION_REMINDERS"))
const canViewPtAssignedAppointments = computed(() => canViewDashboardPermission("Dashboard::VIEW_PT_ASSIGNED_APPOINTMENTS"))
const hasAnyAdminDashboardWidget = computed(() =>
  canViewSummaryCards.value ||
  canViewMarketingChannels.value ||
  canViewAppointmentTrend.value ||
  canViewBillingDistribution.value ||
  canViewRecentAppointments.value ||
  canViewPtPerformance.value ||
  canViewReferringDoctorSessions.value
)
const hasAnyPtDashboardWidget = computed(() =>
  canViewPtAttendance.value ||
  canViewPtDocumentationReminders.value ||
  canViewPtAssignedAppointments.value
)

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
const ptAttendance = ref<DashboardPtAttendance>()
const ptDocumentationReminders = ref<DashboardPtDocumentationReminders>()
const ptTodayAssignedAppointments = ref<DashboardPtAssignedAppointment[]>([])
const isDoctorSessionsLoading = ref(false)
const doctorSessionsDateRange = ref<Date[] | null>(null)
const doctorSessionsReport = ref<ReferringDoctorCompletedSessionsReport>()
const canViewConfidentialRevenueCards = ref(false)
const hideSensitiveDashboardData = ref(localStorage.getItem("dashboard.hideSensitiveData") === "true")

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {hour: "numeric", minute: "2-digit"})

const formatTimeRange = (startsAt: string, endsAt: string): string =>
  `${formatTime(startsAt)} - ${formatTime(endsAt)}`

const formatDate = (value: Date): string =>
  value.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const formatDateKey = (value?: string): string => {
  if (!value) return "-"
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

const formatDateRange = (from?: string, to?: string): string => {
  if (!from || !to) return "No date range"
  return `${formatDateKey(from)} to ${formatDateKey(to)}`
}

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

type KpiCard = {
  label: string
  value: number | string
  accent: string
}

const kpiCards = computed<KpiCard[]>(() => {
  const cards: KpiCard[] = []

  if (canViewMonthlyTotalAppointments.value) {
    cards.push({label: "Monthly Total Appointments", value: metrics.value.monthlyTotalAppointments, accent: '#3b82f6'})
  }
  if (canViewActivePatients.value) {
    cards.push({label: "Active Patients", value: metrics.value.activePatients, accent: '#8b5cf6'})
  }
  if (canViewAppointmentsToday.value) {
    cards.push({label: "Appointments Today", value: metrics.value.appointmentsToday, accent: '#06b6d4'})
  }
  if (canViewReschedulingCancellationIndex.value) {
    cards.push({label: "Rescheduling/Cancellation Index", value: `${metrics.value.rescheduleCancellationIndex}%`, accent: '#f59e0b'})
  }
  if (canViewHmoBookingsMonthlyTotal.value) {
    cards.push({label: "HMO (Bookings) Monthly Total", value: metrics.value.hmoBookingsMonthlyTotal, accent: '#14b8a6'})
  }
  if (canViewLguBookingsMonthlyTotal.value) {
    cards.push({label: "LGU (Bookings) Monthly Total", value: metrics.value.lguBookingsMonthlyTotal, accent: '#10b981'})
  }
  if (canViewPendingBillings.value) {
    cards.push({label: "Pending Billings", value: metrics.value.pendingBillings, accent: '#f97316'})
  }
  if (canViewPaidBillings.value) {
    cards.push({label: "Paid Billings", value: metrics.value.paidBillings, accent: '#22c55e'})
  }
  if (canViewHmoRevenue.value) {
    cards.push({label: "HMO Revenue", value: formatSensitiveCurrency(metrics.value.hmoRevenue), accent: '#14b8a6'})
  }

  if (canViewConfidentialRevenueCards.value) {
    if (canViewLguRevenue.value) {
      cards.push({label: "LGU Revenue", value: formatSensitiveCurrency(metrics.value.lguRevenue), accent: '#10b981'})
    }
    if (canViewOnlineMarketingRevenue.value) {
      cards.push({label: "Online Marketing Revenue", value: formatSensitiveCurrency(metrics.value.onlineMarketingRevenue), accent: '#a855f7'})
    }
    if (canViewDirectMarketingRevenue.value) {
      cards.push({label: "Direct Marketing Revenue", value: formatSensitiveCurrency(metrics.value.directMarketingRevenue), accent: '#ec4899'})
    }
  }

  return cards
})

const ptAttendanceCards = computed(() => [
  {
    label: "Weekly Attendance",
    value: ptAttendance.value?.weekly.attendance_count ?? 0,
    range: formatDateRange(ptAttendance.value?.weekly.from, ptAttendance.value?.weekly.to),
    accent: "#5E1869",
  },
  {
    label: "Monthly Attendance",
    value: ptAttendance.value?.monthly.attendance_count ?? 0,
    range: formatDateRange(ptAttendance.value?.monthly.from, ptAttendance.value?.monthly.to),
    accent: "#A91D8B",
  },
])

const openPatientDocumentation = (item: DashboardPtDocumentationReminderItem): void => {
  void router.push({
    name: "patients",
    query: {
      patientId: String(item.patient_id),
      name: item.patient_name,
    },
  })
}

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

const isPayerType = (value: unknown, payerType: string): boolean =>
  String(value ?? "").trim().toUpperCase() === payerType

const loadMetrics = async (): Promise<void> => {
  const monthRange = getMonthRange()
  const clinicId = selectedClinicId.value
  const [summaryResult, monthBillingsResult, monthHmoBillingsResult, monthAppointmentsResult] = await Promise.allSettled([
    dashboardService.getSummary(clinicId),
    billingPhase1Service.getAll({page: 1, size: 500, from_date: monthRange.from, to_date: monthRange.to, ...(clinicId ? {clinic_id: clinicId} : {})}),
    billingPhase1Service.getAll({page: 1, size: 500, billing_type: "HMO_BILLING", from_date: monthRange.from, to_date: monthRange.to, ...(clinicId ? {clinic_id: clinicId} : {})}),
    appointmentPhase1Service.getAll({page: 1, size: 500, ...(clinicId ? {clinic_id: clinicId} : {})}),
  ])

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : undefined
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
  const hmoAppointmentRows = monthAppointmentsRows.filter(item => isPayerType(item.payer_type, "HMO"))
  const lguAppointmentRows = monthAppointmentsRows.filter(item => isPayerType(item.payer_type, "LGU"))

  metrics.value = {
    monthlyTotalAppointments: summary?.monthly_total_appointments ?? monthAppointmentsRows.length,
    activePatients: summary?.active_patients ?? 0,
    appointmentsToday: summary?.appointments_today ?? 0,
    rescheduleCancellationIndex,
    hmoBookingsMonthlyTotal: summary?.hmo_bookings_month_to_date ?? hmoAppointmentRows.length,
    lguBookingsMonthlyTotal: summary?.lgu_bookings_month_to_date ?? lguAppointmentRows.length,
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

const loadPtAttendance = async (): Promise<void> => {
  ptAttendance.value = await dashboardService.getPtAttendance(selectedClinicId.value)
}

const loadPtDocumentationReminders = async (): Promise<void> => {
  ptDocumentationReminders.value = await dashboardService.getPtDocumentationReminders(selectedClinicId.value)
}

const loadPtTodayAssignedAppointments = async (): Promise<void> => {
  ptTodayAssignedAppointments.value = (await dashboardService.getPtTodayAssignedAppointments(selectedClinicId.value))?.appointments ?? []
}

let assignmentPollTimer: number | undefined
const assignmentAlertSeenKeys = new Set<string>()
const assignmentPollSince = ref(new Date().toISOString())

const assignmentAlertKey = (appointment: DashboardPtAssignedAppointment): string =>
  `${appointment.appointment_id}:${appointment.updated_at}`

const showAssignmentAlert = (appointment: DashboardPtAssignedAppointment): void => {
  infoToast(
    toast,
    `New appointment assigned: ${appointment.patient_name || "Unnamed patient"} (${formatDateTime(appointment.starts_at)})`
  )
}

const pollPtAssignedAppointments = async (notify = true): Promise<void> => {
  if (!isPtDashboard.value || !canViewPtAssignedAppointments.value) return

  const since = assignmentPollSince.value
  const result = await dashboardService.getPtAssignedAppointments(since, selectedClinicId.value)
  assignmentPollSince.value = result?.checked_at ?? new Date().toISOString()

  const appointments = result?.appointments ?? []
  for (const appointment of appointments.slice().reverse()) {
    const key = assignmentAlertKey(appointment)
    if (assignmentAlertSeenKeys.has(key)) continue
    assignmentAlertSeenKeys.add(key)
    if (notify) showAssignmentAlert(appointment)
  }
}

const startPtAssignmentPolling = (): void => {
  if (!canViewPtAssignedAppointments.value) {
    stopPtAssignmentPolling()
    return
  }
  if (assignmentPollTimer !== undefined) {
    window.clearInterval(assignmentPollTimer)
  }
  assignmentPollSince.value = new Date().toISOString()
  void pollPtAssignedAppointments(false)
  assignmentPollTimer = window.setInterval(() => {
    void pollPtAssignedAppointments(true).catch((error: unknown) => {
      console.warn("Failed to poll PT appointment assignments", error)
    })
  }, 30_000)
}

const stopPtAssignmentPolling = (): void => {
  if (assignmentPollTimer === undefined) return
  window.clearInterval(assignmentPollTimer)
  assignmentPollTimer = undefined
}

const refreshDashboard = async (): Promise<void> => {
  try {
    isLoading.value = true
    if (isPtDashboard.value) {
      const ptTasks: Array<Promise<void>> = []
      if (canViewPtAttendance.value) ptTasks.push(loadPtAttendance())
      if (canViewPtDocumentationReminders.value) ptTasks.push(loadPtDocumentationReminders())
      if (canViewPtAssignedAppointments.value) ptTasks.push(loadPtTodayAssignedAppointments())
      await Promise.all(ptTasks)
      return
    }

    const tasks: Array<{ name: string; critical?: boolean; run: () => Promise<void> }> = []
    if (canViewSummaryCards.value) tasks.push({ name: "summary", critical: true, run: loadMetrics })
    if (canViewSummaryCards.value && canViewConfidentialRevenue.value) tasks.push({ name: "confidential-revenue", run: loadConfidentialRevenue })
    if (canViewAppointmentTrend.value) tasks.push({ name: "trend", critical: true, run: loadTrend })
    if (canViewBillingDistribution.value) tasks.push({ name: "billing-distribution", run: loadBillingDistribution })
    if (canViewRecentAppointments.value) tasks.push({ name: "recent-appointments", run: loadRecentAppointments })
    if (canViewPtPerformance.value) tasks.push({ name: "pt-performance", run: loadPtPerformance })

    const results = await Promise.allSettled(tasks.map(task => task.run()))

    const confidentialRevenueIndex = tasks.findIndex(task => task.name === "confidential-revenue")
    const confidentialRevenueResult = confidentialRevenueIndex >= 0 ? results[confidentialRevenueIndex] : undefined
    if (confidentialRevenueResult?.status === "rejected") {
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
      const criticalFailures = results.filter((result, index) => tasks[index]?.critical && result.status === "rejected")
      if (criticalFailures.length > 0) {
        errorToast(toast, "Failed to load some dashboard data")
      }
    }
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, {baseMessage: "Dashboard data could not be loaded"}))
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    await authSession.ensureLoaded()
  } catch {
    authSession.clear()
  }

  try {
    await globalClinicStore.loadClinics()
  } catch {
    errorToast(toast, "Failed to load clinic list")
  }

  if (isPtDashboard.value) {
    void refreshDashboard()
    if (canViewPtAssignedAppointments.value) startPtAssignmentPolling()
    return
  }

  if (canViewReferringDoctorSessions.value) initializeDoctorSessionsDateRange()
  void refreshDashboard()
  if (canViewReferringDoctorSessions.value) void refreshDoctorSessionsReport()
})

// Refresh dashboard when clinic selection changes
watch(selectedClinicId, () => {
  void refreshDashboard()
  if (isPtDashboard.value) {
    startPtAssignmentPolling()
  }
  if (!isPtDashboard.value && canViewReferringDoctorSessions.value) {
    void refreshDoctorSessionsReport()
  }
})

onBeforeUnmount(() => {
  stopPtAssignmentPolling()
})
</script>
