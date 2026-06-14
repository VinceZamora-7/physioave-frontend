<template>
  <LguInvoiceLayout
    title="STATEMENT OF ACCOUNT"
    :subtitle="`statement for ${partnerLabel}`"
    :has-error="!!error"
  >
    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage()" />
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
            <span>{{ partnerLabel || " " }}</span>
          </div>

          <div class="line">
            <span class="label">Billing Date:</span>
            <span>{{ billingDateLabel || " " }}</span>
          </div>
        </div>

        <div class="details-group">
          <div class="line">
            <span class="label">Transaction Period:</span>
            <span>{{ periodLabel || " " }}</span>
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
        <table class="soa-table general-soa-table">
          <colgroup>
            <col class="col-item" />
            <col class="col-patient" />
            <col class="col-referral" />
            <col class="col-reference" />
            <col class="col-status" />
            <col class="col-date" />
            <col class="col-service" />
            <col class="col-session" />
            <col class="col-total" />
          </colgroup>

          <thead>
            <tr>
              <th class="text-center">ITEM No.</th>
              <th class="text-left">PATIENT NAME</th>
              <th class="text-left">REFERRAL FORM No.</th>
              <th class="text-left">REFERENCE NO.</th>
              <th class="text-left">PROGRAM STATUS</th>
              <th class="text-center">TREATMENT DATE</th>
              <th class="text-left">PT SERVICE RENDERED</th>
              <th class="text-center">SESSION SEQUENCE</th>
              <th class="text-right">INVOICE BILLING TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!rows.length">
              <td colspan="9" class="empty-row">
                No statement of account items found.
              </td>
            </tr>

            <template v-for="row in rows" :key="row.key">
              <tr v-if="row.kind === 'service'">
                <td class="text-center">
                  {{ row.itemNo ?? "" }}
                </td>

                <td>
                  {{ row.patientName || " " }}
                </td>

                <td>
                  {{ row.referralFormNo || " " }}
                </td>

                <td>
                  {{ row.referenceNo || " " }}
                </td>

                <td>
                  {{ row.programStatus || " " }}
                </td>

                <td class="text-center">
  {{ shouldShowTreatmentDate(row) ? formatDate(row.treatmentDate) : " " }}
</td>

                <td class="service-name-cell">
                  <span :style="{ paddingLeft: `${Number(row.level ?? 0) * 14}px` }">
  {{ Number(row.level ?? 0) > 0 ? `- ${row.serviceName}` : row.serviceName || " " }}
</span>
                </td>

                <td class="text-center">
                  {{ row.sessionSequence || " " }}
                </td>

                <td class="text-right">
                  {{ formatPrice(row.price) }}
                </td>
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
  <div class="approval-wrap">
    <div class="approval-card">
      <div class="approval-label">
        Approved by:
      </div>

      <div class="approval-name">
        RENALOU B. CORDOVA, PTRP, UK-PT
      </div>

      <div class="approval-line"></div>

      <div class="approval-title">
        Chief Operations Officer
      </div>

      <div class="approval-signed">
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
import {
  billingPhase1Service,
  type BillingListItem,
  type HmoRecentHistoryItem
} from "@/features/billing/api/billing-phase1.service"
import {
  lguBillingService,
  type LguDashboardHistoryItem,
  type LguPatientCreditDetail
} from "@/features/lgu-billing/api/lgu-billing.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  isLguCompletedStatus,
  isLguDropoutStatus,
  normalizeLguStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import { pamsAPI } from "@/utils/axios-interceptor"

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
  billablePrice: number
  level?: number
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
  dropoutStatus?: string | null
  completedSessionSequences: number[]
}

type LocalService = {
  id: string
  name: string
  price?: number | null
}

type LocalBundle = {
  id: string
  name: string
  contractPrice?: number | null
  dropoutPrice?: number | null
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
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
  lgu_package_price?: number | string
  lguPackagePrice?: number | string
  lgu_package_rate?: number | string
  lguPackageRate?: number | string
  lgu_price?: number | string
  lguPrice?: number | string
  contract_price?: number | string
  contractPrice?: number | string
  contract_unit_price?: number | string
  contractUnitPrice?: number | string
  contract_unit_price_snapshot?: number | string
  contractUnitPriceSnapshot?: number | string
  approved_price?: number | string
  approvedPrice?: number | string
  dropout_unit_price_snapshot?: number | string
  dropoutUnitPriceSnapshot?: number | string
  dropout_unit_price?: number | string
  dropoutUnitPrice?: number | string
  dropout_price?: number | string
  dropoutPrice?: number | string
  lgu_dropout_price?: number | string
  lguDropoutPrice?: number | string

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
  __printLevel?: number
}

