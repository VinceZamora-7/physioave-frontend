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

              <div class="profile-row">
                <span class="profile-label">Program Status:</span>
                <span class="profile-value">{{ patientProgramStatus }}</span>
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
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import type { BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  formatLguPatientProgramStatus,
  isLguDropoutStatus,
  resolveLguPatientProgramStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import type { PatientHMOInformation } from "@/models/hmo-information"

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const error = ref("")

const NOT_AVAILABLE_LABEL = "N/A"

const dateSigned = computed(() => formatDate(new Date()))

const patientId = computed(() => {
  const raw = String(route.query.patient_id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})
const billingId = computed(() => {
  const raw = String(route.query.billing_id ?? route.query.id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const parseDate = (value?: string | Date | null): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const raw = String(value ?? "").trim()
  if (!raw) return null

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const transactionFromDate = computed(() =>
  parseDate(String(route.query.transaction_from ?? route.query.transaction_date ?? ""))
)

const transactionToDate = computed(() =>
  parseDate(String(route.query.transaction_to ?? route.query.transaction_date ?? ""))
)

const transactionPeriodEndDate = computed(() =>
  transactionToDate.value ?? transactionFromDate.value ?? null
)

const patientName = computed(() => detail.value?.patient_name || "Patient")
const patientIdLabel = computed(() =>
  patientId.value > 0
    ? String(patientId.value)
    : billingDetail.value?.patient_id
      ? String(billingDetail.value.patient_id)
      : NOT_AVAILABLE_LABEL
)
const lguSponsor = computed(() => sponsorInfo.value)
const lguProgramLabel = computed(() => lguSponsor.value?.lgu_program_name || lguSponsor.value?.company_name || "LGU")
const patientAddress = computed(() => billingDetail.value?.patient_address || NOT_AVAILABLE_LABEL)
const patientAge = computed(() => billingDetail.value?.patient_age || NOT_AVAILABLE_LABEL)
const physicalTherapistName = computed(() => billingDetail.value?.physical_therapist || NOT_AVAILABLE_LABEL)
const doctorName = computed(() => billingDetail.value?.doctor || NOT_AVAILABLE_LABEL)
const diagnosis = computed(() => billingDetail.value?.diagnosis || NOT_AVAILABLE_LABEL)
const patientProgramStatus = computed(() =>
  formatLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )
)
const normalizedPatientProgramStatus = computed(() =>
  resolveLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )
)
const isDropoutPatient = computed(() => isLguDropoutStatus(normalizedPatientProgramStatus.value))
const validityLabel = computed(() => {
  const start = formatDate(lguSponsor.value?.validity_start_date)
  const end = formatDate(lguSponsor.value?.validity_end_date ?? transactionPeriodEndDate.value)
  if (start === NOT_AVAILABLE_LABEL && end === NOT_AVAILABLE_LABEL) return NOT_AVAILABLE_LABEL
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
  unit_price?: number
  dropoutUnitPrice?: number
  dropout_unit_price?: number
  dropoutPrice?: number
  dropout_price?: number
  lineTotal?: number
  treatmentDate?: string
  sessionSequence?: string
  session_sequence?: string | number
  appliesOnSession?: string | number
  applies_on_session?: string | number
  startSession?: string | number
  start_session?: string | number
  allocatedSessionSequence?: number
  allocatedTotalSessions?: number
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
  ...(item.children ?? []),
  ...(item.subItems ?? [])
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

  const unitTotal = Number(
    isDropoutPatient.value
      ? item.dropoutUnitPrice ??
        item.dropout_unit_price ??
        item.dropoutPrice ??
        item.dropout_price ??
        item.unitPrice ??
        item.unit_price ??
        item.price ??
        0
      : item.unitPrice ?? item.unit_price ?? item.price ?? 0
  )
  return Number.isFinite(unitTotal) ? unitTotal : 0
}

const getLineStartSession = (item: InvoiceLineNode): number => {
  const parsed = Number(
    item.sessionSequence ??
    item.session_sequence ??
    item.appliesOnSession ??
    item.applies_on_session ??
    item.startSession ??
    item.start_session ??
    1
  )

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

const filterChildrenForSession = (
  items: InvoiceLineNode[],
  sessionSequence: number,
  parentOccurrences = 1
): InvoiceLineNode[] =>
  items.flatMap(item => {
    const quantity = getQuantity(item)
    const startSession = getLineStartSession(item)
    const occurrences = Math.max(1, quantity * parentOccurrences)
    const allocatedSessionSequence = Math.max(1, sessionSequence - startSession + 1)
    const isAllocatedToSession =
      sessionSequence >= startSession &&
      sessionSequence < startSession + occurrences
    const children = getDirectChildren(item)

    if (children.length) {
      const allocatedChildren = filterChildrenForSession(children, sessionSequence, occurrences)

      return allocatedChildren.length
        ? [{
          ...item,
          quantity: 1,
          allocatedSessionSequence,
          allocatedTotalSessions: quantity,
          lineTotal: undefined,
          children: allocatedChildren,
          subItems: undefined
          }]
        : []
    }

    return isAllocatedToSession
      ? [{
          ...item,
          quantity: 1,
          allocatedSessionSequence,
          allocatedTotalSessions: quantity,
          lineTotal: undefined
        }]
      : []
  })

const hasOwnRate = (item: InvoiceLineNode): boolean => {
  const value = isDropoutPatient.value
    ? item.dropoutUnitPrice ??
      item.dropout_unit_price ??
      item.dropoutPrice ??
      item.dropout_price ??
      item.unitPrice ??
      item.unit_price ??
      item.price
    : item.unitPrice ?? item.unit_price ?? item.price

  return value !== undefined && value !== null && Number.isFinite(Number(value))
}

const appointmentStatusById = computed(() => {
  return new Map(
    (detail.value?.appointments ?? []).map(appointment => [
      appointment.appointment_id,
      String(appointment.status ?? "").trim().toUpperCase()
    ])
  )
})

const completedSessionSequences = computed(() => {
  const sequences = (detail.value?.authorizations ?? [])
    .flatMap(authorization => authorization.sessions ?? [])
    .filter(session => appointmentStatusById.value.get(session.appointment_id) === "COMPLETED")
    .map(session => Math.max(1, Number(session.session_sequence ?? 1)))
    .filter(sequence => Number.isFinite(sequence))
    .sort((left, right) => left - right)

  if (sequences.length) {
    return Array.from(new Set(sequences))
  }

  const completedCount = (detail.value?.appointments ?? [])
    .filter(appointment => String(appointment.status ?? "").trim().toUpperCase() === "COMPLETED")
    .length

  return Array.from({ length: completedCount }, (_, index) => index + 1)
})

const appendServiceRows = (
  items: InvoiceLineNode[],
  inherited: { treatmentDate?: string },
  rows: TableRow[],
  nextItemNoRef: { value: number },
  level = 1
): void => {
  items.forEach(item => {
    const quantity = getQuantity(item)
    const itemName = String(item.name ?? "").trim() || "â€”"
    const itemTreatmentDate = getTreatmentDate(item, inherited)
    const unitTotal = getSessionUnitTotal(item, quantity)
    const children = getDirectChildren(item)

    if (children.length && !hasOwnRate(item)) {
      appendServiceRows(children, {
        treatmentDate: itemTreatmentDate
      }, rows, nextItemNoRef, level + 1)
      return
    }

    Array.from({ length: quantity }).forEach((_, sessionIndex) => {
      const itemNo = nextItemNoRef.value++
      const sessionNumber = isDropoutPatient.value
        ? Math.max(1, Number(item.allocatedSessionSequence ?? getLineStartSession(item)))
        : sessionIndex + 1
      const sessionTotal = isDropoutPatient.value
        ? Math.max(1, Number(item.allocatedTotalSessions ?? quantity))
        : quantity

      rows.push({
        key: `${itemNo}-${String(item.id ?? item.name ?? "item")}-${sessionIndex + 1}`,
        itemNo,
        treatmentDate: itemTreatmentDate,
        serviceName: itemName,
        sessionSequence: isDropoutPatient.value
          ? `${sessionNumber} / ${sessionTotal}`
          : `${sessionIndex + 1} / ${sessionTotal}`,
        unitTotal,
        level,
        isParent: false
      })
    })
  })
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

    const sourceChildren = getDirectChildren(parent)
    const children = isDropoutPatient.value
      ? completedSessionSequences.value.flatMap(sessionSequence => (
          filterChildrenForSession(sourceChildren, sessionSequence)
        ))
      : sourceChildren

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

    appendServiceRows(children, {
      treatmentDate: parentTreatmentDate
    }, rows, nextItemNoRef)

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

const formatDate = (value?: string | Date | null): string => {
  const date = parseDate(value)
  return date ? date.toLocaleDateString("en-PH") : NOT_AVAILABLE_LABEL
}

const load = async (): Promise<void> => {
  error.value = ""
  detail.value = null
  sponsorInfo.value = null
  billingDetail.value = null

  if (!patientId.value && !billingId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    let selectedBilling: BillingListItem | null = null
    let selectedPatientId = patientId.value
    if (billingId.value) {
      selectedBilling = (await billingContextTanstackService.fetchContext(queryClient, billingId.value))?.billing ?? null
      if (!selectedBilling) {
        error.value = "Billing record was not found."
        return
      }
      selectedPatientId = Number(selectedBilling.patient_id)
      billingDetail.value = selectedBilling
    }

    const periodYear = transactionPeriodEndDate.value?.getFullYear()
    const periodMonth = transactionPeriodEndDate.value
      ? transactionPeriodEndDate.value.getMonth() + 1
      : undefined

    const [detailResult, sponsorResult] = await Promise.all([
      lguBillingService.getPatientCreditDetail(selectedPatientId, periodYear, periodMonth),
      patientTanstackService.fetchContext(queryClient, selectedPatientId)
    ])
    detail.value = detailResult ?? null
    sponsorInfo.value = (sponsorResult?.sponsor_information ?? []).find(item => item.sponsor_context === "LGU") ?? null

    const latestBilling = selectedBilling ?? detail.value?.billings?.[0]
    if (!billingDetail.value && latestBilling?.id) {
      billingDetail.value = (await billingContextTanstackService.fetchContext(queryClient, latestBilling.id))?.billing ?? null
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load patient LGU profile."
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
</style>
