import {pamsAPI} from "@/utils/axios-interceptor"

export interface DashboardSummary {
  active_patients: number
  appointments_today: number
  pending_billings: number
  paid_billings_month_to_date: number
}

export interface DashboardTrendItem {
  date: string
  count: number
}

export interface DashboardDistributionItem {
  label: string
  count: number
}

export interface DashboardRecentAppointment {
  id: number
  patient_name: string
  starts_at: string
  appointment_status: string
  billing_status: string
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary | undefined> {
    const {data} = await pamsAPI.get<DashboardSummary>("/dashboard/summary")
    return data
  },

  async getAppointmentTrend(days = 7): Promise<DashboardTrendItem[] | undefined> {
    const {data} = await pamsAPI.get<DashboardTrendItem[]>("/dashboard/appointments/trend", {
      params: {days},
    })
    return data
  },

  async getBillingDistribution(): Promise<DashboardDistributionItem[] | undefined> {
    const {data} = await pamsAPI.get<DashboardDistributionItem[]>("/dashboard/billing/distribution")
    return data
  },

  async getRecentAppointments(size = 8): Promise<DashboardRecentAppointment[] | undefined> {
    const {data} = await pamsAPI.get<DashboardRecentAppointment[]>("/dashboard/appointments/recent", {
      params: {size},
    })
    return data
  },
}
