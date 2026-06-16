<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue"
import {storeToRefs} from "pinia"
import {useRoute} from "vue-router"
import {useConfirm} from "primevue/useconfirm"
import {useToast} from "primevue/usetoast"
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
  type EndOfDayHistoryItem,
  type PtEndOfDayReport,
} from "@/features/appointments/api/appointment-phase1.service"
import {
  billingPhase1Service,
  type DailyIncomeExpenseReport,
  type MonthlyIncomeExpenseReport
} from "@/features/billing/api/billing-phase1.service"
import {ptOutlinedBtn, ptPrimaryBtn} from "@/features/shared/table-header.styles"
import {getApiErrorMessage} from "@/utils/actionable-error.util"
import {errorToast, successToast} from "@/utils/toast.util"
import {clinicStore} from "@/stores/clinic.store"
import {useAuthSessionStore} from "@/stores/auth-session.store"
import {pamsAPI} from "@/utils/axios-interceptor"
import {printDailyReport} from "@/features/reports/utils/daily-report-print.util"

const toast = useToast()
const confirm = useConfirm()
const route = useRoute()
const authSession = useAuthSessionStore()

const isLoading = ref(false)
const isSavingExpense = ref(false)
const isEodLoading = ref(false)
const isEodHistoryLoading = ref(false)
const selectedDate = ref(new Date())
const globalClinicStore = clinicStore()
const {selectedClinicId, selectedClinic} = storeToRefs(globalClinicStore)
const report = ref<DailyIncomeExpenseReport>()
const monthlyReport = ref<MonthlyIncomeExpenseReport>()
const eodReport = ref<PtEndOfDayReport>()
const eodHistoryItems = ref<EndOfDayHistoryItem[]>([])
const eodHistoryDetailsVisible = ref(false)
const selectedEodHistoryItem = ref<EndOfDayHistoryItem>()
const eodSectionRef = ref<HTMLElement | null>(null)
const monthlySectionRef = ref<HTMLElement | null>(null)
const expenseForm = ref({
  expense_item_id: null as number | null,
  amount: 0,
  notes: ""
})

type ExpenseItemRow = { id: number; name: string; is_active: boolean }
const expenseItems = ref<ExpenseItemRow[]>([])
const activeExpenseItems = computed(() => expenseItems.value.filter(item => item.is_active))

const hasAnyPermission = (...permissions: string[]): boolean => {
  return authSession.hasAnyPermission(...permissions)
}

const canViewEodReports = computed(() => hasAnyPermission("Appointment::READ"))
const canViewFinanceReports = computed(() => hasAnyPermission("Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"))
const canManageExpenses = computed(() => hasAnyPermission("Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"))

const selectedDateLabel = computed(() =>
  selectedDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const selectedMonthParam = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = String(selectedDate.value.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
})

const selectedMonthLabel = computed(() =>
  selectedDate.value.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long"
  })
)

const selectedClinicScheduleLabel = computed(() => {
  if (!selectedClinic.value) return "Select a branch in the sidebar to scope End-of-Day reports"
  return `${selectedClinic.value.start_day_name} to ${selectedClinic.value.end_day_name} · ${selectedClinic.value.start_time_formatted} - ${selectedClinic.value.end_time_formatted}`
})

const selectedEodWindowLabel = computed(() => {
  if (!eodReport.value?.clinic) return ""
  const start = formatDateTime(eodReport.value.clinic.window_starts_at)
  const end = formatDateTime(eodReport.value.clinic.window_ends_at)
  return `${eodReport.value.clinic.name} window: ${start} to ${end}`
})

