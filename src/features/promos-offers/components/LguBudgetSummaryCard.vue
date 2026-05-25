<template>
  <section class="space-y-5">
    <LguDashboardHeader
      v-model:selected-program-id="selectedProgramId"
      :selected-program-name="selectedProgramName"
      :budget-month-label="budgetMonthLabel"
      :can-manage-lgu-dashboard="canManageLguDashboard"
      :budget-ledger-visible="budgetLedgerVisible"
      :lgu-program-options="lguProgramOptions"
      :loading-programs="loadingPrograms"
      @toggle-budget="budgetLedgerVisible = !budgetLedgerVisible"
      @open-exports="exportsModalVisible = true"
    />

    <LguBudgetSnapshot
      :total-available-fund="totalAvailableFund"
      :used-lgu-fund="usedLguFund"
      :pending-used-lgu-fund="pendingUsedLguFund"
      :remaining-available-fund="remainingAvailableFund"
      :as-currency="asCurrency"
    />

    <LguBudgetSetup
      v-if="budgetLedgerVisible"
      v-model:selected-program-id="selectedProgramId"
      v-model:show-new-program-input="showNewProgramInput"
      v-model:new-program-name="newProgramName"
      v-model:selected-budget-month-date="selectedBudgetMonthDate"
      v-model:base-monthly-budget="baseMonthlyBudget"
      v-model:rollover-input="rolloverInput"
      :lgu-dashboard-budget="lguDashboardBudget"
      :can-manage-lgu-dashboard="canManageLguDashboard"
      :budget-sync-error="budgetSyncError"
      :loading-dashboard-budget="loadingDashboardBudget"
      :has-local-only-budget-draft="hasLocalOnlyBudgetDraft"
      :budget-month-label="budgetMonthLabel"
      :used-lgu-fund="usedLguFund"
      :is-future-budget-month="isFutureBudgetMonth"
      :current-month-label="currentMonthLabel"
      :lgu-program-options="lguProgramOptions"
      :loading-programs="loadingPrograms"
      :saving-dashboard-budget="savingDashboardBudget"
      :current-month-start="currentMonthStart"
      :rollover-amount="rolloverAmount"
      :creating-program="creatingProgram"
      :refreshing-dashboard-budget="refreshingDashboardBudget"
      :loading-transaction-history="loadingTransactionHistory"
      :as-currency="asCurrency"
      @create-program="createNewProgram"
      @refresh-budget="refreshDashboardBudget"
      @add-rollover="addRolloverAmount"
      @save-budget="saveDashboardBudget"
    />

    <LguDashboardTables
      :lgu-transaction-history="lguTransactionHistory"
      :loading-transaction-history="loadingTransactionHistory"
      :transaction-history-error="transactionHistoryError"
      :lgu-patients="lguPatients"
      :loading-lgu-patients="loadingLguPatients"
      :lgu-patients-error="lguPatientsError"
      :selected-program-name="selectedProgramName"
      :as-currency="asCurrency"
      :format-date-time="formatDateTime"
      :format-budget-period="formatBudgetPeriod"
      :format-entry-type="formatEntryType"
      :entry-type-severity="entryTypeSeverity"
      :usage-status-severity="usageStatusSeverity"
      :format-date-only-text="formatDateOnlyText"
      :format-patient-address="formatPatientAddress"
      @load-transaction-history="loadTransactionHistory"
      @load-lgu-patients="loadLguPatients"
      @open-patient-detail="openPatientDetail"
    />

    <LguExportsDialog
      v-model:visible="exportsModalVisible"
      v-model:soa-range="soaRange"
      :selected-program-name="selectedProgramName"
      :has-valid-soa-range="hasValidSoaRange"
      :exporting-lgu-patients="exportingLguPatients"
      @generate-soa="generateSoa"
      @export-lgu-patient-copy="exportLguPatientCopy"
    />

    <LguPatientCreditDetailDialog
      v-model:visible="showPatientDetailDialog"
      :selected-patient-detail="selectedPatientDetail"
      :loading-patient-detail="loadingPatientDetail"
      :patient-detail-error="patientDetailError"
      :first-dropped-out-appointment-id="firstDroppedOutAppointmentId"
      :is-creating-claims="isCreatingClaims"
      :printing-claim-billing-id="printingClaimBillingId"
      :format-date-time="formatDateTime"
      :format-lgu-status="formatLguStatus"
      :lgu-status-severity="lguStatusSeverity"
      :as-currency="asCurrency"
      :get-billing-summary-amount="getPatientBillingSummaryAmount"
      @open-invoice-session-picker="openInvoiceSessionPicker"
      @export-patient-billing-summary="exportPatientBillingSummary"
      @open-patient-soa-picker="openPatientSoaPicker"
      @export-patient-lgu-details="exportPatientLguDetails"
      @create-claims="createClaimsForEligibleAppointments"
      @download-claim-pdf="downloadClaimPdf"
    />

    <LguPatientSoaDialog
      v-model:visible="patientSoaPickerVisible"
      v-model:patient-soa-range="patientSoaRange"
      :has-valid-patient-soa-range="hasValidPatientSoaRange"
      @export-patient-soa="exportPatientSoa"
    />

    <LguInvoiceSessionDialog
      v-model:visible="invoiceSessionPickerVisible"
      :invoice-session-options="invoiceSessionOptions"
      :printing-claim-billing-id="printingClaimBillingId"
      :format-date-time="formatDateTime"
      @print-session-invoice="printSessionInvoice"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useToast } from "primevue/usetoast"
