import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"
import type { AxiosRequestConfig, AxiosResponse } from "axios"

export type AppointmentPhase = "EVAL" | "SESSION" | "RE_EVAL"
export type AppointmentLocationContext = "IN_CLINIC" | "HOME_CARE"
export type AppointmentAttendanceStatus = "ATTENDED" | "NO_SHOW"
export type AppointmentDailyLogSignatureState = "PENDING" | "PATIENT_SIGNED" | "PT_SIGNED" | "FULLY_SIGNED" | "NO_SHOW"
export type AppointmentBillingType =
  | "SELF_PAY_SINGLE"
  | "SELF_PAY_PACKAGE"
  | "HMO_BILLING"
  | "LGU_BILLING"
export type AppointmentServiceType = "SINGLE" | "PACKAGE" | "HMO" | "LGU"
export type AppointmentSponsorType = "HMO" | "LGU"
export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface AppointmentListItem {
  id: number
  public_id?: string
  patient_id: number
  patient_public_id?: string
  patient_name: string
  clinic_id: number
  clinic_name: string
  specialty_tag_id?: number
  specialty_tag_name?: string
  specialty_tag_is_active?: boolean
  treatment_area_id?: number
  treatment_area_name?: string
  treatment_area_color?: string
  treatment_area_is_active?: boolean
  location_context: AppointmentLocationContext
  doctor_id?: number
  doctor_name?: string
  referring_doctor_id?: number
  referring_doctor_name?: string
  support_staff_id?: number
  support_staff_name?: string
  starts_at: string
  ends_at: string
  appointment_phase: AppointmentPhase
  appointment_status: string
  billing_type?: string
  hmo_loa_number?: string
  hmo_loa_date?: string
  service_type?: string
  billing_status: string
  billing_id?: number
  billing_public_id?: string
  reschedule_flag: boolean
  reschedule_count: number
  dropout_status?: string
}

export interface AppointmentCheckoutSummary {
  patient_wallet: {
    amount_to_collect: number
  }
  sponsor_wallet?: {
    sponsor_type: AppointmentSponsorType
    sponsor_name: string
    authorization_status: "AUTHORIZED"
    consumed_sessions?: number
    total_sessions?: number
    display_text: string
  }
}

export interface AppointmentBillingLineItem {
  id?: number | string
  type: string
  name: string
  quantity: number
  price: number
  originalPrice?: number
}

export interface AppointmentBillingSnapshot {
  appointment_id: number
  appointment_public_id?: string
  phase1_billing_id: number
  phase1_billing_public_id?: string
  patient_id: number
  patient_public_id?: string
  patient_name: string
  provider_name?: string
  active_billing_package_id?: string
  active_billing_package_name?: string
  active_billing_package_source?: string
  specialty_tag_name?: string
  specialty_tag_is_active?: boolean
  treatment_area_name?: string
  treatment_area_color?: string
  treatment_area_is_active?: boolean
  starts_at: string
  ends_at: string
  billing_type?: string
  service_type?: string
  billing_status?: string
  service_name?: string
  amount_due: number
  amount_paid: number
  total_amount: number
  session_sequence?: number
  total_sessions?: number
  session_sequence_label?: string
  line_items: AppointmentBillingLineItem[]
}

export interface AppointmentEncounterTicket {
  id: number
  appointment_public_id?: string
  patient_public_id?: string
  attendance_status: AppointmentAttendanceStatus
  attended_at: string
  phase1_billing_id?: number
  phase1_billing_public_id?: string
  active_billing_package_id?: string
  active_billing_package_name?: string
  active_billing_package_source?: string
  pt_confirmed_by_staff_id?: number
  pt_confirmed_by_name?: string
  pt_confirmed_at?: string
  pt_signature_data_url?: string
  pt_completion_tag?: string
  patient_acknowledged_by: string
  deduction_authorized: boolean
  patient_signature_data_url?: string
  slip_number?: string
  signed_off_at: string
  record_locked: boolean
  locked_at?: string
  billing_snapshot?: AppointmentBillingSnapshot
}