const summaryCards = computed(() => [
  {
    label: "Gross Daily Charges",
    value: asCurrency(report.value?.summary.gross_income ?? 0),
    caption: "Only PARTIAL, BILLED, and PAID records"
  },
  {
    label: "Cash Collected",
    value: asCurrency(report.value?.summary.cash_collected ?? 0),
    caption: "Actual payments received today"
  },
  {
    label: "Outstanding",
    value: asCurrency(report.value?.summary.outstanding_balance ?? 0),
    caption: "Remaining balance from billed/partial entries"
  },
  {
    label: "Unbilled Appointments",
    value: String(report.value?.summary.unbilled_appointment_count ?? 0),
    caption: "Appointments not yet converted to billable records"
  },
  {
    label: "Incomplete Billings",
    value: `${report.value?.summary.incomplete_billing_count ?? 0} · ${asCurrency(report.value?.summary.incomplete_billing_balance ?? 0)}`,
    caption: `${report.value?.summary.partial_billing_count ?? 0} partially paid billings included`
  },
  {
    label: "Expenses",
    value: asCurrency(report.value?.summary.expense_total ?? 0),
    caption: "Manually entered operating expenses"
  },
  {
    label: "Net Income",
    value: asCurrency((report.value?.summary.gross_income ?? 0) - (report.value?.summary.expense_total ?? 0)),
    caption: "Gross charges minus expenses"
  },
  {
    label: "Net Cash",
    value: asCurrency(report.value?.summary.net_cash ?? 0),
    caption: "Cash collected minus expenses"
  }
])

const monthlySummaryCards = computed(() => [
  {
    label: "Gross Monthly Charges",
    value: asCurrency(monthlyReport.value?.summary.gross_income ?? 0),
    caption: "Only PARTIAL, BILLED, and PAID records"
  },
  {
    label: "Cash Collected",
    value: asCurrency(monthlyReport.value?.summary.cash_collected ?? 0),
    caption: "Payments received within the month"
  },
  {
    label: "Outstanding",
    value: asCurrency(monthlyReport.value?.summary.outstanding_balance ?? 0),
    caption: "Uncleared billed/partial balance across the month"
  },
  {
    label: "Unbilled Appointments",
    value: String(monthlyReport.value?.summary.unbilled_appointment_count ?? 0),
    caption: "Appointments still outside billed totals"
  },
  {
    label: "Incomplete Billings",
    value: `${monthlyReport.value?.summary.incomplete_billing_count ?? 0} · ${asCurrency(monthlyReport.value?.summary.incomplete_billing_balance ?? 0)}`,
    caption: `${monthlyReport.value?.summary.partial_billing_count ?? 0} partially paid billings included`
  },
  {
    label: "Expenses",
    value: asCurrency(monthlyReport.value?.summary.expense_total ?? 0),
    caption: "Operating expenses logged this month"
  },
  {
    label: "Net Income",
    value: asCurrency((monthlyReport.value?.summary.gross_income ?? 0) - (monthlyReport.value?.summary.expense_total ?? 0)),
    caption: "Gross charges minus monthly expenses"
  },
  {
    label: "Net Cash",
    value: asCurrency(monthlyReport.value?.summary.net_cash ?? 0),
    caption: "Cash collected minus monthly expenses"
  }
])

const eodSummaryCards = computed(() => [
  {
    label: "EOD Report",
    value: eodReport.value?.eod_report_generated ? "Generated" : "Waiting",
    caption: eodReport.value?.eod_report_generated
      ? "Auto-created after all PT signatures are submitted"
      : "Will auto-create once all PT signatures are complete"
  },
  {
    label: "Pending PT Signatures",
    value: String(eodReport.value?.summary.pending_pt_signature_count ?? 0),
    caption: "Appointments still missing PT completion sign-off"
  },
  {
    label: "Billings Cleared",
    value: `${eodReport.value?.summary.billing_cleared_appointments ?? 0}/${eodReport.value?.summary.eligible_appointments ?? 0}`,
    caption: "Cleared billings for the same eligible appointments"
  },
  {
    label: "Eligible Appointments",
    value: String(eodReport.value?.summary.eligible_appointments ?? 0),
    caption: "Active same-day appointments counted in EOD"
  }
])

const toDateParam = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const asCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number(value ?? 0))

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  })

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })

const billingRouteSeverity = (value: string): "success" | "info" | "warn" | "contrast" => {
  const normalized = value.trim().toUpperCase()
  if (normalized === "HMO") return "info"
  if (normalized === "LGU") return "warn"
  if (normalized === "PACKAGE") return "contrast"
  return "success"
}

