import type { AxiosError, AxiosResponse } from "axios"
import type { Pageable } from "@/models/paging"
import { pamsAPI } from "@/utils/axios-interceptor"

export type AppointmentPhase = "EVAL" | "SESSION" | "RE_EVAL"
export type AppointmentLocationContext = "IN_CLINIC" | "HOME_CARE"
export type AppointmentAttendanceStatus = "ATTENDED" | "NO_SHOW" | "CANCELLED"
export type AppointmentDailyLogSignatureState = "PENDING" | "PATIENT_SIGNED" | "PT_SIGNED" | "FULLY_SIGNED" | "NO_SHOW"
export type AppointmentBillingType = "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO_BILLING" | "LGU_BILLING"
export type AppointmentServiceType = "SINGLE" | "PACKAGE" | "HMO" | "LGU"
export type AppointmentSponsorType = "HMO" | "LGU"
export type AppointmentDropoutStatus = "DROPPED_OUT" | "CROSS_MONTH_DROPPED_OUT"
export type AppointmentStatus = "Pending" | "Rescheduled" | "No show" | "Cancelled" | "Completed" | string
export type QueryParams = Record<string, string | number | boolean | null | undefined>

const isRouteNotFoundError = (error: unknown): boolean => {
  const axiosError = error as AxiosError<{ message?: string }>
  return axiosError?.response?.status === 404 &&
    String(axiosError.response.data?.message ?? "").toLowerCase() === "route not found"
}

export interface AppointmentListItem {
  id: number
  public_id?: string
  root_appointment_id?: number | null
  session_sequence?: number
  total_sessions?: number

  patient_id: number
  patient_public_id?: string
  patient_name: string

  clinic_id: number
  clinic_name: string

  primary_provider_staff_id?: number
  provider_name?: string
  provider_calendar_color?: string | null
  referring_staff_id?: number | null
  referring_staff_name?: string | null
  support_staff_id?: number | null
  support_staff_name?: string | null

  specialty_tag_id?: number
  specialty_tag_name?: string
  specialty_tag_is_active?: boolean
  treatment_area_id?: number
  treatment_area_name?: string
  treatment_area_color?: string
  treatment_area_is_active?: boolean

  medical_category_id?: number | null
  medical_category_name?: string | null
  medical_diagnose_id?: number | null
  medical_diagnose_name?: string | null
  diagnosis_laterality?: string | null
  pt_case_impression_id?: number | null
  pt_case_impression_name?: string | null
  pt_case_laterality?: string | null

  doctor_id?: number
  doctor_name?: string
  referring_doctor_id?: number
  referring_doctor_name?: string

  starts_at: string
  ends_at: string
  appointment_phase: AppointmentPhase
  location_context: AppointmentLocationContext
  appointment_type_id: number
  appointment_type?: string
  appointment_status_id: number
  appointment_status: string
  attendance_status?: "PENDING" | "COMPLETED" | "CANCELED" | string
  appointment_consumed_quantity?: number
  appointment_consumption_count?: number

  billing_type?: string
  payer_type?: string | null
  credit_account_id?: number | null
  credit_account_name?: string | null
  lgu_program_id?: number | null
  hmo_id?: number | null
  hmo_loa_number?: string
  hmo_loa_date?: string
  service_type?: string
  billing_status: string
  billing_id?: number
  billing_public_id?: string

  reschedule_flag: boolean
  reschedule_count: number
  reschedule_history_count?: number
  daily_log_status?: "SCHEDULED" | "RESCHEDULED_ORIGINAL"
  daily_log_row_key?: string
  daily_log_rescheduled_to?: string | null
  daily_log_rescheduled_to_end?: string | null
  daily_log_reschedule_reason?: string | null
  dropout_status?: string
  dropout_at?: string | null
  dropout_reason?: string | null
  dropout_by_staff_id?: number | null
  dropout_by_staff_name?: string | null
  dropout_appointment_id?: number | null
  notes?: string | null
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
  phase1_billing_id?: number
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
  patient_acknowledged_relation?: string
  deduction_authorized: boolean
  patient_signature_data_url?: string
  slip_number?: string
  signed_off_at: string
  record_locked: boolean
  locked_at?: string
  billing_snapshot?: AppointmentBillingSnapshot
  notes?: string | null
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
  service_name?: string
  override_reason?: string
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
  appointments: DailyPtDeckBlock[]
}

