import {pamsAPI} from "@/utils/axios-interceptor";
import type {Pageable} from "@/models/paging";
import type {AxiosResponse} from "axios";

export type BillingType =
  | "INDIVIDUAL_PRICING"
  | "PACKAGE_BILLING"
  | "ALA_CARTE"
  | "SELF_PAY_SINGLE"
  | "SELF_PAY_PACKAGE"
  | "HMO_BILLING"
  | "LGU_BILLING"
export type ServiceType = "SINGLE" | "PACKAGE" | "HMO" | "LGU"
export type DiscountType = "PERCENTAGE" | "FIXED"

export interface BillingLineItem {
  id: number | string
  type: "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service" | "bundle" | "package"
  name: string
  price: number
  quantity: number
  originalPrice?: number
  body_area?: string
}

export interface BillingListItem {
  id: number
  public_id?: string
  created_at: string
  patient_id: number
  patient_public_id?: string
  patient_name: string
  appointment_id?: number
  appointment_public_id?: string
  billing_type: string
  service_type: string
  service_name?: string
  line_items_json?: string
  package_id?: number
  package_name?: string
  billing_status: string
  amount_due: number
  amount_paid: number
  payment_method_id?: number
  payment_method_name?: string
  payment_reference?: string
  discount_type?: DiscountType
  discount_value?: number
  discount_amount?: number
  subtotal_amount?: number
  total_amount?: number
  amount_tendered?: number
  change_amount?: number
  pricing_tier?: string
  pricing_source?: string
  receipt_number?: string
  senior_pwd_id_presented?: boolean
  senior_pwd_id_reference?: string
  // VAT (hidden/non-VAT mode)
  vat_enabled?: boolean
  vat_rate?: number
  vatable_amount?: number
  vat_amount?: number
  // HMO enrichment (populated on detail fetch for HMO billings)
  hmo_name?: string
  hmo_type_name?: string
  hmo_company_name?: string
  hmo_approval_code?: string
  hmo_validity_start?: string
  hmo_validity_end?: string
  // LGU enrichment (populated on detail fetch for LGU billings)
  lgu_program_name?: string
  lgu_reference_label?: string
  lgu_date_issued?: string
  dropout_adjustment_count?: number
  dropout_adjustment_total?: number
  // Patient demographics + care team (populated on detail fetch)
  patient_address?: string
  patient_age?: string
  patient_gender?: string
  physical_therapist?: string
  doctor?: string
  encounter_tickets?: BillingEncounterTicket[]
}

