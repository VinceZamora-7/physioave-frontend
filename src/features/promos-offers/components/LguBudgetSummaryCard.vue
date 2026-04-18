<template>
  <section class="app-section-card-comfy space-y-3">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">Manager LGU Dashboard{{ selectedProgramName ? ` — ${selectedProgramName}` : '' }}</h3>
        <p class="text-xs opacity-70">Select an LGU program and set the monthly budget. Each program and month is tracked independently.</p>
      </div>
      <Tag :value="canManageLguDashboard ? 'Manager Access' : 'Read-only'" :severity="canManageLguDashboard ? 'success' : 'secondary'" />
    </div>

    <Message v-if="!canManageLguDashboard" severity="warn" :closable="false" size="small">
      Budget controls are available to Manager/Operations leadership roles. Totals remain visible.
    </Message>

    <Message v-if="budgetSyncError" severity="warn" :closable="false" size="small">
      {{ budgetSyncError }}
    </Message>
    <Message v-else-if="loadingDashboardBudget" severity="secondary" :closable="false" size="small">
      Loading live LGU budget for {{ budgetMonthLabel }}...
    </Message>
    <Message v-else-if="hasLocalOnlyBudgetDraft" severity="warn" :closable="false" size="small">
      This budget was only saved in this browser before. Click <strong>Save Budget</strong> to publish it to appointments and LGU billing for {{ budgetMonthLabel }}.
    </Message>
    <Message v-else-if="lguDashboardBudget" severity="info" :closable="false" size="small">
      Live LGU budget is open for {{ budgetMonthLabel }}. Used so far: <strong>{{ asCurrency(usedLguFund) }}</strong>.
    </Message>
    <Message v-else severity="secondary" :closable="false" size="small">
      No live LGU budget is open for {{ budgetMonthLabel }} yet. Save this month’s budget here to make LGU appointments billable.
    </Message>

    <Message v-if="isFutureBudgetMonth" severity="info" :closable="false" size="small">
      You are preparing the LGU budget for {{ budgetMonthLabel }} in advance. This stays separate from {{ currentMonthLabel }} and will not add into the current month fund.
    </Message>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
      <div class="flex flex-col gap-1">
        <IftaLabel>
          <Select
            v-model="selectedProgramId"
            :options="lguProgramOptions"
            optionLabel="label"
            optionValue="id"
            placeholder="Select LGU Program"
            :loading="loadingPrograms"
            :disabled="savingDashboardBudget"
            fluid
          />
          <label>LGU</label>
        </IftaLabel>
        <div class="flex items-center gap-2">
          <InputText
            v-if="showNewProgramInput"
            v-model="newProgramName"
            placeholder="e.g. Gapan"
            size="small"
            fluid
            @keyup.enter="createNewProgram"
          />
          <Button
            v-if="showNewProgramInput"
            icon="pi pi-check"
            size="small"
            :loading="creatingProgram"
            :disabled="!newProgramName.trim()"
            @click="createNewProgram"
          />
          <Button
            :label="showNewProgramInput ? 'Cancel' : 'Add LGU'"
            :icon="showNewProgramInput ? 'pi pi-times' : 'pi pi-plus'"
            size="small"
            :severity="showNewProgramInput ? 'secondary' : 'info'"
            text
            :disabled="!canManageLguDashboard"
            @click="showNewProgramInput = !showNewProgramInput; newProgramName = ''"
          />
        </div>
      </div>

      <IftaLabel>
        <DatePicker
          v-model="selectedBudgetMonthDate"
          view="month"
          dateFormat="MM yy"
          :manualInput="false"
          showIcon
          fluid
          :minDate="currentMonthStart"
          :disabled="savingDashboardBudget"
        />
        <label>Budget Month</label>
      </IftaLabel>

      <IftaLabel>
        <InputNumber
          v-model="baseMonthlyBudget"
          :disabled="!canManageLguDashboard || savingDashboardBudget"
          :min="0"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          fluid
        />
        <label>Base Monthly Budget</label>
      </IftaLabel>

      <IftaLabel>
        <InputNumber
          v-model="rolloverInput"
          :disabled="!canManageLguDashboard || savingDashboardBudget"
          :min="0"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          fluid
        />
        <label>Rollover Amount to Add</label>
      </IftaLabel>

      <div class="flex flex-wrap items-end gap-2">
        <Button
          label="Refresh Budget"
          icon="pi pi-refresh"
          outlined
          :loading="refreshingDashboardBudget"
          :disabled="loadingDashboardBudget || loadingTransactionHistory || savingDashboardBudget"
          @click="refreshDashboardBudget"
        />
        <Button
          label="Add Rollover"
          icon="pi pi-plus"
          outlined
          :disabled="!canManageLguDashboard || savingDashboardBudget"
          @click="addRolloverAmount"
        />
        <Button
          label="Save Budget"
          icon="pi pi-save"
          :disabled="!canManageLguDashboard || loadingDashboardBudget || savingDashboardBudget"
          :loading="savingDashboardBudget"
          @click="saveDashboardBudget"
        />
      </div>

      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 space-y-1">
        <p class="text-xs opacity-70">Tracked Rollover Amount</p>
        <p class="text-base font-semibold">{{ asCurrency(rolloverAmount) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Total Available Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(totalAvailableFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Used LGU Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(usedLguFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Pending Used LGU Fund</p>
        <p class="text-lg font-semibold text-amber-600">{{ asCurrency(pendingUsedLguFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Remaining Available Fund</p>
        <p class="text-lg font-semibold" :class="remainingAvailableFund < 0 ? 'text-red-600' : ''">{{ asCurrency(remainingAvailableFund) }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4 space-y-3">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="space-y-1">
          <h4 class="text-sm font-semibold">Recent LGU Transactions</h4>
          <p class="text-xs opacity-70">Shows the actual LGU ledger activity created by LGU billings, including deductions, reversals, and the running balance after each entry.</p>
        </div>
        <div class="flex items-center gap-2">
          <Tag :value="`${lguTransactionHistory.length} record${lguTransactionHistory.length === 1 ? '' : 's'}`" severity="contrast" />
          <Button
            label="Refresh History"
            icon="pi pi-refresh"
            outlined
            size="small"
            :loading="loadingTransactionHistory"
            @click="loadTransactionHistory"
          />
        </div>
      </div>

      <Message v-if="transactionHistoryError" severity="warn" :closable="false" size="small">
        {{ transactionHistoryError }}
      </Message>

      <DataTable
        :value="lguTransactionHistory"
        :loading="loadingTransactionHistory"
        size="small"
        scrollable
        scrollHeight="320px"
        dataKey="id"
      >
        <template #empty>
          <div class="px-4 py-10 text-center text-sm opacity-60">
            No LGU ledger transactions have been recorded yet.
          </div>
        </template>

        <Column field="created_at" header="Created" style="width: 170px">
          <template #body="{ data }">
            <div class="text-sm">{{ formatDateTime(data.created_at) }}</div>
          </template>
        </Column>

        <Column header="Patient / Billing" style="min-width: 240px">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="font-medium">{{ data.patient_name || "No patient linked" }}</div>
              <div class="text-xs opacity-60">
                Billing {{ data.phase1_billing_public_id || "N/A" }}
                <span v-if="data.receipt_number"> · Receipt {{ data.receipt_number }}</span>
              </div>
              <div v-if="data.patient_public_id" class="text-xs opacity-60">Patient {{ data.patient_public_id }}</div>
              <div class="text-xs opacity-60">{{ data.service_name || data.reference_label || "LGU transaction" }}</div>
            </div>
          </template>
        </Column>

        <Column header="Action" style="width: 130px">
          <template #body="{ data }">
            <Button
              v-if="data.patient_id"
              label="View Details"
              icon="pi pi-external-link"
              size="small"
              outlined
              @click="openPatientDetail(data.patient_id)"
            />
            <span v-else class="text-xs opacity-60">N/A</span>
          </template>
        </Column>

        <Column header="Period" style="width: 120px">
          <template #body="{ data }">
            <div class="text-sm">{{ formatBudgetPeriod(data.period_year, data.period_month) }}</div>
            <div class="text-xs opacity-60">{{ data.program_name }}</div>
          </template>
        </Column>

        <Column header="Type / Status" style="width: 150px">
          <template #body="{ data }">
            <div class="flex flex-col gap-1">
              <Tag :value="formatEntryType(data.entry_type)" :severity="entryTypeSeverity(data.entry_type)" class="text-xs" />
              <Tag :value="data.usage_status" :severity="usageStatusSeverity(data.usage_status)" class="text-xs" />
            </div>
          </template>
        </Column>

        <Column header="Movement" style="width: 150px">
          <template #body="{ data }">
            <div class="space-y-1 text-right">
              <div v-if="Number(data.amount_out ?? 0) > 0" class="font-medium text-red-700">- {{ asCurrency(data.amount_out) }}</div>
              <div v-if="Number(data.amount_in ?? 0) > 0" class="font-medium text-emerald-700">+ {{ asCurrency(data.amount_in) }}</div>
              <div v-if="Number(data.amount_out ?? 0) <= 0 && Number(data.amount_in ?? 0) <= 0" class="font-medium">{{ asCurrency(0) }}</div>
            </div>
          </template>
        </Column>

        <Column header="Balance After" style="width: 150px">
          <template #body="{ data }">
            {{ asCurrency(data.balance_after ?? 0) }}
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Patient LGU Credit Detail Dialog -->
    <Dialog
      v-model:visible="showPatientDetailDialog"
      modal
      :header="selectedPatientDetail ? `${selectedPatientDetail.patient_name} - LGU Credit Detail` : 'LGU Credit Detail'"
      style="width: min(92vw, 860px)"
      :pt="{ content: { class: 'space-y-4' } }"
    >
      <Message v-if="loadingPatientDetail" severity="secondary" :closable="false" size="small">
        Loading patient LGU credit details...
      </Message>
      <Message v-else-if="patientDetailError" severity="warn" :closable="false" size="small">
        {{ patientDetailError }}
      </Message>
      <template v-else-if="selectedPatientDetail">
        <div class="flex flex-wrap items-center gap-2">
          <Tag
            :value="selectedPatientDetail.dropout_status ?? selectedPatientDetail.authorizations[0]?.authorization_status ?? 'UNKNOWN'"
            :severity="selectedPatientDetail.dropout_status === 'DROPPED_OUT' ? 'danger' : selectedPatientDetail.authorizations[0]?.authorization_status === 'COMPLETED' ? 'success' : 'info'"
          />
          <span class="text-xs opacity-60">Patient ID: {{ selectedPatientDetail.patient_id }}</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-[rgb(var(--app-border))] pb-1">
            <div class="text-sm font-semibold">Appointments</div>
            <Button
              label="Create Claim"
              icon="pi pi-file"
              size="small"
              :loading="isCreatingClaims"
              :disabled="isCreatingClaims"
              @click="createClaimsForEligibleAppointments()"
            />
          </div>
          <div class="overflow-x-auto rounded-xl border border-[rgb(var(--app-border))]">
            <table class="min-w-full text-sm">
              <thead class="bg-black/5 text-left text-xs uppercase tracking-wide opacity-70 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 font-medium">Appointment</th>
                  <th class="px-3 py-2 font-medium">Date</th>
                  <th class="px-3 py-2 font-medium">Package</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(appointment, index) in selectedPatientDetail.appointments"
                  :key="appointment.appointment_id"
                  :class="[
                    'border-t border-[rgb(var(--app-border))]',
                    firstDroppedOutAppointmentId === appointment.appointment_id
                      ? 'bg-red-50/70 dark:bg-red-900/20'
                      : ''
                  ]"
                >
                  <td class="px-3 py-2">
                    <div class="text-xs font-semibold">Session {{ index + 1 }}</div>
                    <div class="font-mono text-[11px] opacity-60">APT-{{ appointment.appointment_id }}</div>
                  </td>
                  <td class="px-3 py-2 text-xs">{{ formatDateTime(appointment.appointment_date) }}</td>
                  <td class="px-3 py-2 text-xs">{{ appointment.package_name || '-' }}</td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <Tag
                        :value="appointment.status"
                        :severity="appointment.status === 'COMPLETED' ? 'success' : appointment.status === 'DROPPED_OUT' ? 'danger' : 'warn'"
                        class="text-xs"
                      />
                      <span
                        v-if="firstDroppedOutAppointmentId === appointment.appointment_id"
                        class="inline-flex rounded bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      >Dropout Starts Here</span>
                    </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!selectedPatientDetail.appointments.length" class="text-xs opacity-60">No appointments recorded yet.</div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-semibold border-b border-[rgb(var(--app-border))] pb-1">Package Availment</div>
          <div class="overflow-x-auto rounded-xl border border-[rgb(var(--app-border))]">
            <table class="min-w-full text-sm">
              <thead class="bg-black/5 text-left text-xs uppercase tracking-wide opacity-70 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 font-medium">Availed Package</th>
                  <th class="px-3 py-2 font-medium text-right">Total Purchased</th>
                  <th class="px-3 py-2 font-medium text-right">Used</th>
                  <th class="px-3 py-2 font-medium text-right">Balance</th>
                  <th class="px-3 py-2 font-medium">Expiry</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pkg in selectedPatientDetail.package_availments"
                  :key="pkg.authorization_id"
                  class="border-t border-[rgb(var(--app-border))]"
                >
                  <td class="px-3 py-2">{{ pkg.package_name }}</td>
                  <td class="px-3 py-2 text-right">{{ pkg.availed_count }}</td>
                  <td class="px-3 py-2 text-right">{{ pkg.used_count }}</td>
                  <td class="px-3 py-2 text-right">{{ pkg.available_balance }}</td>
                  <td class="px-3 py-2 text-xs">{{ pkg.expiry_date || '-' }}</td>
                  <td class="px-3 py-2">
                    <Tag
                      :value="pkg.status"
                      :severity="pkg.status === 'COMPLETED' ? 'success' : pkg.status === 'DROPPED_OUT' ? 'danger' : pkg.status === 'ACTIVE' ? 'info' : 'secondary'"
                      class="text-xs"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!selectedPatientDetail.package_availments.length" class="text-xs opacity-60">No package availment records yet.</div>
        </div>

        <div v-if="selectedPatientDetail.billings.length" class="space-y-2">
          <div class="text-sm font-semibold border-b border-[rgb(var(--app-border))] pb-1">Billing Summary</div>
          <div class="overflow-x-auto rounded-xl border border-[rgb(var(--app-border))]">
            <table class="min-w-full text-sm">
              <thead class="bg-black/5 text-left text-xs uppercase tracking-wide opacity-70 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 font-medium">Reference</th>
                  <th class="px-3 py-2 font-medium">Service</th>
                  <th class="px-3 py-2 font-medium">Type</th>
                  <th class="px-3 py-2 font-medium text-right">Amount</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                  <th class="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="billing in selectedPatientDetail.billings"
                  :key="billing.id"
                  class="border-t border-[rgb(var(--app-border))]"
                >
                  <td class="px-3 py-2 font-mono text-xs">{{ billing.public_id }}</td>
                  <td class="px-3 py-2 text-xs">{{ billing.service_name || '-' }}</td>
                  <td class="px-3 py-2">
                    <span
                      v-if="billing.pricing_source === 'LGU_DROPOUT_INDIVIDUAL_CLAIM'"
                      class="inline-flex rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    >Dropout Claim</span>
                    <span
                      v-else-if="billing.pricing_source === 'LGU_PACKAGE_MONTHLY_CLAIM'"
                      class="inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >Monthly Claim</span>
                    <span v-else class="text-xs opacity-60">{{ billing.pricing_source || '-' }}</span>
                  </td>
                  <td class="px-3 py-2 text-right font-medium">{{ asCurrency(billing.amount_due) }}</td>
                  <td class="px-3 py-2">
                    <Tag
                      :value="billing.billing_status"
                      :severity="billing.billing_status === 'PAID' ? 'success' : billing.billing_status === 'BILLED' ? 'info' : billing.billing_status === 'VOID' ? 'danger' : 'secondary'"
                      class="text-xs"
                    />
                  </td>
                  <td class="px-3 py-2 text-xs opacity-60">{{ formatDateTime(billing.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-xs opacity-60">No LGU claim billings generated yet.</div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useToast } from "primevue/usetoast"
import {
  billingPhase1Service,
  type LguDashboardBudget,
  type LguDashboardHistoryItem,
  type LguPatientCreditDetail,
  type LguProgramLookup
} from "@/features/billing/api/billing-phase1.service"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"

type LocalLguBudgetDraft = {
  baseMonthlyBudget?: number
  rolloverAmount?: number
}

const toast = useToast()
const currentRoleName = ref<string>("")
const lguPrograms = ref<LguProgramLookup[]>([])
const loadingPrograms = ref(false)
const selectedProgramId = ref<number | null>(null)
const showNewProgramInput = ref(false)
const newProgramName = ref("")
const creatingProgram = ref(false)
const baseMonthlyBudget = ref<number>(0)
const rolloverAmount = ref<number>(0)
const rolloverInput = ref<number>(0)
const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const selectedBudgetMonthDate = ref<Date>(new Date(currentMonthStart))
const lguDashboardBudget = ref<LguDashboardBudget | null>(null)
const loadingDashboardBudget = ref(false)
const savingDashboardBudget = ref(false)
const refreshingDashboardBudget = ref(false)
const hasLocalOnlyBudgetDraft = ref(false)
const budgetSyncError = ref("")
const lguTransactionHistory = ref<LguDashboardHistoryItem[]>([])
const loadingTransactionHistory = ref(false)
const transactionHistoryError = ref("")
const showPatientDetailDialog = ref(false)
const selectedPatientDetail = ref<LguPatientCreditDetail | null>(null)
const loadingPatientDetail = ref(false)
const patientDetailError = ref("")
const isCreatingClaims = ref(false)

const MANAGER_ROLE_KEYWORDS = [
  "manager",
  "operations manager",
  "chief operations officer",
  "coo",
  "owner"
]

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  return new Date(value).toLocaleString("en-PH")
}

const firstDroppedOutAppointmentId = computed<number | null>(() => {
  const appointments = selectedPatientDetail.value?.appointments ?? []
  return appointments.find(appointment => appointment.status === "DROPPED_OUT")?.appointment_id ?? null
})

const formatBudgetPeriod = (year: number, month: number): string =>
  new Date(year, month - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric"
  })

const normalizeBudgetMonthDate = (value?: Date | null): Date => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return new Date(currentMonthStart)
  }
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

const formatEntryType = (value?: string): string =>
  String(value ?? "")
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const entryTypeSeverity = (value?: string): "success" | "info" | "warn" | "danger" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "SESSION_CHARGE") return "warn"
  if (normalized === "REVERSAL") return "danger"
  if (normalized === "ROLLOVER") return "success"
  if (normalized === "MANUAL_ADJUSTMENT") return "info"
  return "secondary"
}

const usageStatusSeverity = (value?: string): "success" | "warn" | "danger" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "APPLIED") return "success"
  if (normalized === "ADJUSTED") return "warn"
  if (normalized === "REVERSED" || normalized === "VOID") return "danger"
  return "secondary"
}

const usedLguFund = computed(() =>
  lguTransactionHistory.value
    .filter(entry => entry.billing_status === "BILLED")
    .reduce((sum, entry) => sum + Number(entry.amount_out ?? 0), 0)
)

const pendingUsedLguFund = computed(() =>
  lguTransactionHistory.value
    .filter(entry => entry.billing_status && entry.billing_status !== "BILLED")
    .reduce((sum, entry) => sum + Number(entry.amount_out ?? 0), 0)
)

const totalAvailableFund = computed(() =>
  Math.max(0, Number(baseMonthlyBudget.value ?? 0) + Number(rolloverAmount.value ?? 0))
)

const selectedBudgetPeriodYear = computed(() =>
  normalizeBudgetMonthDate(selectedBudgetMonthDate.value).getFullYear()
)

const selectedBudgetPeriodMonth = computed(() =>
  normalizeBudgetMonthDate(selectedBudgetMonthDate.value).getMonth() + 1
)

const budgetMonthLabel = computed(() => {
  return new Date(selectedBudgetPeriodYear.value, selectedBudgetPeriodMonth.value - 1, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric"
  })
})

const currentMonthLabel = computed(() =>
  new Date(currentMonthStart).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric"
  })
)