import LguBudgetSetup from "./lgu-budget-summary-card/LguBudgetSetup.vue"
import LguBudgetSnapshot from "./lgu-budget-summary-card/LguBudgetSnapshot.vue"
import LguDashboardHeader from "./lgu-budget-summary-card/LguDashboardHeader.vue"
import LguDashboardTables from "./lgu-budget-summary-card/LguDashboardTables.vue"
import LguExportsDialog from "./lgu-budget-summary-card/LguExportsDialog.vue"
import LguInvoiceSessionDialog from "./lgu-budget-summary-card/LguInvoiceSessionDialog.vue"
import LguPatientCreditDetailDialog from "./lgu-budget-summary-card/LguPatientCreditDetailDialog.vue"
import LguPatientSoaDialog from "./lgu-budget-summary-card/LguPatientSoaDialog.vue"
import type { LguInvoiceSessionOption } from "./lgu-budget-summary-card/types"
import {
  billingPhase1Service,
  type BillingListItem
} from "@/features/billing/api/billing-phase1.service"
import type { Pageable } from "@/models/paging"
import {
  lguBillingService,
  type LguDashboardBudget,
  type LguDashboardHistoryItem,
  type LguPatientBilling,
  type LguPatientCreditDetail,
  type LguProgramLookup
} from "@/features/lgu-billing/api/lgu-billing.service"
import { renderLguInvoiceWindow } from "@/features/lgu-billing/invoices/lgu-invoice.util"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import {
  openEncounterTicketPdfWindow,
  renderEncounterTicketBulkPdfWindow,
  type EncounterTicketPdfCard
} from "@/utils/encounter-ticket-pdf.util"
import {
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "@/features/billing/invoices/invoice-layout.util"
import type { Patient } from "@/features/patients/types/patient"
import type { PatientHMOInformation } from "@/models/hmo-information"
import { patientHMOInformationService } from "@/services/patient-hmo-information.service"

type LocalLguBudgetDraft = {
  baseMonthlyBudget?: number
  rolloverAmount?: number
}

const toast = useToast()
const currentRoleName = ref<string>("")
const budgetLedgerVisible = ref(false)
const lguPrograms = ref<LguProgramLookup[]>([])
const loadingPrograms = ref(false)
const selectedProgramId = ref<number | null>(null)
const showNewProgramInput = ref(false)
const newProgramName = ref("")
const creatingProgram = ref(false)
const baseMonthlyBudget = ref<number>(0)
const rolloverAmount = ref<number>(0)
const rolloverInput = ref<number>(0)
const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const selectedBudgetMonthDate = ref<Date>(new Date(currentMonthStart))
const lguDashboardBudget = ref<LguDashboardBudget | null>(null)
const loadingDashboardBudget = ref(false)
const savingDashboardBudget = ref(false)
const refreshingDashboardBudget = ref(false)
const hasLocalOnlyBudgetDraft = ref(false)
const budgetSyncError = ref("")
const lguTransactionHistory = ref<LguDashboardHistoryItem[]>([])
const loadingTransactionHistory = ref(false)
const transactionHistoryError = ref("")
const lguPatients = ref<Patient[]>([])
const loadingLguPatients = ref(false)
const lguPatientsError = ref("")
const showPatientDetailDialog = ref(false)
const selectedPatientDetail = ref<LguPatientCreditDetail | null>(null)
const loadingPatientDetail = ref(false)
const patientDetailError = ref("")
const isCreatingClaims = ref(false)
const printingClaimBillingId = ref<number | null>(null)
const invoiceSessionPickerVisible = ref(false)
const patientSoaPickerVisible = ref(false)
const exportsModalVisible = ref(false)
const soaRange = ref<Date[] | null>(null)
const patientSoaRange = ref<Date[] | null>(null)
const bulkTicketRange = ref<Date[] | null>(null)
const exportingBulkTickets = ref(false)
const exportingLguPatients = ref(false)

type LocalService = { id: string; type?: string; name: string; price?: number; status?: string }
type LocalBundle = {
  id: string
  name: string
  machineIds?: string[]
  techniqueIds?: string[]
  evaluationIds?: string[]
  addOnIds?: string[]
}
type LguInvoiceSubItem = { name: string; quantity: number; unitPrice?: number; children?: LguInvoiceSubItem[] }
type LocalPackageOffer = {
  id: string
  name: string
  bundleId?: string
  bundleQty?: number
  machineIds?: string[]
  machineQty?: number
  machineItems?: Array<{id: string; qty: number}>
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: Array<{id: string; qty: number}>
  evaluationIds?: string[]
  evaluationQty?: number
  evaluationItems?: Array<{id: string; qty: number}>
  addOnIds?: string[]
  addOnQty?: number
  addOnItems?: Array<{id: string; qty: number}>
  sessionIds?: string[]
  sessionQty?: number
  sessionItems?: Array<{id: string; qty: number}>
  invoiceSubItems?: LguInvoiceSubItem[]
  status?: string
}

const localServices = ref<LocalService[]>([])
const localBundles = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const lguInvoiceCatalogLoaded = ref(false)

const hasValidSoaRange = computed(() => {
  const r = soaRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const hasValidPatientSoaRange = computed(() => {
  const r = patientSoaRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const hasValidBulkTicketRange = computed(() => {
  const r = bulkTicketRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const invoiceSessionOptions = computed<LguInvoiceSessionOption[]>(() =>
  (selectedPatientDetail.value?.authorizations ?? []).flatMap(authorization => {
    const totalSessions = Math.max(authorization.total_sessions, authorization.sessions.length, 1)
    return authorization.sessions.map(session => {
      const dropoutBillingId = Number(session.dropout_billing_id ?? 0) > 0 ? Number(session.dropout_billing_id) : null
      const monthlyBillingId = Number(session.monthly_billing_id ?? 0) > 0 ? Number(session.monthly_billing_id) : null
      const billingId = dropoutBillingId ?? monthlyBillingId
      const claimLabel = dropoutBillingId
        ? "Dropout Claim"
        : monthlyBillingId
          ? "Monthly Claim"
          : "Not Claimed"
      return {
        key: `${authorization.authorization_id}-${session.id}`,
        label: `Session ${session.session_sequence} of ${totalSessions}`,
        packageName: authorization.package_name || "LGU Package",
        serviceName: session.service_name || "LGU Session",
        appointmentId: session.appointment_id,
        appointmentDate: session.appointment_date,
        sessionSequence: session.session_sequence,
        totalSessions,
        billingId,
        claimLabel,
        session
      }
    })
  })
)

const MANAGER_ROLE_KEYWORDS = [
  "manager",
  "operations manager",
  "chief operations officer",
  "coo",
  "owner"
]

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  return new Date(value).toLocaleString("en-PH")
}

const formatDateOnly = (value: Date): string =>
  value.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })

const formatDateOnlyText = (value?: string | null): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-PH")
}

const getMonthEndDate = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0)

const getClaimReferenceNumber = (detail: BillingListItem): string =>
  detail.receipt_number?.trim() || detail.public_id || `BILL-${detail.id}`

const parseMaybeJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const toOptionalStringId = (value: unknown): string | undefined => {
  const text = String(value ?? "").trim()
  return text || undefined
}

const normalizePositiveInt = (value: unknown, fallback = 1): number => {
  const parsed = Math.trunc(Number(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const normalizeStringIdArray = (value: unknown): string[] =>
  parseMaybeJsonArray(value).map(item => toOptionalStringId(item)).filter((item): item is string => Boolean(item))

const normalizeQtyItems = (value: unknown): Array<{id: string; qty: number}> =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const id = toOptionalStringId(raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
    return id ? [{ id, qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1) }] : []
  })

const normalizeInvoiceSubItems = (value: unknown): LguInvoiceSubItem[] =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const name = String(raw.name ?? "").trim()
    return name
      ? [{
          name,
          quantity: normalizePositiveInt(raw.quantity, 1),
          unitPrice: Number(raw.unitPrice ?? raw.unit_price ?? raw.price ?? 0) > 0
            ? Number(raw.unitPrice ?? raw.unit_price ?? raw.price)
            : undefined,
          children: normalizeInvoiceSubItems(raw.children)
        }]
      : []
  })

const normalizePackageOffer = (value: unknown): LocalPackageOffer | null => {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const id = toOptionalStringId(raw.id)
  const name = String(raw.name ?? "").trim()
  if (!id || !name) return null

  return {
    id,
    name,
    bundleId: toOptionalStringId(raw.bundleId ?? raw.bundle_template_id),
    bundleQty: normalizePositiveInt(raw.bundleQty ?? raw.bundle_qty, 1),
    machineIds: normalizeStringIdArray(raw.machineIds ?? raw.machine_ids ?? raw.machine_ids_json),
    machineQty: normalizePositiveInt(raw.machineQty ?? raw.machine_qty, 1),
    machineItems: normalizeQtyItems(raw.machineItems ?? raw.machine_items ?? raw.machine_items_json),
    techniqueIds: normalizeStringIdArray(raw.techniqueIds ?? raw.technique_ids ?? raw.technique_ids_json),
    techniqueQty: normalizePositiveInt(raw.techniqueQty ?? raw.technique_qty, 1),
    techniqueItems: normalizeQtyItems(raw.techniqueItems ?? raw.technique_items ?? raw.technique_items_json),
    evaluationIds: normalizeStringIdArray(raw.evaluationIds ?? raw.evaluation_ids ?? raw.evaluation_ids_json),
    evaluationQty: normalizePositiveInt(raw.evaluationQty ?? raw.evaluation_qty, 1),
    evaluationItems: normalizeQtyItems(raw.evaluationItems ?? raw.evaluation_items ?? raw.evaluation_items_json),
    addOnIds: normalizeStringIdArray(raw.addOnIds ?? raw.add_on_ids ?? raw.add_on_ids_json),
    addOnQty: normalizePositiveInt(raw.addOnQty ?? raw.add_on_qty, 1),
    addOnItems: normalizeQtyItems(raw.addOnItems ?? raw.add_on_items ?? raw.add_on_items_json),
    sessionIds: normalizeStringIdArray(raw.sessionIds ?? raw.session_ids ?? raw.session_ids_json),
    sessionQty: normalizePositiveInt(raw.sessionQty ?? raw.session_qty, 1),
    sessionItems: normalizeQtyItems(raw.sessionItems ?? raw.session_items ?? raw.session_items_json),
    invoiceSubItems: normalizeInvoiceSubItems(raw.invoiceSubItems ?? raw.invoice_sub_items),
    status: typeof raw.status === "string" ? raw.status : undefined
  }
}

const loadLguInvoiceCatalog = async (): Promise<void> => {
  if (lguInvoiceCatalogLoaded.value) return

  try {
    localServices.value = JSON.parse(localStorage.getItem("singlePayServices") || "[]") as LocalService[]
  } catch {
    localServices.value = []
  }
  try {
    localBundles.value = JSON.parse(localStorage.getItem("bundledServices") || "[]") as LocalBundle[]
  } catch {
    localBundles.value = []
  }
  try {
    const parsed = JSON.parse(localStorage.getItem("packageServiceOffers") || "[]") as unknown[]
    localPackageOffers.value = Array.isArray(parsed)
      ? parsed.map(normalizePackageOffer).filter((item): item is LocalPackageOffer => item !== null)
      : []
  } catch {
    localPackageOffers.value = []
  }

  try {
    const [globalResponse, lguResponse] = await Promise.all([
      pamsAPI.get<Pageable<unknown>>("/package-service-offers", { params: { page: 1, size: 1000, status: "ALL", scope: "GLOBAL" } }),
      pamsAPI.get<Pageable<unknown>>("/package-service-offers", { params: { page: 1, size: 1000, status: "ALL", scope: "LGU" } })
    ])
    const merged = [
      ...(globalResponse.data?.content ?? []),
      ...(lguResponse.data?.content ?? [])
    ].map(normalizePackageOffer).filter((item): item is LocalPackageOffer => item !== null)
    const byId = new Map(localPackageOffers.value.map(item => [item.id, item]))
    merged.forEach(item => byId.set(item.id, item))
    localPackageOffers.value = Array.from(byId.values())
  } catch {
    // Local package catalog is enough for printing older saved packages.
  } finally {
    lguInvoiceCatalogLoaded.value = true
  }
}

const findPackageOffer = (pkgId?: string | number, pkgName?: string): LocalPackageOffer | undefined => {
  const id = String(pkgId ?? "").trim()
  if (id) {
    const match = localPackageOffers.value.find(item => item.id === id)
    if (match) return match
  }
  const normalizeName = (value?: string): string =>
    String(value ?? "").trim().replace(/\s+\(LGU\s+.*?\)\s*$/i, "").toLowerCase()
  const name = normalizeName(pkgName)
  return name
    ? localPackageOffers.value.find(item => {
        const candidate = normalizeName(item.name)
        return candidate === name || candidate.startsWith(name) || name.startsWith(candidate)
      })
    : undefined
}

const findBundle = (bundleId?: string | number): LocalBundle | undefined => {
  const id = String(bundleId ?? "").trim()
  return id ? localBundles.value.find(bundle => bundle.id === id) : undefined
}

const getServiceName = (id?: string): string | undefined =>
  id ? localServices.value.find(service => service.id === id)?.name : undefined

const getServicePrice = (id?: string): number | undefined => {
  if (!id) return undefined
  const price = Number(localServices.value.find(service => service.id === id)?.price ?? 0)
  return price > 0 ? price : undefined
}

const getServicePriceByName = (name?: string): number | undefined => {
  const normalized = String(name ?? "").trim().toLowerCase()
  if (!normalized) return undefined
  const price = Number(localServices.value.find(service => service.name.trim().toLowerCase() === normalized)?.price ?? 0)
  return price > 0 ? price : undefined
}

const enrichSubItemPrices = (items?: LguInvoiceSubItem[]): LguInvoiceSubItem[] | undefined => {
  if (!items?.length) return items
  return items.map(item => ({
    ...item,
    unitPrice: item.children?.length ? undefined : item.unitPrice ?? getServicePriceByName(item.name),
    children: enrichSubItemPrices(item.children)
  }))
}

const hasNestedSubItems = (items?: LguInvoiceSubItem[]): boolean =>
  Boolean(items?.some(item => (item.children?.length ?? 0) > 0 || hasNestedSubItems(item.children)))

const sumPricedSubItems = (items?: LguInvoiceSubItem[]): number =>
  (items ?? []).reduce((sum, item) => {
    if (item.children?.length) return sum + sumPricedSubItems(item.children)
    const quantity = Math.max(1, Number(item.quantity ?? 1))
    return sum + quantity * Number(item.unitPrice ?? 0)
  }, 0)

const getLguInvoiceLineTotal = (line: { lineTotal?: number; unitPrice?: number; quantity?: number; subItems?: LguInvoiceSubItem[] }): number => {
  const subItemTotal = sumPricedSubItems(line.subItems)
  if (subItemTotal > 0) return subItemTotal
  const lineTotal = Number(line.lineTotal ?? 0)
  if (lineTotal > 0) return lineTotal
  return Math.max(1, Number(line.quantity ?? 1)) * Number(line.unitPrice ?? 0)
}

const isDropoutClaimBilling = (billing?: Pick<LguPatientBilling, "pricing_source"> | null): boolean =>
  String(billing?.pricing_source ?? "").toUpperCase().includes("DROPOUT")

const normalizeLguStatus = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase()

const isCrossMonthDroppedOutSession = (option: LguInvoiceSessionOption): boolean => {
  const packageName = String(option.packageName ?? "").trim().toLowerCase()
  const packageStatus = selectedPatientDetail.value?.package_availments.find((pkg) =>
    String(pkg.package_name ?? "").trim().toLowerCase() === packageName
  )?.status
  if (normalizeLguStatus(packageStatus) === "CROSS_MONTH_DROPPED_OUT") return true

  const appointmentStatus = selectedPatientDetail.value?.appointments.find((appointment) =>
    appointment.appointment_id === option.appointmentId
  )?.status
  return normalizeLguStatus(appointmentStatus) === "CROSS_MONTH_DROPPED_OUT"
}

const getPrintableBillingTotal = (billing?: LguPatientBilling): number => {
  if (!billing) return 0
  const fallbackTotal = Number(billing.amount_due ?? 0)
  if (!isDropoutClaimBilling(billing) && fallbackTotal > 0) return fallbackTotal
  const lines = parseClaimLineItems(billing.line_items_json ?? undefined)
  const lineTotal = lines.reduce((sum, line) => {
    const shouldUseIndividualServices = isDropoutClaimBilling(billing)
    const subItems = shouldUseIndividualServices && line.subItems?.length
      ? enrichSubItemPrices(line.subItems)
      : shouldUseIndividualServices && String(line.type ?? "").toLowerCase() === "package"
        ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true)
        : undefined
    return sum + getLguInvoiceLineTotal({ ...line, subItems })
  }, 0)
  return lineTotal > 0 ? lineTotal : fallbackTotal
}

const expandPackageItemIds = (
  items: Array<{id: string; qty: number}> | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined,
  multiplier: number,
  includePrices: boolean
): LguInvoiceSubItem[] =>
  (items?.length ? items : (ids ?? []).map(id => ({ id, qty: normalizePositiveInt(fallbackQty, 1) })))
    .flatMap(item => {
      const name = getServiceName(item.id)
      return name
        ? [{
            name,
            quantity: Math.max(1, normalizePositiveInt(item.qty, 1) * multiplier),
            unitPrice: includePrices ? getServicePrice(item.id) : undefined
          }]
        : []
    })

