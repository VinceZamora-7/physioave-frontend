<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue"
import {useConfirm, useToast} from "primevue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Tag from "primevue/tag"
import {
  appointmentPhase1Service,
  type ReferringDoctorCompletedSessionsReport
} from "@/features/appointments/api/appointment-phase1.service"
import {
  billingPhase1Service,
  type DailyIncomeExpenseReport
} from "@/features/billing/api/billing-phase1.service"
import {ptOutlinedBtn, ptPrimaryBtn} from "@/features/shared/table-header.styles"
import {errorToast, successToast} from "@/utils/toast.util"

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const isSavingExpense = ref(false)
const selectedDate = ref(new Date())
const report = ref<DailyIncomeExpenseReport>()
const isDoctorSessionsLoading = ref(false)
const doctorSessionsDateRange = ref<Date[] | null>(null)
const doctorSessionsReport = ref<ReferringDoctorCompletedSessionsReport>()
const expenseForm = ref({
  item_name: "",
  amount: 0,
  notes: ""
})

const selectedDateLabel = computed(() =>
  selectedDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const summaryCards = computed(() => [
  {
    label: "Gross Daily Charges",
    value: asCurrency(report.value?.summary.gross_income ?? 0),
    caption: "Total billed value for the selected day"
  },
  {
    label: "Cash Collected",
    value: asCurrency(report.value?.summary.cash_collected ?? 0),
    caption: "Actual payments received today"
  },
  {
    label: "Outstanding",
    value: asCurrency(report.value?.summary.outstanding_balance ?? 0),
    caption: "Remaining balance across all entries"
  },
  {
    label: "Expenses",
    value: asCurrency(report.value?.summary.expense_total ?? 0),
    caption: "Manually entered operating expenses"
  },
  {
    label: "Net Cash",
    value: asCurrency(report.value?.summary.net_cash ?? 0),
    caption: "Cash collected minus expenses"
  }
])

const toDateParam = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDate = (value: Date): string =>
  value.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

const initializeDoctorSessionsDateRange = (): void => {
  if (doctorSessionsDateRange.value && doctorSessionsDateRange.value.length === 2) return
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  doctorSessionsDateRange.value = [monthStart, today]
}

const selectedDoctorSessionsRangeLabel = computed(() => {
  const range = doctorSessionsDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) {
    return "Select a complete date range"
  }
  return `${formatDate(range[0])} to ${formatDate(range[1])}`
})

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

const refreshReport = async (): Promise<void> => {
  try {
    isLoading.value = true
    report.value = await billingPhase1Service.getDailyIncomeExpense(toDateParam(selectedDate.value))
  } catch {
    errorToast(toast, "Failed to load daily income and expense report")
  } finally {
    isLoading.value = false
  }
}

const refreshDoctorSessionsReport = async (): Promise<void> => {
  const range = doctorSessionsDateRange.value ?? []
  if (range.length < 2 || !range[0] || !range[1]) {
    errorToast(toast, "Please select a start and end date")
    return
  }

  const fromDate = range[0]
  const toDate = range[1]
  if (fromDate.getTime() > toDate.getTime()) {
    errorToast(toast, "Start date must be on or before end date")
    return
  }

  try {
    isDoctorSessionsLoading.value = true
    doctorSessionsReport.value = await appointmentPhase1Service.getCompletedSessionsByReferringDoctor(
      toDateParam(fromDate),
      toDateParam(toDate)
    )
  } catch {
    errorToast(toast, "Failed to load completed sessions by referring doctor")
  } finally {
    isDoctorSessionsLoading.value = false
  }
}

const resetExpenseForm = (): void => {
  expenseForm.value = {
    item_name: "",
    amount: 0,
    notes: ""
  }
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
    isSavingExpense.value = true
    await billingPhase1Service.addDailyExpense({
      expense_date: toDateParam(selectedDate.value),
      item_name: expenseForm.value.item_name.trim(),
      amount: Number(expenseForm.value.amount ?? 0),
      notes: expenseForm.value.notes.trim() || undefined
    })
    successToast(toast, "Expense added")
    resetExpenseForm()
    await refreshReport()
  } catch {
    errorToast(toast, "Failed to save expense")
  } finally {
    isSavingExpense.value = false
  }
}

const confirmDeleteExpense = (id: number, itemName: string): void => {
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
      } catch {
        errorToast(toast, "Failed to delete expense")
      }
    }
  })
}

const resetToToday = (): void => {
  selectedDate.value = new Date()
}

watch(selectedDate, () => {
  void refreshReport()
})

onMounted(() => {
  initializeDoctorSessionsDateRange()
  void refreshReport()
  void refreshDoctorSessionsReport()
})
</script>

<template>
  <main class="app-page-shell space-y-5">
    <section class="rounded-3xl border border-[#A91D8B]/25 bg-[linear-gradient(120deg,rgba(36,39,87,0.14),rgba(94,24,105,0.10),rgba(169,29,139,0.18))] p-5 shadow-[0_18px_40px_rgba(36,39,87,0.10)]">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Daily Income &amp; Expenses</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Digital version of the manual daily finance sheet, combining billing activity and shared clinic expense entries for one selected date.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Date: {{ selectedDateLabel }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Income Rows: {{ report?.summary.income_entry_count ?? 0 }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Expense Rows: {{ report?.summary.expense_entry_count ?? 0 }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Today" icon="pi pi-calendar" outlined :pt="ptOutlinedBtn" @click="resetToToday" />
          <Button label="Refresh" icon="pi pi-refresh" :loading="isLoading" :pt="ptPrimaryBtn" @click="refreshReport" />
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
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <article v-for="card in summaryCards" :key="card.label" class="app-section-card-comfy space-y-1">
        <div class="text-xs uppercase tracking-wide opacity-55">{{ card.label }}</div>
        <div class="text-2xl font-semibold">{{ card.value }}</div>
        <div class="text-xs opacity-60">{{ card.caption }}</div>
      </article>
    </section>

    <section class="app-section-card-comfy space-y-4">
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
        <div class="text-sm opacity-70">Total {{ asCurrency(report?.summary.expense_total ?? 0) }}</div>
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_180px_minmax(0,1fr)_auto]">
        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide opacity-60">Item Name</label>
          <InputText v-model="expenseForm.item_name" fluid placeholder="e.g. Supplies, transportation, snacks" />
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

        <div class="flex items-end">
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

          <Column header="Actions" style="width: 96px">
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
