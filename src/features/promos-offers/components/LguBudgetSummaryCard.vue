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

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in lguOperationalCards"
        :key="card.label"
        class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="m-0 text-xs font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">{{ card.label }}</p>
            <p :class="['m-0 mt-2 text-2xl font-bold', card.valueClass]">{{ card.value }}</p>
          </div>
          <span :class="['rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-white/10', card.iconClass]">
            <i :class="card.icon" />
          </span>
        </div>
      </article>
    </section>

    <div class="flex justify-end">
      <Button
        label="Claimed"
        icon="pi pi-check-circle"
        severity="success"
        :loading="claimingLguPayments"
        :disabled="claimingLguPayments || lguOutstandingAmount <= 0"
        @click="claimOutstandingLguBillings"
      />
    </div>

    <LguBudgetSnapshot
      v-if="budgetLedgerVisible"
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
      :printing-claim-billing-id="printingClaimBillingId"
      :creating-claim="creatingPatientClaim"
      :format-date-time="formatDateTime"
      :format-lgu-status="formatLguStatus"
      :lgu-status-severity="lguStatusSeverity"
      @print-attendance-record="exportPatientAttendanceRecord"
      @export-patient-lgu-details="exportPatientLguDetails"
      @export-patient-billing-summary="exportPatientProfileBillingSummary"
      @create-claim="createSelectedPatientClaim"
      @download-claim-pdf="downloadClaimPdf"
    />

  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import { useRouter } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import Calendar from "primevue/calendar"
import Dialog from "primevue/dialog"
import { useToast } from "primevue/usetoast"
import LguBudgetSetup from "./lgu-budget-summary-card/LguBudgetSetup.vue"
import LguBudgetSnapshot from "./lgu-budget-summary-card/LguBudgetSnapshot.vue"
import LguDashboardHeader from "./lgu-budget-summary-card/LguDashboardHeader.vue"
import LguDashboardTables from "./lgu-budget-summary-card/LguDashboardTables.vue"
import LguExportsDialog from "./lgu-budget-summary-card/LguExportsDialog.vue"
import LguPatientCreditDetailDialog from "./lgu-budget-summary-card/LguPatientCreditDetailDialog.vue"
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
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import {
  openEncounterTicketPdfWindow,
  renderEncounterTicketPdfWindow,
  renderAttendanceRecordPdfWindow,
  renderEncounterTicketBulkPdfWindow,
  type EncounterTicketPdfCard
} from "@/utils/encounter-ticket-pdf.util"
import { LGU_BILLING_TYPE, isLguBillingType } from "@/features/promos-offers/lgu/lgu-billing-type.module"
import type { Patient } from "@/features/patients/types/patient"
import type { PatientHMOInformation } from "@/models/hmo-information"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import { useAuthSessionStore } from "@/stores/auth-session.store"

const toast = useToast()
const router = useRouter()
const queryClient = useQueryClient()
const authSession = useAuthSessionStore()
const { roleName } = storeToRefs(authSession)

const fetchBillingDetail = async (billingId: number): Promise<BillingListItem | undefined> => {
  return (await billingContextTanstackService.fetchContext(queryClient, billingId))?.billing
}

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
const printingClaimBillingId = ref<number | null>(null)
const creatingPatientClaim = ref(false)
const exportsModalVisible = ref(false)
const patientSoaPickerVisible = ref(false)
const invoiceSessionPickerVisible = ref(false)
const showPatientProfilePrintDialog = ref(false)
const patientProfilePrintTarget = ref<"profile" | "billing_summary">("profile")
const patientProfileTransactionRange = ref<Date[] | null>(null)
const invoiceSessionOptions = computed<LguInvoiceSessionOption[]>(() => {
  const patientDetail = selectedPatientDetail.value
  if (!patientDetail) return []

  const billingsById = new Map((patientDetail.billings ?? []).map(billing => [billing.id, billing]))
  const fallbackPackageName = patientDetail.package_availments[0]?.package_name || "LGU Package"

  return (patientDetail.authorizations ?? []).flatMap(authorization => {
    const totalSessions = Math.max(1, Number(authorization.total_sessions ?? authorization.sessions.length ?? 1))
    return (authorization.sessions ?? []).map(session => {
      const billingId = session.dropout_billing_id ?? session.monthly_billing_id ?? null
      const billing = billingId ? billingsById.get(billingId) : undefined

      return {
        key: String(session.id),
        label: `Session ${session.session_sequence}`,
        packageName: authorization.package_name || fallbackPackageName,
        serviceName: session.service_name || authorization.package_name || fallbackPackageName,
        appointmentId: session.appointment_id,
        appointmentDate: session.appointment_date,
        sessionSequence: session.session_sequence,
        totalSessions,
        billingId,
        claimLabel: billing?.public_id || (billingId ? `BILLING-${billingId}` : "-"),
        session
      }
    })
  })
})
const soaRange = ref<Date[] | null>(null)
const patientSoaRange = ref<Date[] | null>(null)
const patientSoaMode = ref<"range" | "session">("range")
const selectedPatientSoaSessionKey = ref<string | null>(null)
const bulkTicketRange = ref<Date[] | null>(null)
const exportingBulkTickets = ref(false)
const exportingLguPatients = ref(false)
const claimingLguPayments = ref(false)

type LocalService = { id: string; type?: string; name: string; price?: number; status?: string }
type LocalBundle = {
  id: string
  name: string
  bundledPrice?: number
  machineIds?: string[]
  techniqueIds?: string[]
  evaluationIds?: string[]
  addOnIds?: string[]
}
type LocalPackageItem = {
  id: string
  qty: number
  standardUnitPrice?: number
  packageUnitPrice?: number
  dropoutUnitPrice?: number
}
type LguInvoiceSubItem = {
  name: string
  quantity: number
  unitPrice?: number
  dropoutUnitPrice?: number
  children?: LguInvoiceSubItem[]
  sessionSequence?: number | string
  session_sequence?: number | string
  appliesOnSession?: number | string
  applies_on_session?: number | string
  startSession?: number | string
  start_session?: number | string
}
type LocalPackageOffer = {
  id: string
  name: string
  bundleId?: string
  bundleQty?: number
  bundleItems?: LocalPackageItem[]
  machineIds?: string[]
  machineQty?: number
  machineItems?: LocalPackageItem[]
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: LocalPackageItem[]
  evaluationIds?: string[]
  evaluationQty?: number
  evaluationItems?: LocalPackageItem[]
  addOnIds?: string[]
  addOnQty?: number
  addOnItems?: LocalPackageItem[]
  sessionIds?: string[]
  sessionQty?: number
  sessionItems?: LocalPackageItem[]
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

const patientExportFileName = (suffix: string): string => {
  const patient = selectedPatientDetail.value
  const patientLabel = String(patient?.patient_id ?? "patient").trim()
  return `lgu-${patientLabel}-${suffix}`
}

const openPrintableRouteWindow = (
  routeLocation: Parameters<typeof router.resolve>[0],
  fallbackMessage: string
): Window | null => {
  const popup = window.open(router.resolve(routeLocation).href, "_blank")
  if (!popup || popup.closed) {
    errorToast(toast, fallbackMessage)
    return null
  }
  return popup
}

const getSelectedPatientPrintRange = (): { from: Date; to: Date } => {
  const fallbackFrom = new Date(selectedBudgetMonthDate.value.getFullYear(), selectedBudgetMonthDate.value.getMonth(), 1)
  const fallbackTo = getMonthEndDate(selectedBudgetMonthDate.value)
  const [from, to] = hasValidPatientSoaRange.value
    ? patientSoaRange.value as Date[]
    : [fallbackFrom, fallbackTo]
  return { from, to }
}

const createEmptyPatientCreditDetail = (patientId: number): LguPatientCreditDetail => {
  const patient = lguPatients.value.find(item => Number(item.id) === Number(patientId))

  return {
    patient_id: patientId,
    patient_name: patient?.full_name || `Patient ${patientId}`,
    dropout_status: patient?.lgu_patient_status ?? null,
    appointments: [],
    package_availments: [],
    authorizations: [],
    billings: []
  }
}

const openLguPatientPrintRoute = (
  routeName: "lgu-patient-profile-print" | "lgu-patient-billing-summary-print" | "lgu-patient-invoice-billing-print",
  patientId: number,
  options: { billingId?: number | null; appointmentId?: number | null; from?: Date; to?: Date } = {}
): Window | null => {
  const range = options.from && options.to ? { from: options.from, to: options.to } : getSelectedPatientPrintRange()
  return openPrintableRouteWindow(
    {
      name: routeName,
      query: {
        patient_id: String(patientId),
        ...(options.billingId ? { billing_id: String(options.billingId) } : {}),
        ...(options.appointmentId ? { appointment_id: String(options.appointmentId) } : {}),
        transaction_from: formatYmd(range.from),
        transaction_to: formatYmd(range.to),
        autoprint: "1"
      }
    },
    "Unable to open LGU print view. Allow pop-ups for this site, then try again."
  )
}

const inferLguPackageTotalSessions = (name?: string | null, fallback = 1): number => {
  const match = String(name ?? "").match(/(\d+)\s*(?:session|sessions|sesh)/i)
  const parsed = Number(match?.[1] ?? fallback)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Math.max(1, fallback)
}

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

const normalizeOptionalAmount = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value === undefined || value === null || String(value).trim() === "") continue
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return undefined
}

const normalizeStringIdArray = (value: unknown): string[] =>
  parseMaybeJsonArray(value).map(item => toOptionalStringId(item)).filter((item): item is string => Boolean(item))