type LguSoaHistoryItem = LguDashboardHistoryItem & InvoiceLineItem & {
  line_items_json?: string | null
  lineItemsJson?: string | null
}

type HmoSoaHistoryItem = HmoRecentHistoryItem &
  InvoiceLineItem &
  Partial<
    Pick<
      BillingListItem,
      | "public_id"
      | "line_items_json"
      | "diagnosis"
      | "hmo_loa_number"
      | "hmo_loa_date"
      | "loa_date"
      | "hmo_approval_code"
      | "receipt_number"
      | "service_name"
      | "total_amount"
    >
  > & {
    program_status?: string | null
    reference_label?: string | null
    phase1_billing_public_id?: string | null
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
  "package_unit_price_snapshot",
  "packageUnitPriceSnapshot",
  "lgu_contract_price",
  "lguContractPrice",
  "contract_price",
  "contractPrice",
  "contract_unit_price",
  "contractUnitPrice",
  "contract_unit_price_snapshot",
  "contractUnitPriceSnapshot",
  "lgu_package_price",
  "lguPackagePrice",
  "lgu_package_rate",
  "lguPackageRate",
  "lgu_price",
  "lguPrice",
  "lgu_unit_price",
  "lguUnitPrice",
  "package_unit_price",
  "packageUnitPrice",
  "standard_unit_price_snapshot",
  "standardUnitPriceSnapshot",
  "standard_unit_price",
  "standardUnitPrice",
  "approved_price",
  "approvedPrice",
  "price"
]

const DROPOUT_PRICE_KEYS = [
  "dropout_rate",
  "dropOutRate",
  "drop_out_rate",
  "dropout_unit_price",
  "dropoutUnitPrice",
  "drop_out_unit_price",
  "dropOutUnitPrice",
  "dropout_unit_price_snapshot",
  "dropoutUnitPriceSnapshot",
  "drop_out_unit_price_snapshot",
  "dropOutUnitPriceSnapshot",
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
  "dropout_package_rate",
  "dropoutPackageRate",
  "drop_out_package_rate",
  "dropOutPackageRate",
  "lgu_dropout_package_rate",
  "lguDropoutPackageRate",
  "lgu_drop_out_package_rate",
  "lguDropOutPackageRate"
]

