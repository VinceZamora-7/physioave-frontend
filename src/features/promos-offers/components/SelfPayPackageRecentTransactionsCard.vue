<template>
  <section class="space-y-4">
    <article class="app-section-card-comfy">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-fg))]/50">Self Pay Dashboard</p>
          <h3 class="m-0 text-lg font-bold text-[rgb(var(--app-fg))]">Recent Package Service Transactions</h3>
          <p class="m-0 text-sm leading-6 text-[rgb(var(--app-fg))]/60">A quick view of the latest self pay package billings and their payment status.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button label="Refresh" icon="pi pi-refresh" outlined size="small" :loading="loading" @click="loadDashboard" />
        </div>
      </div>

      <Message v-if="error" severity="warn" :closable="false" size="small" class="mt-4">{{ error }}</Message>

      <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Recent Transactions</div>
          <div class="mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ transactions.length }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Recent Total</div>
          <div class="mt-2 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ asCurrency(totalAmount) }}</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Collected</div>
          <div class="mt-2 text-2xl font-bold text-emerald-700">{{ asCurrency(totalPaid) }}</div>
        </div>
      </div>

      <div class="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--app-border))]">
        <DataTable :value="transactions" :loading="loading" size="small" dataKey="id" @row-click="onRowClick">
          <template #empty>
            <div class="px-4 py-10 text-center text-sm text-[rgb(var(--app-fg))]/60">No recent self pay package transactions yet.</div>
          </template>

          <Column header="Created" style="width: 170px">
            <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
          </Column>

          <Column header="Patient / Package" style="min-width: 260px">
            <template #body="{ data }">
              <div class="space-y-1">
                <div class="font-semibold uppercase">{{ data.patient_name || 'No patient linked' }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.package_name || data.service_name || 'Package Service' }}</div>
                <div class="text-xs text-[rgb(var(--app-fg))]/60">{{ data.receipt_number ? `Receipt ${data.receipt_number}` : `Billing #${data.id}` }}</div>
              </div>
            </template>
          </Column>

          <Column header="Status" style="width: 140px">
            <template #body="{ data }">
              <Tag :value="data.billing_status || 'PENDING'" :severity="statusSeverity(data.billing_status)" class="text-xs" />
            </template>
          </Column>

          <Column header="Total" style="width: 140px">
            <template #body="{ data }">
              <div class="text-right font-semibold">{{ asCurrency(Number(data.total_amount ?? 0)) }}</div>
            </template>
          </Column>

          <Column header="Outstanding" style="width: 150px">
            <template #body="{ data }">
              <div class="text-right">{{ asCurrency(Math.max(0, Number(data.total_amount ?? 0) - Number(data.amount_paid ?? 0))) }}</div>
            </template>
          </Column>

          <Column header="Action" style="width: 140px">
            <template #body="{ data }">
              <Button label="Open" icon="pi pi-arrow-right" text size="small" @click.stop="openBilling(data.id)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { getApiErrorMessage } from "@/utils/actionable-error.util"

const loading = ref(false)
const error = ref("")
const transactions = ref<BillingListItem[]>([])
const router = useRouter()

const totalAmount = computed(() =>
  transactions.value.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0)
)

const totalPaid = computed(() =>
  transactions.value.reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0)
)

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string | null): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

const statusSeverity = (status?: string | null): "success" | "warn" | "danger" | "contrast" | "secondary" => {
  const normalized = String(status ?? "").trim().toUpperCase()
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  if (normalized === "BILLED") return "contrast"
  return "secondary"
}

const openBilling = async (billingId?: number): Promise<void> => {
  const normalizedId = Number(billingId ?? 0)
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) return

  await router.push({
    name: "billing",
    query: {
      billing_type: "SELF_PAY_PACKAGE",
      billingId: String(normalizedId),
      openMode: "detail"
    }
  })
}

const onRowClick = async (event: { data?: BillingListItem }): Promise<void> => {
  await openBilling(event.data?.id)
}

const loadDashboard = async (): Promise<void> => {
  loading.value = true
  error.value = ""
  try {
    const response = await billingPhase1Service.getAll({
      page: 1,
      size: 8,
      billing_type: "SELF_PAY_PACKAGE"
    })
    transactions.value = response?.content ?? []
  } catch (err: unknown) {
    transactions.value = []
    error.value = getApiErrorMessage(err, {
      baseMessage: "Failed to load recent self pay package transactions",
      permissionHint: "Billing access in Role Access",
      retryHint: "Please try again."
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadDashboard()
})
</script>