export interface BillingEncounterTicket {
  id: number
  appointment_id: number
  appointment_public_id?: string
  patient_id: number
  patient_public_id?: string
  phase1_billing_id?: number
  phase1_billing_public_id?: string
  active_billing_package_id?: string
  active_billing_package_name?: string
  active_billing_package_source?: string
  attendance_status: "ATTENDED" | "NO_SHOW"
  attended_at: string
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
    session_sequence_label?: string
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

export interface BillingRequest {
  patient_id: number
  appointment_id?: number
  package_id?: number
  billing_type: BillingType
  service_type: ServiceType
  billing_status?: string
  service_name?: string
  line_items_json?: string
  amount_due: number
  amount_paid: number
  notes?: string
  payment_method_id?: number
  payment_reference?: string
  discount_type?: DiscountType
  discount_value?: number
  discount_amount?: number
  subtotal_amount?: number
  total_amount?: number
  amount_tendered?: number
  change_amount?: number
  pricing_tier?: string
  pricing_source?: string
  receipt_number?: string
  senior_pwd_id_presented?: boolean
  senior_pwd_id_reference?: string
  // VAT (hidden/non-VAT mode; prepared for future VAT compliance)
  vat_enabled?: boolean
  vat_rate?: number
  vatable_amount?: number
  vat_amount?: number
}

export interface PackageLookup {
  id: number
  name: string
  price: number
  display_order: number
}

export interface PaymentMethodLookup {
  id: number
  name: string
}

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
  status: "COMPLETED" | "PENDING" | "DROPPED_OUT"
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

export interface DailyIncomeExpenseRow {
  id: number
  public_id: string
  created_at: string
  patient_id: number
  patient_public_id: string
  patient_name: string
  pt_service: string
  billing_route: string
  payment_amount: number
  collected_amount: number
  mode_of_payment?: string
  sponsor_reference?: string
  balance: number
  due_date?: string | null
  invoice_number: string
  billing_status: string
}

export interface DailyExpenseEntry {
  id: number
  expense_date: string
  item_name: string
  amount: number
  notes?: string
  created_by_name?: string
  created_at: string
}

export interface DailyIncomeExpenseReport {
  selected_date: string
  summary: {
    income_entry_count: number
    expense_entry_count: number
    gross_income: number
    cash_collected: number
    outstanding_balance: number
    expense_total: number
    net_cash: number
  }
  incomes: DailyIncomeExpenseRow[]
  expenses: DailyExpenseEntry[]
}

export interface MonthlyIncomeExpenseDay {
  report_date: string
  income_entry_count: number
  expense_entry_count: number
  gross_income: number
  cash_collected: number
  outstanding_balance: number
  expense_total: number
  net_cash: number
}

export interface MonthlyIncomeExpenseReport {
  selected_month: string
  summary: {
    active_day_count: number
    days_with_income: number
    days_with_expenses: number
    income_entry_count: number
    expense_entry_count: number
    gross_income: number
    cash_collected: number
    outstanding_balance: number
    expense_total: number
    net_cash: number
  }
  days: MonthlyIncomeExpenseDay[]
}

export interface LguMonthlyClaimResult {
  billing_id: number
  billing_public_id: string
  consumed_count: number
  billing_month: string
}

export interface DailyExpenseRequest {
  expense_date: string
  item_name: string
  amount: number
  notes?: string
}

export const billingPhase1Service = {
  async getAll(params: Record<string, unknown>): Promise<Pageable<BillingListItem> | undefined> {
    const {data} = await pamsAPI.get<Pageable<BillingListItem>>("/billings", {params})
    return data
  },
  async save(payload: BillingRequest): Promise<number | undefined> {
    const {data} = await pamsAPI.post<number>("/billings", payload)
    return data
  },
  async getById(id: number): Promise<BillingListItem | undefined> {
    const {data} = await pamsAPI.get<BillingListItem>(`/billings/${id}`)
    return data
  },
  async update(id: number, payload: BillingRequest): Promise<void> {
    await pamsAPI.put(`/billings/${id}`, payload)
  },
  async delete(id: number): Promise<void> {
    await pamsAPI.delete(`/billings/${id}`)
  },
  async getPackages(name?: string): Promise<PackageLookup[] | undefined> {
    const {data} = await pamsAPI.get<PackageLookup[]>("/billings/packages", {params: {name}})
    return data
  },
  async getPaymentMethods(): Promise<PaymentMethodLookup[] | undefined> {
    const {data} = await pamsAPI.get<PaymentMethodLookup[]>("/billings/payment-methods")
    return data
  },
  async getLguPrograms(clinicId?: number): Promise<LguProgramLookup[] | undefined> {
    const {data} = await pamsAPI.get<LguProgramLookup[]>("/billings/lgu-programs", {
      params: {
        clinic_id: clinicId
      }
    })
    return data
  },
  async createLguProgram(name: string, clinicId?: number): Promise<LguProgramLookup | undefined> {
    const {data} = await pamsAPI.post<LguProgramLookup>("/billings/lgu-programs", {
      name,
      ...(clinicId ? { clinic_id: clinicId } : {})
    })
    return data
  },
  async getLguBudgetSummary(patientId?: number, appointmentId?: number): Promise<LguBudgetSummary | null | undefined> {
    if (!patientId) return null
    const {data} = await pamsAPI.get<LguBudgetSummary | null>("/billings/lgu-budget-summary", {
      params: {
        patient_id: patientId,
        appointment_id: appointmentId
      }
    })
    return data
  },
  async getLguDashboardBudget(periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardBudget | null | undefined> {
    const {data} = await pamsAPI.get<LguDashboardBudget | null>("/billings/lgu-dashboard-budget", {
      params: {
        period_year: periodYear,
        period_month: periodMonth,
        program_id: programId
      }
    })
    return data
  },
  async saveLguDashboardBudget(payload: LguDashboardBudgetSaveRequest): Promise<LguDashboardBudget | null | undefined> {
    const {data} = await pamsAPI.post<LguDashboardBudget | null>("/billings/lgu-dashboard-budget", payload)
    return data
  },
  async refreshLguDashboardBudget(periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardRefreshResult | undefined> {
    const {data} = await pamsAPI.post<LguDashboardRefreshResult>("/billings/lgu-dashboard-budget/refresh", {
      period_year: periodYear,
      period_month: periodMonth,
      program_id: programId
    })
    return data
  },
  async getLguDashboardHistory(limit = 100, periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardHistoryItem[] | undefined> {
    const {data} = await pamsAPI.get<LguDashboardHistoryItem[]>("/billings/lgu-dashboard-history", {
      params: {
        limit,
        period_year: periodYear,
        period_month: periodMonth,
        program_id: programId
      }
    })
    return data
  },
    async getLguPatientCreditDetail(patientId: number): Promise<LguPatientCreditDetail | null | undefined> {
      const {data} = await pamsAPI.get<LguPatientCreditDetail | null>("/billings/lgu-patient-credit-detail", {
        params: {patient_id: patientId}
      })
      return data
    },
  async getDailyIncomeExpense(date?: string): Promise<DailyIncomeExpenseReport | undefined> {
    const {data} = await pamsAPI.get<DailyIncomeExpenseReport>("/billings/daily-income-expense", {
      params: {date}
    })
    return data
  },
  async getMonthlyIncomeExpense(month?: string, date?: string): Promise<MonthlyIncomeExpenseReport | undefined> {
    const {data} = await pamsAPI.get<MonthlyIncomeExpenseReport>("/billings/monthly-income-expense", {
      params: {month, date}
    })
    return data
  },
  async addDailyExpense(payload: DailyExpenseRequest): Promise<DailyExpenseEntry | undefined> {
    const {data} = await pamsAPI.post<DailyExpenseEntry>("/billings/daily-income-expense/expenses", payload)
    return data
  },
  async deleteDailyExpense(id: number): Promise<void> {
    await pamsAPI.delete(`/billings/daily-income-expense/expenses/${id}`)
  },
  async createLguMonthlyClaim(payload: { appointment_id?: number; billing_id?: number; billing_month: string }): Promise<LguMonthlyClaimResult | undefined> {
    const { data } = await pamsAPI.post<LguMonthlyClaimResult>("/billings/lgu-monthly-claims", payload)
    return data
  },
  async createLguPatientClaim(payload: { patient_id: number; billing_month: string }): Promise<LguMonthlyClaimResult | undefined> {
    const { data } = await pamsAPI.post<LguMonthlyClaimResult>("/billings/lgu-patient-claims", payload)
    return data
  },
  async exportCsv(params: Record<string, unknown>): Promise<AxiosResponse<Blob> | undefined> {
    return await pamsAPI.get("/billings/export/csv", {
      params,
      responseType: "blob"
    })
  }
}
