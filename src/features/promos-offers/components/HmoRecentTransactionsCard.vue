<template>
  <section class="space-y-5">
    <article class="app-section-card-comfy overflow-hidden">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 space-y-1">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-fg))]/45">
            HMO Dashboard
          </p>
          <h3 class="m-0 text-xl font-bold tracking-tight text-[rgb(var(--app-fg))]">
            Manager HMO Dashboard
          </h3>
          <p class="m-0 max-w-2xl text-sm leading-6 text-[rgb(var(--app-fg))]/60">
            Review HMO patients, payments, outstanding balances, and statement tools from one workspace.
          </p>
        </div>

        <div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_auto] xl:max-w-2xl">
          <Select
            v-model="selectedHmoId"
            :options="hmoOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="All HMO profiles"
            showClear
            filter
            class="w-full"
          />
          <DatePicker
            v-model="selectedMonth"
            view="month"
            dateFormat="MM yy"
            :manualInput="false"
            showIcon
            class="w-full"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            outlined
            size="small"
            class="justify-center"
            :loading="loadingAny"
            @click="loadDashboard"
          />
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <Message v-if="!canManageHmoDashboard" severity="warn" :closable="false" size="small">
          Manager dashboard controls are available to operations leadership roles. HMO totals and patient lists remain visible.
        </Message>
        <Message v-if="error" severity="warn" :closable="false" size="small">
          {{ error }}
        </Message>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">HMO Patients</p>
              <p class="m-0 mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ hmoPatients.length }}</p>
            </div>
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <i class="pi pi-users" />
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Transactions</p>
              <p class="m-0 mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ transactions.length }}</p>
            </div>
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
              <i class="pi pi-receipt" />
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-wide text-emerald-700/70 dark:text-emerald-200/70">Paid By HMO</p>
              <p class="m-0 mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{{ asCurrency(totalPaid) }}</p>
            </div>
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <i class="pi pi-check-circle" />
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-wide text-amber-700/70 dark:text-amber-200/70">Outstanding</p>
              <p class="m-0 mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{{ asCurrency(totalOutstanding) }}</p>
            </div>
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <i class="pi pi-exclamation-circle" />
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-2 border-t border-[rgb(var(--app-border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0 text-xs leading-5 text-[rgb(var(--app-fg))]/55">
          Showing {{ selectedHmoName || 'all HMO profiles' }} for {{ selectedMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) }}.
        </p>
        <Button
          label="Mark Outstanding as Claimed"
          icon="pi pi-check-circle"
          severity="success"
          size="small"
          :loading="claimingHmoPayments"
          :disabled="claimingHmoPayments || totalOutstanding <= 0"
          @click="claimOutstandingHmoBillings"
        />
      </div>
    </article>

    <article class="app-section-card-comfy">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <i class="pi pi-users" />
          </span>
          <div class="min-w-0">
            <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">HMO Patients</h4>
            <p class="m-0 mt-1 text-sm leading-6 text-[rgb(var(--app-fg))]/60">
              Saved HMO information{{ selectedHmoName ? ` for ${selectedHmoName}` : '' }}.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="`${hmoPatients.length} patient${hmoPatients.length === 1 ? '' : 's'}`" severity="info" />
          <Button label="Transactions" icon="pi pi-history" outlined size="small" @click="transactionsVisible = true" />
          <Button label="Create SOA" icon="pi pi-file" outlined size="small" @click="openHmoSoaDialog" />
        </div>
      </div>

      <div class="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]">
        <DataTable
          :value="hmoPatients"
          :loading="loadingPatients"
          size="small"
          scrollable
          scrollHeight="520px"
          dataKey="id"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          stripedRows
          rowHover
          tableStyle="min-width: 920px"
          :pt="{
            header: { class: 'border-b border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))]' },
            column: {
              headerCell: { class: 'bg-[rgb(var(--app-bg-soft))] text-xs font-bold uppercase tracking-wide text-[rgb(var(--app-fg))]/55' },
              bodyCell: { class: 'align-top text-sm' }
            }
          }"
        >
          <template #empty>
            <EmptyState icon="pi pi-user-plus" title="No HMO patients found" text="Patients with saved HMO information will appear here." />
          </template>

          <Column header="Patient" style="min-width: 260px">
            <template #body="{ data }">
              <div class="flex items-start gap-3">
                <span class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-xs font-bold text-sky-700 dark:text-sky-300">
                  {{ getInitials(data.full_name) }}
                </span>
                <div class="min-w-0 space-y-1">
                  <div class="uppercase truncate font-semibold text-[rgb(var(--app-fg))]">{{ data.full_name }}</div>
                  <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.public_id || `PATIENT-${data.id}` }}</div>
                  <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.phone_number || "No contact number" }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column header="HMO Information" style="min-width: 280px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.hmo_name || data.sponsor_company_name || "HMO" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">Approval: {{ data.sponsor_approval_code || "N/A" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">
                  Validity: {{ formatDateOnly(data.sponsor_validity_start_date) }} – {{ formatDateOnly(data.sponsor_validity_end_date) }}
                </div>
              </div>
            </template>
          </Column>

          <Column header="Profile" style="width: 170px">
            <template #body="{ data }">
              <div class="space-y-1 text-xs text-[rgb(var(--app-fg))]/70">
                <div class="font-medium text-[rgb(var(--app-fg))]">{{ data.age ?? "N/A" }} years old</div>
                <div>{{ data.gender_name || "N/A" }}</div>
              </div>
            </template>
          </Column>

          <Column header="Status" style="width: 130px">
            <template #body="{ data }">
              <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" class="text-xs" />
            </template>
          </Column>

          <Column header="Actions" frozen alignFrozen="right" style="width: 140px">
            <template #body="{ data }">
              <Button label="Billings" icon="pi pi-file" outlined size="small" @click="openPatientBillings(data)" />
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

        <DataTable :value="transactions" dataKey="id" :loading="loadingTransactions" size="small" scrollable scrollHeight="480px" paginator :rows="10" stripedRows rowHover tableStyle="min-width: 860px">
          <template #empty>
            <EmptyState icon="pi pi-inbox" title="No HMO transactions found" text="HMO billings will appear here." />
          </template>
          <Column header="Created" style="width: 170px">
            <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
          </Column>
          <Column header="Patient / Billing" style="min-width: 250px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold">{{ formatPatientName(data.patient_name, "No patient linked") }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">BILLING-{{ data.id }}<span v-if="data.receipt_number"> · Receipt {{ data.receipt_number }}</span></div>
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
            <template #body="{ data }"><div class="text-right font-bold">{{ asCurrency(data.total_amount) }}</div></template>
          </Column>
          <Column header="Outstanding" style="width: 150px">
            <template #body="{ data }"><div class="text-right font-semibold text-amber-700 dark:text-amber-300">{{ asCurrency(Math.max(0, Number(data.total_amount ?? 0) - Number(data.amount_paid ?? 0))) }}</div></template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <Dialog v-model:visible="patientBillingsVisible" header="HMO Individual Billings" modal :style="{ width: 'min(96vw, 1180px)' }">
      <div class="space-y-4">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-1">
            <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">{{ selectedPatientName }}</h4>
            <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">
              HMO billings use the saved service lines and negotiated HMO prices from each billing record.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Tag :value="`${selectedPatientBillings.length} billing${selectedPatientBillings.length === 1 ? '' : 's'}`" severity="info" />
            <Button label="Refresh" icon="pi pi-refresh" outlined size="small" :loading="loadingPatientBillings" @click="refreshPatientBillings" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="printable in hmoPrintables"
            :key="printable.title"
            class="group flex h-full flex-col rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div class="flex flex-1 items-start gap-3">
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                <i :class="printable.icon" class="text-base" />
              </span>
              <div class="min-w-0 flex-1">
                <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">{{ printable.title }}</h4>
                <p class="m-0 mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/55">Generate a print-ready HMO document for this patient.</p>
              </div>
            </div>

            <div class="mt-4 border-t border-[rgb(var(--app-border))] pt-3">
              <Button
                :label="printable.buttonLabel"
                icon="pi pi-print"
                size="small"
                outlined
                class="w-full justify-center"
                :disabled="!selectedPatientBillings.length || loadingPatientBillings"
                @click="printHmoPrintable(printable.event)"
              />
            </div>
          </div>
        </div>

        <Message v-if="patientBillingError" severity="warn" :closable="false" size="small">{{ patientBillingError }}</Message>

        <DataTable :value="selectedPatientBillings" dataKey="id" :loading="loadingPatientBillings" size="small" scrollable scrollHeight="440px" paginator :rows="10" stripedRows rowHover tableStyle="min-width: 760px">
          <template #empty>
            <EmptyState icon="pi pi-inbox" title="No HMO billings found" text="This patient has no HMO billings in the selected month." />
          </template>
          <Column header="Created" style="width: 160px">
            <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
          </Column>
          <Column header="Billing" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold">{{ getBillingReference(data) }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.service_name || "HMO Service" }}</div>
              </div>
            </template>
          </Column>
          <Column header="Status" style="width: 130px">
            <template #body="{ data }"><Tag :value="data.billing_status || 'Pending'" :severity="statusSeverity(data.billing_status)" class="text-xs" /></template>
          </Column>
          <Column header="Total" style="width: 130px">
            <template #body="{ data }"><div class="text-right font-bold">{{ asCurrency(Number(data.total_amount ?? data.amount_due ?? 0)) }}</div></template>
          </Column>
          <Column header="Outstanding" style="width: 140px">
            <template #body="{ data }"><div class="text-right font-semibold text-amber-700 dark:text-amber-300">{{ asCurrency(getBillingOutstanding(data)) }}</div></template>
          </Column>
        </DataTable>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import { useRouter } from "vue-router"
import { useToast } from "primevue/usetoast"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import type { Pageable } from "@/models/paging"
import type { Patient } from "@/features/patients/types/patient"
import type { Lookup } from "@/models/global.model"
import { billingPhase1Service, type BillingListItem, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import { useAuthSessionStore } from "@/stores/auth-session.store"

const toast = useToast()
const router = useRouter()
const authSession = useAuthSessionStore()
const { roleName } = storeToRefs(authSession)
const hmoOptions = ref<Lookup[]>([])
const selectedHmoId = ref<number | null>(null)
const selectedMonth = ref<Date>(new Date())
const hmoPatients = ref<Patient[]>([])
const transactions = ref<HmoRecentHistoryItem[]>([])
const loadingProfiles = ref(false)
const loadingPatients = ref(false)
const loadingTransactions = ref(false)
const claimingHmoPayments = ref(false)
const error = ref("")
const transactionsVisible = ref(false)
const patientBillingsVisible = ref(false)
const selectedPatient = ref<Patient | null>(null)
const selectedPatientBillings = ref<BillingListItem[]>([])
const loadingPatientBillings = ref(false)
const patientBillingError = ref("")

const MANAGER_ROLE_KEYWORDS = ["owner", "chief", "coo", "operations", "manager", "admin"]

const canManageHmoDashboard = computed(() => {
  const normalized = roleName.value.trim().toLowerCase()
  return !!normalized && MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const selectedHmoName = computed(() =>
  hmoOptions.value.find(option => option.id === selectedHmoId.value)?.name ?? ""
)

const loadingAny = computed(() => loadingProfiles.value || loadingPatients.value || loadingTransactions.value)

const selectedPeriodYear = computed(() => selectedMonth.value.getFullYear())
const selectedPeriodMonth = computed(() => selectedMonth.value.getMonth() + 1)

const selectedPatientName = computed(() =>
  formatPatientName(resolvePatientName(selectedPatient.value), "Selected HMO Patient")
)

const firstNonBlank = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }
  return ""
}

const resolvePatientName = (patient?: Patient | null): string => {
  if (!patient) return ""

  const assembledName = [
    patient.first_name,
    patient.middle_name,
    patient.last_name,
  ].map(part => String(part ?? "").trim()).filter(Boolean).join(" ")

  return firstNonBlank(patient.full_name, assembledName, patient.public_id)
}

const formatPatientName = (value?: string | null, fallback = "Patient"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

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

type HmoPrintableEvent = "print-patient-profile" | "print-patient-billing-summary" | "print-attendance-record"

const hmoPrintables = [
  // {
  //   title: "Patient HMO Profile",
  //   buttonLabel: "Patient HMO Profile",
  //   icon: "pi pi-id-card",
  //   event: "print-patient-profile" as HmoPrintableEvent
  // },
  {
    title: "Patient Billing Summary",
    buttonLabel: "Patient Billing Summary",
    icon: "pi pi-receipt",
    event: "print-patient-billing-summary" as HmoPrintableEvent
  },
  // {
  //   title: "Attendance & Treatment Record",
  //   buttonLabel: "Attendance & Treatment Record",
  //   icon: "pi pi-file-pdf",
  //   event: "print-attendance-record" as HmoPrintableEvent
  // }
]

const openHmoPrintRoute = (routeName: "hmo-patient-profile-print" | "hmo-patient-billing-summary-print" | "hmo-attendance-treatment-print"): Window | null => {
  if (!selectedPatient.value) return null

  const { from, to } = getSelectedMonthRange()
  const href = router.resolve({
    name: routeName,
    query: {
      patient_id: String(selectedPatient.value.id),
      patient_name: selectedPatientName.value,
      hmo_id: selectedHmoId.value ? String(selectedHmoId.value) : undefined,
      hmo_name: selectedHmoName.value,
      from: formatYmd(from),
      to: formatYmd(to),
      autoprint: "1"
    }
  }).href

  const popup = window.open(href, "_blank")
  if (!popup || popup.closed) {
    patientBillingError.value = "Unable to open the print view. Allow pop-ups for this site, then try again."
    return null
  }
  return popup
}


const getBillingReference = (billing: Pick<BillingListItem, "id" | "public_id" | "receipt_number">): string =>
  billing.public_id || billing.receipt_number || `BILLING-${billing.id}`

const getBillingOutstanding = (billing: Pick<BillingListItem, "total_amount" | "amount_due" | "amount_paid">): number =>
  Math.max(0, Number((Number(billing.total_amount ?? billing.amount_due ?? 0) - Number(billing.amount_paid ?? 0)).toFixed(2)))


const getSelectedMonthRange = (): { from: Date; to: Date } => {
  const from = new Date(selectedPeriodYear.value, selectedPeriodMonth.value - 1, 1)
  const to = new Date(selectedPeriodYear.value, selectedPeriodMonth.value, 0, 23, 59, 59, 999)
  return { from, to }
}

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
    const { from, to } = getSelectedMonthRange()
    transactions.value = await billingPhase1Service.getHmoSoa({
      from: formatYmd(from),
      to: formatYmd(to),
      limit: 5000,
      hmo_id: selectedHmoId.value ?? undefined
    }) ?? []
  } catch (err: unknown) {
    transactions.value = []
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to load HMO transactions" })
  } finally {
    loadingTransactions.value = false
  }
}

const claimOutstandingHmoBillings = async (): Promise<void> => {
  const outstanding = transactions.value
    .map(row => ({
      billingId: Number(row.id),
      outstanding: Number(Math.max(0, Number(row.total_amount ?? 0) - Number(row.amount_paid ?? 0)).toFixed(2))
    }))
    .filter(row => Number.isFinite(row.billingId) && row.billingId > 0 && row.outstanding > 0)

  if (!outstanding.length) {
    successToast(toast, "No outstanding HMO billings to claim")
    return
  }

  claimingHmoPayments.value = true
  try {
    await Promise.all(outstanding.map(row =>
      billingPhase1Service.recordPayment(row.billingId, {
        amountTendered: row.outstanding,
        paymentType: "HMO Claim",
        referenceNo: `HMO-${selectedPeriodYear.value}-${String(selectedPeriodMonth.value).padStart(2, "0")}`,
        note: "Marked claimed from HMO dashboard"
      })
    ))
    successToast(toast, `${outstanding.length} HMO billing${outstanding.length === 1 ? "" : "s"} marked as claimed`)
    await loadDashboard()
  } catch (err: unknown) {
    errorToast(toast, getApiErrorMessage(err, { baseMessage: "Failed to mark HMO billings as claimed" }))
  } finally {
    claimingHmoPayments.value = false
  }
}

const loadDashboard = async (): Promise<void> => {
  error.value = ""
  await Promise.all([loadPatients(), loadTransactions()])
}

const loadPatientBillings = async (
  patientId = selectedPatient.value?.id,
  range = getSelectedMonthRange()
): Promise<BillingListItem[]> => {
  if (!patientId) return []
  loadingPatientBillings.value = true
  patientBillingError.value = ""
  try {
    const result = await billingPhase1Service.getAll({
      patient_id: patientId,
      billing_type: "HMO_BILLING",
      from_date: formatYmd(range.from),
      to_date: formatYmd(range.to),
      page: 1,
      size: 1000
    })
    const billings = result?.content ?? []
    selectedPatientBillings.value = billings
    return billings
  } catch (err: unknown) {
    selectedPatientBillings.value = []
    patientBillingError.value = getApiErrorMessage(err, { baseMessage: "Failed to load HMO billings for this patient" })
    return []
  } finally {
    loadingPatientBillings.value = false
  }
}

const refreshPatientBillings = async (): Promise<void> => {
  await loadPatientBillings()
}

const openHmoSoaDialog = async (): Promise<void> => {
  const { from, to } = getSelectedMonthRange()
  const href = router.resolve({
    name: "hmo-soa-print",
    query: {
      hmo_id: selectedHmoId.value ? String(selectedHmoId.value) : undefined,
      hmo_name: selectedHmoName.value || undefined,
      from: formatYmd(from),
      to: formatYmd(to),
      autoprint: "1"
    }
  }).href

  const popup = window.open(href, "_blank")
  if (!popup || popup.closed) {
    patientBillingError.value = "Unable to open the HMO SOA print view. Allow pop-ups for this site, then try again."
  }
}

const openPatientBillings = async (patient: Patient): Promise<void> => {
  selectedPatient.value = patient
  selectedPatientBillings.value = []
  patientBillingError.value = ""
  const { from, to } = getSelectedMonthRange()
  patientBillingsVisible.value = true
  await loadPatientBillings(patient.id, { from, to })
}

const formatYmd = (value: Date): string => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, "0")
  const d = String(value.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}


const printPatientIndividualBilling = async (): Promise<void> => {
  if (!openHmoPrintRoute("hmo-patient-profile-print")) return
}

const printPatientHmoInvoice = async (): Promise<void> => {
  if (!selectedPatient.value || !selectedPatientBillings.value.length) return
  if (!openHmoPrintRoute("hmo-patient-billing-summary-print")) {
    patientBillingError.value = "Unable to open HMO billing summary. Allow pop-ups for this site, then try again."
  }
}



const printPatientAttendanceRecord = async (): Promise<void> => {
  if (!openHmoPrintRoute("hmo-attendance-treatment-print")) {
    patientBillingError.value = "Unable to open attendance record. Allow pop-ups for this site, then try again."
  }
}

const printHmoPrintable = (event: HmoPrintableEvent): void => {
  if (event === "print-patient-profile") {
    void printPatientIndividualBilling()
    return
  }
  if (event === "print-patient-billing-summary") {
    void printPatientHmoInvoice()
    return
  }
  if (event === "print-attendance-record") {
    void printPatientAttendanceRecord()
    return
  }
  void printPatientAttendanceRecord()
}

const getInitials = (value?: string | null): string => {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return "HM"

  return parts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("")
}

watch([selectedHmoId, selectedMonth], () => {
  void loadDashboard()
})

onMounted(async () => {
  await authSession.ensureLoaded().catch(() => undefined)
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
