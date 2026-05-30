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
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Total Transactions</div>
          <div class="mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ transactions.length }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Paid By HMO</div>
          <div class="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{{ asCurrency(totalPaid) }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Outstanding</div>
          <div class="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{{ asCurrency(totalOutstanding) }}</div>
        </div>
      </div>

      <div class="mt-3 flex justify-end">
        <Button
          label="Claimed"
          icon="pi pi-check-circle"
          severity="success"
          :loading="claimingHmoPayments"
          :disabled="claimingHmoPayments || totalOutstanding <= 0"
          @click="claimOutstandingHmoBillings"
        />
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
          <Button label="Create SOA" icon="pi pi-file" outlined size="small" @click="openHmoSoaDialog" />
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

          <Column header="Actions" style="width: 140px">
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

    <Dialog v-model:visible="patientBillingsVisible" header="HMO Individual Billings" modal :style="{ width: 'min(96vw, 1180px)' }">
      <div class="space-y-4">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-1">
            <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">{{ selectedPatientName }}</h4>
            <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">
              HMO billings use the saved individual service lines and negotiated HMO prices from each billing record.
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

        <DataTable :value="selectedPatientBillings" dataKey="id" :loading="loadingPatientBillings" size="small" scrollable scrollHeight="420px" paginator :rows="10">
          <template #empty>
            <EmptyState icon="pi pi-inbox" title="No HMO billings found" text="This patient has no HMO billings in the selected month." />
          </template>
          <Column header="Created" style="width: 160px">
            <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
          </Column>
          <Column header="Billing" style="min-width: 220px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold">{{ getBillingReference(data) }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.service_name || "HMO Service" }}</div>
              </div>
            </template>
          </Column>
          <Column header="Status" style="width: 130px">
            <template #body="{ data }">
              <Tag :value="data.billing_status || 'Pending'" :severity="statusSeverity(data.billing_status)" class="text-xs" />
            </template>
          </Column>
          <Column header="Total" style="width: 130px">
            <template #body="{ data }">
              <div class="text-right font-bold">{{ asCurrency(Number(data.total_amount ?? data.amount_due ?? 0)) }}</div>
            </template>
          </Column>
          <Column header="Outstanding" style="width: 130px">
            <template #body="{ data }">
              <div class="text-right">{{ asCurrency(getBillingOutstanding(data)) }}</div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useToast } from "primevue/usetoast"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import type { Pageable } from "@/models/paging"
