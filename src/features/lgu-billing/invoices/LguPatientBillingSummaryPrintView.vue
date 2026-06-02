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
              <th class="w-[60px] text-center">ITEM No.</th>
              <th class="w-[110px] text-right">TREATMENT DATE</th>
              <th class="w-[150px] text-left">PT SERVICE RENDERED</th>
              <th class="w-[100px] text-center">SESSION SEQUENCE</th>
              <th class="w-[150px] text-right">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!invoiceRows.length">
              <td colspan="5" class="text-center">
                No completed LGU billing summary records found for the selected period.
              </td>
            </tr>
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

const getDirectChildren = (item: InvoiceLineNode): InvoiceLineNode[] =>
  CHILD_SERVICE_KEYS.flatMap(key => parseJsonChildren(getRecordValue(item, key)))

const getJsonChildren = (item: InvoiceLineNode): InvoiceLineNode[] =>
  CHILD_SERVICE_JSON_KEYS.flatMap(key => parseJsonChildren(getRecordValue(item, key)))

const getChildren = (item: InvoiceLineNode): InvoiceLineNode[] => [
  ...getDirectChildren(item),
  ...getJsonChildren(item)
]

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

const getSessionUnitTotal = (item: InvoiceLineNode, quantity: number): number => {
  const lineTotal = getAmount(item, LINE_TOTAL_KEYS)

  if (lineTotal !== null) {
    return lineTotal / quantity
  }

  const unitTotal = getAmount(item, isDropoutPatient.value
    ? [
        ...PRICE_KEYS,
        "dropoutUnitPrice",
        "dropout_unit_price",
        "dropoutPrice",
        "dropout_price"
      ]
    : PRICE_KEYS
  )
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
  const value = getAmount(item, isDropoutPatient.value
    ? [
        ...PRICE_KEYS,
        "dropoutUnitPrice",
        "dropout_unit_price",
        "dropoutPrice",
        "dropout_price"
      ]
    : PRICE_KEYS
  )

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

const appendServiceRows = (
  items: InvoiceLineNode[],
  inherited: { treatmentDate?: string },
  rows: TableRow[],
  nextItemNoRef: { value: number },
  level = 1
): void => {
  for (const item of items) {
    const itemName = formatChildServiceName(item)
    const itemTreatmentDate = getTreatmentDate(item, inherited)
    const quantity = getQuantity(item)
    const unitTotal = getSessionUnitTotal(item, quantity)
    const children = getChildren(item)

    rows.push({
      key: `${String(item.id ?? item.name ?? "item")}-${level}-${nextItemNoRef.value}`,
      itemNo: nextItemNoRef.value++,
      treatmentDate: itemTreatmentDate,
      serviceName: itemName,
      sessionSequence: "",
      unitTotal: hasOwnRate(item) ? unitTotal : null,
      level,
      isParent: false
    })

    if (children.length > 0) {
      appendServiceRows(children, {
        treatmentDate: itemTreatmentDate
      }, rows, nextItemNoRef, level + 1)
      continue
    }
  }
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

    const sourceChildren = getChildren(parent)
    const children = isDropoutPatient.value
      ? completedSessionSequences.value.flatMap(sessionSequence => (
          filterChildrenForSession(sourceChildren, sessionSequence)
        ))
      : sourceChildren

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

    appendServiceRows(children, {
      treatmentDate: parentTreatmentDate
    }, rows, nextItemNoRef)

  })

  return rows
}
const invoiceRows = computed<TableRow[]>(() => {
  const lineItems = parseInvoiceLineItems(billingDetail.value?.line_items_json)
  if (lineItems.length) {
    const flattenedRows = flattenInvoiceLineItems(lineItems)
    if (flattenedRows.some(row => !row.isParent)) {
      return flattenedRows
    }
  }

  // Session-based fallback: use authorization sessions tied to this specific billing.
  // Each consumption row becomes its own display row, correctly showing all service types.
  // Works both before claim creation (phase1_billing_id match) and after (monthly/dropout_billing_id match).
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
      .sort((a, b) => Number(a.session_sequence ?? 0) - Number(b.session_sequence ?? 0))

    if (sessionsForBilling.length > 0) {
      // Also include completed appointments that have no consumption record yet,
      // scoped to the transaction date range if available.
      const coveredAppointmentIds = new Set(sessionsForBilling.map(s => Number(s.appointment_id)))
      const rangeFrom = transactionFromDate.value
      const rangeTo = transactionToDate.value
      const uncoveredAppointments = completedAppointments.value.filter(appt => {
        if (coveredAppointmentIds.has(Number(appt.appointment_id))) return false
        if (rangeFrom || rangeTo) {
          const apptDate = parseDate(appt.appointment_date)
          if (!apptDate) return false
          const apptTime = apptDate.getTime()
          if (rangeFrom && apptTime < rangeFrom.getTime()) return false
          if (rangeTo) {
            const rangeToEnd = new Date(rangeTo)
            rangeToEnd.setHours(23, 59, 59, 999)
            if (apptTime > rangeToEnd.getTime()) return false
          }
        }
        return true
      })

      type SessionRow = typeof sessionsForBilling[number]
      type AppointmentRow = typeof uncoveredAppointments[number]
      type CombinedRow = { type: 'session'; data: SessionRow } | { type: 'appointment'; data: AppointmentRow }

      const combined: CombinedRow[] = [
        ...sessionsForBilling.map(s => ({ type: 'session' as const, data: s })),
        ...uncoveredAppointments.map(a => ({ type: 'appointment' as const, data: a }))
      ]
      combined.sort((a, b) => {
        const dateA = parseDate(a.type === 'session' ? String(a.data.appointment_date ?? '') : (a.data as AppointmentRow).appointment_date)?.getTime() ?? 0
        const dateB = parseDate(b.type === 'session' ? String(b.data.appointment_date ?? '') : (b.data as AppointmentRow).appointment_date)?.getTime() ?? 0
        return dateA - dateB
      })

      const billingAmount = Number(billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
      const unitTotal = combined.length > 0 ? billingAmount / combined.length : 0

      return combined.map((row, index) => {
        if (row.type === 'session') {
          const session = row.data
          return {
            key: `session-${session.id ?? index}`,
            itemNo: index + 1,
            treatmentDate: String(session.appointment_date ?? ''),
            serviceName: String(session.service_name ?? '').trim() || '—',
            sessionSequence: `${Number(session.session_sequence ?? index + 1)} / ${session.authTotal}`,
            unitTotal
          }
        } else {
          const appointment = row.data
          return {
            key: `uncovered-${appointment.appointment_id}`,
            itemNo: index + 1,
            treatmentDate: appointment.appointment_date,
            serviceName: fallbackServiceName(appointment),
            sessionSequence: `${index + 1} / ${combined.length}`,
            unitTotal
          }
        }
      })
    }
  }

  if (completedAppointments.value.length) {
    const billingAmount = Number(billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
    const fallbackUnitTotal = completedAppointments.value.length > 0
      ? billingAmount / completedAppointments.value.length
      : 0

    return completedAppointments.value.map((appointment, index) => ({
      key: `completed-${appointment.appointment_id}`,
      itemNo: index + 1,
      treatmentDate: appointment.appointment_date,
      serviceName: fallbackServiceName(appointment),
      sessionSequence: `${index + 1} / ${completedAppointments.value.length}`,
      unitTotal: fallbackUnitTotal
    }))
  }

  return (detail.value?.package_availments ?? []).map((pkg, index) => ({
    key: String(pkg.authorization_id),
    itemNo: index + 1,
    treatmentDate: billingDetail.value?.created_at || "",
    serviceName: pkg.package_name || "—",
    sessionSequence: `${pkg.used_count} / ${pkg.availed_count}`,
      unitTotal: Number(billingDetail.value?.amount_due ?? billing.value.grand_total ?? 0)
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
      lguBillingService.getPatientCreditDetail(selectedPatientId, periodYear, periodMonth),
      patientTanstackService.fetchContext(queryClient, selectedPatientId)
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
  gap: 1px;
}

.profile-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.profile-row--wide-label {
  grid-template-columns: 150px minmax(0, 1fr);
}

.profile-row--list {
  grid-template-columns: 10px minmax(0, 1fr);
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
