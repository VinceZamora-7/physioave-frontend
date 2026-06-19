<template>
  <LguInvoiceLayout
    title="Billing Summary"
    :subtitle="`LGU services availed by ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Patient:</strong><span>{{ patientName }}</span>
      <strong>Patient ID:</strong><span>{{ patientIdLabel }}</span>
      <strong>LGU Program:</strong><span>{{ lguProgramLabel }}</span>
      <strong>Date Range:</strong><span>{{ dateRangeLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage()" />
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
                <span class="profile-value">{{ patientName || "N/A" }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Patient ID:</span>
                <span class="profile-value">{{ patientIdLabel }}</span>
              </div>
            </div>

            <div class="profile-group">
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">LGU Program:</span>
                <span class="profile-value">{{ lguProgramLabel }}</span>
              </div>
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Covered Period:</span>
                <span class="profile-value">{{ dateRangeLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="summary-table billing-summary-table">
          <colgroup>
            <col class="col-item-no" />
            <col class="col-treatment-date" />
            <col class="col-item" />
            <col class="col-session" />
            <col class="col-total" />
          </colgroup>

          <thead>
            <tr>
              <th class="text-center">ITEM No.</th>
              <th class="text-left">TREATMENT DATE</th>
              <th class="text-left">PT SERVICE RENDERED</th>
              <th class="text-left">SESSION SEQUENCE</th>
              <th class="text-right">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!summaryRows.length">
              <td colspan="5" class="empty-row">No LGU services found for the selected date range.</td>
            </tr>

            <tr
              v-for="row in summaryRows"
              :key="row.key"
              :class="{ 'package-row': row.kind === 'package' }"
            >
              <td v-if="row.kind === 'package'" class="package-cell" colspan="5">{{ row.serviceRendered }}</td>
              <template v-else>
                <td class="item-cell text-center">{{ row.itemNo }}</td>
                <td class="date-cell">{{ row.treatmentDate }}</td>
                <td class="service-cell">{{ row.serviceRendered }}</td>
                <td class="session-cell">{{ row.sessionSequence }}</td>
                <td class="total-cell text-right">{{ row.unitTotalLabel }}</td>
              </template>
            </tr>

            <tr v-if="summaryRows.length" class="grand-total-row">
              <td colspan="4" class="text-right">Grand Total:</td>
              <td class="text-right">{{ grandTotalLabel }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class="approval-wrap">
        <section class="approval-card">
          <div class="approval-label">Prepared by:</div>
          <div class="approval-line">&nbsp;</div>
          <div class="approval-name">RENALOU B. CORDOVA, PTRP, UK-PT</div>
          <div class="approval-title">Chief Operations Officer</div>
          <div class="approval-signed">
            <strong>Date Signed:</strong> {{ dateSigned }}
          </div>
        </section>
      </div>
    </template>
  </LguInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import { useLguInvoicePrintActions } from "./lgu-invoice.shared"

type AnyRecord = Record<string, unknown>

type LineNode = AnyRecord & {
  children?: LineNode[]
}

type SummaryRow = {
  key: string
  kind: "package" | "service"
  itemNo: string
  treatmentDate: string
  serviceRendered: string
  sessionSequence: string
  unitTotal: number
  unitTotalLabel: string
}

const route = useRoute()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const billings = ref<BillingListItem[]>([])
const error = ref("")

const patientId = computed(() => parsePositiveNumber(route.query.patient_id))
const dateFrom = computed(() => parseDateQuery(route.query.transaction_from ?? route.query.from))
const dateTo = computed(() => parseDateQuery(route.query.transaction_to ?? route.query.to))

const formatPatientName = (value?: string | null, fallback = "Patient"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const patientName = computed(() =>
  formatPatientName(
    detail.value?.patient_name ||
    billings.value[0]?.patient_name ||
    String(route.query.patient_name ?? "").trim()
  )
)

const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")

const lguProgramLabel = computed(() =>
  formatPatientName(
    firstNonBlank(
      ...billings.value.map(item => item.lgu_program_name),
      String(route.query.lgu_program_name ?? "")
    ),
    "LGU"
  )
)

const dateRangeLabel = computed(() => {
  const from = formatDate(dateFrom.value)
  const to = formatDate(dateTo.value)
  return from === to ? from : `${from} to ${to}`
})

const dateSigned = computed(() => formatDate(new Date()))

const grandTotal = computed(() =>
  summaryRows.value.reduce((sum, row) => sum + (row.kind === "service" ? row.unitTotal : 0), 0)
)

const grandTotalLabel = computed(() => formatCurrency(grandTotal.value))

const summaryRows = computed<SummaryRow[]>(() => {
  const rows: SummaryRow[] = []
  const billingById = new Map<number, BillingListItem>()
  const renderedPackageKeys = new Set<string>()

  for (const billing of billings.value) {
    billingById.set(Number(billing.id), billing)
  }

  for (const authorization of detail.value?.authorizations ?? []) {
    const packageName = authorization.package_name || "LGU Package"
    const packageKey = `authorization-${authorization.authorization_id}-${normalizeKey(packageName)}`

    const sortedSessions = [...(authorization.sessions ?? [])]
      .filter(session => isWithinSelectedRange(session.appointment_date))
      .sort(compareSessionDates)
    const totalSessions = Math.max(1, sortedSessions.length)

    sortedSessions.forEach((session, index) => {
      if (!renderedPackageKeys.has(packageKey)) {
        renderedPackageKeys.add(packageKey)
        rows.push({
          key: `package-${packageKey}`,
          kind: "package",
          itemNo: "",
          treatmentDate: "",
          serviceRendered: packageName,
          sessionSequence: "",
          unitTotal: 0,
          unitTotalLabel: ""
        })
      }

      const billingId = Number(session.dropout_billing_id ?? session.monthly_billing_id ?? 0) || null
      const billing = billingId ? billingById.get(billingId) : undefined
      const sessionSequenceLabel = `${index + 1} of ${totalSessions}`
      const sessionRows = buildRowsForSessionBilling({
        billing,
        packageName,
        fallbackServiceName: session.service_name,
        keyPrefix: `session-${authorization.authorization_id}-${session.id}`,
        treatmentDate: formatDate(session.appointment_date),
        sessionSequenceLabel
      })

      rows.push(...sessionRows)
    })
  }

  return finalizeSummaryRows(rows.length ? rows : buildRowsFromBillings())
})

function parsePositiveNumber(value: unknown): number {
  const parsed = Number(String(value ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function parseDateQuery(value: unknown): Date {
  const text = String(value ?? "").trim()
  const parsed = text ? new Date(`${text.slice(0, 10)}T00:00:00`) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function formatYmd(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDate(value?: Date | string | null): string {
  if (!value) return "N/A"
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString("en-PH")
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(value)
}

function firstNonBlank(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

function isRecord(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function parseMaybeJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value !== "string" || !value.trim()) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function compareSessionDates(
  left: { appointment_date?: string | null; appointment_id?: number | null; id?: number | null },
  right: { appointment_date?: string | null; appointment_id?: number | null; id?: number | null }
): number {
  const leftTime = left.appointment_date ? new Date(left.appointment_date).getTime() : 0
  const rightTime = right.appointment_date ? new Date(right.appointment_date).getTime() : 0
  const leftSort = Number.isNaN(leftTime) ? 0 : leftTime
  const rightSort = Number.isNaN(rightTime) ? 0 : rightTime

  return leftSort - rightSort
    || Number(left.appointment_id ?? 0) - Number(right.appointment_id ?? 0)
    || Number(left.id ?? 0) - Number(right.id ?? 0)
}

function finalizeSummaryRows(rows: SummaryRow[]): SummaryRow[] {
  let itemNo = 1
  let previousSessionSequence = ""

  return rows.map(row => {
    if (row.kind !== "service") return row

    const actualSessionSequence = row.sessionSequence
    const displaySessionSequence = actualSessionSequence && actualSessionSequence === previousSessionSequence
      ? "-"
      : actualSessionSequence

    previousSessionSequence = actualSessionSequence

    return {
      ...row,
      itemNo: String(itemNo++),
      sessionSequence: displaySessionSequence
    }
  })
}

function getNumber(record: AnyRecord | null | undefined, keys: string[]): number {
  if (!record) return 0

  for (const key of keys) {
    const parsed = Number(record[key])
    if (Number.isFinite(parsed)) return parsed
  }

  return 0
}

function getText(record: AnyRecord | null | undefined, keys: string[]): string {
  if (!record) return ""

  for (const key of keys) {
    const value = record[key]
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

function getLineName(line: AnyRecord): string {
  return firstNonBlank(
    getText(line, ["name", "service_name", "serviceName", "pt_service_rendered", "ptServiceRendered", "description"]),
    "Unnamed Service"
  )
}

function getLineAmount(line: AnyRecord): number {
  return getNumber(line, [
    "line_total",
    "lineTotal",
    "total_amount",
    "totalAmount",
    "amount",
    "unit_total",
    "unitTotal",
    "contract_price_snapshot",
    "contractPriceSnapshot",
    "lgu_contract_price",
    "lguContractPrice",
    "dropout_price_snapshot",
    "dropoutPriceSnapshot"
  ])
}

function getLineType(line: AnyRecord): string {
  return getText(line, ["type", "service_type", "serviceType", "item_type", "itemType"]).toLowerCase()
}

function isPackageLine(line: AnyRecord): boolean {
  const type = getLineType(line)
  return type.includes("package")
}

function isBundleLine(line: AnyRecord): boolean {
  const type = getLineType(line)
  const name = getLineName(line)
  return type.includes("bundle") || /\bbundle\b/i.test(name) || getLineChildren(line).length > 0
}

function getLineChildren(line: AnyRecord): LineNode[] {
  const childKeys = [
    "children",
    "subItems",
    "sub_items",
    "items",
    "services",
    "lineItems",
    "line_items",
    "includedServices",
    "included_services",
    "bundleItems",
    "bundle_items",
    "availedServices",
    "availed_services",
    "consumedServices",
    "consumed_services"
  ]

  const jsonKeys = [
    "children_json",
    "line_items_json",
    "lineItemsJson",
    "included_services_json",
    "includedServicesJson",
    "bundle_items_json",
    "bundleItemsJson",
    "availed_services_json",
    "availedServicesJson",
    "consumed_services_json",
    "consumedServicesJson"
  ]

  const children = [
    ...childKeys.flatMap(key => parseMaybeJsonArray(line[key])),
    ...jsonKeys.flatMap(key => parseMaybeJsonArray(line[key]))
  ]

  return children.filter(isRecord) as LineNode[]
}

function parseBillingLines(billing: BillingListItem): LineNode[] {
  const lineItems = parseMaybeJsonArray(billing.line_items_json).filter(isRecord) as LineNode[]
  if (lineItems.length) return lineItems

  return parseMaybeJsonArray(billing.consumed_services_json).filter(isRecord) as LineNode[]
}

function getBillableLinesFromBilling(billing?: BillingListItem): LineNode[] {
  if (!billing) return []

  const lines = parseBillingLines(billing)
  const packageLines = lines.filter(isPackageLine)
  const sourceLines = packageLines.length
    ? packageLines.flatMap(line => getLineChildren(line))
    : lines

  return sourceLines.filter(line => {
    const type = getLineType(line)
    return !type.includes("package")
  })
}

function isWithinSelectedRange(value?: string | null): boolean {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false

  const day = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime()
  return day >= dateFrom.value.getTime() && day <= dateTo.value.getTime()
}

function getBillingUnitTotal(billing?: BillingListItem): number {
  return getNumber(billing as AnyRecord | undefined, ["total_amount", "amount_due"])
}

function getBillingTreatmentDate(billing: BillingListItem): string {
  return getText(billing as unknown as AnyRecord, ["appointment_date", "appointmentDate", "treatment_date", "treatmentDate", "created_at", "createdAt"])
}

function getBillingServiceRendered(billing: BillingListItem): string {
  const lines = parseBillingLines(billing)
  const primaryLine = lines.find(line => !isPackageLine(line)) ?? lines[0]

  return firstNonBlank(
    primaryLine ? getLineName(primaryLine) : "",
    billing.service_name,
    billing.package_name,
    "LGU Session"
  )
}

function buildRowsForSessionBilling({
  billing,
  packageName,
  fallbackServiceName,
  keyPrefix,
  treatmentDate,
  sessionSequenceLabel
}: {
  billing?: BillingListItem
  packageName: string
  fallbackServiceName: string
  keyPrefix: string
  treatmentDate: string
  sessionSequenceLabel: string
}): SummaryRow[] {
  const billableLines = getBillableLinesFromBilling(billing)
  const billingTotal = getBillingUnitTotal(billing)

  if (!billableLines.length) {
    return [{
      key: `${keyPrefix}-fallback`,
      kind: "service",
      itemNo: "",
      treatmentDate,
      serviceRendered: firstNonBlank(fallbackServiceName, billing?.service_name, packageName, "LGU Service"),
      sessionSequence: sessionSequenceLabel,
      unitTotal: billingTotal,
      unitTotalLabel: formatCurrency(billingTotal)
    }]
  }

  return billableLines.map((line, index) => {
    const lineAmount = getLineAmount(line)
    const amount = lineAmount > 0
      ? lineAmount
      : billableLines.length === 1
        ? billingTotal
        : 0

    return {
      key: `${keyPrefix}-line-${index}-${normalizeKey(getLineName(line))}`,
      kind: "service",
      itemNo: "",
      treatmentDate,
      serviceRendered: getLineName(line),
      sessionSequence: sessionSequenceLabel,
      unitTotal: amount,
      unitTotalLabel: amount > 0 ? formatCurrency(amount) : "-"
    }
  })
}

function getBillingSessionSequence(billing: BillingListItem): string {
  const billingRecord = billing as unknown as AnyRecord
  const sequenceLabel = getText(billingRecord, ["session_sequence_label", "sessionSequenceLabel"])
  if (sequenceLabel) return sequenceLabel

  const sequence = getNumber(billingRecord, ["session_sequence", "sessionSequence"])
  const totalSessions = getNumber(billingRecord, ["total_sessions", "totalSessions"])

  return sequence > 0 ? `${sequence} of ${Math.max(1, totalSessions || 1)}` : "-"
}

function buildRowsFromBillings(): SummaryRow[] {
  const seenKeys = new Set<string>()
  const rows: SummaryRow[] = []
  const renderedPackageKeys = new Set<string>()

  for (const billing of billings.value) {
    const treatmentDate = getBillingTreatmentDate(billing)
    if (!isWithinSelectedRange(treatmentDate)) continue

    const packageName = billing.package_name || "LGU Package"
    const packageKey = normalizeKey(packageName)

    if (!renderedPackageKeys.has(packageKey)) {
      renderedPackageKeys.add(packageKey)
      rows.push({
        key: `billing-package-${packageKey}`,
        kind: "package",
        itemNo: "",
        treatmentDate: "",
        serviceRendered: packageName,
        sessionSequence: "",
        unitTotal: 0,
        unitTotalLabel: ""
      })
    }

    const duplicateKey = [
      Number(billing.appointment_id ?? 0),
      normalizeKey(getBillingServiceRendered(billing)),
      getBillingSessionSequence(billing),
      formatDate(treatmentDate),
      getBillingUnitTotal(billing)
    ].join("|")

    if (seenKeys.has(duplicateKey)) continue
    seenKeys.add(duplicateKey)

    rows.push({
      key: `billing-${billing.id}`,
      kind: "service",
      itemNo: "",
      treatmentDate: formatDate(treatmentDate),
      serviceRendered: getBillingServiceRendered(billing),
      sessionSequence: getBillingSessionSequence(billing),
      unitTotal: getBillingUnitTotal(billing),
      unitTotalLabel: formatCurrency(getBillingUnitTotal(billing))
    })
  }

  return rows
}

async function load(): Promise<void> {
  error.value = ""
  detail.value = null
  billings.value = []

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const periodYear = dateTo.value.getFullYear()
    const periodMonth = dateTo.value.getMonth() + 1

    const [billingResult, detailResult] = await Promise.all([
      billingPhase1Service.getAll({
        patient_id: patientId.value,
        billing_type: "LGU_BILLING",
        from_date: formatYmd(dateFrom.value),
        to_date: formatYmd(dateTo.value),
        page: 1,
        size: 5000
      }),
      lguBillingService.getPatientCreditDetail(patientId.value, periodYear, periodMonth)
    ])

    billings.value = billingResult?.content ?? []
    detail.value = detailResult ?? null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load LGU billing summary."
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
.billing-summary-table {
  min-width: 0;
}

.billing-summary-table .col-item-no {
  width: 9%;
}

.billing-summary-table .col-treatment-date {
  width: 17%;
}

.billing-summary-table .col-item {
  width: 40%;
}

.billing-summary-table .col-session {
  width: 17%;
}

.billing-summary-table .col-total {
  width: 17%;
}

.package-cell {
  background: #f3f4f6;
  color: #111827;
  font-weight: 900;
  text-transform: uppercase;
}

.item-cell,
.date-cell,
.service-cell {
  font-weight: 600;
  padding-left: 18px !important;
}

.item-cell {
  padding-left: 6px !important;
}

.session-cell,
.total-cell {
  color: #374151;
  font-weight: 700;
}

.empty-row {
  padding: 14px 10px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.grand-total-row td {
  border-top: 2px solid #111827;
  font-weight: 900;
}

@media print {
  .billing-summary-table {
    min-width: 0 !important;
  }

  .package-cell,
  .item-cell,
  .date-cell,
  .service-cell,
  .session-cell,
  .total-cell,
  .grand-total-row td {
    font-size: 9px !important;
  }
}
</style>
