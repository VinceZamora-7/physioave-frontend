<template>
  <SponsorInvoiceLayout
    title="Self Pay-Package Service Invoice"
    :subtitle="`Package service printable record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>BILLING DATE:</strong><span>{{ billingDateLabel }}</span>
      <strong>REFERENCE NO.:</strong><span>{{ referenceNoLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="() => printPage()" />
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
                <span class="profile-value">{{ patientName }}</span>
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
        <table class="summary-table self-pay-summary-table">
          <colgroup>
            <col class="col-item-no" />
            <col class="col-service-rendered" />
            <col class="col-quantity" />
            <col class="col-unit-price" />
            <col class="col-unit-total" />
          </colgroup>

          <thead>
            <tr>
              <th class="text-center  ">ITEM No</th>
              <th class="text-center">PT SERVICE RENDERED</th>
              <th class="text-center">QTY</th>
              <th class="text-center">UNIT PRICE</th>
              <th class="text-center-bottom">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!rows.length">
              <td colspan="5" class="empty-row">
                No self pay billing items found.
              </td>
            </tr>

            <tr
              v-for="row in rows"
              :key="row.key"
              :class="{
                'item-group-start': row.isPackageParent,
                'line-item-child': row.level > 0,
                'bundle-parent-row': row.isBundleParent
              }"
            >
              <td class="text-center">
                {{ row.itemNo ?? "" }}
              </td>

              <td
                class="text-left service-name-cell"
                :style="{ paddingLeft: row.level > 0 ? `${row.level * 18}px` : undefined }"
              >
                {{ row.serviceName }}
              </td>

              <td class="text-center">
                {{ row.isIncluded ? "" : row.quantity }}
              </td>

              <td class="text-center">
                {{ row.isIncluded ? "" : formatCurrency(row.unitPrice) }}
              </td>

              <td class="text-center">
                {{ row.isIncluded ? "" : formatCurrency(row.unitTotal) }}
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr class="grand-total-row">
              <td colspan="4" class="text-right">
                Grand Total:
              </td>
              <td class="text-center">
                {{ formatCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class=" self-pay-bottom">
        <section class="payment-box">
          <span class="self-pay-bottom-text-header">PAYMENT DETAILS</span>
          <div><span class="self-pay-bottom-text">Billing Type:</span> {{ billingTypeLabel }}</div>
          <div><span class="self-pay-bottom-text">Payment Method:</span> {{ paymentMethodLabel }}</div>
          <div><span class="self-pay-bottom-text">Payment Reference:</span> {{ paymentReferenceLabel }}</div>
          <div><span class="self-pay-bottom-text">Amount Paid:</span> {{ formatCurrency(amountPaid) }}</div>
        </section>

        <section class="approval-card">
          <div class="approval-label">
            Approved by:
          </div>
          <div class="approval-label">
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
  </SponsorInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import type { BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import SponsorInvoiceLayout from "@/features/shared/invoices/SponsorInvoiceLayout.vue"
import { useHmoInvoicePrintActions } from "@/features/hmo-billing/invoices/hmo-invoice.shared"

type SelfPaySummaryRow = {
  key: string
  itemNo: number | null
  billingDate: string
  serviceName: string
  quantity: number
  bodyArea: string
  unitPrice: number
  unitTotal: number
  level: number
  isIncluded: boolean
  isPackageParent: boolean
  isBundleParent: boolean
}

type SelfPayLineItem = {
  id?: number | string
  name?: string
  service_name?: string
  serviceName?: string
  package_name?: string
  packageName?: string
  bundle_name?: string
  bundleName?: string
  display_name?: string
  label?: string
  type?: string
  quantity?: number | string
  qty?: number | string
  price?: number | string
  unitPrice?: number | string
  unit_price?: number | string
  lineTotal?: number | string
  line_total?: number | string
  total?: number | string
  amount?: number | string
  body_area?: string
  bodyArea?: string

  children?: SelfPayLineItem[]
  subItems?: SelfPayLineItem[]
  sub_items?: SelfPayLineItem[]
  includedServices?: SelfPayLineItem[]
  included_services?: SelfPayLineItem[]
  packageServices?: SelfPayLineItem[]
  package_services?: SelfPayLineItem[]
  packageItems?: SelfPayLineItem[]
  package_items?: SelfPayLineItem[]
  serviceItems?: SelfPayLineItem[]
  service_items?: SelfPayLineItem[]
  bundleServices?: SelfPayLineItem[]
  bundle_services?: SelfPayLineItem[]
  childServices?: SelfPayLineItem[]
  child_services?: SelfPayLineItem[]
  inclusions?: SelfPayLineItem[]
  included?: SelfPayLineItem[]
  services?: SelfPayLineItem[]
  items?: SelfPayLineItem[]

    total_quantity?: number | string
  totalQuantity?: number | string
  total_qty?: number | string
  totalQty?: number | string
  service_total_quantity?: number | string
  serviceTotalQuantity?: number | string
  package_quantity?: number | string
  packageQuantity?: number | string
  original_quantity?: number | string
  originalQuantity?: number | string
  included_quantity?: number | string
  includedQuantity?: number | string
  bundle_qty?: number | string
  bundleQty?: number | string
  package_config?: Record<string, unknown> | string | null
  packageConfig?: Record<string, unknown> | string | null
  total_sessions?: number | string
  totalSessions?: number | string

    planned_service_quantity?: number | string
  plannedServiceQuantity?: number | string
  planned_quantity?: number | string
  plannedQuantity?: number | string
  service_quantity?: number | string
  serviceQuantity?: number | string
  planned_service?: Record<string, unknown>
  plannedService?: Record<string, unknown>

  [key: string]: unknown
}

type PackageGroupSessionBilling = {
  id?: number
  service_name?: string
  session_sequence?: number
  total_sessions?: number
  amount_due?: number
  created_at?: string
}

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useHmoInvoicePrintActions()

const billingDetail = ref<BillingListItem | null>(null)
const rows = ref<SelfPaySummaryRow[]>([])
const error = ref("")

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
  "availedServices",
  "bundleItems",
  "bundle_items",
  "machineItems",
  "machine_items",
  "techniqueItems",
  "technique_items",
  "evaluationItems",
  "evaluation_items",
  "addOnItems",
  "add_on_items",
  "packageItems",
  "package_items",
  "serviceItems",
  "service_items",
  "bundleServices",
  "bundle_services",
  "inclusions",
  "included"
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
  "availedServicesJson",
  "bundle_items_json",
  "bundleItemsJson",
  "machine_items_json",
  "machineItemsJson",
  "technique_items_json",
  "techniqueItemsJson",
  "evaluation_items_json",
  "evaluationItemsJson",
  "add_on_items_json",
  "addOnItemsJson"
]

const billingId = computed(() => {
  const parsed = Number(String(route.query.billing_id ?? route.query.id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const firstNonBlank = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

const formatDate = (value?: string | null): string => {
  if (!value) return "-"

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const formatCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  })

const getRecordValue = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined
  return (record as Record<string, unknown>)[key]
}

const getPackageGroupTotal = (billing: BillingListItem): number => {
  const packageGroup = getRecordValue(billing, "package_group")
  const packageGroupTotal = Number(getRecordValue(packageGroup, "package_total_price"))
  if (Number.isFinite(packageGroupTotal) && packageGroupTotal > 0) {
    return packageGroupTotal
  }

  try {
    const parsed = JSON.parse(String(billing.line_items_json ?? "[]")) as unknown
    const lines = Array.isArray(parsed) ? parsed : []
    const packageLine = lines.find((line) => {
      const type = String(getRecordValue(line, "type") ?? "").trim().toLowerCase()
      return type === "package" || type === "package-service" || type === "package_service"
    })
    const packageLineTotal = Number(
      getRecordValue(packageLine, "lineTotal") ??
      getRecordValue(packageLine, "line_total") ??
      getRecordValue(packageLine, "total") ??
      getRecordValue(packageLine, "amount") ??
      getRecordValue(packageLine, "price")
    )

    if (Number.isFinite(packageLineTotal) && packageLineTotal > 0) {
      return packageLineTotal
    }
  } catch {
    // Ignore malformed line item JSON and fall back to the current billing totals.
  }

  return 0
}

const getPackageGroupPaid = (billing: BillingListItem): number | null => {
  const packageGroup = getRecordValue(billing, "package_group")
  const rawPaid = getRecordValue(packageGroup, "total_paid")

  if (rawPaid === undefined || rawPaid === null || rawPaid === "") {
    return null
  }

  const packagePaid = Number(rawPaid)
  return Number.isFinite(packagePaid) && packagePaid >= 0 ? packagePaid : null
}

const getPackageGroupSessionBillings = (billing: BillingListItem): PackageGroupSessionBilling[] => {
  const packageGroup = getRecordValue(billing, "package_group")
  const sessionBillings = getRecordValue(packageGroup, "session_billings")
  return Array.isArray(sessionBillings)
    ? sessionBillings.filter((item): item is PackageGroupSessionBilling => Boolean(item && typeof item === "object"))
    : []
}

const normalizeChildEntry = (entry: unknown): SelfPayLineItem[] => {
  if (typeof entry === "string") {
    const name = entry.trim()
    return name ? [{ name }] : []
  }

  return entry && typeof entry === "object" ? [entry as SelfPayLineItem] : []
}

const toLineItemArray = (value: unknown): SelfPayLineItem[] => {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeChildEntry)
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return toLineItemArray(parsed)
    } catch {
      return []
    }
  }

  return []
}

const parseJsonChildren = (value: unknown): SelfPayLineItem[] => {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeChildEntry)
  }

  if (typeof value !== "string" || !value.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.flatMap(normalizeChildEntry) : []
  } catch {
    return []
  }
}