const normalizeScopedServiceId = (id: string, prefix: string): string =>
  id.includes("-") ? id : `${prefix}${id}`

const normalizeScopedStringIdArray = (value: unknown, prefix: string): string[] =>
  normalizeStringIdArray(value).map(id => normalizeScopedServiceId(id, prefix))

const normalizeQtyItems = (value: unknown): LocalPackageItem[] =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const id = toOptionalStringId(raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
    if (!id) return []
    const standardUnitPrice = normalizeOptionalAmount(raw.standardUnitPrice, raw.standard_unit_price, raw.referencePrice, raw.reference_price)
    const packageUnitPrice = normalizeOptionalAmount(raw.packageUnitPrice, raw.package_unit_price, raw.contractPrice, raw.contract_price, raw.allocatedPrice, raw.allocated_price)
    const dropoutUnitPrice = normalizeOptionalAmount(raw.dropoutUnitPrice, raw.dropout_unit_price, raw.dropoutPrice, raw.dropout_price)
    const isComplimentary = Boolean(raw.isComplimentary ?? raw.is_complimentary)
    return [{
      id,
      qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1),
      ...(standardUnitPrice === undefined ? {} : { standardUnitPrice }),
      ...(packageUnitPrice === undefined && !isComplimentary ? {} : { packageUnitPrice: isComplimentary ? 0 : Number(packageUnitPrice ?? 0) }),
      ...(dropoutUnitPrice === undefined ? {} : { dropoutUnitPrice })
    }]
  })

const normalizeScopedQtyItems = (value: unknown, prefix: string): LocalPackageItem[] =>
  normalizeQtyItems(value).map(item => ({
    ...item,
    id: normalizeScopedServiceId(item.id, prefix)
  }))

const normalizeInvoiceSubItems = (value: unknown): LguInvoiceSubItem[] =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const name = String(raw.name ?? "").trim()
    const rawUnitPrice = raw.unitPrice ?? raw.unit_price ?? raw.price
    const parsedUnitPrice = rawUnitPrice === undefined || rawUnitPrice === null || String(rawUnitPrice).trim() === ""
      ? undefined
      : Number(rawUnitPrice)
    const rawDropoutUnitPrice = raw.dropoutUnitPrice ?? raw.dropout_unit_price ?? raw.dropoutPrice ?? raw.dropout_price
    const parsedDropoutUnitPrice = rawDropoutUnitPrice === undefined || rawDropoutUnitPrice === null || String(rawDropoutUnitPrice).trim() === ""
      ? undefined
      : Number(rawDropoutUnitPrice)
    return name
      ? [{
          name,
          quantity: normalizePositiveInt(raw.quantity, 1),
          unitPrice: parsedUnitPrice !== undefined && Number.isFinite(parsedUnitPrice) && parsedUnitPrice >= 0
            ? parsedUnitPrice
            : undefined,
          dropoutUnitPrice: parsedDropoutUnitPrice !== undefined && Number.isFinite(parsedDropoutUnitPrice) && parsedDropoutUnitPrice >= 0
            ? parsedDropoutUnitPrice
            : undefined,
          sessionSequence: raw.sessionSequence as number | string | undefined,
          session_sequence: raw.session_sequence as number | string | undefined,
          appliesOnSession: raw.appliesOnSession as number | string | undefined,
          applies_on_session: raw.applies_on_session as number | string | undefined,
          startSession: raw.startSession as number | string | undefined,
          start_session: raw.start_session as number | string | undefined,
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
    bundleItems: normalizeScopedQtyItems(raw.bundleItems ?? raw.bundle_items ?? raw.bundle_items_json, "bundle-"),
    machineIds: normalizeScopedStringIdArray(raw.machineIds ?? raw.machine_ids ?? raw.machine_ids_json, "machine-"),
    machineQty: normalizePositiveInt(raw.machineQty ?? raw.machine_qty, 1),
    machineItems: normalizeScopedQtyItems(raw.machineItems ?? raw.machine_items ?? raw.machine_items_json, "machine-"),
    techniqueIds: normalizeScopedStringIdArray(raw.techniqueIds ?? raw.technique_ids ?? raw.technique_ids_json, "technique-"),
    techniqueQty: normalizePositiveInt(raw.techniqueQty ?? raw.technique_qty, 1),
    techniqueItems: normalizeScopedQtyItems(raw.techniqueItems ?? raw.technique_items ?? raw.technique_items_json, "technique-"),
    evaluationIds: normalizeScopedStringIdArray(raw.evaluationIds ?? raw.evaluation_ids ?? raw.evaluation_ids_json, "evaluation-"),
    evaluationQty: normalizePositiveInt(raw.evaluationQty ?? raw.evaluation_qty, 1),
    evaluationItems: normalizeScopedQtyItems(raw.evaluationItems ?? raw.evaluation_items ?? raw.evaluation_items_json, "evaluation-"),
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
    const requestParams = { page: 1, size: 1000, name: "", status: "ALL" }
    const [
      machineResponse,
      techniqueResponse,
      evaluationResponse,
      addOnMachineResponse,
      addOnTechniqueResponse,
      addOnHomeServiceResponse,
      bundleResponse,
      packageResponse
    ] = await Promise.all([
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-machines", { params: requestParams }),
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-techniques", { params: requestParams }),
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-evaluations", { params: requestParams }),
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-add-on-machines", { params: requestParams }),
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-add-on-techniques", { params: requestParams }),
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-add-on-home-services", { params: requestParams }),
      pamsAPI.get<Pageable<Record<string, unknown>>>("/lgu-service-bundles", { params: requestParams }),
      pamsAPI.get<Pageable<unknown>>("/package-service-offers", { params: { ...requestParams, scope: "LGU" } })
    ])

    localServices.value = [
      ...(machineResponse.data?.content ?? []).map(item => ({
        id: `machine-${item.id}`,
        type: "machine",
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: item.is_active === false ? "Inactive" : "Active"
      })),
      ...(techniqueResponse.data?.content ?? []).map(item => ({
        id: `technique-${item.id}`,
        type: "technique",
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: item.is_active === false ? "Inactive" : "Active"
      })),
      ...(evaluationResponse.data?.content ?? []).map(item => ({
        id: `evaluation-${item.id}`,
        type: "evaluation",
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: item.is_active === false ? "Inactive" : "Active"
      })),
      ...(addOnMachineResponse.data?.content ?? []).map(item => ({
        id: `add-on-machine-${item.id}`,
        type: "add-on-machine",
        name: String(item.name ?? item.machine_name ?? `Add-on Machine ${item.id}`),
        price: Number(item.add_on_price ?? item.price ?? 0),
        status: item.is_active === false ? "Inactive" : "Active"
      })),
      ...(addOnTechniqueResponse.data?.content ?? []).map(item => ({
        id: `add-on-technique-${item.id}`,
        type: "add-on-technique",
        name: String(item.name ?? item.technique_name ?? `Add-on Technique ${item.id}`),
        price: Number(item.add_on_price ?? item.price ?? 0),
        status: item.is_active === false ? "Inactive" : "Active"
      })),
      ...(addOnHomeServiceResponse.data?.content ?? []).map(item => ({
        id: `add-on-home-service-${item.id}`,
        type: "add-on-home-service",
        name: String(item.name ?? item.label ?? `Home Service - ${item.start ?? ""} km`),
        price: Number(item.add_on_price ?? item.price ?? 0),
        status: item.is_active === false ? "Inactive" : "Active"
      }))
    ]

    localBundles.value = (bundleResponse.data?.content ?? []).map(row => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      bundledPrice: Number(row.bundled_price ?? 0),
      machineIds: normalizeScopedStringIdArray(row.machine_ids, "machine-"),
      techniqueIds: normalizeScopedStringIdArray(row.technique_ids, "technique-"),
      evaluationIds: normalizeScopedStringIdArray(row.evaluation_ids, "evaluation-"),
      addOnIds: [
        ...normalizeScopedStringIdArray(row.add_on_machine_ids, "add-on-machine-"),
        ...normalizeScopedStringIdArray(row.add_on_technique_ids, "add-on-technique-"),
        ...normalizeScopedStringIdArray(row.add_on_home_service_ids, "add-on-home-service-")
      ]
    })).filter(bundle => bundle.id && bundle.name)

    localPackageOffers.value = (packageResponse.data?.content ?? [])
      .map(normalizePackageOffer)
      .filter((item): item is LocalPackageOffer => item !== null)
  } catch {
    localServices.value = []
    localBundles.value = []
    localPackageOffers.value = []
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

const getBundlePriceByName = (name?: string): number | undefined => {
  const normalized = String(name ?? "").trim().toLowerCase()
  if (!normalized) return undefined
  const bundle = localBundles.value.find(item => item.name.trim().toLowerCase() === normalized)
  if (!bundle) return undefined
  const price = Number(bundle.bundledPrice)
  return Number.isFinite(price) && price >= 0 ? price : undefined
}

type LguInvoicePriceMode = "package" | "dropout"

const findPackageBundleItem = (pkg: LocalPackageOffer): LocalPackageItem | undefined => {
  const bundleId = String(pkg.bundleId ?? "").trim()
  if (!bundleId) return undefined
  const normalizedBundleId = normalizeScopedServiceId(bundleId, "bundle-")
  return pkg.bundleItems?.find(item =>
    item.id === normalizedBundleId ||
    item.id === bundleId ||
    item.id === `bundle-${bundleId}`
  )
}

const getConfiguredPackageItemPrice = (
  item: LocalPackageItem | undefined,
  priceMode: LguInvoicePriceMode
): number | undefined => {
  if (!item) return undefined
  return priceMode === "dropout"
    ? item.dropoutUnitPrice ?? item.standardUnitPrice ?? item.packageUnitPrice
    : item.packageUnitPrice
}

const normalizeCatalogItemName = (value?: string): string =>
  String(value ?? "")
    .trim()
    .replace(/^[-\s]*(?:\d+(?:\.\d+)?|x\d+)\s+/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase()

const catalogNamesMatch = (left?: string, right?: string): boolean => {
  const normalizedLeft = normalizeCatalogItemName(left)
  const normalizedRight = normalizeCatalogItemName(right)
  return !!normalizedLeft && !!normalizedRight && (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  )
}

const findConfiguredPackageItemByName = (
  pkg: LocalPackageOffer,
  name?: string
): LocalPackageItem | undefined => {
  const normalizedName = normalizeCatalogItemName(name)
  if (!normalizedName) return undefined
  const items = [
    ...(pkg.machineItems ?? []),
    ...(pkg.techniqueItems ?? []),
    ...(pkg.evaluationItems ?? []),
    ...(pkg.addOnItems ?? []),
    ...(pkg.sessionItems ?? [])
  ]
  return items.find(item => catalogNamesMatch(getServiceName(item.id), normalizedName))
}

const applyConfiguredPackageRates = (
  pkg: LocalPackageOffer | undefined,
  items: LguInvoiceSubItem[] | undefined,
  priceMode: LguInvoicePriceMode
): LguInvoiceSubItem[] | undefined => {
  if (!items?.length || !pkg) return items
  const bundle = findBundle(pkg.bundleId)
  const bundleItem = findPackageBundleItem(pkg)
  return items.map(item => {
    const isBundleContainer = Boolean(
      item.children?.length &&
      bundleItem &&
      bundle?.name &&
      catalogNamesMatch(item.name, bundle.name)
    )
    const configuredItem = isBundleContainer ? bundleItem : findConfiguredPackageItemByName(pkg, item.name)
    const configuredUnitPrice = getConfiguredPackageItemPrice(configuredItem, priceMode)
    return {
      ...item,
      unitPrice: configuredUnitPrice ?? item.unitPrice,
      dropoutUnitPrice: priceMode === "dropout"
        ? item.dropoutUnitPrice ?? configuredUnitPrice
        : item.dropoutUnitPrice,
      children: applyConfiguredPackageRates(pkg, item.children, priceMode)
    }
  })
}

const enrichSubItemPrices = (
  items?: LguInvoiceSubItem[],
  priceMode: LguInvoicePriceMode = "package"
): LguInvoiceSubItem[] | undefined => {
  if (!items?.length) return items
  return items.map(item => ({
    ...item,
    unitPrice: priceMode === "dropout"
      ? item.dropoutUnitPrice ?? item.unitPrice ?? (item.children?.length ? getBundlePriceByName(item.name) : getServicePriceByName(item.name))
      : item.unitPrice ?? (item.children?.length ? getBundlePriceByName(item.name) : getServicePriceByName(item.name)),
    children: enrichSubItemPrices(item.children, priceMode)
  }))
}

const hasNestedSubItems = (items?: LguInvoiceSubItem[]): boolean =>
  Boolean(items?.some(item => (item.children?.length ?? 0) > 0 || hasNestedSubItems(item.children)))

const hasOwnContractRate = (item: LguInvoiceSubItem): boolean => {
  const unitPrice = Number(item.unitPrice)
  return item.unitPrice !== undefined && Number.isFinite(unitPrice) && unitPrice >= 0
}

const sumPricedSubItems = (items?: LguInvoiceSubItem[]): number =>
  (items ?? []).reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity ?? 1))
    const ownTotal = hasOwnContractRate(item)
      ? quantity * Number(item.unitPrice ?? 0)
      : 0
    return sum + ownTotal + (hasOwnContractRate(item) && item.children?.length ? 0 : sumPricedSubItems(item.children))
  }, 0)

