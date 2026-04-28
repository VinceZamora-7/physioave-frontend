<template>
  <section class="app-section-card-comfy space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div class="space-y-1">
        <h4 class="text-sm font-semibold">Recent HMO Transactions</h4>
        <p class="text-xs opacity-70">Latest HMO billings recorded in the system.</p>
      </div>
      <div class="flex gap-2">
        <Button label="Create SOA" icon="pi pi-file" size="small" outlined @click="soaVisible = true" />
        <Button label="Refresh" icon="pi pi-refresh" size="small" text outlined :loading="loading" @click="load" />
      </div>
    </div>

    <Message v-if="error" severity="warn" :closable="false" size="small">
      {{ error }}
    </Message>

    <DataTable
      :value="items"
      dataKey="id"
      :loading="loading"
      paginator
      :rows="8"
      class="rounded-lg border border-[rgb(var(--app-border))]"
    >
      <template #empty>
        <p class="m-0 text-sm opacity-70">No HMO transactions found.</p>
      </template>

      <Column header="Date" style="width: 150px">
        <template #body="{ data }">
          <span class="text-sm">{{ formatDateTime(data.created_at) }}</span>
        </template>
      </Column>
      <Column field="patient_name" header="Patient" style="min-width: 200px" />
      <Column field="service_name" header="Service" style="min-width: 200px" />
      <Column field="billing_status" header="Status" style="width: 140px">
        <template #body="{ data }">
          <Tag :value="data.billing_status ?? '—'" :severity="statusSeverity(data.billing_status)" />
        </template>
      </Column>
      <Column header="Total" style="width: 140px">
        <template #body="{ data }">
          <span class="font-medium">{{ asCurrency(data.total_amount) }}</span>
        </template>
      </Column>
      <Column header="Paid" style="width: 140px">
        <template #body="{ data }">
          <span class="opacity-80">{{ asCurrency(data.amount_paid) }}</span>
        </template>
      </Column>
      <Column field="receipt_number" header="Receipt" style="width: 160px" />
    </DataTable>

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
import { computed, onMounted, ref } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useRouter } from "vue-router"
import { billingPhase1Service, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import { getApiErrorMessage } from "@/utils/actionable-error.util"

const items = ref<HmoRecentHistoryItem[]>([])
const loading = ref(false)
const error = ref("")
const router = useRouter()

const soaVisible = ref(false)
const soaRange = ref<Date[] | null>(null)

const hasValidRange = computed(() => {
  const r = soaRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value: string | null): string => {
  if (!value) return "—"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return "—"
  return dt.toLocaleString("en-PH", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

const statusSeverity = (value: string | null): "success" | "danger" | "warning" | "secondary" => {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (!normalized) return "secondary"
  if (normalized.includes("paid") || normalized.includes("complete")) return "success"
  if (normalized.includes("cancel") || normalized.includes("void") || normalized.includes("inactive")) return "danger"
  if (normalized.includes("pending") || normalized.includes("unpaid")) return "warning"
  return "secondary"
}

const load = async (): Promise<void> => {
  loading.value = true
  error.value = ""
  try {
    items.value = await billingPhase1Service.getHmoRecentHistory(50) ?? []
  } catch (err: unknown) {
    items.value = []
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to load HMO transactions" })
  } finally {
    loading.value = false
  }
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
  const url = router.resolve({
    name: "soa-print",
    params: { payer: "hmo" },
    query: { from: formatYmd(from), to: formatYmd(to) }
  }).href
  window.open(url, "_blank", "noopener,noreferrer")
  soaVisible.value = false
}

onMounted(() => {
  void load()
})
</script>