const getFinanceReportsErrorMessage = (error: unknown): string =>
  getApiErrorMessage(error, {
    baseMessage: "Finance reports could not be loaded",
    permissionHint: "Billing access (Read Only or Can Edit) in Role Access",
    notFoundHint: "No finance report data was found for the selected date. Try another date or refresh the page.",
    invalidInputHint: "The selected date or filters are invalid. Please check your inputs and try again.",
    retryHint: "Refresh and try again."
  })

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined

  const candidate = error as { status?: unknown; response?: { status?: unknown } }
  const status = candidate.status ?? candidate.response?.status
  return typeof status === "number" ? status : undefined
}

const createEmptyDailyReport = (date: string): DailyIncomeExpenseReport => ({
  selected_date: date,
  summary: {
    income_entry_count: 0,
    expense_entry_count: 0,
    unbilled_appointment_count: 0,
    incomplete_billing_count: 0,
    partial_billing_count: 0,
    gross_income: 0,
    cash_collected: 0,
    outstanding_balance: 0,
    incomplete_billing_balance: 0,
    expense_total: 0,
    net_cash: 0
  },
  incomes: [],
  expenses: []
})

const createEmptyMonthlyReport = (month: string): MonthlyIncomeExpenseReport => ({
  selected_month: month,
  summary: {
    active_day_count: 0,
    days_with_income: 0,
    days_with_expenses: 0,
    income_entry_count: 0,
    expense_entry_count: 0,
    unbilled_appointment_count: 0,
    incomplete_billing_count: 0,
    partial_billing_count: 0,
    gross_income: 0,
    cash_collected: 0,
    outstanding_balance: 0,
    incomplete_billing_balance: 0,
    expense_total: 0,
    net_cash: 0
  },
  days: []
})