const hasExplicitSubItemPricing = (items?: LguInvoiceSubItem[]): boolean =>
  Boolean((items ?? []).some(item => {
    return hasOwnContractRate(item) || hasExplicitSubItemPricing(item.children)
  }))

const getLguInvoiceLineTotal = (line: { lineTotal?: number; unitPrice?: number; quantity?: number; subItems?: LguInvoiceSubItem[] }): number => {
  const subItemTotal = sumPricedSubItems(line.subItems)
  if (hasExplicitSubItemPricing(line.subItems)) return subItemTotal
  if (subItemTotal > 0) return subItemTotal
  const lineTotal = Number(line.lineTotal ?? 0)
  if (lineTotal > 0) return lineTotal
  return Math.max(1, Number(line.quantity ?? 1)) * Number(line.unitPrice ?? 0)
}

const isDropoutClaimBilling = (billing?: Pick<LguPatientBilling, "pricing_source"> | null): boolean =>
  String(billing?.pricing_source ?? "").toUpperCase().includes("DROPOUT")

const normalizeLguStatus = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase()

const isDroppedOutStatus = (value?: string | null): boolean => {
  const normalized = normalizeLguStatus(value)
  return normalized === "DROPPED_OUT" || normalized === "CROSS_MONTH_DROPPED_OUT"
}

const isCrossMonthDroppedOutSession = (option: LguInvoiceSessionOption): boolean => {
  if (isDroppedOutStatus(selectedPatientDetail.value?.dropout_status)) return true

  const packageName = String(option.packageName ?? "").trim().toLowerCase()
  const packageStatus = selectedPatientDetail.value?.package_availments.find((pkg) =>
    String(pkg.package_name ?? "").trim().toLowerCase() === packageName
  )?.status
  if (isDroppedOutStatus(packageStatus)) return true

  const appointmentStatus = selectedPatientDetail.value?.appointments.find((appointment) =>
    appointment.appointment_id === option.appointmentId
  )?.status
  return isDroppedOutStatus(appointmentStatus)
}

const getPrintableBillingTotal = (billing?: LguPatientBilling): number => {
  if (!billing) return 0
  const fallbackTotal = Number(billing.amount_due ?? 0)
  if (!isDropoutClaimBilling(billing) && fallbackTotal > 0) return fallbackTotal
  const lines = parseClaimLineItems(billing.line_items_json ?? undefined)
  const lineTotal = lines.reduce((sum, line) => {
    const shouldUseIndividualServices = isDropoutClaimBilling(billing)
    const subItems = shouldUseIndividualServices && line.subItems?.length
      ? getPackageLineSubItems(line, true, undefined, billing.package_name || billing.service_name || line.name) ?? enrichSubItemPrices(line.subItems, "dropout")
      : shouldUseIndividualServices && String(line.type ?? "").toLowerCase() === "package"
        ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true, "dropout")
        : undefined
    return sum + getLguInvoiceLineTotal({ ...line, subItems })
  }, 0)
  return lineTotal > 0 ? lineTotal : fallbackTotal
}

const expandPackageItemIds = (
  items: LocalPackageItem[] | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined,
  multiplier: number,
  includePrices: boolean,
  priceMode: LguInvoicePriceMode = "package"
): LguInvoiceSubItem[] => {
  const sourceItems: LocalPackageItem[] = items?.length
    ? items
    : (ids ?? []).map(id => ({ id, qty: normalizePositiveInt(fallbackQty, 1) }))
  return sourceItems.flatMap(item => {
      const name = getServiceName(item.id)
      const configuredPrice = priceMode === "dropout"
        ? item.dropoutUnitPrice ?? item.standardUnitPrice ?? item.packageUnitPrice
        : item.packageUnitPrice
      return name
        ? [{
            name,
            quantity: Math.max(1, normalizePositiveInt(item.qty, 1) * multiplier),
            unitPrice: includePrices ? configuredPrice ?? getServicePrice(item.id) : undefined,
            dropoutUnitPrice: includePrices ? item.dropoutUnitPrice : undefined
          }]
        : []
    })
}

