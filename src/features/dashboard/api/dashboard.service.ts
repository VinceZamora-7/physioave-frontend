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

export interface DashboardConfidentialRevenue {
  lgu_revenue: number
  online_marketing_revenue: number
  direct_marketing_revenue: number
}

export interface DashboardPtAttendanceDay {
  date: string
  count: number
}

export interface DashboardPtAttendancePeriod {
  from: string
  to: string
  attendance_count: number
  days: DashboardPtAttendanceDay[]
}

export interface DashboardPtAttendance {
  staff_id: number
  staff_name: string
  weekly: DashboardPtAttendancePeriod
  monthly: DashboardPtAttendancePeriod
}

const branchParams = (clinicId?: number): Record<string, unknown> =>
  clinicId ? {clinic_id: clinicId} : {all_branches: true}

export const dashboardService = {
  async getSummary(clinicId?: number): Promise<DashboardSummary | undefined> {
    const {data} = await pamsAPI.get<DashboardSummary>("/dashboard/summary", {
      params: branchParams(clinicId),
    })
    return data
  },

  async getAppointmentTrend(days = 7, clinicId?: number): Promise<DashboardTrendItem[] | undefined> {
    const {data} = await pamsAPI.get<DashboardTrendItem[]>("/dashboard/appointments/trend", {
      params: {days, ...branchParams(clinicId)},
    })
    return data
  },

  async getBillingDistribution(clinicId?: number): Promise<DashboardDistributionItem[] | undefined> {
    const {data} = await pamsAPI.get<DashboardDistributionItem[]>("/dashboard/billing/distribution", {
      params: branchParams(clinicId),
    })
    return data
  },

  async getRecentAppointments(size = 8, clinicId?: number): Promise<DashboardRecentAppointment[] | undefined> {
    const {data} = await pamsAPI.get<DashboardRecentAppointment[]>("/dashboard/appointments/recent", {
      params: {size, ...branchParams(clinicId)},
    })
    return data
  },

  async getConfidentialRevenue(clinicId?: number): Promise<DashboardConfidentialRevenue | undefined> {
    const {data} = await pamsAPI.get<DashboardConfidentialRevenue>("/dashboard/confidential-revenue", {
      params: branchParams(clinicId),
    })
    return data
  },

  async getPtAttendance(clinicId?: number): Promise<DashboardPtAttendance | undefined> {
    const {data} = await pamsAPI.get<DashboardPtAttendance>("/dashboard/pt/attendance", {
      params: branchParams(clinicId),
    })
    return data
  },
}