const getDirectChildren = (line: SelfPayLineItem): SelfPayLineItem[] => [
  ...CHILD_SERVICE_KEYS.flatMap(key => parseJsonChildren(getRecordValue(line, key))),
  ...CHILD_SERVICE_JSON_KEYS.flatMap(key => parseJsonChildren(getRecordValue(line, key)))
]

const parseLineItems = (billing: BillingListItem): SelfPayLineItem[] => {
  const raw = String(billing.line_items_json ?? "").trim()
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown

    if (Array.isArray(parsed)) {
      return toLineItemArray(parsed)
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>

      return [
        ...toLineItemArray(record.lineItems),
        ...toLineItemArray(record.line_items),
        ...toLineItemArray(record.items),
        ...toLineItemArray(record.services),
        ...toLineItemArray(record.packageItems),
        ...toLineItemArray(record.package_items),
        ...toLineItemArray(record.includedServices),
        ...toLineItemArray(record.included_services),
        ...toLineItemArray(record.packageServices),
        ...toLineItemArray(record.package_services),
        ...toLineItemArray(record.bundleItems),
        ...toLineItemArray(record.bundle_items),
        ...toLineItemArray(record.bundleServices),
        ...toLineItemArray(record.bundle_services)
      ]
    }

    return []
  } catch {
    return []
  }
}