const getPackageInvoiceSubItems = (pkgId?: string | number, pkgName?: string, multiplier = 1, includePrices = false): LguInvoiceSubItem[] => {
  const pkg = findPackageOffer(pkgId, pkgName)
  if (!pkg) return []

  if (pkg.invoiceSubItems?.length) {
    const multiply = (items: LguInvoiceSubItem[]): LguInvoiceSubItem[] =>
      items.map(item => ({
        name: item.name,
        quantity: Math.max(1, normalizePositiveInt(item.quantity, 1) * multiplier),
        unitPrice: includePrices ? item.unitPrice : undefined,
        children: item.children?.length ? multiply(item.children) : undefined
      }))
    return multiply(pkg.invoiceSubItems)
  }

  const subItems: LguInvoiceSubItem[] = []
  const bundle = findBundle(pkg.bundleId)
  if (bundle) {
    const bundleIds = [
      ...(bundle.machineIds ?? []),
      ...(bundle.techniqueIds ?? []),
      ...(bundle.evaluationIds ?? []),
      ...(bundle.addOnIds ?? [])
    ]
    subItems.push({
      name: bundle.name,
      quantity: Math.max(1, normalizePositiveInt(pkg.bundleQty, 1) * multiplier),
      children: bundleIds.flatMap(id => {
        const name = getServiceName(id)
        return name
          ? [{
              name,
              quantity: Math.max(1, normalizePositiveInt(pkg.bundleQty, 1) * multiplier),
              unitPrice: includePrices ? getServicePrice(id) : undefined
            }]
          : []
      })
    })
  }

  subItems.push(
    ...expandPackageItemIds(pkg.machineItems, pkg.machineIds, pkg.machineQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.evaluationItems, pkg.evaluationIds, pkg.evaluationQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.addOnItems, pkg.addOnIds, pkg.addOnQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.sessionItems, pkg.sessionIds, pkg.sessionQty, multiplier, includePrices)
  )
  return subItems
}

const parseClaimLineItems = (raw?: string): Array<{
  id?: string | number
  type?: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  treatmentDate?: string
  sessionSequence?: string
  totalSessions?: number
  claimStatus?: string
  subItems?: LguInvoiceSubItem[]
}> => {
  if (!raw) return []
  try {
    type RawLguSubItem = {name?: string; quantity?: number; price?: number; unitPrice?: number; unit_price?: number; children?: RawLguSubItem[]}
    const normalizeSubItems = (items?: RawLguSubItem[]): LguInvoiceSubItem[] =>
      (items ?? []).map(item => ({
        name: String(item.name ?? "Service"),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0) > 0
          ? Number(item.unitPrice ?? item.unit_price ?? item.price)
          : undefined,
        children: normalizeSubItems(item.children)
      }))
    const parsed = JSON.parse(raw) as Array<{
      id?: string | number
      name?: string
      type?: string
      quantity?: number
      price?: number
      treatmentDate?: string
      sessionSequenceLabel?: string
      sessionSequence?: string | number
      totalSessions?: string | number
      claimStatus?: string
      subItems?: RawLguSubItem[]
    }>
    if (!Array.isArray(parsed)) return []
    return parsed.map(line => {
      const quantity = Math.max(1, Number(line.quantity ?? 1))
      const unitPrice = Number(line.price ?? 0)
      const sequence = line.sessionSequenceLabel
        || (
          line.sessionSequence && line.totalSessions
            ? `Session ${line.sessionSequence} of ${line.totalSessions}`
            : undefined
        )
      return {
        id: line.id,
        type: line.type,
        name: String(line.name ?? "LGU Session"),
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
        treatmentDate: line.treatmentDate,
        sessionSequence: sequence,
        totalSessions: Number(line.totalSessions ?? 0) > 0 ? Number(line.totalSessions) : undefined,
        claimStatus: line.claimStatus,
        subItems: Array.isArray(line.subItems)
          ? normalizeSubItems(line.subItems)
          : undefined
      }
    })
  } catch {
    return []
  }
}

const openClaimPrintWindow = (title: string): Window => {
  const popup = window.open("", "_blank")
  if (!popup || popup.closed) {
    throw new Error("Please allow pop-ups so the LGU claim PDF can open.")
  }
  popup.document.open()
  popup.document.write(`
    <!doctype html>
    <html>
      <head><title>${title}</title><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">Preparing LGU claim PDF...</body>
    </html>
  `)
  popup.document.close()
  return popup
}

