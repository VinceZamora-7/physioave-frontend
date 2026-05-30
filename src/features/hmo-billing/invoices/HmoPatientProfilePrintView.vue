<template>
  <HmoInvoiceLayout
    title="PATIENT HMO PROFILE"
    :subtitle="`PATIENT HMO Profile for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>BILLING DATE:</strong><span>{{ billingDateLabel }}</span>
      <strong>TRANSACTION PERIOD:</strong><span>{{ periodLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-if="!error" #details>
      <div class="profile-details">
        <div class="profile-status-banner">
          <span class="profile-status-label">STATUS:</span>
          <span class="profile-status-value">{{ profileStatusHeading }}</span>
        </div>

        <div class="profile-card">
          <div class="profile-grid">
            <div class="profile-group">
              <div class="profile-row">
                <span class="profile-label">Patient Name:</span>
                <span class="profile-value">{{ patientName || '—' }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">Patient ID:</span>
                <span class="profile-value">{{ patientIdLabel }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">HMO:</span>
                <span class="profile-value">{{ hmoLabel }}</span>
              </div>
            </div>

            <div class="profile-group">
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Latest Billing Status:</span>
                <span class="profile-value">{{ billingStatus }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Billing Rows:</span>
                <span class="profile-value">{{ rows.length }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Grand Total:</span>
                <span class="profile-value">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-card">
          <div class="profile-section-title">HMO Details</div>

          <div class="profile-list">
            <div class="profile-row profile-row--list">
              <span class="profile-label">Billing To:</span>
              <span class="profile-value">{{ hmoLabel }}</span>
            </div>

            <div class="profile-row profile-row--list">
              <span class="profile-label">Program Status:</span>
              <span class="profile-value">{{ billingStatus }}</span>
            </div>

            <div class="profile-row profile-row--list">
              <span class="profile-label">Transaction Period:</span>
              <span class="profile-value">{{ periodLabel }}</span>
            </div>

            <div class="profile-row profile-row--list">
              <span class="profile-label">Date Issued:</span>
              <span class="profile-value">{{ billingDateLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="summary-table">
          <thead>
            <tr>
              <th class="w-[80px] text-center">ITEM No.</th>
              <th class="w-[120px] text-center">TREATMENT DATE</th>
              <th class="text-left">SERVICE NAME</th>
              <th class="w-[140px] text-center">REFERENCE NO.</th>
              <th class="w-[140px] text-center">BILLING STATUS</th>
              <th class="w-[150px] text-right">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td class="text-center">{{ row.itemNo }}</td>
              <td class="text-center">{{ row.treatmentDate }}</td>
              <td class="text-left">{{ row.serviceName }}</td>
              <td class="text-center">{{ row.referenceNo }}</td>
              <td class="text-center">{{ row.billingStatus }}</td>
              <td class="text-right">{{ row.totalAmount > 0 ? formatCurrency(row.totalAmount) : 'FREE' }}</td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="5" class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                Grand Total:
              </td>
              <td class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                {{ formatCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class="payment-box">
        <h3>HMO DETAILS</h3>
        <div><strong>Patient:</strong> {{ patientName }}</div>
        <div><strong>Patient ID:</strong> {{ patientIdLabel }}</div>
        <div><strong>HMO:</strong> {{ hmoLabel }}</div>
      </div>
    </template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import { billingPhase1Service, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import HmoInvoiceLayout from "./HmoInvoiceLayout.vue"
import { formatHmoStatus, useHmoInvoicePrintActions } from "./hmo-invoice.shared"

type ProfileRow = {
  key: string
  itemNo: number
  treatmentDate: string
  serviceName: string
  referenceNo: string
  billingStatus: string
  totalAmount: number
}

const route = useRoute()
const { printPage, goBack } = useHmoInvoicePrintActions()

const rows = ref<ProfileRow[]>([])
const error = ref("")

const patientId = computed(() => {
  const parsed = Number(String(route.query.patient_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const patientName = computed(() => String(route.query.patient_name ?? "Patient").trim() || "Patient")
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")
const hmoLabel = computed(() => String(route.query.hmo_name ?? "HMO").trim() || "HMO")
const dateFrom = computed(() => String(route.query.from ?? "").trim())
const dateTo = computed(() => String(route.query.to ?? "").trim())
const billingDateLabel = computed(() => {
  const source = dateTo.value || dateFrom.value
  if (!source) return new Date().toLocaleDateString("en-PH")
  const parsed = new Date(source)
  return Number.isNaN(parsed.getTime()) ? new Date().toLocaleDateString("en-PH") : parsed.toLocaleDateString("en-PH")
})
const periodLabel = computed(() => {
  if (!dateFrom.value && !dateTo.value) return "-"
  if (dateFrom.value && dateTo.value) return `${dateFrom.value} to ${dateTo.value}`
  return dateFrom.value || dateTo.value || "-"
})

const billingStatus = computed(() => rows.value[0]?.billingStatus || "N/A")
const profileStatusHeading = computed(() => billingStatus.value)
const grandTotal = computed(() => rows.value.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0))

const formatCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDate = (value?: string | null): string => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const buildRows = (items: HmoRecentHistoryItem[]): ProfileRow[] =>
  items.map((item, index) => ({
    key: `${item.id}-${index}`,
    itemNo: index + 1,
    treatmentDate: formatDate(item.created_at),
    serviceName: item.service_name || "HMO Service",
    referenceNo: item.receipt_number || `BILLING-${item.id}`,
    billingStatus: formatHmoStatus(item.billing_status),
    totalAmount: Number(item.total_amount ?? 0)
  }))

const load = async (): Promise<void> => {
  error.value = ""
  rows.value = []

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const data = await billingPhase1Service.getHmoSoa({
      from: dateFrom.value || new Date().toISOString().slice(0, 10),
      to: dateTo.value || new Date().toISOString().slice(0, 10),
      limit: 5000,
      ...(route.query.hmo_id ? { hmo_id: Number(route.query.hmo_id) } : {})
    }) ?? []

    rows.value = buildRows(data.filter(row => Number(row.patient_id) === patientId.value))
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load HMO patient profile"
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => printPage(), 50)
    }
  })
})
</script>