const getPackageInvoiceSubItems = (
  pkgId?: string | number,
  pkgName?: string,
  multiplier = 1,
  includePrices = false,
  priceMode: LguInvoicePriceMode = "package"
): LguInvoiceSubItem[] => {
  const pkg = findPackageOffer(pkgId, pkgName)
  if (!pkg) return []

  if (pkg.invoiceSubItems?.length) {
    const multiply = (items: LguInvoiceSubItem[]): LguInvoiceSubItem[] =>
      items.map(item => ({
        name: item.name,
        quantity: Math.max(1, normalizePositiveInt(item.quantity, 1) * multiplier),
        unitPrice: includePrices ? item.unitPrice : undefined,
        dropoutUnitPrice: includePrices ? item.dropoutUnitPrice : undefined,
        sessionSequence: item.sessionSequence,
        session_sequence: item.session_sequence,
        appliesOnSession: item.appliesOnSession,
        applies_on_session: item.applies_on_session,
        startSession: item.startSession,
        start_session: item.start_session,
        children: item.children?.length ? multiply(item.children) : undefined
      }))
    const configuredSubItems = applyConfiguredPackageRates(pkg, pkg.invoiceSubItems, priceMode) ?? pkg.invoiceSubItems
    const multiplied = multiply(configuredSubItems)
    return includePrices ? enrichSubItemPrices(multiplied, priceMode) ?? multiplied : multiplied
  }

  const subItems: LguInvoiceSubItem[] = []
  const bundle = findBundle(pkg.bundleId)
  if (bundle) {
    const bundleItem = pkg.bundleItems?.find(item => {
      const normalizedBundleId = normalizeScopedServiceId(String(pkg.bundleId ?? ""), "bundle-")
      return item.id === normalizedBundleId || item.id === `bundle-${pkg.bundleId}`
    })
    const bundleQuantity = normalizePositiveInt(bundleItem?.qty ?? pkg.bundleQty, 1)
    const bundlePrice = priceMode === "dropout"
      ? bundleItem?.dropoutUnitPrice ?? bundleItem?.standardUnitPrice ?? bundleItem?.packageUnitPrice ?? Number(bundle.bundledPrice ?? 0)
      : bundleItem?.packageUnitPrice ?? Number(bundle.bundledPrice ?? 0)
    const bundleIds = [
      ...(bundle.machineIds ?? []),
      ...(bundle.techniqueIds ?? []),
      ...(bundle.evaluationIds ?? []),
      ...(bundle.addOnIds ?? [])
    ]
    subItems.push({
      name: bundle.name,
      quantity: Math.max(1, bundleQuantity * multiplier),
      unitPrice: includePrices ? bundlePrice : undefined,
      dropoutUnitPrice: includePrices ? bundleItem?.dropoutUnitPrice : undefined,
      children: bundleIds.flatMap(id => {
        const name = getServiceName(id)
        return name
          ? [{
              name,
              quantity: Math.max(1, bundleQuantity * multiplier)
            }]
          : []
      })
    })
  }

  subItems.push(
    ...expandPackageItemIds(pkg.machineItems, pkg.machineIds, pkg.machineQty, multiplier, includePrices, priceMode),
    ...expandPackageItemIds(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty, multiplier, includePrices, priceMode),
    ...expandPackageItemIds(pkg.evaluationItems, pkg.evaluationIds, pkg.evaluationQty, multiplier, includePrices, priceMode),
    ...expandPackageItemIds(pkg.addOnItems, pkg.addOnIds, pkg.addOnQty, multiplier, includePrices, priceMode),
    ...expandPackageItemIds(pkg.sessionItems, pkg.sessionIds, pkg.sessionQty, multiplier, includePrices, priceMode)
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
    type RawLguSubItem = {
      name?: string
      quantity?: number
      price?: number
      unitPrice?: number
      unit_price?: number
      dropoutUnitPrice?: number
      dropout_unit_price?: number
      dropoutPrice?: number
      dropout_price?: number
      children?: RawLguSubItem[]
    }
    const normalizeSubItems = (items?: RawLguSubItem[]): LguInvoiceSubItem[] =>
      (items ?? []).map(item => ({
        name: String(item.name ?? "Service"),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        unitPrice: item.unitPrice != null || item.unit_price != null || item.price != null
          ? Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0)
          : undefined,
        dropoutUnitPrice: item.dropoutUnitPrice != null || item.dropout_unit_price != null || item.dropoutPrice != null || item.dropout_price != null
          ? Number(item.dropoutUnitPrice ?? item.dropout_unit_price ?? item.dropoutPrice ?? item.dropout_price ?? 0)
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
  billingDetails: BillingListItem[]
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
  const billingIds = (selectedPatientDetail.value?.billings ?? [])
    .map(billing => Number(billing.id))
    .filter(id => Number.isFinite(id) && id > 0)

  const [patientContextResult, imageResult, transactionsResult, billingDetailsResult] = await Promise.allSettled([
    patientTanstackService.fetchContext(queryClient, patientId),
    pamsAPI.get<Blob>(`/patients/${patientId}/profile-image/file?t=${Date.now()}`, {
      responseType: "blob"
    }).then(response => blobToDataUrl(response.data)),
    lguBillingService.getDashboardHistory(
      200,
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    ),
    Promise.all(billingIds.map(id => fetchBillingDetail(id)))
  ])

  const transactions = transactionsResult.status === "fulfilled"
    ? (transactionsResult.value ?? []).filter(entry => Number(entry.patient_id ?? 0) === patientId)
    : lguTransactionHistory.value.filter(entry => Number(entry.patient_id ?? 0) === patientId)

  return {
    patientDetails: patientContextResult.status === "fulfilled" ? patientContextResult.value?.patient ?? null : null,
    lguInformation: patientContextResult.status === "fulfilled"
      ? (patientContextResult.value?.sponsor_information ?? []).find(entry => entry.sponsor_context === "LGU") ?? null
      : null,
    profileImageDataUrl: imageResult.status === "fulfilled" ? imageResult.value : null,
    transactions,
    billingDetails: billingDetailsResult.status === "fulfilled"
      ? billingDetailsResult.value.filter((detail): detail is BillingListItem => Boolean(detail))
      : []
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
  serviceRenderedHtml?: string
  sessionSequence: string
  unitTotal: number
  unitTotalLabel?: string
  unitTotalHtml?: string
  billingId?: number
  appointmentId?: number
  isChildRow?: boolean
}

type StatementOfAccountInvoiceRow = BillingSummaryInvoiceRow & {
  patientName?: string
  referralFormNo?: string
  referenceNo?: string
  programStatus?: string
}

const getSubItemStartSession = (item: LguInvoiceSubItem): number => {
  const parsed = Number(
    item.sessionSequence ??
    item.session_sequence ??
    item.appliesOnSession ??
    item.applies_on_session ??
    item.startSession ??
    item.start_session ??
    1
  )
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 1
}

const filterSubItemsForSession = (
  items: LguInvoiceSubItem[] | undefined,
  sessionSequence: number,
  parentOccurrences = 1
): LguInvoiceSubItem[] =>
  (items ?? []).flatMap(item => {
    const quantity = Math.max(1, Number(item.quantity ?? 1))
    const startSession = getSubItemStartSession(item)
    const occurrences = Math.max(1, quantity * parentOccurrences)
    const isAllocatedToSession = sessionSequence >= startSession && sessionSequence < startSession + occurrences

    if (item.children?.length) {
      const children = filterSubItemsForSession(item.children, sessionSequence, occurrences)
      return children.length
        ? [{
            ...item,
            quantity: 1,
            children
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

const formatContractRateLabel = (amount: number): string =>
  amount > 0 ? asCurrency(amount) : "FREE"

const getSubItemLineAmount = (item: LguInvoiceSubItem): number => {
  if (!hasOwnContractRate(item)) return 0
  return Number((Math.max(1, Number(item.quantity ?? 1)) * Number(item.unitPrice ?? 0)).toFixed(2))
}

const sumSubItemTreeAmounts = (items?: LguInvoiceSubItem[]): number =>
  Number((items ?? []).reduce((sum, item) =>
    sum + getSubItemLineAmount(item) + (hasOwnContractRate(item) && item.children?.length ? 0 : sumSubItemTreeAmounts(item.children)), 0
  ).toFixed(2))

const renderInvoiceSubItemTreeHtml = (
  items: LguInvoiceSubItem[] | undefined,
  depth = 0
): string =>
  (items ?? []).map(item => `
    <div class="sub-item sub-item-depth-${Math.min(depth, 2)}">
      - ${escapeHtml(`${Math.max(1, Number(item.quantity ?? 1))} ${item.name}`)}
    </div>
    ${item.children?.length ? renderInvoiceSubItemTreeHtml(item.children, depth + 1) : ""}
  `).join("")

const renderInvoiceSubItemPriceTreeHtml = (
  items: LguInvoiceSubItem[] | undefined,
  depth = 0
): string =>
  (items ?? []).map(item => {
    const amount = getSubItemLineAmount(item)
    const hasExplicitPrice = hasOwnContractRate(item)
    const childPriceHtml = item.children?.length
      ? hasExplicitPrice
        ? renderInvoiceSubItemBlankPriceTreeHtml(item.children, depth + 1)
        : renderInvoiceSubItemPriceTreeHtml(item.children, depth + 1)
      : ""
    return `
      <div class="sub-item sub-item-depth-${Math.min(depth, 2)}">${hasExplicitPrice ? escapeHtml(formatContractRateLabel(amount)) : "&nbsp;"}</div>
      ${childPriceHtml}
    `
  }).join("")

const renderInvoiceSubItemBlankPriceTreeHtml = (
  items: LguInvoiceSubItem[] | undefined,
  depth = 0
): string =>
  (items ?? []).map(item => `
    <div class="sub-item sub-item-depth-${Math.min(depth, 2)}">&nbsp;</div>
    ${item.children?.length ? renderInvoiceSubItemBlankPriceTreeHtml(item.children, depth + 1) : ""}
  `).join("")

const renderPackageServiceRenderedHtml = (packageName: string, items: LguInvoiceSubItem[] | undefined): string =>
  items?.length
    ? renderInvoiceSubItemTreeHtml(items)
    : `<div class="package-line">${escapeHtml(packageName)}</div>`

const renderPackageUnitPriceHtml = (items: LguInvoiceSubItem[] | undefined): string => `
  ${renderInvoiceSubItemPriceTreeHtml(items)}
`

const buildDropoutIndividualRows = (
  option: LguInvoiceSessionOption,
  index: number,
  treatmentDate: string,
  billing?: LguPatientBilling
): BillingSummaryInvoiceRow[] => {
  const lines = parseClaimLineItems(billing?.line_items_json ?? undefined)
  const matchedLines = lines.length > 1 ? lines.filter(line => claimLineMatchesSession(line, option)) : lines
  const sourceLines = matchedLines.length ? matchedLines : lines.length === 1 ? lines : []

  if (!sourceLines.length) {
    const fallbackPackageName = option.packageName || billing?.package_name || billing?.service_name || undefined
    const fallbackSubItemTree = fallbackPackageName
      ? filterSubItemsForSession(
          getPackageInvoiceSubItems(undefined, fallbackPackageName, 1, true, "dropout"),
          Math.max(1, Number(option.sessionSequence ?? 1))
        )
      : []
    if (fallbackSubItemTree.length && fallbackPackageName) {
      const lineTotal = sumSubItemTreeAmounts(fallbackSubItemTree)
      return [{
        itemNumber: String(index + 1),
        treatmentDate,
        serviceRendered: fallbackPackageName,
        serviceRenderedHtml: renderPackageServiceRenderedHtml(fallbackPackageName, fallbackSubItemTree),
        sessionSequence: option.label,
        unitTotal: Number(lineTotal.toFixed(2)),
        unitTotalLabel: formatContractRateLabel(Number(lineTotal.toFixed(2))),
        unitTotalHtml: renderPackageUnitPriceHtml(fallbackSubItemTree),
        billingId: billing?.id,
        appointmentId: option.appointmentId
      }]
    }

    const fallbackTotal = getSessionUnitTotal(option)
    return [{
      itemNumber: String(index + 1),
      treatmentDate,
      serviceRendered: option.serviceName || option.packageName || "LGU Session",
      sessionSequence: option.label,
      unitTotal: fallbackTotal,
      unitTotalLabel: formatContractRateLabel(fallbackTotal),
      billingId: billing?.id,
      appointmentId: option.appointmentId
    }]
  }

  const fallbackPackageName = option.packageName || billing?.package_name || billing?.service_name || undefined
  const hasStructuredSource = sourceLines.some(line =>
    String(line.type ?? "").toLowerCase() === "package" || hasNestedSubItems(line.subItems)
  )
  if (!hasStructuredSource && fallbackPackageName) {
    const subItemTree = getPackageLineSubItems(sourceLines[0], true, option.sessionSequence, fallbackPackageName)
    if (subItemTree?.length) {
      const lineTotal = sumSubItemTreeAmounts(subItemTree)
      return [{
        itemNumber: String(index + 1),
        treatmentDate,
        serviceRendered: fallbackPackageName,
        serviceRenderedHtml: renderPackageServiceRenderedHtml(fallbackPackageName, subItemTree),
        sessionSequence: option.label,
        unitTotal: Number(lineTotal.toFixed(2)),
        unitTotalLabel: formatContractRateLabel(Number(lineTotal.toFixed(2))),
        unitTotalHtml: renderPackageUnitPriceHtml(subItemTree),
        billingId: billing?.id,
        appointmentId: option.appointmentId
      }]
    }
  }

  const rows: BillingSummaryInvoiceRow[] = []
  let hasItemNumber = false

  sourceLines.forEach(line => {
    const packageName = fallbackPackageName || line.name || "LGU Package"
    const subItemTree = getPackageLineSubItems(line, true, option.sessionSequence, fallbackPackageName)
    const lineTotal = subItemTree?.length
      ? sumSubItemTreeAmounts(subItemTree)
      : getLguInvoiceLineTotal({
          ...line,
          subItems: line.subItems?.length ? enrichSubItemPrices(line.subItems, "dropout") : undefined
        })

    rows.push({
      itemNumber: hasItemNumber ? "" : String(index + 1),
      treatmentDate,
      serviceRendered: packageName,
      serviceRenderedHtml: subItemTree?.length ? renderPackageServiceRenderedHtml(packageName, subItemTree) : undefined,
      sessionSequence: option.label,
      unitTotal: Number(lineTotal.toFixed(2)),
      unitTotalLabel: formatContractRateLabel(Number(lineTotal.toFixed(2))),
      unitTotalHtml: subItemTree?.length ? renderPackageUnitPriceHtml(subItemTree) : undefined,
      billingId: billing?.id,
      appointmentId: option.appointmentId
    })
    hasItemNumber = true
  })

  return rows
}

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

const getPackageLineSubItems = (
  line: ReturnType<typeof parseClaimLineItems>[number],
  isDropoutClaim: boolean,
  sessionSequence?: number,
  fallbackPackageName?: string
): LguInvoiceSubItem[] | undefined => {
  const priceMode: LguInvoicePriceMode = isDropoutClaim ? "dropout" : "package"
  const packageMultiplier = isDropoutClaim ? 1 : line.quantity
  const packageFallback = getPackageInvoiceSubItems(line.id, line.name, packageMultiplier, true, priceMode)
  const namedPackageFallback = packageFallback.length || !fallbackPackageName
    ? packageFallback
    : getPackageInvoiceSubItems(undefined, fallbackPackageName, 1, true, priceMode)
  const source = isDropoutClaim
    ? (
        namedPackageFallback.length
          ? namedPackageFallback
          : hasNestedSubItems(line.subItems)
          ? enrichSubItemPrices(
              applyConfiguredPackageRates(
                findPackageOffer(line.id, line.name) ?? findPackageOffer(undefined, fallbackPackageName),
                line.subItems,
                priceMode
              ),
              priceMode
            )
          : enrichSubItemPrices(line.subItems, priceMode)
      )
    : line.subItems?.length
      ? enrichSubItemPrices(line.subItems, priceMode)
      : String(line.type ?? "").toLowerCase() === "package"
        ? namedPackageFallback
        : undefined

  if (!source?.length || !sessionSequence) return source
  return filterSubItemsForSession(source, Math.max(1, Number(sessionSequence)))
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
    const packageName = option.packageName || billing?.package_name || billing?.service_name || "LGU Package"
    const packageTotal = getPrintableBillingTotal(billing)
    const lines = parseClaimLineItems(billing?.line_items_json ?? undefined)
    const packageLine = lines.find(line => String(line.type ?? "").toLowerCase() === "package")
    const packageSubItems = packageLine?.subItems?.length
      ? enrichSubItemPrices(packageLine.subItems)
      : getPackageInvoiceSubItems(packageLine?.id, packageLine?.name || packageName, Math.max(1, Number(packageLine?.quantity ?? 1)), true)

    return [{
      itemNumber: String(index + 1),
      treatmentDate,
      serviceRendered: packageName,
      serviceRenderedHtml: packageSubItems?.length ? renderPackageServiceRenderedHtml(packageName, packageSubItems) : undefined,
      sessionSequence,
      unitTotal: Number(packageTotal.toFixed(2)),
      unitTotalLabel: packageSubItems?.length ? formatContractRateLabel(Number(packageTotal.toFixed(2))) : undefined,
      unitTotalHtml: packageSubItems?.length ? renderPackageUnitPriceHtml(packageSubItems) : undefined,
      billingId: billing?.id,
      appointmentId: option.appointmentId
    }]
  }

  return buildDropoutIndividualRows(option, index, treatmentDate, billing)
}

const getBillingSummaryInvoiceRows = (sessions = invoiceSessionOptions.value): BillingSummaryInvoiceRow[] => {
  const rows: BillingSummaryInvoiceRow[] = []
  const renderedStandardBillingIds = new Set<number>()
  let itemIndex = 0

  sessions.forEach(option => {
    const billing = getSessionBilling(option)
    const shouldUseIndividualServices = isDropoutClaimBilling(billing) || isCrossMonthDroppedOutSession(option)
    if (!shouldUseIndividualServices && billing?.id) {
      if (renderedStandardBillingIds.has(billing.id)) return
      renderedStandardBillingIds.add(billing.id)
    }
    rows.push(...getBillingSummarySessionRows(option, itemIndex))
    itemIndex += 1
  })

  return rows
}

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
    <tr${row.itemNumber || row.isChildRow ? ` class="${[row.itemNumber ? "item-group-start" : "", row.isChildRow ? "line-item-child" : ""].filter(Boolean).join(" ")}"` : ''}>
      <td class="text-center">${escapeHtml(row.itemNumber)}</td>
      <td class="text-center">${escapeHtml(row.treatmentDate)}</td>
      <td>${row.serviceRenderedHtml ?? escapeHtml(row.serviceRendered)}</td>
      <td class="text-center">${escapeHtml(row.sessionSequence)}</td>
      <td class="text-right">${row.unitTotalHtml ?? escapeHtml(row.unitTotalLabel ?? (row.unitTotal > 0 ? asCurrency(row.unitTotal) : "-"))}</td>
    </tr>
  `).join("")
}

const getSessionBilling = (option: LguInvoiceSessionOption) =>
  option.billingId ? selectedPatientDetail.value?.billings.find(billing => billing.id === option.billingId) : undefined

const getStatementOfAccountRows = (sessions = invoiceSessionOptions.value): StatementOfAccountInvoiceRow[] => {
  const rows: StatementOfAccountInvoiceRow[] = []
  const orderedSessions = [...sessions].sort((left, right) => {
    const leftDate = String(left.appointmentDate ?? "")
    const rightDate = String(right.appointmentDate ?? "")
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate)
    return Number(left.sessionSequence ?? 0) - Number(right.sessionSequence ?? 0)
  })
  let itemIndex = 0

  orderedSessions.forEach(option => {
    const billing = getSessionBilling(option)
    const appointmentStatus = selectedPatientDetail.value?.appointments.find(appointment =>
      appointment.appointment_id === option.appointmentId
    )?.status
    const programStatus = appointmentStatus ? formatLguStatus(appointmentStatus) : selectedPatientStatusLabel()
    const treatmentDate = new Date(option.appointmentDate).toLocaleDateString("en-PH")
    const baseRow = {
      patientName: selectedPatientDetail.value?.patient_name ?? "-",
      referralFormNo: selectedBillingMonth.value,
      referenceNo: billing?.public_id || (option.billingId ? `BILLING-${option.billingId}` : "-"),
      programStatus
    }
    const shouldUseIndividualServices = isDropoutClaimBilling(billing) || isCrossMonthDroppedOutSession(option)

    if (shouldUseIndividualServices) {
      const normalizedRows = buildDropoutIndividualRows(option, itemIndex, treatmentDate, billing)
      normalizedRows.forEach(row => {
        rows.push({
          ...baseRow,
          itemNumber: row.itemNumber,
          treatmentDate,
          serviceRendered: row.serviceRendered,
          serviceRenderedHtml: row.serviceRenderedHtml,
          sessionSequence: row.sessionSequence,
          unitTotal: Number(row.unitTotal ?? 0),
          unitTotalLabel: row.unitTotalLabel,
          unitTotalHtml: row.unitTotalHtml,
          billingId: billing?.id,
          appointmentId: option.appointmentId,
          isChildRow: row.isChildRow
        })
      })

      itemIndex += 1
      return
    }

    const packageName = option.packageName || billing?.package_name || billing?.service_name || "LGU Package"
    const lines = parseClaimLineItems(billing?.line_items_json ?? undefined)
    const packageLine = lines.find(line => String(line.type ?? "").toLowerCase() === "package")
    const packageSubItems = packageLine?.subItems?.length
      ? enrichSubItemPrices(packageLine.subItems)
      : getPackageInvoiceSubItems(packageLine?.id, packageLine?.name || packageName, Math.max(1, Number(packageLine?.quantity ?? 1)), true)
    const sessionSequence = Math.max(1, Number(option.sessionSequence ?? 1))
    const allocatedSubItemTree = filterSubItemsForSession(packageSubItems, sessionSequence)
    const allocatedTotal = sumSubItemTreeAmounts(allocatedSubItemTree)

    rows.push({
      ...baseRow,
      itemNumber: String(itemIndex + 1),
      treatmentDate,
      serviceRendered: packageName,
      serviceRenderedHtml: allocatedSubItemTree.length ? renderPackageServiceRenderedHtml(packageName, allocatedSubItemTree) : undefined,
      sessionSequence: option.label,
      unitTotal: allocatedTotal,
      unitTotalLabel: allocatedSubItemTree.length ? formatContractRateLabel(allocatedTotal) : "-",
      unitTotalHtml: allocatedSubItemTree.length ? renderPackageUnitPriceHtml(allocatedSubItemTree) : undefined,
      billingId: billing?.id,
      appointmentId: option.appointmentId
    })

    itemIndex += 1
  })

  return rows
}

const renderStatementOfAccountRows = (rows = getStatementOfAccountRows()): string => {
  if (!rows.length) return renderEmptyRow(5, "No SOA records for this patient.")
  return rows.map(row => `
      <tr${row.itemNumber || row.isChildRow ? ` class="${[row.itemNumber ? "item-group-start" : "", row.isChildRow ? "line-item-child" : ""].filter(Boolean).join(" ")}"` : ''}>
        <td class="text-center">${escapeHtml(row.itemNumber)}</td>
        <td class="text-center">${escapeHtml(row.treatmentDate)}</td>
        <td>${row.serviceRenderedHtml ?? escapeHtml(row.serviceRendered)}</td>
        <td class="text-center">${escapeHtml(row.sessionSequence)}</td>
        <td class="text-right">${row.unitTotalHtml ?? escapeHtml(row.unitTotalLabel ?? (row.unitTotal > 0 ? asCurrency(row.unitTotal) : "-"))}</td>
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

const firstNonBlank = (...values: Array<unknown>): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }
  return "N/A"
}

const latestPatientTransaction = (context: PatientLguDetailsExportContext): LguDashboardHistoryItem | undefined =>
  [...context.transactions].sort((left, right) =>
    String(right.created_at ?? "").localeCompare(String(left.created_at ?? ""))
  )[0]

const latestAppointmentBillingDetail = (context: PatientLguDetailsExportContext): BillingListItem | undefined =>
  [...context.billingDetails].sort((left, right) =>
    String(right.created_at ?? "").localeCompare(String(left.created_at ?? ""))
  )[0]

const loadBillingDetailsForSessions = async (sessions: LguInvoiceSessionOption[]): Promise<BillingListItem[]> => {
  const billingIds = Array.from(new Set(
    sessions
      .map(session => Number(session.billingId ?? 0))
      .filter(id => Number.isFinite(id) && id > 0)
  ))

  const results = await Promise.allSettled(billingIds.map(id => fetchBillingDetail(id)))
  const details: BillingListItem[] = []
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      details.push(result.value)
    }
  }
  return details
}

const latestBillingDetail = (details: BillingListItem[]): BillingListItem | undefined =>
  [...details].sort((left, right) =>
    String(right.created_at ?? "").localeCompare(String(left.created_at ?? ""))
  )[0]

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
  const patient = selectedPatientDetail.value
  const transaction = latestPatientTransaction(context)
  const appointmentBilling = latestAppointmentBillingDetail(context)
  return `
    <section class="profile-section">
      <h2>Patient Profile</h2>
<div style="width: 100%; margin-top: 12px;">
  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; font-family: Arial, sans-serif;">
    <tbody>
      <tr>
        <th style="width: 18%; background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Patient's Name:
        </th>
        <td style="width: 32%; padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${details?.full_name || patient?.patient_name || "—"}
        </td>

        <th style="width: 18%; background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Physical Therapist:
        </th>
        <td style="width: 32%; padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${firstNonBlank(appointmentBilling?.physical_therapist, transaction?.physical_therapist) || "—"}
        </td>
      </tr>

      <tr>
        <th style="background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Address:
        </th>
        <td style="padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${formatPatientAddress(details) || "—"}
        </td>

        <th style="background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Doctor:
        </th>
        <td style="padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${firstNonBlank(appointmentBilling?.doctor, transaction?.doctor, details?.referred_by_staff_name, details?.referred_by) || "—"}
        </td>
      </tr>

      <tr>
        <th style="background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Diagnosis:
        </th>
        <td colspan="3" style="padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word; min-height: 36px;">
          ${firstNonBlank(appointmentBilling?.diagnosis, transaction?.diagnosis) || "—"}
        </td>
      </tr>
    </tbody>
  </table>
</div>
    </section>
  `
}

const renderProfileLguProgramHtml = (context: PatientLguDetailsExportContext): string => {
  const patient = selectedPatientDetail.value
  if (!patient) return ""
  const lguInfo = context.lguInformation
  const lguName = lguInfo?.lgu_program_name || lguInfo?.company_name || selectedProgramName.value || "LGU"

  return `
    <section class="profile-section">
      <h2>LGU Information</h2>
<div style="width: 100%; margin-top: 12px;">
  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; font-family: Arial, sans-serif;">
    <tbody>
      <tr>
        <th style="width: 18%; background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Billing To:
        </th>
        <td style="width: 32%; padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${lguName || "—"}
        </td>

        <th style="width: 18%; background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Patient Program <br /> Status:
        </th>
        <td style="width: 32%; padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${selectedPatientStatusLabel() || "—"}
        </td>
      </tr>

      <tr>
        <th style="background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Referral Form No.:
        </th>
        <td style="padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${lguInfo?.referral_form_no || lguInfo?.approval_code || "—"}
        </td>

        <th style="background: #f3f4f6; padding: 8px 10px; text-align: left; vertical-align: top; font-weight: 700; white-space: nowrap;">
          Date Issued:
        </th>
        <td style="padding: 8px 10px; vertical-align: top; font-weight: 500; word-break: break-word;">
          ${formatProfileDate(lguInfo?.referral_issued_date || lguInfo?.validity_start_date) || "—"}
        </td>
      </tr>
    </tbody>
  </table>
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

const renderProfileAvailedPackagesHtml = (): string => {
  const patient = selectedPatientDetail.value
  const packages = patient?.package_availments ?? []
  if (!packages.length) {
    return `
      <section class="profile-section">
        <h2>Availed Package</h2>
        <table class="compact-table">
          <thead><tr><th>PACKAGE</th><th>PRICE</th></tr></thead>
          <tbody><tr><td colspan="2" class="muted">No package availment records yet.</td></tr></tbody>
        </table>
      </section>
    `
  }

  const normalizeName = (value?: string | null): string =>
    String(value ?? "").trim().toLowerCase()

  const rows = packages.map(pkg => {
    const packageName = String(pkg.package_name ?? "").trim()
    const matchingBillings = (patient?.billings ?? []).filter(billing => {
      const billingPackageName = normalizeName(billing.package_name)
      const billingServiceName = normalizeName(billing.service_name)
      const target = normalizeName(packageName)
      return !!target && (billingPackageName === target || billingServiceName === target)
    })
    const packagePrice = matchingBillings
      .map(billing => getPrintableBillingTotal(billing))
      .filter(amount => amount > 0)
      .sort((a, b) => b - a)[0] ?? 0

    return `
      <tr>
        <td>${escapeHtml(packageName || "N/A")}</td>
        <td class="text-right">${packagePrice > 0 ? escapeHtml(asCurrency(packagePrice)) : "-"}</td>
      </tr>
    `
  }).join("")

  return `
    <section class="profile-section">
      <h2>Availed Package</h2>
      <table class="compact-table">
        <thead><tr><th>PACKAGE</th><th>PRICE</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

const renderProfileIncludedServicesHtml = (): string => {
  const rows = getStatementOfAccountRows()

  return `
    <section class="profile-section">
      <h2>Included Services</h2>
      <table class="compact-table">
        <thead>
          <tr>
            <th>ITEM No.</th>
            <th>TREATMENT DATE</th>
            <th>PT SERVICE RENDERED</th>
            <th>SESSION SEQUENCE</th>
            <th>UNIT PRICE</th>
          </tr>
        </thead>
        <tbody>${renderStatementOfAccountRows(rows)}</tbody>
      </table>
    </section>
  `
}

const renderLguProfileBodyHtml = (context: PatientLguDetailsExportContext): string => `
  ${renderProfileSummaryHtml(context)}
  ${renderProfileIdentityHtml(context)}
  ${renderProfileLguProgramHtml(context)}
  ${renderProfileAvailedPackagesHtml()}
  ${renderProfileIncludedServicesHtml()}
`

const exportPatientProfileBillingSummary = async (): Promise<void> => {
  const patient = selectedPatientDetail.value
  if (!patient) return
  openLguPatientPrintRoute("lgu-patient-billing-summary-print", patient.patient_id)
  patientSoaPickerVisible.value = false
}

const exportPatientSoa = async (): Promise<void> => {
  patientSoaMode.value = patientSoaMode.value || "range"
  await exportPatientProfileBillingSummary()
}

const printSessionInvoice = async (option?: LguInvoiceSessionOption): Promise<void> => {
  const selectedOption = option ?? invoiceSessionOptions.value.find(item => item.key === selectedPatientSoaSessionKey.value)
  if (!selectedOption) {
    errorToast(toast, "Select one session before printing.")
    return
  }
  patientSoaMode.value = "session"
  selectedPatientSoaSessionKey.value = selectedOption.key
  const sessionDate = new Date(selectedOption.appointmentDate)
  patientSoaRange.value = Number.isNaN(sessionDate.getTime()) ? null : [sessionDate, sessionDate]
  openLguPatientPrintRoute("lgu-patient-invoice-billing-print", selectedPatientDetail.value?.patient_id ?? 0, {
    billingId: selectedOption.billingId,
    appointmentId: selectedOption.appointmentId,
    from: sessionDate,
    to: sessionDate
  })
  invoiceSessionPickerVisible.value = false
}

const exportPatientLguDetails = async (): Promise<void> => {
  const patient = selectedPatientDetail.value
  if (!patient) return
  openLguPatientPrintRoute("lgu-patient-profile-print", patient.patient_id)
}

const formatDashboardSoaSessionSequence = (row: LguDashboardHistoryItem): string => {
  const sequence = Number(row.session_sequence ?? 0)
  if (!Number.isFinite(sequence) || sequence <= 0) return "N/A"
  const totalSessions = Number(row.total_sessions ?? 0)
  return totalSessions > 0 ? `Session ${sequence} of ${totalSessions}` : `Session ${sequence}`
}

const getDashboardSoaPatientKey = (row: LguDashboardHistoryItem): string =>
  row.patient_id == null ? `name:${row.patient_name || "unknown"}` : `patient:${row.patient_id}`

const getDashboardSoaPriceMode = (row: LguDashboardHistoryItem): LguInvoicePriceMode =>
  String(row.program_status ?? "").toUpperCase().includes("DROPPED_OUT") ? "dropout" : "package"

const getDashboardSoaPackageSubItems = (row: LguDashboardHistoryItem): LguInvoiceSubItem[] => {
  const packageName = row.package_name || row.service_name || "LGU Package"
  const sessionSequence = Math.max(1, Number(row.session_sequence ?? 1))
  const priceMode = getDashboardSoaPriceMode(row)
  const lines = parseClaimLineItems(row.line_items_json ?? undefined)
  const packageLine = lines.find(line => String(line.type ?? "").toLowerCase() === "package")
    ?? lines.find(line => line.subItems?.length)
  const subItems = packageLine?.subItems?.length
    ? enrichSubItemPrices(packageLine.subItems, priceMode)
    : getPackageInvoiceSubItems(packageLine?.id, packageLine?.name || packageName, Math.max(1, Number(packageLine?.quantity ?? 1)), true, priceMode)
  return filterSubItemsForSession(subItems, sessionSequence)
}

const getDashboardSoaRowAmount = (row: LguDashboardHistoryItem): number => {
  const subItems = getDashboardSoaPackageSubItems(row)
  const subItemTotal = sumSubItemTreeAmounts(subItems)
  return subItems.length ? subItemTotal : Number(row.amount_out ?? 0)
}

const renderDashboardStatementOfAccountRows = (rows: LguDashboardHistoryItem[]): string => {
  if (!rows.length) return renderEmptyRow(9, "No SOA records found for the selected period.")
  const renderedRows: string[] = []
  let itemNumber = 1
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const currentPatientKey = getDashboardSoaPatientKey(row)
    const previousRow = rows[index - 1]
    const nextRow = rows[index + 1]
    const isPatientStart = !previousRow || getDashboardSoaPatientKey(previousRow) !== currentPatientKey
    const isPatientEnd = !nextRow || getDashboardSoaPatientKey(nextRow) !== currentPatientKey
    const referenceNo = row.reference_label || row.phase1_billing_public_id || row.receipt_number || "N/A"
    const previousReferenceNo = previousRow && getDashboardSoaPatientKey(previousRow) === currentPatientKey
      ? previousRow.reference_label || previousRow.phase1_billing_public_id || previousRow.receipt_number || "N/A"
      : null
    const shouldShowReferenceNo = isPatientStart || referenceNo !== previousReferenceNo
    const subItems = getDashboardSoaPackageSubItems(row)
    const rowAmount = getDashboardSoaRowAmount(row)
    const serviceRenderedHtml = subItems.length
      ? renderPackageServiceRenderedHtml(row.package_name || row.service_name || "LGU Package", subItems)
      : escapeHtml(row.service_name || "LGU Session")
    const unitTotalHtml = subItems.length
      ? renderPackageUnitPriceHtml(subItems)
      : (rowAmount > 0 ? escapeHtml(asCurrency(rowAmount)) : "FREE")
    const patientTotal = isPatientEnd
      ? rows
          .filter(groupRow => getDashboardSoaPatientKey(groupRow) === currentPatientKey)
          .reduce((sum, groupRow) => sum + getDashboardSoaRowAmount(groupRow), 0)
      : 0

    renderedRows.push(`
      <tr${isPatientStart ? ' class="item-group-start"' : ""}>
        <td class="text-center">${isPatientStart ? itemNumber : ""}</td>
        <td>${isPatientStart ? escapeHtml(row.patient_name || "N/A") : ""}</td>
        <td>${isPatientStart ? escapeHtml(row.referral_form_no || "N/A") : ""}</td>
        <td>${shouldShowReferenceNo ? escapeHtml(referenceNo) : ""}</td>
        <td>${isPatientStart ? escapeHtml(row.program_status || row.billing_status || row.usage_status || "N/A") : ""}</td>
        <td class="text-center">${escapeHtml(new Date(row.treatment_date || row.created_at).toLocaleDateString("en-PH"))}</td>
        <td>${serviceRenderedHtml}</td>
        <td class="text-center">${escapeHtml(formatDashboardSoaSessionSequence(row))}</td>
        <td class="text-right">${unitTotalHtml}</td>
      </tr>
    `)

    if (isPatientEnd) {
      renderedRows.push(`
        <tr class="session-divider-row">
          <td colspan="8" class="text-right" style="font-weight: 700;">Patient Billing Summary Total:</td>
          <td class="text-right" style="font-weight: 700;">${escapeHtml(asCurrency(patientTotal))}</td>
        </tr>
      `)
      itemNumber += 1
    }
  }
  return renderedRows.join("")
}

const generateSoa = async (): Promise<void> => {
  if (!hasValidSoaRange.value) return
  const [from, to] = soaRange.value as Date[]
  const popup = openPrintableRouteWindow(
    {
      name: "lgu-soa-print",
      query: {
        from: formatYmd(from),
        to: formatYmd(to),
        program_id: selectedProgramId.value ? String(selectedProgramId.value) : undefined,
        program_name: selectedProgramName.value || undefined,
        autoprint: "1"
      }
    },
    "Unable to open LGU SOA print view. Allow pop-ups for this site, then try again."
  )

  if (popup) {
    exportsModalVisible.value = false
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
          @page { size: A5 landscape; margin: 5mm; }
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
    if (isLguBillingType(detail.billing_type)) return "LGU"
    const n = String(detail.billing_type ?? "").trim().toUpperCase()
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
        return pkgId ? `${formatPkgSource(pkgSource)} - Linked ID ${pkgId}` : formatPkgSource(pkgSource)
      }
      const buildDeductionSummary = (): string => {
        const n = String(snapBillingType ?? "").trim().toUpperCase().replace(/[: -]/g, "_")
        if (["HMO", "HMO_BILLING"].includes(n))  return "Deducting 1 Session from HMO Allocation"
        if (["LGU", LGU_BILLING_TYPE].includes(n))  return "Deducting 1 Session from LGU Authorization"
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
      billing_type: LGU_BILLING_TYPE,
      from_date: fromStr,
      to_date: toStr
    })
    const billingIds = (response?.content ?? []).map(b => b.id).filter(id => Number.isFinite(id) && id > 0)
    if (!billingIds.length) {
      popup.close()
      errorToast(toast, `No LGU billings found between ${fromStr} and ${toStr}`)
      return
    }

    const details = (await Promise.all(billingIds.map(id => fetchBillingDetail(id)))).filter((d): d is BillingListItem => !!d)
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
      subtitle: `LGU billings from ${fromStr} to ${toStr} - ${cards.length} ticket${cards.length === 1 ? "" : "s"}`,
      fileName: `lgu-encounter-tickets-${fromStr}-to-${toStr}`
    })
  } catch (e) {
    popup.close()
    errorToast(toast, getApiErrorMessage(e, {baseMessage: "Failed to export LGU encounter tickets"}))
  } finally {
    exportingBulkTickets.value = false
  }
}

