<template>
  <HmoInvoiceLayout
    title="ATTENDANCE & TREATMENT RECORD"
    :subtitle="`Attendance & Treatment Record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Patient:</strong><span>{{ patientName }}</span>
      <strong>Patient ID:</strong><span>{{ patientIdLabel }}</span>
      <strong>HMO:</strong><span>{{ hmoLabel }}</span>
      <strong>Period:</strong><span>{{ periodLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="() => printPage()" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-else #details>
      <div class="profile-details">
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
                <span class="profile-label">Attended Sessions:</span>
                <span class="profile-value">{{ attendedRows.length }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Billing Records:</span>
                <span class="profile-value">{{ billingRows.length }}</span>
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
              <th class="w-[170px] text-center">ATTENDED AT</th>
              <th class="text-left">SERVICE NAME</th>
              <th class="w-[140px] text-center">REFERENCE NO.</th>
              <th class="w-[150px] text-center">ATTENDANCE STATUS</th>
              <th class="w-[150px] text-right">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in attendedRows" :key="row.key">
              <td class="text-center">{{ row.itemNo }}</td>
              <td class="text-center">{{ row.attendedAt }}</td>
              <td class="text-left">{{ row.serviceName }}</td>
              <td class="text-center">{{ row.referenceNo }}</td>
              <td class="text-center">{{ row.attendanceStatus }}</td>
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

      <div class="table-wrap" style="margin-top: 16px;">
        <table class="summary-table">
          <thead>
            <tr>
              <th class="w-[80px] text-center">ITEM No.</th>
              <th class="w-[170px] text-center">TREATMENT DATE</th>
              <th class="text-left">SERVICE NAME</th>
              <th class="w-[140px] text-center">REFERENCE NO.</th>
              <th class="w-[150px] text-center">BILLING STATUS</th>
              <th class="w-[150px] text-right">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in billingRows" :key="row.key">
              <td class="text-center">{{ row.itemNo }}</td>
              <td class="text-center">{{ row.treatmentDate }}</td>
              <td class="text-left">{{ row.serviceName }}</td>
              <td class="text-center">{{ row.referenceNo }}</td>
              <td class="text-center">{{ row.billingStatus }}</td>
              <td class="text-right">{{ row.totalAmount > 0 ? formatCurrency(row.totalAmount) : 'FREE' }}</td>
            </tr>
          </tbody>
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
import { billingPhase1Service, type BillingEncounterTicket, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import HmoInvoiceLayout from "./HmoInvoiceLayout.vue"
import { formatHmoStatus, useHmoInvoicePrintActions } from "./hmo-invoice.shared"

type AttendanceRow = {
  key: string
  itemNo: number
  attendedAt: string
  serviceName: string
  referenceNo: string
  attendanceStatus: string
  totalAmount: number
}

type BillingRow = {
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

const attendedRows = ref<AttendanceRow[]>([])
const billingRows = ref<BillingRow[]>([])
const error = ref("")
const loadedPatientName = ref("")

const patientId = computed(() => {
  const parsed = Number(String(route.query.patient_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const formatPrintableName = (value?: string | null, fallback = "Patient"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const patientName = computed(() =>
  formatPrintableName(loadedPatientName.value || String(route.query.patient_name ?? ""), "Patient")
)
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")
const hmoLabel = computed(() => formatPrintableName(String(route.query.hmo_name ?? ""), "HMO"))
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

const formatCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDate = (value?: string | null): string => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const getEncounterTickets = (billing: BillingListItem): BillingEncounterTicket[] =>
  (billing.encounter_tickets ?? []).filter(ticket => ticket.record_locked && ticket.attendance_status === "ATTENDED")

const buildAttendanceRows = (items: BillingListItem[]): AttendanceRow[] => {
  const rows = items.flatMap(billing =>
    getEncounterTickets(billing).map(ticket => ({
      key: `${billing.id}-${ticket.id}`,
      attendedAt: formatDate(ticket.attended_at),
      serviceName: billing.service_name || billing.package_name || "HMO Service",
      referenceNo: ticket.slip_number || billing.receipt_number || `BILLING-${billing.id}`,
      attendanceStatus: "Attended",
      totalAmount: Number(billing.total_amount ?? billing.amount_due ?? 0)
    }))
  )

  return rows
    .sort((left, right) => String(left.attendedAt).localeCompare(String(right.attendedAt)))
    .map((row, index) => ({ ...row, itemNo: index + 1 }))
}

const buildBillingRows = (items: BillingListItem[]): BillingRow[] =>
  items
    .slice()
    .sort((left, right) => String(left.created_at ?? "").localeCompare(String(right.created_at ?? "")))
    .map((billing, index) => ({
      key: String(billing.id),
      itemNo: index + 1,
      treatmentDate: formatDate(billing.created_at),
      serviceName: billing.service_name || billing.package_name || "HMO Service",
      referenceNo: billing.receipt_number || `BILLING-${billing.id}`,
      billingStatus: formatHmoStatus(billing.billing_status),
      totalAmount: Number(billing.total_amount ?? billing.amount_due ?? 0)
    }))

const grandTotal = computed(() => billingRows.value.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0))

const load = async (): Promise<void> => {
  error.value = ""
  attendedRows.value = []
  billingRows.value = []
  loadedPatientName.value = ""

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const data = await billingPhase1Service.getAll({
      patient_id: patientId.value,
      billing_type: "HMO_BILLING",
      from_date: dateFrom.value || new Date().toISOString().slice(0, 10),
      to_date: dateTo.value || new Date().toISOString().slice(0, 10),
      page: 1,
      size: 1000
    })

    const billings = data?.content ?? []
    loadedPatientName.value = String(billings[0]?.patient_name ?? "").trim()
    billingRows.value = buildBillingRows(billings)
    attendedRows.value = buildAttendanceRows(billings)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load HMO attendance and treatment record"
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
