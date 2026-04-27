<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="`Bills — ${patient?.full_name ?? ''}`"
    :style="{ width: '72rem', maxWidth: '95vw' }"
    :draggable="false"
  >
    <div class="space-y-4">
      <div v-if="!isLoading && billings.length" class="flex flex-wrap gap-2 text-xs">
        <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-1">
          {{ totalRecords }} total bill{{ totalRecords === 1 ? '' : 's' }}
        </span>
      </div>

      <div class="overflow-x-auto">
        <DataTable
          :value="billings"
          dataKey="id"
          paginator
          :rows="pageSize"
          :totalRecords="totalRecords"
          :loading="isLoading"
          lazy
          @page="onPage"
          :pt="{
            column: {
              headerCell: { class: 'px-4 py-3' },
              bodyCell: { class: 'px-4 py-3' }
            }
          }"
        >
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">
              No bills found for this patient.
            </div>
          </template>

          <Column field="created_at" header="Date">
            <template #body="{ data }">
              {{ formatDate(data.created_at) }}
            </template>
          </Column>

          <Column field="service_name" header="Service">
            <template #body="{ data }">
              <div>{{ data.service_name || "—" }}</div>
              <div class="text-xs opacity-60">{{ displayBillingType(data.billing_type) }}</div>
            </template>
          </Column>

          <Column field="billing_status" header="Status">
            <template #body="{ data }">
              <Tag :value="displayStatus(data.billing_status)" :severity="statusSeverity(data.billing_status)" />
            </template>
          </Column>

          <Column field="amount_due" header="Amount Due">
            <template #body="{ data }">
              {{ formatCurrency(data.amount_due) }}
            </template>
          </Column>

          <Column field="amount_paid" header="Amount Paid">
            <template #body="{ data }">
              {{ formatCurrency(data.amount_paid) }}
            </template>
          </Column>

          <Column field="payment_method_name" header="Payment">
            <template #body="{ data }">
              {{ data.payment_method_name || "—" }}
            </template>
          </Column>

          <Column field="receipt_number" header="Receipt #">
            <template #body="{ data }">
              {{ data.receipt_number || data.public_id || "—" }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import {ref, watch} from "vue"
import {useToast} from "primevue/usetoast"
import Column from "primevue/column"
import DataTable, {type DataTablePageEvent} from "primevue/datatable"
import Dialog from "primevue/dialog"
import Tag from "primevue/tag"
import {billingPhase1Service, type BillingListItem} from "@/features/billing/api/billing-phase1.service"
import type {Patient} from "@/features/patients/types/patient"
import {errorToast} from "@/utils/toast.util"

const props = defineProps<{
  patient: Patient | undefined
}>()

const toast = useToast()

const visible = ref(false)
const isLoading = ref(false)
const billings = ref<BillingListItem[]>([])
const totalRecords = ref(0)
const page = ref(1)
const pageSize = 15

const open = (): void => {
  visible.value = true
}

defineExpose({open})

const fetchBillings = async (): Promise<void> => {
  if (!props.patient) return
  try {
    isLoading.value = true
    const response = await billingPhase1Service.getAll({
      patient_id: props.patient.id,
      page: page.value,
      size: pageSize
    })
    billings.value = response?.content ?? []
    totalRecords.value = response?.total_elements ?? 0
  } catch {
    errorToast(toast, "Failed to load bills for this patient")
  } finally {
    isLoading.value = false
  }
}

const onPage = async (event: DataTablePageEvent): Promise<void> => {
  page.value = Math.floor((event.first ?? 0) / (event.rows ?? pageSize)) + 1
  await fetchBillings()
}

watch(visible, (isVisible) => {
  if (isVisible) {
    page.value = 1
    void fetchBillings()
  } else {
    billings.value = []
    totalRecords.value = 0
  }
})

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-PH", {month: "short", day: "numeric", year: "numeric"})

const formatCurrency = (value?: number): string => {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"}).format(value)
}

const displayBillingType = (type?: string): string =>
  (type ?? "").replace(/_/g, " ").trim() || "—"

const displayStatus = (status?: string): string =>
  (status?.trim() || "UNBILLED").toUpperCase()

const statusSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const s = displayStatus(status)
  if (s === "PAID" || s === "BILLED") return "success"
  if (s === "PARTIAL" || s === "PENDING") return "warn"
  if (s === "VOID") return "danger"
  return "info"
}
</script>