const getBillingRecordId = (billing?: BillingListItem | null): string =>
  billing ? firstNonBlank(billing.public_id, `BILLING-${billing.id}`) : "N/A"

const formatPrintableName = (value?: string | number | null, fallback = "N/A"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const patientName = computed(() =>
  formatPrintableName(
    firstNonBlank(
      billingDetail.value?.patient_name,
      billingDetail.value?.patient_public_id,
      billingDetail.value?.patient_id
    ),
    "Patient"
  )
)

const patientAddress = computed(() =>
  firstNonBlank(billingDetail.value?.patient_address, "N/A")
)

const patientAge = computed(() =>
  firstNonBlank(billingDetail.value?.patient_age, "N/A")
)

const physicalTherapist = computed(() =>
  formatPrintableName(billingDetail.value?.physical_therapist, "N/A")
)

const doctor = computed(() =>
  formatPrintableName(billingDetail.value?.doctor, "N/A")
)

const diagnosis = computed(() =>
  firstNonBlank(billingDetail.value?.diagnosis, "N/A")
)

const billingDateLabel = computed(() =>
  formatDate(
    firstNonBlank(
      getRecordValue(billingDetail.value, "appointment_starts_at"),
      getRecordValue(billingDetail.value, "starts_at"),
      getRecordValue(billingDetail.value, "appointment_date"),
      billingDetail.value?.created_at
    )
  )
)

const referenceNoLabel = computed(() =>
  getBillingRecordId(billingDetail.value)
)

const billingTypeLabel = computed(() =>
  String(billingDetail.value?.billing_type ?? "Self Pay").replace(/_/g, " ")
)

const paymentMethodLabel = computed(() =>
  firstNonBlank(
    billingDetail.value?.payment_method_name,
    billingDetail.value?.payment_reference,
    "Self Pay"
  )
)

const paymentReferenceLabel = computed(() =>
  firstNonBlank(
    billingDetail.value?.receipt_number,
    billingDetail.value?.payment_reference,
    "N/A"
  )
)

const amountPaid = computed(() => {
  const billing = billingDetail.value
  if (billing && isSessionScopedPackageBilling(billing)) {
    const packagePaid = getPackageGroupPaid(billing)
    if (packagePaid !== null) return packagePaid
  }

  return Number(billing?.amount_paid ?? 0)
})

const dateSigned = computed(() =>
  new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const grandTotal = computed(() => {
  const billing = billingDetail.value
  if (billing && isSessionScopedPackageBilling(billing)) {
    const packageTotal = getPackageGroupTotal(billing)
    if (packageTotal > 0) return packageTotal
  }

  const billingTotal = Number(
    billing?.total_amount ??
    billing?.amount_due ??
    0
  )

  if (Number.isFinite(billingTotal) && billingTotal > 0) {
    return billingTotal
  }

  return rows.value.reduce((sum, row) => {
    return sum + (row.isIncluded ? 0 : Number(row.unitTotal ?? 0))
  }, 0)
})

const getServiceName = (
  line: SelfPayLineItem,
  fallback = "Self Pay Service"
): string =>
  firstNonBlank(
    line.name,
    line.service_name,
    line.serviceName,
    line.package_name,
    line.packageName,
    line.bundle_name,
    line.bundleName,
    line.display_name,
    line.label,
    fallback
  )

const getQuantity = (line: SelfPayLineItem): number => {
  const quantity = Math.max(1, Math.floor(Number(line.quantity ?? line.qty ?? 1)))
  return Number.isFinite(quantity) ? quantity : 1
}

const getPlannedServiceQuantity = (line: SelfPayLineItem): number => {
  const plannedService = line.planned_service ?? line.plannedService

  const quantity = Number(
    line.planned_service_quantity ??
    line.plannedServiceQuantity ??
    line.planned_quantity ??
    line.plannedQuantity ??
    line.service_quantity ??
    line.serviceQuantity ??
    getRecordValue(plannedService, "quantity") ??
    getRecordValue(plannedService, "qty") ??
    getRecordValue(plannedService, "total_quantity") ??
    getRecordValue(plannedService, "totalQuantity")
  )

  if (Number.isFinite(quantity) && quantity > 0) {
    return Math.floor(quantity)
  }

  return getQuantity(line)
}

const getBundleTotalQuantity = (line: SelfPayLineItem): number => {
  const quantity = Number(
    line.bundle_qty ??
    line.bundleQty ??
    line.total_quantity ??
    line.totalQuantity ??
    line.total_qty ??
    line.totalQty ??
    line.package_quantity ??
    line.packageQuantity ??
    line.total_sessions ??
    line.totalSessions
  )

  if (Number.isFinite(quantity) && quantity > 0) {
    return Math.floor(quantity)
  }

  return getQuantity(line)
}

const normalizeLineKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ")

const getPackageConfigRecord = (line?: SelfPayLineItem): Record<string, unknown> | undefined => {
  const config = line?.package_config ?? line?.packageConfig

  if (config && typeof config === "object" && !Array.isArray(config)) {
    return config
  }

  if (typeof config === "string" && config.trim()) {
    try {
      const parsed = JSON.parse(config) as unknown
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : undefined
    } catch {
      return undefined
    }
  }

  return undefined
}

const firstPositiveInteger = (...values: unknown[]): number => {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed)
    }
  }

  return 0
}

