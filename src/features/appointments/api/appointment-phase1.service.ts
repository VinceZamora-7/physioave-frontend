import {pamsAPI} from "@/utils/axios-interceptor";
import type {Pageable} from "@/models/paging";
import type {AxiosResponse} from "axios";
import axios, {HttpStatusCode} from "axios";

export interface AppointmentListItem {
  id: number
  patient_id: number
  patient_name: string
  doctor_id?: number
  doctor_name?: string
  starts_at: string
  ends_at: string
  appointment_status: string
  billing_status: string
  billing_id?: number
  reschedule_flag: boolean
  reschedule_count: number
}

export interface AppointmentDetail extends AppointmentListItem {
  patient_link: string
  billing_link?: string
  override_reason?: string
}

export interface ReschedulePayload {
  starts_at: string
  ends_at: string
  override_reason?: string
}

export interface AppointmentCreatePayload {
  patient_id: number
  doctor_id?: number
  starts_at: string
  ends_at: string
  appointment_type_id?: number
  appointment_status_id?: number
  billing_type?: "INDIVIDUAL_PRICING" | "PACKAGE_BILLING" | "ALA_CARTE"
  service_type?: "SINGLE" | "PACKAGE" | "HMO"
  package_id?: number
  service_name?: string
  amount_due?: number
  notes?: string
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
  async getDay(date: string): Promise<AppointmentListItem[] | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<AppointmentListItem[]>("/appointments/calendar/day", {params: {date}})
      return data
    })
  },
  async getById(id: number): Promise<AppointmentDetail | undefined> {
    return await this.withRefreshRetry(async () => {
      const {data} = await pamsAPI.get<AppointmentDetail>(`/appointments/${id}`)
      return data
    })
  },
  async create(payload: AppointmentCreatePayload): Promise<void> {
    await this.withRefreshRetry(async () => {
      await pamsAPI.post("/appointments", payload)
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
  async exportCsv(params: Record<string, unknown>): Promise<AxiosResponse<Blob> | undefined> {
    return await this.withRefreshRetry(async () => {
      return await pamsAPI.get("/appointments/export/csv", {
        params,
        responseType: "blob"
      })
    })
  }
}