const UNIT_PRICE_KEYS = [
  "unit_price_snapshot",
  "unitPriceSnapshot",
  "amount_out",
  "amountOut",
  "billing_amount_due",
  "billingAmountDue",
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

const BUNDLE_PARENT_CONTRACT_PRICE_KEYS = [
  "lgu_billable_parent_unit_price",
  "lguBillableParentUnitPrice",
  "parent_contract_unit_price_snapshot",
  "parentContractUnitPriceSnapshot",
  "grandparent_contract_unit_price_snapshot",
  "grandparentContractUnitPriceSnapshot",
  "parent_lgu_contract_price",
  "parentLguContractPrice",
  "bundle_contract_price",
  "bundleContractPrice",
  "bundle_lgu_contract_price",
  "bundleLguContractPrice"
]

const BUNDLE_PARENT_DROPOUT_PRICE_KEYS = [
  "parent_dropout_unit_price_snapshot",
  "parentDropoutUnitPriceSnapshot",
  "grandparent_dropout_unit_price_snapshot",
  "grandparentDropoutUnitPriceSnapshot",
  "bundle_dropout_unit_price",
  "bundleDropoutUnitPrice",
  "bundle_dropout_price",
  "bundleDropoutPrice",
  "lgu_bundle_dropout_price",
  "lguBundleDropoutPrice"
]

const route = useRoute()
const queryClient = useQueryClient()

const rows = ref<SoaDisplayRow[]>([])
const error = ref("")
const localServices = ref<LocalService[]>([])
const localBundles = ref<LocalBundle[]>([])

const payer = computed<Payer>(() => {
  const normalized = String(route.params.payer ?? "").trim().toLowerCase()
  return normalized === "hmo" ? "hmo" : "lgu"
})

const shouldShowTreatmentDate = (row: ServiceSoaRow): boolean => {
  const currentIndex = rows.value.findIndex(item => item.key === row.key)

  if (currentIndex <= 0 || !row.treatmentDate) {
    return Boolean(row.treatmentDate)
  }

  const previousServiceRow = [...rows.value]
    .slice(0, currentIndex)
    .reverse()
    .find((item): item is ServiceSoaRow => item.kind === "service")

  if (!previousServiceRow) {
    return true
  }

  const samePatient =
    normalizeKey(previousServiceRow.patientName || getPreviousPatientName(currentIndex)) ===
    normalizeKey(row.patientName || getPreviousPatientName(currentIndex))

  const sameDate =
    formatDate(previousServiceRow.treatmentDate) === formatDate(row.treatmentDate)

  return !(samePatient && sameDate)
}

const getPreviousPatientName = (currentIndex: number): string => {
  for (let index = currentIndex; index >= 0; index -= 1) {
    const item = rows.value[index]

    if (item?.kind === "service" && item.patientName) {
      return item.patientName
    }
  }

  return ""
}

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
    return sum + Number(row.billablePrice ?? 0)
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
      return "ACTIVE"
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

const formatProgramStatus = (value: string): string => {
  const normalized = normalizeProgramStatus(value)

  if (normalized === "CROSS_MONTH_DROPPED_OUT") {
    return "crossed-month Dropped out"
  }

  if (normalized === "DROPPED_OUT") {
    return "Dropped out"
  }

  return "Active"
}

const isDropoutProgramStatus = (value: string): boolean => {
  return isLguDropoutStatus(value)
}

const resolvePatientProgramStatus = (
  patientItems: unknown[],
  context?: PatientSoaContext
): string => {
  const itemStatuses = patientItems.map(item => normalizeProgramStatus(getProgramStatus(item)))
  const pricingSources = patientItems.map(item => normalizeProgramStatus(getPricingSource(item)))
  const contextDropoutStatus = normalizeProgramStatus(context?.dropoutStatus ?? "")

  if (
    isCrossMonthDropoutProgramStatus(contextDropoutStatus) ||
    itemStatuses.some(isCrossMonthDropoutProgramStatus)
  ) {
    return "CROSS_MONTH_DROPPED_OUT"
  }

  if (
    isDropoutProgramStatus(contextDropoutStatus) ||
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
    return "ACTIVE"
  }

  return "ACTIVE"
}

const getTreatmentDate = (
  lineItem: unknown,
  parentItem: unknown,
  context?: PatientSoaContext
): string | null =>
  getText(lineItem, [
    "treatment_date",
    "treatmentDate",
  ]) ||
  getText(parentItem, [
    "treatment_date",
    "treatmentDate"
  ]) ||
  getText(lineItem, [
    "appointment_date",
    "appointmentDate",
  ]) ||
  getText(parentItem, [
    "appointment_date",
    "appointmentDate"
  ]) ||
  getText(lineItem, [
    "completed_at",
    "completedAt",
  ]) ||
  getText(parentItem, [
    "completed_at",
    "completedAt"
  ]) ||
  getText(lineItem, [
    "created_at",
    "createdAt"
  ]) ||
  getText(parentItem, [
    "created_at",
    "createdAt"
  ]) ||
  getText(lineItem, [
    "lgu_date_issued",
    "lguDateIssued",
    "referral_issued_date",
    "referralIssuedDate"
  ]) ||
  getText(parentItem, [
    "lgu_date_issued",
    "lguDateIssued",
    "referral_issued_date",
    "referralIssuedDate"
  ]) ||
  String(context?.referralIssuedDate ?? "").trim() ||
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

  const totalSessions =
    getAmount(lineItem, ["total_sessions", "totalSessions"]) ??
    getAmount(parentItem, ["total_sessions", "totalSessions", "quantity", "qty"])

  if (explicit) {
    // When explicit is a bare number and total_sessions is available, format as "X of Y"
    const seqNum = Number(explicit)
    if (Number.isFinite(seqNum) && seqNum > 0 && !/[\/]|\bof\b/i.test(explicit) && totalSessions && totalSessions > 0) {
      return `${Math.floor(seqNum)} of ${Math.floor(totalSessions)}`
    }
    return normalizeSessionSequence(explicit)
  }

  const sessionNo = getAmount(lineItem, [
    "session_no",
    "sessionNo",
    "session_number",
    "sessionNumber"
  ])

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

  if (explicit) {
    return explicit
  }

  if (isDropoutPatient) {
    const sessionNo = Math.max(1, Math.floor(Number(sequenceOverride ?? occurrence)))
    const totalSessions = Math.max(1, Math.floor(Number(configuredTotal ?? totalOccurrences)))
    return `${sessionNo} of ${totalSessions}`
  }

  if (totalOccurrences > 1) {
    return `${occurrence} of ${totalOccurrences}`
  }

  return "1 of 1"
}