const getConfiguredPackageBundleQuantity = (packageLine?: SelfPayLineItem): number => {
  const packageConfig = getPackageConfigRecord(packageLine)

  return firstPositiveInteger(
    getRecordValue(packageLine, "bundle_qty"),
    getRecordValue(packageLine, "bundleQty"),
    getRecordValue(packageLine, "bundle_quantity"),
    getRecordValue(packageLine, "bundleQuantity"),
    getRecordValue(packageConfig, "bundle_qty"),
    getRecordValue(packageConfig, "bundleQty"),
    getRecordValue(packageConfig, "bundle_quantity"),
    getRecordValue(packageConfig, "bundleQuantity")
  )
}

const isConfiguredPackageBundleLine = (
  line: SelfPayLineItem,
  packageLine?: SelfPayLineItem
): boolean => {
  if (!packageLine || getConfiguredPackageBundleQuantity(packageLine) <= 0) {
    return false
  }

  return normalizeLineKey(getServiceName(line, "")).includes("bundle")
}

const getBundleConfiguredQuantity = (
  bundleLine: SelfPayLineItem,
  packageLine?: SelfPayLineItem
): number => {
  const packageConfig = getPackageConfigRecord(packageLine)
  const directQuantity = firstPositiveInteger(
    bundleLine.bundle_qty ??
    bundleLine.bundleQty ??
    bundleLine.total_quantity ??
    bundleLine.totalQuantity ??
    bundleLine.total_qty ??
    bundleLine.totalQty ??
    bundleLine.package_quantity ??
    bundleLine.packageQuantity ??
    bundleLine.total_sessions ??
    bundleLine.totalSessions ??
    getConfiguredPackageBundleQuantity(packageLine)
  )

  if (directQuantity > 0) {
    return directQuantity
  }

  const bundleId = String(bundleLine.id ?? "").trim()
  const bundleName = normalizeLineKey(getServiceName(bundleLine, ""))
  const configuredItems = [
    ...toLineItemArray(packageLine?.bundleItems),
    ...toLineItemArray(packageLine?.bundle_items),
    ...toLineItemArray(getRecordValue(packageLine, "bundle_items_json")),
    ...toLineItemArray(getRecordValue(packageLine, "bundleItemsJson")),
    ...toLineItemArray(getRecordValue(packageConfig, "bundleItems")),
    ...toLineItemArray(getRecordValue(packageConfig, "bundle_items")),
    ...toLineItemArray(getRecordValue(packageConfig, "bundle_items_json")),
    ...toLineItemArray(getRecordValue(packageConfig, "bundleItemsJson"))
  ]
  const matchedItem = configuredItems.find(item => {
    const itemId = String(item.id ?? "").trim()
    const itemName = normalizeLineKey(getServiceName(item, ""))

    return Boolean(
      (bundleId && itemId && bundleId === itemId) ||
      (bundleName && itemName && bundleName === itemName)
    )
  }) ?? (configuredItems.length === 1 ? configuredItems[0] : undefined)
  const matchedQuantity = firstPositiveInteger(matchedItem?.qty, matchedItem?.quantity)

  if (matchedQuantity > 0) {
    return matchedQuantity
  }

  return getBundleTotalQuantity(bundleLine)
}

