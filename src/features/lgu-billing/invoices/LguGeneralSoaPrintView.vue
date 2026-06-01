<template>
  <LguInvoiceLayout
    title="STATEMENT OF ACCOUNT"
    :subtitle="`statement for ${partnerLabel}`"
    :has-error="!!error"
  >


    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-else #details>
      <div class="details-grid">
        <div class="details-group">
          <div class="line">
            <span class="label">Partner Institution:</span>
            <span>{{ partnerLabel }}</span>
          </div>

          <div class="line">
            <span class="label">Billing Date:</span>
            <span>{{ billingDateLabel }}</span>
          </div>
        </div>

        <div class="details-group">
          <div class="line">
            <span class="label">Transaction Period:</span>
            <span>{{ periodLabel }}</span>
          </div>

          <div class="line">
            <span class="label">Patient Count:</span>
            <span>{{ patientCount }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="soa-table">
          <thead>
            <tr>
              <th class="col-item text-center">ITEM No.</th>
              <th class="col-patient">PATIENT NAME</th>
              <th class="col-referral">Referral Form No.</th>
              <th class="col-reference">REFERENCE NO.</th>
              <th class="col-status">PROGRAM STATUS</th>
              <th class="col-date text-center">TREATMENT DATE</th>
              <th class="col-service">PT SERVICE RENDERED</th>
              <th class="col-session text-center">SESSION SEQUENCE</th>
              <th class="col-total text-right">INVOICE BILLING TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="row in rows" :key="row.key">
              <tr v-if="row.kind === 'service'">
                <td class="text-center">{{ row.itemNo ?? "" }}</td>
                <td>{{ row.patientName }}</td>
                <td>{{ row.referralFormNo }}</td>
                <td>{{ row.referenceNo }}</td>
                <td>{{ row.programStatus }}</td>
                <td class="text-center">{{ formatDate(row.treatmentDate) }}</td>
                <td>{{ row.serviceName }}</td>
                <td class="text-center">{{ row.sessionSequence }}</td>
                <td class="text-right">{{ formatPrice(row.price) }}</td>
              </tr>

              <tr v-else class="patient-total-row">
                <td colspan="8" class="text-right">
                  Patient Billing Summary Total:
                </td>
                <td class="text-right">
                  {{ asCurrency(row.total) }}
                </td>
              </tr>
            </template>
          </tbody>

          <tfoot>
            <tr class="grand-total-row">
              <td colspan="8" class="text-right">
                GRAND TOTAL:
              </td>
              <td class="text-right">
                {{ asCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class="flex justify-end w-full">
        <!-- <section class="payment-box">
          <h3>LGU DETAILS</h3>
          <div><strong>Partner Institution:</strong> {{ partnerLabel }}</div>
          <div><strong>Billing Date:</strong> {{ billingDateLabel }}</div>
          <div><strong>Transaction Period:</strong> {{ periodLabel }}</div>
        </section> -->
        <section class="approval">
          <div><strong>Approved By:</strong></div>
          <div class="name">
            RENALOU B. CORDOVA, PTRP, UK-PT
          </div>
          <div class="title">
            Chief Operations Officer
          </div>
          <div class="signed">
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
import {
  billingPhase1Service,
  type HmoRecentHistoryItem
} from "@/features/billing/api/billing-phase1.service"
import {
  lguBillingService,
  type LguDashboardHistoryItem,
  type LguPatientCreditDetail
} from "@/features/lgu-billing/api/lgu-billing.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  formatLguStatus,
  isLguCompletedStatus,
  isLguDropoutStatus,
  normalizeLguStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { patientHMOInformationService } from "@/services/patient-hmo-information.service"

type Payer = "hmo" | "lgu"

type ServiceSoaRow = {
  kind: "service"
  key: string
  itemNo: number | null
  patientName: string
  referralFormNo: string
  referenceNo: string
  programStatus: string
  treatmentDate: string | null
  serviceName: string
  sessionSequence: string
  price: number | null
}

type PatientTotalRow = {
  kind: "patientTotal"
  key: string
  total: number
}

type SoaDisplayRow = ServiceSoaRow | PatientTotalRow

type PatientSoaContext = {
  referralFormNo?: string | null
  referralIssuedDate?: string | null
  completedSessionSequences: number[]
}

type InvoiceLineItem = {
  id?: number | string
  type?: string
  name?: string
  description?: string

  service_name?: string
  serviceName?: string
  pt_service_rendered?: string
  ptServiceRendered?: string

  package_name?: string
  packageName?: string
  parent_service_name?: string
  parentServiceName?: string

  treatment_date?: string
  treatmentDate?: string
  appointment_date?: string
  appointmentDate?: string
  completed_at?: string
  completedAt?: string
  created_at?: string
  createdAt?: string

  session_sequence?: string
  sessionSequence?: string
  session_no?: number | string
  sessionNo?: number | string
  session_number?: number | string
  sessionNumber?: number | string
  total_sessions?: number | string
  totalSessions?: number | string
  quantity?: number | string
  qty?: number | string

  lgu_contract_price?: number | string
  lguContractPrice?: number | string
  lgu_price?: number | string
  lguPrice?: number | string
  contract_price?: number | string
  contractPrice?: number | string
  contract_unit_price?: number | string
  contractUnitPrice?: number | string
  approved_price?: number | string
  approvedPrice?: number | string

  price?: number | string
  unit_price?: number | string
  unitPrice?: number | string
  service_price?: number | string
  servicePrice?: number | string

  line_total?: number | string
  lineTotal?: number | string
  total?: number | string
  subtotal?: number | string
  amount?: number | string
  amount_due?: number | string
  amountDue?: number | string
  amount_out?: number | string
  amountOut?: number | string
  total_amount?: number | string
  totalAmount?: number | string

  children?: InvoiceLineItem[]
  subItems?: InvoiceLineItem[]
  sub_items?: InvoiceLineItem[]
  items?: InvoiceLineItem[]
  services?: InvoiceLineItem[]
  line_items?: InvoiceLineItem[]
  lineItems?: InvoiceLineItem[]
  included_services?: InvoiceLineItem[]
  includedServices?: InvoiceLineItem[]
  package_services?: InvoiceLineItem[]
  packageServices?: InvoiceLineItem[]
  child_services?: InvoiceLineItem[]
  childServices?: InvoiceLineItem[]
  service_inclusions?: InvoiceLineItem[]
  serviceInclusions?: InvoiceLineItem[]
  package_inclusions?: InvoiceLineItem[]
  packageInclusions?: InvoiceLineItem[]
  availed_services?: Array<InvoiceLineItem | string>
  availedServices?: Array<InvoiceLineItem | string>
}

type LguSoaHistoryItem = LguDashboardHistoryItem & InvoiceLineItem & {
  line_items_json?: string | null
  lineItemsJson?: string | null
}

type HmoSoaHistoryItem = HmoRecentHistoryItem & InvoiceLineItem & {
  program_status?: string | null
  reference_label?: string | null
  phase1_billing_public_id?: string | null
  line_items_json?: string | null
  lineItemsJson?: string | null
}

const { printPage, goBack } = useLguInvoicePrintActions()

const CHILD_SERVICE_KEYS = [
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
  "availedServices"
]

const CHILD_SERVICE_JSON_KEYS = [
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
  "availedServicesJson"
]

const CONTRACT_PRICE_KEYS = [
  "lgu_contract_price",
  "lguContractPrice",
  "lgu_price",
  "lguPrice",
  "contract_price",
  "contractPrice",
  "contract_unit_price",
  "contractUnitPrice",
  "package_unit_price",
  "packageUnitPrice",
  "standard_unit_price",
  "standardUnitPrice",
  "approved_price",
  "approvedPrice",
  "price"
]

const DROPOUT_PRICE_KEYS = [
  "dropout_unit_price",
  "dropoutUnitPrice",
  "dropout_price",
  "dropoutPrice"
]

const UNIT_PRICE_KEYS = [
  "unit_price",
  "unitPrice",
  "price",
  "service_price",
  "servicePrice"
]

const LINE_TOTAL_KEYS = [
  "line_total",
  "lineTotal",
  "total",
  "subtotal",
  "amount",
  "amount_due",
  "amountDue",
  "amount_out",
  "amountOut",
  "invoice_billing_total",
  "invoiceBillingTotal",
  "total_amount",
  "totalAmount"
]

const route = useRoute()

const rows = ref<SoaDisplayRow[]>([])
const error = ref("")

const payer = computed<Payer>(() => {
  const normalized = String(route.params.payer ?? "").trim().toLowerCase()
  return normalized === "hmo" ? "hmo" : "lgu"
})

const dateFrom = computed(() => String(route.query.from ?? "").trim())
const dateTo = computed(() => String(route.query.to ?? "").trim())
const programName = computed(() => String(route.query.program_name ?? "").trim())
const hmoName = computed(() => String(route.query.hmo_name ?? "").trim())

const programId = computed(() => getPositiveRouteNumber(route.query.program_id))
const hmoId = computed(() => getPositiveRouteNumber(route.query.hmo_id))

const dateSigned = computed(() => new Date().toLocaleDateString("en-PH"))

const partnerLabel = computed(() => {
  if (payer.value === "lgu") {
    return programName.value ? `${programName.value}` : "LGU"
  }

  return hmoName.value ? `HMO - ${hmoName.value}` : "HMO"
})

const billingDateLabel = computed(() => {
  const endDate = parseDate(dateTo.value)

  if (!endDate) {
    return new Date().toLocaleDateString("en-PH")
  }

  return new Date(
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    0
  ).toLocaleDateString("en-PH")
})

const periodLabel = computed(() => {
  const from = formatDate(dateFrom.value)
  const to = formatDate(dateTo.value)

  if (from === "-" && to === "-") return "-"
  return `${from} to ${to}`
})

const serviceRows = computed(() =>
  rows.value.filter((row): row is ServiceSoaRow => row.kind === "service")
)

const patientCount = computed(() =>
  rows.value.filter(row => row.kind === "patientTotal").length
)

const grandTotal = computed(() =>
  serviceRows.value.reduce((sum, row) => {
    return sum + Number(row.price ?? 0)
  }, 0)
)

const getRecordValue = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined
  return (record as Record<string, unknown>)[key]
}

const getText = (
  record: unknown,
  keys: string[],
  fallback = ""
): string => {
  for (const key of keys) {
    const value = String(getRecordValue(record, key) ?? "").trim()

    if (value) {
      return value
    }
  }

  return fallback
}

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null

  const normalized =
    typeof value === "string"
      ? value.replace(/[^\d.-]/g, "")
      : value

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const getAmount = (
  record: unknown,
  keys: string[]
): number | null => {
  for (const key of keys) {
    const parsed = parseNumber(getRecordValue(record, key))

    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

const getPositiveRouteNumber = (value: unknown): number | undefined => {
  const parsed = Number(String(value ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDate = (value?: string | null): string => {
  const parsed = parseDate(value)
  return parsed ? parsed.toLocaleDateString("en-PH") : "-"
}

const asCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  })

const formatPrice = (value?: number | null): string => {
  if (value === null || value === undefined) return "-"
  return Number(value) > 0 ? asCurrency(value) : "FREE"
}

const normalizeKey = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase() || "unknown"

const getTimestamp = (record: unknown): number => {
  const rawDate = getText(record, [
    "treatment_date",
    "treatmentDate",
    "appointment_date",
    "appointmentDate",
    "completed_at",
    "completedAt",
    "created_at",
    "createdAt"
  ])

  return parseDate(rawDate)?.getTime() ?? 0
}

const getPatientName = (item: unknown): string =>
  getText(item, ["patient_name", "patientName"], "Unknown Patient")

const getReferralFormNo = (
  item: unknown,
  context?: PatientSoaContext
): string =>
  String(context?.referralFormNo ?? "").trim() ||
  getText(item, [
    "lgu_patient_referral_form_no",
    "lguPatientReferralFormNo",
    "referral_form_no",
    "referralFormNo",
  ], "-")

const getReferenceNo = (item: unknown): string =>
  getText(item, [
    "phase1_billing_public_id",
    "phase1BillingPublicId",
    "receipt_number",
    "receiptNumber",
    "reference_no",
    "referenceNo"
  ], "-")

const getPricingSource = (item: unknown): string =>
  getText(item, ["pricing_source", "pricingSource"])

const getProgramStatus = (item: unknown): string =>
  (() => {
    const pricingSource = String(getPricingSource(item)).trim().toUpperCase()

    if (pricingSource === "LGU_DROPOUT_INDIVIDUAL_CLAIM" || pricingSource === "LGU_DROPOUT_PACKAGE_CLAIM") {
      return "DROPPED_OUT"
    }

    if (pricingSource === "LGU_PACKAGE_MONTHLY_CLAIM") {
      return "COMPLETED"
    }

    return getText(item, [
      "program_status",
      "programStatus",
      "lgu_patient_program_status",
      "lguPatientProgramStatus",
      "billing_status",
      "billingStatus",
      "usage_status",
      "usageStatus"
    ], "-")
  })()

const normalizeProgramStatus = (value: string): string =>
  normalizeLguStatus(value)

const isCompletedProgramStatus = (value: string): boolean => isLguCompletedStatus(value)

const isCrossMonthDropoutProgramStatus = (value: string): boolean =>
  normalizeProgramStatus(value) === "CROSS_MONTH_DROPPED_OUT"

const formatProgramStatus = (value: string): string => formatLguStatus(value)

const isDropoutProgramStatus = (value: string): boolean => {
  return isLguDropoutStatus(value)
}

const resolvePatientProgramStatus = (patientItems: unknown[]): string => {
  const itemStatuses = patientItems.map(item => normalizeProgramStatus(getProgramStatus(item)))
  const pricingSources = patientItems.map(item => normalizeProgramStatus(getPricingSource(item)))

  if (
    itemStatuses.some(isCrossMonthDropoutProgramStatus)
  ) {
    return "CROSS_MONTH_DROPPED_OUT"
  }

  if (
    patientItems.some(item => {
      const pricingSource = normalizeProgramStatus(getPricingSource(item))
      return pricingSource === "LGU_DROPOUT_INDIVIDUAL_CLAIM" || pricingSource === "LGU_DROPOUT_PACKAGE_CLAIM"
    }) ||
    itemStatuses.includes("DROPPED_OUT") ||
    pricingSources.some(source => source === "LGU_DROPOUT_INDIVIDUAL_CLAIM" || source === "LGU_DROPOUT_PACKAGE_CLAIM")
  ) {
    return "DROPPED_OUT"
  }

  if (
    patientItems.some(item => normalizeProgramStatus(getPricingSource(item)) === "LGU_PACKAGE_MONTHLY_CLAIM") ||
    itemStatuses.some(isCompletedProgramStatus)
  ) {
    return "COMPLETED"
  }

  return getProgramStatus(patientItems[0] ?? null)
}

const getTreatmentDate = (
  lineItem: unknown,
  parentItem: unknown,
  context?: PatientSoaContext
): string | null =>
  String(context?.referralIssuedDate ?? "").trim() ||
  getText(parentItem, [
    "lgu_date_issued",
    "lguDateIssued",
    "referral_issued_date",
    "referralIssuedDate"
  ]) ||
  getText(lineItem, [
    "treatment_date",
    "treatmentDate",
    "appointment_date",
    "appointmentDate",
    "completed_at",
    "completedAt"
  ]) ||
  getText(parentItem, [
    "treatment_date",
    "treatmentDate",
    "appointment_date",
    "appointmentDate",
    "completed_at",
    "completedAt",
    "created_at",
    "createdAt"
  ]) ||
  null

const getServiceName = (
  lineItem: unknown,
  parentItem?: unknown
): string =>
  getText(lineItem, [
    "service_name",
    "serviceName",
    "pt_service_rendered",
    "ptServiceRendered",
    "name",
    "description"
  ]) ||
  getText(parentItem, [
    "service_name",
    "serviceName",
    "pt_service_rendered",
    "ptServiceRendered"
  ], "-")

const getQuantity = (record: unknown): number => {
  const parsed = getAmount(record, ["quantity", "qty"])
  return parsed && parsed > 0 ? Math.floor(parsed) : 1
}

const getServiceQuantity = (
  lineItem: unknown,
  parentItem: unknown,
  isDropoutPatient: boolean,
  completedSessionCount = 0
): number => {
  void parentItem

  if (isDropoutPatient) {
    return Math.max(1, Math.min(getQuantity(lineItem), Math.max(1, completedSessionCount)))
  }

  return getQuantity(lineItem)
}

const normalizeSessionSequence = (value: string): string => {
  const trimmed = value.trim()

  if (!trimmed) return ""

  return trimmed
    .replace(/\s*\/\s*/g, " of ")
    .replace(/\d+(\.\d+)?/g, match => String(Math.floor(Number(match))))
}

const getSessionSequence = (
  lineItem: unknown,
  parentItem: unknown
): string => {
  const explicit =
    getText(lineItem, ["session_sequence", "sessionSequence"]) ||
    getText(parentItem, ["session_sequence", "sessionSequence"])

  if (explicit) {
    return normalizeSessionSequence(explicit)
  }

  const sessionNo = getAmount(lineItem, [
    "session_no",
    "sessionNo",
    "session_number",
    "sessionNumber"
  ])

  const totalSessions =
    getAmount(lineItem, ["total_sessions", "totalSessions"]) ??
    getAmount(parentItem, ["total_sessions", "totalSessions", "quantity", "qty"])

  if (sessionNo && totalSessions) {
    return `${Math.floor(sessionNo)} of ${Math.floor(totalSessions)}`
  }

  return ""
}

const getOccurrenceSessionSequence = (
  lineItem: unknown,
  parentItem: unknown,
  occurrence: number,
  totalOccurrences: number,
  isDropoutPatient = false,
  sequenceOverride?: number,
  configuredTotal?: number
): string => {
  const explicit = getSessionSequence(lineItem, parentItem)

  if (isDropoutPatient) {
    const sessionNo = Math.max(1, Math.floor(Number(sequenceOverride ?? occurrence)))
    const totalSessions = Math.max(1, Math.floor(Number(configuredTotal ?? totalOccurrences)))
    return `${sessionNo} of ${totalSessions}`
  }

  if (totalOccurrences > 1) {
    return `${occurrence} of ${totalOccurrences}`
  }

  return explicit || "1 of 1"
}

const isPackageLine = (item: InvoiceLineItem): boolean => {
  const type = getText(item, ["type"]).toLowerCase()
  const serviceName = getText(item, [
    "service_name",
    "serviceName",
    "pt_service_rendered",
    "ptServiceRendered"
  ])

  if (type === "package" || type === "bundle" || type === "parent") {
    return true
  }

  /*
    When a row has an actual service name, do not treat it as a package
    just because it also carries package_name metadata.
  */
  if (serviceName) {
    return false
  }

  const label = getText(item, [
    "name",
    "package_name",
    "packageName",
    "description"
  ]).toLowerCase()

  return label.includes("package")
}

const getIndexedArrayValue = (
  record: unknown,
  keys: string[],
  index: number
): unknown => {
  for (const key of keys) {
    const value = getRecordValue(record, key)

    if (Array.isArray(value) && index >= 0 && index < value.length) {
      return value[index]
    }
  }

  return undefined
}

const toInvoiceLineItem = (
  value: unknown,
  parentItem?: unknown,
  index = 0
): InvoiceLineItem | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === "string") {
    const contractPrice = getIndexedArrayValue(parentItem, [
      "lgu_contract_prices",
      "lguContractPrices",
      "contract_prices",
      "contractPrices",
      "service_prices",
      "servicePrices",
      "prices"
    ], index)

    const sessionSequence = getIndexedArrayValue(parentItem, [
      "session_sequences",
      "sessionSequences"
    ], index)

    return {
      service_name: value,
      name: value,
      lgu_contract_price: contractPrice as number | string | undefined,
      session_sequence: sessionSequence as string | undefined
    }
  }

  if (typeof value === "object") {
    return value as InvoiceLineItem
  }

  return null
}

const parseJsonArray = (
  value: unknown,
  parentItem?: unknown
): InvoiceLineItem[] => {
  if (!value || typeof value !== "string") {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown

    return Array.isArray(parsed)
      ? parsed
          .map((entry, index) => toInvoiceLineItem(entry, parentItem, index))
          .filter((entry): entry is InvoiceLineItem => !!entry)
      : []
  } catch {
    return []
  }
}

const getChildArrayFromRecord = (
  record: unknown,
  keys: string[]
): InvoiceLineItem[] => {
  const output: InvoiceLineItem[] = []

  keys.forEach(key => {
    const value = getRecordValue(record, key)

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const lineItem = toInvoiceLineItem(entry, record, index)

        if (lineItem) {
          output.push(lineItem)
        }
      })

      return
    }

    if (typeof value === "string") {
      output.push(...parseJsonArray(value, record))
    }
  })

  return output
}

