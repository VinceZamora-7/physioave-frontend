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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Total Available Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(totalAvailableFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Used LGU Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(usedLguFund) }}</p>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import axios from "axios"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
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
  type LguProgramLookup
} from "@/features/billing/api/billing-phase1.service"
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
const hasLocalOnlyBudgetDraft = ref(false)
const budgetSyncError = ref("")
const lguTransactionHistory = ref<LguDashboardHistoryItem[]>([])
const loadingTransactionHistory = ref(false)
const transactionHistoryError = ref("")

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
  Number(lguDashboardBudget.value?.used_amount ?? 0)
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

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback
  const detail = error.response?.data?.message || error.response?.data?.detail || error.message
  return detail ? `${fallback}: ${detail}` : fallback
}

const hasAnyBudgetDraft = (draft: LocalLguBudgetDraft | null): boolean =>
  Number(draft?.baseMonthlyBudget ?? 0) > 0 || Number(draft?.rolloverAmount ?? 0) > 0

const localDashboardBudgetStorageKey = computed(() =>
  `lgu_dashboard_budget:${selectedProgramId.value ?? "all"}:${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
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