export interface LguCreditSummaryItem {
  id: number
  service_item: string
  package_name: string
  total_purchased: number
  used: number
  balance: number
  expiry_date?: string
  status: string
}

export interface LguCreditSummary {
  authorization_id: number
  package_name: string
  total_sessions: number
  consumed_sessions: number
  billed_sessions: number
  authorization_status: string
  expiry_date?: string
  items: LguCreditSummaryItem[]
}

export interface AppointmentDetail extends AppointmentListItem {
  patient_link: string
  billing_link?: string
  billing_type?: string
  hmo_loa_number?: string
  hmo_loa_date?: string
  service_name?: string
  override_reason?: string
  dropout_status?: string
  checkout_summary: AppointmentCheckoutSummary
  encounter_ticket?: AppointmentEncounterTicket
  lgu_credit_summary?: LguCreditSummary
}

export interface AppointmentContext {
  appointment: AppointmentDetail
  related: {
    patient_id: number
    billing_id?: number | null
    patient_link: string
    billing_link?: string
  }
}

export interface StaffReference {
  id?: number
  name?: string
  role_name?: string
}

export interface DailyPtDeckBlock extends AppointmentListItem {
  patient: {
    id: number
    name: string
  }
  pt?: StaffReference
  referring_doctor?: Pick<StaffReference, "id" | "name">
  support_staff?: Pick<StaffReference, "id" | "name">
  start: string
  end: string
  treatment_area?: {
    id?: number
    name?: string
    color?: string
  }
  specialty?: {
    id?: number
    name?: string
  }
  phase: AppointmentPhase
  status: string
}

export interface DailyPtDeckGroup {
  doctor_id?: number
  doctor_name?: string
  role_name?: string
  is_unassigned: boolean
  appointment_count: number
  pending_count: number
  completed_count: number
  needs_billing_count: number
  earliest_starts_at?: string
  appointments: DailyPtDeckBlock[]
}

export interface AppointmentSessionSchedulePayload {
  starts_at: string
  ends_at: string
  label?: string | null

  appointment_phase?: AppointmentPhase

  create_billing?: boolean
  billing_strategy?: "PER_APPOINTMENT"
  billing_type?: AppointmentBillingType
  service_type?: AppointmentServiceType

  amount_due?: number
  service_name?: string | null
  line_items_json?: string | null

  session_id?: string | number | null
  session_name?: string | null
  session_sequence?: number
  session_occurrence?: number
  total_sessions?: number
  session_sequence_label?: string | null
}

export interface ReschedulePayload {
  starts_at: string
  ends_at: string
  override_reason?: string
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export interface AppointmentStatusUpdatePayload {
  appointment_status: AppointmentStatus
  reason?: string
}

export interface AppointmentCreatePayload {
  patient_id: number
  clinic_id?: number
  specialty_tag_id?: number
  treatment_area_id?: number
  location_context?: AppointmentLocationContext
  doctor_id: number
  referring_doctor_id?: number
  support_staff_id?: number
  starts_at: string
  ends_at: string
  session_schedules?: AppointmentSessionSchedulePayload[]
  appointment_phase?: AppointmentPhase
  appointment_type_id?: number
  appointment_status_id?: number
  billing_type?: AppointmentBillingType
  service_type?: AppointmentServiceType
  shared_phase1_billing_id?: number
  package_id?: number
  package_name?: string
  lgu_program_id?: number
  service_name?: string
  amount_due?: number
  total_package_amount_due?: number
  line_items_json?: string
  notes?: string
  billing_strategy?: "PER_APPOINTMENT"
  package_billing_mode?: "PER_APPOINTMENT"
  create_billing_per_appointment?: boolean
}

export interface AppointmentCreateResult {
  appointment_id?: number
  appointment_public_id?: string
  appointment_ids: number[]
  appointment_public_ids?: string[]