const getJsonChildArrayFromRecord = (
  record: unknown,
  keys: string[]
): InvoiceLineItem[] => {
  return keys.flatMap(key => {
    return parseJsonArray(getRecordValue(record, key), record)
  })
}

const getChildren = (item: InvoiceLineItem): InvoiceLineItem[] => [
  ...getChildArrayFromRecord(item, CHILD_SERVICE_KEYS),
  ...getJsonChildArrayFromRecord(item, CHILD_SERVICE_JSON_KEYS)
]

const getArrayLineItems = (item: unknown): InvoiceLineItem[] => [
  ...getChildArrayFromRecord(item, CHILD_SERVICE_KEYS),
  ...getJsonChildArrayFromRecord(item, CHILD_SERVICE_JSON_KEYS)
]

const hasRenderableServiceLine = (item: unknown): boolean => {
  const serviceName = getServiceName(item)

  return !!serviceName && serviceName !== "-" && !isPackageLine(item as InvoiceLineItem)
}

const isSameAsParentPackage = (
  lineItem: InvoiceLineItem,
  parentItem: unknown
): boolean => {
  const serviceName = normalizeKey(getServiceName(lineItem, parentItem))
  const parentName = normalizeKey(
    getText(parentItem, [
      "package_name",
      "packageName",
      "parent_service_name",
      "parentServiceName"
    ])
  )

  return !!parentName && serviceName === parentName
}

