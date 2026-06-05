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
                {{ row.isParent ? "" : row.itemNo }}
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
                {{
                  row.isParent || row.unitTotal === null
                    ? ""
                    : row.unitTotal > 0
                      ? formatCurrency(row.unitTotal)
                      : "FREE"
                }}
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
import { pamsAPI } from "@/utils/axios-interceptor"

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const error = ref("")

const NOT_AVAILABLE_LABEL = "N/A"
const PRICE_KEYS = [
  "standard_unit_price_snapshot",
  "standardUnitPriceSnapshot",
  "package_unit_price_snapshot",
  "packageUnitPriceSnapshot",
  "dropout_unit_price_snapshot",
  "dropoutUnitPriceSnapshot",
  "unit_price_snapshot",
  "unitPriceSnapshot",
  "lgu_contract_price",
  "lguContractPrice",
  "lgu_price",
  "lguPrice",
  "contract_price",
  "contractPrice",
  "contract_unit_price",
  "contractUnitPrice",
  "contract_unit_price_snapshot",
  "contractUnitPriceSnapshot",
  "unit_price",
  "unitPrice",
  "price",
  "service_price",
  "servicePrice",
  "originalPrice"
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
  "total_amount",
  "totalAmount"
]
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
  "add_on_items"
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

type LocalService = {
  id: string
  name: string
  price: number
}

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
  invoiceSubItems?: InvoiceLineNode[]
}

const localServices = ref<LocalService[]>([])
const localBundles = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const lguInvoiceCatalogLoaded = ref(false)

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

const parsePositiveNumber = (value: unknown): number => {
  const parsed = Number(String(value ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
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

const normalizeScopedServiceId = (id: string, prefix: string): string =>
  id.includes("-") ? id : `${prefix}${id}`

const normalizeStringIdArray = (value: unknown): string[] =>
  parseMaybeJsonArray(value).map(item => toOptionalStringId(item)).filter((item): item is string => Boolean(item))

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

const normalizeInvoiceSubItems = (value: unknown): InvoiceLineNode[] =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []

    const raw = item as Record<string, unknown>
    const name = String(raw.name ?? "").trim()
    if (!name) return []

    const unitPrice = normalizeOptionalAmount(raw.unitPrice, raw.unit_price, raw.price)
    const dropoutUnitPrice = normalizeOptionalAmount(raw.dropoutUnitPrice, raw.dropout_unit_price, raw.dropoutPrice, raw.dropout_price)

    return [{
      name,
      quantity: normalizePositiveInt(raw.quantity, 1),
      ...(unitPrice === undefined ? {} : { unitPrice }),
      ...(dropoutUnitPrice === undefined ? {} : { dropoutUnitPrice }),
      sessionSequence: raw.sessionSequence === undefined || raw.sessionSequence === null
        ? undefined
        : String(raw.sessionSequence),
      session_sequence: raw.session_sequence as string | number | undefined,
      appliesOnSession: raw.appliesOnSession as string | number | undefined,
      applies_on_session: raw.applies_on_session as string | number | undefined,
      startSession: raw.startSession as string | number | undefined,
      start_session: raw.start_session as string | number | undefined,
      children: normalizeInvoiceSubItems(raw.children)
    }]
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
    invoiceSubItems: normalizeInvoiceSubItems(raw.invoiceSubItems ?? raw.invoice_sub_items)
  }
}

const getNumberFromRecord = (record: unknown, keys: string[]): number => {
  if (!record || typeof record !== "object") return 0

  for (const key of keys) {
    const parsed = parsePositiveNumber((record as Record<string, unknown>)[key])
    if (parsed > 0) return parsed
  }

  return 0
}

const loadLguInvoiceCatalog = async (): Promise<void> => {
  if (lguInvoiceCatalogLoaded.value) return

  const requestParams = { page: 1, size: 1000, name: "", status: "ALL" }

  try {
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
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-machines", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-techniques", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-evaluations", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-add-on-machines", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-add-on-techniques", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-add-on-home-services", { params: requestParams }),
      pamsAPI.get<{ content?: Record<string, unknown>[] }>("/lgu-service-bundles", { params: requestParams }),
      pamsAPI.get<{ content?: unknown[] }>("/package-service-offers", { params: { ...requestParams, scope: "LGU" } })
    ])

    localServices.value = [
      ...(machineResponse.data.content ?? []).map(item => ({
        id: `machine-${item.id}`,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0)
      })),
      ...(techniqueResponse.data.content ?? []).map(item => ({
        id: `technique-${item.id}`,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0)
      })),
      ...(evaluationResponse.data.content ?? []).map(item => ({
        id: `evaluation-${item.id}`,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0)
      })),
      ...(addOnMachineResponse.data.content ?? []).map(item => ({
        id: `add-on-machine-${item.id}`,
        name: String(item.name ?? item.machine_name ?? `Add-on Machine ${item.id}`),
        price: Number(item.add_on_price ?? item.price ?? 0)
      })),
      ...(addOnTechniqueResponse.data.content ?? []).map(item => ({
        id: `add-on-technique-${item.id}`,
        name: String(item.name ?? item.technique_name ?? `Add-on Technique ${item.id}`),
        price: Number(item.add_on_price ?? item.price ?? 0)
      })),
      ...(addOnHomeServiceResponse.data.content ?? []).map(item => ({
        id: `add-on-home-service-${item.id}`,
        name: String(item.name ?? item.label ?? `Home Service - ${item.start ?? ""} km`),
        price: Number(item.add_on_price ?? item.price ?? 0)
      }))
    ].filter(service => service.id && service.name)

    localBundles.value = (bundleResponse.data.content ?? [])
      .map(row => ({
        id: String(row.id ?? ""),
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
      }))
      .filter(bundle => bundle.id && bundle.name)

    localPackageOffers.value = (packageResponse.data.content ?? [])
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