const getIncludedDisplayQuantity = (line: SelfPayLineItem): number => {
  return isBundleLikeLine(line)
    ? getBundleTotalQuantity(line)
    : getPlannedServiceQuantity(line)
}

const getUnitPrice = (line: SelfPayLineItem): number => {
  const price = Number(line.price ?? line.unitPrice ?? line.unit_price ?? 0)
  return Number.isFinite(price) ? price : 0
}

const getUnitTotal = (line: SelfPayLineItem, quantity: number): number => {
  const lineTotal = Number(
    line.lineTotal ??
    line.line_total ??
    line.total ??
    line.amount
  )

  if (Number.isFinite(lineTotal) && lineTotal > 0) {
    return lineTotal
  }

  return quantity * getUnitPrice(line)
}

const getBodyArea = (line: SelfPayLineItem): string =>
  firstNonBlank(line.body_area, line.bodyArea, "N/A")

const isPackageLikeLine = (line: SelfPayLineItem): boolean => {
  const type = String(line.type ?? "").trim().toLowerCase()

  return (
    type === "package" ||
    type === "package-service" ||
    type === "package_service" ||
    Boolean(line.package_name || line.packageName)
  )
}

const isBundleLikeLine = (line: SelfPayLineItem): boolean => {
  const type = String(line.type ?? "").trim().toLowerCase()

  return (
    type === "bundle" ||
    type === "service-bundle" ||
    type === "service_bundle" ||
    Boolean(line.bundle_name || line.bundleName)
  )
}