const formatYmd = (value: Date): string => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, "0")
  const d = String(value.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

type PatientLguDetailsExportContext = {
  patientDetails: Patient | null
  lguInformation: PatientHMOInformation | null
  profileImageDataUrl: string | null
  transactions: LguDashboardHistoryItem[]
}

const patientExportFileName = (suffix: string): string => {
  const patient = selectedPatientDetail.value
  const name = String(patient?.patient_name || `patient-${patient?.patient_id ?? "lgu"}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${name || "lgu-patient"}-${suffix}-${selectedBillingMonth.value}`
}

const selectedPatientStatusLabel = (): string =>
  formatLguStatus(
    selectedPatientDetail.value?.package_availments[0]?.status
    ?? selectedPatientDetail.value?.dropout_status
    ?? selectedPatientDetail.value?.authorizations[0]?.authorization_status
  )

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const getPatientInitials = (fullName?: string): string => {
  if (!fullName?.trim()) return "NA"
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return `${first}${last}`.toUpperCase() || "NA"
}

const formatReferralChannel = (channel?: string | null): string => {
  if (channel === "ONLINE") return "Online"
  if (channel === "OFFLINE") return "Offline"
  return "N/A"
}

const formatPatientAddress = (patient?: Patient | null): string => {
  if (!patient) return "N/A"
  const addressParts = [
    patient.details,
    patient.baranggay_name,
    patient.city_name,
    patient.province_name,
    patient.region_name
  ].filter(Boolean)

  return addressParts.length ? addressParts.join(", ") : "N/A"
}

const loadPatientLguDetailsExportContext = async (patientId: number): Promise<PatientLguDetailsExportContext> => {
  const [patientResult, imageResult, transactionsResult, lguInformationResult] = await Promise.allSettled([
    pamsAPI.get<Patient>(`/patients/${patientId}`).then(response => response.data),
    pamsAPI.get<Blob>(`/patients/${patientId}/profile-image/file?t=${Date.now()}`, {
      responseType: "blob"
    }).then(response => blobToDataUrl(response.data)),
    lguBillingService.getDashboardHistory(
      200,
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    ),
    patientHMOInformationService.getByPatientId(patientId)
  ])

  const transactions = transactionsResult.status === "fulfilled"
    ? (transactionsResult.value ?? []).filter(entry => Number(entry.patient_id ?? 0) === patientId)
    : lguTransactionHistory.value.filter(entry => Number(entry.patient_id ?? 0) === patientId)

  return {
    patientDetails: patientResult.status === "fulfilled" ? patientResult.value : null,
    lguInformation: lguInformationResult.status === "fulfilled"
      ? (lguInformationResult.value ?? []).find(entry => entry.sponsor_context === "LGU") ?? null
      : null,
    profileImageDataUrl: imageResult.status === "fulfilled" ? imageResult.value : null,
    transactions
  }
}

const renderEmptyRow = (colspan: number, label: string): string =>
  `<tr><td colspan="${colspan}" class="muted">${escapeHtml(label)}</td></tr>`

const renderBillingRows = (): string => {
  const billings = selectedPatientDetail.value?.billings ?? []
  if (!billings.length) return renderEmptyRow(6, "No LGU claim billings generated yet.")
  return billings.map(billing => `
    <tr>
      <td>${escapeHtml(billing.public_id || `BILL-${billing.id}`)}</td>
      <td>${escapeHtml(billing.service_name || "-")}</td>
      <td>${escapeHtml(billing.pricing_source || "-")}</td>
      <td>${escapeHtml(billing.billing_status || "-")}</td>
      <td>${escapeHtml(formatDateTime(billing.created_at))}</td>
      <td class="right">${escapeHtml(asCurrency(billing.amount_due))}</td>
    </tr>
  `).join("")
}

const renderAppointmentRows = (): string => {
  const appointments = selectedPatientDetail.value?.appointments ?? []
  if (!appointments.length) return renderEmptyRow(4, "No appointments recorded yet.")
  return appointments.map((appointment, index) => `
    <tr>
      <td>Session ${index + 1}<br /><span class="muted">APT-${escapeHtml(appointment.appointment_id)}</span></td>
      <td>${escapeHtml(formatDateTime(appointment.appointment_date))}</td>
      <td>${escapeHtml(appointment.package_name || "-")}</td>
      <td>${escapeHtml(formatLguStatus(appointment.status))}</td>
    </tr>
  `).join("")
}

const renderAvailedSessionRows = (): string => {
  const sessions = invoiceSessionOptions.value
  if (!sessions.length) return renderEmptyRow(7, "No availed LGU sessions recorded yet.")
  return sessions.map(option => {
    const appointmentStatus = selectedPatientDetail.value?.appointments.find(appointment =>
      appointment.appointment_id === option.appointmentId
    )?.status
    const reference = option.billingId
      ? selectedPatientDetail.value?.billings.find(billing => billing.id === option.billingId)?.public_id ?? `BILLING-${option.billingId}`
      : "-"
    return `
      <tr>
        <td>${escapeHtml(option.label)}</td>
        <td>${escapeHtml(formatDateTime(option.appointmentDate))}</td>
        <td>${escapeHtml(option.packageName)}</td>
        <td>${escapeHtml(option.serviceName)}</td>
        <td>${escapeHtml(formatLguStatus(appointmentStatus))}</td>
        <td>${escapeHtml(option.claimLabel)}</td>
        <td>${escapeHtml(reference)}</td>
      </tr>
    `
  }).join("")
}

const getSessionUnitTotal = (option: LguInvoiceSessionOption): number => {
  if (!option.billingId) return 0
  const billing = selectedPatientDetail.value?.billings.find(item => item.id === option.billingId)
  const billingTotal = getPrintableBillingTotal(billing)
  const sessionCount = invoiceSessionOptions.value.filter(session => session.billingId === option.billingId).length || 1
  return Number((billingTotal / sessionCount).toFixed(2))
}

type BillingSummaryInvoiceRow = {
  itemNumber: string
  treatmentDate: string
  serviceRendered: string
  sessionSequence: string
  unitTotal: number
}

type StatementOfAccountInvoiceRow = BillingSummaryInvoiceRow & {
  patientName: string
  referralFormNo: string
  referenceNo: string
  programStatus: string
}

const flattenPricedSubItems = (items?: LguInvoiceSubItem[]): Array<{name: string; quantity: number; unitPrice: number}> =>
  (items ?? []).flatMap(item => {
    if (item.children?.length) return flattenPricedSubItems(item.children)
    return [{
      name: item.name,
      quantity: Math.max(1, Number(item.quantity ?? 1)),
      unitPrice: Number(item.unitPrice ?? 0)
    }]
  })

const claimLineMatchesSession = (
  line: ReturnType<typeof parseClaimLineItems>[number],
  option: LguInvoiceSessionOption
): boolean => {
  const sequenceText = String(line.sessionSequence ?? "").trim()
  const sequenceNumber = Number(sequenceText.match(/\d+/)?.[0] ?? sequenceText)
  if (Number.isFinite(sequenceNumber) && sequenceNumber === option.sessionSequence) return true
  const lineDate = line.treatmentDate ? formatYmd(new Date(line.treatmentDate)) : ""
  const sessionDate = option.appointmentDate ? formatYmd(new Date(option.appointmentDate)) : ""
  return !!lineDate && lineDate === sessionDate
}

const getBillingSummarySessionRows = (
  option: LguInvoiceSessionOption,
  index: number
): BillingSummaryInvoiceRow[] => {
  const billing = getSessionBilling(option)
  const shouldUseIndividualServices = isDropoutClaimBilling(billing) || isCrossMonthDroppedOutSession(option)
  const treatmentDate = new Date(option.appointmentDate).toLocaleDateString("en-PH")
  const sessionSequence = option.label

  if (!shouldUseIndividualServices) {
    return [{
      itemNumber: String(index + 1),
      treatmentDate,
      serviceRendered: option.packageName || billing?.package_name || billing?.service_name || "LGU Package",
      sessionSequence,
      unitTotal: getSessionUnitTotal(option)
    }]
  }

  const lines = parseClaimLineItems(billing?.line_items_json ?? undefined)
  const matchedLines = lines.length > 1 ? lines.filter(line => claimLineMatchesSession(line, option)) : lines
  const sourceLines = matchedLines.length ? matchedLines : lines.length === 1 ? lines : []

  const serviceRows = sourceLines.flatMap(line => {
    const subItems = line.subItems?.length
      ? enrichSubItemPrices(line.subItems)
      : String(line.type ?? "").toLowerCase() === "package"
        ? getPackageInvoiceSubItems(line.id, line.name, 1, true)
        : undefined
    const pricedSubItems = flattenPricedSubItems(subItems)
      .filter(item => item.unitPrice > 0)

    if (pricedSubItems.length) {
      return pricedSubItems.map(item => ({
        serviceRendered: `${item.quantity} ${item.name}`,
        unitTotal: Number((item.quantity * item.unitPrice).toFixed(2))
      }))
    }

    const lineTotal = getLguInvoiceLineTotal({ ...line, subItems })
    return lineTotal > 0
      ? [{
          serviceRendered: `${Math.max(1, Number(line.quantity ?? 1))} ${line.name}`,
          unitTotal: Number(lineTotal.toFixed(2))
        }]
      : []
  })

  const rows = serviceRows.length
    ? serviceRows
    : [{
        serviceRendered: option.serviceName || option.packageName || "LGU Session",
        unitTotal: getSessionUnitTotal(option)
      }]

  return rows.map((row, rowIndex) => ({
    itemNumber: rowIndex === 0 ? String(index + 1) : "",
    treatmentDate,
    serviceRendered: row.serviceRendered,
    sessionSequence,
    unitTotal: row.unitTotal
  }))
}

const getBillingSummaryInvoiceRows = (sessions = invoiceSessionOptions.value): BillingSummaryInvoiceRow[] =>
  sessions.flatMap((option, index) => getBillingSummarySessionRows(option, index))

const getPatientBillingSummaryAmount = (billing: LguPatientBilling): number => {
  const sessions = invoiceSessionOptions.value.filter(option => option.billingId === billing.id)
  const summaryRows = sessions.length ? getBillingSummaryInvoiceRows(sessions) : []
  const summaryTotal = summaryRows.reduce((sum, row) => sum + Number(row.unitTotal ?? 0), 0)
  if (summaryTotal > 0) return Number(summaryTotal.toFixed(2))
  return getPrintableBillingTotal(billing)
}

const renderBillingSummaryInvoiceRows = (rows = getBillingSummaryInvoiceRows()): string => {
  if (!rows.length) return renderEmptyRow(5, "No availed LGU sessions recorded yet.")
  return rows.map(row => `
    <tr${row.itemNumber ? ' class="item-group-start"' : ''}>
      <td class="text-center">${escapeHtml(row.itemNumber)}</td>
      <td class="text-center">${escapeHtml(row.treatmentDate)}</td>
      <td>${escapeHtml(row.serviceRendered)}</td>
      <td class="text-center">${escapeHtml(row.sessionSequence)}</td>
      <td class="text-right">${row.unitTotal > 0 ? escapeHtml(asCurrency(row.unitTotal)) : "-"}</td>
    </tr>
  `).join("")
}

const getSessionBilling = (option: LguInvoiceSessionOption) =>
  option.billingId ? selectedPatientDetail.value?.billings.find(billing => billing.id === option.billingId) : undefined

const getStatementOfAccountRows = (sessions = invoiceSessionOptions.value): StatementOfAccountInvoiceRow[] =>
  sessions.flatMap((option, index) => {
    const billing = getSessionBilling(option)
    const appointmentStatus = selectedPatientDetail.value?.appointments.find(appointment =>
      appointment.appointment_id === option.appointmentId
    )?.status
    const programStatus = appointmentStatus ? formatLguStatus(appointmentStatus) : selectedPatientStatusLabel()
    return getBillingSummarySessionRows(option, index).map(row => ({
      ...row,
      patientName: selectedPatientDetail.value?.patient_name ?? "-",
      referralFormNo: selectedBillingMonth.value,
      referenceNo: billing?.public_id || (option.billingId ? `BILLING-${option.billingId}` : "-"),
      programStatus
    }))
  })

const renderStatementOfAccountRows = (rows = getStatementOfAccountRows()): string => {
  if (!rows.length) return renderEmptyRow(9, "No SOA records for this patient.")
  return rows.map(row => `
      <tr>
        <td class="text-center">${escapeHtml(row.itemNumber)}</td>
        <td>${escapeHtml(row.patientName)}</td>
        <td>${escapeHtml(row.referralFormNo)}</td>
        <td>${escapeHtml(row.referenceNo)}</td>
        <td>${escapeHtml(row.programStatus)}</td>
        <td class="text-center">${escapeHtml(row.treatmentDate)}</td>
        <td>${escapeHtml(row.serviceRendered)}</td>
        <td class="text-center">${escapeHtml(row.sessionSequence)}</td>
        <td class="text-right">${row.unitTotal > 0 ? escapeHtml(asCurrency(row.unitTotal)) : "-"}</td>
      </tr>
    `).join("")
}

const renderPackageRows = (): string => {
  const packages = selectedPatientDetail.value?.package_availments ?? []
  if (!packages.length) return renderEmptyRow(6, "No package availment records yet.")
  return packages.map(pkg => `
    <tr>
      <td>${escapeHtml(pkg.package_name)}</td>
      <td class="right">${escapeHtml(pkg.availed_count)}</td>
      <td class="right">${escapeHtml(pkg.used_count)}</td>
      <td class="right">${escapeHtml(pkg.available_balance)}</td>
      <td>${escapeHtml(pkg.expiry_date || "-")}</td>
      <td>${escapeHtml(formatLguStatus(pkg.status))}</td>
    </tr>
  `).join("")
}

const renderProfileField = (label: string, value: unknown, className = ""): string =>
  `<div class="profile-field ${className}"><strong>${escapeHtml(label)}</strong>${escapeHtml(value === null || value === undefined || value === "" ? "N/A" : value)}</div>`

const formatProfileDate = (value?: string | null): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

const renderProfileSummaryHtml = (context: PatientLguDetailsExportContext): string => {
  const patient = selectedPatientDetail.value
  if (!patient) return ""
  const details = context.patientDetails
  const lguName = context.lguInformation?.lgu_program_name || context.lguInformation?.company_name || selectedProgramName.value || "LGU"
  const displayName = details?.full_name || patient.patient_name
  const profileVisual = context.profileImageDataUrl
    ? `<img src="${escapeHtml(context.profileImageDataUrl)}" alt="${escapeHtml(displayName)} profile" class="profile-photo" />`
    : `<div class="profile-photo-fallback">${escapeHtml(getPatientInitials(displayName))}</div>`

  return `
    <section class="profile-summary">
      ${profileVisual}
      <div>
        <h2 class="profile-name">${escapeHtml(displayName)}</h2>
        <p class="profile-subtitle">
          ${escapeHtml(details?.public_id || `Patient ${patient.patient_id}`)} &middot;
          ${escapeHtml(details?.age == null ? "Age N/A" : `${details.age} years old`)} &middot;
          ${escapeHtml(details?.gender_name || "Gender N/A")} &middot;
          ${escapeHtml(details?.is_active === false ? "Inactive" : "Active")}
        </p>
        <p class="profile-subtitle">
          ${escapeHtml(lguName)} &middot;
          ${escapeHtml(selectedBillingMonth.value)} &middot;
          ${escapeHtml(selectedPatientStatusLabel())}
        </p>
      </div>
    </section>
  `
}

const renderProfileIdentityHtml = (context: PatientLguDetailsExportContext): string => {
  const details = context.patientDetails
  return `
    <section class="profile-section">
      <h2>Patient Profile</h2>
      <div class="profile-grid">
        ${renderProfileField("Civil Status", details?.civil_status_name)}
        ${renderProfileField("Occupation", details?.occupation)}
        ${renderProfileField("Religion", details?.religion_name)}
        ${renderProfileField("Phone", details?.phone_number)}
        ${renderProfileField("Email", details?.email)}
        ${renderProfileField("Facebook", details?.fb_link)}
        ${renderProfileField("Referral Source", details?.mode_of_referral_name, "profile-field-wide")}
        ${renderProfileField("Referring Doctor", details?.referred_by_staff_name || details?.referred_by)}
        ${renderProfileField("Address", formatPatientAddress(details), "profile-field-full")}
      </div>
    </section>
  `
}

const renderProfileLguProgramHtml = (context: PatientLguDetailsExportContext): string => {
  const patient = selectedPatientDetail.value
  if (!patient) return ""
  const lguInfo = context.lguInformation
  const activePackage = patient.package_availments[0]
  const totalBillings = patient.billings.reduce((sum, billing) => sum + getPatientBillingSummaryAmount(billing), 0)
  const usedSessionKeys = new Set<string>()
  patient.authorizations.forEach(authorization => {
    authorization.sessions.forEach(session => {
      usedSessionKeys.add(String(session.id || `${session.appointment_id}-${session.session_sequence}`))
    })
  })
  const usedSessions = usedSessionKeys.size || patient.authorizations.reduce((sum, authorization) => sum + Number(authorization.consumed_sessions ?? 0), 0)
  const totalSessions = patient.authorizations.reduce((sum, authorization) => sum + Number(authorization.total_sessions ?? 0), 0)
    || patient.package_availments.reduce((sum, pkg) => sum + Number(pkg.availed_count ?? 0), 0)
  const remainingSessions = Math.max(0, totalSessions - usedSessions)
  const recentAppointment = patient.appointments[patient.appointments.length - 1]
  const lguName = lguInfo?.lgu_program_name || lguInfo?.company_name || selectedProgramName.value || "LGU"

  return `
    <section class="profile-section">
      <h2>LGU Information</h2>
      <div class="profile-grid">
        ${renderProfileField("LGU Name", lguName)}
        ${renderProfileField("Referral Form No.", lguInfo?.referral_form_no || lguInfo?.approval_code)}
        ${renderProfileField("Date of Referral Issued", formatProfileDate(lguInfo?.referral_issued_date || lguInfo?.validity_start_date))}
        ${renderProfileField("Billing Month", selectedBillingMonth.value)}
        ${renderProfileField("Program Status", selectedPatientStatusLabel())}
        ${renderProfileField("Current Package", activePackage?.package_name || "N/A")}
        ${renderProfileField("Sessions Used / Remaining", `${usedSessions} used / ${remainingSessions} remaining${totalSessions ? ` (${totalSessions} authorized)` : ""}`)}
        ${renderProfileField("Total Claim Billings", asCurrency(totalBillings))}
        ${renderProfileField("Recent Appointment", recentAppointment ? formatDateTime(recentAppointment.appointment_date) : "N/A")}
        ${renderProfileField("LGU Notes", lguInfo?.notes, "profile-field-full")}
      </div>
    </section>
  `
}

const renderProfileAppointmentsHtml = (): string => {
  const sessions = [...invoiceSessionOptions.value].sort((left, right) =>
    String(right.appointmentDate ?? "").localeCompare(String(left.appointmentDate ?? ""))
  )
  const rows = getBillingSummaryInvoiceRows(sessions)

  return `
    <section class="profile-section">
      <h2>Recent Appointment</h2>
      <table class="compact-table">
        <thead><tr><th>ITEM No.</th><th>TREATMENT DATE</th><th>PT SERVICE RENDERED</th><th>SESSION SEQUENCE</th><th>UNIT TOTAL</th></tr></thead>
        <tbody>${renderBillingSummaryInvoiceRows(rows)}</tbody>
      </table>
    </section>
  `
}

const renderLguProfileBodyHtml = (context: PatientLguDetailsExportContext): string => `
  ${renderProfileSummaryHtml(context)}
  ${renderProfileIdentityHtml(context)}
  ${renderProfileLguProgramHtml(context)}
  ${renderProfileAppointmentsHtml()}
`

const exportPatientBillingSummary = async (): Promise<void> => {
  const patient = selectedPatientDetail.value
  if (!patient) return
  await loadLguInvoiceCatalog()
  const sessions = invoiceSessionOptions.value
  const rows = getBillingSummaryInvoiceRows(sessions)
  const referenceNumber = `LGU-SUMMARY-${patient.patient_id}-${selectedBillingMonth.value}`
  const grandTotal = rows.reduce((sum, row) => sum + row.unitTotal, 0)
  let popup: Window
  try {
    popup = openClaimPrintWindow(referenceNumber)
  } catch {
    errorToast(toast, "Unable to open billing summary. Allow pop-ups for this site, then try again.")
    return
  }

  const detailRows: InvoiceDetailRow[] = [
    { label: "Billing To", value: selectedProgramName.value || "LGU" },
    { label: "Referral Form No.", value: "N/A" },
    { label: "Date Issued", value: new Date().toLocaleDateString("en-PH") },
    { label: "Patient Program Status", value: selectedPatientStatusLabel() }
  ]

  renderStandardInvoiceWindow(popup, {
    title: "Patient Billing Summary",
    headerTitle: "PATIENT BILLING SUMMARY",
    fileName: patientExportFileName("billing-summary"),
    billingDate: new Date().toISOString(),
    referenceNumber,
    patientName: patient.patient_name,
    columns: [
      { label: "ITEM No.", width: "68px", align: "center" },
      { label: "TREATMENT DATE", width: "110px", align: "center" },
      { label: "PT SERVICE RENDERED" },
      { label: "SESSION SEQUENCE", width: "120px", align: "center" },
      { label: "UNIT TOTAL", width: "126px", align: "right" }
    ],
    tableRowsHtml: renderBillingSummaryInvoiceRows(rows),
    emptyStateColspan: 5,
    discount: 0,
    grandTotal,
    detailBoxTitle: "LGU DETAILS",
    detailRows,
    renderErrorMessage: "The LGU billing summary could not be rendered. Please try again."
  })
}

const exportPatientSoa = async (): Promise<void> => {
  const patient = selectedPatientDetail.value
  if (!patient) return
  if (!hasValidPatientSoaRange.value) {
    errorToast(toast, "Select the SOA transaction period before printing.")
    return
  }

  await loadLguInvoiceCatalog()
  const [fromDate, toDate] = patientSoaRange.value as Date[]
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999)
  const sessions = invoiceSessionOptions.value.filter(option => {
    const appointmentDate = new Date(option.appointmentDate)
    return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= from && appointmentDate <= to
  })
  const rows = getStatementOfAccountRows(sessions)
  const transactionPeriod = `${formatDateOnly(fromDate)} - ${formatDateOnly(toDate)}`
  const billingDate = formatDateOnly(getMonthEndDate(toDate))
  const lguName = selectedProgramName.value || "LGU"
  const referenceNumber = `LGU-SOA-${patient.patient_id}-${formatYmd(fromDate)}-${formatYmd(toDate)}`
  const grandTotal = rows.reduce((sum, row) => sum + row.unitTotal, 0)
  let popup: Window
  try {
    popup = openClaimPrintWindow(referenceNumber)
  } catch {
    errorToast(toast, "Unable to open statement of account. Allow pop-ups for this site, then try again.")
    return
  }

  const detailRows: InvoiceDetailRow[] = [
    { label: "Billing To", value: selectedProgramName.value || "LGU" },
    { label: "Referral Form No.", value: selectedBillingMonth.value },
    { label: "Date Issued", value: new Date().toLocaleDateString("en-PH") },
    { label: "Patient Program Status", value: selectedPatientStatusLabel() }
  ]

  renderStandardInvoiceWindow(popup, {
    title: "Statement of the Account",
    headerTitle: "STATEMENT OF THE ACCOUNT",
    fileName: patientExportFileName("soa"),
    billingDate: toDate.toISOString(),
    referenceNumber,
    topMetaRows: [
      { label: "Partner Institution", value: lguName },
      { label: "Billing Date", value: billingDate },
      { label: "Transaction Period", value: transactionPeriod }
    ],
    patientName: patient.patient_name,
    columns: [
      { label: "ITEM No.", width: "58px", align: "center" },
      { label: "PATIENT NAME", width: "140px" },
      { label: "REFERRAL FORM NO.", width: "120px" },
      { label: "REFERENCE NO.", width: "120px" },
      { label: "PROGRAM STATUS", width: "110px" },
      { label: "TREATMENT DATE", width: "105px", align: "center" },
      { label: "PT SERVICE RENDERED" },
      { label: "SESSION SEQUENCE", width: "110px", align: "center" },
      { label: "INVOICE BILLING TOTAL", width: "130px", align: "right" }
    ],
    tableRowsHtml: renderStatementOfAccountRows(rows),
    emptyStateColspan: 9,
    discount: 0,
    grandTotal,
    detailBoxTitle: "LGU DETAILS",
    detailRows,
    renderErrorMessage: "The statement of the account could not be rendered. Please try again.",
    pageSize: "A4 landscape",
    maxWidthPx: 1320
  })
  patientSoaPickerVisible.value = false
}

const exportPatientLguDetails = async (): Promise<void> => {
  const patient = selectedPatientDetail.value
  if (!patient) return
  await loadLguInvoiceCatalog()

  let popup: Window
  try {
    popup = openClaimPrintWindow("LGU Patient Details")
  } catch {
    errorToast(toast, "Unable to open LGU details. Allow pop-ups for this site, then try again.")
    return
  }

  let context: PatientLguDetailsExportContext
  try {
    context = await loadPatientLguDetailsExportContext(patient.patient_id)
  } catch (error: unknown) {
    popup.close()
    errorToast(toast, extractApiErrorMessage(error, "Failed to prepare LGU patient details"))
    return
  }

  const details = context.patientDetails
  const lguInfo = context.lguInformation
  const totalBillings = patient.billings.reduce((sum, billing) => sum + Number(billing.amount_due ?? 0), 0)
  const lguName = lguInfo?.lgu_program_name || lguInfo?.company_name || selectedProgramName.value || "LGU"

  renderStandardInvoiceWindow(popup, {
    title: "LGU Patient Details",
    headerTitle: "LGU PATIENT DETAILS",
    fileName: patientExportFileName("lgu-details"),
    billingDate: new Date().toISOString(),
    referenceNumber: `LGU-DETAILS-${patient.patient_id}-${selectedBillingMonth.value}`,
    topMetaRows: [
      { label: "TRANSACTION PERIOD", value: selectedBillingMonth.value },
      { label: "BILLING DATE", value: new Date().toLocaleDateString("en-PH") }
    ],
    patientName: details?.full_name || patient.patient_name,
    patientAddress: formatPatientAddress(details),
    patientAge: details?.age == null ? "N/A" : String(details.age),
    patientGender: details?.gender_name || "N/A",
    hidePatientDoctorHeader: true,
    columns: [
      { label: "SECTION", width: "120px" },
      { label: "RECORD", width: "170px" },
      { label: "DETAILS" },
      { label: "STATUS", width: "130px" },
      { label: "AMOUNT / BALANCE", width: "150px", align: "right" }
    ],
    tableRowsHtml: "",
    customBodyHtml: renderLguProfileBodyHtml(context),
    emptyStateColspan: 5,
    discount: 0,
    grandTotal: totalBillings,
    detailBoxTitle: "LGU DETAILS",
    detailRows: [
      { label: "LGU Name", value: lguName },
      { label: "Referral Form No.", value: lguInfo?.referral_form_no || lguInfo?.approval_code || "N/A" },
      { label: "Date of Referral Issued", value: lguInfo?.referral_issued_date || lguInfo?.validity_start_date || "N/A" },
      { label: "Billing Month", value: selectedBillingMonth.value },
      { label: "Patient Program Status", value: selectedPatientStatusLabel() },
      { label: "Total Claim Billings", value: asCurrency(totalBillings) }
    ],
    hideFinancialSummary: true,
    renderErrorMessage: "The LGU patient details could not be rendered. Please try again.",
    pageSize: "A4 landscape",
    maxWidthPx: 1320
  })
}

const inferLguPackageTotalSessions = (name?: string, fallback = 1): number => {
  const match = String(name ?? "").match(/\((\d+)\)\s*Sessions?/i)
  return match ? Math.max(1, Number(match[1])) : Math.max(1, fallback)
}

const renderDashboardStatementOfAccountRows = (rows: LguDashboardHistoryItem[]): string => {
  if (!rows.length) return renderEmptyRow(9, "No SOA records found for the selected period.")
  return rows.map((row, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${escapeHtml(row.patient_name || "-")}</td>
      <td>${escapeHtml(row.reference_label || "-")}</td>
      <td>${escapeHtml(row.phase1_billing_public_id || row.receipt_number || "-")}</td>
      <td>${escapeHtml(formatLguStatus(row.billing_status || row.usage_status || "-"))}</td>
      <td class="text-center">${escapeHtml(new Date(row.created_at).toLocaleDateString("en-PH"))}</td>
      <td>${escapeHtml(row.service_name || "LGU Session")}</td>
      <td class="text-center">-</td>
      <td class="text-right">${Number(row.amount_out ?? 0) > 0 ? escapeHtml(asCurrency(Number(row.amount_out ?? 0))) : "-"}</td>
    </tr>
  `).join("")
}

const generateSoa = async (): Promise<void> => {
  if (!hasValidSoaRange.value) return
  const [from, to] = soaRange.value as Date[]
  const lguName = selectedProgramName.value || "LGU"
  const transactionPeriod = `${formatDateOnly(from)} - ${formatDateOnly(to)}`
  const billingDate = formatDateOnly(getMonthEndDate(to))
  const referenceNumber = `LGU-SOA-${formatYmd(from)}-${formatYmd(to)}`
  let popup: Window
  try {
    popup = openClaimPrintWindow(referenceNumber)
  } catch {
    errorToast(toast, "Unable to open statement of account. Allow pop-ups for this site, then try again.")
    return
  }

  try {
    const rows = await lguBillingService.getSoa({
      from: formatYmd(from),
      to: formatYmd(to),
      limit: 5000,
      program_id: selectedProgramId.value ?? undefined
    }) ?? []
    const grandTotal = rows.reduce((sum, row) => sum + Number(row.amount_out ?? 0), 0)
    const detailRows: InvoiceDetailRow[] = [
      { label: "Billing To", value: lguName },
      { label: "Date Issued", value: new Date().toLocaleDateString("en-PH") },
      { label: "Record Count", value: String(rows.length) }
    ]

    renderStandardInvoiceWindow(popup, {
      title: "Statement of the Account",
      headerTitle: "STATEMENT OF THE ACCOUNT",
      fileName: `soa-${formatYmd(from)}-${formatYmd(to)}`,
      billingDate: to.toISOString(),
      referenceNumber,
      topMetaRows: [
        { label: "Partner Institution", value: lguName },
        { label: "Billing Date", value: billingDate },
        { label: "Transaction Period", value: transactionPeriod }
      ],
      patientName: lguName,
      hidePatientDoctorHeader: true,
      columns: [
        { label: "ITEM No.", width: "58px", align: "center" },
        { label: "PATIENT NAME", width: "140px" },
        { label: "REFERRAL FORM NO.", width: "120px" },
        { label: "REFERENCE NO.", width: "120px" },
        { label: "PROGRAM STATUS", width: "110px" },
        { label: "TREATMENT DATE", width: "105px", align: "center" },
        { label: "PT SERVICE RENDERED" },
        { label: "SESSION SEQUENCE", width: "110px", align: "center" },
        { label: "INVOICE BILLING TOTAL", width: "130px", align: "right" }
      ],
      tableRowsHtml: renderDashboardStatementOfAccountRows(rows),
      emptyStateColspan: 9,
      discount: 0,
      grandTotal,
      detailBoxTitle: "LGU DETAILS",
      detailRows,
      renderErrorMessage: "The statement of the account could not be rendered. Please try again.",
      pageSize: "A4 landscape",
      maxWidthPx: 1320
    })
    exportsModalVisible.value = false
  } catch (error: unknown) {
    if (!popup.closed) popup.close()
    errorToast(toast, extractApiErrorMessage(error, "Failed to generate SOA"))
  }
}

const renderLguPatientCopyHtml = (patients: Patient[]): string => {
  const lguName = "All LGU Patients"
  const rows = patients.map((patient, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>${escapeHtml(patient.public_id || `PATIENT-${patient.id}`)}</td>
      <td>${escapeHtml(patient.full_name)}</td>
      <td class="center">${escapeHtml(patient.age ?? "N/A")}</td>
      <td>${escapeHtml(patient.gender_name || "N/A")}</td>
      <td>${escapeHtml(patient.phone_number || "N/A")}</td>
      <td>${escapeHtml(formatPatientAddress(patient) || "N/A")}</td>
    </tr>
  `).join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(lguName)} Patient Copy</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
          .sheet { padding: 18px; }
          .top { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 12px; }
          h1 { margin: 0; font-size: 20px; letter-spacing: 0.04em; }
          .meta { text-align: right; font-size: 12px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #111827; padding: 6px 8px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
          .center { text-align: center; }
          @media print { .print-hidden { display: none; } }
        </style>
      </head>
      <body>
        <main class="sheet">
          <button class="print-hidden" onclick="window.print()" style="float:right;margin-bottom:10px;">Print</button>
          <div class="top">
            <div>
              <h1>COPY OF PATIENTS UNDER ${escapeHtml(lguName)}</h1>
              <div>LGU Patient Masterlist</div>
            </div>
            <div class="meta">
              <div><strong>Partner Institution:</strong> ${escapeHtml(lguName)}</div>
              <div><strong>Generated Date:</strong> ${escapeHtml(new Date().toLocaleDateString("en-PH"))}</div>
              <div><strong>Total Patients:</strong> ${patients.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">ITEM No.</th>
                <th style="width: 130px;">PATIENT ID</th>
                <th style="width: 210px;">PATIENT NAME</th>
                <th style="width: 70px;">AGE</th>
                <th style="width: 100px;">GENDER</th>
                <th style="width: 140px;">CONTACT NO.</th>
                <th>ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="7" class="center">No patients found for this LGU.</td></tr>`}
            </tbody>
          </table>
        </main>
      </body>
    </html>
  `
}

const exportLguPatientCopy = async (): Promise<void> => {
  exportingLguPatients.value = true
  try {
    const { data } = await pamsAPI.get<Pageable<Patient>>("/patients", {
      params: {
        page: 1,
        size: 10000,
        status: "ALL",
        sponsor_context: "LGU"
      }
    })
    const popup = window.open("", "_blank", "noopener,noreferrer")
    if (!popup || popup.closed) {
      throw new Error("Please allow pop-ups so the patient copy can open.")
    }
    popup.document.open()
    popup.document.write(renderLguPatientCopyHtml(data?.content ?? []))
    popup.document.close()
    exportsModalVisible.value = false
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to export LGU patient copy"))
  } finally {
    exportingLguPatients.value = false
  }
}

const buildEncounterTicketCards = (detail: BillingListItem): EncounterTicketPdfCard[] => {
  const billingRoute = (() => {
    const n = String(detail.billing_type ?? "").trim().toUpperCase()
    if (n === "LGU_BILLING" || n === "LGU") return "LGU"
    if (n === "HMO_BILLING" || n === "HMO") return "HMO"
    if (n.includes("SELF_PAY")) return "Self Pay"
    return detail.billing_type?.trim() || "N/A"
  })()
  return (detail.encounter_tickets ?? [])
    .filter(ticket => ticket.record_locked)
    .map(ticket => {
      const snap = ticket.billing_snapshot
      const snapBillingType = snap?.billing_type ?? detail.billing_type

      const pkgName   = ticket.active_billing_package_name?.trim()   || snap?.active_billing_package_name?.trim()   || ""
      const pkgId     = ticket.active_billing_package_id?.trim()     || snap?.active_billing_package_id?.trim()     || ""
      const pkgSource = ticket.active_billing_package_source?.trim() || snap?.active_billing_package_source?.trim() || ""

      const describePackageLabel = (): string => {
        if (pkgName && pkgId && pkgName !== pkgId) return `${pkgName} (${pkgId})`
        return pkgName || pkgId || "No active billing package linked"
      }
      const formatPkgSource = (src: string): string => {
        const n = src.trim().toUpperCase()
        if (n === "PATIENT_PACKAGE_SERVICE_PURCHASE") return "Linked from patient package service purchase"
        if (n === "PATIENT_PACKAGE_PURCHASE")         return "Linked from patient package purchase"
        if (n === "PHASE1_BILLING_PACKAGE")           return "Linked from the billing package record"
        if (n === "BILLING_LINE_ITEM_PACKAGE")        return "Linked from the saved billing package line item"
        return src.trim() || "Linked billing package"
      }
      const describePackageSource = (): string | undefined => {
        if (!pkgSource) return undefined
        return pkgId ? `${formatPkgSource(pkgSource)} · Linked ID ${pkgId}` : formatPkgSource(pkgSource)
      }
      const buildDeductionSummary = (): string => {
        const n = String(snapBillingType ?? "").trim().toUpperCase().replace(/[: -]/g, "_")
        if (["HMO", "HMO_BILLING"].includes(n))  return "Deducting 1 Session from HMO Allocation"
        if (["LGU", "LGU_BILLING"].includes(n))  return "Deducting 1 Session from LGU Authorization"
        if (n === "SELF_PAY_PACKAGE")             return "Recording 1 Attended Package Session"
        return "Attendance record only"
      }

      return {
        slipNumber: ticket.slip_number || `ETS-${ticket.id}`,
        encounterTicketId: ticket.id,
        patientName: snap?.patient_name || detail.patient_name || "Patient",
        providerName: snap?.provider_name || detail.physical_therapist || "Unassigned",
        serviceName: snap?.service_name || detail.service_name || "Therapy Session",
        specialtyName: snap?.specialty_tag_name,
        specialtyIsActive: snap?.specialty_tag_is_active,
        treatmentAreaName: snap?.treatment_area_name,
        treatmentAreaColor: snap?.treatment_area_color,
        treatmentAreaIsActive: snap?.treatment_area_is_active,
        billingRoute,
        attendanceStatus: ticket.attendance_status === "ATTENDED" ? "Attended" : "No Show",
        attendedAt: ticket.attended_at,
        signedOffAt: ticket.signed_off_at,
        lockedAt: ticket.locked_at,
        appointmentId: snap?.appointment_public_id ?? ticket.appointment_public_id ?? detail.appointment_public_id ?? detail.appointment_id,
        billingId: ticket.phase1_billing_public_id ?? detail.public_id ?? detail.id,
        activeBillingPackageLabel: describePackageLabel(),
        activeBillingPackageSource: describePackageSource(),
        deductionSummary: buildDeductionSummary(),
        signatureDataUrl: ticket.patient_signature_data_url,
        ptSignatureDataUrl: ticket.pt_signature_data_url,
        sessionSequenceLabel: snap?.session_sequence_label
      } as EncounterTicketPdfCard
    })
}

const exportBulkLguEncounterTickets = async (): Promise<void> => {
  if (!hasValidBulkTicketRange.value) return
  const [from, to] = bulkTicketRange.value as Date[]
  const fromStr = formatYmd(from)
  const toStr = formatYmd(to)

  let popup: Window
  try {
    popup = openEncounterTicketPdfWindow("LGU Bulk Encounter Ticket PDF")
  } catch {
    errorToast(toast, "Unable to open PDF window. Allow pop-ups for this site, then try again.")
    return
  }

  exportingBulkTickets.value = true
  try {
    const response = await billingPhase1Service.getAll({
      page: 1,
      size: 500,
      billing_type: "LGU_BILLING",
      from_date: fromStr,
      to_date: toStr
    })
    const billingIds = (response?.content ?? []).map(b => b.id).filter(id => Number.isFinite(id) && id > 0)
    if (!billingIds.length) {
      popup.close()
      errorToast(toast, `No LGU billings found between ${fromStr} and ${toStr}`)
      return
    }

    const details = (await Promise.all(billingIds.map(id => billingPhase1Service.getById(id)))).filter((d): d is BillingListItem => !!d)
    const cards = details
      .flatMap(d => buildEncounterTicketCards(d))
      .sort((a, b) => new Date(a.signedOffAt).getTime() - new Date(b.signedOffAt).getTime())

    if (!cards.length) {
      popup.close()
      errorToast(toast, "No locked encounter tickets found for the selected date range")
      return
    }

    renderEncounterTicketBulkPdfWindow(popup, cards, {
      title: "LGU Bulk Encounter Tickets",
      subtitle: `LGU billings from ${fromStr} to ${toStr} · ${cards.length} ticket${cards.length === 1 ? "" : "s"}`,
      fileName: `lgu-encounter-tickets-${fromStr}-to-${toStr}`
    })
  } catch (e) {
    popup.close()
    errorToast(toast, getApiErrorMessage(e, {baseMessage: "Failed to export LGU encounter tickets"}))
  } finally {
    exportingBulkTickets.value = false
  }
}

const firstDroppedOutAppointmentId = computed<number | null>(() => {
  const appointments = selectedPatientDetail.value?.appointments ?? []
  return appointments.find(appointment =>
    appointment.status === "DROPPED_OUT" || appointment.status === "CROSS_MONTH_DROPPED_OUT"
  )?.appointment_id ?? null
})

const formatLguStatus = (value?: string | null): string => {
  const normalized = String(value ?? "PENDING").trim().toUpperCase()
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "COMPLETED") return "Completed"
  return "Pending"
}

const lguStatusSeverity = (value?: string | null): "success" | "warn" | "danger" | "info" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "COMPLETED") return "success"
  if (normalized === "DROPPED_OUT" || normalized === "CROSS_MONTH_DROPPED_OUT") return "danger"
  if (normalized === "PENDING" || normalized === "ACTIVE") return "warn"
  return "secondary"
}