const refreshReport = async (): Promise<void> => {
  if (!canViewFinanceReports.value) return
  try {
    isLoading.value = true
    const clinicId = selectedClinicId.value
    const dailyDate = toDateParam(selectedDate.value)
    const monthParam = selectedMonthParam.value
    const [dailyReportResult, monthReportResult] = await Promise.allSettled([
      billingPhase1Service.getDailyIncomeExpense(dailyDate, clinicId),
      billingPhase1Service.getMonthlyIncomeExpense(monthParam, dailyDate, clinicId)
    ])

    if (dailyReportResult.status === "fulfilled") {
      report.value = dailyReportResult.value
    } else {
      report.value = createEmptyDailyReport(dailyDate)
    }

    if (monthReportResult.status === "fulfilled") {
      monthlyReport.value = monthReportResult.value
    } else {
      monthlyReport.value = createEmptyMonthlyReport(monthParam)
    }

    const fatalErrors = [dailyReportResult, monthReportResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason)
      .filter((error) => getHttpStatus(error) !== 400)

    if (fatalErrors.length > 0) {
      throw fatalErrors[0]
    }
  } catch (error: unknown) {
    errorToast(toast, getFinanceReportsErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const refreshEodReport = async (): Promise<void> => {
  if (!canViewEodReports.value) return
  if (!selectedClinicId.value) {
    eodReport.value = undefined
    return
  }

  try {
    isEodLoading.value = true
    eodReport.value = await appointmentPhase1Service.getPtEndOfDay(toDateParam(selectedDate.value), selectedClinicId.value)
  } catch (error: unknown) {
    errorToast(
      toast,
      getApiErrorMessage(error, {
        baseMessage: "End-of-day report could not be loaded",
        permissionHint: "Reports access (Appointment Read)",
        notFoundHint: "No end-of-day data was found for the selected date and clinic. Select another date/clinic, then click Refresh.",
        invalidInputHint: "The selected date or clinic is invalid. Re-select both values and try again.",
        retryHint: "Select date and clinic, then click Refresh."
      })
    )
  } finally {
    isEodLoading.value = false
  }
}

const refreshEodHistory = async (): Promise<void> => {
  if (!canViewEodReports.value) return
  if (!selectedClinicId.value) {
    eodHistoryItems.value = []
    return
  }

  try {
    isEodHistoryLoading.value = true
    eodHistoryItems.value =
      await appointmentPhase1Service.getEndOfDayHistory({
        clinic_id: selectedClinicId.value,
        limit: 100
      })
      ?? []
  } catch (error: unknown) {
    errorToast(
      toast,
      getApiErrorMessage(error, {
        baseMessage: "End-of-day history could not be loaded",
        permissionHint: "Reports access (Appointment Read)",
        notFoundHint: "No end-of-day history was found for this clinic yet. Try another clinic or date range.",
        invalidInputHint: "The selected clinic is invalid. Re-select a clinic, then refresh.",
        retryHint: "Re-select clinic and click Refresh."
      })
    )
  } finally {
    isEodHistoryLoading.value = false
  }
}

const resetExpenseForm = (): void => {
  expenseForm.value = {
    expense_item_id: null,
    amount: 0,
    notes: ""
  }
}

const saveExpense = async (): Promise<void> => {
  if (!canManageExpenses.value) return
  const selectedExpenseItem = activeExpenseItems.value.find(item => item.id === expenseForm.value.expense_item_id)
  if (!selectedExpenseItem) {
    errorToast(toast, "Expense item is required")
    return
  }

  if (!Number(expenseForm.value.amount)) {
    errorToast(toast, "Expense amount must be greater than zero")
    return
  }

  try {
    isSavingExpense.value = true
    await billingPhase1Service.addDailyExpense({
      expense_date: toDateParam(selectedDate.value),
      clinic_id: selectedClinicId.value,
      item_name: selectedExpenseItem.name,
      amount: Number(expenseForm.value.amount ?? 0),
      notes: expenseForm.value.notes.trim() || undefined
    })
    successToast(toast, "Expense added")
    resetExpenseForm()
    await refreshReport()
  } catch (error: unknown) {
    errorToast(
      toast,
      getApiErrorMessage(error, {
        baseMessage: "Expense could not be saved",
        permissionHint: "Billing access (Can Edit)",
        invalidInputHint: "Expense details are incomplete or invalid. Check item name and amount, then save again.",
        retryHint: "Verify details and try again."
      })
    )
  } finally {
    isSavingExpense.value = false
  }
}

const loadExpenseItems = async (): Promise<void> => {
  try {
    const { data } = await pamsAPI.get<{ content: ExpenseItemRow[] }>("/references/expense-items", {
      params: { page: 1, size: 1000, name: "", status: "ALL" }
    })
    expenseItems.value = data?.content ?? []
  } catch {
    expenseItems.value = []
  }
}

const confirmDeleteExpense = (id: number, itemName: string): void => {
  if (!canManageExpenses.value) return
  confirm.require({
    message: `Delete expense entry for ${itemName}?`,
    header: "Delete Expense",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
      icon: "pi pi-trash"
    },
    accept: async () => {
      try {
        await billingPhase1Service.deleteDailyExpense(id)
        successToast(toast, "Expense deleted")
        await refreshReport()
      } catch (error: unknown) {
        errorToast(
          toast,
          getApiErrorMessage(error, {
            baseMessage: "Expense could not be deleted",
            permissionHint: "Billing access (Can Edit)",
            retryHint: "Refresh the page and try again."
          })
        )
      }
    }
  })
}

const resetToToday = (): void => {
  selectedDate.value = new Date()
}

const printSelectedDailyReport = (): void => {
  try {
    printDailyReport({
      report: report.value,
      eodReport: eodReport.value,
      selectedDateLabel: selectedDateLabel.value,
      selectedClinicName: selectedClinic.value?.name ?? null,
      selectedClinicScheduleLabel: selectedClinicScheduleLabel.value,
      selectedEodWindowLabel: selectedEodWindowLabel.value,
      generatedBy: authSession.staffName
    })
  } catch (error: unknown) {
    errorToast(toast, error instanceof Error ? error.message : "Daily report print window could not be opened.")
  }
}

const openEodHistoryDetails = (item: EndOfDayHistoryItem): void => {
  selectedEodHistoryItem.value = item
  eodHistoryDetailsVisible.value = true
}

const refreshAllReports = async (): Promise<void> => {
  await Promise.all([
    refreshReport(),
    refreshEodReport(),
    refreshEodHistory()
  ])
}

const formatMonthDay = (value: string): string =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    weekday: "short"
  })

const endOfDayStatusSeverity = (value: boolean): "success" | "warn" => (value ? "success" : "warn")

