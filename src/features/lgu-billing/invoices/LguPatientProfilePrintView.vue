<template>
  <LguInvoiceLayout
    title="PATIENT LGU PROFILE SUMMARY"
    :has-error="!!error"
  >
    <template #meta>
      <strong>BILLING DATE:</strong><span>{{ dateIssued }}</span>
      <strong>TRANSACTION PERIOD:</strong><span>{{ transactionPeriodLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage('landscape')" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-if="!error" #details>
      <div class="profile-details lgu-profile-layout">
        <section class="lgu-profile-clinic-header">
          <div class="lgu-profile-clinic-lines">
            <div class="lgu-profile-clinic-branch-line">
              <strong>{{ branchHeaderLabel }}</strong>
              <span>{{ clinicAddressLabel }}</span>
            </div>

            <div class="lgu-profile-clinic-info-lines">
              <div class="lgu-profile-clinic-info-row">
                <span>Contact No.:</span>
                <strong>{{ clinicContactNumber }}</strong>
              </div>

              <div class="lgu-profile-clinic-info-row">
                <span>Physiotherapist:</span>
                <strong>{{ headerPhysicalTherapistName }}</strong>
              </div>

              <div class="lgu-profile-clinic-info-row">
                <span>License Details:</span>
                <strong>{{ fixedLicenseDetails }}</strong>
              </div>
            </div>
          </div>

          <figure class="lgu-profile-photo">
            <img
              v-if="profileImageUrl"
              :src="profileImageUrl"
              :alt="`${patientName} profile photo`"
            />
            <span v-else>{{ profileInitials }}</span>
          </figure>
        </section>

        <div class="profile-card lgu-profile-info-card">
          <div class="lgu-profile-form-grid">
            <div class="lgu-profile-form-cell lgu-profile-form-cell--name">
              <span>Patient Name:</span>
              <strong>{{ patientName }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--age">
              <span>Age:</span>
              <strong>{{ patientAge }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--gender">
              <span>Gender:</span>
              <strong>{{ patientGender }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--occupation">
              <span>Occupation:</span>
              <strong>{{ patientOccupation }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--date">
              <span>Date of I.E.:</span>
              <strong>{{ initialEvaluationDate }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--service">
              <span>Service Location:</span>
              <strong>{{ serviceLocation }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--address">
              <span>Patient Address:</span>
              <strong>{{ patientAddress }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--cho">
              <span>CHO-GAPAN Referral Code/Diagnosis:</span>
              <strong>{{ choGapanReferralCodeDiagnosis }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--doctor">
              <span>Referring Doctor:</span>
              <strong>{{ doctorName }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--specialization">
              <span>Doctor Specialization:</span>
              <strong>{{ doctorSpecialization }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-profile-form-cell--doctor-diagnosis">
              <span>Referring Doctor's Diagnosis:</span>
              <strong>{{ referringDoctorDiagnosis }}</strong>
            </div>
          </div>
        </div>

        <div class="profile-card lgu-billing-summary-card">
          <div class="lgu-billing-summary-grid">
            <div class="lgu-profile-form-cell lgu-billing-summary-cell--date">
              <span>DATE OF BILLING:</span>
              <strong>{{ billingSummaryDate }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-billing-summary-cell--package">
              <span>PACKAGE CODE</span>
              <strong>{{ billingPackageCode }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-billing-summary-cell--completed">
              <span>SESSIONS COMPLETED</span>
              <strong>{{ sessionsCompletedLabel }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-billing-summary-cell--balance">
              <span>SESSIONS BALANCE</span>
              <strong>{{ sessionsBalanceLabel }}</strong>
            </div>

            <div class="lgu-profile-form-cell lgu-billing-summary-cell--status">
              <span>CASE STATUS</span>
              <strong>{{ caseStatusLabel }}</strong>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="summary-table patient-lgu-profile-summary-table daily-log-style-table">
          <colgroup>
            <col class="col-item-no" />
            <col class="col-time" />
            <col class="col-service" />
            <col class="col-patient-signature" />
            <col class="col-status-session" />
          </colgroup>

          <thead>
            <tr>
              <th class="text-center">No.</th>
              <th class="text-left">Time</th>
              <th class="text-left">Service / Appointment</th>
              <th class="text-center">Patient Signature</th>
              <th class="text-left">Visit Status / Session Sequence</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!signedAppointmentRows.length">
              <td colspan="5" class="empty-row">
                No patient-signed LGU appointment logs found.
              </td>
            </tr>

            <tr v-for="row in signedAppointmentRows" :key="row.key">
              <td class="text-center number-column">
                {{ row.itemNo }}
              </td>

              <td>
                <strong>{{ row.timeRange }}</strong>
                <span>{{ row.dateLabel }}</span>
              </td>

              <td>
                <strong>{{ row.serviceLabel }}</strong>
                <span>{{ row.appointmentRecordId }}</span>
              </td>

              <td class="signature-cell">
                <img class="signature" :src="row.patientSignature" alt="Patient signature" />
              </td>

              <td>
                <strong>{{ row.visitStatus }}</strong>
                <span>{{ row.sessionLabel }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class="approval-wrap lgu-profile-approval-wrap">
        <div class="approval-card">
          <div class="approval-label">Prepared by:</div>
          <div class="approval-name">{{ preparedByName }}</div>
          <div class="approval-line"></div>
          <div class="approval-title">Clinic Admin</div>
        </div>
        <div class="approval-card">
          <div class="approval-label">Approved by:</div>
          <div class="approval-name">RENALOU B. CORDOVA, PTRP, UK-PT</div>
          <div class="approval-line"></div>
          <div class="approval-title">Chief Operations Officer</div>
        </div>
      </div>
    </template>
  </LguInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import {
  appointmentPhase1Service,
  type AppointmentEncounterTicket
} from "@/features/appointments/api/appointment-phase1.service"
import type { BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import {
  lguBillingService,
  type LguPatientAppointmentStatus,
  type LguPatientCreditDetail
} from "@/features/lgu-billing/api/lgu-billing.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import {
  formatLguPatientProgramStatus,
  useLguInvoicePrintActions
} from "./lgu-invoice.shared"
import type { PatientHMOInformation } from "@/models/hmo-information"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import type { Patient } from "@/features/patients/types/patient"
import { pamsAPI } from "@/utils/axios-interceptor"

const NOT_AVAILABLE_LABEL = "N/A"
const branchHeaderLabel = "Gapan Branch: Bayanihan"
const clinicAddressLabel = "Gapan City, Nueva Ecija 3105"
const fixedLicenseDetails = "Lic. No. 0028787"

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useLguInvoicePrintActions()
const authSession = useAuthSessionStore()

const detail = ref<LguPatientCreditDetail | null>(null)
const patient = ref<Patient | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const signedAppointmentRows = ref<SignedAppointmentLogRow[]>([])
const profileImageUrl = ref("")
const error = ref("")

type SignedAppointmentLogRow = {
  key: string
  itemNo: number
  timeRange: string
  dateLabel: string
  serviceLabel: string
  providerName: string
  visitStatus: string
  patientSignature: string
  ptSignature: string
  billingType: string
  billingStatus: string
  sessionLabel: string
  appointmentRecordId: string
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

const patientId = computed(() => {
  const parsed = Number(String(route.query.patient_id ?? "").trim())
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

const formatDate = (value?: string | Date | null): string => {
  const date = parseDate(value)
  return date ? date.toLocaleDateString("en-PH") : NOT_AVAILABLE_LABEL
}

const formatTime = (value?: string | Date | null): string => {
  const date = parseDate(value)

  return date
    ? date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit"
      })
    : NOT_AVAILABLE_LABEL
}

const formatTimeRange = (start?: string | Date | null, end?: string | Date | null): string => {
  const startLabel = formatTime(start)
  const endLabel = formatTime(end)

  if (startLabel === NOT_AVAILABLE_LABEL) return NOT_AVAILABLE_LABEL
  if (endLabel === NOT_AVAILABLE_LABEL) return startLabel
  return `${startLabel} - ${endLabel}`
}

const formatPatientName = (value?: string | null, fallback = "Patient"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const preparedByName = computed(() => formatPatientName(authSession.staffName, "Clinic Admin"))

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

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

const getAppointmentDate = (appointment: LguPatientAppointmentStatus): Date | null => {
  const parsed = new Date(appointment.appointment_date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getRecordValue = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined
  return (record as Record<string, unknown>)[key]
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

const normalizeText = (value?: string | null): string => String(value ?? "").trim().toLowerCase()

const patientName = computed(() =>
  formatPatientName(detail.value?.patient_name || patient.value?.full_name)
)

const transactionFromDate = computed(() =>
  parseDate(String(route.query.transaction_from ?? route.query.transaction_date ?? ""))
)

const transactionToDate = computed(() =>
  parseDate(String(route.query.transaction_to ?? route.query.transaction_date ?? ""))
)

const transactionPeriodEndDate = computed(() =>
  transactionToDate.value ?? transactionFromDate.value ?? null
)

const transactionPeriodLabel = computed(() => {
  const from = transactionFromDate.value
  const to = transactionToDate.value

  if (!from && !to) return NOT_AVAILABLE_LABEL
  if (from && to) return `${formatDate(from)} to ${formatDate(to)}`

  const singleDate = from ?? to
  return singleDate ? formatDate(singleDate) : NOT_AVAILABLE_LABEL
})

const patientAddress = computed(() => {
  const addressFromBilling = String(billingDetail.value?.patient_address ?? "").trim()
  if (addressFromBilling) return addressFromBilling

  const addressParts = [
    patient.value?.baranggay_name,
    patient.value?.city_name,
    patient.value?.province_name,
    patient.value?.region_name
  ]
    .map(part => String(part ?? "").trim())
    .filter(Boolean)

  return addressParts.join(", ") || NOT_AVAILABLE_LABEL
})

const patientAge = computed(() => billingDetail.value?.patient_age || patient.value?.age || NOT_AVAILABLE_LABEL)
const patientGender = computed(() => patient.value?.gender_name || NOT_AVAILABLE_LABEL)
const patientOccupation = computed(() => firstText(patient.value?.occupation, NOT_AVAILABLE_LABEL))
const clinicContactNumber = computed(() => firstText(patient.value?.phone_number, NOT_AVAILABLE_LABEL))
const doctorSpecialization = computed(() => NOT_AVAILABLE_LABEL)
const doctorName = computed(() => formatPatientName(billingDetail.value?.doctor, NOT_AVAILABLE_LABEL))
const diagnosis = computed(() => billingDetail.value?.diagnosis || NOT_AVAILABLE_LABEL)
const referringDoctorDiagnosis = computed(() => diagnosis.value)

const physicalTherapistName = computed(() =>
  formatPatientName(billingDetail.value?.physical_therapist, NOT_AVAILABLE_LABEL)
)

const headerPhysicalTherapistName = computed(() =>
  formatPatientName(
    firstText(physicalTherapistName.value, signedAppointmentRows.value[0]?.providerName),
    "RENALOU B. CORDOVA, PTRP, UK-PT"
  )
)

const lguSponsor = computed(() => sponsorInfo.value)

const referralFormNo = computed(() =>
  billingDetail.value?.lgu_patient_referral_form_no ||
  lguSponsor.value?.referral_form_no ||
  NOT_AVAILABLE_LABEL
)

const dateIssued = computed(() =>
  formatDate(
    billingDetail.value?.lgu_date_issued ||
    lguSponsor.value?.referral_issued_date
  )
)

const choGapanReferralCodeDiagnosis = computed(() =>
  [referralFormNo.value, diagnosis.value]
    .map(value => String(value ?? "").trim())
    .filter(value => value && value !== NOT_AVAILABLE_LABEL)
    .join(" / ") || NOT_AVAILABLE_LABEL
)

const initialEvaluationDate = computed(() => {
  const timestamps = (detail.value?.appointments ?? [])
    .map(appointment => parseDate(appointment.appointment_date))
    .filter((date): date is Date => date !== null)
    .map(date => date.getTime())
    .sort((left, right) => left - right)

  return timestamps.length ? formatDate(new Date(timestamps[0])) : NOT_AVAILABLE_LABEL
})

const serviceLocation = computed(() => firstText(patient.value?.clinic_name, branchHeaderLabel))
const primaryPackageAvailment = computed(() => detail.value?.package_availments?.[0] ?? null)
const primaryAuthorization = computed(() => detail.value?.authorizations?.[0] ?? null)

const billingSummaryDate = computed(() =>
  formatDate(
    billingDetail.value?.created_at ||
    detail.value?.billings?.[0]?.created_at ||
    transactionPeriodEndDate.value
  )
)

const billingPackageCode = computed(() =>
  firstText(
    billingDetail.value?.package_name,
    primaryPackageAvailment.value?.package_name,
    primaryAuthorization.value?.package_name,
    detail.value?.billings?.[0]?.package_name,
    NOT_AVAILABLE_LABEL
  )
)

const totalPackageSessions = computed(() =>
  Math.max(
    Number(primaryAuthorization.value?.total_sessions ?? 0),
    Number(primaryPackageAvailment.value?.availed_count ?? 0),
    Number(billingDetail.value?.total_sessions ?? 0),
    0
  )
)

const completedPackageSessions = computed(() =>
  Math.max(
    Number(primaryAuthorization.value?.consumed_sessions ?? 0),
    Number(primaryPackageAvailment.value?.used_count ?? 0),
    signedAppointmentRows.value.length,
    0
  )
)

const sessionsCompletedLabel = computed(() =>
  totalPackageSessions.value > 0
    ? `${completedPackageSessions.value} of ${totalPackageSessions.value}`
    : String(completedPackageSessions.value || NOT_AVAILABLE_LABEL)
)

const sessionsBalanceLabel = computed(() => {
  const explicitBalance = Number(primaryPackageAvailment.value?.available_balance ?? NaN)
  if (Number.isFinite(explicitBalance) && explicitBalance >= 0) return String(explicitBalance)

  if (totalPackageSessions.value > 0) {
    return String(Math.max(totalPackageSessions.value - completedPackageSessions.value, 0))
  }

  return NOT_AVAILABLE_LABEL
})

const patientProgramStatus = computed(() =>
  formatLguPatientProgramStatus(
    billingDetail.value?.lgu_patient_program_status,
    detail.value?.dropout_status
  )
)

const caseStatusLabel = computed(() =>
  firstText(
    patientProgramStatus.value,
    primaryPackageAvailment.value?.status,
    primaryAuthorization.value?.authorization_status,
    NOT_AVAILABLE_LABEL
  )
)

const profileInitials = computed(() => {
  const names = patientName.value
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)

  return names.length
    ? names.slice(0, 2).map(part => part.charAt(0)).join("")
    : "PA"
})

const dateSigned = computed(() => formatDate(new Date()))

const isWithinTransactionPeriod = (value?: string): boolean => {
  const hasSelectedPeriod = !!transactionFromDate.value || !!transactionToDate.value
  if (!hasSelectedPeriod) return true
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const start = transactionFromDate.value ? toStartOfDay(transactionFromDate.value) : null
  const end = transactionToDate.value ? toEndOfDay(transactionToDate.value) : null

  if (start && date < start) return false
  if (end && date > end) return false

  return true
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

const getPackageAvailmentTotalSessions = (
  packageName: string,
  authorizationKey?: string
): number | null => {
  const matchingPackageAvailment = (detail.value?.package_availments ?? []).find(pkg =>
    recordMatchesPackage(pkg, packageName, authorizationKey)
  )

  if (!matchingPackageAvailment) return null

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
  ]
    .map(value => String(value ?? "").trim())
    .filter(Boolean)

  const hasMatchingKey = !!authorizationKey && possibleKeys.includes(String(authorizationKey))

  const possibleNames = [
    source.package_name,
    source.packageName,
    source.service_name,
    source.serviceName,
    source.name,
    source.description
  ]
    .map(value => normalizeText(String(value ?? "")))
    .filter(Boolean)

  const hasMatchingName = !!normalizedPackageName &&
    possibleNames.some(name =>
      name === normalizedPackageName ||
      name.includes(normalizedPackageName) ||
      normalizedPackageName.includes(name)
    )

  return hasMatchingKey || hasMatchingName
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

  if (explicitTotal) return explicitTotal

  const highestSessionSequence = Math.max(
    0,
    ...(authorization.sessions ?? []).map(session => Number(session.session_sequence ?? 0))
  )

  if (Number.isFinite(highestSessionSequence) && highestSessionSequence > 0) {
    return highestSessionSequence
  }

  return Math.max(1, Number(authorization.sessions?.length ?? 1))
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
        billingId: session.dropout_billing_id ?? session.monthly_billing_id ?? null
      })
    })
  })

  return sources
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

const formatVisitStatus = (value?: string | null): string => {
  const normalized = String(value ?? "").trim().toUpperCase()

  if (["COMPLETED", "ATTENDED", "DONE"].includes(normalized)) return "Completed"
  if (["CANCELLED", "CANCELED", "NO SHOW", "NO_SHOW"].includes(normalized)) return "Cancelled"
  if (normalized.includes("RESCHEDULE")) return "Rescheduled"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"

  return String(value ?? "").trim() || NOT_AVAILABLE_LABEL
}

const releaseProfileImageUrl = (): void => {
  if (profileImageUrl.value) {
    URL.revokeObjectURL(profileImageUrl.value)
  }

  profileImageUrl.value = ""
}

const loadProfileImage = async (): Promise<void> => {
  releaseProfileImageUrl()
  if (!patientId.value) return

  try {
    const response = await pamsAPI.get<Blob>(`/patients/${patientId.value}/profile-image/file?t=${Date.now()}`, {
      responseType: "blob"
    })

    profileImageUrl.value = URL.createObjectURL(response.data)
  } catch {
    profileImageUrl.value = ""
  }
}

const toSignedAppointmentRow = (
  appointment: LguPatientAppointmentStatus,
  ticket: AppointmentEncounterTicket,
  itemNo: number
): SignedAppointmentLogRow => {
  const sessionSource = getSessionSources().get(appointment.appointment_id)
  const snapshot = ticket.billing_snapshot
  const start = firstText(snapshot?.starts_at, ticket.attended_at, appointment.appointment_date)
  const end = firstText(snapshot?.ends_at)
  const sessionSequence = Number(snapshot?.session_sequence ?? sessionSource?.sessionSequence ?? 0)
  const totalSessions = Number(snapshot?.total_sessions ?? sessionSource?.totalSessions ?? 0)
  const sessionLabel = sessionSequence > 0 && totalSessions > 0
    ? `Session ${sessionSequence} of ${totalSessions}`
    : firstText(sessionSource?.sessionSequence ? `Session ${sessionSource.sessionSequence}` : "", appointment.status)

  return {
    key: `${appointment.appointment_id}-${itemNo}`,
    itemNo,
    timeRange: formatTimeRange(start, end),
    dateLabel: formatDate(start),
    serviceLabel: firstText(
      snapshot?.service_name,
      sessionSource?.serviceName,
      getAppointmentPackageName(appointment, sessionSource),
      "LGU Service"
    ),
    providerName: formatPatientName(firstText(snapshot?.provider_name, physicalTherapistName.value), "Unassigned PT"),
    visitStatus: formatVisitStatus(firstText(appointment.status, ticket.attendance_status)),
    patientSignature: String(ticket.patient_signature_data_url ?? "").trim(),
    ptSignature: String(ticket.pt_signature_data_url ?? "").trim(),
    billingType: "LGU Billing",
    billingStatus: firstText(snapshot?.billing_status, billingDetail.value?.billing_status, "Unbilled"),
    sessionLabel,
    appointmentRecordId: firstText(ticket.appointment_public_id, `Appointment #${appointment.appointment_id}`)
  }
}

const loadSignedAppointmentRows = async (): Promise<void> => {
  signedAppointmentRows.value = []

  const appointments = (detail.value?.appointments ?? [])
    .filter(appointment => isWithinTransactionPeriod(appointment.appointment_date))
    .sort((left, right) => {
      const leftDate = getAppointmentDate(left)?.getTime() ?? 0
      const rightDate = getAppointmentDate(right)?.getTime() ?? 0
      return leftDate - rightDate
    })

  const settledTickets = await Promise.allSettled(
    appointments.map(async appointment => ({
      appointment,
      ticket: await appointmentPhase1Service.getEncounterTicket(appointment.appointment_id)
    }))
  )

  signedAppointmentRows.value = settledTickets
    .map(result => result.status === "fulfilled" ? result.value : null)
    .filter((entry): entry is { appointment: LguPatientAppointmentStatus; ticket: AppointmentEncounterTicket } =>
      Boolean(entry?.ticket?.patient_signature_data_url)
    )
    .map((entry, index) => toSignedAppointmentRow(entry.appointment, entry.ticket, index + 1))
}

const load = async (): Promise<void> => {
  error.value = ""
  detail.value = null
  patient.value = null
  sponsorInfo.value = null
  billingDetail.value = null
  signedAppointmentRows.value = []

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
      authSession.ensureLoaded().catch(() => undefined),
      lguBillingService.getPatientCreditDetail(patientId.value, periodYear, periodMonth),
      patientTanstackService.fetchContext(queryClient, patientId.value)
    ]).then(([, detailResult, sponsorResult]) => [detailResult, sponsorResult] as const)

    detail.value = detailResult ?? null
    patient.value = sponsorResult?.patient ?? null
    sponsorInfo.value =
      (sponsorResult?.sponsor_information ?? []).find(item => item.sponsor_context === "LGU") ?? null

    const latestBilling = detail.value?.billings?.[0]

    if (latestBilling?.id) {
      billingDetail.value =
        (await billingContextTanstackService.fetchContext(queryClient, latestBilling.id))?.billing ?? null
    }

    await Promise.all([
      loadProfileImage(),
      loadSignedAppointmentRows()
    ])
  } catch (err: unknown) {
    error.value = err instanceof Error
      ? err.message
      : "Failed to load patient LGU profile."
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => printPage("landscape"), 50)
    }
  })
})

onBeforeUnmount(() => {
  releaseProfileImageUrl()
})
</script>

<style scoped>
@media screen {
  .table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }

  .patient-lgu-profile-summary-table {
    width: 100%;
    min-width: 0;
  }
}

.lgu-profile-clinic-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 12px;
  align-items: stretch;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--lgu-border);
  border-left: 3px solid var(--lgu-accent);
  background: #ffffff;
  color: #111827;
  font-size: 12px;
  line-height: 1.35;
}

.lgu-profile-clinic-lines {
  display: grid;
  gap: 6px;
  min-width: 0;
  align-content: center;
}

.lgu-profile-clinic-branch-line {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
  line-height: 1.2;
}

.lgu-profile-clinic-branch-line strong {
  flex: 0 0 auto;
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.lgu-profile-clinic-branch-line span {
  min-width: 0;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.lgu-profile-clinic-info-lines {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.lgu-profile-clinic-info-row {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.lgu-profile-clinic-info-row span {
  color: #374151;
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.lgu-profile-clinic-info-row strong {
  min-width: 0;
  color: #111827;
  font-size: 11px;
  font-weight: 700;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.lgu-profile-info-card,
.lgu-billing-summary-card {
  padding: 0;
}

.lgu-profile-form-grid,
.lgu-billing-summary-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  border-top: 1px solid var(--lgu-border);
  border-left: 1px solid var(--lgu-border);
  background: #ffffff;
}

.lgu-profile-form-cell {
  min-width: 0;
  min-height: 42px;
  padding: 5px 6px;
  border-right: 1px solid var(--lgu-border);
  border-bottom: 1px solid var(--lgu-border);
  font-size: 11px;
  line-height: 1.25;
}

.lgu-profile-form-cell span {
  display: block;
  margin-bottom: 2px;
  color: #111827;
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-weight: 800;
}

.lgu-profile-form-cell strong {
  display: block;
  min-width: 0;
  color: #111827;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.lgu-billing-summary-grid .lgu-profile-form-cell span {
  color: var(--lgu-accent);
}

.lgu-profile-form-cell--name,
.lgu-profile-form-cell--doctor,
.lgu-profile-form-cell--occupation,
.lgu-profile-form-cell--date,
.lgu-billing-summary-cell--date,
.lgu-billing-summary-cell--package {
  grid-column: span 3;
}

.lgu-profile-form-cell--age {
  grid-column: span 1;
}

.lgu-profile-form-cell--gender,
.lgu-profile-form-cell--service,
.lgu-billing-summary-cell--completed,
.lgu-billing-summary-cell--balance,
.lgu-billing-summary-cell--status {
  grid-column: span 2;
}

.lgu-profile-form-cell--address,
.lgu-profile-form-cell--specialization {
  grid-column: span 4;
}

.lgu-profile-form-cell--cho {
  grid-column: span 6;
}

.lgu-profile-form-cell--doctor-diagnosis {
  grid-column: span 5;
}

.lgu-profile-photo {
  display: flex;
  width: 112px;
  height: 132px;
  margin: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--lgu-accent);
  background: #f8fafc;
  color: var(--lgu-accent);
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-size: 30px;
  font-weight: 800;
  text-transform: uppercase;
}

.lgu-profile-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.patient-lgu-profile-summary-table .col-item-no {
  width: 5%;
}

.patient-lgu-profile-summary-table .col-time {
  width: 18%;
}

.patient-lgu-profile-summary-table .col-service {
  width: 37%;
}

.patient-lgu-profile-summary-table .col-patient-signature {
  width: 20%;
}

.patient-lgu-profile-summary-table .col-status-session {
  width: 20%;
}

.daily-log-style-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  font-size: 9px;
}

.daily-log-style-table th,
.daily-log-style-table td {
  padding: 4px 5px;
  overflow-wrap: anywhere;
  vertical-align: top;
}

.daily-log-style-table td span {
  display: block;
  margin-top: 2px;
  color: #374151;
  font-size: 8px;
}

.daily-log-style-table .number-column {
  width: 24px !important;
  min-width: 24px !important;
  max-width: 24px !important;
  padding-right: 2px !important;
  padding-left: 2px !important;
  white-space: nowrap;
}

.signature-cell {
  text-align: center;
  vertical-align: middle !important;
}

.signature {
  display: block;
  width: 108px;
  height: 44px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #ffffff;
  object-fit: contain;
}

.empty-row {
  padding: 14px 10px;
  color: #6b7280;
  font-style: italic;
  text-align: center;
}

.lgu-profile-approval-wrap {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  align-items: start;
  justify-content: stretch;
  margin-top: 18px;
}

.lgu-profile-approval-wrap .approval-card {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  align-items: stretch !important;
  text-align: center;
}

.lgu-profile-approval-wrap .approval-label {
  margin-bottom: 8px;
  color: #111827;
  font-size: 12px;
  font-style: italic;
  font-weight: 700;
  text-align: left;
}

.lgu-profile-approval-wrap .approval-name {
  min-height: 18px;
  color: #111827;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.lgu-profile-approval-wrap .approval-line {
  width: 100%;
  margin: 2px 0 3px;
  border-bottom: 1px solid #111827;
}

.lgu-profile-approval-wrap .approval-title {
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

@media print {
  .lgu-profile-clinic-header {
    grid-template-columns: minmax(0, 1fr) 82px !important;
    gap: 6px !important;
    padding: 5px 6px !important;
    border-left-width: 2px !important;
    font-size: 8px !important;
    line-height: 1.18 !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .lgu-profile-clinic-lines {
    gap: 3px !important;
  }

  .lgu-profile-clinic-branch-line {
    gap: 6px !important;
    padding-bottom: 2px !important;
    line-height: 1.1 !important;
  }

  .lgu-profile-clinic-branch-line strong {
    font-size: 7.5px !important;
    letter-spacing: 0 !important;
  }

  .lgu-profile-clinic-branch-line span {
    font-size: 6.8px !important;
  }

  .lgu-profile-clinic-info-lines {
    gap: 1px !important;
  }

  .lgu-profile-clinic-info-row {
    grid-template-columns: 76px minmax(0, 1fr) !important;
    gap: 4px !important;
  }

  .lgu-profile-clinic-info-row span {
    font-size: 5.8px !important;
    letter-spacing: 0.01em !important;
  }

  .lgu-profile-clinic-info-row strong {
    font-size: 6.8px !important;
    line-height: 1.1 !important;
  }

  .lgu-profile-form-cell {
    min-height: 28px !important;
    padding: 3px 4px !important;
    font-size: 7px !important;
    line-height: 1.12 !important;
  }

  .lgu-profile-form-cell span {
    margin-bottom: 1px !important;
  }

  .lgu-profile-photo {
    width: 82px !important;
    height: 98px !important;
    border-width: 1px !important;
    font-size: 22px !important;
  }

  .table-wrap {
    width: 100% !important;
    max-width: 100% !important;
    overflow: visible !important;
  }

  .daily-log-style-table {
    width: 100% !important;
    min-width: 0 !important;
    table-layout: fixed !important;
    font-size: 7px !important;
  }

  .daily-log-style-table th,
  .daily-log-style-table td {
    padding: 2px 3px !important;
    line-height: 1.12 !important;
  }

  .daily-log-style-table td span {
    font-size: 6.5px !important;
  }

  .daily-log-style-table .number-column {
    width: 18px !important;
    min-width: 18px !important;
    max-width: 18px !important;
    padding-right: 1px !important;
    padding-left: 1px !important;
  }

  .signature {
    width: 100% !important;
    max-width: 86px !important;
    height: 34px !important;
  }

  .lgu-profile-approval-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 24px !important;
    margin-top: 10px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .lgu-profile-approval-wrap .approval-card {
    width: 100% !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
  }

  .lgu-profile-approval-wrap .approval-label,
  .lgu-profile-approval-wrap .approval-name,
  .lgu-profile-approval-wrap .approval-title {
    font-size: 8px !important;
  }

  .lgu-profile-approval-wrap .approval-label {
    margin-bottom: 5px !important;
  }

  .lgu-profile-approval-wrap .approval-name {
    min-height: 12px !important;
  }

  .lgu-profile-approval-wrap .approval-line {
    width: 100% !important;
    margin: 1px 0 2px !important;
  }
}
</style>