const formatBudgetPeriod = (year: number, month: number): string =>
  new Date(year, month - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric"
  })

const normalizeBudgetMonthDate = (value?: Date | null): Date => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return new Date(currentMonthStart)
  }
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

const formatEntryType = (value?: string): string =>
  String(value ?? "")
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const entryTypeSeverity = (value?: string): "success" | "info" | "warn" | "danger" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "SESSION_CHARGE") return "warn"
  if (normalized === "REVERSAL") return "danger"
  if (normalized === "ROLLOVER") return "success"
  if (normalized === "MANUAL_ADJUSTMENT") return "info"
  return "secondary"
}

const usageStatusSeverity = (value?: string): "success" | "warn" | "danger" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "APPLIED") return "success"
  if (normalized === "ADJUSTED") return "warn"
  if (normalized === "REVERSED" || normalized === "VOID") return "danger"
  return "secondary"
}

const normalizeLedgerStatus = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase()

const resolveLedgerAmount = (entry: LguDashboardHistoryItem): number => {
  const billingAmountDue = Number(entry.billing_amount_due ?? 0)
  if (billingAmountDue > 0) return billingAmountDue
  return Math.max(0, Number(entry.amount_out ?? 0))
}

const shouldIgnoreLedgerEntry = (entry: LguDashboardHistoryItem): boolean => {
  const usage = normalizeLedgerStatus(entry.usage_status)
  if (usage === "REVERSED" || usage === "VOID") return true
  return resolveLedgerAmount(entry) <= 0
}