  billing_id?: number
  billing_public_id?: string
  billing_ids?: number[]
  billing_public_ids?: string[]
}

export interface AppointmentUpdatePayload {
  patient_id?: number
  clinic_id?: number | null
  specialty_tag_id?: number | null
  treatment_area_id?: number | null
  location_context?: AppointmentLocationContext | null
  doctor_id?: number | null
  referring_doctor_id?: number | null
  support_staff_id?: number | null
  starts_at?: string
  ends_at?: string
  appointment_phase?: AppointmentPhase | null
  appointment_type_id?: number | null
  appointment_status_id?: number | null
}

export interface AppointmentEncounterTicketPayload {
  attended_at?: string
  patient_signature_data_url: string
  loa_number?: string
  loa_date?: string
}

export interface AppointmentPtCompletionPayload {
  completed_at?: string
  pt_signature_data_url: string
  pt_completion_tag?: string
}

export interface AppointmentDailyLogItem {
  id: number
  public_id: string
  patient_id: number
  patient_public_id: string
  patient_name: string
  clinic_id?: number
  clinic_name?: string
  location_context: AppointmentLocationContext
  doctor_id?: number
  doctor_name?: string
  support_staff_id?: number
  support_staff_name?: string
  support_staff_role_name?: string
  starts_at: string
  ends_at: string
  appointment_phase: AppointmentPhase
  appointment_status: string
  billing_status: string
  encounter_ticket_id?: number
  attendance_status?: AppointmentAttendanceStatus
  attended_at?: string
  patient_acknowledged_by?: string
  patient_signature_data_url?: string
  signed_off_at?: string
  pt_confirmed_by_name?: string
  pt_confirmed_at?: string
  pt_signature_data_url?: string
  pt_completion_tag?: string
  slip_number?: string
  record_locked: boolean
  has_patient_signature: boolean
  has_pt_signature: boolean
  is_fully_signed: boolean
  signature_state: AppointmentDailyLogSignatureState
}

export interface AppointmentDailyLogSummary {
  total_entries: number
  completed_count: number
  patient_signature_count: number
  pt_signature_count: number
  fully_signed_count: number
  pending_signature_count: number
  no_show_count: number
}

export interface AppointmentDailyLogResponse {
  selected_date: string
  summary: AppointmentDailyLogSummary
  items: AppointmentDailyLogItem[]
}

export interface AppointmentDailyLogParams extends QueryParams {
  date?: string
  clinic_id?: number
  doctor_id?: number
  search?: string
}

export interface AppointmentDayOptions extends QueryParams {
  phase?: AppointmentPhase
  clinic_id?: number
}

export interface AppointmentUpcomingOptions extends QueryParams {
  clinic_id?: number
  phase?: AppointmentPhase
  limit?: number
}

export interface EndOfDayHistoryParams extends QueryParams {
  clinic_id?: number
  from_date?: string
  to_date?: string
  limit?: number
}

export interface ReferringDoctorCompletedSessionsItem {
  referring_doctor_id: number
  referring_doctor_name: string
  completed_sessions_count: number
}

export interface ReferringDoctorCompletedSessionsReport {
  from_date: string
  to_date: string
  total_completed_sessions: number
  doctors: ReferringDoctorCompletedSessionsItem[]
}

export interface PtCompletedSessionsItem {
  pt_id: number
  pt_name: string
  completed_sessions_count: number
  documentation_reminder_count: number
  red_alert_count: number
}

export interface PtCompletedSessionsReport {
  from_date: string
  to_date: string
  total_completed_sessions: number
  physical_therapists: PtCompletedSessionsItem[]
}

export interface PtEndOfDayPendingSignatureByPt {
  pt_id: number
  pt_name: string
  eligible_appointment_count: number
  pending_pt_signature_count: number
}

export interface PtEndOfDaySummary {
  total_appointments: number
  eligible_appointments: number
  pt_signed_appointments: number
  pending_pt_signature_count: number
  billing_cleared_appointments: number
  pending_billing_count: number
  all_appointments_done: boolean
  all_billings_cleared: boolean
}

export interface PtEndOfDayReport {
  selected_date: string
  clinic: {
    id: number
    name: string
    start_time: string
    end_time: string
    window_starts_at: string
    window_ends_at: string
  }
  eod_report_generated: boolean
  eod_generated_at?: string
  summary: PtEndOfDaySummary
  pending_pt_signatures_by_pt: PtEndOfDayPendingSignatureByPt[]
}

export interface EndOfDayHistoryItem {
  id: number
  report_date: string
  clinic_id?: number
  clinic_name?: string
  clinic_start_time?: string
  clinic_end_time?: string
  eod_generated_at: string
  summary: PtEndOfDaySummary
  pending_pt_signatures_by_pt: PtEndOfDayPendingSignatureByPt[]
  generated_by_staff_id?: number
  generated_by_name?: string
  generated_by_email?: string
  created_at: string
}

export interface DropoutStatusUpdateResult {
  dropout_status: string
  dropout_billing_id?: number
  dropout_billing_public_id?: string
  cleared_appointment_ids?: number[]
}

export interface DropoutStatusUpdatePayload {
  dropout_status: string
  reason?: string
}

const APPOINTMENTS_PATH = "/appointments"

const branchParams = (clinicId?: number): QueryParams => (
  clinicId ? { clinic_id: clinicId } : { all_branches: true }
)

const getData = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const { data } = await pamsAPI.get<T>(url, config)
  return data
}

