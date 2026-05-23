<template>
  <section class="space-y-4">
    <article class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <i class="pi pi-users" />
            </span>
            <div>
              <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">LGU Patients</h4>
              <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">Saved LGU information{{ selectedProgramName ? ` for ${selectedProgramName}` : '' }}.</p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="`${lguPatients.length} patient${lguPatients.length === 1 ? '' : 's'}`" severity="info" />
          <Button
            label="Recent Transactions"
            icon="pi pi-history"
            outlined
            size="small"
            @click="transactionsVisible = true"
          />
          <Button label="Refresh" icon="pi pi-refresh" outlined size="small" :loading="loadingLguPatients" @click="$emit('load-lgu-patients')" />
        </div>
      </div>

      <Message v-if="lguPatientsError" severity="warn" :closable="false" size="small" class="mt-4">{{ lguPatientsError }}</Message>

      <div class="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--app-border))]">
        <DataTable :value="lguPatients" :loading="loadingLguPatients" size="small" scrollable scrollHeight="420px" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]">
          <template #empty>
            <EmptyTableState icon="pi pi-user-plus" title="No LGU patients found" text="Patients with saved LGU information will appear here." />
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

          <Column header="LGU Information" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.lgu_program_name || data.sponsor_company_name || "LGU" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">Referral {{ data.referral_form_no || data.sponsor_approval_code || "N/A" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">Issued {{ formatDateOnlyText(data.referral_issued_date || data.sponsor_validity_start_date) }}</div>
              </div>
            </template>
          </Column>

          <Column header="Status" style="width: 170px">
            <template #body="{ data }">
              <Tag :value="formatLguPatientStatus(data.lgu_patient_status)" :severity="lguPatientStatusSeverity(data.lgu_patient_status)" class="text-xs" />
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

          <Column header="Address" style="min-width: 260px">
            <template #body="{ data }">
              <div class="text-xs leading-5 text-[rgb(var(--app-fg))]/70">{{ formatPatientAddress(data) || "N/A" }}</div>
            </template>
          </Column>

          <Column header="Action" style="width: 130px">
            <template #body="{ data }">
              <Button label="View" icon="pi pi-external-link" size="small" outlined @click="$emit('open-patient-detail', data.id)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </article>

    <Dialog
      v-model:visible="transactionsVisible"
      header="Recent LGU Transactions"
      modal
      :style="{ width: 'min(96vw, 1180px)' }"
      :pt="{ content: { class: 'space-y-4' } }"
    >
    <article class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
              <i class="pi pi-history" />
            </span>
            <div>
              <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">Recent LGU Transactions</h4>
              <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">Availed LGU products, claim status, and billed totals.</p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="`${lguTransactionHistory.length} record${lguTransactionHistory.length === 1 ? '' : 's'}`" severity="contrast" />
          <Button label="Refresh" icon="pi pi-refresh" outlined size="small" :loading="loadingTransactionHistory" @click="$emit('load-transaction-history')" />
        </div>
      </div>

      <Message v-if="transactionHistoryError" severity="warn" :closable="false" size="small" class="mt-4">{{ transactionHistoryError }}</Message>

      <div class="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--app-border))]">
        <DataTable :value="lguTransactionHistory" :loading="loadingTransactionHistory" size="small" scrollable scrollHeight="420px" dataKey="id">
          <template #empty>
            <EmptyTableState icon="pi pi-inbox" title="No LGU ledger transactions yet" text="Transactions will appear after LGU billings create ledger entries." />
          </template>

          <Column field="created_at" header="Created" style="width: 160px">
            <template #body="{ data }">
              <div class="text-sm font-medium text-[rgb(var(--app-fg))]">{{ formatDateTime(data.created_at) }}</div>
            </template>
          </Column>

          <Column header="Patient / Billing" style="min-width: 260px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.patient_name || "No patient linked" }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">
                  Billing {{ data.phase1_billing_public_id || "N/A" }}
                  <span v-if="data.receipt_number"> - Receipt {{ data.receipt_number }}</span>
                </div>
                <div v-if="data.patient_public_id" class="text-xs text-[rgb(var(--app-fg))]/60">Patient {{ data.patient_public_id }}</div>
              </div>
            </template>
          </Column>

          <Column header="Period" style="width: 130px">
            <template #body="{ data }">
              <div class="text-sm font-semibold text-[rgb(var(--app-fg))]">{{ formatBudgetPeriod(data.period_year, data.period_month) }}</div>
              <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.program_name }}</div>
            </template>
          </Column>

          <Column header="Type / Status" style="min-width: 240px">
            <template #body="{ data }">
              <div class="space-y-2">
                <div class="text-sm font-semibold leading-5 text-[rgb(var(--app-fg))]">{{ getAvailedProductName(data) }}</div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <Tag :value="formatTransactionStatus(data)" :severity="transactionStatusSeverity(data)" class="text-xs" />
                  <Tag :value="formatEntryType(data.entry_type)" :severity="entryTypeSeverity(data.entry_type)" class="text-xs" />
                </div>
              </div>
            </template>
          </Column>

          <Column header="Total of availed service" style="width: 190px">
            <template #body="{ data }">
              <div class="text-right">
                <div class="text-sm font-bold text-[rgb(var(--app-fg))]">{{ asCurrency(getAvailedServiceTotal(data)) }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">Grand total</div>
              </div>
            </template>
          </Column>

          <Column header="Action (CTA)" style="width: 150px">
            <template #body="{ data }">
              <Button
                v-if="data.patient_id"
                label="View Details"
                icon="pi pi-external-link"
                size="small"
                outlined
                @click="$emit('open-patient-detail', data.patient_id, data.period_year, data.period_month)"
              />
              <span v-else class="text-xs text-[rgb(var(--app-fg))]/50">N/A</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </article>
    </Dialog>

  </section>
</template>

<script setup lang="ts">
import { ref } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import Message from "primevue/message"
import Tag from "primevue/tag"
import type { Patient } from "@/features/patients/types/patient"
import type { LguDashboardHistoryItem } from "@/features/lgu-billing/api/lgu-billing.service"

defineProps<{
  lguTransactionHistory: LguDashboardHistoryItem[]
  loadingTransactionHistory: boolean
  transactionHistoryError: string
  lguPatients: Patient[]
  loadingLguPatients: boolean
  lguPatientsError: string
  selectedProgramName: string
  asCurrency: (value: number) => string
  formatDateTime: (value?: string) => string
  formatBudgetPeriod: (year: number, month: number) => string
  formatEntryType: (value?: string) => string
  entryTypeSeverity: (value?: string) => "success" | "info" | "warn" | "danger" | "secondary"
  usageStatusSeverity: (value?: string) => "success" | "warn" | "danger" | "secondary"
  formatDateOnlyText: (value?: string | null) => string
  formatPatientAddress: (patient?: Patient | null) => string
}>()

defineEmits<{
  "load-transaction-history": []
  "load-lgu-patients": []
  "open-patient-detail": [patientId: number, periodYear?: number, periodMonth?: number]
}>()

const transactionsVisible = ref(false)

const formatLguPatientStatus = (value?: Patient["lgu_patient_status"]): string => {
  if (value === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  if (value === "DROPPED_OUT") return "Dropped Out"
  return "Active"
}

const lguPatientStatusSeverity = (value?: Patient["lgu_patient_status"]): "success" | "warn" | "danger" | "info" | "secondary" => {
  if (value === "DROPPED_OUT" || value === "CROSS_MONTH_DROPPED_OUT") return "danger"
  if (value === "ACTIVE" || !value) return "success"
  return "secondary"
}

const getAvailedProductName = (row: LguDashboardHistoryItem): string => {
  return String(row.service_name || row.reference_label || "LGU availed product").trim()
}

const getAvailedServiceTotal = (row: LguDashboardHistoryItem): number => {
  const amountOut = Number(row.amount_out ?? 0)
  const amountIn = Number(row.amount_in ?? 0)
  return Math.abs(amountOut > 0 ? amountOut : amountIn)
}

const normalizeStatus = (value?: string | null): string => String(value ?? "").trim().toUpperCase()

const formatStatusLabel = (value?: string | null): string => {
  const normalized = normalizeStatus(value)
  if (!normalized) return "Pending"
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")
}

const formatTransactionStatus = (row: LguDashboardHistoryItem): string => {
  const status = row.program_status || row.billing_status || row.usage_status
  return formatStatusLabel(status)
}

const transactionStatusSeverity = (row: LguDashboardHistoryItem): "success" | "info" | "warn" | "danger" | "secondary" => {
  const status = normalizeStatus(row.program_status || row.billing_status || row.usage_status)
  if (status === "COMPLETED" || status === "RETURNED" || status === "BILLED" || status === "APPLIED") return "success"
  if (status === "DROPPED_OUT" || status === "CROSS_MONTH_DROPPED_OUT") return "warn"
  if (status === "CANCELLED" || status === "EXPIRED" || status === "VOID" || status === "REVERSED") return "danger"
  if (status === "ACTIVE" || status === "PENDING") return "info"
  return "secondary"
}
</script>

<script lang="ts">
const EmptyTableState = {
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