const isUsedLedgerEntry = (entry: LguDashboardHistoryItem): boolean => {
  if (shouldIgnoreLedgerEntry(entry)) return false
  const billingStatus = normalizeLedgerStatus(entry.billing_status)
  const programStatus = normalizeLedgerStatus(entry.program_status)
  return billingStatus === "BILLED"
    || billingStatus === "PAID"
    || programStatus === "COMPLETED"
    || programStatus === "DROPPED_OUT"
}

const usedLguFund = computed(() =>
  lguTransactionHistory.value
    .filter(isUsedLedgerEntry)
    .reduce((sum, entry) => sum + resolveLedgerAmount(entry), 0)
)

const pendingUsedLguFund = computed(() =>
  lguTransactionHistory.value
    .filter(entry => !shouldIgnoreLedgerEntry(entry))
    .filter(entry => !isUsedLedgerEntry(entry))
    .reduce((sum, entry) => sum + resolveLedgerAmount(entry), 0)
)

const totalAvailableFund = computed(() =>
  Math.max(0, Number(baseMonthlyBudget.value ?? 0) + Number(rolloverAmount.value ?? 0))
)

const selectedBudgetPeriodYear = computed(() =>
  normalizeBudgetMonthDate(selectedBudgetMonthDate.value).getFullYear()
)