const selectedAppointmentId = computed(() => {
  const queryAppointmentId = parsePositiveNumber(
    route.query.appointment_id ??
    route.query.appointmentId ??
    route.query.appt_id ??
    route.query.apptId
  )

  if (queryAppointmentId > 0) {
    return queryAppointmentId
  }

  return getNumberFromRecord(billingDetail.value, [
    "appointment_id",
    "appointmentId",
    "root_appointment_id",
    "rootAppointmentId"
  ])
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
const getBillingText = (key: string): string =>
  String((billingDetail.value as Record<string, unknown> | null)?.[key] ?? "").trim()
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
const physicalTherapistName = computed(() =>
  getBillingText("physical_therapist_name") ||
  getBillingText("physical_therapist") ||
  NOT_AVAILABLE_LABEL
)
const doctorName = computed(() =>
  getBillingText("doctor_name") ||
  getBillingText("doctor") ||
  NOT_AVAILABLE_LABEL
)
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
const isDropoutBilling = computed(() =>
  String(billingDetail.value?.pricing_source ?? "").toUpperCase().includes("DROPOUT")
)
const invoicePriceMode = computed<LguInvoicePriceMode>(() =>
  isDropoutPatient.value || isDropoutBilling.value ? "dropout" : "package"
)
const validityLabel = computed(() => {
  const start = formatDate(lguSponsor.value?.validity_start_date)
  const end = formatDate(lguSponsor.value?.validity_end_date ?? transactionPeriodEndDate.value)
  if (start === NOT_AVAILABLE_LABEL && end === NOT_AVAILABLE_LABEL) return NOT_AVAILABLE_LABEL
  return `${start} to ${end}`
})

const billing = computed(() => {
  const selectedBillingAmount = Number(
    billingDetail.value?.total_amount ??
    billingDetail.value?.amount_due ??
    0
  )

  if (Number.isFinite(selectedBillingAmount) && selectedBillingAmount > 0) {
    return {
      grand_total: selectedBillingAmount,
      total_amount: selectedBillingAmount
    }
  }

  const billings = detail.value?.billings ?? []
  const grandTotal = billings.reduce((sum, item) => sum + Number(item.amount_due ?? 0), 0)

  return {
    grand_total: grandTotal,
    total_amount: grandTotal
  }
})

type InvoiceLineNode = {
  [key: string]: unknown
  id?: number | string
  type?: string
  name?: string
  service_name?: string
  serviceName?: string
  pt_service_rendered?: string
  ptServiceRendered?: string
  description?: string
  quantity?: number
  price?: number
  unitPrice?: number
  unit_price?: number
  lgu_contract_price?: number | string
  lguContractPrice?: number | string
  lgu_price?: number | string
  lguPrice?: number | string
  contract_price?: number | string
  contractPrice?: number | string
  contract_unit_price?: number | string
  contractUnitPrice?: number | string
  standard_unit_price_snapshot?: number | string
  standardUnitPriceSnapshot?: number | string
  package_unit_price_snapshot?: number | string
  packageUnitPriceSnapshot?: number | string
  dropout_unit_price_snapshot?: number | string
  dropoutUnitPriceSnapshot?: number | string
  unit_price_snapshot?: number | string
  unitPriceSnapshot?: number | string
  dropoutUnitPrice?: number
  dropout_unit_price?: number
  dropoutPrice?: number
  dropout_price?: number
  contract_unit_price_snapshot?: number | string
  contractUnitPriceSnapshot?: number | string
  lineTotal?: number
  line_total?: number | string
  total?: number | string
  subtotal?: number | string
  amount?: number | string
  amount_due?: number | string
  amountDue?: number | string
  amount_out?: number | string
  amountOut?: number | string
  total_amount?: number | string
  totalAmount?: number | string
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
  sub_items?: InvoiceLineNode[]
  items?: InvoiceLineNode[]
  services?: InvoiceLineNode[]
  line_items?: InvoiceLineNode[]
  lineItems?: InvoiceLineNode[]
  included_services?: InvoiceLineNode[]
  includedServices?: InvoiceLineNode[]
  package_services?: InvoiceLineNode[]
  packageServices?: InvoiceLineNode[]
  child_services?: InvoiceLineNode[]
  childServices?: InvoiceLineNode[]
  service_inclusions?: InvoiceLineNode[]
  serviceInclusions?: InvoiceLineNode[]
  package_inclusions?: InvoiceLineNode[]
  packageInclusions?: InvoiceLineNode[]
  availed_services?: Array<InvoiceLineNode | string>
  availedServices?: Array<InvoiceLineNode | string>
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

const getRecordValue = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined
  return (record as Record<string, unknown>)[key]
}

const stripPackageSessionSuffix = (value: string): string =>
  value
    .replace(/\s+-\s+Session\s+\d+\s+of\s+\d+\s*$/i, "")
    .replace(/\s+Session\s+-\s+Session\s+\d+\s+of\s+\d+\s*$/i, "")
    .trim()

const parseAmount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null

  const normalized = typeof value === "string"
    ? value.replace(/[^\d.-]/g, "")
    : value

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const getAmount = (record: unknown, keys: string[]): number | null => {
  for (const key of keys) {
    const parsed = parseAmount(getRecordValue(record, key))

    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

const normalizeChildEntry = (entry: unknown): InvoiceLineNode[] => {
  if (typeof entry === "string") {
    const name = entry.trim()
    return name ? [{ name }] : []
  }

  return entry && typeof entry === "object" ? [entry as InvoiceLineNode] : []
}

const parseJsonChildren = (value: unknown): InvoiceLineNode[] => {
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

const normalizeCatalogItemName = (value?: string): string =>
  String(value ?? "")
    .trim()
    .replace(/^[-\s]*(?:\d+(?:\.\d+)?|x\d+)\s+/i, "")
    .replace(/\s+\(LGU\s+.*?\)\s*$/i, "")
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

const findPackageOffer = (pkgId?: string | number, pkgName?: string): LocalPackageOffer | undefined => {
  const id = String(pkgId ?? "").trim()
  if (id) {
    const match = localPackageOffers.value.find(item => item.id === id)
    if (match) return match
  }

  const name = normalizeCatalogItemName(pkgName)
  return name
    ? localPackageOffers.value.find(item => catalogNamesMatch(item.name, name))
    : undefined
}

const findBundle = (bundleId?: string | number): LocalBundle | undefined => {
  const id = String(bundleId ?? "").trim()
  return id ? localBundles.value.find(bundle => bundle.id === id || `bundle-${bundle.id}` === id) : undefined
}

const getCatalogServiceName = (id?: string): string | undefined =>
  id ? localServices.value.find(service => service.id === id)?.name : undefined

const getCatalogServicePrice = (id?: string): number | undefined => {
  if (!id) return undefined
  const price = Number(localServices.value.find(service => service.id === id)?.price ?? 0)
  return Number.isFinite(price) && price >= 0 ? price : undefined
}

const getCatalogServicePriceByName = (name?: string): number | undefined => {
  const normalized = normalizeCatalogItemName(name)
  if (!normalized) return undefined
  const price = Number(localServices.value.find(service => normalizeCatalogItemName(service.name) === normalized)?.price ?? 0)
  return Number.isFinite(price) && price >= 0 ? price : undefined
}

const getBundlePriceByName = (name?: string): number | undefined => {
  const normalized = normalizeCatalogItemName(name)
  if (!normalized) return undefined
  const bundle = localBundles.value.find(item => normalizeCatalogItemName(item.name) === normalized)
  if (!bundle) return undefined
  const price = Number(bundle.bundledPrice)
  return Number.isFinite(price) && price >= 0 ? price : undefined
}

type LguInvoicePriceMode = "package" | "dropout"

const getConfiguredPackageItemPrice = (
  item: LocalPackageItem | undefined,
  priceMode: LguInvoicePriceMode
): number | undefined => {
  if (!item) return undefined
  return priceMode === "dropout"
    ? item.dropoutUnitPrice ?? item.standardUnitPrice ?? item.packageUnitPrice
    : item.packageUnitPrice
}

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

const findConfiguredPackageItemByName = (
  pkg: LocalPackageOffer,
  name?: string
): LocalPackageItem | undefined => {
  const items = [
    ...(pkg.machineItems ?? []),
    ...(pkg.techniqueItems ?? []),
    ...(pkg.evaluationItems ?? []),
    ...(pkg.addOnItems ?? []),
    ...(pkg.sessionItems ?? [])
  ]

  return items.find(item => catalogNamesMatch(getCatalogServiceName(item.id), name))
}

const enrichCatalogSubItemPrices = (
  items: InvoiceLineNode[] | undefined,
  priceMode: LguInvoicePriceMode
): InvoiceLineNode[] | undefined => {
  if (!items?.length) return items

  return items.map(item => {
    const children = enrichCatalogSubItemPrices(getPayloadChildren(item), priceMode)
    const fallbackPrice = children?.length
      ? getBundlePriceByName(getServiceName(item))
      : getCatalogServicePriceByName(getServiceName(item))
    const unitPrice = priceMode === "dropout"
      ? item.dropoutUnitPrice ?? item.dropout_unit_price ?? item.dropoutPrice ?? item.dropout_price ?? item.unitPrice ?? item.unit_price ?? item.price ?? fallbackPrice
      : item.unitPrice ?? item.unit_price ?? item.price ?? fallbackPrice

    return {
      ...clearChildCollections(item),
      ...(unitPrice === undefined ? {} : { unitPrice }),
      children
    }
  })
}

const applyConfiguredPackageRates = (
  pkg: LocalPackageOffer,
  items: InvoiceLineNode[] | undefined,
  priceMode: LguInvoicePriceMode
): InvoiceLineNode[] | undefined => {
  if (!items?.length) return items

  const bundle = findBundle(pkg.bundleId)
  const bundleItem = findPackageBundleItem(pkg)

  return items.map(item => {
    const children = applyConfiguredPackageRates(pkg, getPayloadChildren(item), priceMode)
    const isBundleContainer = Boolean(
      children?.length &&
      bundleItem &&
      bundle?.name &&
      catalogNamesMatch(getServiceName(item), bundle.name)
    )
    const configuredItem = isBundleContainer ? bundleItem : findConfiguredPackageItemByName(pkg, getServiceName(item))
    const configuredUnitPrice = getConfiguredPackageItemPrice(configuredItem, priceMode)

    return {
      ...clearChildCollections(item),
      ...(configuredUnitPrice === undefined ? {} : { unitPrice: configuredUnitPrice }),
      ...(priceMode === "dropout" && configuredUnitPrice !== undefined ? { dropoutUnitPrice: configuredUnitPrice } : {}),
      children
    }
  })
}

const expandPackageItemIds = (
  items: LocalPackageItem[] | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined,
  multiplier: number,
  priceMode: LguInvoicePriceMode
): InvoiceLineNode[] => {
  const sourceItems: LocalPackageItem[] = items?.length
    ? items
    : (ids ?? []).map(id => ({ id, qty: normalizePositiveInt(fallbackQty, 1) }))

  return sourceItems.flatMap(item => {
    const name = getCatalogServiceName(item.id)
    if (!name) return []

    const configuredPrice = getConfiguredPackageItemPrice(item, priceMode)
    const unitPrice = configuredPrice ?? getCatalogServicePrice(item.id)

    return [{
      name,
      quantity: Math.max(1, normalizePositiveInt(item.qty, 1) * multiplier),
      ...(unitPrice === undefined ? {} : { unitPrice }),
      ...(item.dropoutUnitPrice === undefined ? {} : { dropoutUnitPrice: item.dropoutUnitPrice })
    }]
  })
}

const getPackageInvoiceSubItems = (
  pkgId?: string | number,
  pkgName?: string,
  multiplier = 1,
  priceMode: LguInvoicePriceMode = "package"
): InvoiceLineNode[] => {
  const pkg = findPackageOffer(pkgId, pkgName)
  if (!pkg) return []

  if (pkg.invoiceSubItems?.length) {
    const multiply = (items: InvoiceLineNode[]): InvoiceLineNode[] =>
      items.map(item => ({
        ...item,
        quantity: Math.max(1, getQuantity(item) * multiplier),
        children: getPayloadChildren(item).length ? multiply(getPayloadChildren(item)) : undefined
      }))

    const configuredSubItems = applyConfiguredPackageRates(pkg, pkg.invoiceSubItems, priceMode) ?? pkg.invoiceSubItems
    return enrichCatalogSubItemPrices(multiply(configuredSubItems), priceMode) ?? multiply(configuredSubItems)
  }

  const subItems: InvoiceLineNode[] = []
  const bundle = findBundle(pkg.bundleId)

  if (bundle) {
    const bundleItem = findPackageBundleItem(pkg)
    const bundleQuantity = normalizePositiveInt(bundleItem?.qty ?? pkg.bundleQty, 1)
    const bundlePrice = getConfiguredPackageItemPrice(bundleItem, priceMode) ?? Number(bundle.bundledPrice ?? 0)
    const bundleIds = [
      ...(bundle.machineIds ?? []),
      ...(bundle.techniqueIds ?? []),
      ...(bundle.evaluationIds ?? []),
      ...(bundle.addOnIds ?? [])
    ]

    subItems.push({
      name: bundle.name,
      quantity: Math.max(1, bundleQuantity * multiplier),
      unitPrice: bundlePrice,
      ...(bundleItem?.dropoutUnitPrice === undefined ? {} : { dropoutUnitPrice: bundleItem.dropoutUnitPrice }),
      children: bundleIds.flatMap(id => {
        const name = getCatalogServiceName(id)
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
    ...expandPackageItemIds(pkg.machineItems, pkg.machineIds, pkg.machineQty, multiplier, priceMode),
    ...expandPackageItemIds(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty, multiplier, priceMode),
    ...expandPackageItemIds(pkg.evaluationItems, pkg.evaluationIds, pkg.evaluationQty, multiplier, priceMode),
    ...expandPackageItemIds(pkg.addOnItems, pkg.addOnIds, pkg.addOnQty, multiplier, priceMode),
    ...expandPackageItemIds(pkg.sessionItems, pkg.sessionIds, pkg.sessionQty, multiplier, priceMode)
  )

  return enrichCatalogSubItemPrices(subItems, priceMode) ?? subItems
}

const getDirectChildren = (item: InvoiceLineNode): InvoiceLineNode[] =>
  CHILD_SERVICE_KEYS.flatMap(key => parseJsonChildren(getRecordValue(item, key)))

const getJsonChildren = (item: InvoiceLineNode): InvoiceLineNode[] =>
  CHILD_SERVICE_JSON_KEYS.flatMap(key => parseJsonChildren(getRecordValue(item, key)))

const getPayloadChildren = (item: InvoiceLineNode): InvoiceLineNode[] => [
  ...getDirectChildren(item),
  ...getJsonChildren(item)
]

const hasNestedChildren = (items: InvoiceLineNode[]): boolean =>
  items.some(item => getPayloadChildren(item).length > 0 || hasNestedChildren(getPayloadChildren(item)))

const getCatalogPackageChildren = (item: InvoiceLineNode, payloadChildren: InvoiceLineNode[]): InvoiceLineNode[] => {
  const packageName = getServiceName(item)
  const pkg = findPackageOffer(item.id, packageName)
  if (!pkg) return []

  const catalogChildren = getPackageInvoiceSubItems(
    pkg.id,
    pkg.name,
    getQuantity(item),
    invoicePriceMode.value
  )

  if (!catalogChildren.length) return []
  if (!payloadChildren.length) return catalogChildren
  return hasNestedChildren(payloadChildren) ? payloadChildren : catalogChildren
}

const getChildren = (item: InvoiceLineNode): InvoiceLineNode[] => {
  const payloadChildren = getPayloadChildren(item)
  const catalogChildren = getCatalogPackageChildren(item, payloadChildren)
  return catalogChildren.length ? catalogChildren : payloadChildren
}

const hasNestedInvoiceLineItems = (value?: string | null): boolean =>
  parseInvoiceLineItems(value).some(item => getChildren(item).length > 0)

const clearChildCollections = (item: InvoiceLineNode): InvoiceLineNode => {
  const next = { ...item }

  for (const key of [...CHILD_SERVICE_KEYS, ...CHILD_SERVICE_JSON_KEYS]) {
    delete next[key]
  }

  return next
}

const getQuantity = (item: InvoiceLineNode): number => {
  const quantity = Math.floor(Number(item.quantity ?? 1))
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

const getTreatmentDate = (
  item: InvoiceLineNode,
  fallback: { treatmentDate?: string } = {}
): string =>
  item.treatmentDate ||
  selectedAppointmentDate.value ||
  fallback.treatmentDate ||
  billingDetail.value?.created_at ||
  ""

const getServiceName = (item: InvoiceLineNode): string =>
  String(
    item.service_name ??
    item.serviceName ??
    item.pt_service_rendered ??
    item.ptServiceRendered ??
    item.description ??
    item.name ??
    ""
  ).trim() || "—"

const getInvoicePriceKeys = (): string[] =>
  invoicePriceMode.value === "dropout"
    ? [
        "dropoutUnitPrice",
        "dropout_unit_price",
        "dropoutPrice",
        "dropout_price",
        "dropout_unit_price_snapshot",
        "dropoutUnitPriceSnapshot",
        ...PRICE_KEYS
      ]
    : PRICE_KEYS

const getSessionUnitTotal = (item: InvoiceLineNode, quantity: number): number => {
  const lineTotal = getAmount(item, LINE_TOTAL_KEYS)

  if (lineTotal !== null) {
    return lineTotal / quantity
  }

  const unitTotal = getAmount(item, getInvoicePriceKeys())
  return unitTotal ?? 0
}

const pluralizeUnit = (quantity: number, singular: string): string =>
  `${quantity} ${singular}${quantity === 1 ? "" : "s"}`

const getMaxChildQuantity = (items: InvoiceLineNode[]): number => {
  const quantities = items.flatMap(item => {
    const ownQuantity = getQuantity(item)
    const childQuantity = getMaxChildQuantity(getChildren(item))
    return [ownQuantity, childQuantity]
  })

  return Math.max(0, ...quantities.filter(quantity => Number.isFinite(quantity)))
}

const getParentSessionCount = (parent: InvoiceLineNode, children: InvoiceLineNode[]): number => {
  const parentQuantity = getQuantity(parent)
  if (parentQuantity > 1) return parentQuantity

  const childQuantity = getMaxChildQuantity(children)
  if (childQuantity > 1) return childQuantity

  const completedCount = completedSessionSequences.value.length
  if (completedCount > 1) return completedCount

  const availedCount = Math.max(
    0,
    ...(detail.value?.package_availments ?? []).map(pkg => Number(pkg.availed_count ?? 0))
  )
  return availedCount > 1 ? availedCount : parentQuantity
}

const formatParentServiceName = (parent: InvoiceLineNode, children: InvoiceLineNode[]): string => {
  const sessionCount = getParentSessionCount(parent, children)
  const suffix = sessionCount > 0 ? ` (${pluralizeUnit(sessionCount, "session")})` : ""
  return `${getServiceName(parent)}${suffix}`
}

const formatChildServiceName = (item: InvoiceLineNode): string => {
  const quantity = getQuantity(item)
  const suffix = quantity > 1 ? ` (${pluralizeUnit(quantity, "quantity")})` : ""
  return `${getServiceName(item)}${suffix}`
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
    const children = getChildren(item)

    if (children.length) {
      const allocatedChildren = filterChildrenForSession(children, sessionSequence, occurrences)

      return allocatedChildren.length
        ? [{
          ...clearChildCollections(item),
          quantity: 1,
          allocatedSessionSequence,
          allocatedTotalSessions: quantity,
          lineTotal: undefined,
          children: allocatedChildren
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
  const value = getAmount(item, getInvoicePriceKeys())

  return value !== null
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

const completedAppointments = computed(() =>
  (detail.value?.appointments ?? [])
    .filter(appointment => String(appointment.status ?? "").trim().toUpperCase() === "COMPLETED")
    .sort((left, right) => {
      const leftDate = parseDate(left.appointment_date)?.getTime() ?? 0
      const rightDate = parseDate(right.appointment_date)?.getTime() ?? 0
      return leftDate - rightDate
    })
)

const serviceNameByAppointmentId = computed(() => {
  const lookup = new Map<number, string>()

  for (const authorization of detail.value?.authorizations ?? []) {
    for (const session of authorization.sessions ?? []) {
      const appointmentId = Number(session.appointment_id ?? 0)
      const serviceName = String(session.service_name ?? "").trim()

      if (appointmentId > 0 && serviceName && !lookup.has(appointmentId)) {
        lookup.set(appointmentId, serviceName)
      }
    }
  }

  return lookup
})

const fallbackServiceName = (appointment: NonNullable<LguPatientCreditDetail["appointments"]>[number]): string => {
  const services = appointment.availed_services ?? []
  const serviceLabel = services.map(service => String(service).trim()).filter(Boolean).join(", ")
  if (serviceLabel) return serviceLabel

  const sessionServiceName = serviceNameByAppointmentId.value.get(Number(appointment.appointment_id ?? 0))
  if (sessionServiceName) return sessionServiceName

  return appointment.package_name || "LGU completed session"
}

const selectedAppointment = computed(() => {
  const appointmentId = selectedAppointmentId.value
  if (appointmentId <= 0) return null

  return (detail.value?.appointments ?? []).find(appointment =>
    Number(appointment.appointment_id ?? 0) === appointmentId
  ) ?? null
})

const selectedAppointmentDate = computed(() =>
  selectedAppointment.value?.appointment_date || ""
)

const normalizeServiceName = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")

const selectedAppointmentServiceNames = computed(() => {
  const names = new Set<string>()
  const appointment = selectedAppointment.value

  for (const service of appointment?.availed_services ?? []) {
    const normalized = normalizeServiceName(service)
    if (normalized) names.add(normalized)
  }

  const sessionServiceName = serviceNameByAppointmentId.value.get(selectedAppointmentId.value)
  const normalizedSessionServiceName = normalizeServiceName(sessionServiceName)
  if (normalizedSessionServiceName) names.add(normalizedSessionServiceName)

  return names
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

  if (sequences.length) {
    return Array.from(new Set(sequences))
  }

  const completedIndex = completedAppointments.value.findIndex(appointment =>
    Number(appointment.appointment_id ?? 0) === appointmentId
  )

  return completedIndex >= 0 ? [completedIndex + 1] : []
})

const isBillingScopedInvoice = computed(() => billingId.value > 0)

const billingLinkedAppointmentId = computed(() =>
  getNumberFromRecord(billingDetail.value, [
    "appointment_id",
    "appointmentId",
    "root_appointment_id",
    "rootAppointmentId"
  ])
)

const scopedCompletedAppointments = computed(() => {
  if (selectedAppointmentId.value > 0) {
    return completedAppointments.value.filter(appointment =>
      Number(appointment.appointment_id ?? 0) === selectedAppointmentId.value
    )
  }

  if (isBillingScopedInvoice.value) {
    const linkedAppointmentId = billingLinkedAppointmentId.value
    return linkedAppointmentId > 0
      ? completedAppointments.value.filter(appointment =>
          Number(appointment.appointment_id ?? 0) === linkedAppointmentId
        )
      : []
  }

  return completedAppointments.value
})

const getLineAppointmentId = (item: InvoiceLineNode): number =>
  getNumberFromRecord(item, [
    "appointment_id",
    "appointmentId",
    "appointmentID",
    "appt_id",
    "apptId"
  ])

const itemMatchesSelectedAppointmentService = (item: InvoiceLineNode): boolean => {
  const selectedNames = selectedAppointmentServiceNames.value
  if (!selectedNames.size) return true

  const ownName = normalizeServiceName(getServiceName(item))
  if (selectedNames.has(ownName)) return true

  return getChildren(item).some(child =>
    selectedNames.has(normalizeServiceName(getServiceName(child)))
  )
}

const filterItemsForSelectedAppointment = (items: InvoiceLineNode[]): InvoiceLineNode[] => {
  const appointmentId = selectedAppointmentId.value
  if (appointmentId <= 0) return items

  const appointmentMatchedItems = items.filter(item => {
    const itemAppointmentId = getLineAppointmentId(item)
    return itemAppointmentId <= 0 || itemAppointmentId === appointmentId
  })

  const serviceMatchedItems = appointmentMatchedItems.filter(itemMatchesSelectedAppointmentService)
  const candidateItems = serviceMatchedItems.length ? serviceMatchedItems : appointmentMatchedItems
  const sessionSequences = selectedAppointmentSessionSequences.value

  if (!sessionSequences.length) {
    return candidateItems
  }

  const sessionMatchedItems = sessionSequences.flatMap(sessionSequence =>
    filterChildrenForSession(candidateItems, sessionSequence)
  )

  return sessionMatchedItems.length ? sessionMatchedItems : candidateItems
}

const parsePositiveSequenceNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

const getSplitRowInfo = (item: InvoiceLineNode): {
  rowCount: number
  totalSessions: number
  sequenceStart: number
} => {
  const quantity = getQuantity(item)
  const allocatedSequence = parsePositiveSequenceNumber(item.allocatedSessionSequence)
  const allocatedTotal = parsePositiveSequenceNumber(item.allocatedTotalSessions)

  if (allocatedSequence) {
    return {
      rowCount: 1,
      totalSessions: allocatedTotal ?? quantity,
      sequenceStart: allocatedSequence
    }
  }

  return {
    rowCount: quantity,
    totalSessions: quantity,
    sequenceStart: 1
  }
}

const formatSessionSequence = (sequence: number, total: number): string =>
  `${sequence} / ${Math.max(1, total)}`

const formatHierarchyServiceName = (item: InvoiceLineNode, level: number): string => {
  const prefix = level > 0 ? `${"-".repeat(level)} ` : ""
  return `${prefix}${formatChildServiceName(item)}`
}

const appendSplitServiceRows = (
  item: InvoiceLineNode,
  inherited: { treatmentDate?: string },
  rows: TableRow[],
  nextItemNoRef: { value: number },
  options: {
    level: number
    numberRows: boolean
    keyPrefix: string
    suppressRate?: boolean
  }
): void => {
  const itemTreatmentDate = getTreatmentDate(item, inherited)
  const quantity = getQuantity(item)
  const unitTotal = getSessionUnitTotal(item, quantity)
  const { rowCount, totalSessions, sequenceStart } = getSplitRowInfo(item)

  for (let index = 0; index < rowCount; index++) {
    const sequence = sequenceStart + index

    rows.push({
      key: `${options.keyPrefix}-${String(item.id ?? item.name ?? "item")}-${options.level}-${rows.length}-${sequence}`,
      itemNo: options.numberRows ? nextItemNoRef.value++ : 0,
      treatmentDate: itemTreatmentDate,
      serviceName: formatHierarchyServiceName(item, options.level),
      sessionSequence: formatSessionSequence(sequence, totalSessions),
      unitTotal: !options.suppressRate && hasOwnRate(item) ? unitTotal : null,
      level: options.level,
      isParent: false
    })
  }
}

const appendServiceRows = (
  items: InvoiceLineNode[],
  inherited: { treatmentDate?: string },
  rows: TableRow[],
  nextItemNoRef: { value: number },
  level = 1,
  parentHasRate = false
): void => {
  for (const item of items) {
    const children = getChildren(item)
    const itemHasRate = hasOwnRate(item)

    if (!children.length) {
      appendSplitServiceRows(item, inherited, rows, nextItemNoRef, {
        level,
        numberRows: isDropoutPatient.value && level === 1,
        keyPrefix: "direct",
        suppressRate: parentHasRate
      })
      continue
    }

    const itemTreatmentDate = getTreatmentDate(item, inherited)
    const quantity = getQuantity(item)
    const unitTotal = getSessionUnitTotal(item, quantity)

    rows.push({
      key: `group-${String(item.id ?? item.name ?? "item")}-${level}-${rows.length}`,
      itemNo: isDropoutPatient.value && level === 1 ? nextItemNoRef.value++ : 0,
      treatmentDate: itemTreatmentDate,
      serviceName: formatHierarchyServiceName(item, level),
      sessionSequence: "",
      unitTotal: !parentHasRate && itemHasRate ? unitTotal : null,
      level,
      isParent: false
    })

    appendServiceRows(children, {
      treatmentDate: itemTreatmentDate
    }, rows, nextItemNoRef, level + 1, parentHasRate || itemHasRate)
  }
}

const flattenInvoiceLineItems = (
  items: InvoiceLineNode[],
  inherited: { treatmentDate?: string; sessionSequence?: string } = {},
  rows: TableRow[] = [],
  nextItemNoRef: { value: number } = { value: 1 }
): TableRow[] => {
  items.forEach(parent => {
    const parentTreatmentDate = getTreatmentDate(parent, inherited)
    const sourceChildren = getChildren(parent)

    // If this is a top-level individual service with no children, split it by quantity.
    if (!sourceChildren.length) {
      appendSplitServiceRows(parent, {
        treatmentDate: parentTreatmentDate
      }, rows, nextItemNoRef, {
        level: 1,
        numberRows: true,
        keyPrefix: "single"
      })

      return
    }

    const children = selectedAppointmentId.value > 0
      ? filterItemsForSelectedAppointment(sourceChildren)
      : isDropoutPatient.value
        ? completedSessionSequences.value.flatMap(sessionSequence => (
            filterChildrenForSession(sourceChildren, sessionSequence)
          ))
        : sourceChildren

    const parentNo = isDropoutPatient.value ? 0 : nextItemNoRef.value++

    rows.push({
      key: `${parentNo}-${String(parent.id ?? parent.name ?? "parent")}`,
      itemNo: parentNo,
      treatmentDate: "",
      serviceName: formatParentServiceName(parent, children),
      sessionSequence: "",
      unitTotal: null,
      level: 0,
      isParent: true
    })

    // Direct children only:
    // Normal patients: item number stays on the parent package/service row.
    // Dropped-out patients: item number is per direct item, including the bundle parent.
    // Nested bundle child services are not displayed.
    appendServiceRows(children, {
      treatmentDate: parentTreatmentDate
    }, rows, nextItemNoRef)
  })

  return rows
}

const buildBillingScopedSessionRows = (): TableRow[] => {
  const currentBillingId = Number(billingDetail.value?.id ?? billingId.value ?? 0)
  if (currentBillingId <= 0 || !detail.value?.authorizations?.length) {
    return []
  }

  const totalCompleted = completedSessionSequences.value.length
  const sessionsForBilling = detail.value.authorizations
    .filter(auth =>
      Number(auth.phase1_billing_id ?? 0) === currentBillingId ||
      (auth.sessions ?? []).some(session =>
        Number(session.monthly_billing_id ?? 0) === currentBillingId ||
        Number(session.dropout_billing_id ?? 0) === currentBillingId
      )
    )
    .flatMap(auth => {
      const authTotal = totalCompleted || Number(auth.total_sessions ?? 0)
      return (auth.sessions ?? []).map(session => ({ ...session, authTotal }))
    })
    .filter(session => appointmentStatusById.value.get(session.appointment_id) === "COMPLETED")
    .filter(session =>
      selectedAppointmentId.value <= 0 ||
      Number(session.appointment_id ?? 0) === selectedAppointmentId.value
    )
    .sort((left, right) => Number(left.session_sequence ?? 0) - Number(right.session_sequence ?? 0))

  if (!sessionsForBilling.length) {
    return []
  }

  const billingAmount = Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
  const unitTotal = sessionsForBilling.length > 0 ? billingAmount / sessionsForBilling.length : 0

  return sessionsForBilling.map((session, index) => ({
    key: `session-${session.id ?? index}`,
    itemNo: index + 1,
    treatmentDate: String(session.appointment_date ?? ""),
    serviceName: String(session.service_name ?? "").trim() || "-",
    sessionSequence: `${Number(session.session_sequence ?? index + 1)} / ${session.authTotal}`,
    unitTotal
  }))
}

const invoiceRows = computed<TableRow[]>(() => {
  const appointmentScopedBillingRows = selectedAppointmentId.value > 0
    ? buildBillingScopedSessionRows()
    : []
  if (appointmentScopedBillingRows.length) {
    return appointmentScopedBillingRows
  }

  const lineItems = parseInvoiceLineItems(billingDetail.value?.line_items_json)
  if (lineItems.length) {
    const scopedLineItems = selectedAppointmentId.value > 0
      ? filterItemsForSelectedAppointment(lineItems)
      : lineItems
    const flattenedRows = flattenInvoiceLineItems(scopedLineItems)
    if (flattenedRows.some(row => !row.isParent)) {
      return flattenedRows
    }
  }

  // Billing-scoped invoice fallback: use only sessions tied to the current billing.
  // Do not append other completed appointments from the same patient or period.
  const currentBillingId = Number(billingDetail.value?.id ?? billingId.value ?? 0)
  if (currentBillingId > 0 && detail.value?.authorizations?.length) {
    const totalCompleted = completedSessionSequences.value.length

    const sessionsForBilling = (detail.value.authorizations)
      .filter(auth =>
        Number(auth.phase1_billing_id ?? 0) === currentBillingId ||
        (auth.sessions ?? []).some(s =>
          Number(s.monthly_billing_id ?? 0) === currentBillingId ||
          Number(s.dropout_billing_id ?? 0) === currentBillingId
        )
      )
      .flatMap(auth => {
        const authTotal = totalCompleted || Number(auth.total_sessions ?? 0)
        return (auth.sessions ?? []).map(s => ({ ...s, authTotal }))
      })
      .filter(s => appointmentStatusById.value.get(s.appointment_id) === "COMPLETED")
      .filter(s =>
        selectedAppointmentId.value <= 0 ||
        Number(s.appointment_id ?? 0) === selectedAppointmentId.value
      )
      .sort((a, b) => Number(a.session_sequence ?? 0) - Number(b.session_sequence ?? 0))

    if (sessionsForBilling.length > 0) {
      const billingAmount = Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
      const unitTotal = sessionsForBilling.length > 0 ? billingAmount / sessionsForBilling.length : 0

      return sessionsForBilling.map((session, index) => ({
        key: `session-${session.id ?? index}`,
        itemNo: index + 1,
        treatmentDate: String(session.appointment_date ?? ''),
        serviceName: String(session.service_name ?? '').trim() || '—',
        sessionSequence: `${Number(session.session_sequence ?? index + 1)} / ${session.authTotal}`,
        unitTotal
      }))
    }
  }

  const appointmentScopedCompletedAppointments = scopedCompletedAppointments.value

  if (appointmentScopedCompletedAppointments.length) {
    const billingAmount = Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
    const fallbackUnitTotal = appointmentScopedCompletedAppointments.length > 0
      ? billingAmount / appointmentScopedCompletedAppointments.length
      : 0

    return appointmentScopedCompletedAppointments.map((appointment, index) => ({
      key: `completed-${appointment.appointment_id}`,
      itemNo: index + 1,
      treatmentDate: appointment.appointment_date,
      serviceName: fallbackServiceName(appointment),
      sessionSequence: `${index + 1} / ${appointmentScopedCompletedAppointments.length}`,
      unitTotal: fallbackUnitTotal
    }))
  }

  if (isBillingScopedInvoice.value) {
    return []
  }

  return (detail.value?.package_availments ?? []).map((pkg, index) => ({
    key: String(pkg.authorization_id),
    itemNo: index + 1,
    treatmentDate: billingDetail.value?.created_at || "",
    serviceName: pkg.package_name || "—",
    sessionSequence: `${pkg.used_count} / ${pkg.availed_count}`,
    unitTotal: Number(billingDetail.value?.total_amount ?? billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
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

const mergeClaimBillingJson = (
  billing: BillingListItem | null,
  claimBilling?: LguPatientCreditDetail["billings"][number] | null
): BillingListItem | null => {
  if (!billing || !claimBilling?.line_items_json) return billing

  const contextHasChildren = hasNestedInvoiceLineItems(billing.line_items_json)
  const claimHasChildren = hasNestedInvoiceLineItems(claimBilling.line_items_json)
  const shouldUseClaimJson = claimHasChildren && !contextHasChildren

  if (!shouldUseClaimJson) return billing

  return {
    ...billing,
    service_name: claimBilling.service_name ?? billing.service_name,
    package_name: claimBilling.package_name ?? billing.package_name,
    line_items_json: claimBilling.line_items_json,
    amount_due: Number(claimBilling.amount_due ?? billing.amount_due),
    pricing_source: claimBilling.pricing_source ?? billing.pricing_source
  }
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
      loadLguInvoiceCatalog().then(() => null),
      lguBillingService.getPatientCreditDetail(selectedPatientId, periodYear, periodMonth),
      patientTanstackService.fetchContext(queryClient, selectedPatientId)
    ]).then(([_, detailResult, sponsorResult]) => [detailResult, sponsorResult] as const)
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