const isPackageLine = (item: InvoiceLineItem): boolean => {
  const type = getText(item, ["type"]).toLowerCase()
  const serviceName = getText(item, [
    "service_name",
    "serviceName",
    "pt_service_rendered",
    "ptServiceRendered"
  ])

  if (type === "package" || type === "package-service" || type === "package_service" || type === "parent") {
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

const isBundleLine = (item: InvoiceLineItem): boolean => {
  const type = getText(item, ["type"]).toLowerCase()
  const id = String(item.id ?? "").trim().toLowerCase()
  const hasPayloadChildren = [
    ...getChildArrayFromRecord(item, CHILD_SERVICE_KEYS),
    ...getJsonChildArrayFromRecord(item, CHILD_SERVICE_JSON_KEYS)
  ].length > 0

  return type === "bundle" ||
    type === "service-bundle" ||
    type === "service_bundle" ||
    id.startsWith("bundle-") ||
    id.startsWith("package-bundle-") ||
    id.startsWith("service-bundle-") ||
    (hasPayloadChildren && Boolean(getBundleRecord(item)))
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

const parseMaybeJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string" || !value.trim()) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getCatalogBundlePrice = (
  bundleName: string,
  source: InvoiceLineItem,
  isDropoutPrice: boolean
): number | null => {
  const bundle = getBundleRecord({
    ...source,
    type: "BUNDLE",
    name: bundleName,
    service_name: bundleName
  })

  return isDropoutPrice
    ? bundle?.dropoutPrice ?? null
    : bundle?.contractPrice ?? null
}

const getBundlePriceSnapshot = (
  bundleName: string,
  source: InvoiceLineItem,
  parentItem: unknown,
  isDropoutPrice: boolean,
  includeGenericBundleTotals: boolean
): number | null => {
  const priceKeys = isDropoutPrice
    ? [
        ...BUNDLE_PARENT_DROPOUT_PRICE_KEYS,
        ...(includeGenericBundleTotals ? DROPOUT_PRICE_KEYS : [])
      ]
    : [
        ...BUNDLE_PARENT_CONTRACT_PRICE_KEYS,
        ...(includeGenericBundleTotals ? CONTRACT_PRICE_KEYS : [])
      ]

  const metadataPrice =
    getAmount(source, priceKeys) ??
    getAmount(parentItem, priceKeys) ??
    getCatalogBundlePrice(bundleName, source, isDropoutPrice)

  if (metadataPrice !== null) {
    return metadataPrice
  }

  if (!includeGenericBundleTotals) {
    return null
  }

  if (isDropoutPrice) {
    return null
  }

  return (
    getAmount(source, LINE_TOTAL_KEYS) ??
    getAmount(source, UNIT_PRICE_KEYS) ??
    null
  )
}

const extractConsumedServiceLines = (item: unknown): InvoiceLineItem[] => {
  const consumed = [
    ...getChildArrayFromRecord(item, ["consumed_services", "consumedServices"]),
    ...getJsonChildArrayFromRecord(item, ["consumed_services_json", "consumedServicesJson"])
  ]

  if (!consumed.length) return []

  const output: InvoiceLineItem[] = []
  const bundleGroups = new Map<string, InvoiceLineItem[]>()
  const addedBundleNames = new Set<string>()

  const addBundleRow = (
    bundleName: string,
    source: InvoiceLineItem,
    includeGenericBundleTotals: boolean
  ): void => {
    if (!bundleName || addedBundleNames.has(bundleName)) return

    const contractPrice =
      getBundlePriceSnapshot(bundleName, source, item, false, includeGenericBundleTotals) ?? 0
    const dropoutPrice =
      getBundlePriceSnapshot(bundleName, source, item, true, includeGenericBundleTotals)

    output.push(withPrintLevel({
      type: "BUNDLE",
      name: bundleName,
      service_name: bundleName,
      contract_unit_price_snapshot: contractPrice,
      lgu_contract_price: contractPrice,
      ...(dropoutPrice === null ? {} : {
        dropout_unit_price_snapshot: dropoutPrice,
        dropout_unit_price: dropoutPrice,
        dropout_price: dropoutPrice
      })
    }, 0))

    addedBundleNames.add(bundleName)
  }

  const walk = (lines: InvoiceLineItem[]): void => {
    lines.forEach(line => {
      if (isPackageLine(line)) {
        walk(getChildren(line))
        return
      }

      if (isBundleLine(line)) {
        addBundleRow(getServiceName(line), line, true)
        return
      }

      const bundleName = getText(line, ["bundle_name", "bundleName"])

      if (bundleName) {
        const group = bundleGroups.get(bundleName) ?? []
        group.push(line)
        bundleGroups.set(bundleName, group)
        return
      }

      output.push(withPrintLevel(line, 0))
    })
  }

  walk(consumed)

const bundleRows: InvoiceLineItem[] = []
const serviceRows: InvoiceLineItem[] = [...output]

bundleGroups.forEach((children, bundleName) => {
  const firstChild = children[0]

  const contractPrice =
    getBundlePriceSnapshot(bundleName, firstChild, item, false, false) ?? 0
  const dropoutPrice =
    getBundlePriceSnapshot(bundleName, firstChild, item, true, false)

  bundleRows.push(
    withPrintLevel({
      type: "BUNDLE",
      name: bundleName,
      service_name: bundleName,
      contract_unit_price_snapshot: contractPrice,
      lgu_contract_price: contractPrice,
      ...(dropoutPrice === null ? {} : {
        dropout_unit_price_snapshot: dropoutPrice,
        dropout_unit_price: dropoutPrice,
        dropout_price: dropoutPrice
      })
    }, 0)
  )
})

return [
  ...bundleRows,
  ...serviceRows
]
}

const normalizeIdArray = (value: unknown, prefix: string): string[] =>
  parseMaybeJsonArray(value)
    .map(item => typeof item === "object" && item !== null
      ? (item as Record<string, unknown>).id ?? (item as Record<string, unknown>).item_id ?? (item as Record<string, unknown>).service_id
      : item
    )
    .map(item => String(item ?? "").trim())
    .filter(Boolean)
    .map(id => id.includes("-") ? id : `${prefix}${id}`)

const normalizeCatalogName = (value?: string): string =>
  String(value ?? "")
    .trim()
    .replace(/^[-\s]*(?:\d+(?:\.\d+)?|x\d+)\s+/i, "")
    .replace(/\s+\(LGU\s+.*?\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase()

const catalogNamesMatch = (left?: string, right?: string): boolean => {
  const normalizedLeft = normalizeCatalogName(left)
  const normalizedRight = normalizeCatalogName(right)

  return Boolean(normalizedLeft && normalizedRight) && (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  )
}

const normalizeBundleLookupId = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .replace(/^(?:bundle-|package-bundle-|service-bundle-|lgu-)/i, "")

const getBundleRecord = (item: InvoiceLineItem): LocalBundle | undefined => {
  const rawId = String(item.id ?? "").trim()
  const normalizedId = normalizeBundleLookupId(rawId)
  const itemName = getServiceName(item)

  return localBundles.value.find(bundle =>
    bundle.id === rawId ||
    bundle.id === normalizedId ||
    `bundle-${bundle.id}` === rawId ||
    `package-bundle-${bundle.id}` === rawId ||
    `lgu-${bundle.id}` === rawId ||
    catalogNamesMatch(bundle.name, itemName)
  )
}

const getCatalogBundleChildren = (item: InvoiceLineItem): InvoiceLineItem[] => {
  const bundle = getBundleRecord(item)
  if (!bundle) return []

  return [
    ...bundle.machineIds,
    ...bundle.techniqueIds,
    ...bundle.evaluationIds,
    ...bundle.addOnIds
  ].flatMap(id => {
    const service = localServices.value.find(service => service.id === id)
    return service?.name ? [{
      id,
      name: service.name,
      type: "included-service",
      lgu_contract_price: service.price ?? undefined
    }] : []
  })
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

const getChildren = (item: InvoiceLineItem): InvoiceLineItem[] => {
  const payloadChildren = [
    ...getChildArrayFromRecord(item, CHILD_SERVICE_KEYS),
    ...getJsonChildArrayFromRecord(item, CHILD_SERVICE_JSON_KEYS)
  ]

  if (!isBundleLine(item)) return payloadChildren

  const catalogChildren = getCatalogBundleChildren(item)
  return payloadChildren.length ? payloadChildren : catalogChildren
}

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

const withPrintLevel = (item: InvoiceLineItem, level: number): InvoiceLineItem => ({
  ...item,
  __printLevel: level
})

const getRenderableServiceLines = (item: InvoiceLineItem, level = 0): InvoiceLineItem[] => {
  const children = getChildren(item)

  if (isPackageLine(item)) {
    return children.flatMap(child =>
      getRenderableServiceLines(child, level)
    )
  }

  const childLevel = isBundleLine(item) ? level + 1 : level

  const renderedChildren = children.flatMap(child =>
    getRenderableServiceLines(child, childLevel)
  )

  if (isBundleLine(item) || hasRenderableServiceLine(item)) {
    return [withPrintLevel(item, level), ...renderedChildren]
  }

  return renderedChildren
}

const getLineStartSession = (item: InvoiceLineItem): number => {
  const parsed = getAmount(item, [
    "session_sequence",
    "sessionSequence",
    "session_no",
    "sessionNo",
    "session_number",
    "sessionNumber",
    "applies_on_session",
    "appliesOnSession",
    "start_session",
    "startSession"
  ])

  return parsed && parsed > 0 ? Math.floor(parsed) : 1
}

const isLineCompletedOnSession = (
  item: InvoiceLineItem,
  completedSessionSequence: number
): boolean => {
  const quantity = getQuantity(item)
  const startSession = getLineStartSession(item)

  return (
    completedSessionSequence >= startSession &&
    completedSessionSequence < startSession + quantity
  )
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

  if (!directServiceName || isPackageLine(item as InvoiceLineItem)) {
    return false
  }

  /*
    Allow rendering when the service_name differs from the package_name.
    LGU SOA rows carry both fields as separate DB columns — service_name comes
    from service_name_snapshot while package_name comes from package_name_snapshot.
    Only skip the row when the service name is identical to the package name
    (which would just duplicate the package header).
  */
  return !packageName || normalizeKey(directServiceName) !== normalizeKey(packageName)
}

const extractIncludedServiceLines = (item: unknown): InvoiceLineItem[] => {
  const consumedLines = extractConsumedServiceLines(item)

  if (consumedLines.length) {
    return dedupeServiceLines(consumedLines, item)
  }

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
  if (isDropoutPatient) {
    const dropoutPrice = getAmount(lineItem, DROPOUT_PRICE_KEYS)

    if (dropoutPrice !== null) {
      return dropoutPrice
    }

    if (!hasExtractedServiceLines) {
      return getAmount(parentItem, DROPOUT_PRICE_KEYS)
    }

    return null
  }

  const contractPrice = getAmount(lineItem, CONTRACT_PRICE_KEYS)

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
    const parentContractPrice = getAmount(parentItem, CONTRACT_PRICE_KEYS)

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
      patientTanstackService.fetchContext(queryClient, patientId),
      payer.value === "lgu"
        ? lguBillingService.getPatientCreditDetail(patientId)
        : Promise.resolve(null)
    ])

    const lguSponsor = sponsorResult.status === "fulfilled"
      ? (sponsorResult.value?.sponsor_information ?? []).find(item => item.sponsor_context === "LGU")
      : null
    const detail = detailResult.status === "fulfilled"
      ? detailResult.value ?? null
      : null

    return [
      String(patientId),
      {
        referralFormNo: lguSponsor?.referral_form_no,
        referralIssuedDate: lguSponsor?.referral_issued_date,
        dropoutStatus: detail?.dropout_status,
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
      let previousSessionSequence = ""
      const patientProgramStatus = resolvePatientProgramStatus(sortedItems, patientContext)
      const isDropoutPatient = isDropoutProgramStatus(patientProgramStatus)

      sortedItems.forEach((item, itemIndex) => {
        const serviceLines = extractIncludedServiceLines(item)

        if (!serviceLines.length) {
          return
        }

        serviceLines.forEach((lineItem, lineIndex) => {
          const isDirectSoaServiceRow = lineItem === item
          const printLevel = Math.max(0, Math.floor(Number(lineItem.__printLevel ?? 0)))
          const isChildLine = printLevel > 0
          if (isChildLine) {
            return
          }

          const rawPrice = getContractPrice(lineItem, item, !isDirectSoaServiceRow, isDropoutPatient)
          const price = isChildLine ? null : rawPrice
          const billablePrice = isChildLine ? 0 : Number(rawPrice ?? 0)
          const configuredQuantity = isBundleLine(lineItem) ? 1 : getQuantity(lineItem)
          const quantity = isChildLine || isBundleLine(lineItem)
            ? 1
            : getServiceQuantity(
                lineItem,
                item,
                isDropoutPatient,
                completedSessionSequences.length
              )

          patientHasServiceRows = true

          for (let occurrence = 1; occurrence <= quantity; occurrence += 1) {
            const lineStartSession = getLineStartSession(lineItem)
            const completedSessionSequence = lineStartSession > 1
              ? lineStartSession + occurrence - 1
              : completedSessionSequences[occurrence - 1] ?? occurrence

            if (
              !isDirectSoaServiceRow &&
              !isBundleLine(lineItem) &&
              !isLineCompletedOnSession(lineItem, completedSessionSequence)
            ) {
              return
            }

            const rawSessionSequence = isChildLine
              ? getSessionSequence(lineItem, item)
              : getOccurrenceSessionSequence(
                  lineItem,
                  item,
                  occurrence,
                  quantity,
                  isDropoutPatient,
                  completedSessionSequence,
                  configuredQuantity
                )
            const sessionSequence = rawSessionSequence && rawSessionSequence === previousSessionSequence
              ? "-"
              : rawSessionSequence

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
              sessionSequence,
              price,
              billablePrice,
              level: printLevel
            })

            previousSessionSequence = rawSessionSequence
            patientTotal += Number(billablePrice ?? 0)

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

const enrichHmoSoaItems = async (
  items: HmoRecentHistoryItem[]
): Promise<HmoSoaHistoryItem[]> => {
  const detailedItems = await Promise.all(
    items.map(async item => {
      try {
        const context = item.id > 0
          ? await billingContextTanstackService.fetchContext(queryClient, item.id)
          : undefined

        const detail = context?.billing

        return detail
          ? {
              ...item,
              public_id: detail.public_id,
              phase1_billing_public_id: detail.public_id,
              line_items_json: detail.line_items_json,
              lineItemsJson: detail.line_items_json,
              diagnosis: detail.diagnosis,
              hmo_loa_number: detail.hmo_loa_number,
              hmo_loa_date: detail.hmo_loa_date,
              loa_date: detail.loa_date,
              hmo_approval_code: detail.hmo_approval_code,
              receipt_number: detail.receipt_number,
              service_name: detail.service_name ?? item.service_name,
              total_amount: detail.total_amount ?? item.total_amount
            }
          : item
      } catch {
        return item
      }
    })
  )

  return detailedItems as HmoSoaHistoryItem[]
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

const loadLguInvoiceCatalog = async (): Promise<void> => {
  const requestParams = { page: 1, size: 1000, status: "ACTIVE" }

  try {
    const [
      machineResponse,
      techniqueResponse,
      evaluationResponse,
      addOnMachineResponse,
      addOnTechniqueResponse,
      addOnHomeServiceResponse,
      bundleResponse,
      globalMachineResponse,
      globalTechniqueResponse,
      globalEvaluationResponse,
      globalAddOnMachineResponse,
      globalAddOnTechniqueResponse,
      globalAddOnHomeServiceResponse,
      globalBundleResponse
    ] = await Promise.all([
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-machines", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-techniques", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-evaluations", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-add-on-machines", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-add-on-techniques", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-add-on-home-services", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-service-bundles", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/machines", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/techniques", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/evaluations", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/add-on-machines", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/add-on-techniques", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/add-on-home-services", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/service-bundles", { params: requestParams })
    ])

    localServices.value = [
      ...(machineResponse.data.content ?? []).map(item => ({ id: `machine-${item.id}`, name: String(item.name ?? ""), price: parseNumber(item.price) })),
      ...(techniqueResponse.data.content ?? []).map(item => ({ id: `technique-${item.id}`, name: String(item.name ?? ""), price: parseNumber(item.price) })),
      ...(evaluationResponse.data.content ?? []).map(item => ({ id: `evaluation-${item.id}`, name: String(item.name ?? ""), price: parseNumber(item.price) })),
      ...(addOnMachineResponse.data.content ?? []).map(item => ({ id: `add-on-machine-${item.id}`, name: String(item.name ?? item.machine_name ?? `Add-on Machine ${item.id}`), price: parseNumber(item.add_on_price ?? item.price) })),
      ...(addOnTechniqueResponse.data.content ?? []).map(item => ({ id: `add-on-technique-${item.id}`, name: String(item.name ?? item.technique_name ?? `Add-on Technique ${item.id}`), price: parseNumber(item.add_on_price ?? item.price) })),
      ...(addOnHomeServiceResponse.data.content ?? []).map(item => ({ id: `add-on-home-service-${item.id}`, name: String(item.name ?? item.label ?? `Home Service - ${item.start ?? ""} km`), price: parseNumber(item.add_on_price ?? item.price) })),
      ...(globalMachineResponse.data.content ?? []).map(item => ({ id: `machine-${item.id}`, name: String(item.name ?? ""), price: parseNumber(item.price) })),
      ...(globalTechniqueResponse.data.content ?? []).map(item => ({ id: `technique-${item.id}`, name: String(item.name ?? ""), price: parseNumber(item.price) })),
      ...(globalEvaluationResponse.data.content ?? []).map(item => ({ id: `evaluation-${item.id}`, name: String(item.name ?? ""), price: parseNumber(item.price) })),
      ...(globalAddOnMachineResponse.data.content ?? []).map(item => ({ id: `add-on-machine-${item.id}`, name: String(item.name ?? item.machine_name ?? `Add-on Machine ${item.id}`), price: parseNumber(item.add_on_price ?? item.price) })),
      ...(globalAddOnTechniqueResponse.data.content ?? []).map(item => ({ id: `add-on-technique-${item.id}`, name: String(item.name ?? item.technique_name ?? `Add-on Technique ${item.id}`), price: parseNumber(item.add_on_price ?? item.price) })),
      ...(globalAddOnHomeServiceResponse.data.content ?? []).map(item => ({ id: `add-on-home-service-${item.id}`, name: String(item.name ?? item.label ?? `Home Service - ${item.start ?? ""} km`), price: parseNumber(item.add_on_price ?? item.price) }))
    ].filter(service => service.id && service.name)

    localBundles.value = [
      ...(bundleResponse.data.content ?? []),
      ...(globalBundleResponse.data.content ?? [])
    ].map(row => ({
      id: String(row.id ?? ""),
      name: String(row.name ?? ""),
      contractPrice: parseNumber(
        row.bundled_price ??
        row.bundledPrice ??
        row.package_unit_price ??
        row.packageUnitPrice ??
        row.lgu_contract_price ??
        row.lguContractPrice ??
        row.contract_price ??
        row.contractPrice ??
        row.price
      ),
      dropoutPrice: parseNumber(
        row.dropout_unit_price ??
        row.dropoutUnitPrice ??
        row.dropout_price ??
        row.dropoutPrice ??
        row.lgu_dropout_price ??
        row.lguDropoutPrice
      ),
      machineIds: normalizeIdArray(row.machine_ids ?? row.machine_ids_json, "machine-"),
      techniqueIds: normalizeIdArray(row.technique_ids ?? row.technique_ids_json, "technique-"),
      evaluationIds: normalizeIdArray(row.evaluation_ids ?? row.evaluation_ids_json, "evaluation-"),
      addOnIds: [
        ...normalizeIdArray(row.add_on_machine_ids ?? row.add_on_machine_ids_json, "add-on-machine-"),
        ...normalizeIdArray(row.add_on_technique_ids ?? row.add_on_technique_ids_json, "add-on-technique-"),
        ...normalizeIdArray(row.add_on_home_service_ids ?? row.add_on_home_service_ids_json, "add-on-home-service-"),
        ...normalizeIdArray(row.add_on_ids ?? row.add_on_ids_json, "add-on-machine-")
      ]
    })).filter(bundle => bundle.id && bundle.name)
  } catch {
    localServices.value = []
    localBundles.value = []
  }
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

      const detailedData = await enrichHmoSoaItems(data)
      rows.value = buildStatementRows(detailedData as HmoSoaHistoryItem[], "hmo")
      return
    }

    try {
      await loadLguInvoiceCatalog()
      const data = await fetchLguSoa(dateFrom.value, dateTo.value, programId.value)
      const patientContextById = await buildPatientSoaContextMap(data)
      rows.value = buildStatementRows(data as LguSoaHistoryItem[], "lgu", patientContextById)
    } catch (programFilteredError: unknown) {
      if (!programId.value) {
        throw programFilteredError
      }

      await loadLguInvoiceCatalog()
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
@media screen {
  .general-soa-table {
    min-width: 1120px;
  }
}

.general-soa-table .col-item {
  width: 6%;
}

.general-soa-table .col-patient {
  width: 12%;
}

.general-soa-table .col-referral {
  width: 12%;
}

.general-soa-table .col-reference {
  width: 12%;
}

.general-soa-table .col-status {
  width: 10%;
}

.general-soa-table .col-date {
  width: 10%;
}

.general-soa-table .col-service {
  width: 20%;
}

.general-soa-table .col-session {
  width: 10%;
}

.general-soa-table .col-total {
  width: 8%;
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
  .general-soa-table .col-item {
    width: 5%;
  }

  .general-soa-table .col-patient {
    width: 12%;
  }

  .general-soa-table .col-referral {
    width: 12%;
  }

  .general-soa-table .col-reference {
    width: 12%;
  }

  .general-soa-table .col-status {
    width: 10%;
  }

  .general-soa-table .col-date {
    width: 10%;
  }

  .general-soa-table .col-service {
    width: 21%;
  }

  .general-soa-table .col-session {
    width: 10%;
  }

  .general-soa-table .col-total {
    width: 8%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-item {
    width: 5%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-patient {
    width: 12%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-referral {
    width: 12%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-reference {
    width: 12%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-status {
    width: 10%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-date {
    width: 10%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-service {
    width: 21%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-session {
    width: 10%;
  }

  :global(html.lgu-print-portrait) .general-soa-table .col-total {
    width: 8%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-item {
    width: 5%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-patient {
    width: 12%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-referral {
    width: 12%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-reference {
    width: 12%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-status {
    width: 10%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-date {
    width: 10%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-service {
    width: 22%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-session {
    width: 9%;
  }

  :global(html.lgu-print-landscape) .general-soa-table .col-total {
    width: 8%;
  }
}
</style>
