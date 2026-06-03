<template>
  <HmoInvoiceLayout
    title="invoice billing"
    :subtitle="`Static printable record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>BILLING DATE:</strong><span>{{ billingDateLabel }}</span>
      <strong>REFERENCE NO.:</strong><span>{{ referenceNoLabel }}</span>
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
                <span class="profile-value">{{ patientName || "—" }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">Address:</span>
                <span class="profile-value">{{ patientAddress }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">Age:</span>
                <span class="profile-value">{{ patientAge }}</span>
              </div>
            </div>

            <div class="profile-group">
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Physical Therapist:</span>
                <span class="profile-value">{{ physicalTherapist }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Doctor:</span>
                <span class="profile-value">{{ doctor }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Diagnosis:</span>
                <span class="profile-value">{{ diagnosis }}</span>
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
              <th class="w-[50px] text-center">No.</th>
              <th class="w-[80px] text-center">LOA Date Issued</th>
              <th class="w-[120px] text-center">PT SERVICE RENDERED</th>
              <th class="w-[30px] text-center">QTY</th>
              <th class="w-[60px] text-center">LAT</th>
              <th class="w-[50px] text-center">BODY AREA</th>
              <th class="w-[60px] text-center">UNIT PRICE</th>
              <th class="w-[60px] text-center">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td class="text-center">{{ row.itemNo }}</td>
              <td class="text-center">{{ row.treatmentDate }}</td>
              <td class="text-center">{{ row.serviceName }}</td>
              <td class="text-center">{{ row.quantity }}</td>
              <td class="text-center">{{ row.laterality }}</td>
              <td class="text-center">{{ row.bodyArea }}</td>
              <td class="text-center">{{ formatCurrency(row.unitPrice) }}</td>
              <td class="text-center">{{ formatCurrency(row.unitTotal) }}</td>
            </tr>
          </tbody>

          <tfoot>
            <tr class="tfoot-border-bottom">
              <td
                colspan="7"
                class="text-right font-bold"
                style="padding-top: 12px; border-top: 1px solid #e5e7eb; color: #B81212;"
              >
                Grand Total:
              </td>
              <td
                class="text-center font-bold"
                style="padding-top: 12px; border-top: 1px solid #e5e7eb; color: #B81212;"
              >
                {{ formatCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

<template #bottom>
  <div class="approval-wrap-hmo">
    <section class="payment-box">
      <span class="self-pay-bottom-text-header">HMO DETAILS</span>
      <div><span class="self-pay-bottom-text">Billing To:</span> HMO</div>
      <div><span class="self-pay-bottom-text">HMO Type:</span> {{ sponsorHmoType }}</div>
      <div><span class="self-pay-bottom-text">Company Name:</span> {{ sponsorCompanyName }}</div>
      <div><span class="self-pay-bottom-text">LOA Approval No.:</span> {{ sponsorApprovalNo }}</div>
    </section>

                    <section class="approval-card">
      <div class="approval-label">
        Approved by:
      </div>
      <div>
        &nbsp;
      </div>

      <div class="approval-name">
        RENALOU B. CORDOVA, PTRP, UK-PT
      </div>

      <div class="approval-title">
        Chief Operations Officer
      </div>

      <div class="approval-signed">
        <strong>Date Signed:</strong> {{ dateSigned }}
      </div>
    </section>
  </div>
</template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import {
  patientEvaluationVisitLogService,
  type PatientEvaluationVisitLogItem
} from "@/features/patients/api/patient-evaluation-visit-log.service"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
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
  hmo_approval_code?: string | null
  hmo_loa_number?: string | null
  hmo_loa_date?: string | null
  loa_date?: string | null
  receipt_number?: string | null
}

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useHmoInvoicePrintActions()

const rows = ref<BillingSummaryRow[]>([])
const error = ref("")
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingSummarySource | null>(null)
const evaluationVisitLogs = ref<PatientEvaluationVisitLogItem[]>([])

const patientId = computed(() => {
  const parsed = Number(String(route.query.patient_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const hmoId = computed(() => {
  const parsed = Number(String(route.query.hmo_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const billingId = computed(() => {
  const parsed = Number(String(route.query.billing_id ?? route.query.id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const patientName = computed(() =>
  String(route.query.patient_name ?? "Patient").trim() || "Patient"
)

const patientAddress = computed(() =>
  billingDetail.value?.patient_address?.trim() || "N/A"
)

const patientAge = computed(() =>
  billingDetail.value?.patient_age?.trim() || "N/A"
)

const sponsorRecord = computed(() => sponsorInfo.value)

const hmoLabel = computed(() =>
  sponsorRecord.value?.company_name?.trim() ||
  sponsorRecord.value?.hmo_name?.trim() ||
  String(route.query.hmo_name ?? "HMO").trim() ||
  "HMO"
)

const firstNonBlank = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

const sponsorHmoType = computed(() =>
  sponsorRecord.value?.hmo_type_name?.trim() || "N/A"
)

const sponsorCompanyName = computed(() =>
  sponsorRecord.value?.company_name?.trim() || hmoLabel.value
)

const dateSigned = computed(() =>
  new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const dateFrom = computed(() => String(route.query.from ?? "").trim())
const dateTo = computed(() => String(route.query.to ?? "").trim())

const billingDateLabel = computed(() =>
  formatDate(billingDetail.value?.created_at)
)

const getBillingRecordId = (
  billing?: Pick<BillingListItem, "id" | "public_id"> | null
): string =>
  billing ? firstNonBlank(billing.public_id, `BILLING-${billing.id}`) : "N/A"

const referenceNoLabel = computed(() =>
  getBillingRecordId(billingDetail.value)
)

const getLoaApprovalNo = (billing?: BillingSummarySource | null): string => {
  return firstNonBlank(
    billing?.hmo_approval_code,
    billing?.hmo_loa_number,
    sponsorRecord.value?.approval_code,
    billing?.receipt_number,
    getBillingRecordId(billing)
  ) || "N/A"
}

const sponsorApprovalNo = computed(() =>
  getLoaApprovalNo(billingDetail.value)
)

const grandTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + Number(row.unitTotal ?? 0), 0)
)

const getTicketPhysicalTherapist = (billing?: BillingListItem | null): string =>
  firstNonBlank(
    ...(billing?.encounter_tickets ?? []).flatMap(ticket => [
      ticket.billing_snapshot?.provider_name
    ])
  )

const physicalTherapist = computed(() =>
  firstNonBlank(
    billingDetail.value?.physical_therapist,
    getTicketPhysicalTherapist(billingDetail.value)
  ) || "N/A"
)

const doctor = computed(() =>
  billingDetail.value?.doctor?.trim() || "N/A"
)

const formatDiagnosis = (value?: string | null): string => {
  const diagnosis = String(value ?? "").trim()
  if (!diagnosis) return "N/A"

  const markerMatch = diagnosis.match(/^\(?\s*(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\s*\)?[\s,:-]*(.*)$/i)
  if (!markerMatch) return diagnosis

  const marker = markerMatch[1].toUpperCase()
  const laterality =
    marker === "L" || marker === "LEFT"
      ? "L"
      : marker === "R" || marker === "RIGHT"
        ? "R"
        : marker === "B" || marker === "BOTH" || marker === "BILATERAL"
          ? "B"
          : ""

  const name = markerMatch[2]?.trim() || diagnosis
  return laterality ? `${name} (${laterality})` : name
}

const latestEvaluationVisitLog = computed(() => {
  return [...evaluationVisitLogs.value].sort((left, right) => {
    const leftTime = new Date(`${left.visit_date}T00:00:00`).getTime()
    const rightTime = new Date(`${right.visit_date}T00:00:00`).getTime()

    if (leftTime !== rightTime) return rightTime - leftTime
    return Number(right.id) - Number(left.id)
  })[0] ?? null
})

const diagnosisSource = computed(() => {
  const billingDiagnosis = String(billingDetail.value?.diagnosis ?? "").trim()
  if (billingDiagnosis) return billingDiagnosis

  const visitDiagnosis = String(latestEvaluationVisitLog.value?.doctor_diagnosis ?? "").trim()
  const visitLaterality = String(latestEvaluationVisitLog.value?.doctor_diagnosis_laterality ?? "").trim()

  if (!visitDiagnosis) return ""

  return visitLaterality ? `(${visitLaterality}) ${visitDiagnosis}` : visitDiagnosis
})

const diagnosisParts = computed(() => {
  const value = String(diagnosisSource.value ?? "").trim()
  if (!value) return { laterality: "N/A", bodyArea: "N/A" }

  const markerMatch = value.match(/^\(?\s*(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\s*\)?[\s,:-]*(.*)$/i)
  if (markerMatch) {
    const marker = markerMatch[1].toUpperCase()
    const laterality =
      marker === "L" || marker === "LEFT"
        ? "Left"
        : marker === "R" || marker === "RIGHT"
          ? "Right"
          : "Both"

    return {
      laterality,
      bodyArea: markerMatch[2]?.trim() || "N/A"
    }
  }

  const wordMatch = value.match(/^(LEFT|RIGHT|BOTH|BILATERAL)\b[\s,;:-]*(.*)$/i)
  if (wordMatch) {
    const marker = wordMatch[1].toUpperCase()

    return {
      laterality: marker === "LEFT" ? "Left" : marker === "RIGHT" ? "Right" : "Both",
      bodyArea: wordMatch[2]?.trim() || "N/A"
    }
  }

  return { laterality: "N/A", bodyArea: value }
})

const normalizeBodyArea = (value?: string | null): string => {
  const text = String(value ?? "").trim()
  if (!text) return "N/A"

  const withoutParentheses = text
    .replace(/\s*\((?:L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\s*\)/gi, "")
    .trim()

  const suffixMatch = withoutParentheses.match(/^(.*?)[\s,:/-]*\b(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\b\s*$/i)
  if (suffixMatch) {
    const bodyArea = suffixMatch[1]?.trim()
    if (bodyArea) return bodyArea
  }

  const prefixMatch = withoutParentheses.match(/^\s*\b(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\b[\s,:/-]*(.*)$/i)
  if (prefixMatch) {
    const bodyArea = prefixMatch[2]?.trim()
    if (bodyArea) return bodyArea
  }

  return withoutParentheses || text
}

const diagnosis = computed(() => {
  const value = String(diagnosisSource.value ?? "").trim()
  if (!value) return "N/A"

  if (billingDetail.value?.diagnosis) {
    return formatDiagnosis(billingDetail.value.diagnosis)
  }

  const visitDiagnosis = String(latestEvaluationVisitLog.value?.doctor_diagnosis ?? "").trim()
  if (!visitDiagnosis) return "N/A"

  const laterality = String(latestEvaluationVisitLog.value?.doctor_diagnosis_laterality ?? "").trim()
  return laterality ? `${visitDiagnosis} (${laterality})` : visitDiagnosis
})

const formatCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  })

const formatDate = (value?: string | null): string => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const parseLineItems = (billing: BillingSummarySource): Array<Record<string, unknown>> => {
  try {
    const parsed = JSON.parse(billing.line_items_json || "[]") as unknown

    return Array.isArray(parsed)
      ? parsed.filter(item => item && typeof item === "object") as Array<Record<string, unknown>>
      : []
  } catch {
    return []
  }
}

const getLoaDate = (billing: BillingSummarySource): string =>
  firstNonBlank(
    billing.hmo_loa_date,
    billing.loa_date,
    sponsorInfo.value?.validity_start_date
  )

const enrichBillingItems = async (
  items: BillingListItem[]
): Promise<BillingSummarySource[]> => {
  const detailedItems = await Promise.all(items.map(async item => {
    try {
      const context = item.id > 0
        ? await billingContextTanstackService.fetchContext(queryClient, item.id)
        : undefined

      const detail = context?.billing

      return detail
        ? {
            ...item,
            ...detail
          }
        : item
    } catch {
      return item
    }
  }))

  return detailedItems as BillingSummarySource[]
}

const buildRows = (items: BillingSummarySource[]): BillingSummaryRow[] => {
  const output: BillingSummaryRow[] = []
  let itemNo = 1

  items.forEach(item => {
    const lineItems = parseLineItems(item)
    const referenceNo = getBillingRecordId(item)
    const billingStatus = formatHmoStatus(item.billing_status)

    if (!lineItems.length) {
      const unitPrice = Number(item.total_amount ?? 0)

      output.push({
        key: `${item.id}-${itemNo}`,
        itemNo,
        treatmentDate: formatDate(getLoaDate(item)),
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
      const laterality = String(
        lineItem.laterality ??
        lineItem.laterality_name ??
        diagnosisParts.value.laterality ??
        "N/A"
      )
      const bodyArea = normalizeBodyArea(
        String(lineItem.body_area ?? lineItem.bodyArea ?? diagnosisParts.value.bodyArea ?? "")
      )
      const serviceName = String(lineItem.name ?? item.service_name ?? "HMO Service")
      const baseUnitPrice = Number(lineItem.price ?? lineItem.unitPrice ?? lineItem.unit_price ?? 0)
      const unitPrice = baseUnitPrice
      const unitTotal = quantity * baseUnitPrice

      output.push({
        key: `${item.id}-${itemNo}-${lineIndex}`,
        itemNo,
        treatmentDate: formatDate(getLoaDate(item)),
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
  billingDetail.value = null

  if (!patientId.value && !billingId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    if (billingId.value) {
      const context = await billingContextTanstackService.fetchContext(queryClient, billingId.value)
      const detail = context?.billing ?? null

      if (!detail) {
        error.value = "Billing record was not found."
        return
      }

      billingDetail.value = detail

      const [patientContext, visitLogs] = await Promise.all([
        patientTanstackService.fetchContext(queryClient, Number(detail.patient_id)),
        patientEvaluationVisitLogService.getAll(Number(detail.patient_id))
      ])

      const sponsorRecords = patientContext?.sponsor_information ?? []

      sponsorInfo.value =
        sponsorRecords.find(record => record.sponsor_context === "HMO" && Number(record.hmo_id) === hmoId.value) ??
        sponsorRecords.find(record => record.sponsor_context === "HMO") ??
        sponsorRecords[0] ??
        null

      evaluationVisitLogs.value = visitLogs ?? []
      rows.value = buildRows([detail])
      return
    }

    const [result, patientContext, visitLogs] = await Promise.all([
      billingPhase1Service.getAll({
        patient_id: patientId.value,
        billing_type: "HMO_BILLING",
        from_date: dateFrom.value || new Date().toISOString().slice(0, 10),
        to_date: dateTo.value || new Date().toISOString().slice(0, 10),
        page: 1,
        size: 5000
      }),
      patientTanstackService.fetchContext(queryClient, patientId.value),
      patientEvaluationVisitLogService.getAll(patientId.value)
    ])

    const sponsorRecords = patientContext?.sponsor_information ?? []

    sponsorInfo.value =
      sponsorRecords.find(record => record.sponsor_context === "HMO" && Number(record.hmo_id) === hmoId.value) ??
      sponsorRecords.find(record => record.sponsor_context === "HMO") ??
      sponsorRecords[0] ??
      null

    evaluationVisitLogs.value = visitLogs ?? []

    const detailedItems = await enrichBillingItems((result?.content ?? []) as BillingListItem[])

    billingDetail.value =
      detailedItems.find(item => firstNonBlank(
        item.physical_therapist,
        getTicketPhysicalTherapist(item)
      )) ??
      detailedItems[0] ??
      null

    rows.value = buildRows(detailedItems)
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


<style scoped>
.table-wrap {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.summary-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.summary-table th,
.summary-table td {
  border: 1px solid #e5e7eb;
  padding: 3px 2px;
  font-size: 10px;
  line-height: 1.15;
  vertical-align: top;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.summary-table th {
  font-size: 9px;
  font-weight: 800;
  text-align: center;
}

/* Red separator between the table heading and body rows */
.summary-table thead th {
  border-bottom: 2px solid #b81212 !important;
}

.summary-table tbody tr:first-child td {
  border-top: 2px solid #b81212 !important;
}

.payment-box {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

@media print {
  .table-wrap {
    overflow: hidden !important;
  }

  .summary-table {
    width: 100% !important;
    table-layout: fixed !important;
    font-size: 6px;
  }

  .summary-table th,
  .summary-table td {
    padding: 2px 1px;
    line-height: 1.1;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
    font-size: 10px;
  }

  .summary-table th {
    font-size: 5px;
    font-weight: 800;
  }

  .summary-table thead th {
    border-bottom: 2px solid #b81212 !important;
  }

  .summary-table tbody tr:first-child td {
    border-top: 2px solid #b81212 !important;
  }

  .summary-table th:nth-child(1),
  .summary-table td:nth-child(1) {
    width: 5%;
  }

  .summary-table th:nth-child(2),
  .summary-table td:nth-child(2) {
    width: 12%;
  }

  .summary-table th:nth-child(3),
  .summary-table td:nth-child(3) {
    width: 25%;
  }

  .summary-table th:nth-child(4),
  .summary-table td:nth-child(4) {
    width: 5%;
  }

  .summary-table th:nth-child(5),
  .summary-table td:nth-child(5) {
    width: 10%;
  }

  .summary-table th:nth-child(6),
  .summary-table td:nth-child(6) {
    width: 13%;
  }

  .summary-table th:nth-child(7),
  .summary-table td:nth-child(7) {
    width: 15%;
  }

  .summary-table th:nth-child(8),
  .summary-table td:nth-child(8) {
    width: 15%;
  }

  .profile-card,
  .payment-box {
    font-size: 9px;
  }

  .profile-label,
  .profile-value {
    font-size: 9px;
  }

  .payment-box h3 {
    font-size: 10px;
    margin: 0 0 4px;
  }

  tr {
    page-break-inside: avoid;
  }

  .approval-wrap-hmo {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  font-size: 13px;
  color: #111827;
}

  .self-pay-bottom-text{
    font-weight: 700;
  }
    .self-pay-bottom-text-header{
      text-decoration: underline;
    font-weight: 700;
  }

  .tfoot-border-bottom{
              border-bottom : 2px solid #b81212 !important;

}
          tfoot, th {
            border-top: 2px solid #b81212 !important;
          }


}
  .approval-wrap-hmo {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  font-size: 13px;
  color: #111827;
}

      tfoot, th{
            border-top: 2px solid #b81212 !important;
          }
</style>
