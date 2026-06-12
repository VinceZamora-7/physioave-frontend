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
            <col class="col-item" />
            <col class="col-type" />
          </colgroup>

          <thead>
            <tr>
              <th class="text-left">SERVICE / PACKAGE</th>
              <th class="text-left">TYPE</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!summaryRows.length">
              <td colspan="2" class="empty-row">No LGU services found for the selected date range.</td>
            </tr>

            <tr
              v-for="row in summaryRows"
              :key="row.key"
              :class="{
                'package-row': row.level === 0,
                'bundle-row': row.kind === 'bundle',
                'child-row': row.level > 1
              }"
            >
              <td class="service-cell" :style="{ paddingLeft: `${row.level * 18 + 6}px` }">
                {{ row.name }}
              </td>
              <td class="type-cell">{{ row.label }}</td>
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

type SummaryNode = {
  name: string
  children: SummaryNode[]
}

type SummaryRow = {
  key: string
  name: string
  label: string
  level: number
  kind: "package" | "bundle" | "service"
}

const route = useRoute()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const billings = ref<BillingListItem[]>([])
const error = ref("")

const patientId = computed(() => parsePositiveNumber(route.query.patient_id))
const dateFrom = computed(() => parseDateQuery(route.query.transaction_from ?? route.query.from))
const dateTo = computed(() => parseDateQuery(route.query.transaction_to ?? route.query.to))

const patientName = computed(() =>
  detail.value?.patient_name ||
  billings.value[0]?.patient_name ||
  String(route.query.patient_name ?? "Patient").trim() ||
  "Patient"
)

const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")

const lguProgramLabel = computed(() =>
  firstNonBlank(
    ...billings.value.map(item => item.lgu_program_name),
    String(route.query.lgu_program_name ?? "")
  ) || "LGU"
)

const dateRangeLabel = computed(() => {
  const from = formatDate(dateFrom.value)
  const to = formatDate(dateTo.value)
  return from === to ? from : `${from} to ${to}`
})

const dateSigned = computed(() => formatDate(new Date()))

const summaryRows = computed<SummaryRow[]>(() => {
  const packages = buildPackageTree()
  const rows: SummaryRow[] = []

  packages.forEach((packageNode, packageIndex) => {
    rows.push({
      key: `package-${packageIndex}-${normalizeKey(packageNode.name)}`,
      name: packageNode.name,
      label: "Package",
      level: 0,
      kind: "package"
    })

    packageNode.children.forEach((child, childIndex) => {
      const isBundle = child.children.length > 0

      rows.push({
        key: `package-${packageIndex}-child-${childIndex}-${normalizeKey(child.name)}`,
        name: child.name,
        label: isBundle ? "Bundle" : "Service",
        level: 1,
        kind: isBundle ? "bundle" : "service"
      })

      child.children.forEach((bundleChild, bundleChildIndex) => {
        rows.push({
          key: `package-${packageIndex}-child-${childIndex}-bundle-child-${bundleChildIndex}-${normalizeKey(bundleChild.name)}`,
          name: bundleChild.name,
          label: "Bundle Child",
          level: 2,
          kind: "service"
        })
      })
    })
  })

  return rows
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

function getPackageNameFromBilling(billing: BillingListItem, lines: LineNode[]): string {
  const packageLine = lines.find(isPackageLine)
  return firstNonBlank(
    billing.package_name,
    packageLine ? getLineName(packageLine) : "",
    billing.service_name,
    "LGU Package"
  )
}

function addUniqueChild(parent: SummaryNode, child: SummaryNode): SummaryNode {
  const key = normalizeKey(child.name)
  const existing = parent.children.find(item => normalizeKey(item.name) === key)
  if (existing) return existing

  parent.children.push(child)
  return child
}

function addService(packageNode: SummaryNode, name: string): void {
  const serviceName = name.trim()
  if (!serviceName) return
  addUniqueChild(packageNode, { name: serviceName, children: [] })
}

function addBundle(packageNode: SummaryNode, line: LineNode): void {
  const bundleNode = addUniqueChild(packageNode, {
    name: getLineName(line),
    children: []
  })

  for (const child of getLineChildren(line)) {
    const childName = getLineName(child)
    if (childName) {
      addUniqueChild(bundleNode, { name: childName, children: [] })
    }
  }
}

function addLineToPackage(packageNode: SummaryNode, line: LineNode): void {
  if (isPackageLine(line)) {
    const packageChildren = getLineChildren(line)
    if (!packageChildren.length) return

    packageChildren.forEach(child => addLineToPackage(packageNode, child))
    return
  }

  if (isBundleLine(line)) {
    addBundle(packageNode, line)
    return
  }

  addService(packageNode, getLineName(line))
}

function buildPackageTreeFromBillings(): SummaryNode[] {
  const packageMap = new Map<string, SummaryNode>()

  for (const billing of billings.value) {
    const lines = parseBillingLines(billing)
    const packageName = getPackageNameFromBilling(billing, lines)
    const packageKey = normalizeKey(packageName)
    const packageNode = packageMap.get(packageKey) ?? { name: packageName, children: [] }

    packageMap.set(packageKey, packageNode)

    if (!lines.length) {
      addService(packageNode, billing.service_name || billing.package_name || "LGU Service")
      continue
    }

    lines.forEach(line => addLineToPackage(packageNode, line))
  }

  return Array.from(packageMap.values())
}

function isWithinSelectedRange(value?: string | null): boolean {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false

  const day = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime()
  return day >= dateFrom.value.getTime() && day <= dateTo.value.getTime()
}

function buildPackageTreeFromAppointments(): SummaryNode[] {
  const packageMap = new Map<string, SummaryNode>()

  for (const appointment of detail.value?.appointments ?? []) {
    if (!isWithinSelectedRange(appointment.appointment_date)) continue

    const packageName = appointment.package_name || "LGU Package"
    const packageKey = normalizeKey(packageName)
    const packageNode = packageMap.get(packageKey) ?? { name: packageName, children: [] }

    packageMap.set(packageKey, packageNode)
    appointment.availed_services.forEach(service => addService(packageNode, service))
  }

  return Array.from(packageMap.values())
}

function buildPackageTree(): SummaryNode[] {
  const fromBillings = buildPackageTreeFromBillings()
  if (fromBillings.some(item => item.children.length > 0)) return fromBillings
  return buildPackageTreeFromAppointments()
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

.billing-summary-table .col-item {
  width: 75%;
}

.billing-summary-table .col-type {
  width: 25%;
}

.service-cell {
  font-weight: 600;
}

.package-row .service-cell {
  font-weight: 900;
  text-transform: uppercase;
}

.bundle-row .service-cell {
  font-weight: 800;
}

.child-row .service-cell {
  color: #374151;
  font-weight: 500;
}

.type-cell {
  color: #374151;
  font-weight: 700;
}

.empty-row {
  padding: 14px 10px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

@media print {
  .billing-summary-table {
    min-width: 0 !important;
  }

  .service-cell,
  .type-cell {
    font-size: 9px !important;
  }
}
</style>