export interface AppointmentDayOptions {
  clinic_id?: number | null
}

export interface AppointmentUpcomingOptions {
  limit?: number
}

export interface PtCompletedSessionsItem {
  pt_id?: number
  pt_name?: string
  completed_sessions_count: number
  documentation_reminder_count: number
  red_alert_count: number
}

export interface PtCompletedSessionsReport {
  physical_therapists: PtCompletedSessionsItem[]
}

export interface ReferringDoctorCompletedSessionsItem {
  referring_doctor_id?: number
  referring_doctor_name: string
  completed_sessions_count: number
}

export interface ReferringDoctorCompletedSessionsReport {
  total_completed_sessions: number
  doctors: ReferringDoctorCompletedSessionsItem[]
}

export interface PtEndOfDayReport {
  eod_report_generated: boolean
  eod_generated_at: string
  clinic?: {
    name: string
    window_starts_at: string
    window_ends_at: string
  }
  summary: {
    pending_appointment_count: number
    pending_pt_signature_count: number
    pending_billing_count: number
    billing_cleared_appointments: number
    eligible_appointments: number
    all_appointments_done: boolean
    all_billings_cleared: boolean
  }
  appointments?: AppointmentListItem[]
  pending_pt_signatures_by_pt?: Array<Record<string, unknown>>
  pending_eod_blockers?: Array<{
    appointment_id: number
    starts_at: string
    patient_public_id?: string | null
    patient_name: string
    pt_name: string
    appointment_status: string
    payer_type?: string | null
    blockers: string[]
  }>
}

export interface EndOfDayHistoryItem {
  id: number
  report_date: string
  clinic_name?: string
  generated_at?: string
  eod_generated_at: string
  generated_by_name?: string
  generated_by_email?: string
  summary: {
    pt_signed_appointments: number
    billing_cleared_appointments: number
    eligible_appointments: number
    all_appointments_done: boolean
    all_billings_cleared: boolean
  }
  pending_pt_signatures_by_pt?: Array<Record<string, unknown>>
}

export interface EndOfDayHistoryParams extends QueryParams {}

export interface AppointmentDailyLogParams extends QueryParams {}

export interface AppointmentDailyLogResponse {
  date: string
  summary: Record<string, unknown>
  items: AppointmentDailyLogItem[]
  groups: DailyPtDeckGroup[]
}

export interface AppointmentDailyLogItem {
  id: number
  appointment_id?: number
  patient_id?: number
  patient_name: string
  patient_public_id?: string
  clinic_id?: number
  clinic_name?: string
  starts_at: string
  ends_at: string
  appointment_phase: AppointmentPhase
  appointment_status: string
  location_context: AppointmentLocationContext
  billing_status?: string
  signature_state: AppointmentDailyLogSignatureState
  doctor_id?: number | null
  doctor_name?: string | null
  pt_confirmed_by_name?: string | null
  support_staff_id?: number | null
  support_staff_name?: string | null
  support_staff_role_name?: string | null
  [key: string]: string | number | boolean | null | undefined
}

export type AppointmentServiceSelectionType =
  | "PACKAGE"
  | "BUNDLE"
  | "MACHINE"
  | "TECHNIQUE"
  | "EVALUATION"
  | "ADD_ON_MACHINE"
  | "ADD_ON_TECHNIQUE"
  | "ADD_ON_HOME_SERVICE"

export interface AppointmentSessionSchedulePayload {
  starts_at: string
  ends_at: string
}

export interface AppointmentServiceCreatePayload {
  type: AppointmentServiceSelectionType
  id: number
  quantity: number
}

export interface AppointmentCreatePayload extends Record<string, unknown> {
  service_type?: AppointmentServiceType
  services?: AppointmentServiceCreatePayload[]
  session_schedules?: AppointmentSessionSchedulePayload[]
  credit_account_id?: number | null
  root_appointment_id?: number | null
  add_initial_evaluation_appointment?: boolean
}

