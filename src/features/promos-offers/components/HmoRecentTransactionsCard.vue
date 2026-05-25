<template>
  <section class="space-y-4">
    <article class="app-section-card-comfy">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-1">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-fg))]/50">HMO Dashboard</p>
          <h3 class="m-0 text-lg font-bold text-[rgb(var(--app-fg))]">Manager HMO Dashboard</h3>
          <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">HMO billings, patients, and statement tools for the selected profile.</p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            v-model="selectedHmoId"
            :options="hmoOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="All HMO profiles"
            showClear
            filter
            class="min-w-64"
          />
          <DatePicker v-model="selectedMonth" view="month" dateFormat="MM yy" :manualInput="false" showIcon class="min-w-48" />
          <Button label="Refresh" icon="pi pi-refresh" outlined size="small" :loading="loadingAny" @click="loadDashboard" />
        </div>
      </div>

      <Message v-if="!canManageHmoDashboard" severity="warn" :closable="false" size="small" class="mt-4">
        Manager dashboard controls are available to operations leadership roles. HMO totals and patient lists remain visible.
      </Message>
      <Message v-if="error" severity="warn" :closable="false" size="small" class="mt-4">{{ error }}</Message>

      <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">HMO Patients</div>
          <div class="mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ hmoPatients.length }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Invoice Total</div>
          <div class="mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ asCurrency(totalAmount) }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Paid</div>
          <div class="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{{ asCurrency(totalPaid) }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Outstanding</div>
          <div class="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{{ asCurrency(totalOutstanding) }}</div>
        </div>
      </div>
    </article>

    <article class="app-section-card-comfy">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <i class="pi pi-users" />
            </span>
            <div>
              <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">HMO Patients</h4>
              <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">Saved HMO information{{ selectedHmoName ? ` for ${selectedHmoName}` : '' }}.</p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="`${hmoPatients.length} patient${hmoPatients.length === 1 ? '' : 's'}`" severity="info" />
          <Button label="Recent Transactions" icon="pi pi-history" outlined size="small" @click="transactionsVisible = true" />
          <Button label="Create SOA" icon="pi pi-file" outlined size="small" @click="soaVisible = true" />
        </div>
      </div>

      <div class="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--app-border))]">
        <DataTable :value="hmoPatients" :loading="loadingPatients" size="small" scrollable scrollHeight="420px" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]">
          <template #empty>
            <EmptyState icon="pi pi-user-plus" title="No HMO patients found" text="Patients with saved HMO information will appear here." />
          </template>

          <Column header="Patient" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.full_name }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.public_id || `PATIENT-${data.id}` }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.phone_number || "No contact number" }}</div>
              </div>
            </template>
          </Column>

          <Column header="HMO Information" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.hmo_name || data.sponsor_company_name || "HMO" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">Approval {{ data.sponsor_approval_code || "N/A" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">Validity {{ formatDateOnly(data.sponsor_validity_start_date) }} - {{ formatDateOnly(data.sponsor_validity_end_date) }}</div>
              </div>
            </template>
          </Column>

          <Column header="Demographics" style="width: 160px">
            <template #body="{ data }">
              <div class="space-y-1 text-xs text-[rgb(var(--app-fg))]/70">
                <div class="font-medium text-[rgb(var(--app-fg))]">{{ data.age ?? "N/A" }} years old</div>
                <div>{{ data.gender_name || "N/A" }}</div>
              </div>
            </template>
          </Column>

          <Column header="Status" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" class="text-xs" />
            </template>
          </Column>
        </DataTable>
      </div>
    </article>

    <Dialog v-model:visible="transactionsVisible" header="Recent HMO Transactions" modal :style="{ width: 'min(96vw, 1120px)' }">
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">Recent HMO Transactions</h4>
            <p class="m-0 mt-1 text-sm text-[rgb(var(--app-fg))]/60">Invoices and payment status for HMO billings.</p>
          </div>
          <Button label="Refresh" icon="pi pi-refresh" outlined size="small" :loading="loadingTransactions" @click="loadTransactions" />
        </div>

        <DataTable :value="transactions" dataKey="id" :loading="loadingTransactions" size="small" scrollable scrollHeight="440px" paginator :rows="10">
          <template #empty>
            <EmptyState icon="pi pi-inbox" title="No HMO transactions found" text="HMO billings will appear here." />
          </template>
          <Column header="Created" style="width: 170px">
            <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
          </Column>
          <Column header="Patient / Billing" style="min-width: 250px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold">{{ data.patient_name || "No patient linked" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">BILLING-{{ data.id }}<span v-if="data.receipt_number"> - Receipt {{ data.receipt_number }}</span></div>
              </div>
            </template>
          </Column>
          <Column header="Service / Status" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-2">
                <div class="font-semibold">{{ data.service_name || "HMO Service" }}</div>
                <Tag :value="data.billing_status || 'Pending'" :severity="statusSeverity(data.billing_status)" class="text-xs" />
              </div>
            </template>
          </Column>
          <Column header="Total" style="width: 150px">
            <template #body="{ data }">
              <div class="text-right font-bold">{{ asCurrency(data.total_amount) }}</div>
            </template>
          </Column>
          <Column header="Outstanding" style="width: 150px">
            <template #body="{ data }">
              <div class="text-right">{{ asCurrency(Math.max(0, Number(data.total_amount ?? 0) - Number(data.amount_paid ?? 0))) }}</div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <Dialog v-model:visible="soaVisible" header="Create Statement Of Account (HMO)" modal :style="{ width: '520px' }">
      <div class="space-y-3">
        <IftaLabel>
          <DatePicker v-model="soaRange" selectionMode="range" dateFormat="yy-mm-dd" :manualInput="false" showIcon fluid />
          <label>Date Range</label>
        </IftaLabel>

        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" text @click="soaVisible = false" />
          <Button label="Generate" icon="pi pi-print" :disabled="!hasValidRange" @click="generateSoa" />
        </div>
      </div>
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
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useRouter } from "vue-router"
import type { Pageable } from "@/models/paging"
import type { Patient } from "@/features/patients/types/patient"
import type { Lookup } from "@/models/global.model"
import { billingPhase1Service, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"

const router = useRouter()
const hmoOptions = ref<Lookup[]>([])
const selectedHmoId = ref<number | null>(null)
const selectedMonth = ref<Date>(new Date())
const hmoPatients = ref<Patient[]>([])
const transactions = ref<HmoRecentHistoryItem[]>([])
const loadingProfiles = ref(false)
const loadingPatients = ref(false)
const loadingTransactions = ref(false)
const error = ref("")
const transactionsVisible = ref(false)
const soaVisible = ref(false)
const soaRange = ref<Date[] | null>(null)

const MANAGER_ROLE_KEYWORDS = ["owner", "chief", "coo", "operations", "manager", "admin"]

const resolveRoleFromStorage = (): string => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = String(parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole ?? "").trim()
      if (role) return role
    } catch {
      // Ignore malformed storage entries.
    }
  }
  return ""
}