const selectedBudgetPeriodMonth = computed(() =>
  normalizeBudgetMonthDate(selectedBudgetMonthDate.value).getMonth() + 1
)

const budgetMonthLabel = computed(() => {
  return new Date(selectedBudgetPeriodYear.value, selectedBudgetPeriodMonth.value - 1, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric"
  })
})

const currentMonthLabel = computed(() =>
  new Date(currentMonthStart).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric"
  })
)

const isFutureBudgetMonth = computed(() =>
  selectedBudgetPeriodYear.value > currentMonthStart.getFullYear()
  || (
    selectedBudgetPeriodYear.value === currentMonthStart.getFullYear()
    && selectedBudgetPeriodMonth.value > (currentMonthStart.getMonth() + 1)
  )
)

const remainingAvailableFund = computed(() =>
  Number((totalAvailableFund.value - usedLguFund.value).toFixed(2))
)

const canManageLguDashboard = computed(() => {
  const normalized = currentRoleName.value.trim().toLowerCase()
  if (!normalized) return false
  return MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const lguProgramOptions = computed(() =>
  lguPrograms.value.map(p => ({ ...p, label: `LGU-${p.name}` }))
)

const selectedProgramName = computed(() =>
  lguProgramOptions.value.find(p => p.id === selectedProgramId.value)?.label ?? ""
)

const resolveRoleFromStorage = (): string => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = String(parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole ?? "").trim()
      if (role) return role
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
        const first = parsed.roles[0]
        if (typeof first === "string" && first.trim()) return first.trim()
        if (first && typeof first === "object") {
          const roleObj = first as Record<string, unknown>
          const nested = String(roleObj.name ?? roleObj.role ?? "").trim()
          if (nested) return nested
        }
      }
    } catch {
      // Ignore malformed storage entries.
    }
  }
  return ""
}

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Billing or LGU dashboard access in Role Access",
    invalidInputHint: "LGU values are invalid. Check the period and amount fields, then try again.",
    retryHint: "Please try again."
  })

const hasAnyBudgetDraft = (draft: LocalLguBudgetDraft | null): boolean =>
  Number(draft?.baseMonthlyBudget ?? 0) > 0 || Number(draft?.rolloverAmount ?? 0) > 0

const localDashboardBudgetStorageKey = computed(() =>
  `lgu_dashboard_budget:${selectedProgramId.value ?? "all"}:${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const selectedBillingMonth = computed(() =>
  `${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const readLocalDashboardBudget = (): LocalLguBudgetDraft | null => {
  try {
    const raw = localStorage.getItem(localDashboardBudgetStorageKey.value)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalLguBudgetDraft
    return {
      baseMonthlyBudget: Math.max(0, Number(parsed.baseMonthlyBudget ?? 0)),
      rolloverAmount: Math.max(0, Number(parsed.rolloverAmount ?? 0))
    }
  } catch {
    return null
  }
}

const persistLocalDashboardBudget = (): void => {
  localStorage.setItem(
    localDashboardBudgetStorageKey.value,
    JSON.stringify({
      baseMonthlyBudget: Number(baseMonthlyBudget.value ?? 0),
      rolloverAmount: Number(rolloverAmount.value ?? 0),
      updatedAt: new Date().toISOString()
    })
  )
}

const applyBudgetValues = (payload: { base_budget?: number; rollover_amount?: number; baseMonthlyBudget?: number; rolloverAmount?: number }): void => {
  baseMonthlyBudget.value = Math.max(0, Number(payload.base_budget ?? payload.baseMonthlyBudget ?? 0))
  rolloverAmount.value = Math.max(0, Number(payload.rollover_amount ?? payload.rolloverAmount ?? 0))
}

const loadDashboardBudget = async (): Promise<void> => {
  const localDraft = readLocalDashboardBudget()
  loadingDashboardBudget.value = true
  budgetSyncError.value = ""
  rolloverInput.value = 0
  lguDashboardBudget.value = null
  if (!selectedProgramId.value) {
    applyBudgetValues({})
    hasLocalOnlyBudgetDraft.value = false
    loadingDashboardBudget.value = false
    return
  }
  try {
    const serverBudget = await lguBillingService.getDashboardBudget(
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    )
    if (serverBudget) {
      lguDashboardBudget.value = serverBudget
      applyBudgetValues(serverBudget)
      hasLocalOnlyBudgetDraft.value = false
      persistLocalDashboardBudget()
      return
    }

    lguDashboardBudget.value = null
    applyBudgetValues(localDraft ?? {})
    hasLocalOnlyBudgetDraft.value = hasAnyBudgetDraft(localDraft)
  } catch (error: unknown) {
    lguDashboardBudget.value = null
    applyBudgetValues(localDraft ?? {})
    hasLocalOnlyBudgetDraft.value = hasAnyBudgetDraft(localDraft)
    budgetSyncError.value = extractApiErrorMessage(error, "Failed to load the live LGU budget")
  } finally {
    loadingDashboardBudget.value = false
  }
}

  const openPatientDetail = async (
    patientId: number | null | undefined,
    periodYear?: number,
    periodMonth?: number
  ): Promise<void> => {
    if (!patientId) return
    const detailPeriodYear = Number.isFinite(periodYear) ? Number(periodYear) : selectedBudgetPeriodYear.value
    const detailPeriodMonth = Number.isFinite(periodMonth) ? Number(periodMonth) : selectedBudgetPeriodMonth.value
    selectedPatientDetail.value = null
    patientDetailError.value = ""
    showPatientDetailDialog.value = true
    loadingPatientDetail.value = true
    try {
      const [detailResult] = await Promise.allSettled([
        lguBillingService.getPatientCreditDetail(
          patientId,
          detailPeriodYear,
          detailPeriodMonth
        ),
        loadLguInvoiceCatalog()
      ])
      if (detailResult.status === "rejected") throw detailResult.reason
      selectedPatientDetail.value = detailResult.value ?? null
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to load patient LGU credit details")
    } finally {
      loadingPatientDetail.value = false
    }
  }

  const refreshSelectedPatientDetail = async (): Promise<void> => {
    const patientId = selectedPatientDetail.value?.patient_id
    if (!patientId) return
    try {
      selectedPatientDetail.value = await lguBillingService.getPatientCreditDetail(
        patientId,
        selectedBudgetPeriodYear.value,
        selectedBudgetPeriodMonth.value
      ) ?? null
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to refresh patient LGU credit details")
    }
  }

  const openInvoiceSessionPicker = (): void => {
    invoiceSessionPickerVisible.value = true
  }

  const openPatientSoaPicker = (): void => {
    patientSoaPickerVisible.value = true
  }

  const printSessionInvoice = async (option: LguInvoiceSessionOption): Promise<void> => {
    if (!option.billingId) {
      errorToast(toast, "This session does not have a generated LGU claim yet")
      return
    }
    await downloadClaimPdf(option.billingId, option)
  }

  const downloadClaimPdf = async (billingId: number, sessionOption?: LguInvoiceSessionOption): Promise<void> => {
    if (!billingId || printingClaimBillingId.value) return
    printingClaimBillingId.value = billingId
    let popup: Window | null = null
    try {
      const detail = await billingPhase1Service.getById(billingId)
      if (!detail) {
        errorToast(toast, "LGU claim billing could not be loaded")
        return
      }

      await loadLguInvoiceCatalog()
      const referenceNumber = getClaimReferenceNumber(detail)
      popup = openClaimPrintWindow(referenceNumber)
      const lines = parseClaimLineItems(detail.line_items_json)
      const total = Number(detail.total_amount ?? detail.amount_due ?? 0)
      const isDropoutClaim = String(detail.pricing_source ?? "").toUpperCase().includes("DROPOUT")
        || lines.some(line => String(line.claimStatus ?? "").toUpperCase() === "DROPPED_OUT")
      const allLockedTickets = (detail.encounter_tickets ?? [])
        .filter(ticket => ticket.record_locked)
        .sort((left, right) => {
          const leftDate = String(left.billing_snapshot?.starts_at ?? left.attended_at ?? "")
          const rightDate = String(right.billing_snapshot?.starts_at ?? right.attended_at ?? "")
          return leftDate.localeCompare(rightDate)
        })
      const scopedLockedTickets = sessionOption
        ? allLockedTickets.filter(ticket =>
            ticket.appointment_id === sessionOption.appointmentId
            || ticket.billing_snapshot?.appointment_id === sessionOption.appointmentId
          )
        : allLockedTickets
      const lockedTickets = scopedLockedTickets.length ? scopedLockedTickets : allLockedTickets
      const matchesSessionLine = (line: (typeof lines)[number]): boolean => {
        if (!sessionOption) return true
        const sequenceText = String(line.sessionSequence ?? "").trim()
        const sequenceNumber = Number(sequenceText.match(/\d+/)?.[0] ?? sequenceText)
        if (Number.isFinite(sequenceNumber) && sequenceNumber === sessionOption.sessionSequence) return true
        const lineDate = line.treatmentDate ? formatYmd(new Date(line.treatmentDate)) : ""
        const sessionDate = sessionOption.appointmentDate ? formatYmd(new Date(sessionOption.appointmentDate)) : ""
        return !!lineDate && lineDate === sessionDate
      }
      const scopedLines = sessionOption && lines.length > 1 ? lines.filter(matchesSessionLine) : lines
      const shouldRenderSingleSelectedPackageSession = !!sessionOption
        && lines.length === 1
        && String(lines[0]?.type ?? "").toLowerCase() === "package"
      const shouldExpandSinglePackageLine = !sessionOption
        && lines.length === 1
        && lockedTickets.length > 1
        && String(lines[0]?.type ?? "").toLowerCase() === "package"
      const invoiceLines = shouldRenderSingleSelectedPackageSession
        ? (() => {
            const line = lines[0]
            const totalSessions = line.totalSessions ?? sessionOption.totalSessions ?? inferLguPackageTotalSessions(line.name, lockedTickets.length)
            const sourceTotal = Number(line.unitPrice || line.lineTotal || total || 0)
            const unitPrice = totalSessions > 0 ? sourceTotal / totalSessions : sourceTotal
            return [{
              name: line.name,
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
              treatmentDate: sessionOption.appointmentDate,
              sessionSequence: sessionOption.label,
              subItems: isDropoutClaim
                ? (
                    hasNestedSubItems(line.subItems)
                      ? enrichSubItemPrices(line.subItems)
                      : getPackageInvoiceSubItems(line.id, line.name, line.quantity, true).length
                      ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true)
                      : enrichSubItemPrices(line.subItems)
                  )
                : line.subItems?.length
                  ? line.subItems
                  : getPackageInvoiceSubItems(line.id, line.name, line.quantity)
            }]
          })()
        : shouldExpandSinglePackageLine
        ? (() => {
            const line = lines[0]
            const sourceTotal = Number(line.unitPrice || line.lineTotal || total || 0)
            const unitPrice = lockedTickets.length > 0 ? sourceTotal / lockedTickets.length : sourceTotal
            const totalSessions = line.totalSessions ?? inferLguPackageTotalSessions(line.name, lockedTickets.length)

            return lockedTickets.map((ticket, index) => ({
              name: line.name,
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
              treatmentDate: ticket.billing_snapshot?.starts_at || ticket.attended_at || detail.created_at,
              sessionSequence: `Session ${index + 1} of ${totalSessions}`,
              subItems: isDropoutClaim
                ? (
                    hasNestedSubItems(line.subItems)
                      ? enrichSubItemPrices(line.subItems)
                      : getPackageInvoiceSubItems(line.id, line.name, line.quantity, true).length
                      ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true)
                      : enrichSubItemPrices(line.subItems)
                  )
                : line.subItems?.length
                  ? line.subItems
                  : getPackageInvoiceSubItems(line.id, line.name, line.quantity)
            }))
          })()
        : scopedLines.map((line, index) => ({
            name: line.name,
            quantity: line.quantity,
            unitPrice: isDropoutClaim ? 0 : line.unitPrice,
            lineTotal: isDropoutClaim ? 0 : line.lineTotal,
            treatmentDate: sessionOption?.appointmentDate || line.treatmentDate || lockedTickets[index]?.billing_snapshot?.starts_at || lockedTickets[index]?.attended_at || detail.created_at,
            sessionSequence: sessionOption?.label || line.sessionSequence || lockedTickets[index]?.billing_snapshot?.session_sequence_label || String(index + 1),
            subItems: isDropoutClaim
              ? (
                  hasNestedSubItems(line.subItems)
                    ? enrichSubItemPrices(line.subItems)
                    : getPackageInvoiceSubItems(line.id, line.name, line.quantity, true).length
                    ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true)
                    : enrichSubItemPrices(line.subItems)
                )
              : line.subItems?.length
                ? line.subItems
                : String(line.type ?? "").toLowerCase() === "package"
                  ? getPackageInvoiceSubItems(line.id, line.name, line.quantity)
                  : undefined
          }))
      const calculatedInvoiceTotal = invoiceLines.reduce((sum, line) => sum + getLguInvoiceLineTotal(line), 0)
      const invoiceTotal = calculatedInvoiceTotal > 0 ? calculatedInvoiceTotal : total
      const lguStatus = detail.lgu_patient_program_status
        || selectedPatientDetail.value?.package_availments[0]?.status
        || lines.find(line => line.claimStatus)?.claimStatus
        || detail.billing_status
      renderLguInvoiceWindow(popup, {
        billingDate: detail.created_at,
        referenceNumber: sessionOption ? `${referenceNumber} - ${sessionOption.label}` : referenceNumber,
        patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
        patientAddress: detail.patient_address,
        patientAge: detail.patient_age,
        patientGender: detail.patient_gender,
        physicalTherapist: detail.physical_therapist,
        doctor: detail.doctor,
        diagnosis: detail.diagnosis,
        lguProgramName: detail.lgu_program_name || selectedProgramName.value,
        lguReferenceLabel: detail.lgu_patient_referral_form_no || detail.lgu_reference_label || detail.service_name || selectedBillingMonth.value,
        lguDateIssued: detail.lgu_date_issued || detail.created_at,
        lguStatus: formatLguStatus(lguStatus),
        subtotal: invoiceTotal,
        discount: Number(detail.discount_amount ?? 0),
        grandTotal: invoiceTotal,
        lines: invoiceLines
      }, { title: sessionOption ? "LGU Session Invoice" : "LGU Claim PDF", fileName: sessionOption ? `${referenceNumber}-${sessionOption.label.replace(/\s+/g, "-").toLowerCase()}` : referenceNumber })
    } catch (error: unknown) {
      if (popup && !popup.closed) popup.close()
      errorToast(toast, extractApiErrorMessage(error, "Failed to download LGU claim PDF"))
    } finally {
      printingClaimBillingId.value = null
    }
  }

  const createClaimsForEligibleAppointments = async (): Promise<void> => {
    if (isCreatingClaims.value || !selectedPatientDetail.value) return
    isCreatingClaims.value = true
    try {
      const result = await lguBillingService.createPatientClaim({
        patient_id: selectedPatientDetail.value.patient_id,
        billing_month: selectedBillingMonth.value
      })
      successToast(
        toast,
        result?.consumed_count
          ? `${result.consumed_count} session${result.consumed_count > 1 ? "s" : ""} claimed (${result.billing_public_id ?? ""}) for ${selectedBillingMonth.value}.`
          : `Claim created for ${selectedBillingMonth.value}.`
      )
      await Promise.all([loadTransactionHistory(), refreshSelectedPatientDetail()])
      if (result?.billing_id) {
        await downloadClaimPdf(result.billing_id)
      }
    } catch (error: unknown) {
      errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU claim"))
    } finally {
      isCreatingClaims.value = false
    }
  }