const getRenderableServiceLines = (item: InvoiceLineItem): InvoiceLineItem[] => {
  const children = getChildren(item)

  if (children.length) {
    return children.filter(child => hasRenderableServiceLine(child))
  }

  return hasRenderableServiceLine(item) ? [item] : []
}

const dedupeServiceLines = (
  lines: InvoiceLineItem[],
  parentItem: unknown
): InvoiceLineItem[] => {
  const seen = new Set<string>()

  return lines.filter(line => {
    const key = [
      getServiceName(line, parentItem),
      getTreatmentDate(line, parentItem),
      getSessionSequence(line, parentItem),
      getAmount(line, [...CONTRACT_PRICE_KEYS, ...UNIT_PRICE_KEYS, ...LINE_TOTAL_KEYS]) ?? ""
    ].join("|")

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const shouldUseDirectSoaServiceRow = (item: unknown): boolean => {
  const explicitRenderedService = getText(item, [
    "pt_service_rendered",
    "ptServiceRendered"
  ])

  if (explicitRenderedService && !isPackageLine(item as InvoiceLineItem)) {
    return true
  }

  const directServiceName = getText(item, ["service_name", "serviceName"])
  const packageName = getText(item, [
    "package_name",
    "packageName",
    "parent_service_name",
    "parentServiceName"
  ])

  /*
    Avoid displaying the package or parent service as the fallback.
    Only use a direct SOA row when it does not look like a package container.
  */
  return !!directServiceName &&
    !packageName &&
    !isPackageLine(item as InvoiceLineItem)
}

const extractIncludedServiceLines = (item: unknown): InvoiceLineItem[] => {
  const topLevelItems = getArrayLineItems(item)

  if (topLevelItems.length) {
    const serviceLines = topLevelItems.flatMap(lineItem => {
      return getRenderableServiceLines(lineItem)
    })

    const filteredLines = serviceLines.filter(lineItem => {
      return !isSameAsParentPackage(lineItem, item) && !isPackageLine(lineItem)
    })

    if (filteredLines.length) {
      return dedupeServiceLines(filteredLines, item)
    }
  }

  return shouldUseDirectSoaServiceRow(item)
    ? [item as InvoiceLineItem]
    : []
}

const getContractPrice = (
  lineItem: unknown,
  parentItem: unknown,
  hasExtractedServiceLines: boolean,
  isDropoutPatient: boolean
): number | null => {
  const priceKeys = isDropoutPatient
    ? [
        ...DROPOUT_PRICE_KEYS,
        ...CONTRACT_PRICE_KEYS
      ]
    : CONTRACT_PRICE_KEYS

  const contractPrice = getAmount(lineItem, priceKeys)

  if (contractPrice !== null) {
    return contractPrice
  }

  const unitPrice = getAmount(lineItem, UNIT_PRICE_KEYS)

  if (unitPrice !== null) {
    return unitPrice
  }

  const lineTotal = getAmount(lineItem, LINE_TOTAL_KEYS)

  if (lineTotal !== null) {
    return lineTotal / getQuantity(lineItem)
  }

  /*
    Do not copy the package total into every child service row.
  */
  if (!hasExtractedServiceLines) {
    const parentContractPrice = getAmount(parentItem, priceKeys)

    if (parentContractPrice !== null) {
      return parentContractPrice
    }

    const parentAmount = getAmount(parentItem, LINE_TOTAL_KEYS)

    if (parentAmount !== null) {
      return parentAmount
    }
  }

  return null
}

const getPatientId = (item: unknown): number | null => {
  const parsed = getAmount(item, ["patient_id", "patientId"])
  return parsed && parsed > 0 ? Math.floor(parsed) : null
}

const getCompletedSessionSequences = (detail: LguPatientCreditDetail | null): number[] => {
  if (!detail) return []

  const statusByAppointmentId = new Map(
    (detail.appointments ?? []).map(appointment => [
      appointment.appointment_id,
      normalizeLguStatus(appointment.status)
    ])
  )

  const sequences = (detail.authorizations ?? [])
    .flatMap(authorization => authorization.sessions ?? [])
    .filter(session => statusByAppointmentId.get(session.appointment_id) === "COMPLETED")
    .map(session => Math.max(1, Math.floor(Number(session.session_sequence ?? 1))))
    .filter(sequence => Number.isFinite(sequence))
    .sort((left, right) => left - right)

  if (sequences.length) {
    return Array.from(new Set(sequences))
  }

  const completedCount = (detail.appointments ?? [])
    .filter(appointment => normalizeLguStatus(appointment.status) === "COMPLETED")
    .length

  return Array.from({ length: completedCount }, (_, index) => index + 1)
}

const buildPatientSoaContextMap = async (
  items: unknown[]
): Promise<Map<string, PatientSoaContext>> => {
  const patientIds = Array.from(
    new Set(
      items
        .map(getPatientId)
        .filter((patientId): patientId is number => Boolean(patientId))
    )
  )

  const entries = await Promise.all(patientIds.map(async patientId => {
    const [sponsorResult, detailResult] = await Promise.allSettled([
      patientHMOInformationService.getByPatientId(patientId),
      payer.value === "lgu"
        ? lguBillingService.getPatientCreditDetail(patientId)
        : Promise.resolve(null)
    ])

    const lguSponsor = sponsorResult.status === "fulfilled"
      ? (sponsorResult.value ?? []).find(item => item.sponsor_context === "LGU")
      : null
    const detail = detailResult.status === "fulfilled"
      ? detailResult.value ?? null
      : null

    return [
      String(patientId),
      {
        referralFormNo: lguSponsor?.referral_form_no,
        referralIssuedDate: lguSponsor?.referral_issued_date,
        completedSessionSequences: getCompletedSessionSequences(detail)
      }
    ] as const
  }))

  return new Map(entries)
}

const buildStatementRows = (
  items: unknown[],
  payerType: Payer,
  patientContextById = new Map<string, PatientSoaContext>()
): SoaDisplayRow[] => {
  const patientGroups = new Map<string, unknown[]>()

  items.forEach(item => {
    const patientName = getPatientName(item)
    const patientKey = normalizeKey(
      getText(item, ["patient_id", "patientId"]) || patientName
    )

    const group = patientGroups.get(patientKey) ?? []
    group.push(item)
    patientGroups.set(patientKey, group)
  })

  const outputRows: SoaDisplayRow[] = []
  let itemNo = 1

  Array.from(patientGroups.entries())
    .sort(([, leftItems], [, rightItems]) => {
      return getPatientName(leftItems[0]).localeCompare(getPatientName(rightItems[0]))
    })
    .forEach(([patientKey, patientItems]) => {
      const sortedItems = [...patientItems].sort((left, right) => {
        return getTimestamp(left) - getTimestamp(right)
      })
      const patientContext = patientContextById.get(patientKey)
      const completedSessionSequences = patientContext?.completedSessionSequences ?? []

      let patientTotal = 0
      let patientHasServiceRows = false
      let isFirstPatientRow = true
      const patientProgramStatus = resolvePatientProgramStatus(sortedItems)
      const isDropoutPatient = isDropoutProgramStatus(patientProgramStatus)

      sortedItems.forEach((item, itemIndex) => {
        const serviceLines = extractIncludedServiceLines(item)

        if (!serviceLines.length) {
          return
        }

        serviceLines.forEach((lineItem, lineIndex) => {
          const isDirectSoaServiceRow = lineItem === item
          const price = getContractPrice(lineItem, item, !isDirectSoaServiceRow, isDropoutPatient)
          const configuredQuantity = getQuantity(lineItem)
          const quantity = getServiceQuantity(
            lineItem,
            item,
            isDropoutPatient,
            completedSessionSequences.length
          )

          patientHasServiceRows = true

          for (let occurrence = 1; occurrence <= quantity; occurrence += 1) {
            const completedSessionSequence = completedSessionSequences[occurrence - 1] ?? occurrence
            patientTotal += Number(price ?? 0)

            outputRows.push({
              kind: "service",
              key: `service-${payerType}-${patientKey}-${itemIndex}-${lineIndex}-${occurrence}`,
              itemNo: isFirstPatientRow ? itemNo : null,
              patientName: isFirstPatientRow ? getPatientName(item) : "",
              referralFormNo: isFirstPatientRow ? getReferralFormNo(item, patientContext) : "",
              referenceNo: lineIndex === 0 && occurrence === 1 ? getReferenceNo(item) : "",
              programStatus: isFirstPatientRow ? formatProgramStatus(patientProgramStatus) : "",
              treatmentDate: getTreatmentDate(lineItem, item, patientContext),
              serviceName: getServiceName(lineItem, item),
              sessionSequence: getOccurrenceSessionSequence(
                lineItem,
                item,
                occurrence,
                quantity,
                isDropoutPatient,
                completedSessionSequence,
                configuredQuantity
              ),
              price
            })

            isFirstPatientRow = false
          }
        })
      })

      if (!patientHasServiceRows) {
        return
      }

      outputRows.push({
        kind: "patientTotal",
        key: `patient-total-${patientKey}`,
        total: patientTotal
      })

      itemNo += 1
    })

  return outputRows
}

const fetchLguSoa = async (
  from: string,
  to: string,
  programIdValue?: number
): Promise<LguDashboardHistoryItem[]> => {
  const baseParams = {
    from,
    to,
    limit: 5000
  }

  const params = programIdValue
    ? { ...baseParams, program_id: programIdValue }
    : baseParams

  const response = await lguBillingService.getSoa(params)
  return response ?? []
}

const load = async (): Promise<void> => {
  error.value = ""
  rows.value = []

  if (!dateFrom.value || !dateTo.value) {
    error.value = "Date range is required."
    return
  }

  try {
    if (payer.value === "hmo") {
      const data =
        await billingPhase1Service.getHmoSoa({
          from: dateFrom.value,
          to: dateTo.value,
          limit: 5000,
          hmo_id: hmoId.value
        }) ?? []

      rows.value = buildStatementRows(data as HmoSoaHistoryItem[], "hmo")
      return
    }

    try {
      const data = await fetchLguSoa(dateFrom.value, dateTo.value, programId.value)
      const patientContextById = await buildPatientSoaContextMap(data)
      rows.value = buildStatementRows(data as LguSoaHistoryItem[], "lgu", patientContextById)
    } catch (programFilteredError: unknown) {
      if (!programId.value) {
        throw programFilteredError
      }

      const data = await fetchLguSoa(dateFrom.value, dateTo.value)
      const patientContextById = await buildPatientSoaContextMap(data)
      rows.value = buildStatementRows(data as LguSoaHistoryItem[], "lgu", patientContextById)
    }
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err, {
      baseMessage: "Failed to load SOA records"
    })
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
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d31d6e;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.4;
}

.details-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.line {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px;
}

.label {
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: #000000;
  white-space: nowrap;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.soa-table {
  width: 100%;
  min-width: 1120px;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 6px;
  background: #ffffff;
  font-family: "Canva Sans", sans-serif;
  font-size: 11px;
  color: #000000;
}

.soa-table th,
.soa-table td {
  padding: 4px 5px;
  vertical-align: top;
  border: 1px solid #e5e7eb;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.soa-table th {
  text-align: center;
  font-family: "Montserrat", sans-serif;
  font-weight: 800;
  font-size: 10px;
  line-height: 1.1;
  background: #ffffff;
  border-top: 3px solid #d31d6e;
  border-bottom: 3px solid #d31d6e;
}

.col-item {
  width: 48px;
}

.col-patient {
  width: 105px;
}

.col-referral {
  width: 120px;
}

.col-reference {
  width: 125px;
}

.col-status {
  width: 95px;
}

.col-date {
  width: 95px;
}

.col-service {
  width: 230px;
}

.col-session {
  width: 120px;
}

.col-total {
  width: 120px;
}

.patient-total-row td {
  font-weight: 800;
  border-top: 3px solid #d31d6e;
  background: #ffffff;
}

.grand-total-row td {
  font-size: 14px;
  font-weight: 900;
  color: #d31d6e;
  border-top: 3px solid #d31d6e;
  border-bottom: 3px solid #d31d6e;
  background: #ffffff;
}

.payment-box,
.approval {
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  padding: 10px;
  border-radius: 10px;
  font-size: 12px;
}

.payment-box h3 {
  margin: 0 0 6px;
  font-family: "Montserrat", sans-serif;
  font-size: 13px;
}

.approval .name {
  margin-top: 6px;
  font-weight: 800;
}

.approval .title {
  margin-top: 4px;
  font-size: 10px;
}

.approval .signed {
  margin-top: 6px;
  font-size: 10px;
}

@media print {
  :global(body) {
    background: #ffffff;
    padding: 0;
  }

  .table-wrap {
    overflow: visible;
  }

  .soa-table {
    min-width: 0;
  }

  .patient-total-row td,
  .grand-total-row td,
  .soa-table th {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
