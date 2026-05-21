import { pamsAPI } from "@/utils/axios-interceptor"

export interface LguProgramLookup {
  id: number
  name: string
  clinic_id?: number | null
}

export interface LguBudgetSummary {
  period_id: number
  program_id: number
  clinic_id?: number | null
  program_name: string
  period_year: number
  period_month: number
  period_status: string
  total_budget: number
  used_amount: number
  remaining_amount: number
  reference_date: string
}

export interface LguDashboardBudget {
  period_id: number
  program_id: number
  clinic_id?: number | null
  program_name: string
  period_year: number
  period_month: number
  base_budget: number
  rollover_amount: number
  total_budget: number
  used_amount: number
  remaining_amount: number
  period_status: string
}

export interface LguDashboardBudgetSaveRequest {
  base_budget: number
  rollover_amount: number
  period_year?: number
  period_month?: number
  program_id?: number
  program_name?: string
}

export interface LguDashboardRefreshResult {
  reversed_entries: number
  refreshed_periods: number
}

export interface LguPatientSession {
  id: number
  appointment_id: number
  session_sequence: number
  service_name: string
  appointment_date: string
  billing_month: string
  is_dropout_billed: boolean
  is_monthly_billed: boolean
  dropout_billing_id?: number | null
  monthly_billing_id?: number | null
}

export interface LguPatientBilling {
  id: number
  public_id?: string
  service_name?: string | null
  amount_due: number
  billing_status: string
  pricing_source?: string | null
  created_at: string
}

export interface LguPatientAuthorization {
  authorization_id: number
  package_name: string
  authorization_status: string
  total_sessions: number
  consumed_sessions: number
  billed_sessions: number
  expires_at?: string | null
  sessions: LguPatientSession[]
}

export interface LguPatientAppointmentStatus {
  appointment_id: number
  appointment_date: string
  package_name?: string | null
  availed_services: string[]
  status: "PENDING" | "COMPLETED" | "DROPPED_OUT" | "CROSS_MONTH_DROPPED_OUT"
}

export interface LguPatientPackageAvailment {
  authorization_id: number
  package_name: string
  availed_count: number
  used_count: number
  available_balance: number
  expiry_date?: string | null
  status: string
}

export interface LguPatientCreditDetail {
  patient_id: number
  patient_name: string
  dropout_status?: string | null
  appointments: LguPatientAppointmentStatus[]
  package_availments: LguPatientPackageAvailment[]
  authorizations: LguPatientAuthorization[]
  billings: LguPatientBilling[]
}

export interface LguDashboardHistoryItem {
  id: number
  created_at: string
  program_name: string
  period_year: number
  period_month: number
  patient_id?: number | null
  patient_public_id?: string | null
  patient_name?: string | null
  phase1_billing_id?: number | null
  phase1_billing_public_id?: string | null
  billing_status?: string | null
  service_name?: string | null
  receipt_number?: string | null
  entry_type: string
  usage_status: string
  amount_in: number
  amount_out: number
  balance_after?: number | null
  reference_label?: string | null
  notes?: string | null
}

export interface LguMonthlyClaimResult {
  billing_id: number
  billing_public_id: string
  consumed_count: number
  billing_month: string
}

export const lguBillingService = {
  async getPrograms(clinicId?: number): Promise<LguProgramLookup[] | undefined> {
    const { data } = await pamsAPI.get<LguProgramLookup[]>("/lgu-billing/programs", {
      params: { clinic_id: clinicId }
    })
    return data
  },
  async createProgram(name: string, clinicId?: number): Promise<LguProgramLookup | undefined> {
    const { data } = await pamsAPI.post<LguProgramLookup>("/lgu-billing/programs", {
      name,
      ...(clinicId ? { clinic_id: clinicId } : {})
    })
    return data
  },
  async getBudgetSummary(patientId?: number, appointmentId?: number): Promise<LguBudgetSummary | null | undefined> {
    if (!patientId) return null
    const { data } = await pamsAPI.get<LguBudgetSummary | null>("/lgu-billing/budget-summary", {
      params: { patient_id: patientId, appointment_id: appointmentId }
    })
    return data
  },
  async getDashboardBudget(periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardBudget | null | undefined> {
    const { data } = await pamsAPI.get<LguDashboardBudget | null>("/lgu-billing/dashboard-budget", {
      params: { period_year: periodYear, period_month: periodMonth, program_id: programId }
    })
    return data
  },
  async saveDashboardBudget(payload: LguDashboardBudgetSaveRequest): Promise<LguDashboardBudget | null | undefined> {
    const { data } = await pamsAPI.post<LguDashboardBudget | null>("/lgu-billing/dashboard-budget", payload)
    return data
  },
  async refreshDashboardBudget(periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardRefreshResult | undefined> {
    const { data } = await pamsAPI.post<LguDashboardRefreshResult>("/lgu-billing/dashboard-budget/refresh", {
      period_year: periodYear,
      period_month: periodMonth,
      program_id: programId
    })
    return data
  },
  async getDashboardHistory(limit = 100, periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardHistoryItem[] | undefined> {
    const { data } = await pamsAPI.get<LguDashboardHistoryItem[]>("/lgu-billing/dashboard-history", {
      params: { limit, period_year: periodYear, period_month: periodMonth, program_id: programId }
    })
    return data
  },
  async getSoa(params: { from: string; to: string; limit?: number; program_id?: number }): Promise<LguDashboardHistoryItem[] | undefined> {
    const { data } = await pamsAPI.get<LguDashboardHistoryItem[]>("/lgu-billing/soa", { params })
    return data
  },
  async getPatientCreditDetail(patientId: number, periodYear?: number, periodMonth?: number): Promise<LguPatientCreditDetail | null | undefined> {
    const { data } = await pamsAPI.get<LguPatientCreditDetail | null>("/lgu-billing/patient-credit-detail", {
      params: {
        patient_id: patientId,
        ...(periodYear ? { period_year: periodYear } : {}),
        ...(periodMonth ? { period_month: periodMonth } : {})
      }
    })
    return data
  },
  async createMonthlyClaim(payload: { appointment_id?: number; billing_id?: number; billing_month: string }): Promise<LguMonthlyClaimResult | undefined> {
    const { data } = await pamsAPI.post<LguMonthlyClaimResult>("/lgu-billing/monthly-claims", payload)
    return data
  },
  async createPatientClaim(payload: { patient_id: number; billing_month: string }): Promise<LguMonthlyClaimResult | undefined> {
    const { data } = await pamsAPI.post<LguMonthlyClaimResult>("/lgu-billing/patient-claims", payload)
    return data
  }
}
