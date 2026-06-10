<template>
  <LguInvoiceLayout
    title="Invoice Billing"
    :subtitle="`BILLING SUMMARY record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Patient:</strong><span>{{ patientName }}</span>
      <strong>Patient ID:</strong><span>{{ patientIdLabel }}</span>
      <strong>LGU Program:</strong><span>{{ lguProgramLabel }}</span>
      <strong>Transaction Date:</strong><span>{{ validityLabel }}</span>
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
                <span class="profile-value">{{ patientName || "—" }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">Address:</span>
                <span class="profile-value">{{ patientAddress || "—" }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">Age:</span>
                <span class="profile-value">{{ patientAge || "—" }}</span>
              </div>

              <div class="profile-row">
                <span class="profile-label">Program Status:</span>
                <span class="profile-value">{{ patientProgramStatus || "—" }}</span>
              </div>
            </div>

            <div class="profile-group">
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Physical Therapist:</span>
                <span class="profile-value">{{ physicalTherapistName || "—" }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Doctor:</span>
                <span class="profile-value">{{ doctorName || "—" }}</span>
              </div>

              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Diagnosis:</span>
                <span class="profile-value">{{ diagnosis || "—" }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="summary-table patient-billing-summary-table">
          <colgroup>
            <col class="col-item-no" />
            <col class="col-treatment-date" />
            <col class="col-service-rendered" />
            <col class="col-session-sequence" />
            <col class="col-unit-total" />
          </colgroup>

          <thead>
            <tr>
              <th class="text-center">ITEM No.</th>
              <th class="text-right">TREATMENT DATE</th>
              <th class="text-left">PT SERVICE RENDERED</th>
              <th class="text-center">SESSION SEQUENCE</th>
              <th class="text-right">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!invoiceRows.length">
              <td colspan="5" class="empty-row">
                No billing summary items found.
              </td>
            </tr>

            <tr
              v-for="row in invoiceRows"
              :key="row.key"
              :data-level="row.level ?? 0"
              :class="{
                'item-group-start': row.isParent,
                'line-item-child': !row.isParent && Number(row.level ?? 0) > 0
              }"
            >
              <td class="text-center">
                {{ row.isParent || !row.itemNo ? "" : row.itemNo }}
              </td>

              <td class="text-right">
                {{ row.isParent ? "" : row.treatmentDate ? formatDate(row.treatmentDate) : "-" }}
              </td>

              <td class="text-left service-name-cell">
                {{ stripPackageSessionSuffix(row.serviceName) || "-" }}
              </td>

              <td class="text-center">
                {{ row.isParent ? "" : row.sessionSequence || "-" }}
              </td>

              <td class="text-right">
                {{ row.isParent ? "" : formatUnitTotal(row.unitTotal) }}
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr class="grand-total-row">
              <td colspan="4" class="text-right">
                Grand Total:
              </td>
              <td class="text-right">
                {{ formatCurrency(billing.grand_total ?? billing.total_amount ?? 0) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class="approval-wrap-hmo">
        <section class="payment-box">
          <span class="self-pay-bottom-text-header">LGU DETAILS</span>

          <div>
            <span class="self-pay-bottom-text">Billing To:</span>
            {{ lguBillingToLabel }}
          </div>

          <div>
            <span class="self-pay-bottom-text">Patient Program Status:</span>
            {{ patientProgramStatus }}
          </div>

          <div>
            <span class="self-pay-bottom-text">Referral Form No.:</span>
            {{ referralFormNumberLabel }}
          </div>

          <div>
            <span class="self-pay-bottom-text">Date Issued:</span>
            {{ referralIssuedDateLabel }}
          </div>
        </section>

        <section class="approval-card">
          <div class="approval-label">Approved by:</div>
          <div>&nbsp;</div>

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
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import type { BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import {
  appointmentBillingService,
  type PrintableBillingDocument
} from "@/features/appointments/api/appointment-billing.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  formatLguPatientProgramStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import type { PatientHMOInformation } from "@/models/hmo-information"

type AnyRecord = Record<string, unknown>

type InvoiceLineNode = AnyRecord & {
  id?: number | string
  type?: string
  name?: string
  service_name?: string
  serviceName?: string
  pt_service_rendered?: string
  ptServiceRendered?: string
  description?: string
  quantity?: number | string
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

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const printableDocument = ref<PrintableBillingDocument | null>(null)
const error = ref("")

const NOT_AVAILABLE_LABEL = "N/A"

const CHILD_KEYS = [
  "children",
  "subItems",
  "sub_items",
  "items",
  "services",
  "line_items",
  "lineItems",
  "included_services",
  "includedServices",
  "package_services",
  "packageServices",
  "child_services",
  "childServices",
  "service_inclusions",
  "serviceInclusions",
  "package_inclusions",
  "packageInclusions",
  "availed_services",
  "availedServices",
  "consumed_services",
  "consumedServices",
  "bundleItems",
  "bundle_items"
]

const CHILD_JSON_KEYS = [
  "line_items_json",
  "lineItemsJson",
  "included_services_json",
  "includedServicesJson",
  "package_services_json",
  "packageServicesJson",
  "child_services_json",
  "childServicesJson",
  "service_inclusions_json",
  "serviceInclusionsJson",
  "package_inclusions_json",
  "packageInclusionsJson",
  "availed_services_json",
  "availedServicesJson",
  "consumed_services_json",
  "consumedServicesJson",
  "bundle_items_json",
  "bundleItemsJson"
]

const INVOICE_ARRAY_KEYS = [
  "lines",
  "lineItems",
  "line_items",
  "billingLines",
  "billing_lines",
  "items",
  "services",
  "packageItems",
  "package_items",
  "includedServices",
  "included_services",
  "packageServices",
  "package_services",
  "childServices",
  "child_services",
  "availedServices",
  "availed_services",
  "consumedServices",
  "consumed_services",
  "data",
  "rows"
]

const BUNDLE_ITEM_KEYS = ["bundleItems", "bundle_items"]
const BUNDLE_ITEM_JSON_KEYS = ["bundle_items_json", "bundleItemsJson"]
const PACKAGE_CHILD_KEYS = CHILD_KEYS.filter(key => !BUNDLE_ITEM_KEYS.includes(key))
const PACKAGE_CHILD_JSON_KEYS = CHILD_JSON_KEYS.filter(key => !BUNDLE_ITEM_JSON_KEYS.includes(key))

const CONTRACT_PRICE_KEYS = [
  "lgu_contract_price",
  "lguContractPrice",
  "contract_price",
  "contractPrice",
  "contract_unit_price",
  "contractUnitPrice",
  "contract_unit_price_snapshot",
  "contractUnitPriceSnapshot",
  "package_unit_price_snapshot",
  "packageUnitPriceSnapshot",
  "lgu_package_price",
  "lguPackagePrice",
  "lgu_package_rate",
  "lguPackageRate",
  "lgu_unit_price",
  "lguUnitPrice"
]

const DROPOUT_PRICE_KEYS = [
  "dropout_rate",
  "dropOutRate",
  "drop_out_rate",
  "dropout_price",
  "dropoutPrice",
  "drop_out_price",
  "dropOutPrice",
  "lgu_dropout_rate",
  "lguDropoutRate",
  "lgu_drop_out_rate",
  "lguDropOutRate",
  "lgu_dropout_price",
  "lguDropoutPrice",
  "lgu_drop_out_price",
  "lguDropOutPrice",
  "dropout_unit_price",
  "dropoutUnitPrice",
  "drop_out_unit_price",
  "dropOutUnitPrice",
  "dropout_unit_price_snapshot",
  "dropoutUnitPriceSnapshot",
  "drop_out_unit_price_snapshot",
  "dropOutUnitPriceSnapshot",
  "dropout_package_rate",
  "dropoutPackageRate",
  "drop_out_package_rate",
  "dropOutPackageRate",
  "lgu_dropout_package_rate",
  "lguDropoutPackageRate",
  "lgu_drop_out_package_rate",
  "lguDropOutPackageRate"
]

const PRICE_FALLBACK_KEYS = [
  "line_total",
  "lineTotal",
  "total",
  "amount",
  "line_total_snapshot",
  "lineTotalSnapshot",
  "totalPrice",
  "total_price",
  "price",
  "unit_price",
  "unitPrice"
]

const dateSigned = computed(() => formatDate(new Date()))

const patientId = computed(() => parsePositiveNumber(route.query.patient_id))
const billingId = computed(() => parsePositiveNumber(route.query.billing_id ?? route.query.id))

const selectedAppointmentId = computed(() => {
  const fromQuery = parsePositiveNumber(
    route.query.appointment_id ??
    route.query.appointmentId ??
    route.query.appt_id ??
    route.query.apptId
  )

  if (fromQuery > 0) return fromQuery

  return getNumberFromRecord(billingDetail.value, [
    "appointment_id",
    "appointmentId",
    "root_appointment_id",
    "rootAppointmentId"
  ])
})

const transactionFromDate = computed(() => parseDate(String(route.query.transaction_from ?? route.query.transaction_date ?? "")))
const transactionToDate = computed(() => parseDate(String(route.query.transaction_to ?? route.query.transaction_date ?? "")))
const transactionPeriodEndDate = computed(() => transactionToDate.value ?? transactionFromDate.value ?? null)

const patientName = computed(() => detail.value?.patient_name || getBillingText("patient_name") || "Patient")
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : String(billingDetail.value?.patient_id ?? NOT_AVAILABLE_LABEL))
const lguSponsor = computed(() => sponsorInfo.value)

const lguProgramLabel = computed(() =>
  getSponsorText("lgu_program_name") || getSponsorText("company_name") || getBillingText("lgu_program_name") || "LGU"
)

const patientAddress = computed(() =>
  getBillingText("patient_address") || getDetailText("patient_address") || NOT_AVAILABLE_LABEL
)

const patientAge = computed(() =>
  getBillingText("patient_age") || getDetailText("patient_age") || NOT_AVAILABLE_LABEL
)

const physicalTherapistName = computed(() =>
  getBillingText("physical_therapist_name") || getBillingText("physical_therapist") || NOT_AVAILABLE_LABEL
)

const doctorName = computed(() =>
  getBillingText("doctor_name") || getBillingText("doctor") || NOT_AVAILABLE_LABEL
)

const diagnosis = computed(() =>
  getBillingText("diagnosis") || getDetailText("diagnosis") || NOT_AVAILABLE_LABEL
)

const patientProgramStatus = computed(() =>
  formatLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )
)

const lguBillingToLabel = computed(() =>
  getBillingText("lgu_name") ||
  getBillingText("sponsor_name") ||
  getSponsorText("company_name") ||
  getSponsorText("lgu_program_name") ||
  lguProgramLabel.value ||
  NOT_AVAILABLE_LABEL
)

const referralFormNumberLabel = computed(() =>
  getBillingText("referral_form_no") ||
  getBillingText("referralFormNo") ||
  getBillingText("approval_code") ||
  getSponsorText("approval_code") ||
  getSponsorText("referral_form_no") ||
  NOT_AVAILABLE_LABEL
)

const referralIssuedDateLabel = computed(() =>
  formatDate(
    getBillingText("referral_issued_date") ||
    getBillingText("date_issued") ||
    getSponsorText("referral_issued_date") ||
    getSponsorText("validity_start_date") ||
    null
  )
)

const validityLabel = computed(() => {
  const start = formatDate(getSponsorText("validity_start_date"))
  const end = formatDate(getSponsorText("validity_end_date") || transactionPeriodEndDate.value)

  return start === NOT_AVAILABLE_LABEL && end === NOT_AVAILABLE_LABEL
    ? NOT_AVAILABLE_LABEL
    : `${start} to ${end}`
})

const billing = computed(() => {
  const savedTotal = Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? 0)
  const rowTotal = invoiceRows.value.reduce((sum, row) => sum + Number(row.unitTotal ?? 0), 0)
  const total = savedTotal > 0 ? savedTotal : rowTotal

  return {
    grand_total: total,
    total_amount: total
  }
})

const selectedAppointment = computed(() => {
  const appointmentId = selectedAppointmentId.value
  if (appointmentId <= 0) return null

  return (detail.value?.appointments ?? []).find(appointment =>
    Number(appointment.appointment_id ?? 0) === appointmentId
  ) ?? null
})

const selectedAppointmentDate = computed(() => selectedAppointment.value?.appointment_date || "")

const completedSessionSequences = computed(() => {
  const appointmentStatusById = new Map(
    (detail.value?.appointments ?? []).map(appointment => [
      appointment.appointment_id,
      String(appointment.status ?? "").trim().toUpperCase()
    ])
  )

  const sequences = (detail.value?.authorizations ?? [])
    .flatMap(authorization => authorization.sessions ?? [])
    .filter(session => appointmentStatusById.get(session.appointment_id) === "COMPLETED")
    .map(session => Math.max(1, Number(session.session_sequence ?? 1)))
    .filter(sequence => Number.isFinite(sequence))
    .sort((left, right) => left - right)

  if (sequences.length) return Array.from(new Set(sequences))

  const completedCount = (detail.value?.appointments ?? [])
    .filter(appointment => String(appointment.status ?? "").trim().toUpperCase() === "COMPLETED")
    .length

  return Array.from({ length: completedCount }, (_, index) => index + 1)
})

const selectedAppointmentSessionSequences = computed(() => {
  const appointmentId = selectedAppointmentId.value
  if (appointmentId <= 0) return []

  const sequences = (detail.value?.authorizations ?? [])
    .flatMap(authorization => authorization.sessions ?? [])
    .filter(session => Number(session.appointment_id ?? 0) === appointmentId)
    .map(session => Math.max(1, Number(session.session_sequence ?? 1)))
    .filter(sequence => Number.isFinite(sequence))
    .sort((left, right) => left - right)

  if (sequences.length) return Array.from(new Set(sequences))

  const appointmentIndex = (detail.value?.appointments ?? [])
    .filter(appointment => String(appointment.status ?? "").trim().toUpperCase() === "COMPLETED")
    .sort((left, right) =>
      (parseDate(left.appointment_date)?.getTime() ?? 0) -
      (parseDate(right.appointment_date)?.getTime() ?? 0)
    )
    .findIndex(appointment => Number(appointment.appointment_id ?? 0) === appointmentId)

  return appointmentIndex >= 0 ? [appointmentIndex + 1] : []
})

const invoiceRows = computed<TableRow[]>(() => {
  const billingLineItems = parseInvoiceLineItems(billingDetail.value?.line_items_json)

  if (billingLineItems.length) {
    const selectedAppointmentRows = buildSelectedAppointmentRowsFromBillingLines(billingLineItems)
    if (selectedAppointmentRows.length) return selectedAppointmentRows
  }

  const consumedLineItems = parseInvoiceLineItems(getConsumedServicesPayload(billingDetail.value as AnyRecord | null))

  if (consumedLineItems.length) {
    const selectedAppointmentRows = buildSelectedAppointmentRowsFromBillingLines(consumedLineItems)
    if (selectedAppointmentRows.length) return selectedAppointmentRows
  }

  const consumedAppointmentRows = buildSelectedAppointmentRowsFromConsumption()
  if (consumedAppointmentRows.length) return consumedAppointmentRows

  return buildFallbackAppointmentRows()
})

function buildSelectedAppointmentRowsFromConsumption(): TableRow[] {
  const appointment = selectedAppointment.value
  const availedServices = appointment?.availed_services ?? []

  if (!appointment || !availedServices.length) return []

  const appointmentDate = getAppointmentDate()
  const fallbackSessionLabel = getSelectedSessionLabel([])
  const rows: TableRow[] = []
  const seen = new Set<string>()

  const addMainRow = (serviceName: string, unitTotal: number | null): void => {
    rows.push({
      key: `consumed-main-${rows.length}-${serviceName}`,
      itemNo: nextItemNo(rows),
      treatmentDate: appointmentDate,
      serviceName,
      sessionSequence: fallbackSessionLabel,
      unitTotal,
      level: 0,
      isParent: false
    })
  }

  for (const service of availedServices) {
    const serviceName = String(service ?? "").trim()
    if (!serviceName) continue

    const isGenericPackageSession = isGenericConsumedPackageSessionName(serviceName, appointment.package_name)
    if (isGenericPackageSession) continue

    const key = normalizeCatalogName(serviceName)
    if (!key || seen.has(key)) continue

    seen.add(key)

    addMainRow(
      stripPackageSessionSuffix(serviceName),
      Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? 0)
    )
  }

  return rows
}

function isGenericConsumedPackageSessionName(serviceName: string, packageName?: string | null): boolean {
  const normalizedServiceName = normalizeCatalogName(stripPackageSessionSuffix(serviceName))
  const normalizedPackageName = normalizeCatalogName(packageName ?? "")

  return /\bsession\b/i.test(serviceName) && (
    normalizedServiceName === "session" ||
    normalizedServiceName === "lgu package session" ||
    normalizedServiceName === "package session" ||
    Boolean(normalizedPackageName && (
      normalizedServiceName === normalizedPackageName ||
      normalizedServiceName === `${normalizedPackageName} session`
    ))
  )
}

function parsePositiveNumber(value: unknown): number {
  const parsed = Number(String(value ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function parseDate(value?: string | Date | null): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const raw = String(value ?? "").trim()
  if (!raw) return null

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value?: string | Date | null): string {
  const date = parseDate(value)
  return date ? date.toLocaleDateString("en-PH") : NOT_AVAILABLE_LABEL
}

function formatCurrency(value?: number | null): string {
  return value === null || value === undefined
    ? ""
    : Number(value).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
      })
}

function formatUnitTotal(value: number | null): string {
  if (value === null) return ""
  if (value > 0) return formatCurrency(value)
  return "-"
}

function nextItemNo(rows: TableRow[]): number {
  return rows.filter(row => !row.isParent && Number(row.level ?? 0) === 0).length + 1
}

function getBillingText(key: string): string {
  return String((billingDetail.value as AnyRecord | null)?.[key] ?? "").trim()
}

function getDetailText(key: string): string {
  return String((detail.value as AnyRecord | null)?.[key] ?? "").trim()
}

function getSponsorText(key: string): string {
  return String((lguSponsor.value as AnyRecord | null)?.[key] ?? "").trim()
}

function getNumberFromRecord(record: unknown, keys: string[]): number {
  if (!record || typeof record !== "object") return 0

  for (const key of keys) {
    const parsed = parsePositiveNumber((record as AnyRecord)[key])
    if (parsed > 0) return parsed
  }

  return 0
}

function parseMaybeJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value

  const raw = value.trim()
  if (!raw) return null

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function normalizeInvoiceLineEntry(entry: unknown): InvoiceLineNode[] {
  if (typeof entry === "string") {
    const name = entry.trim()
    return name ? [{ name }] : []
  }

  return isRecord(entry) ? [entry as InvoiceLineNode] : []
}

function parseMaybeJsonArray(value: unknown): unknown[] {
  const parsed = parseMaybeJsonValue(value)

  if (Array.isArray(parsed)) {
    return parsed.flatMap(normalizeInvoiceLineEntry)
  }

  if (!isRecord(parsed)) {
    return []
  }

  const nestedItems = INVOICE_ARRAY_KEYS.flatMap(key => {
    const nested = parsed[key]
    if (nested === undefined || nested === null || nested === "") return []
    return parseMaybeJsonArray(nested)
  })

  if (nestedItems.length) {
    return nestedItems
  }

  return [parsed]
}

function parseInvoiceLineItems(value?: unknown): InvoiceLineNode[] {
  return parseMaybeJsonArray(value).filter(isRecord) as InvoiceLineNode[]
}

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function getRecordValue(record: unknown, key: string): unknown {
  return isRecord(record) ? record[key] : undefined
}

function parseJsonChildren(value: unknown): InvoiceLineNode[] {
  return parseMaybeJsonArray(value).flatMap(entry => {
    if (typeof entry === "string") {
      const name = entry.trim()
      return name ? [{ name }] : []
    }

    return isRecord(entry) ? [entry as InvoiceLineNode] : []
  })
}

function getPayloadChildrenByKeys(
  item: InvoiceLineNode,
  childKeys = CHILD_KEYS,
  childJsonKeys = CHILD_JSON_KEYS
): InvoiceLineNode[] {
  return [
    ...childKeys.flatMap(key => parseJsonChildren(getRecordValue(item, key))),
    ...childJsonKeys.flatMap(key => parseJsonChildren(getRecordValue(item, key)))
  ]
}

function getPayloadChildren(item: InvoiceLineNode): InvoiceLineNode[] {
  return getPayloadChildrenByKeys(item)
}

function stripPackageSessionSuffix(value: string): string {
  return String(value ?? "")
    .replace(/\s+-\s+Session\s+\d+\s+of\s+\d+\s*$/i, "")
    .replace(/\s+Session\s+-\s+Session\s+\d+\s+of\s+\d+\s*$/i, "")
    .trim()
}

function getServiceName(item: InvoiceLineNode): string {
  return String(
    item.service_name ??
    item.serviceName ??
    item.pt_service_rendered ??
    item.ptServiceRendered ??
    item.description ??
    item.name ??
    ""
  ).trim() || "—"
}

function normalizeCatalogName(value?: string): string {
  return String(value ?? "")
    .trim()
    .replace(/^[-\s]*(?:\d+(?:\.\d+)?|x\d+)\s+/i, "")
    .replace(/\s+\(LGU\s+.*?\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function getAmount(record: unknown, keys: string[]): number | null {
  if (!isRecord(record)) return null

  for (const key of keys) {
    const value = record[key]
    if (value === undefined || value === null || value === "") continue

    const parsed = Number(typeof value === "string" ? value.replace(/[^\d.-]/g, "") : value)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

function getConsumedServicesJson(value?: {
  consumed_services_json?: string | null
  consumedServicesJson?: string | null
} | null): string | null {
  return value?.consumed_services_json?.trim() || value?.consumedServicesJson?.trim() || null
}

function getConsumedServicesPayload(value?: AnyRecord | null): unknown {
  if (!value) return null

  return (
    value.consumed_services_json ||
    value.consumedServicesJson ||
    value.consumed_services ||
    value.consumedServices ||
    value.availed_services ||
    value.availedServices ||
    null
  )
}

function getQuantity(item: InvoiceLineNode): number {
  const quantity = Math.floor(Number(item.quantity ?? 1))
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

function isPackageLine(item: InvoiceLineNode): boolean {
  const type = String(item.type ?? "").trim().toLowerCase()
  const id = String(item.id ?? "").trim().toLowerCase()

  return (
    type === "package" ||
    type === "package-service" ||
    type === "package_service" ||
    id.startsWith("package-")
  )
}

function isBundleLine(item: InvoiceLineNode): boolean {
  const type = String(item.type ?? "").trim().toLowerCase()
  const id = String(item.id ?? "").trim().toLowerCase()
  const hasPayloadChildren = getPayloadChildren(item).length > 0

  return (
    type === "bundle" ||
    type === "service-bundle" ||
    type === "service_bundle" ||
    id.startsWith("bundle-") ||
    id.startsWith("package-bundle-") ||
    id.startsWith("service-bundle-") ||
    hasPayloadChildren
  )
}

function normalizeBundleLookupId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^(?:bundle-|package-bundle-|service-bundle-|lgu-)/i, "")
}

function getBundleDisplayName(item: InvoiceLineNode): string {
  return stripPackageSessionSuffix(getServiceName(item))
}

function normalizeLguStatusText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
}

function isDropoutStatusText(value: unknown): boolean {
  const status = normalizeLguStatusText(value)

  return (
    status === "DROPPED_OUT" ||
    status === "DROP_OUT" ||
    status === "CROSS_MONTH_DROPPED_OUT" ||
    status === "CROSS_MONTH_DROP_OUT" ||
    status.includes("DROPOUT") ||
    status.includes("DROP_OUT")
  )
}

function shouldUseDropoutRate(item?: InvoiceLineNode): boolean {
  return [
    item?.status,
    item?.lgu_status,
    item?.lguStatus,
    item?.patient_program_status,
    item?.patientProgramStatus,
    item?.program_status,
    item?.programStatus,
    item?.pricing_source,
    item?.pricingSource,
    item?.pricing_tier,
    item?.pricingTier,
    getBillingText("lgu_patient_program_status"),
    getBillingText("patient_program_status"),
    getBillingText("dropout_status"),
    getBillingText("pricing_source"),
    getBillingText("pricing_tier"),
    getDetailText("dropout_status"),
    patientProgramStatus.value
  ].some(isDropoutStatusText)
}

function getPositiveAmount(record: unknown, keys: string[]): number | null {
  const amount = getAmount(record, keys)
  return amount !== null && amount > 0 ? amount : null
}

function getPositiveAmountFromChildren(item: InvoiceLineNode, keys: string[]): number | null {
  const children = getPayloadChildren(item)

  for (const child of children) {
    const childAmount = getPositiveAmount(child, keys)
    if (childAmount !== null) return childAmount
  }

  return null
}

function getBillingFallbackTotal(): number {
  const total = Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? 0)
  return Number.isFinite(total) && total > 0 ? total : 0
}

function getLguStatusUnitPrice(item: InvoiceLineNode): number {
  const useDropoutRate = shouldUseDropoutRate(item)
  const primaryKeys = useDropoutRate ? DROPOUT_PRICE_KEYS : CONTRACT_PRICE_KEYS
  const secondaryKeys = useDropoutRate ? CONTRACT_PRICE_KEYS : DROPOUT_PRICE_KEYS

  return (
    getPositiveAmount(item, primaryKeys) ??
    getPositiveAmountFromChildren(item, primaryKeys) ??
    getPositiveAmount(item, secondaryKeys) ??
    getPositiveAmountFromChildren(item, secondaryKeys) ??
    getPositiveAmount(item, PRICE_FALLBACK_KEYS) ??
    getPositiveAmountFromChildren(item, PRICE_FALLBACK_KEYS) ??
    0
  )
}

function getBundleContractPrice(item: InvoiceLineNode): number {
  const price = getLguStatusUnitPrice(item)

  if (price > 0) return price

  return getBillingFallbackTotal()
}

function getLineUnitPrice(item: InvoiceLineNode): number {
  return getLguStatusUnitPrice(item)
}

function dedupeInvoiceChildren(items: InvoiceLineNode[]): InvoiceLineNode[] {
  const seen = new Set<string>()
  const output: InvoiceLineNode[] = []

  for (const item of items) {
    const name = normalizeCatalogName(getServiceName(item))
    const id = String(item.id ?? "").trim().toLowerCase()
    const key = id || name

    if (!key || seen.has(key)) continue

    seen.add(key)
    output.push(item)
  }

  return output
}

function getBundleChildren(item: InvoiceLineNode): InvoiceLineNode[] {
  return dedupeInvoiceChildren(getPayloadChildren(item))
}

function getLineStartSession(item: InvoiceLineNode): number {
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

function filterLinesForSession(
  items: InvoiceLineNode[],
  sessionSequence: number,
  parentOccurrences = 1
): InvoiceLineNode[] {
  return items.flatMap(item => {
    const quantity = getQuantity(item)
    const startSession = getLineStartSession(item)
    const occurrences = Math.max(1, quantity * parentOccurrences)
    const isAllocatedToSession =
      sessionSequence >= startSession &&
      sessionSequence < startSession + occurrences

    const children = getBundleChildren(item)

    if (children.length) {
      const allocatedChildren = filterLinesForSession(children, sessionSequence, occurrences)

      return allocatedChildren.length
        ? [{
            ...item,
            quantity: 1,
            children: allocatedChildren
          }]
        : []
    }

    return isAllocatedToSession
      ? [{
          ...item,
          quantity: 1
        }]
      : []
  })
}

function getSelectedSessionLabel(lineItems: InvoiceLineNode[]): string {
  const sequence =
    selectedAppointmentSessionSequences.value[0] ||
    Number(billingDetail.value?.session_sequence ?? 1)

  const total =
    Number(billingDetail.value?.total_sessions ?? 0) ||
    getQuantity(lineItems[0] ?? {}) ||
    completedSessionSequences.value.length ||
    1

  return `${Math.max(1, Number(sequence) || 1)} of ${Math.max(1, Number(total) || 1)}`
}

function getAppointmentDate(): string {
  return (
    selectedAppointmentDate.value ||
    getBillingText("appointment_date") ||
    getBillingText("appointment_starts_at") ||
    getBillingText("starts_at") ||
    billingDetail.value?.created_at ||
    ""
  )
}

function getPackagePayloadChildren(item: InvoiceLineNode): InvoiceLineNode[] {
  return getPayloadChildrenByKeys(item, PACKAGE_CHILD_KEYS, PACKAGE_CHILD_JSON_KEYS)
}

function getPackageBundleMetadataLines(item: InvoiceLineNode): InvoiceLineNode[] {
  const bundleEntries = [
    ...BUNDLE_ITEM_KEYS.flatMap(key => parseMaybeJsonArray(getRecordValue(item, key))),
    ...BUNDLE_ITEM_JSON_KEYS.flatMap(key => parseMaybeJsonArray(getRecordValue(item, key)))
  ]

  return bundleEntries.flatMap(entry => {
    const rawId = isRecord(entry)
      ? entry.id ?? entry.bundle_id ?? entry.bundleId ?? entry.bundle_template_id ?? entry.bundleTemplateId
      : entry

    const bundleId = normalizeBundleLookupId(rawId)
    if (!bundleId) return []

    const name = isRecord(entry)
      ? String(entry.name ?? entry.bundle_name ?? entry.bundleName ?? "").trim()
      : ""

    return [{
      ...(isRecord(entry) ? entry : {}),
      id: `bundle-${bundleId}`,
      type: "bundle",
      name: name || `Bundle ${bundleId}`,
      quantity: 1
    }]
  })
}

function getPrintablePackageChildren(lineItems: InvoiceLineNode[]): InvoiceLineNode[] {
  return lineItems.flatMap(item => {
    if (!isPackageLine(item)) return [item]

    const payloadChildren = getPackagePayloadChildren(item)
    const bundleLines = [
      ...payloadChildren.filter(isBundleLine),
      ...getPackageBundleMetadataLines(item)
    ]
    const individualLines = payloadChildren.filter(child => !isBundleLine(child))

    return [
      ...dedupeInvoiceChildren(bundleLines),
      ...individualLines
    ]
  })
}

function sortBundleLinesFirst(items: InvoiceLineNode[]): InvoiceLineNode[] {
  const bundleLines = items.filter(isBundleLine)
  const otherLines = items.filter(item => !isBundleLine(item))

  return [
    ...bundleLines,
    ...otherLines
  ]
}

function buildSelectedAppointmentRowsFromBillingLines(lineItems: InvoiceLineNode[]): TableRow[] {
  const appointmentDate = getAppointmentDate()
  const sessionSequence = selectedAppointmentSessionSequences.value[0] || Number(billingDetail.value?.session_sequence ?? 1)
  const fallbackSessionLabel = getSelectedSessionLabel(lineItems)
  const packageChildren = sortBundleLinesFirst(getPrintablePackageChildren(lineItems))
  const hasPackageSource = lineItems.some(isPackageLine)
  const rows: TableRow[] = []

  const resolveLineSessionLabel = (item: InvoiceLineNode, occurrence = 1, totalOccurrences = 1): string => {
    const explicit = String(
      item.session_sequence_label ??
      item.sessionSequenceLabel ??
      item.session_sequence ??
      item.sessionSequence ??
      ""
    ).trim()

    if (totalOccurrences > 1) return `${occurrence} of ${totalOccurrences}`

    return explicit || fallbackSessionLabel
  }

  const addMainRow = (
    serviceName: string,
    unitTotal: number | null,
    item?: InvoiceLineNode,
    occurrence = 1,
    totalOccurrences = 1
  ): void => {
    rows.push({
      key: `main-${rows.length}-${serviceName}`,
      itemNo: nextItemNo(rows),
      treatmentDate: appointmentDate,
      serviceName,
      sessionSequence: item ? resolveLineSessionLabel(item, occurrence, totalOccurrences) : fallbackSessionLabel,
      unitTotal,
      level: 0,
      isParent: false
    })
  }

  for (const item of packageChildren) {
    if (isBundleLine(item)) {
      const bundlePrice = getBundleContractPrice(item)
      addMainRow(getBundleDisplayName(item), bundlePrice, item)

      const bundleChildren = filterLinesForSession(getBundleChildren(item), sessionSequence)

      for (const child of bundleChildren) {
        rows.push({
          key: `bundle-child-${rows.length}-${String(child.id ?? child.name ?? "item")}`,
          itemNo: 0,
          treatmentDate: appointmentDate,
          serviceName: `- ${stripPackageSessionSuffix(getServiceName(child))}`,
          sessionSequence: fallbackSessionLabel,
          unitTotal: null,
          level: 1,
          isParent: false
        })
      }

      continue
    }

    const quantity = hasPackageSource ? 1 : getQuantity(item)

    for (let occurrence = 1; occurrence <= quantity; occurrence += 1) {
      addMainRow(
        stripPackageSessionSuffix(getServiceName(item)),
        getLineUnitPrice(item),
        item,
        occurrence,
        quantity
      )
    }
  }

  return rows
}

function buildFallbackAppointmentRows(): TableRow[] {
  const appointment = selectedAppointment.value

  if (appointment) {
    return [{
      key: `appointment-${appointment.appointment_id}`,
      itemNo: 1,
      treatmentDate: appointment.appointment_date || billingDetail.value?.created_at || "",
      serviceName: appointment.package_name || "LGU appointment",
      sessionSequence: getSelectedSessionLabel([]),
      unitTotal: Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? 0),
      level: 0,
      isParent: false
    }]
  }

  const billing = billingDetail.value
  if (!billing) return []

  const serviceName =
    getBillingText("package_name") ||
    getBillingText("service_name") ||
    getBillingText("service_type") ||
    "LGU billing"

  return [{
    key: `billing-fallback-${billing.id ?? "record"}`,
    itemNo: 1,
    treatmentDate: getAppointmentDate(),
    serviceName: stripPackageSessionSuffix(serviceName),
    sessionSequence: getSelectedSessionLabel([]),
    unitTotal: Number(billing.total_amount ?? billing.amount_due ?? 0),
    level: 0,
    isParent: false
  }]
}

function hasNestedInvoiceLineItems(value?: string | null): boolean {
  return parseInvoiceLineItems(value).some(item => getPayloadChildren(item).length > 0)
}

function mergeClaimBillingJson(
  billing: BillingListItem | null,
  claimBilling?: LguPatientCreditDetail["billings"][number] | null
): BillingListItem | null {
  if (!billing) return billing

  const claimConsumedJson = getConsumedServicesJson(claimBilling)
  const billingConsumedJson = getConsumedServicesJson(billing)
  const billingWithConsumedJson = claimConsumedJson && !billingConsumedJson
    ? { ...billing, consumed_services_json: claimConsumedJson }
    : billing

  if (!claimBilling?.line_items_json) return billingWithConsumedJson

  const contextHasChildren = hasNestedInvoiceLineItems(billingWithConsumedJson.line_items_json)
  const claimHasChildren = hasNestedInvoiceLineItems(claimBilling.line_items_json)

  if (!claimHasChildren || contextHasChildren) return billingWithConsumedJson

  return {
    ...billingWithConsumedJson,
    service_name: claimBilling.service_name ?? billingWithConsumedJson.service_name,
    package_name: claimBilling.package_name ?? billingWithConsumedJson.package_name,
    line_items_json: claimBilling.line_items_json,
    amount_due: Number(claimBilling.amount_due ?? billingWithConsumedJson.amount_due),
    pricing_source: claimBilling.pricing_source ?? billingWithConsumedJson.pricing_source
  }
}

function printableDocumentToBillingDetail(document: PrintableBillingDocument): BillingListItem {
  const appointment = (document.appointment ?? {}) as AnyRecord
  const sponsor = (document.sponsor ?? {}) as AnyRecord
  const creditAccount = (document.credit_account ?? {}) as AnyRecord
  const sessionSequence = Number(appointment.session_sequence ?? 0)
  const totalSessions = Number(appointment.total_sessions ?? 0)

  return {
    id: document.header.id,
    public_id: document.header.document_number ?? `BD-${document.header.id}`,
    created_at: document.header.document_date,
    patient_id: document.patient.id,
    patient_name: document.patient.name,
    patient_age: document.patient.age == null ? undefined : String(document.patient.age),
    patient_address: document.patient.address ?? undefined,
    patient_gender: document.patient.gender ?? undefined,
    appointment_id: appointment.id == null ? undefined : Number(appointment.id),
    session_sequence: sessionSequence > 0 ? sessionSequence : undefined,
    session_sequence_label: sessionSequence > 0 && totalSessions > 0 ? `${sessionSequence} of ${totalSessions}` : undefined,
    total_sessions: totalSessions > 0 ? totalSessions : undefined,
    billing_type: "LGU_BILLING",
    service_type: document.header.document_type,
    service_name: document.lines.find(line => Number(line.line_total ?? 0) > 0)?.service_name ?? document.header.document_type,
    line_items_json: JSON.stringify(document.lines),
    package_name: String(creditAccount.package_name ?? creditAccount.account_name ?? ""),
    billing_status: document.header.document_status,
    amount_due: document.totals.total,
    amount_paid: document.totals.paid,
    subtotal_amount: document.totals.subtotal,
    discount_amount: document.totals.discount,
    tax_amount: document.totals.tax,
    total_amount: document.totals.total,
    pricing_tier: document.header.pricing_mode ?? undefined,
    pricing_source: document.header.pricing_source ?? undefined,
    clinic_id: document.clinic?.id,
    clinic_name: document.clinic?.name ?? undefined,
    balance_amount: document.totals.balance,
    physical_therapist: String(appointment.provider_name ?? ""),
    physical_therapist_name: String(appointment.provider_name ?? ""),
    doctor: String(appointment.referring_staff_name ?? ""),
    doctor_name: String(appointment.referring_staff_name ?? ""),
    diagnosis: String(appointment.diagnosis ?? ""),
    lgu_program_name: String(sponsor.lgu_program_name ?? sponsor.lgu_company_name ?? ""),
    lgu_reference_label: String(sponsor.lgu_referral_form_no ?? ""),
    lgu_patient_referral_form_no: String(sponsor.lgu_referral_form_no ?? ""),
    lgu_date_issued: String(sponsor.lgu_referral_issued_date ?? document.header.document_date),
    lgu_patient_program_status: String(sponsor.lgu_status ?? ""),
    sponsor_approval_code: String(sponsor.lgu_approval_code ?? "")
  } as BillingListItem
}

async function load(): Promise<void> {
  error.value = ""
  detail.value = null
  sponsorInfo.value = null
  billingDetail.value = null
  printableDocument.value = null

  if (!patientId.value && !billingId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    let selectedBilling: BillingListItem | null = null
    let selectedPatientId = patientId.value

    if (billingId.value) {
      const printable = await appointmentBillingService
        .getPrintableBillingDocument(billingId.value)
        .catch(() => null)

      if (printable) {
        printableDocument.value = printable
        selectedBilling = printableDocumentToBillingDetail(printable)
      } else {
        selectedBilling = (await billingContextTanstackService.fetchContext(queryClient, billingId.value))?.billing ?? null
      }

      if (!selectedBilling) {
        error.value = "Billing record was not found."
        return
      }

      selectedPatientId = Number(selectedBilling.patient_id)
      billingDetail.value = selectedBilling
    }

    const periodYear = transactionPeriodEndDate.value?.getFullYear()
    const periodMonth = transactionPeriodEndDate.value ? transactionPeriodEndDate.value.getMonth() + 1 : undefined

    const [detailResult, sponsorResult] = await Promise.all([
      lguBillingService
        .getPatientCreditDetail(selectedPatientId, periodYear, periodMonth)
        .catch(() => null),
      patientTanstackService
        .fetchContext(queryClient, selectedPatientId)
        .catch(() => null)
    ])

    detail.value = detailResult ?? null
    sponsorInfo.value = (sponsorResult?.sponsor_information ?? []).find(item => item.sponsor_context === "LGU") ?? null

    const latestBilling = selectedBilling ?? detail.value?.billings?.[0]

    if (!billingDetail.value && latestBilling?.id) {
      billingDetail.value = (await billingContextTanstackService.fetchContext(queryClient, latestBilling.id))?.billing ?? null
    }

    const claimBilling = detail.value?.billings?.find(item =>
      Number(item.id) === Number(billingDetail.value?.id ?? latestBilling?.id ?? 0)
    ) ?? latestBilling ?? null

    billingDetail.value = mergeClaimBillingJson(billingDetail.value, claimBilling)
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
.patient-billing-summary-table .col-item-no {
  width: 11%;
}

.patient-billing-summary-table .col-treatment-date {
  width: 18%;
}

.patient-billing-summary-table .col-service-rendered {
  width: 36%;
}

.patient-billing-summary-table .col-session-sequence {
  width: 18%;
}

.patient-billing-summary-table .col-unit-total {
  width: 17%;
}

.service-name-cell {
  font-weight: 600;
}

.empty-row {
  padding: 14px 10px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

@media print {
  .patient-billing-summary-table .col-item-no {
    width: 9%;
  }

  .patient-billing-summary-table .col-treatment-date {
    width: 17%;
  }

  .patient-billing-summary-table .col-service-rendered {
    width: 38%;
  }

  .patient-billing-summary-table .col-session-sequence {
    width: 18%;
  }

  .patient-billing-summary-table .col-unit-total {
    width: 18%;
  }

  .service-name-cell {
    font-weight: 600;
  }

  :global(html.lgu-print-portrait) .patient-billing-summary-table .col-item-no {
    width: 9%;
  }

  :global(html.lgu-print-portrait) .patient-billing-summary-table .col-treatment-date {
    width: 18%;
  }

  :global(html.lgu-print-portrait) .patient-billing-summary-table .col-service-rendered {
    width: 35%;
  }

  :global(html.lgu-print-portrait) .patient-billing-summary-table .col-session-sequence {
    width: 20%;
  }

  :global(html.lgu-print-portrait) .patient-billing-summary-table .col-unit-total {
    width: 18%;
  }

  :global(html.lgu-print-landscape) .patient-billing-summary-table .col-item-no {
    width: 10%;
  }

  :global(html.lgu-print-landscape) .patient-billing-summary-table .col-treatment-date {
    width: 17%;
  }

  :global(html.lgu-print-landscape) .patient-billing-summary-table .col-service-rendered {
    width: 39%;
  }

  :global(html.lgu-print-landscape) .patient-billing-summary-table .col-session-sequence {
    width: 17%;
  }

  :global(html.lgu-print-landscape) .patient-billing-summary-table .col-unit-total {
    width: 17%;
  }
}
</style>
