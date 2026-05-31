<template>
  <LguInvoiceLayout
    title="PATIENT BILLING SUMMARY"
    :subtitle="`BILLING SUMMARY record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Patient:</strong><span>{{ patientName }}</span>
      <strong>Patient ID:</strong><span>{{ patientIdLabel }}</span>
      <strong>LGU Program:</strong><span>{{ lguProgramLabel }}</span>
      <strong>Validity:</strong><span>{{ validityLabel }}</span>
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
                <span class="profile-value">{{ physicalTherapistName }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Doctor:</span>
                <span class="profile-value">{{ doctorName }}</span>
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
              <th class="w-[80px] text-center">ITEM No.</th>
              <th class="w-[120px] text-right">TREATMENT DATE</th>
              <th class="w-[180px] text-left">PT SERVICE RENDERED</th>
              <th class="w-[150px] text-center">SESSION SEQUENCE</th>
              <th class="w-[150px] text-right">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in invoiceRows"
              :key="row.key"
              :data-level="row.level ?? 0"
              :class="row.isParent ? 'font-semibold bg-slate-50' : ''"
            >
              <td class="text-center">
                {{ row.isParent ? '' : row.itemNo }}
              </td>

              <td class="text-right">
                {{ row.isParent ? '' : row.treatmentDate ? formatDate(row.treatmentDate) : '—' }}
              </td>

              <td :class="['text-left', row.level ? 'pl-5' : '']">
                {{ row.serviceName }}
              </td>

              <td class="text-center">
                {{ row.isParent ? '' : row.sessionSequence || '—' }}
              </td>

              <td class="text-right">
                {{
                  row.isParent || row.unitTotal === null
                    ? ''
                    : row.unitTotal > 0
                      ? formatCurrency(row.unitTotal)
                      : 'FREE'
                }}
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="4" class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                Grand Total:
              </td>
              <td class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                {{ formatCurrency(billing.grand_total ?? billing.total_amount ?? 0) }}
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
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          font-size: 13px;
          color: #111827;
        "
      >
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
  </LguInvoiceLayout>
</template>


<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  formatLguPatientProgramStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import { patientHMOInformationService } from "@/services/patient-hmo-information.service"
import type { PatientHMOInformation } from "@/models/hmo-information"


const dateSigned = computed(() => formatDate(new Date().toISOString()))
const route = useRoute()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const error = ref("")

const patientId = computed(() => {
  const raw = String(route.query.patient_id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const patientName = computed(() => detail.value?.patient_name || "Patient")
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")
const lguSponsor = computed(() => sponsorInfo.value)
const lguProgramLabel = computed(() => lguSponsor.value?.lgu_program_name || lguSponsor.value?.company_name || "LGU")
const patientAddress = computed(() => billingDetail.value?.patient_address || "N/A")
const patientAge = computed(() => billingDetail.value?.patient_age || "N/A")
const physicalTherapistName = computed(() => billingDetail.value?.physical_therapist || "N/A")
const doctorName = computed(() => billingDetail.value?.doctor || "N/A")
const diagnosis = computed(() => billingDetail.value?.diagnosis || "N/A")
const billingTo = computed(() => billingDetail.value?.lgu_program_name || lguSponsor.value?.company_name || lguProgramLabel.value)
const patientProgramStatus = computed(() =>
  formatLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )
)
const referralFormNo = computed(() => billingDetail.value?.lgu_reference_label || lguSponsor.value?.referral_form_no || "N/A")
const dateIssued = computed(() => formatDateTime(billingDetail.value?.lgu_date_issued || lguSponsor.value?.referral_issued_date))
const validityLabel = computed(() => {
  const start = formatDate(lguSponsor.value?.validity_start_date)
  const end = formatDate(lguSponsor.value?.validity_end_date)
  if (start === "N/A" && end === "N/A") return "N/A"
  return `${start} to ${end}`
})

const billing = computed(() => {
  const billings = detail.value?.billings ?? []
  const grandTotal = billings.reduce((sum, item) => sum + Number(item.amount_due ?? 0), 0)

  return {
    grand_total: grandTotal,
    total_amount: grandTotal
  }
})

type InvoiceLineNode = {
  id?: number | string
  type?: string
  name?: string
  quantity?: number
  price?: number
  unitPrice?: number
  lineTotal?: number
  treatmentDate?: string
  sessionSequence?: string
  subItems?: InvoiceLineNode[]
  children?: InvoiceLineNode[]
}

type TableRow = {
  key: string
  itemNo: number
  treatmentDate: string
  serviceName: string
  sessionSequence: string
  unitTotal: number | null
  level?: number
  isParent?: boolean
}

const parseInvoiceLineItems = (value?: string | null): InvoiceLineNode[] => {
  if (!value?.trim()) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? (parsed.filter(item => item && typeof item === "object") as InvoiceLineNode[])
      : []
  } catch {
    return []
  }
}

const getDirectChildren = (item: InvoiceLineNode): InvoiceLineNode[] => [
  ...(item.subItems ?? []),
  ...(item.children ?? [])
]

const getQuantity = (item: InvoiceLineNode): number => {
  const quantity = Math.floor(Number(item.quantity ?? 1))
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

const getTreatmentDate = (
  item: InvoiceLineNode,
  fallback: { treatmentDate?: string } = {}
): string =>
  item.treatmentDate ||
  fallback.treatmentDate ||
  billingDetail.value?.created_at ||
  ""

const getSessionUnitTotal = (item: InvoiceLineNode, quantity: number): number => {
  const lineTotal = Number(item.lineTotal)

  if (item.lineTotal !== undefined && item.lineTotal !== null && Number.isFinite(lineTotal)) {
    return lineTotal / quantity
  }

  const unitTotal = Number(item.unitPrice ?? item.price ?? 0)
  return Number.isFinite(unitTotal) ? unitTotal : 0
}

const flattenInvoiceLineItems = (
  items: InvoiceLineNode[],
  inherited: { treatmentDate?: string; sessionSequence?: string } = {},
  rows: TableRow[] = [],
  nextItemNoRef: { value: number } = { value: 1 }
): TableRow[] => {
  items.forEach(parent => {
    const parentNo = 0
    const parentTreatmentDate = getTreatmentDate(parent, inherited)
    const parentName = String(parent.name ?? "").trim() || "—"

    rows.push({
      key: `${parentNo}-${String(parent.id ?? parent.name ?? "parent")}`,
      itemNo: parentNo,
      treatmentDate: "",
      serviceName: parentName,
      sessionSequence: "",
      unitTotal: null,
      level: 0,
      isParent: true
    })

    getDirectChildren(parent).forEach(child => {
      const quantity = getQuantity(child)
      const childName = String(child.name ?? "").trim() || "—"
      const childTreatmentDate = getTreatmentDate(child, {
        treatmentDate: parentTreatmentDate
      })
      const unitTotal = getSessionUnitTotal(child, quantity)

      Array.from({ length: quantity }).forEach((_, sessionIndex) => {
        const childNo = nextItemNoRef.value++

        rows.push({
          key: `${childNo}-${String(child.id ?? child.name ?? "child")}-${sessionIndex + 1}`,
          itemNo: childNo,
          treatmentDate: childTreatmentDate,
          serviceName: childName,
          sessionSequence: `${sessionIndex + 1} / ${quantity}`,
          unitTotal,
          level: 1,
          isParent: false
        })
      })
    })
  })

  return rows
}
const invoiceRows = computed<TableRow[]>(() => {
  const lineItems = parseInvoiceLineItems(billingDetail.value?.line_items_json)
  if (lineItems.length) {
    return flattenInvoiceLineItems(lineItems)
  }

  return (detail.value?.package_availments ?? []).map((pkg, index) => ({
    key: String(pkg.authorization_id),
      itemNo: index + 1,
    treatmentDate: billingDetail.value?.created_at || "",
    serviceName: pkg.package_name || "—",
    sessionSequence: `${pkg.used_count} / ${pkg.availed_count}`,
    unitTotal: 0
  }))
})

const formatCurrency = (value?: number | null): string =>
  value === null || value === undefined
    ? ""
    : Number(value).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-PH")
}

const formatDate = (value?: string | null): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-PH")
}

const load = async (): Promise<void> => {
  error.value = ""
  detail.value = null
  sponsorInfo.value = null
  billingDetail.value = null

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const [detailResult, sponsorResult] = await Promise.all([
      lguBillingService.getPatientCreditDetail(patientId.value),
      patientHMOInformationService.getByPatientId(patientId.value)
    ])
    detail.value = detailResult ?? null
    sponsorInfo.value = (sponsorResult ?? []).find(item => item.sponsor_context === "LGU") ?? null

    const latestBilling = detail.value?.billings?.[0]
    if (latestBilling?.id) {
      billingDetail.value = await billingPhase1Service.getById(latestBilling.id) ?? null
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load patient LGU profile."
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => window.print(), 50)
    }
  })
})
</script>

<style>
.line {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px;
}

.profile-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  color: #111827;
}

.profile-status-banner {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 13px;
}

.profile-status-label {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #475569;
}

.profile-status-value {
  font-weight: 800;
  color: #111827;
  text-transform: uppercase;
}

.profile-card {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.profile-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.profile-row--wide-label {
  grid-template-columns: 150px minmax(0, 1fr);
}

.profile-row--list {
  grid-template-columns: 150px minmax(0, 1fr);
  margin-bottom: 8px;
}

.profile-label {
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.profile-value {
  color: #111827;
  word-break: break-word;
}

.profile-section-title {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1f2937;
}

.profile-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.summary-table th,
.summary-table td {
  padding: 9px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 12px;
}

.summary-table thead th {
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}


.table-wrap {
  overflow-x: auto;
}

.ticket-footer-wrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.footnote-full {
  grid-column: 1 / -1;
}

.footnote-panel {
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: #fff;
  padding: 12px;
}

.ticket-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #1d4ed8;
  margin-bottom: 4px;
}

.footnote-copy {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
}
</style>