void [
  renderEncounterTicketPdfWindow,
  renderAttendanceRecordPdfWindow,
  formatDateOnly,
  getMonthEndDate,
  loadPatientLguDetailsExportContext,
  renderBillingRows,
  renderAppointmentRows,
  renderAvailedSessionRows,
  renderPackageRows,
  renderProfileField,
  loadBillingDetailsForSessions,
  latestBillingDetail,
  renderProfileAppointmentsHtml,
  renderLguProfileBodyHtml,
  exportPatientProfileBillingSummary,
  renderDashboardStatementOfAccountRows,
  exportBulkLguEncounterTickets
]

const exportPatientAttendanceRecord = async (): Promise<void> => {
  const patient = selectedPatientDetail.value
  if (!patient) return

  const popup = openPrintableRouteWindow(
    {
      name: "lgu-attendance-treatment-print",
      query: {
        patient_id: String(patient.patient_id),
        autoprint: "1"
      }
    },
    "Unable to open attendance record. Allow pop-ups for this site, then try again."
  )
  if (!popup) return
}

const firstDroppedOutAppointmentId = computed<number | null>(() => {
  const appointments = selectedPatientDetail.value?.appointments ?? []
  const explicitDropoutStart = appointments.find(appointment => appointment.dropout_starts_here)
  if (explicitDropoutStart) return explicitDropoutStart.appointment_id

  return appointments.find(appointment =>
    appointment.status === "DROPPED_OUT" || appointment.status === "CROSS_MONTH_DROPPED_OUT"
  )?.appointment_id ?? null
})