const getPositiveRecordNumber = (record: unknown, key: string): number => {
  const parsed = Number(getRecordValue(record, key))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const isSessionScopedPackageBilling = (billing: BillingListItem): boolean =>
  getPositiveRecordNumber(billing, "package_group_id") > 0 &&
  getPositiveRecordNumber(billing, "session_sequence") > 0

const stripPackageSessionDescriptor = (value: string): string =>
  stripPackageSessionSuffix(value)
    .replace(/^\s*\(\s*\d+\s*\)\s*sessions?\s+/i, "")
    .replace(/^\s*\d+\s*sessions?\s+/i, "")
    .replace(/\s+Package\s+Session\s*$/i, " Package")
    .replace(/\s+Session\s*$/i, "")
    .trim()

const stripPackageSessionSuffix = (value: string): string =>
  value
    .replace(/\s+-\s+Session\s+\d+\s+of\s+\d+\s*$/i, "")
    .replace(/\s+Session\s+-\s+Session\s+\d+\s+of\s+\d+\s*$/i, "")
    .trim()

// const appendIncludedServiceRows = (
//   children: SelfPayLineItem[],
//   billingIdValue: number | string,
//   parentIndex: number,
//   billingDate: string,
//   output: SelfPaySummaryRow[],
//   level = 1,
//   path = "included"
// ): void => {
//   children.forEach((child, childIndex) => {
//     const childChildren = getDirectChildren(child)
//     const childQuantity = getQuantity(child)
//     const childName = getServiceName(child, "Included Service")
//     const childPath = `${path}-${childIndex}`

//     const isBundle = isBundleLikeLine(child)

//     if (isBundle) {
//       output.push({
//         key: `${billingIdValue}-${parentIndex}-${childPath}-bundle`,
//         itemNo: null,
//         billingDate,
//         serviceName: `- ${childQuantity} ${childName}`,
//         quantity: childQuantity,
//         bodyArea: getBodyArea(child),
//         unitPrice: 0,
//         unitTotal: 0,
//         level,
//         isIncluded: true,
//         isPackageParent: false,
//         isBundleParent: true
//       })
//       return
//     }

//     output.push({
//       key: `${billingIdValue}-${parentIndex}-${childPath}`,
//       itemNo: null,
//       billingDate,
//       serviceName: `- ${childQuantity} ${childName}`,
//       quantity: childQuantity,
//       bodyArea: getBodyArea(child),
//       unitPrice: 0,
//       unitTotal: 0,
//       level,
//       isIncluded: true,
//       isPackageParent: false,
//       isBundleParent: false
//     })
//   })
// }

const appendIncludedServiceRows = (
  children: SelfPayLineItem[],
  billingIdValue: number | string,
  parentIndex: number,
  billingDate: string,
  output: SelfPaySummaryRow[],
  level = 1,
  path = "included",
  parentLine?: SelfPayLineItem
): void => {
  children.forEach((child, childIndex) => {
    const childIsBundle = isBundleLikeLine(child) || isConfiguredPackageBundleLine(child, parentLine)
    const childQuantity = childIsBundle
      ? getBundleConfiguredQuantity(child, parentLine)
      : getIncludedDisplayQuantity(child)
    const childName = getServiceName(child, "Included Service")
    const childPath = `${path}-${childIndex}`

    output.push({
      key: `${billingIdValue}-${parentIndex}-${childPath}${childIsBundle ? "-bundle" : ""}`,
      itemNo: null,
      billingDate,
      serviceName: `- ${childQuantity} ${childName}`,
      quantity: childQuantity,
      bodyArea: getBodyArea(child),
      unitPrice: 0,
      unitTotal: 0,
      level,
      isIncluded: true,
      isPackageParent: false,
      isBundleParent: childIsBundle
    })
  })
}

const appendPackageGroupSessionRows = (
  billing: BillingListItem,
  parentIndex: number,
  billingDate: string,
  output: SelfPaySummaryRow[],
  bundleLine?: SelfPayLineItem
): void => {
  const sessionBillings = getPackageGroupSessionBillings(billing)
  const bundleName = bundleLine ? getServiceName(bundleLine, "") : ""
  const bundleQuantity = bundleLine ? getQuantity(bundleLine) : 0
  const totalSessions = bundleQuantity || getPositiveRecordNumber(billing, "total_sessions") || sessionBillings.length

  if (totalSessions <= 0) return

  const firstSessionBilling = sessionBillings[0]
  const bundleDisplayName = stripPackageSessionDescriptor(
    firstNonBlank(
      bundleName,
      "Package Session"
    )
  )

  output.push({
    key: `${billing.id}-${parentIndex}-package-session-bundle`,
    itemNo: null,
    billingDate: firstSessionBilling?.created_at ? formatDate(firstSessionBilling.created_at) : billingDate,
    serviceName: `- ${totalSessions} ${bundleDisplayName}`,
    quantity: totalSessions,
    bodyArea: "N/A",
    unitPrice: 0,
    unitTotal: 0,
    level: 1,
    isIncluded: true,
    isPackageParent: false,
    isBundleParent: true
  })
}

const buildRows = (billing: BillingListItem): SelfPaySummaryRow[] => {
  const lineItems = parseLineItems(billing)
  const billingDate = formatDate(
    firstNonBlank(
      getRecordValue(billing, "appointment_starts_at"),
      getRecordValue(billing, "starts_at"),
      getRecordValue(billing, "appointment_date"),
      billing.created_at
    )
  )

  const output: SelfPaySummaryRow[] = []
  let itemNo = 1

  const pushTopLevelRow = (
    line: SelfPayLineItem,
    indexPath: string,
    fallbackName = billing.service_name || "Self Pay Service"
  ): void => {
    const children = getDirectChildren(line)
    const quantity = getQuantity(line)
    const unitPrice = getUnitPrice(line)
    const unitTotal = getUnitTotal(line, quantity)
    const serviceName = getServiceName(line, fallbackName)

    output.push({
      key: `${billing.id}-${indexPath}`,
      itemNo,
      billingDate,
      serviceName,
      quantity,
      bodyArea: getBodyArea(line),
      unitPrice,
      unitTotal,
      level: 0,
      isIncluded: false,
      isPackageParent: false,
      isBundleParent: children.length > 0
    })

    itemNo += 1

    if (children.length > 0 && !isBundleLikeLine(line)) {
      appendIncludedServiceRows(
        children,
        billing.id,
        Number(String(indexPath).replace(/\D/g, "")) || itemNo,
        billingDate,
        output,
        1,
        "included",
        line
      )
    }
  }

  if (!lineItems.length) {
    const unitPrice = Number(billing.total_amount ?? billing.amount_due ?? 0)

    return [{
      key: `${billing.id}-1`,
      itemNo: 1,
      billingDate,
      serviceName: billing.service_name || "Self Pay Service",
      quantity: 1,
      bodyArea: "N/A",
      unitPrice,
      unitTotal: unitPrice,
      level: 0,
      isIncluded: false,
      isPackageParent: false,
      isBundleParent: false
    }]
  }

  lineItems.forEach((line, index) => {
    const children = getDirectChildren(line)

    if (isPackageLikeLine(line) && isSessionScopedPackageBilling(billing)) {
      const fallbackLineTotal = getUnitTotal(line, getQuantity(line))
      const packageTotal = getPackageGroupTotal(billing)
      const fullPackagePrice = packageTotal > 0
        ? packageTotal
        : Number(billing.total_amount ?? billing.amount_due ?? fallbackLineTotal)
      const packageServiceName = stripPackageSessionDescriptor(
        getServiceName(line, "Package Service")
      )
      const bundleQuantity = children
        .filter(child => isBundleLikeLine(child) || isConfiguredPackageBundleLine(child, line))
        .reduce((sum, child) => sum + getBundleConfiguredQuantity(child, line), 0)
      const packageQuantity = firstPositiveInteger(
        bundleQuantity,
        getBundleTotalQuantity(line),
        getPlannedServiceQuantity(line),
        getPositiveRecordNumber(billing, "total_sessions")
      ) || 1
      const packageDisplayName = packageQuantity > 1
        ? `(${packageQuantity}) ${packageServiceName} `
        : packageServiceName
      const sessionLine = {
        ...line,
        name: packageDisplayName,
        quantity: packageQuantity,
        price: fullPackagePrice / packageQuantity,
        lineTotal: fullPackagePrice
      }

      pushTopLevelRow({
        ...sessionLine,
        children: []
      }, `${index}-package-session`, packageDisplayName || "Package Service")
      appendIncludedServiceRows(
        children,
        billing.id,
        index,
        billingDate,
        output,
        1,
        "included",
        line
      )

      return
    }

    pushTopLevelRow(line, `${index}-parent`)
  })

  return output
}

const load = async (): Promise<void> => {
  error.value = ""
  billingDetail.value = null
  rows.value = []

  if (!billingId.value) {
    error.value = "Billing ID is required."
    return
  }

  try {
    const context = await billingContextTanstackService.fetchContext(queryClient, billingId.value)

    billingDetail.value = context?.billing ?? null

    if (!billingDetail.value) {
      error.value = "Billing record was not found."
      return
    }

    rows.value = buildRows(billingDetail.value)
  } catch (err: unknown) {
    error.value = err instanceof Error
      ? err.message
      : "Failed to load self pay billing summary."
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
  .self-pay-summary-table {
    min-width: 720px;
  }
}

.self-pay-summary-table .col-item-no {
  width: 12%;
}

.self-pay-summary-table .col-service-rendered {
  width: 42%;
}

.self-pay-summary-table .col-quantity {
  width: 12%;
}

.self-pay-summary-table .col-unit-price {
  width: 17%;
}

.self-pay-summary-table .col-unit-total {
  width: 17%;
}

.service-name-cell {
  font-weight: 600;
}

.bundle-parent-row .service-name-cell {
  font-weight: 800;
}

.line-item-child .service-name-cell {
  color: #374151;
}

.empty-row {
  padding: 14px 10px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.self-pay-bottom {
  justify-content: space-between;
  align-items: flex-start;
}

@media print {

  .self-pay-bottom {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
  scroll-margin-bottom: 20px;
}

  .self-pay-summary-table .col-item-no {
    width: 10%;
  }

  .self-pay-summary-table .col-service-rendered {
    width: 46%;
  }

  .self-pay-summary-table .col-quantity {
    width: 10%;
  }

  .self-pay-summary-table .col-unit-price {
    width: 17%;
  }

  .self-pay-summary-table .col-unit-total {
    width: 17%;
  }

  :global(html.lgu-print-portrait) .self-pay-summary-table .col-item-no {
    width: 10%;
  }

  :global(html.lgu-print-portrait) .self-pay-summary-table .col-service-rendered {
    width: 44%;
  }

  :global(html.lgu-print-portrait) .self-pay-summary-table .col-quantity {
    width: 10%;
  }

  :global(html.lgu-print-portrait) .self-pay-summary-table .col-unit-price {
    width: 18%;
  }

  :global(html.lgu-print-portrait) .self-pay-summary-table .col-unit-total {
    width: 18%;
  }

  :global(html.lgu-print-landscape) .self-pay-summary-table .col-item-no {
    width: 10%;
  }

  :global(html.lgu-print-landscape) .self-pay-summary-table .col-service-rendered {
    width: 48%;
  }

  :global(html.lgu-print-landscape) .self-pay-summary-table .col-quantity {
    width: 10%;
  }

  :global(html.lgu-print-landscape) .self-pay-summary-table .col-unit-price {
    width: 16%;
  }

  :global(html.lgu-print-landscape) .self-pay-summary-table .col-unit-total {
    width: 16%;
  }

  .self-pay-bottom-text{
    font-weight: 700;
  }

    .self-pay-bottom-text-header{
      text-decoration: underline;
    font-weight: 700;
  }

}


</style>