const isFutureBudgetMonth = computed(() =>
  selectedBudgetPeriodYear.value > currentMonthStart.getFullYear()
  || (
    selectedBudgetPeriodYear.value === currentMonthStart.getFullYear()
    && selectedBudgetPeriodMonth.value > (currentMonthStart.getMonth() + 1)
  )
)

const remainingAvailableFund = computed(() =>
  Number((totalAvailableFund.value - usedLguFund.value).toFixed(2))
)

const canManageLguDashboard = computed(() => {
  const normalized = currentRoleName.value.trim().toLowerCase()
  if (!normalized) return false
  return MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const lguProgramOptions = computed(() =>
  lguPrograms.value.map(p => ({ ...p, label: `LGU-${p.name}` }))
)

const selectedProgramName = computed(() =>
  lguProgramOptions.value.find(p => p.id === selectedProgramId.value)?.label ?? ""
)

const resolveRoleFromStorage = (): string => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = String(parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole ?? "").trim()
      if (role) return role
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
        const first = parsed.roles[0]
        if (typeof first === "string" && first.trim()) return first.trim()
        if (first && typeof first === "object") {
          const roleObj = first as Record<string, unknown>
          const nested = String(roleObj.name ?? roleObj.role ?? "").trim()
          if (nested) return nested
        }
      }
    } catch {
      // Ignore malformed storage entries.
    }
  }
  return ""
}

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Billing or LGU dashboard access in Role Access",
    invalidInputHint: "LGU values are invalid. Check the period and amount fields, then try again.",
    retryHint: "Please try again."
  })

