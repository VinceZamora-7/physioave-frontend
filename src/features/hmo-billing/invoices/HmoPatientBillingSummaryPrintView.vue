<template>
  <HmoInvoiceLayout
    title="PATIENT BILLING SUMMARY"
    :subtitle="`Static printable record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Patient:</strong><span>{{ patientName }}</span>
      <strong>Patient ID:</strong><span>{{ patientIdLabel }}</span>
      <strong>HMO:</strong><span>{{ hmoLabel }}</span>
      <strong>Period:</strong><span>{{ periodLabel }}</span>
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
                <span class="profile-label">Billing Status:</span>
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
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="summary-table">
          <thead>
            <tr>
              <th class="w-[80px] text-center">ITEM No.</th>
              <th class="w-[120px] text-center">LOA Date Issued</th>
              <th class="w-[120px] text-left">PT SERVICE RENDERED</th>
              <th class="w-[140px] text-center">QTY.</th>
              <th class="w-[140px] text-center">LATERALITY</th>
              <th class="w-[150px] text-right">BODY AREA</th>
               <th class="w-[150px] text-right">UNIT PRICE</th>
               <th class="w-[150px] text-right">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td class="text-center">{{ row.itemNo }}</td>
              <td class="text-center">{{ row.treatmentDate }}</td>
              <td class="text-left">{{ row.serviceName }}</td>
              <td class="text-center">{{ row.quantity }}</td>
              <td class="text-center">{{ row.laterality }}</td>
              <td class="text-right">{{ row.bodyArea }}</td>
              <td class="text-right">{{ formatCurrency(row.unitPrice) }}</td>
              <td class="text-right">{{ formatCurrency(row.unitTotal) }}</td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="7" class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
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
      <div
        style="
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          font-size: 13px;
          color: #111827;
        "
      >
            <div class="payment-box">
        <h3>HMO DETAILS</h3>
        <div><strong>Billing To:</strong> HMO</div>
        <div><strong>HMO Type:</strong> {{ sponsorHmoType }}</div>
        <div><strong>Company Name:</strong> {{ sponsorCompanyName }}</div>
        <div><strong>LOA Approval No.:</strong> {{ sponsorApprovalNo }}</div>

      </div>
        <div
          style="
            padding: 14px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 320px;
          "
        >
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #374151;">
            Approved by:
          </div>

          <div style="font-weight: 700; color: #111827;">
            RENALOU B. CORDOVA, PTRP, UK-PT
          </div>

          <div style="width: 260px; margin-bottom: 1px; border-bottom: 1px solid #111827;"></div>

          <div style="margin-bottom: 2px; color: #4b5563;">
            Chief Operations Officer
          </div>

          <div style="margin-bottom: 18px; font-size: 12px; font-weight: 600; color: #374151;">
            Date Signed: {{ dateSigned }}
          </div>
        </div>
      </div>
    </template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { patientHMOInformationService } from "@/services/patient-hmo-information.service"
import type { PatientHMOInformation } from "@/models/hmo-information"
import HmoInvoiceLayout from "./HmoInvoiceLayout.vue"
import { formatHmoStatus, useHmoInvoicePrintActions } from "./hmo-invoice.shared"

type BillingSummaryRow = {
  key: string
  itemNo: number
  treatmentDate: string
  serviceName: string
  quantity: number
  laterality: string
  bodyArea: string
  unitPrice: number
  unitTotal: number
  referenceNo: string
  billingStatus: string
  totalAmount: number
}

type BillingSummarySource = BillingListItem & {
  line_items_json?: string
}

const route = useRoute()
const { printPage, goBack } = useHmoInvoicePrintActions()

const rows = ref<BillingSummaryRow[]>([])
const error = ref("")
const sponsorInfo = ref<PatientHMOInformation | null>(null)

