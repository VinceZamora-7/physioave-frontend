import {pamsAPI} from "@/utils/axios-interceptor";
import type {Pageable} from "@/models/paging";
import type {AxiosResponse} from "axios";
import axios, {HttpStatusCode} from "axios";

export type AppointmentPhase = "EVAL" | "SESSION" | "RE_EVAL"
export type AppointmentLocationContext = "IN_CLINIC" | "HOME_CARE"

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
  starts_at: string
  ends_at: string
  appointment_phase: AppointmentPhase
  appointment_status: string
  billing_type?: string
  service_type?: string
  billing_status: string
  billing_id?: number
  billing_public_id?: string
  reschedule_flag: boolean
  reschedule_count: number
}

export interface AppointmentCheckoutSummary {
  patient_wallet: {
    amount_to_collect: number
  }
  sponsor_wallet?: {
    sponsor_type: "HMO" | "LGU"
    sponsor_name: string
    authorization_status: "AUTHORIZED"
    consumed_sessions?: number
    total_sessions?: number
    display_text: string
  }
}

export interface AppointmentEncounterTicket {
  id: number
  appointment_public_id?: string
  patient_public_id?: string
  attendance_status: "ATTENDED" | "NO_SHOW"
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
  billing_snapshot?: {
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
    line_items: Array<{
      id?: number | string
      type: string
      name: string
      quantity: number
      price: number
      originalPrice?: number
    }>
  }
}

export interface AppointmentDetail extends AppointmentListItem {
  patient_link: string
  billing_link?: string
  billing_type?: string
  service_name?: string
  override_reason?: string
  checkout_summary: AppointmentCheckoutSummary
  encounter_ticket?: AppointmentEncounterTicket
}

export interface DailyPtDeckBlock extends AppointmentListItem {
  patient: {
    id: number
    name: string
  }
  pt?: {
    id?: number
    name?: string
    role_name?: string
  }
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

export interface ReschedulePayload {
  starts_at: string
  ends_at: string
  override_reason?: string
}

export interface AppointmentCreatePayload {
  patient_id: number
  clinic_id?: number
  specialty_tag_id?: number
  treatment_area_id?: number
  location_context?: AppointmentLocationContext
  doctor_id?: number
  starts_at: string
  ends_at: string
  session_schedules?: Array<{
    starts_at: string
    ends_at: string
    label?: string
  }>
  appointment_phase?: AppointmentPhase
  appointment_type_id?: number
  appointment_status_id?: number
  billing_type?: "INDIVIDUAL_PRICING" | "PACKAGE_BILLING" | "ALA_CARTE" | "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO_BILLING" | "LGU_BILLING"
  service_type?: "SINGLE" | "PACKAGE" | "HMO" | "LGU"
  shared_phase1_billing_id?: number
  package_id?: number
  service_name?: string
  amount_due?: number
  line_items_json?: string
  notes?: string
}

export interface AppointmentCreateResult {
  appointment_id?: number
  appointment_public_id?: string
  appointment_ids: number[]
  appointment_public_ids?: string[]
  billing_id?: number
  billing_public_id?: string
}

export interface AppointmentUpdatePayload {
  patient_id?: number
  clinic_id?: number | null
  specialty_tag_id?: number | null
  treatment_area_id?: number | null
  location_context?: AppointmentLocationContext | null
  doctor_id?: number | null
  starts_at?: string
  ends_at?: string
  appointment_phase?: AppointmentPhase | null
  appointment_type_id?: number | null
  appointment_status_id?: number | null
}

export interface AppointmentEncounterTicketPayload {
  attended_at?: string
  patient_signature_data_url: string
}

export interface AppointmentPtCompletionPayload {
  completed_at?: string
  pt_signature_data_url: string
  pt_completion_tag?: string
}

export const appointmentPhase1Service = {
  refreshPromise: null as Promise<unknown> | null,

  async ensureRefreshed(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = pamsAPI.post("/refresh-tokens")
        .finally(() => {
          this.refreshPromise = null
        })
    }
    await this.refreshPromise
  },

  async withRefreshRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = String(error.response?.data?.message || error.response?.data?.detail || error.message || "").toLowerCase()
        const shouldRefresh =
          status === HttpStatusCode.Unauthorized ||
          status === HttpStatusCode.InternalServerError ||
          message.includes("expired") ||
          message.includes("jwt")

        if (shouldRefresh) {
          await this.ensureRefreshed()
          return await operation()
        }
      }
      throw error
    }
  },

  async getAll(params: Record<string, unknown>): Promise<Pageable<AppointmentListItem> | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<Pageable<AppointmentListItem>>("/appointments", {params})
      return data
    })
  },
  async getDay(date: string, options?: { phase?: AppointmentPhase; clinic_id?: number }): Promise<AppointmentListItem[] | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<AppointmentListItem[]>("/appointments/calendar/day", {params: {date, ...options}})
      return data
    })
  },
  async getDailyPtDeck(date: string, clinic_id: number): Promise<DailyPtDeckGroup[] | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<DailyPtDeckGroup[]>("/appointments/calendar/day/pt-deck", {params: {date, clinic_id}})
      return data
    })
  },
  async getMyUpcoming(options?: { clinic_id?: number; phase?: AppointmentPhase; limit?: number }): Promise<AppointmentListItem[] | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<AppointmentListItem[]>("/appointments/my-upcoming", {params: options})
      return data
    })
  },
  async getById(id: number): Promise<AppointmentDetail | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<AppointmentDetail>(`/appointments/${id}`)
      return data
    })
  },
  async create(payload: AppointmentCreatePayload): Promise<AppointmentCreateResult | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.post<AppointmentCreateResult>("/appointments", payload)
      return data
    })
  },
  async update(id: number, payload: AppointmentUpdatePayload): Promise<void> {
    await this.withRefreshRetry(async () => {
      await pamsAPI.put(`/appointments/${id}`, payload)
    })
  },
  async reschedule(id: number, payload: ReschedulePayload): Promise<void> {
    await this.withRefreshRetry(async () => {
      await pamsAPI.post(`/appointments/${id}/reschedule`, payload)
    })
  },
  async delete(id: number): Promise<void> {
    await this.withRefreshRetry(async () => {
      await pamsAPI.delete(`/appointments/${id}`)
    })
  },
  async processEncounterTicket(id: number, payload: AppointmentEncounterTicketPayload): Promise<AppointmentEncounterTicket | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.post<AppointmentEncounterTicket>(`/appointments/${id}/encounter-ticket`, payload)
      return data
    })
  },
  async processPtCompletion(id: number, payload: AppointmentPtCompletionPayload): Promise<AppointmentEncounterTicket | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.post<AppointmentEncounterTicket>(`/appointments/${id}/pt-completion`, payload)
      return data
    })
  },
  async exportCsv(params: Record<string, unknown>): Promise<AxiosResponse<Blob> | undefined> {
    return await this.withRefreshRetry(async () => {
      return await pamsAPI.get("/appointments/export/csv", {
        params,
        responseType: "blob"
      })
    })
  }
}