const hasAnyBudgetDraft = (draft: LocalLguBudgetDraft | null): boolean =>
  Number(draft?.baseMonthlyBudget ?? 0) > 0 || Number(draft?.rolloverAmount ?? 0) > 0

const localDashboardBudgetStorageKey = computed(() =>
  `lgu_dashboard_budget:${selectedProgramId.value ?? "all"}:${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const selectedBillingMonth = computed(() =>
  `${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const readLocalDashboardBudget = (): LocalLguBudgetDraft | null => {
  try {
    const raw = localStorage.getItem(localDashboardBudgetStorageKey.value)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalLguBudgetDraft
    return {
      baseMonthlyBudget: Math.max(0, Number(parsed.baseMonthlyBudget ?? 0)),
      rolloverAmount: Math.max(0, Number(parsed.rolloverAmount ?? 0))
    }
  } catch {
    return null
  }
}

const persistLocalDashboardBudget = (): void => {
  localStorage.setItem(
    localDashboardBudgetStorageKey.value,
    JSON.stringify({
      baseMonthlyBudget: Number(baseMonthlyBudget.value ?? 0),
      rolloverAmount: Number(rolloverAmount.value ?? 0),
      updatedAt: new Date().toISOString()
    })
  )
}

const applyBudgetValues = (payload: { base_budget?: number; rollover_amount?: number; baseMonthlyBudget?: number; rolloverAmount?: number }): void => {
  baseMonthlyBudget.value = Math.max(0, Number(payload.base_budget ?? payload.baseMonthlyBudget ?? 0))
  rolloverAmount.value = Math.max(0, Number(payload.rollover_amount ?? payload.rolloverAmount ?? 0))
}

const loadDashboardBudget = async (): Promise<void> => {
  const localDraft = readLocalDashboardBudget()
  loadingDashboardBudget.value = true
  budgetSyncError.value = ""
  rolloverInput.value = 0
  lguDashboardBudget.value = null
  if (!selectedProgramId.value) {
    applyBudgetValues({})
    hasLocalOnlyBudgetDraft.value = false
    loadingDashboardBudget.value = false
    return
  }
  try {
    const serverBudget = await billingPhase1Service.getLguDashboardBudget(
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    )
    if (serverBudget) {
      lguDashboardBudget.value = serverBudget
      applyBudgetValues(serverBudget)
      hasLocalOnlyBudgetDraft.value = false
      persistLocalDashboardBudget()
      return
    }

    lguDashboardBudget.value = null
    applyBudgetValues(localDraft ?? {})
    hasLocalOnlyBudgetDraft.value = hasAnyBudgetDraft(localDraft)
  } catch (error: unknown) {
    lguDashboardBudget.value = null
    applyBudgetValues(localDraft ?? {})
    hasLocalOnlyBudgetDraft.value = hasAnyBudgetDraft(localDraft)
    budgetSyncError.value = extractApiErrorMessage(error, "Failed to load the live LGU budget")
  } finally {
    loadingDashboardBudget.value = false
  }
}

  const openPatientDetail = async (patientId: number | null | undefined): Promise<void> => {
    if (!patientId) return
    selectedPatientDetail.value = null
    patientDetailError.value = ""
    showPatientDetailDialog.value = true
    loadingPatientDetail.value = true
    try {
      selectedPatientDetail.value = await billingPhase1Service.getLguPatientCreditDetail(patientId) ?? null
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to load patient LGU credit details")
    } finally {
      loadingPatientDetail.value = false
    }
  }

  const refreshSelectedPatientDetail = async (): Promise<void> => {
    const patientId = selectedPatientDetail.value?.patient_id
    if (!patientId) return
    try {
      selectedPatientDetail.value = await billingPhase1Service.getLguPatientCreditDetail(patientId) ?? null
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to refresh patient LGU credit details")
    }
  }

  const createClaimsForEligibleAppointments = async (): Promise<void> => {
    if (isCreatingClaims.value || !selectedPatientDetail.value) return
    isCreatingClaims.value = true
    try {
      const result = await billingPhase1Service.createLguPatientClaim({
        patient_id: selectedPatientDetail.value.patient_id,
        billing_month: selectedBillingMonth.value
      })
      successToast(
        toast,
        result?.consumed_count
          ? `${result.consumed_count} session${result.consumed_count > 1 ? "s" : ""} claimed (${result.billing_public_id ?? ""}) for ${selectedBillingMonth.value}.`
          : `Claim created for ${selectedBillingMonth.value}.`
      )
      await Promise.all([loadTransactionHistory(), refreshSelectedPatientDetail()])
    } catch (error: unknown) {
      errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU claim"))
    } finally {
      isCreatingClaims.value = false
    }
  }

const loadTransactionHistory = async (): Promise<void> => {
  loadingTransactionHistory.value = true
  transactionHistoryError.value = ""
  if (!selectedProgramId.value) {
    lguTransactionHistory.value = []
    loadingTransactionHistory.value = false
    return
  }
  try {
    lguTransactionHistory.value = await billingPhase1Service.getLguDashboardHistory(
      100,
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    ) ?? []
  } catch (error: unknown) {
    lguTransactionHistory.value = []
    transactionHistoryError.value = extractApiErrorMessage(error, "Failed to load LGU transaction history")
  } finally {
    loadingTransactionHistory.value = false
  }
}

const saveDashboardBudget = async (): Promise<void> => {
  if (!selectedProgramId.value) {
    errorToast(toast, "Select an LGU program first")
    return
  }
  persistLocalDashboardBudget()
  savingDashboardBudget.value = true
  budgetSyncError.value = ""
  try {
    const savedBudget = await billingPhase1Service.saveLguDashboardBudget({
      base_budget: Number(baseMonthlyBudget.value ?? 0),
      rollover_amount: Number(rolloverAmount.value ?? 0),
      period_year: selectedBudgetPeriodYear.value,
      period_month: selectedBudgetPeriodMonth.value,
      program_id: selectedProgramId.value ?? undefined
    })

    lguDashboardBudget.value = savedBudget ?? null
    if (savedBudget) {
      applyBudgetValues(savedBudget)
    }
    hasLocalOnlyBudgetDraft.value = false
    persistLocalDashboardBudget()
    successToast(toast, `LGU budget is now live for ${budgetMonthLabel.value}`)
  } catch (error: unknown) {
    hasLocalOnlyBudgetDraft.value = true
    const message = extractApiErrorMessage(error, "Failed to save the live LGU budget")
    budgetSyncError.value = message
    errorToast(toast, message)
  } finally {
    savingDashboardBudget.value = false
  }
}

const refreshDashboardBudget = async (): Promise<void> => {
  refreshingDashboardBudget.value = true
  budgetSyncError.value = ""
  try {
    if (canManageLguDashboard.value) {
      const result = await billingPhase1Service.refreshLguDashboardBudget(
        selectedBudgetPeriodYear.value,
        selectedBudgetPeriodMonth.value,
        selectedProgramId.value ?? undefined
      )
      await Promise.all([
        loadDashboardBudget(),
        loadTransactionHistory()
      ])
      successToast(
        toast,
        result?.reversed_entries
          ? `LGU budget refreshed. Reversed ${result.reversed_entries} duplicate billing charge${result.reversed_entries === 1 ? "" : "s"}.`
          : "LGU budget refreshed successfully"
      )
      return
    }

    await Promise.all([
      loadDashboardBudget(),
      loadTransactionHistory()
    ])
  } catch (error: unknown) {
    const message = extractApiErrorMessage(error, "Failed to refresh the LGU budget")
    budgetSyncError.value = message
    errorToast(toast, message)
  } finally {
    refreshingDashboardBudget.value = false
  }
}

const addRolloverAmount = (): void => {
  const amount = Math.max(0, Number(rolloverInput.value ?? 0))
  if (amount <= 0) {
    errorToast(toast, "Enter a rollover amount greater than 0")
    return
  }
  rolloverAmount.value = Number(rolloverAmount.value ?? 0) + amount
  rolloverInput.value = 0
}

watch(selectedBudgetMonthDate, (value) => {
  const normalized = normalizeBudgetMonthDate(value)
  if (!(value instanceof Date) || normalized.getTime() !== value.getTime()) {
    selectedBudgetMonthDate.value = normalized
    return
  }

  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})

watch(selectedProgramId, () => {
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})

const loadLguPrograms = async (): Promise<void> => {
  loadingPrograms.value = true
  try {
    const programs = await billingPhase1Service.getLguPrograms()
    lguPrograms.value = programs ?? []
    if (lguPrograms.value.length > 0 && !selectedProgramId.value) {
      selectedProgramId.value = lguPrograms.value[0].id
    } else if (!lguPrograms.value.length) {
      selectedProgramId.value = null
    }
  } catch {
    lguPrograms.value = []
    selectedProgramId.value = null
  } finally {
    loadingPrograms.value = false
  }
}

const createNewProgram = async (): Promise<void> => {
  const name = newProgramName.value.trim()
  if (!name) return
  creatingProgram.value = true
  try {
    const created = await billingPhase1Service.createLguProgram(name)
    if (created) {
      await loadLguPrograms()
      selectedProgramId.value = created.id
      successToast(toast, `LGU program "${name}" created`)
    }
    showNewProgramInput.value = false
    newProgramName.value = ""
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU program"))
  } finally {
    creatingProgram.value = false
  }
}

onMounted(async () => {
  currentRoleName.value = resolveRoleFromStorage()
  await loadLguPrograms()
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})
</script>