import type { Patient } from "@/features/patients/types/patient"
import type { Lookup } from "@/models/global.model"
import { billingPhase1Service, type BillingListItem, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import { renderHmoInvoiceWindow } from "@/features/billing/invoices/hmo-invoice.util"
import {
  escapeHtml,
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "@/features/billing/invoices/invoice-layout.util"
import {
  openEncounterTicketPdfWindow,
  renderAttendanceRecordPdfWindow,
  type EncounterTicketPdfCard
} from "@/utils/encounter-ticket-pdf.util"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"

const toast = useToast()
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
const soaVisible = ref(false)
const soaRange = ref<Date[] | null>(null)
const patientBillingsVisible = ref(false)
const selectedPatient = ref<Patient | null>(null)
const selectedPatientBillings = ref<BillingListItem[]>([])
const loadingPatientBillings = ref(false)
const patientBillingError = ref("")

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

const selectedPatientName = computed(() =>
  selectedPatient.value?.full_name || selectedPatient.value?.public_id || "Selected HMO Patient"
)

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

type HmoPrintableLine = {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  treatmentDate?: string
  laterality?: string
  bodyArea?: string
  referenceNumber?: string
}

type HmoPrintableEvent = "print-individual-billing" | "print-hmo-invoice" | "print-billing-statement"

const hmoPrintables = [
  {
    title: "Individual Billing",
    buttonLabel: "Print Individual Billing",
    icon: "pi pi-id-card",
    event: "print-individual-billing" as HmoPrintableEvent
  },
  {
    title: "HMO Invoice",
    buttonLabel: "Print Invoice",
    icon: "pi pi-receipt",
    event: "print-hmo-invoice" as HmoPrintableEvent
  },
  {
    title: "HMO Billing Statement",
    buttonLabel: "Print Billing Statement",
    icon: "pi pi-file-pdf",
    event: "print-billing-statement" as HmoPrintableEvent
  }
]

const openPrintWindow = (title: string): Window | null => {
  const popup = window.open("", "_blank")
  if (!popup || popup.closed) {
    patientBillingError.value = `Unable to open ${title}. Allow pop-ups for this site, then try again.`
    return null
  }
  return popup
}

const getBillingReference = (billing: Pick<BillingListItem, "id" | "public_id" | "receipt_number">): string =>
  billing.public_id || billing.receipt_number || `BILLING-${billing.id}`

const getBillingOutstanding = (billing: Pick<BillingListItem, "total_amount" | "amount_due" | "amount_paid">): number =>
  Math.max(0, Number((Number(billing.total_amount ?? billing.amount_due ?? 0) - Number(billing.amount_paid ?? 0)).toFixed(2)))

const parseBillingLineItems = (billing: BillingListItem): HmoPrintableLine[] => {
  try {
    const parsed = JSON.parse(billing.line_items_json || "[]") as Array<Record<string, unknown>>
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(item => {
        const quantity = Math.max(1, Number(item.quantity ?? 1))
        const unitPrice = Number(item.price ?? item.unitPrice ?? item.unit_price ?? 0)
        const lineTotal = Number(item.lineTotal ?? item.line_total ?? (quantity * unitPrice))
        return {
          name: String(item.name ?? billing.service_name ?? "HMO Service"),
          quantity,
          unitPrice,
          lineTotal,
          treatmentDate: String(item.treatmentDate ?? item.treatment_date ?? billing.created_at ?? ""),
          laterality: String(item.laterality ?? item.laterality_name ?? ""),
          bodyArea: String(item.body_area ?? item.bodyArea ?? ""),
          referenceNumber: getBillingReference(billing)
        }
      })
    }
  } catch {
    // Fall through to the billing-level fallback below.
  }

  const fallbackTotal = Number(billing.total_amount ?? billing.amount_due ?? 0)
  return [{
    name: billing.service_name || "HMO Service",
    quantity: 1,
    unitPrice: fallbackTotal,
    lineTotal: fallbackTotal,
    treatmentDate: billing.created_at,
    referenceNumber: getBillingReference(billing)
  }]
}

const renderHmoPrintableRows = (lines: HmoPrintableLine[]): string => {
  if (!lines.length) {
    return `<tr><td colspan="8" class="text-center">No HMO service lines found.</td></tr>`
  }
  return lines.map((line, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td class="text-center">${escapeHtml(formatDateOnly(line.treatmentDate))}</td>
      <td>${escapeHtml(line.name)}</td>
      <td class="text-center">${escapeHtml(line.quantity)}</td>
      <td class="text-center">${escapeHtml(line.laterality || "N/A")}</td>
      <td class="text-center">${escapeHtml(line.bodyArea || "N/A")}</td>
      <td class="text-right">${escapeHtml(asCurrency(line.unitPrice))}</td>
      <td class="text-right">${escapeHtml(asCurrency(line.lineTotal))}</td>
    </tr>
  `).join("")
}

const renderBulkHmoSoaRows = (rows: HmoRecentHistoryItem[]): string => {
  if (!rows.length) {
    return `<tr><td colspan="10" class="text-center">No SOA records found for the selected period.</td></tr>`
  }
  return rows.map((row, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${escapeHtml(row.patient_name || "N/A")}</td>
      <td>${escapeHtml(row.receipt_number || `BILLING-${row.id}`)}</td>
      <td>${escapeHtml(row.billing_status || "N/A")}</td>
      <td>${escapeHtml(row.physical_therapist || "N/A")}</td>
      <td>${escapeHtml(row.doctor || "N/A")}</td>
      <td>${escapeHtml(row.diagnosis || "N/A")}</td>
      <td class="text-center">${escapeHtml(formatDateOnly(row.created_at))}</td>
      <td>${escapeHtml(row.service_name || "HMO Service")}</td>
      <td class="text-right">${escapeHtml(asCurrency(Number(row.total_amount ?? 0)))}</td>
    </tr>
  `).join("")
}

const getHmoDetailRows = (billing?: Partial<BillingListItem>): InvoiceDetailRow[] => [
  { label: "Billing To", value: billing?.hmo_name || selectedHmoName.value || "HMO" },
  { label: "HMO Type", value: billing?.hmo_type_name || "N/A" },
  { label: "Company Name", value: billing?.hmo_company_name || "N/A" },
  { label: "LOA Approval No.", value: billing?.hmo_loa_number || billing?.hmo_approval_code || "N/A" },
  { label: "LOA Approval date", value: formatDateOnly(billing?.hmo_loa_date) }
]

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

const openHmoSoaDialog = (): void => {
  const { from, to } = getSelectedMonthRange()
  soaRange.value = [from, to]
  soaVisible.value = true
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

const generateSoa = async (): Promise<void> => {
  if (!hasValidRange.value) return
  const [from, to] = soaRange.value as Date[]
  const fromStr = formatYmd(from)
  const toStr = formatYmd(to)
  const hmoName = selectedHmoName.value || "HMO"
  const popup = openPrintWindow("HMO statement of account")
  if (!popup) {
    error.value = patientBillingError.value
    return
  }

  try {
    const rows = await billingPhase1Service.getHmoSoa({
      from: fromStr,
      to: toStr,
      limit: 5000,
      hmo_id: selectedHmoId.value ?? undefined
    }) ?? []
    const grandTotal = rows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0)

    renderStandardInvoiceWindow(popup, {
      title: "Statement of the Account",
      headerTitle: "STATEMENT OF THE ACCOUNT",
      fileName: `hmo-soa-${fromStr}-${toStr}`,
      billingDate: to.toISOString(),
      referenceNumber: `HMO-SOA-${fromStr}-${toStr}`,
      topMetaRows: [
        { label: "Partner Institution", value: hmoName },
        { label: "Billing Date", value: formatDateOnly(to.toISOString()) },
        { label: "Transaction Period", value: `${formatDateOnly(from.toISOString())} - ${formatDateOnly(to.toISOString())}` }
      ],
      patientName: hmoName,
      hidePatientDoctorHeader: true,
      columns: [
        { label: "ITEM No.", width: "58px", align: "center" },
        { label: "PATIENT NAME", width: "150px" },
        { label: "REFERENCE NO.", width: "120px" },
        { label: "BILLING STATUS", width: "110px" },
        { label: "PHYSICAL THERAPIST", width: "130px" },
        { label: "DOCTOR", width: "120px" },
        { label: "DIAGNOSIS", width: "150px" },
        { label: "TREATMENT DATE", width: "100px", align: "center" },
        { label: "PT SERVICE RENDERED" },
        { label: "INVOICE BILLING TOTAL", width: "130px", align: "right" }
      ],
      tableRowsHtml: renderBulkHmoSoaRows(rows),
      emptyStateColspan: 10,
      discount: 0,
      grandTotal,
      detailBoxTitle: "HMO DETAILS",
      detailRows: [
        { label: "Billing To", value: hmoName },
        { label: "Date Issued", value: new Date().toLocaleDateString("en-PH") },
        { label: "Record Count", value: String(rows.length) }
      ],
      renderErrorMessage: "The HMO statement of account could not be rendered. Please try again.",
      autoPrint: true,
      pageSize: "A4 landscape",
      maxWidthPx: 1320
    })
    soaVisible.value = false
  } catch (err: unknown) {
    popup.close()
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to generate HMO SOA" })
  }
}

const getBillingDetail = async (billing: BillingListItem): Promise<BillingListItem> => {
  const detail = await billingPhase1Service.getById(billing.id)
  return detail ?? billing
}

const loadSelectedPatientBillingDetails = async (): Promise<BillingListItem[]> => {
  if (!selectedPatientBillings.value.length) return []
  return Promise.all(selectedPatientBillings.value.map(getBillingDetail))
}

const printPatientIndividualBilling = async (): Promise<void> => {
  if (!selectedPatient.value || !selectedPatientBillings.value.length) return
  const popup = openPrintWindow("HMO individual billing")
  if (!popup) return
  try {
    const details = await loadSelectedPatientBillingDetails()
    const representative = details[0]
    const lines = details.flatMap(billing => parseBillingLineItems(billing))
    const grandTotal = Number(lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2))
    renderStandardInvoiceWindow(popup, {
      title: "HMO Individual Billing",
      headerTitle: "HMO INDIVIDUAL BILLING",
      fileName: `HMO-INDIVIDUAL-BILLING-${selectedPatient.value.id}-${formatYmd(new Date())}`,
      billingDate: representative?.hmo_loa_date || representative?.created_at || new Date().toISOString(),
      referenceNumber: `HMO-BILLING-${selectedPatient.value.id}`,
      patientName: representative?.patient_name || selectedPatientName.value,
      patientAddress: representative?.patient_address,
      patientAge: representative?.patient_age,
      patientGender: representative?.patient_gender,
      physicalTherapist: representative?.physical_therapist,
      doctor: representative?.doctor,
      diagnosis: representative?.diagnosis,
      columns: [
        { label: "ITEM No.", width: "60px", align: "center" },
        { label: "TREATMENT DATE", width: "110px", align: "center" },
        { label: "PT SERVICE RENDERED" },
        { label: "QTY", width: "50px", align: "center" },
        { label: "LATERALITY", width: "100px", align: "center" },
        { label: "BODY AREA", width: "110px", align: "center" },
        { label: "UNIT PRICE", width: "110px", align: "right" },
        { label: "UNIT TOTAL", width: "110px", align: "right" }
      ],
      tableRowsHtml: renderHmoPrintableRows(lines),
      emptyStateColspan: 8,
      discount: Number(details.reduce((sum, billing) => sum + Number(billing.discount_amount ?? 0), 0).toFixed(2)),
      grandTotal,
      detailBoxTitle: "HMO DETAILS",
      detailRows: getHmoDetailRows(representative),
      renderErrorMessage: "The HMO individual billing could not be rendered. Please try again.",
      pageSize: "A4 landscape",
      maxWidthPx: 1200
    })
  } catch (err: unknown) {
    popup.close()
    patientBillingError.value = getApiErrorMessage(err, { baseMessage: "Failed to print HMO individual billing" })
  }
}

const printPatientHmoInvoice = async (): Promise<void> => {
  if (!selectedPatient.value || !selectedPatientBillings.value.length) return
  const popup = openPrintWindow("HMO invoice")
  if (!popup) return
  try {
    const details = await loadSelectedPatientBillingDetails()
    const representative = details[0]
    const lines = details.flatMap(billing => parseBillingLineItems(billing))
    renderHmoInvoiceWindow(popup, {
      billingDate: representative?.hmo_loa_date || representative?.created_at || new Date().toISOString(),
      referenceNumber: `HMO-INVOICE-${selectedPatient.value.id}`,
      patientName: representative?.patient_name || selectedPatientName.value,
      patientAddress: representative?.patient_address,
      patientAge: representative?.patient_age,
      patientGender: representative?.patient_gender,
      physicalTherapist: representative?.physical_therapist,
      doctor: representative?.doctor,
      diagnosis: representative?.diagnosis,
      hmoName: representative?.hmo_name || selectedHmoName.value,
      hmoTypeName: representative?.hmo_type_name,
      hmoCompanyName: representative?.hmo_company_name,
      hmoApprovalCode: representative?.hmo_loa_number || representative?.hmo_approval_code,
      hmoApprovalDate: representative?.hmo_loa_date,
      hmoValidityStart: representative?.hmo_validity_start,
      hmoValidityEnd: representative?.hmo_validity_end,
      subtotal: Number(details.reduce((sum, billing) => sum + Number(billing.subtotal_amount ?? billing.amount_due ?? billing.total_amount ?? 0), 0).toFixed(2)),
      discount: Number(details.reduce((sum, billing) => sum + Number(billing.discount_amount ?? 0), 0).toFixed(2)),
      grandTotal: Number(details.reduce((sum, billing) => sum + Number(billing.total_amount ?? billing.amount_due ?? 0), 0).toFixed(2)),
      lines
    }, { title: "HMO Invoice", fileName: `HMO-INVOICE-${selectedPatient.value.id}-${formatYmd(new Date())}` })
  } catch (err: unknown) {
    popup.close()
    patientBillingError.value = getApiErrorMessage(err, { baseMessage: "Failed to print HMO invoice" })
  }
}

const printPatientSoa = async (): Promise<void> => {
  if (!selectedPatient.value) return
  const popup = openPrintWindow("HMO patient SOA")
  if (!popup) return
  const { from, to } = getSelectedMonthRange()
  try {
    const billings = await loadPatientBillings(selectedPatient.value.id, { from, to })
    const details = await Promise.all(billings.map(getBillingDetail))
    const representative = details[0]
    const lines = details.flatMap(billing => parseBillingLineItems(billing))
    const grandTotal = Number(lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2))
    renderStandardInvoiceWindow(popup, {
      title: "Statement of Account",
      headerTitle: "STATEMENT OF ACCOUNT",
      fileName: `HMO-SOA-${selectedPatient.value.id}-${formatYmd(from)}-${formatYmd(to)}`,
      billingDate: to.toISOString(),
      referenceNumber: `HMO-SOA-${selectedPatient.value.id}`,
      topMetaRows: [
        { label: "Partner Institution", value: representative?.hmo_name || selectedHmoName.value || "HMO" },
        { label: "Billing Date", value: formatDateOnly(to.toISOString()) },
        { label: "Transaction Period", value: `${formatDateOnly(from.toISOString())} - ${formatDateOnly(to.toISOString())}` }
      ],
      patientName: representative?.patient_name || selectedPatientName.value,
      patientAddress: representative?.patient_address,
      patientAge: representative?.patient_age,
      patientGender: representative?.patient_gender,
      physicalTherapist: representative?.physical_therapist,
      doctor: representative?.doctor,
      diagnosis: representative?.diagnosis,
      columns: [
        { label: "ITEM No.", width: "60px", align: "center" },
        { label: "TREATMENT DATE", width: "110px", align: "center" },
        { label: "PT SERVICE RENDERED" },
        { label: "QTY", width: "50px", align: "center" },
        { label: "LATERALITY", width: "100px", align: "center" },
        { label: "BODY AREA", width: "110px", align: "center" },
        { label: "UNIT PRICE", width: "110px", align: "right" },
        { label: "UNIT TOTAL", width: "110px", align: "right" }
      ],
      tableRowsHtml: renderHmoPrintableRows(lines),
      emptyStateColspan: 8,
      discount: 0,
      grandTotal,
      detailBoxTitle: "HMO DETAILS",
      detailRows: getHmoDetailRows(representative),
      renderErrorMessage: "The HMO patient SOA could not be rendered. Please try again.",
      pageSize: "A4 landscape",
      maxWidthPx: 1200
    })
  } catch (err: unknown) {
    popup.close()
    patientBillingError.value = getApiErrorMessage(err, { baseMessage: "Failed to print HMO patient SOA" })
  }
}