const currentRoleName = ref(resolveRoleFromStorage())
const canManageHmoDashboard = computed(() => {
  const normalized = currentRoleName.value.trim().toLowerCase()
  return !!normalized && MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const selectedHmoName = computed(() =>
  hmoOptions.value.find(option => option.id === selectedHmoId.value)?.name ?? ""
)

const loadingAny = computed(() => loadingProfiles.value || loadingPatients.value || loadingTransactions.value)

const selectedPeriodYear = computed(() => selectedMonth.value.getFullYear())
const selectedPeriodMonth = computed(() => selectedMonth.value.getMonth() + 1)

const hasValidRange = computed(() => {
  const r = soaRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateOnly = (value?: string | null): string => {
  if (!value) return "N/A"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return "N/A"
  return dt.toLocaleDateString("en-PH")
}

const formatDateTime = (value: string | null): string => {
  if (!value) return "N/A"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return "N/A"
  return dt.toLocaleString("en-PH", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

const statusSeverity = (value: string | null): "success" | "danger" | "warn" | "secondary" | "info" => {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (!normalized) return "secondary"
  if (normalized.includes("paid") || normalized.includes("complete") || normalized.includes("billed")) return "success"
  if (normalized.includes("cancel") || normalized.includes("void") || normalized.includes("inactive")) return "danger"
  if (normalized.includes("pending") || normalized.includes("unpaid")) return "warn"
  return "info"
}

const totalAmount = computed(() =>
  transactions.value.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0)
)

const totalPaid = computed(() =>
  transactions.value.reduce((sum, item) => sum + Number(item.amount_paid ?? 0), 0)
)

const totalOutstanding = computed(() =>
  Math.max(0, Number((totalAmount.value - totalPaid.value).toFixed(2)))
)

const loadProfiles = async (): Promise<void> => {
  loadingProfiles.value = true
  try {
    const { data } = await pamsAPI.get<Pageable<Lookup>>("/hmos/lookup", {
      params: { page: 1, size: 1000, status: "ACTIVE" }
    })
    hmoOptions.value = data?.content ?? []
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to load HMO profiles" })
  } finally {
    loadingProfiles.value = false
  }
}

const loadPatients = async (): Promise<void> => {
  loadingPatients.value = true
  try {
    const { data } = await pamsAPI.get<Pageable<Patient>>("/patients", {
      params: {
        page: 1,
        size: 10000,
        status: "ALL",
        sponsor_context: "HMO",
        hmo_id: selectedHmoId.value ?? undefined,
        period_year: selectedPeriodYear.value,
        period_month: selectedPeriodMonth.value
      }
    })
    hmoPatients.value = data?.content ?? []
  } catch (err: unknown) {
    hmoPatients.value = []
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to load HMO patients" })
  } finally {
    loadingPatients.value = false
  }
}

const loadTransactions = async (): Promise<void> => {
  loadingTransactions.value = true
  try {
    transactions.value = await billingPhase1Service.getHmoRecentHistory(100, selectedHmoId.value ?? undefined) ?? []
  } catch (err: unknown) {
    transactions.value = []
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to load HMO transactions" })
  } finally {
    loadingTransactions.value = false
  }
}

const loadDashboard = async (): Promise<void> => {
  error.value = ""
  await Promise.all([loadPatients(), loadTransactions()])
}

const formatYmd = (value: Date): string => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, "0")
  const d = String(value.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const generateSoa = (): void => {
  if (!hasValidRange.value) return
  const [from, to] = soaRange.value as Date[]
  const query: Record<string, string | number> = { from: formatYmd(from), to: formatYmd(to) }
  if (selectedHmoId.value) query.hmo_id = selectedHmoId.value
  if (selectedHmoName.value) query.hmo_name = selectedHmoName.value
  const url = router.resolve({
    name: "soa-print",
    params: { payer: "hmo" },
    query
  }).href
  window.open(url, "_blank", "noopener,noreferrer")
  soaVisible.value = false
}

watch([selectedHmoId, selectedMonth], () => {
  void loadDashboard()
})

onMounted(async () => {
  currentRoleName.value = resolveRoleFromStorage()
  await loadProfiles()
  await loadDashboard()
})
</script>

<script lang="ts">
const EmptyState = {
  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true }
  },
  template: `
    <div class="px-4 py-12 text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--app-bg-soft))] text-[rgb(var(--app-fg))]/50">
        <i :class="[icon, 'text-lg']" />
      </div>
      <p class="m-0 mt-3 text-sm font-semibold text-[rgb(var(--app-fg))]">{{ title }}</p>
      <p class="m-0 mt-1 text-xs text-[rgb(var(--app-fg))]/60">{{ text }}</p>
    </div>
  `
}
</script>