export interface AppointmentUpdatePayload extends Record<string, unknown> {}
export interface AppointmentStatusUpdatePayload extends Record<string, unknown> {}
export interface ReschedulePayload extends Record<string, unknown> {
  starts_at: string
  ends_at: string
  reason?: string
}
export interface AppointmentEncounterTicketPayload extends Record<string, unknown> {}
export interface AppointmentPtCompletionPayload extends Record<string, unknown> {}
export interface DailyLogPrintExceptionPayload {
  appointment_ids: number[]
  selected_date: string
  clinic_id?: number
  reason_code: string
  explanation: string
}

export interface DailyLogPrintExceptionApproval {
  reference: string
  approved_at: string
  approved_by: string
  approved_role: string
  reason_code: string
  reason_label: string
  explanation: string
  missing_signatures: Array<{
    appointment_id: number
    missing_signature_types: Array<"patient" | "pt">
  }>
}
export interface LguServiceConsumptionPayload extends Record<string, unknown> {}
export interface DropoutStatusUpdatePayload extends Record<string, unknown> {
  dropout_status?: AppointmentDropoutStatus
  reason?: string | null
  dropout_reason?: string | null
}

export interface AppointmentCreateResult {
  id: number
  appointment_ids?: number[]
  root_appointment_id?: number
  total_sessions?: number
  credit_account_id?: number | null
}

export interface AppointmentSessionPreviewResult {
  total_sessions: number
}

export interface LguServiceConsumptionResult {
  appointment_id?: number
  consumed_services?: unknown[]
}

export interface AppointmentServiceSelectionPayload {
  services: AppointmentServiceCreatePayload[]
  payer_type?: string | null
}

export interface AppointmentConsumedService {
  id: number
  credit_item_id?: number
  type: AppointmentServiceSelectionType
  source_type?: string
  service_name: string
  package_name?: string | null
  bundle_name?: string | null
  quantity: number
  unit_price: number
  line_total: number
  pricing_mode: string
  status: string
  consumed_at: string
}

export interface AppointmentPlannedService {
  id: number
  appointment_id?: number
  credit_item_id?: number
  source_type?: string
  line_type?: string
  type: AppointmentServiceSelectionType
  service_id?: number | null
  service_name: string
  service_category?: string
  package_name?: string | null
  bundle_name?: string | null
  selected_quantity?: number
  included_quantity?: number
  planned_quantity: number
  consumed_quantity: number
  appointment_consumed_quantity?: number
  remaining_quantity?: number
  unit_price: number
  total_price?: number
  billing_visibility?: string
  parent_credit_item_id?: number | null
}

export interface AppointmentFlowSummary {
  appointment: AppointmentListItem & {
    billing_document_id?: number | null
    invoice_id?: number | null
    claim_id?: number | null
  }
  schedule: {
    session_sequence: number
    total_sessions: number
    session_dates: Array<{
      appointment_id: number
      session_sequence: number
      starts_at: string
      ends_at: string
    }>
    clinic_schedule_status: string
    has_conflict: boolean
  }
  planned_services: AppointmentPlannedService[]
  consumed_services: AppointmentConsumedService[]
  encounter_ticket?: AppointmentEncounterTicket | null
  billing_preparation: Record<string, any> | null
  billing_preparation_error?: string | null
  billing_document: {
    id: number
    document_number?: string | null
    document_type: string
    document_status: string
    document_date: string
    totals: {
      subtotal: number
      discount: number
      tax: number
      total: number
      paid: number
      balance: number
    }
  } | null
  print_routes: Record<string, string | null>
}

export interface DropoutStatusUpdateResult {
  appointment_id: number
  dropout_status: string
  flow_summary?: AppointmentFlowSummary
  cleared_appointment_ids?: number[]
  dropout_billing_public_id?: string
}

const disabledMessage = "Legacy appointment module is disabled while the new care appointment flow is being rebuilt."

const disabled = async <T>(): Promise<T> => {
  throw new Error(disabledMessage)
}