const formatLguStatus = (value?: string | null): string => {
  const normalized = String(value ?? "PENDING").trim().toUpperCase()
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "COMPLETED") return "Completed"
  if (normalized === "CANCELED" || normalized === "CANCELLED") return "Canceled"
  return "Pending"
}

const lguStatusSeverity = (value?: string | null): "success" | "warn" | "danger" | "info" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "COMPLETED") return "success"
  if (normalized === "DROPPED_OUT" || normalized === "CROSS_MONTH_DROPPED_OUT") return "danger"
  if (normalized === "CANCELED" || normalized === "CANCELLED") return "secondary"
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

type LguBillingPaymentSummary = {
  billingId: number
  amountDue: number
  amountPaid: number
}

const lguBillingPaymentSummaries = computed<LguBillingPaymentSummary[]>(() => {
  const byBillingId = new Map<number, LguBillingPaymentSummary>()
  for (const entry of lguTransactionHistory.value) {
    const billingId = Number(entry.phase1_billing_id ?? 0)
    if (!Number.isFinite(billingId) || billingId <= 0) continue
    const amountDue = resolveLedgerAmount(entry)
    if (amountDue <= 0) continue
    byBillingId.set(billingId, {
      billingId,
      amountDue,
      amountPaid: Math.max(0, Number(entry.amount_paid ?? 0))
    })
  }
  return Array.from(byBillingId.values())
})