const loadTransactionHistory = async (): Promise<void> => {
  loadingTransactionHistory.value = true
  transactionHistoryError.value = ""
  if (!selectedProgramId.value) {
    lguTransactionHistory.value = []
    loadingTransactionHistory.value = false
    return
  }
  try {
    lguTransactionHistory.value = await lguBillingService.getDashboardHistory(
      100,
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    ) ?? []
  } catch (error: unknown) {
    lguTransactionHistory.value = []
    transactionHistoryError.value = extractApiErrorMessage(error, "Failed to load LGU transaction history")
  } finally {
    loadingTransactionHistory.value = false
  }
}

const loadLguPatients = async (): Promise<void> => {
  loadingLguPatients.value = true
  lguPatientsError.value = ""
  try {
    const { data } = await pamsAPI.get<Pageable<Patient>>("/patients", {
      params: {
        page: 1,
        size: 10000,
        status: "ALL",
        sponsor_context: "LGU",
        lgu_program_id: selectedProgramId.value ?? undefined,
        period_year: selectedBudgetPeriodYear.value,
        period_month: selectedBudgetPeriodMonth.value
      }
    })
    lguPatients.value = data?.content ?? []
  } catch (error: unknown) {
    lguPatients.value = []
    lguPatientsError.value = extractApiErrorMessage(error, "Failed to load LGU patients")
  } finally {
    loadingLguPatients.value = false
  }
}

const saveDashboardBudget = async (): Promise<void> => {
  if (!selectedProgramId.value) {
    errorToast(toast, "Select an LGU program first")
    return
  }
  persistLocalDashboardBudget()
  savingDashboardBudget.value = true
  budgetSyncError.value = ""
  try {
    const savedBudget = await lguBillingService.saveDashboardBudget({
      base_budget: Number(baseMonthlyBudget.value ?? 0),
      rollover_amount: Number(rolloverAmount.value ?? 0),
      period_year: selectedBudgetPeriodYear.value,
      period_month: selectedBudgetPeriodMonth.value,
      program_id: selectedProgramId.value ?? undefined
    })

    lguDashboardBudget.value = savedBudget ?? null
    if (savedBudget) {
      applyBudgetValues(savedBudget)
    }
    hasLocalOnlyBudgetDraft.value = false
    persistLocalDashboardBudget()
    successToast(toast, `LGU budget is now live for ${budgetMonthLabel.value}`)
  } catch (error: unknown) {
    hasLocalOnlyBudgetDraft.value = true
    const message = extractApiErrorMessage(error, "Failed to save the live LGU budget")
    budgetSyncError.value = message
    errorToast(toast, message)
  } finally {
    savingDashboardBudget.value = false
  }
}

const refreshDashboardBudget = async (): Promise<void> => {
  refreshingDashboardBudget.value = true
  budgetSyncError.value = ""
  try {
    if (canManageLguDashboard.value) {
      const result = await lguBillingService.refreshDashboardBudget(
        selectedBudgetPeriodYear.value,
        selectedBudgetPeriodMonth.value,
        selectedProgramId.value ?? undefined
      )
      await Promise.all([
        loadDashboardBudget(),
        loadTransactionHistory(),
        loadLguPatients()
      ])
      successToast(
        toast,
        result?.reversed_entries
          ? `LGU budget refreshed. Reversed ${result.reversed_entries} duplicate billing charge${result.reversed_entries === 1 ? "" : "s"}.`
          : "LGU budget refreshed successfully"
      )
      return
    }

    await Promise.all([
      loadDashboardBudget(),
      loadTransactionHistory(),
      loadLguPatients()
    ])
  } catch (error: unknown) {
    const message = extractApiErrorMessage(error, "Failed to refresh the LGU budget")
    budgetSyncError.value = message
    errorToast(toast, message)
  } finally {
    refreshingDashboardBudget.value = false
  }
}

const addRolloverAmount = (): void => {
  const amount = Math.max(0, Number(rolloverInput.value ?? 0))
  if (amount <= 0) {
    errorToast(toast, "Enter a rollover amount greater than 0")
    return
  }
  rolloverAmount.value = Number(rolloverAmount.value ?? 0) + amount
  rolloverInput.value = 0
}

watch(selectedBudgetMonthDate, (value) => {
  const normalized = normalizeBudgetMonthDate(value)
  if (!(value instanceof Date) || normalized.getTime() !== value.getTime()) {
    selectedBudgetMonthDate.value = normalized
    return
  }

  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})

watch(selectedProgramId, () => {
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory(),
    loadLguPatients()
  ])
})

const loadLguPrograms = async (): Promise<void> => {
  loadingPrograms.value = true
  try {
    const programs = await lguBillingService.getPrograms()
    lguPrograms.value = programs ?? []
    if (lguPrograms.value.length > 0 && !selectedProgramId.value) {
      selectedProgramId.value = lguPrograms.value[0].id
    } else if (!lguPrograms.value.length) {
      selectedProgramId.value = null
    }
  } catch {
    lguPrograms.value = []
    selectedProgramId.value = null
  } finally {
    loadingPrograms.value = false
  }
}

const createNewProgram = async (): Promise<void> => {
  const name = newProgramName.value.trim()
  if (!name) return
  creatingProgram.value = true
  try {
    const created = await lguBillingService.createProgram(name)
    if (created) {
      await loadLguPrograms()
      selectedProgramId.value = created.id
      successToast(toast, `LGU program "${name}" created`)
    }
    showNewProgramInput.value = false
    newProgramName.value = ""
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU program"))
  } finally {
    creatingProgram.value = false
  }
}

onMounted(async () => {
  currentRoleName.value = resolveRoleFromStorage()
  await loadLguPrograms()
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory(),
    loadLguPatients()
  ])
})
</script>