const emptyBlobResponse = async (): Promise<AxiosResponse<Blob>> => ({
  data: new Blob([]),
  status: 204,
  statusText: "No Content",
  headers: {},
  config: {}
} as AxiosResponse<Blob>)

export const appointmentPhase1Service = {
  async getAll(params: QueryParams = {}): Promise<Pageable<AppointmentListItem>> {
    const { data } = await pamsAPI.get<Pageable<AppointmentListItem>>("/appointments", { params })
    return data
  },

  async getDay(_date?: string, _options: AppointmentDayOptions = {}): Promise<AppointmentListItem[]> {
    return []
  },

  async getDailyPtDeck(_date?: string, _clinicId?: number): Promise<DailyPtDeckGroup[]> {
    return []
  },

  async getMyUpcoming(_options: AppointmentUpcomingOptions = {}): Promise<AppointmentListItem[]> {
    return []
  },

  async getCompletedSessionsByReferringDoctor(
    _fromDate?: string,
    _toDate?: string,
    _clinicId?: number
  ): Promise<ReferringDoctorCompletedSessionsReport> {
    return { total_completed_sessions: 0, doctors: [] }
  },

  async getCompletedSessionsByPt(
    _fromDate?: string,
    _toDate?: string,
    _clinicId?: number
  ): Promise<PtCompletedSessionsReport> {
    return { physical_therapists: [] }
  },

  async getPtEndOfDay(date?: string, clinicId?: number): Promise<PtEndOfDayReport> {
    const { data } = await pamsAPI.get<PtEndOfDayReport>("/pt-end-of-day", {
      params: { date, clinic_id: clinicId }
    })
    return data
  },

  async getEndOfDayHistory(params: EndOfDayHistoryParams = {}): Promise<EndOfDayHistoryItem[]> {
    const { data } = await pamsAPI.get<EndOfDayHistoryItem[]>("/end-of-day-history", { params })
    return data ?? []
  },

  async getDailyLog(params: AppointmentDailyLogParams): Promise<AppointmentDailyLogResponse> {
    const date = String(params.date ?? new Date().toISOString().slice(0, 10))
    const { data } = await pamsAPI.get<AppointmentDailyLogResponse>("/appointments/daily-log", {
      params: {
        ...params,
        date,
      }
    })

    const items: AppointmentDailyLogItem[] = (data.items ?? []).map((appointment) => {
      const doctorName = typeof appointment.doctor_name === "string"
        ? appointment.doctor_name
        : typeof appointment.referring_doctor_name === "string"
          ? appointment.referring_doctor_name
          : null

      return {
        ...appointment,
        appointment_id: appointment.id,
        signature_state: appointment.attendance_status === "COMPLETED" ? "FULLY_SIGNED" : "PENDING",
        doctor_name: doctorName,
      }
    })

    return {
      date,
      summary: {
        total: Number(data.summary?.total ?? items.length),
      },
      items,
      groups: [],
    }
  },

  async getById(id: number): Promise<AppointmentDetail> {
    const { data } = await pamsAPI.get<AppointmentDetail>(`/appointments/${id}`)
    return data
  },

  async getFlowSummary(id: number): Promise<AppointmentFlowSummary> {
    const { data } = await pamsAPI.get<AppointmentFlowSummary>(`/appointments/${id}/flow-summary`)
    return data
  },

  getContext: (_id: number) => disabled<AppointmentContext>(),

  async create(payload: AppointmentCreatePayload): Promise<AppointmentCreateResult> {
    const { data } = await pamsAPI.post<AppointmentCreateResult>("/appointments", payload)
    return data
  },

  async previewSessions(payload: AppointmentServiceSelectionPayload): Promise<AppointmentSessionPreviewResult> {
    const { data } = await pamsAPI.post<AppointmentSessionPreviewResult>("/appointments/session-preview", payload)
    return data
  },

  async update(id: number, payload: AppointmentUpdatePayload): Promise<void> {
    await pamsAPI.put(`/appointments/${id}`, payload)
  },

  async updateStatus(id: number, payload: AppointmentStatus | AppointmentStatusUpdatePayload): Promise<void> {
    await pamsAPI.patch(`/appointments/${id}/status`, typeof payload === "string" ? { appointment_status: payload } : payload)
  },

  async reschedule(id: number, payload: ReschedulePayload): Promise<void> {
    try {
      await pamsAPI.patch(`/appointments/${id}/reschedule`, payload)
    } catch (error) {
      if (!isRouteNotFoundError(error)) {
        throw error
      }

      await pamsAPI.post(`/appointments/${id}/reschedule`, payload)
    }
  },

  async delete(id: number): Promise<void> {
    await pamsAPI.delete(`/appointments/${id}`)
  },

  async getEncounterTicket(id: number): Promise<AppointmentEncounterTicket | null> {
    const { data } = await pamsAPI.get<AppointmentEncounterTicket | null>(`/appointments/${id}/encounter-ticket`)
    return data
  },

  async processEncounterTicket(id: number, payload: AppointmentEncounterTicketPayload): Promise<AppointmentEncounterTicket> {
    const { data } = await pamsAPI.post<AppointmentEncounterTicket>(`/appointments/${id}/encounter-ticket`, payload)
    return data
  },

  async approveDailyLogPrintException(
    payload: DailyLogPrintExceptionPayload
  ): Promise<DailyLogPrintExceptionApproval> {
    const { data } = await pamsAPI.post<DailyLogPrintExceptionApproval>(
      "/appointments/daily-log-print-exceptions",
      payload
    )
    return data
  },

  processPtCompletion: (_id: number, _payload: AppointmentPtCompletionPayload) =>
    disabled<AppointmentEncounterTicket>(),

  async saveConsumedServices(
    id: number,
    payload: AppointmentServiceSelectionPayload
  ): Promise<{ credit_account_id: number; consumed_services: unknown[] }> {
    const { data } = await pamsAPI.post(`/appointments/${id}/consumed-services`, payload)
    return data
  },

  async getConsumedServices(id: number): Promise<AppointmentConsumedService[]> {
    const { data } = await pamsAPI.get<AppointmentConsumedService[]>(`/appointments/${id}/consumed-services`)
    return data
  },

  async savePlannedServices(
    id: number,
    payload: AppointmentServiceSelectionPayload
  ): Promise<{ credit_account_id: number; planned_services: unknown[] }> {
    const { data } = await pamsAPI.post(`/appointments/${id}/planned-services`, payload)
    return data
  },

  async getPlannedServices(id: number): Promise<AppointmentPlannedService[]> {
    const { data } = await pamsAPI.get<AppointmentPlannedService[]>(`/appointments/${id}/planned-services`)
    return data
  },

  async saveAttendance(
    id: number,
    payload: {
      items: Array<{ credit_item_id: number; quantity: number }>
      patient_signature_data_url?: string
      patient_signature_signed_at?: string
      patient_signature_signed_by?: string | null
      pt_signature_data_url?: string
      pt_confirmed_at?: string
      pt_completion_tag?: string | null
      notes?: string | null
    }
  ): Promise<{ consumed_services: unknown[]; encounter_ticket?: AppointmentEncounterTicket }> {
    const { data } = await pamsAPI.post(`/appointments/${id}/attendance`, payload)
    return data
  },

  consumeLguServices: (_id: number, _payload: LguServiceConsumptionPayload) =>
    disabled<LguServiceConsumptionResult>(),

  getConsumedLguServices: (_id: number) =>
    disabled<LguServiceConsumptionResult>(),

  async updateDropoutStatus(id: number, payload: string | DropoutStatusUpdatePayload): Promise<AppointmentFlowSummary> {
    const body = typeof payload === "string" ? { dropout_status: payload } : payload
    const { data } = await pamsAPI.post<AppointmentFlowSummary>(`/appointments/${id}/drop-out`, body)
    return data
  },

  async undoDropoutStatus(id: number): Promise<AppointmentFlowSummary> {
    const { data } = await pamsAPI.post<AppointmentFlowSummary>(`/appointments/${id}/undo-dropout`)
    return data
  },

  exportCsv: (_params: QueryParams) => emptyBlobResponse()
}