const lguTotalTransactions = computed(() => lguBillingPaymentSummaries.value.length)

const lguPaidBySponsorAmount = computed(() =>
  Number(lguBillingPaymentSummaries.value.reduce((sum, row) => sum + Math.min(row.amountPaid, row.amountDue), 0).toFixed(2))
)

const lguOutstandingAmount = computed(() =>
  Number(lguBillingPaymentSummaries.value.reduce((sum, row) => sum + Math.max(0, row.amountDue - row.amountPaid), 0).toFixed(2))
)

const lguOperationalCards = computed(() => [
  {
    label: "LGU Patients",
    value: String(lguPatients.value.length),
    icon: "pi pi-users",
    valueClass: "text-sky-700 dark:text-sky-300",
    iconClass: "text-sky-700 dark:text-sky-300"
  },
  {
    label: "Total Transactions",
    value: String(lguTotalTransactions.value),
    icon: "pi pi-receipt",
    valueClass: "text-[rgb(var(--app-fg))]",
    iconClass: "text-[rgb(var(--app-fg))]/70"
  },
  {
    label: "Paid By LGU",
    value: asCurrency(lguPaidBySponsorAmount.value),
    icon: "pi pi-check-circle",
    valueClass: "text-emerald-700 dark:text-emerald-300",
    iconClass: "text-emerald-700 dark:text-emerald-300"
  },
  {
    label: "Outstanding",
    value: asCurrency(lguOutstandingAmount.value),
    icon: "pi pi-clock",
    valueClass: "text-amber-700 dark:text-amber-300",
    iconClass: "text-amber-700 dark:text-amber-300"
  }
])