const postData = async <T, TPayload = unknown>(url: string, payload?: TPayload): Promise<T> => {
  const { data } = await pamsAPI.post<T>(url, payload)
  return data
}

const patchData = async <T, TPayload = unknown>(url: string, payload?: TPayload): Promise<T> => {
  const { data } = await pamsAPI.patch<T>(url, payload)
  return data
}

const requestVoid = async (config: AxiosRequestConfig): Promise<void> => {
  await pamsAPI.request(config)
}

export const appointmentPhase1Service = {
  getAll(params: QueryParams = {}): Promise<Pageable<AppointmentListItem>> {
    return getData<Pageable<AppointmentListItem>>(APPOINTMENTS_PATH, { params })
  },

  getDay(date: string, options: AppointmentDayOptions = {}): Promise<AppointmentListItem[]> {
    return getData<AppointmentListItem[]>(`${APPOINTMENTS_PATH}/calendar/day`, {
      params: { date, ...options }
    })
  },

  getDailyPtDeck(date: string, clinicId: number): Promise<DailyPtDeckGroup[]> {
    return getData<DailyPtDeckGroup[]>(`${APPOINTMENTS_PATH}/calendar/day/pt-deck`, {
      params: { date, clinic_id: clinicId }
    })
  },

  getMyUpcoming(options: AppointmentUpcomingOptions = {}): Promise<AppointmentListItem[]> {
    return getData<AppointmentListItem[]>(`${APPOINTMENTS_PATH}/my-upcoming`, { params: options })
  },

  getCompletedSessionsByReferringDoctor(
    fromDate: string,
    toDate: string,
    clinicId?: number
  ): Promise<ReferringDoctorCompletedSessionsReport> {
    return getData<ReferringDoctorCompletedSessionsReport>(
      `${APPOINTMENTS_PATH}/reports/referring-doctor-completed-sessions`,
      {
        params: {
          from_date: fromDate,
          to_date: toDate,
          ...branchParams(clinicId)
        }
      }
    )
  },

  getCompletedSessionsByPt(
    fromDate: string,
    toDate: string,
    clinicId?: number
  ): Promise<PtCompletedSessionsReport> {
    return getData<PtCompletedSessionsReport>(`${APPOINTMENTS_PATH}/reports/pt-completed-sessions`, {
      params: {
        from_date: fromDate,
        to_date: toDate,
        ...branchParams(clinicId)
      }
    })
  },

  getPtEndOfDay(date: string, clinicId: number): Promise<PtEndOfDayReport> {
    return getData<PtEndOfDayReport>(`${APPOINTMENTS_PATH}/reports/pt-end-of-day`, {
      params: { date, clinic_id: clinicId }
    })
  },

  getEndOfDayHistory(params: EndOfDayHistoryParams = {}): Promise<EndOfDayHistoryItem[]> {
    return getData<EndOfDayHistoryItem[]>(`${APPOINTMENTS_PATH}/reports/end-of-day-history`, {
      params
    })
  },

  getDailyLog(params: AppointmentDailyLogParams): Promise<AppointmentDailyLogResponse> {
    return getData<AppointmentDailyLogResponse>(`${APPOINTMENTS_PATH}/daily-log`, { params })
  },

  getById(id: number): Promise<AppointmentDetail> {
    return getData<AppointmentDetail>(`${APPOINTMENTS_PATH}/${id}`)
  },

  getContext(id: number): Promise<AppointmentContext> {
    return getData<AppointmentContext>(`${APPOINTMENTS_PATH}/${id}/context`)
  },

  create(payload: AppointmentCreatePayload): Promise<AppointmentCreateResult> {
    return postData<AppointmentCreateResult, AppointmentCreatePayload>(APPOINTMENTS_PATH, payload)
  },

  update(id: number, payload: AppointmentUpdatePayload): Promise<void> {
    return requestVoid({
      method: "PUT",
      url: `${APPOINTMENTS_PATH}/${id}`,
      data: payload
    })
  },

  updateStatus(
  id: number,
  statusOrPayload: AppointmentStatus | AppointmentStatusUpdatePayload
): Promise<void> {
  const payload = typeof statusOrPayload === "string"
    ? { appointment_status: statusOrPayload }
    : statusOrPayload

  return requestVoid({
    method: "PATCH",
    url: `${APPOINTMENTS_PATH}/${id}/status`,
    data: payload
  })
},



  reschedule(id: number, payload: ReschedulePayload): Promise<void> {
    return requestVoid({
      method: "POST",
      url: `${APPOINTMENTS_PATH}/${id}/reschedule`,
      data: payload
    })
  },



  delete(id: number): Promise<void> {
    return requestVoid({
      method: "DELETE",
      url: `${APPOINTMENTS_PATH}/${id}`
    })
  },

  processEncounterTicket(
    id: number,
    payload: AppointmentEncounterTicketPayload
  ): Promise<AppointmentEncounterTicket> {
    return postData<AppointmentEncounterTicket, AppointmentEncounterTicketPayload>(
      `${APPOINTMENTS_PATH}/${id}/encounter-ticket`,
      payload
    )
  },

  processPtCompletion(
    id: number,
    payload: AppointmentPtCompletionPayload
  ): Promise<AppointmentEncounterTicket> {
    return postData<AppointmentEncounterTicket, AppointmentPtCompletionPayload>(
      `${APPOINTMENTS_PATH}/${id}/pt-completion`,
      payload
    )
  },

  updateDropoutStatus(
    id: number,
    dropoutStatusOrPayload: string | DropoutStatusUpdatePayload
  ): Promise<DropoutStatusUpdateResult> {
    const payload = typeof dropoutStatusOrPayload === "string"
      ? {dropout_status: dropoutStatusOrPayload}
      : dropoutStatusOrPayload
    return patchData<DropoutStatusUpdateResult, DropoutStatusUpdatePayload>(
      `${APPOINTMENTS_PATH}/${id}/dropout-status`,
      payload
    )
  },

  exportCsv(params: QueryParams): Promise<AxiosResponse<Blob>> {
    return pamsAPI.get<Blob>(`${APPOINTMENTS_PATH}/export/csv`, {
      params,
      responseType: "blob"
    })
  }


}
