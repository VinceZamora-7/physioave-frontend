<template>
  <LguInvoiceLayout
    title="PATIENT LGU Profile Summary"
    :subtitle="`PATIENT LGU Profile Summary for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>BILLING DATE:</strong><span>{{ dateIssued }}</span>
      <strong>TRANSACTION PERIOD:</strong><span>{{ transactionPeriodLabel }}</span>
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
        <div class="profile-status-banner">
          <span class="profile-status-label">STATUS:</span>
          <span class="profile-status-value">{{ profileStatusHeading }}</span>
        </div>

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

        <div class="profile-card">
          <div class="profile-section-title">LGU Details</div>

          <div class="profile-list">
            <div class="profile-row profile-row--list">
              <span class="profile-label">Billing To:</span>
              <span class="profile-value">{{ billingTo }}</span>
            </div>

            <div class="profile-row profile-row--list">
              <span class="profile-label">Program Status:</span>
              <span class="profile-value">{{ patientProgramStatus }}</span>
            </div>

            <div class="profile-row profile-row--list">
              <span class="profile-label">Referral Form No:</span>
              <span class="profile-value">{{ referralFormNo }}</span>
            </div>

            <div class="profile-row profile-row--list">
              <span class="profile-label">Date Issued:</span>
              <span class="profile-value">{{ dateIssued }}</span>
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
              <th class="w-[80px] text-center">ITEM No.</th>
              <th class="w-[220px] text-center">TREATMENT DATE</th>
              <th class="text-left">PACKAGE NAME</th>
              <th class="w-[150px] text-center">SESSION Completed</th>
              <th class="w-[180px] text-right">OVERALL PRICE</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in invoiceRows" :key="row.key">
              <td class="text-center">
                {{ row.itemNo }}
              </td>

              <td class="text-center">
                {{ row.treatmentDate }}
              </td>

              <td class="text-left">
                {{ row.packageName }}
              </td>

              <td class="text-center">
                {{ row.sessionSequence || '—' }}
              </td>

              <td class="text-right">
                {{ row.overallPrice > 0 ? formatCurrency(row.overallPrice) : 'FREE' }}
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="4" class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                Grand Total:
              </td>
              <td class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                {{ formatCurrency(invoiceGrandTotal) }}
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
import Button from "primevue/button"
import { lguBillingService, type LguPatientAppointmentStatus, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  formatLguPatientProgramStatus,
  resolveLguPatientProgramStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import { patientHMOInformationService } from "@/services/patient-hmo-information.service"
import type { PatientHMOInformation } from "@/models/hmo-information"

const dateSigned = computed(() => formatDate(new Date()))
const route = useRoute()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const error = ref("")

const patientId = computed(() => {
  const raw = String(route.query.patient_id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const parseRouteDate = (value: unknown): Date | null => {
  const raw = String(value ?? "").trim()
  if (!raw) return null

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const patientName = computed(() => detail.value?.patient_name || "Patient")
const lguSponsor = computed(() => sponsorInfo.value)

const lguProgramLabel = computed(() =>
  lguSponsor.value?.lgu_program_name ||
  lguSponsor.value?.company_name ||
  "LGU"
)

const transactionFromDate = computed(() =>
  parseRouteDate(route.query.transaction_from ?? route.query.transaction_date)
)

const transactionToDate = computed(() =>
  parseRouteDate(route.query.transaction_to ?? route.query.transaction_date)
)

const transactionPeriodEndDate = computed(() =>
  transactionToDate.value ?? transactionFromDate.value ?? null
)

const transactionPeriodLabel = computed(() => {
  const from = transactionFromDate.value
  const to = transactionToDate.value

  if (!from && !to) return "N/A"
  if (from && to) return `${formatDate(from)} to ${formatDate(to)}`

  const singleDate = from ?? to
  return singleDate ? formatDate(singleDate) : "N/A"
})

const patientAddress = computed(() => billingDetail.value?.patient_address || "N/A")
const patientAge = computed(() => billingDetail.value?.patient_age || "N/A")
const physicalTherapistName = computed(() => billingDetail.value?.physical_therapist || "N/A")
const doctorName = computed(() => billingDetail.value?.doctor || "N/A")
const diagnosis = computed(() => billingDetail.value?.diagnosis || "N/A")

const billingTo = computed(() =>
  billingDetail.value?.lgu_program_name ||
  lguSponsor.value?.company_name ||
  lguProgramLabel.value
)

const patientProgramStatus = computed(() =>
  formatLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )
)

const profileStatusHeading = computed(() => {
  const normalized = resolveLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )

  if (normalized === "COMPLETED") return "Completed"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  return "Active"
})

const referralFormNo = computed(() =>
  billingDetail.value?.lgu_reference_label ||
  lguSponsor.value?.referral_form_no ||
  "N/A"
)

const dateIssued = computed(() =>
  formatDateTime(
    billingDetail.value?.lgu_date_issued ||
    lguSponsor.value?.referral_issued_date
  )
)

type TableRow = {
  key: string
  itemNo: number
  treatmentDate: string
  packageName: string
  sessionSequence: string
  overallPrice: number
}

const normalizeText = (value?: string | null): string => String(value ?? "").trim().toLowerCase()

const toStartOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const toEndOfDay = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

const isWithinTransactionPeriod = (value?: string): boolean => {
  const hasSelectedPeriod = !!transactionFromDate.value || !!transactionToDate.value

  if (!hasSelectedPeriod) {
    return true
  }

  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const start = transactionFromDate.value
    ? toStartOfDay(transactionFromDate.value)
    : null

  const end = transactionToDate.value
    ? toEndOfDay(transactionToDate.value)
    : null

  if (start && date < start) {
    return false
  }

  if (end && date > end) {
    return false
  }

  return true
}

type SessionSource = {
  appointmentId: number
  authorizationKey: string
  sessionSequence: number
  totalSessions: number
  packageName: string
  serviceName: string
  billingId: number | null
}

type CompletedAppointmentEntry = {
  appointmentId: number
  appointmentDate: string
}

type SessionGroup = {
  key: string
  packageName: string
  completedAppointmentIds: Set<number>
  completedAppointments: CompletedAppointmentEntry[]
  totalSessions: number
  sessions: SessionSource[]
}

const getAppointmentDate = (appointment: LguPatientAppointmentStatus): Date | null => {
  const parsed = new Date(appointment.appointment_date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getPositiveInteger = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = Math.floor(Number(value))

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

const getRecordValue = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined
  return (record as Record<string, unknown>)[key]
}

const getRecordNumber = (record: unknown, keys: string[]): number | null => {
  for (const key of keys) {
    const value = getRecordValue(record, key)
    const parsed = Number(value)

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

const parseBillingLineItems = (lineItemsJson?: string | null): Array<Record<string, unknown>> => {
  if (!lineItemsJson) return []

  try {
    const parsed = JSON.parse(lineItemsJson) as unknown

    return Array.isArray(parsed)
      ? parsed.filter(item => item && typeof item === "object") as Array<Record<string, unknown>>
      : []
  } catch {
    return []
  }
}

const getAmountFromRecord = (record: unknown): number => {
  return getRecordNumber(record, [
    "amount_due",
    "amountDue",
    "total_amount",
    "totalAmount",
    "grand_total",
    "grandTotal",
    "net_amount",
    "netAmount",
    "subtotal",
    "total",
    "price",
    "unit_price",
    "unitPrice",
    "package_price",
    "packagePrice",
    "package_total",
    "packageTotal",
    "overall_price",
    "overallPrice"
  ]) ?? 0
}

const getAuthorizationKey = (
  authorization: LguPatientCreditDetail["authorizations"][number],
  authorizationIndex: number
): string => {
  const authorizationRecord = authorization as typeof authorization & {
    id?: number | string
    authorization_id?: number | string
    public_id?: number | string
  }

  return String(
    authorizationRecord.authorization_id ??
    authorizationRecord.id ??
    authorizationRecord.public_id ??
    `${authorization.package_name || "authorization"}-${authorizationIndex + 1}`
  )
}

const recordMatchesPackage = (
  record: unknown,
  packageName: string,
  authorizationKey?: string
): boolean => {
  const normalizedPackageName = normalizeText(packageName)
  const source = (record ?? {}) as Record<string, unknown>

  const possibleKeys = [
    source.authorization_id,
    source.authorizationId,
    source.id,
    source.public_id,
    source.publicId,
    source.package_id,
    source.packageId,
    source.service_id,
    source.serviceId
  ].map(value => String(value ?? "").trim()).filter(Boolean)

  const hasMatchingKey = !!authorizationKey && possibleKeys.includes(String(authorizationKey))

  const possibleNames = [
    source.package_name,
    source.packageName,
    source.service_name,
    source.serviceName,
    source.name,
    source.description
  ].map(value => normalizeText(String(value ?? ""))).filter(Boolean)

  const hasMatchingName = possibleNames.some(name => {
    return (
      name === normalizedPackageName ||
      name.includes(normalizedPackageName) ||
      normalizedPackageName.includes(name)
    )
  })

  return hasMatchingKey || hasMatchingName
}

const getPackageAvailmentTotalSessions = (
  packageName: string,
  authorizationKey?: string
): number | null => {
  const matchingPackageAvailment = (detail.value?.package_availments ?? []).find(pkg => {
    return recordMatchesPackage(pkg, packageName, authorizationKey)
  })

  if (!matchingPackageAvailment) {
    return null
  }

  return getPositiveInteger(
    getRecordValue(matchingPackageAvailment, "total_appointments"),
    getRecordValue(matchingPackageAvailment, "totalAppointments"),
    getRecordValue(matchingPackageAvailment, "appointment_count"),
    getRecordValue(matchingPackageAvailment, "appointmentCount"),
    getRecordValue(matchingPackageAvailment, "total_sessions"),
    getRecordValue(matchingPackageAvailment, "totalSessions"),
    getRecordValue(matchingPackageAvailment, "availed_count"),
    getRecordValue(matchingPackageAvailment, "availedCount"),
    getRecordValue(matchingPackageAvailment, "quantity"),
    getRecordValue(matchingPackageAvailment, "session_count"),
    getRecordValue(matchingPackageAvailment, "sessionCount"),
    getRecordValue(matchingPackageAvailment, "package_session_count"),
    getRecordValue(matchingPackageAvailment, "packageSessionCount"),
    getRecordValue(matchingPackageAvailment, "total_package_sessions"),
    getRecordValue(matchingPackageAvailment, "totalPackageSessions")
  )
}

const getPackageAvailmentAmount = (
  packageName: string,
  authorizationKey?: string
): number => {
  const matchingPackageAvailment = (detail.value?.package_availments ?? []).find(pkg => {
    return recordMatchesPackage(pkg, packageName, authorizationKey)
  })

  return getAmountFromRecord(matchingPackageAvailment)
}

const getPackagePriceFromBillingRecord = (
  record: unknown,
  packageName: string,
  authorizationKey?: string
): number => {
  if (!record) return 0

  const lineItemsJson = String(getRecordValue(record, "line_items_json") ?? getRecordValue(record, "lineItemsJson") ?? "").trim()
  const lineItems = parseBillingLineItems(lineItemsJson)

  const packageLine = lineItems.find(item => {
    return String(item?.type ?? "").trim().toLowerCase() === "package" && recordMatchesPackage(item, packageName, authorizationKey)
  })

  if (!packageLine) return 0

  const quantity = Math.max(
    1,
    Number(getRecordValue(packageLine, "quantity") ?? 1)
  )
  const unitPrice = getPositiveInteger(
    getRecordValue(packageLine, "priceOverride"),
    getRecordValue(packageLine, "price")
  )

  if (unitPrice) {
    return unitPrice * quantity
  }

  return getAmountFromRecord(packageLine)
}

const getAuthorizationTotalSessions = (
  authorization: LguPatientCreditDetail["authorizations"][number],
  authorizationKey: string
): number => {
  const packageAvailmentTotal = getPackageAvailmentTotalSessions(
    authorization.package_name || "",
    authorizationKey
  )

  const explicitTotal = getPositiveInteger(
    getRecordValue(authorization, "total_appointments"),
    getRecordValue(authorization, "totalAppointments"),
    getRecordValue(authorization, "appointment_count"),
    getRecordValue(authorization, "appointmentCount"),
    authorization.total_sessions,
    packageAvailmentTotal,
    getRecordValue(authorization, "totalSessions"),
    getRecordValue(authorization, "availed_count"),
    getRecordValue(authorization, "availedCount"),
    getRecordValue(authorization, "quantity"),
    getRecordValue(authorization, "session_count"),
    getRecordValue(authorization, "sessionCount"),
    getRecordValue(authorization, "package_session_count"),
    getRecordValue(authorization, "packageSessionCount"),
    getRecordValue(authorization, "total_package_sessions"),
    getRecordValue(authorization, "totalPackageSessions")
  )

  if (explicitTotal) {
    return explicitTotal
  }

  const highestSessionSequence = Math.max(
    0,
    ...(authorization.sessions ?? []).map(session => Number(session.session_sequence ?? 0))
  )

  if (Number.isFinite(highestSessionSequence) && highestSessionSequence > 0) {
    return highestSessionSequence
  }

  return Math.max(1, Number(authorization.sessions?.length ?? 1))
}

const getTotalSessionsForPackage = (
  packageName: string,
  authorizationKey?: string
): number => {
  const packageAvailmentTotal = getPackageAvailmentTotalSessions(packageName, authorizationKey)

  if (packageAvailmentTotal) {
    return packageAvailmentTotal
  }

  const matchingAuthorization = (detail.value?.authorizations ?? []).find((authorization, authorizationIndex) => {
    const currentAuthorizationKey = getAuthorizationKey(authorization, authorizationIndex)
    const hasMatchingKey = !!authorizationKey && currentAuthorizationKey === String(authorizationKey)
    const hasMatchingPackage = recordMatchesPackage(authorization, packageName, authorizationKey)
    const hasMatchingSessionService = (authorization.sessions ?? []).some(session => {
      return recordMatchesPackage(session, packageName, authorizationKey)
    })

    return hasMatchingKey || hasMatchingPackage || hasMatchingSessionService
  })

  if (matchingAuthorization) {
    const matchingAuthorizationIndex = (detail.value?.authorizations ?? []).indexOf(matchingAuthorization)
    const matchingAuthorizationKey = getAuthorizationKey(matchingAuthorization, matchingAuthorizationIndex)

    return Math.max(
      getAuthorizationTotalSessions(matchingAuthorization, matchingAuthorizationKey),
      1
    )
  }

  return 1
}

const getSessionSources = (): Map<number, SessionSource> => {
  const sources = new Map<number, SessionSource>()

  ;(detail.value?.authorizations ?? []).forEach((authorization, authorizationIndex) => {
    const authorizationKey = getAuthorizationKey(authorization, authorizationIndex)
    const totalSessions = getAuthorizationTotalSessions(authorization, authorizationKey)

    ;(authorization.sessions ?? []).forEach(session => {
      if (sources.has(session.appointment_id)) return

      sources.set(session.appointment_id, {
        appointmentId: session.appointment_id,
        authorizationKey,
        sessionSequence: Math.max(1, Number(session.session_sequence ?? 1)),
        totalSessions,
        packageName: authorization.package_name || session.service_name || "—",
        serviceName: session.service_name || authorization.package_name || "—",
        billingId: session.monthly_billing_id ?? session.dropout_billing_id ?? null
      })
    })
  })

  return sources
}

const getBillingAmountForGroup = (
  group: SessionGroup
): number => {
  const billingIds = Array.from(
    new Set(
      group.sessions
        .map(session => session.billingId)
        .filter((id): id is number => typeof id === "number" && id > 0)
    )
  )

  if (billingIds.length) {
    const billingTotal = billingIds.reduce((sum, billingId) => {
      const billing = (detail.value?.billings ?? []).find(item => item.id === billingId)
      return sum + getAmountFromRecord(billing)
    }, 0)

    if (billingTotal > 0) {
      return billingTotal
    }
  }

  const billingCandidates = (detail.value?.billings ?? []).filter(item => {
    return recordMatchesPackage(item, group.packageName, group.key)
  })

  const preferredBilling =
    billingCandidates.find(item => {
      const billingStatus = String(getRecordValue(item, "billing_status") ?? "").trim().toUpperCase()
      const amountDue = getAmountFromRecord(item)
      return amountDue > 0 && ["COMPLETED", "BILLED", "PAID", "POSTED"].includes(billingStatus)
    }) ??
    billingCandidates.find(item => getAmountFromRecord(item) > 0) ??
    billingCandidates[0]

  const billingAmount = getAmountFromRecord(preferredBilling)

  if (billingAmount > 0) {
    return billingAmount
  }

  const packageLineAmount =
    getPackagePriceFromBillingRecord(preferredBilling, group.packageName, group.key) ||
    billingCandidates
      .map(item => getPackagePriceFromBillingRecord(item, group.packageName, group.key))
      .find(amount => amount > 0) ||
    getPackagePriceFromBillingRecord(billingDetail.value, group.packageName, group.key)

  if (packageLineAmount > 0) {
    return packageLineAmount
  }

  if ((detail.value?.billings ?? []).length === 1) {
    const onlyBillingAmount = getAmountFromRecord(detail.value?.billings?.[0])

    if (onlyBillingAmount > 0) {
      return onlyBillingAmount
    }
  }

  const packageAmount = getPackageAvailmentAmount(group.packageName, group.key)

  if (packageAmount > 0) {
    return packageAmount
  }

  const billingDetailAmount = getAmountFromRecord(billingDetail.value)

  if (billingDetailAmount > 0 && invoiceRows.value.length <= 1) {
    return billingDetailAmount
  }

  return 0
}

const getAppointmentPackageName = (
  appointment: LguPatientAppointmentStatus,
  sessionSource?: SessionSource
): string =>
  String(
    sessionSource?.packageName ||
    appointment.package_name ||
    appointment.availed_services?.[0] ||
    ""
  ).trim() || "—"

const getAppointmentGroupKey = (
  appointment: LguPatientAppointmentStatus,
  packageName: string,
  sessionSource?: SessionSource
): string =>
  sessionSource?.authorizationKey ||
  normalizeText(packageName) ||
  `appointment-${appointment.appointment_id}`

const formatCompletedTreatmentDate = (completedAppointments: CompletedAppointmentEntry[]): string => {
  const timestamps = completedAppointments
    .map(entry => new Date(entry.appointmentDate))
    .filter(date => !Number.isNaN(date.getTime()))
    .map(date => date.getTime())
    .sort((left, right) => left - right)

  if (!timestamps.length) {
    return "N/A"
  }

  const firstDate = new Date(timestamps[0])
  const lastDate = new Date(timestamps[timestamps.length - 1])

  if (formatDate(firstDate) === formatDate(lastDate)) {
    return formatDate(firstDate)
  }

  return `${formatDate(firstDate)} to ${formatDate(lastDate)}`
}

const invoiceRows = computed<TableRow[]>(() => {
  const sessionSources = getSessionSources()
  const groups = new Map<string, SessionGroup>()
  const allAppointmentIdsByGroupKey = new Map<string, Set<number>>()

  /*
    Denominator: all appointments for the package/authorization.
    This is intentionally not filtered by selected month and not filtered by COMPLETED status.
  */
  ;(detail.value?.appointments ?? []).forEach(appointment => {
    const sessionSource = sessionSources.get(appointment.appointment_id)
    const packageName = getAppointmentPackageName(appointment, sessionSource)
    const groupKey = getAppointmentGroupKey(appointment, packageName, sessionSource)

    if (!allAppointmentIdsByGroupKey.has(groupKey)) {
      allAppointmentIdsByGroupKey.set(groupKey, new Set<number>())
    }

    allAppointmentIdsByGroupKey.get(groupKey)?.add(appointment.appointment_id)
  })

  /*
    Numerator: only completed appointments inside the selected transaction period.
  */
  ;(detail.value?.appointments ?? [])
    .filter(appointment => String(appointment.status ?? "").trim().toUpperCase() === "COMPLETED")
    .filter(appointment => isWithinTransactionPeriod(appointment.appointment_date))
    .sort((left, right) => {
      const leftDate = getAppointmentDate(left)?.getTime() ?? 0
      const rightDate = getAppointmentDate(right)?.getTime() ?? 0
      return leftDate - rightDate
    })
    .forEach(appointment => {
      const sessionSource = sessionSources.get(appointment.appointment_id)
      const packageName = getAppointmentPackageName(appointment, sessionSource)
      const groupKey = getAppointmentGroupKey(appointment, packageName, sessionSource)
      const allAppointmentCount = allAppointmentIdsByGroupKey.get(groupKey)?.size ?? 0
      const configuredTotalSessions = getTotalSessionsForPackage(
        packageName,
        sessionSource?.authorizationKey || groupKey
      )

      const existingGroup = groups.get(groupKey)

      if (existingGroup) {
        existingGroup.completedAppointmentIds.add(appointment.appointment_id)
        existingGroup.completedAppointments.push({
          appointmentId: appointment.appointment_id,
          appointmentDate: appointment.appointment_date
        })
        existingGroup.totalSessions = Math.max(
          existingGroup.totalSessions,
          allAppointmentCount,
          sessionSource?.totalSessions ?? 1,
          configuredTotalSessions,
          existingGroup.completedAppointmentIds.size
        )

        if (sessionSource) {
          existingGroup.sessions.push(sessionSource)
        }

        return
      }

      groups.set(groupKey, {
        key: groupKey,
        packageName,
        completedAppointmentIds: new Set([appointment.appointment_id]),
        completedAppointments: [{
          appointmentId: appointment.appointment_id,
          appointmentDate: appointment.appointment_date
        }],
        totalSessions: Math.max(
          allAppointmentCount,
          sessionSource?.totalSessions ?? 1,
          configuredTotalSessions,
          1
        ),
        sessions: sessionSource ? [sessionSource] : []
      })
    })

  return Array.from(groups.values()).map((group, index) => {
    const completedSessions = group.completedAppointmentIds.size
    const totalSessions = Math.max(
      group.totalSessions,
      allAppointmentIdsByGroupKey.get(group.key)?.size ?? 0,
      getTotalSessionsForPackage(group.packageName, group.key),
      completedSessions
    )

    return {
      key: group.key,
      itemNo: index + 1,
      treatmentDate: formatCompletedTreatmentDate(group.completedAppointments),
      packageName: group.packageName,
      sessionSequence: `${completedSessions} of ${totalSessions}`,
      overallPrice: getBillingAmountForGroup(group, completedSessions, totalSessions)
    }
  })
})

const invoiceGrandTotal = computed(() =>
  invoiceRows.value.reduce((sum, row) => {
    return sum + Number(row.overallPrice ?? 0)
  }, 0)
)

const formatCurrency = (value?: number | null): string =>
  value === null || value === undefined
    ? ""
    : Number(value).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
      })

const formatDateTime = (value?: string | null): string => {
  if (!value) return "N/A"

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-PH")
}

const formatDate = (value?: string | Date | null): string => {
  if (!value) return "N/A"

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-PH")
}

const load = async (): Promise<void> => {
  error.value = ""
  detail.value = null
  sponsorInfo.value = null
  billingDetail.value = null

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const periodYear = transactionPeriodEndDate.value?.getFullYear()
    const periodMonth = transactionPeriodEndDate.value
      ? transactionPeriodEndDate.value.getMonth() + 1
      : undefined

    const [detailResult, sponsorResult] = await Promise.all([
      lguBillingService.getPatientCreditDetail(patientId.value, periodYear, periodMonth),
      patientHMOInformationService.getByPatientId(patientId.value)
    ])

    detail.value = detailResult ?? null

    sponsorInfo.value =
      (sponsorResult ?? []).find(item => item.sponsor_context === "LGU") ?? null

    const latestBilling = detail.value?.billings?.[0]

    if (latestBilling?.id) {
      billingDetail.value =
        await billingPhase1Service.getById(latestBilling.id) ?? null
    }
  } catch (err: unknown) {
    error.value =
      err instanceof Error
        ? err.message
        : "Failed to load patient LGU profile."
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => window.print(), 50)
    }
  })
})
</script>

<style>
.line {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px;
}

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
  padding: 14px 16px;
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
  gap: 8px;
}

.profile-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.profile-row--wide-label {
  grid-template-columns: 150px minmax(0, 1fr);
}

.profile-row--list {
  grid-template-columns: 150px minmax(0, 1fr);
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

.ticket-footer-wrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.footnote-full {
  grid-column: 1 / -1;
}

.footnote-panel {
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: #fff;
  padding: 12px;
}

.ticket-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #1d4ed8;
  margin-bottom: 4px;
}

.footnote-copy {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
}
</style>