const buildHmoEncounterTicketCards = (detail: BillingListItem): EncounterTicketPdfCard[] =>
  (detail.encounter_tickets ?? [])
    .filter(ticket => ticket.record_locked)
    .map(ticket => {
      const snap = ticket.billing_snapshot
      const pkgName = ticket.active_billing_package_name?.trim() || snap?.active_billing_package_name?.trim() || ""
      const pkgId = ticket.active_billing_package_id?.trim() || snap?.active_billing_package_id?.trim() || ""
      const pkgSource = ticket.active_billing_package_source?.trim() || snap?.active_billing_package_source?.trim() || ""
      const activeBillingPackageLabel = pkgName && pkgId && pkgName !== pkgId
        ? `${pkgName} (${pkgId})`
        : pkgName || pkgId || "No active billing package linked"

      return {
        slipNumber: ticket.slip_number || `ETS-${ticket.id}`,
        encounterTicketId: ticket.id,
        patientName: snap?.patient_name || detail.patient_name || selectedPatientName.value,
        providerName: snap?.provider_name || detail.physical_therapist || "Unassigned",
        serviceName: snap?.service_name || detail.service_name || "Therapy Session",
        specialtyName: snap?.specialty_tag_name,
        specialtyIsActive: snap?.specialty_tag_is_active,
        treatmentAreaName: snap?.treatment_area_name,
        treatmentAreaColor: snap?.treatment_area_color,
        treatmentAreaIsActive: snap?.treatment_area_is_active,
        billingRoute: "HMO",
        attendanceStatus: ticket.attendance_status === "ATTENDED" ? "Attended" : "No Show",
        attendedAt: ticket.attended_at,
        signedOffAt: ticket.signed_off_at,
        lockedAt: ticket.locked_at,
        appointmentId: snap?.appointment_public_id ?? ticket.appointment_public_id ?? detail.appointment_public_id ?? detail.appointment_id,
        billingId: ticket.phase1_billing_public_id ?? detail.public_id ?? detail.id,
        activeBillingPackageLabel,
        activeBillingPackageSource: pkgSource ? `Linked billing package - ${pkgSource}` : undefined,
        deductionSummary: "Deducting 1 Session from HMO Allocation",
        signatureDataUrl: ticket.patient_signature_data_url,
        ptSignatureDataUrl: ticket.pt_signature_data_url,
        sessionSequenceLabel: snap?.session_sequence_label
      }
    })