const canManageLguDashboard = computed(() => {
  const normalized = roleName.value.trim().toLowerCase()
  if (!normalized) return false
  return MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const lguProgramOptions = computed(() =>
  lguPrograms.value.map(p => ({ ...p, label: `LGU-${p.name}` }))
)

const selectedProgramName = computed(() =>
  lguProgramOptions.value.find(p => p.id === selectedProgramId.value)?.label ?? ""
)

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Billing or LGU dashboard access in Role Access",
    invalidInputHint: "LGU values are invalid. Check the period and amount fields, then try again.",
    retryHint: "Please try again."
  })

const selectedBillingMonth = computed(() =>
  `${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const applyBudgetValues = (payload: { base_budget?: number; rollover_amount?: number; baseMonthlyBudget?: number; rolloverAmount?: number }): void => {
  baseMonthlyBudget.value = Math.max(0, Number(payload.base_budget ?? payload.baseMonthlyBudget ?? 0))
  rolloverAmount.value = Math.max(0, Number(payload.rollover_amount ?? payload.rolloverAmount ?? 0))
}

const loadDashboardBudget = async (): Promise<void> => {
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
      return
    }

    lguDashboardBudget.value = null
    applyBudgetValues({})
    hasLocalOnlyBudgetDraft.value = false
  } catch (error: unknown) {
    lguDashboardBudget.value = null
    applyBudgetValues({})
    hasLocalOnlyBudgetDraft.value = false
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
      selectedPatientDetail.value = detailResult.value ?? createEmptyPatientCreditDetail(patientId)
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
      ) ?? createEmptyPatientCreditDetail(patientId)
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to refresh patient LGU credit details")
    }
  }

  const createSelectedPatientClaim = async (): Promise<void> => {
    const patientId = selectedPatientDetail.value?.patient_id
    if (!patientId || creatingPatientClaim.value) return

    creatingPatientClaim.value = true
    try {
      const result = await lguBillingService.createPatientClaim({
        patient_id: patientId,
        billing_month: selectedBillingMonth.value
      })

      successToast(
        toast,
        result?.billing_public_id
          ? `LGU claim ${result.billing_public_id} created`
          : "LGU claim created"
      )

      await Promise.all([
        refreshSelectedPatientDetail(),
        loadTransactionHistory(),
        loadDashboardBudget()
      ])
    } catch (error: unknown) {
      errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU claim"))
    } finally {
      creatingPatientClaim.value = false
    }
  }

  const downloadClaimPdf = async (billingId: number, sessionOption?: LguInvoiceSessionOption): Promise<void> => {
    if (!billingId || printingClaimBillingId.value) return
    printingClaimBillingId.value = billingId
    try {
      const detail = await fetchBillingDetail(billingId)
      if (!detail) {
        errorToast(toast, "LGU claim billing could not be loaded")
        return
      }
      const sessionDate = sessionOption?.appointmentDate ? new Date(sessionOption.appointmentDate) : null
      openLguPatientPrintRoute("lgu-patient-invoice-billing-print", detail.patient_id, {
        billingId: detail.id,
        appointmentId: sessionOption?.appointmentId,
        from: sessionDate && !Number.isNaN(sessionDate.getTime()) ? sessionDate : new Date(detail.created_at),
        to: sessionDate && !Number.isNaN(sessionDate.getTime()) ? sessionDate : new Date(detail.created_at)
      })
    } catch (error: unknown) {
      errorToast(toast, extractApiErrorMessage(error, "Failed to download LGU claim PDF"))
    } finally {
      printingClaimBillingId.value = null
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
      5000,
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

const claimOutstandingLguBillings = async (): Promise<void> => {
  const outstanding = lguBillingPaymentSummaries.value
    .map(row => ({
      billingId: row.billingId,
      outstanding: Number(Math.max(0, row.amountDue - row.amountPaid).toFixed(2))
    }))
    .filter(row => row.outstanding > 0)

  if (!outstanding.length) {
    successToast(toast, "No outstanding LGU billings to claim")
    return
  }

  claimingLguPayments.value = true
  try {
    await Promise.all(outstanding.map(row =>
      billingPhase1Service.recordPayment(row.billingId, {
        amountTendered: row.outstanding,
        paymentType: "LGU Claim",
        referenceNo: `LGU-${budgetMonthLabel.value}`,
        note: "Marked claimed from LGU dashboard"
      })
    ))
    successToast(toast, `${outstanding.length} LGU billing${outstanding.length === 1 ? "" : "s"} marked as claimed`)
    await Promise.all([
      loadTransactionHistory(),
      loadDashboardBudget()
    ])
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to mark LGU billings as claimed"))
  } finally {
    claimingLguPayments.value = false
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
    successToast(toast, `LGU budget is now live for ${budgetMonthLabel.value}`)
  } catch (error: unknown) {
    hasLocalOnlyBudgetDraft.value = false
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
  await authSession.ensureLoaded().catch(() => undefined)
  await loadLguPrograms()
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory(),
    loadLguPatients()
  ])
})
</script>
