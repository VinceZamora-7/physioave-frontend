<template>
  <main class="min-h-screen bg-white text-black">
    <section class="mx-auto max-w-[1100px] px-6 py-6 space-y-4 print:px-0 print:py-0">
      <header class="space-y-2 border-b border-black pb-3">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold tracking-tight">PHYSIOAVE</h1>
            <p class="text-xs uppercase tracking-[0.22em]">Statement Of Account</p>
          </div>
          <div class="flex gap-2 print:hidden">
            <Button label="Print" icon="pi pi-print" @click="printPage" />
            <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <div class="font-semibold">Partner Institution</div>
            <div>{{ partnerLabel }}</div>
          </div>
          <div>
            <div class="font-semibold">Billing Date</div>
            <div>{{ todayLabel }}</div>
          </div>
          <div>
            <div class="font-semibold">Transaction Period</div>
            <div>{{ periodLabel }}</div>
          </div>
        </div>
      </header>

      <section class="space-y-2">
        <div v-if="error" class="border border-black p-3 text-sm">
          {{ error }}
        </div>

        <div v-else class="overflow-x-auto border border-black">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-black">
                <th class="p-2 text-left border-r border-black w-[60px]">No.</th>
                <th class="p-2 text-left border-r border-black">Date</th>
                <th class="p-2 text-left border-r border-black">Patient</th>
                <th class="p-2 text-left border-r border-black">Service</th>
                <th class="p-2 text-left border-r border-black">Status</th>
                <th class="p-2 text-right border-r border-black w-[140px]">Total</th>
                <th class="p-2 text-right border-r border-black w-[140px]">Paid</th>
                <th class="p-2 text-left w-[160px]">Receipt</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in rows" :key="row.id" class="border-b border-black">
                <td class="p-2 border-r border-black">{{ idx + 1 }}</td>
                <td class="p-2 border-r border-black">{{ formatDate(row.created_at) }}</td>
                <td class="p-2 border-r border-black">{{ row.patient_name ?? '—' }}</td>
                <td class="p-2 border-r border-black">{{ row.service_name ?? '—' }}</td>
                <td class="p-2 border-r border-black">{{ row.billing_status ?? '—' }}</td>
                <td class="p-2 border-r border-black text-right">{{ asCurrency(row.total_amount) }}</td>
                <td class="p-2 border-r border-black text-right">{{ asCurrency(row.amount_paid) }}</td>
                <td class="p-2">{{ row.receipt_number ?? '—' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="p-2 border-t border-black font-semibold" colspan="5">Grand Total</td>
                <td class="p-2 border-t border-black text-right font-semibold">{{ asCurrency(grandTotal) }}</td>
                <td class="p-2 border-t border-black text-right font-semibold">{{ asCurrency(grandPaid) }}</td>
                <td class="p-2 border-t border-black" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import Button from "primevue/button"
import { billingPhase1Service, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import { lguBillingService, type LguDashboardHistoryItem } from "@/features/lgu-billing/api/lgu-billing.service"
import { getApiErrorMessage } from "@/utils/actionable-error.util"

type Payer = "hmo" | "lgu"

type SoaRow = {
  id: number
  created_at: string | null
  patient_name: string | null
  billing_status: string | null
  service_name: string | null
  receipt_number: string | null
  total_amount: number
  amount_paid: number
}

const route = useRoute()
const router = useRouter()

const payer = computed<Payer>(() => (String(route.params.payer ?? "").toLowerCase() as Payer))
const dateFrom = computed(() => String(route.query.from ?? "").trim())
const dateTo = computed(() => String(route.query.to ?? "").trim())
const programId = computed(() => {
  const raw = String(route.query.program_id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
})
const programName = computed(() => String(route.query.program_name ?? "").trim())

const rows = ref<SoaRow[]>([])
const error = ref("")

const todayLabel = new Date().toLocaleDateString("en-PH")

const partnerLabel = computed(() => {
  if (payer.value === "lgu") {
    return programName.value ? `LGU - ${programName.value}` : "LGU"
  }
  return "HMO"
})
const periodLabel = computed(() => `${dateFrom.value || "—"} to ${dateTo.value || "—"}`)

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDate = (value: string | null): string => {
  if (!value) return "—"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return "—"
  return dt.toLocaleDateString("en-PH")
}

const grandTotal = computed(() => rows.value.reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0))
const grandPaid = computed(() => rows.value.reduce((sum, r) => sum + Number(r.amount_paid ?? 0), 0))

const toDateRange = (): { from: string; to: string } => {
  const from = dateFrom.value
  const to = dateTo.value
  return { from, to }
}

const load = async (): Promise<void> => {
  error.value = ""
  rows.value = []
  const { from, to } = toDateRange()
  if (!from || !to) {
    error.value = "Date range is required."
    return
  }

  try {
    if (payer.value === "hmo") {
      const data = await billingPhase1Service.getHmoSoa({ from, to, limit: 5000 }) ?? []
      rows.value = (data as HmoRecentHistoryItem[]).map(item => ({
          id: item.id,
          created_at: item.created_at,
          patient_name: item.patient_name,
          billing_status: item.billing_status,
          service_name: item.service_name,
          receipt_number: item.receipt_number,
          total_amount: Number(item.total_amount ?? 0),
          amount_paid: Number(item.amount_paid ?? 0)
        }))
      return
    }

    // LGU: use dashboard history (already contains in/out ledger amounts)
    const lgu = await lguBillingService.getSoa({ from, to, limit: 5000, program_id: programId.value }) ?? []
    rows.value = (lgu as LguDashboardHistoryItem[]).map(item => ({
      id: Number(item.id),
      created_at: item.created_at ?? null,
      patient_name: item.patient_name ?? null,
      billing_status: item.billing_status ?? null,
      service_name: item.service_name ?? item.reference_label ?? null,
      receipt_number: item.receipt_number ?? null,
      total_amount: Number(item.amount_out ?? 0),
      amount_paid: Number(item.amount_in ?? 0)
    }))
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, { baseMessage: "Failed to load SOA records" })
  }
}

const printPage = (): void => window.print()
const goBack = (): void => router.back()

onMounted(() => {
  void load()
})
</script>

<style>
@media print {
  .print\\:hidden { display: none !important; }
}
</style>