const printPatientAttendanceRecord = async (): Promise<void> => {
  if (!selectedPatient.value || !selectedPatientBillings.value.length) return

  let popup: Window
  try {
    popup = openEncounterTicketPdfWindow("Attendance & Treatment Record")
  } catch {
    patientBillingError.value = "Unable to open attendance record. Allow pop-ups for this site, then try again."
    return
  }

  try {
    const details = await loadSelectedPatientBillingDetails()
    const cards = details
      .flatMap(buildHmoEncounterTicketCards)
      .filter(card => card.attendanceStatus === "Attended")
      .sort((left, right) => String(left.attendedAt ?? left.signedOffAt ?? "").localeCompare(String(right.attendedAt ?? right.signedOffAt ?? "")))

    if (!cards.length) {
      popup.close()
      patientBillingError.value = "No locked attended encounter tickets found for this patient"
      return
    }

    renderAttendanceRecordPdfWindow(popup, cards, {
      title: "Attendance & Treatment Record",
      subtitle: `${selectedPatientName.value} - ${cards.length} locked encounter ticket${cards.length === 1 ? "" : "s"}`,
      fileName: `hmo-attendance-treatment-record-${selectedPatient.value.id}`
    })
  } catch (err: unknown) {
    popup.close()
    patientBillingError.value = getApiErrorMessage(err, { baseMessage: "Failed to print attendance and treatment record" })
  }
}

const printHmoPrintable = (event: HmoPrintableEvent): void => {
  if (event === "print-individual-billing") {
    void printPatientIndividualBilling()
    return
  }
  if (event === "print-hmo-invoice") {
    void printPatientHmoInvoice()
    return
  }
  if (event === "print-attendance-record") {
    void printPatientAttendanceRecord()
    return
  }
  void printPatientSoa()
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