const patientId = computed(() => {
  const parsed = Number(String(route.query.patient_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const patientName = computed(() => String(route.query.patient_name ?? "Patient").trim() || "Patient")
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")
const sponsorRecord = computed(() => sponsorInfo.value)
const hmoLabel = computed(() =>
  sponsorRecord.value?.company_name?.trim() ||
  sponsorRecord.value?.hmo_name?.trim() ||
  String(route.query.hmo_name ?? "HMO").trim() ||
  "HMO"
)
const sponsorBillingTo = computed(() => sponsorRecord.value?.company_name?.trim() || hmoLabel.value)
const sponsorHmoType = computed(() => sponsorRecord.value?.hmo_type_name?.trim() || "N/A")
const sponsorCompanyName = computed(() => sponsorRecord.value?.company_name?.trim() || hmoLabel.value)
const sponsorApprovalNo = computed(() => sponsorRecord.value?.approval_code?.trim() || "N/A")
const dateFrom = computed(() => String(route.query.from ?? "").trim())
const dateTo = computed(() => String(route.query.to ?? "").trim())
const periodLabel = computed(() => {
  if (!dateFrom.value && !dateTo.value) return "-"
  if (dateFrom.value && dateTo.value) return `${dateFrom.value} to ${dateTo.value}`
  return dateFrom.value || dateTo.value || "-"
})

const billingStatus = computed(() => rows.value[0]?.billingStatus || "N/A")
const grandTotal = computed(() => rows.value.reduce((sum, row) => sum + Number(row.unitTotal ?? 0), 0))

const formatCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDate = (value?: string | null): string => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const parseLineItems = (billing: BillingSummarySource): Array<Record<string, unknown>> => {
  try {
    const parsed = JSON.parse(billing.line_items_json || "[]") as unknown
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === "object") as Array<Record<string, unknown>> : []
  } catch {
    return []
  }
}

const buildRows = (items: BillingSummarySource[]): BillingSummaryRow[] => {
  const output: BillingSummaryRow[] = []
  let itemNo = 1

  items.forEach(item => {
    const lineItems = parseLineItems(item)
    const referenceNo = item.receipt_number || `BILLING-${item.id}`
    const billingStatus = formatHmoStatus(item.billing_status)

    if (!lineItems.length) {
      const unitPrice = Number(item.total_amount ?? 0)
      output.push({
        key: `${item.id}-${itemNo}`,
        itemNo,
        treatmentDate: formatDate(item.created_at),
        serviceName: item.service_name || "HMO Service",
        quantity: 1,
        laterality: "N/A",
        bodyArea: "N/A",
        unitPrice,
        unitTotal: unitPrice,
        referenceNo,
        billingStatus,
        totalAmount: unitPrice
      })
      itemNo += 1
      return
    }

    lineItems.forEach((lineItem, lineIndex) => {
      const quantity = Math.max(1, Number(lineItem.quantity ?? 1))
      const laterality = String(lineItem.laterality ?? lineItem.laterality_name ?? "N/A")
      const bodyArea = String(lineItem.body_area ?? lineItem.bodyArea ?? "N/A")
      const serviceName = String(lineItem.name ?? item.service_name ?? "HMO Service")
      const baseUnitPrice = Number(lineItem.price ?? lineItem.unitPrice ?? lineItem.unit_price ?? 0)
      const unitPrice = baseUnitPrice
      const unitTotal = quantity * baseUnitPrice

      output.push({
        key: `${item.id}-${itemNo}-${lineIndex}`,
        itemNo,
        treatmentDate: formatDate(item.created_at),
        serviceName,
        quantity,
        laterality,
        bodyArea,
        unitPrice,
        unitTotal,
        referenceNo,
        billingStatus,
        totalAmount: unitTotal
      })
      itemNo += 1
    })
  })

  return output
}

const load = async (): Promise<void> => {
  error.value = ""
  rows.value = []
  sponsorInfo.value = null

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const [result, sponsorRecords] = await Promise.all([
      billingPhase1Service.getAll({
        patient_id: patientId.value,
        billing_type: "HMO_BILLING",
        from_date: dateFrom.value || new Date().toISOString().slice(0, 10),
        to_date: dateTo.value || new Date().toISOString().slice(0, 10),
        page: 1,
        size: 5000
      }),
      patientHMOInformationService.getByPatientId(patientId.value)
    ])

    sponsorInfo.value = sponsorRecords.find(record => record.sponsor_context === "HMO") ?? sponsorRecords[0] ?? null
    rows.value = buildRows((result?.content ?? []) as BillingSummarySource[])
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load HMO billing summary"
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