const eodReportStatusLabel = computed(() => {
  if (!eodReport.value?.summary.eligible_appointments) {
    return "No active appointments for selected day"
  }
  return eodReport.value?.eod_report_generated
    ? "EOD report generated automatically"
    : "Waiting for all PT signatures"
})

const allAppointmentsDoneLabel = computed(() => {
  if (!eodReport.value?.summary.eligible_appointments) return "No active appointments"
  if (eodReport.value.summary.all_appointments_done) return "All appointments are done"
  return `${eodReport.value.summary.pending_pt_signature_count} appointment${eodReport.value.summary.pending_pt_signature_count > 1 ? "s" : ""} pending PT signature`
})

const allBillingsClearedLabel = computed(() => {
  if (!eodReport.value?.summary.eligible_appointments) return "No billing to clear"
  if (eodReport.value.summary.all_billings_cleared) return "All billings are cleared"
  return `${eodReport.value.summary.pending_billing_count} billing${eodReport.value.summary.pending_billing_count > 1 ? "s" : ""} pending clearance`
})

const scrollToRequestedSection = async (): Promise<void> => {
  const section = typeof route.query.section === "string" ? route.query.section : undefined
  if (!section) return

  await nextTick()

  if (section === "eod") {
    eodSectionRef.value?.scrollIntoView({behavior: "smooth", block: "start"})
    return
  }

  if (section === "monthly") {
    monthlySectionRef.value?.scrollIntoView({behavior: "smooth", block: "start"})
  }
}

watch(selectedDate, () => {
  void refreshReport()
  void refreshEodReport()
  void refreshEodHistory()
})

watch(selectedClinicId, () => {
  void refreshReport()
  void refreshEodReport()
  void refreshEodHistory()
})

watch(() => route.query.section, () => {
  void scrollToRequestedSection()
})

onMounted(async () => {
  try {
    await authSession.ensureLoaded()
  } catch {
    // Ignore
  }
  try {
    await globalClinicStore.initializeFromAuthSession()
  } catch (error: unknown) {
    errorToast(
      toast,
      getApiErrorMessage(error, {
        baseMessage: "Clinic list could not be loaded",
        permissionHint: "Clinic access (Read or Lookup)",
        retryHint: "Refresh this page or ask admin to grant Clinic access."
      })
    )
  }
  await loadExpenseItems()
  void refreshAllReports()
  void scrollToRequestedSection()
})
</script>

<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner-vivid">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Finance, Closeout &amp; Analytics</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Central workspace for same-day finance, monthly rollups, end-of-day closeout, audit history, and treatment analytics.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Date: {{ selectedDateLabel }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Month: {{ selectedMonthLabel }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Income Rows: {{ report?.summary.income_entry_count ?? 0 }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Expense Rows: {{ report?.summary.expense_entry_count ?? 0 }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              EOD: {{ eodReport?.eod_report_generated ? 'Generated' : 'Waiting' }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Today" icon="pi pi-calendar" outlined :pt="ptOutlinedBtn" @click="resetToToday" />
          <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading || isEodLoading" :pt="ptOutlinedBtn" @click="refreshAllReports" />
          <Button label="Print Daily" icon="pi pi-print" severity="secondary" outlined :disabled="isLoading || isEodLoading" :pt="ptOutlinedBtn" @click="printSelectedDailyReport" />
        </div>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,320px)_1fr]">
        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Report Date</label>
          <DatePicker
            v-model="selectedDate"
            showIcon
            fluid
            :manualInput="false"
            dateFormat="mm/dd/yy"
          />
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-sm opacity-75">
          The income table uses saved billings for the selected day. The expense table is manually maintained so reception, cashier, or admin can capture same-day operational spending in one shared place.
        </div>
      </div>

      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-sm opacity-75">
        {{ selectedClinicScheduleLabel }}
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <article v-for="card in summaryCards" :key="card.label" class="app-section-card-comfy space-y-1">
        <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
        <div class="text-2xl font-semibold">{{ card.value }}</div>
        <div class="text-xs opacity-60">{{ card.caption }}</div>
      </article>
    </section>

    <section v-if="canViewEodReports" ref="eodSectionRef" class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="app-section-title">End-of-Day Report</h2>
          <p class="text-sm opacity-70">The EOD report is automatically created only after all PT signatures are submitted for active same-day appointments.</p>
        </div>
        <div class="text-sm opacity-70">
          {{ selectedDateLabel }}
        </div>
      </div>

      <div v-if="selectedEodWindowLabel" class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3 text-sm opacity-80">
        {{ selectedEodWindowLabel }}
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in eodSummaryCards" :key="card.label" class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
          <div class="mt-2 text-2xl font-semibold">{{ card.value }}</div>
          <div class="mt-1 text-xs opacity-60">{{ card.caption }}</div>
        </article>
      </div>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-2">
          <div class="text-xs uppercase tracking-wide opacity-55">Report Status</div>
          <Tag :value="eodReportStatusLabel" :severity="endOfDayStatusSeverity(Boolean(eodReport?.eod_report_generated))" />
          <div v-if="eodReport?.eod_generated_at" class="text-xs opacity-60">Generated at {{ formatDateTime(eodReport.eod_generated_at) }}</div>
        </article>
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-2">
          <div class="text-xs uppercase tracking-wide opacity-55">Appointments</div>
          <Tag :value="allAppointmentsDoneLabel" :severity="endOfDayStatusSeverity(Boolean(eodReport?.summary.all_appointments_done))" />
        </article>
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-2">
          <div class="text-xs uppercase tracking-wide opacity-55">Billing</div>
          <Tag :value="allBillingsClearedLabel" :severity="endOfDayStatusSeverity(Boolean(eodReport?.summary.all_billings_cleared))" />
        </article>
      </div>

      <div class="overflow-x-auto">
        <DataTable :value="eodReport?.pending_pt_signatures_by_pt ?? []" size="small" :loading="isEodLoading" scrollable>
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">No pending PT signatures. EOD can be generated automatically for {{ selectedDateLabel }}.</div>
          </template>

          <Column header="Primary PT" style="min-width: 260px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold">{{ data.pt_name }}</div>
                <div class="text-xs opacity-60">Eligible appointments: {{ data.eligible_appointment_count }}</div>
              </div>
            </template>
          </Column>

          <Column header="Pending PT Signatures" style="min-width: 200px">
            <template #body="{ data }">
              <Tag :value="String(data.pending_pt_signature_count)" :severity="data.pending_pt_signature_count > 0 ? 'warn' : 'success'" />
            </template>
          </Column>
        </DataTable>
      </div>

      <div class="space-y-3">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h3 class="text-base font-semibold tracking-tight">EOD History Log</h3>
          <div class="text-sm opacity-70">Permanent audit trail of generated end-of-day snapshots</div>
        </div>

        <div class="overflow-x-auto">
          <DataTable :value="eodHistoryItems" size="small" :loading="isEodHistoryLoading" scrollable>
            <template #empty>
              <div class="py-10 text-center text-sm opacity-70">No generated EOD snapshots yet.</div>
            </template>

            <Column header="Generated At" style="min-width: 190px">
              <template #body="{ data }">{{ formatDateTime(data.eod_generated_at) }}</template>
            </Column>

            <Column header="Report Date" style="min-width: 150px">
              <template #body="{ data }">{{ data.report_date }}</template>
            </Column>

            <Column header="Generated By" style="min-width: 220px">
              <template #body="{ data }">
                <div class="space-y-1">
                  <div class="font-medium">{{ data.generated_by_name || 'System' }}</div>
                  <div class="text-xs opacity-60">{{ data.generated_by_email || '--' }}</div>
                </div>
              </template>
            </Column>

            <Column header="Appointments" style="min-width: 170px">
              <template #body="{ data }">
                <div class="text-sm">
                  {{ data.summary.pt_signed_appointments }}/{{ data.summary.eligible_appointments }} signed
                </div>
              </template>
            </Column>

            <Column header="Billing" style="min-width: 170px">
              <template #body="{ data }">
                <div class="text-sm">
                  {{ data.summary.billing_cleared_appointments }}/{{ data.summary.eligible_appointments }} cleared
                </div>
              </template>
            </Column>

            <Column header="Status" style="min-width: 180px">
              <template #body="{ data }">
                <Tag
                  :value="data.summary.all_appointments_done && data.summary.all_billings_cleared ? 'Complete Snapshot' : 'Needs Follow-up Snapshot'"
                  :severity="data.summary.all_appointments_done && data.summary.all_billings_cleared ? 'success' : 'warn'"
                />
              </template>
            </Column>

            <Column header="Actions" style="min-width: 140px">
              <template #body="{ data }">
                <Button size="small" text icon="pi pi-eye" label="View" @click="openEodHistoryDetails(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </section>

    <Dialog
      v-model:visible="eodHistoryDetailsVisible"
      modal
      header="EOD Snapshot Details"
      :style="{width: '56rem'}"
    >
      <div v-if="selectedEodHistoryItem" class="space-y-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-1">
            <div class="text-xs uppercase tracking-wide opacity-55">Generated At</div>
            <div class="font-semibold">{{ formatDateTime(selectedEodHistoryItem.eod_generated_at) }}</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-1">
            <div class="text-xs uppercase tracking-wide opacity-55">Generated By</div>
            <div class="font-semibold">{{ selectedEodHistoryItem.generated_by_name || 'System' }}</div>
            <div class="text-xs opacity-60">{{ selectedEodHistoryItem.generated_by_email || '--' }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Appointments</div>
            <div class="mt-2 text-lg font-semibold">{{ selectedEodHistoryItem.summary.pt_signed_appointments }}/{{ selectedEodHistoryItem.summary.eligible_appointments }} Signed</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Billing</div>
            <div class="mt-2 text-lg font-semibold">{{ selectedEodHistoryItem.summary.billing_cleared_appointments }}/{{ selectedEodHistoryItem.summary.eligible_appointments }} Cleared</div>
          </div>
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Status</div>
            <div class="mt-2">
              <Tag
                :value="selectedEodHistoryItem.summary.all_appointments_done && selectedEodHistoryItem.summary.all_billings_cleared ? 'Complete Snapshot' : 'Needs Follow-up Snapshot'"
                :severity="selectedEodHistoryItem.summary.all_appointments_done && selectedEodHistoryItem.summary.all_billings_cleared ? 'success' : 'warn'"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wide opacity-60">Pending PT Signature Blockers</h4>
          <div class="mt-2 overflow-x-auto">
            <DataTable :value="selectedEodHistoryItem.pending_pt_signatures_by_pt ?? []" size="small" scrollable>
              <template #empty>
                <div class="py-6 text-center text-sm opacity-70">No pending PT signatures captured in this snapshot.</div>
              </template>
              <Column field="pt_name" header="Primary PT" style="min-width: 220px" />
              <Column header="Pending PT Signatures" style="min-width: 200px">
                <template #body="{ data }">{{ data.pending_pt_signature_count }}</template>
              </Column>
              <Column header="Eligible Appointments" style="min-width: 200px">
                <template #body="{ data }">{{ data.eligible_appointment_count }}</template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </Dialog>

    <section v-if="canViewFinanceReports" class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="app-section-title">Daily Income</h2>
          <p class="text-sm opacity-70">Matches the paper sheet columns, but uses live billing records and calculated balances.</p>
        </div>
        <div class="text-sm opacity-70">
          Gross {{ asCurrency(report?.summary.gross_income ?? 0) }} · Cash {{ asCurrency(report?.summary.cash_collected ?? 0) }}
        </div>
      </div>

      <div class="overflow-x-auto">
        <DataTable :value="report?.incomes ?? []" size="small" :loading="isLoading" scrollable>
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">
              No billing activity was recorded for {{ selectedDateLabel }}.
            </div>
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

          <Column header="Sponsor / Billing" style="min-width: 150px">
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
              <span :class="data.balance > 0 ? 'text-amber-700 dark:text-amber-300 font-medium' : ''">
                {{ asCurrency(data.balance) }}
              </span>
            </template>
          </Column>

          <Column header="Due Date" style="min-width: 120px">
            <template #body="{ data }">{{ data.due_date || "--" }}</template>
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
          <p class="text-sm opacity-70">Add daily operating expenses so the net cash view stays complete.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="text-sm opacity-70">Total {{ asCurrency(report?.summary.expense_total ?? 0) }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_180px_minmax(0,1fr)_auto]">
        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Item Name</label>
          <Select
            v-model="expenseForm.expense_item_id"
            :options="activeExpenseItems"
            optionLabel="name"
            optionValue="id"
            filter
            fluid
            placeholder="Select expense item"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Amount</label>
          <InputNumber
            v-model="expenseForm.amount"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
            :min="0"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Notes</label>
          <InputText v-model="expenseForm.notes" fluid placeholder="Optional note or receipt detail" />
        </div>

        <div v-if="canManageExpenses" class="flex items-end">
          <Button
            label="Add Expense"
            icon="pi pi-plus"
            :loading="isSavingExpense"
            :pt="ptPrimaryBtn"
            @click="saveExpense"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <DataTable :value="report?.expenses ?? []" size="small" :loading="isLoading" scrollable>
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">
              No expense entries yet for {{ selectedDateLabel }}.
            </div>
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

          <Column v-if="canManageExpenses" header="Actions" style="width: 96px">
            <template #body="{ data }">
              <Button
                size="small"
                text
                severity="danger"
                icon="pi pi-trash"
                @click="confirmDeleteExpense(data.id, data.item_name)"
              />
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
          <div class="mt-2 text-2xl font-semibold">{{ asCurrency(report?.summary.cash_collected ?? 0) }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Expense Total</div>
          <div class="mt-2 text-2xl font-semibold">{{ asCurrency(report?.summary.expense_total ?? 0) }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Net Cash</div>
          <div class="mt-2 text-2xl font-semibold">{{ asCurrency(report?.summary.net_cash ?? 0) }}</div>
        </div>
      </div>
    </section>

    <section v-if="canViewFinanceReports" ref="monthlySectionRef" class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="app-section-title">Monthly Income &amp; Expenses</h2>
          <p class="text-sm opacity-70">Monthly operations rollup for finance review, cash monitoring, and expense tracking using the same billing and expense records as the daily report.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="text-sm opacity-70">
            {{ selectedMonthLabel }} · Active days {{ monthlyReport?.summary.active_day_count ?? 0 }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article v-for="card in monthlySummaryCards" :key="card.label" class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
          <div class="mt-2 text-2xl font-semibold">{{ card.value }}</div>
          <div class="mt-1 text-xs opacity-60">{{ card.caption }}</div>
        </article>
      </div>

      <div class="overflow-x-auto">
        <DataTable :value="monthlyReport?.days ?? []" size="small" :loading="isLoading" scrollable>
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">No finance activity found for {{ selectedMonthLabel }}.</div>
          </template>

          <Column header="Date" style="min-width: 180px">
            <template #body="{ data }">{{ formatMonthDay(data.report_date) }}</template>
          </Column>

          <Column header="Entries" style="min-width: 160px">
            <template #body="{ data }">
              <div class="space-y-1 text-sm">
                <div>Income: <span class="font-medium">{{ data.income_entry_count }}</span></div>
                <div>Expense: <span class="font-medium">{{ data.expense_entry_count }}</span></div>
              </div>
            </template>
          </Column>

          <Column header="Gross" style="min-width: 140px">
            <template #body="{ data }">{{ asCurrency(data.gross_income) }}</template>
          </Column>

          <Column header="Cash" style="min-width: 140px">
            <template #body="{ data }">{{ asCurrency(data.cash_collected) }}</template>
          </Column>

          <Column header="Outstanding" style="min-width: 140px">
            <template #body="{ data }">{{ asCurrency(data.outstanding_balance) }}</template>
          </Column>

          <Column header="Expenses" style="min-width: 140px">
            <template #body="{ data }">{{ asCurrency(data.expense_total) }}</template>
          </Column>

          <Column header="Net Income" style="min-width: 140px">
            <template #body="{ data }">
              <span :class="(data.gross_income - data.expense_total) < 0 ? 'font-medium text-rose-600' : 'font-medium text-emerald-700'">
                {{ asCurrency(data.gross_income - data.expense_total) }}
              </span>
            </template>
          </Column>

          <Column header="Net Cash" style="min-width: 140px">
            <template #body="{ data }">
              <span :class="data.net_cash < 0 ? 'font-medium text-rose-600' : 'font-medium text-emerald-700'">
                {{ asCurrency(data.net_cash) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

  </main>
</template>
