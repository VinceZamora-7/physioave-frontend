import {pamsAPI} from "@/utils/axios-interceptor";
import type {Pageable} from "@/models/paging";
import type {AxiosResponse} from "axios";
import {
  lguBillingService,
  type LguBudgetSummary,
  type LguDashboardBudget,
  type LguDashboardBudgetSaveRequest,
  type LguDashboardHistoryItem,
  type LguDashboardRefreshResult,
  type LguMonthlyClaimResult,
  type LguPatientCreditDetail,
  type LguProgramLookup
} from "@/features/lgu-billing/api/lgu-billing.service";
export type {
  LguBudgetSummary,
  LguDashboardBudget,
  LguDashboardBudgetSaveRequest,
  LguDashboardHistoryItem,
  LguDashboardRefreshResult,
  LguMonthlyClaimResult,
  LguPatientAuthorization,
  LguPatientBilling,
  LguPatientCreditDetail,
  LguPatientSession,
  LguPatientAppointmentStatus,
  LguPatientPackageAvailment,
  LguProgramLookup
} from "@/features/lgu-billing/api/lgu-billing.service";

export type BillingType =
  | "SELF_PAY_SINGLE"
  | "SELF_PAY_PACKAGE"
  | "HMO_BILLING"
  | "LGU_BILLING"
export type ServiceType = "SINGLE" | "PACKAGE" | "HMO" | "LGU"
export type DiscountType = "PERCENTAGE" | "FIXED"

export interface BillingLineItem {
  id: number | string
  type: "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service" | "bundle" | "package" | "included-service"
  name: string
  price: number
  quantity: number
  originalPrice?: number
  body_area?: string
  children?: BillingLineItem[]
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
  patient_link?: string
  appointment_link?: string
  billing_type: string
  service_type: string
  service_name?: string
  line_items_json?: string
  package_id?: number
  package_name?: string
  package_group_id?: number | string
  session_sequence?: number
  session_sequence_label?: string
  total_sessions?: number
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
  hmo_id?: number
  hmo_name?: string
  hmo_type_name?: string
  hmo_company_name?: string
  hmo_loa_number?: string
  hmo_loa_date?: string
  loa_date?: string | null
  hmo_approval_code?: string
  hmo_validity_start?: string
  hmo_validity_end?: string
  // LGU enrichment (populated on detail fetch for LGU billings)
  lgu_program_name?: string
  lgu_reference_label?: string
  lgu_patient_referral_form_no?: string
  lgu_date_issued?: string
  lgu_patient_program_status?: string
  dropout_adjustment_count?: number
  dropout_adjustment_total?: number
  // Patient demographics + care team (populated on detail fetch)
  patient_address?: string
  patient_age?: string
  patient_gender?: string
  physical_therapist?: string
  doctor?: string
  diagnosis?: string
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
  pt_signature_data_url?: string
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

export interface BillingContext {
  billing: BillingListItem
  related: {
    patient_id: number
    appointment_id?: number | null
    patient_link: string
    appointment_link?: string
  }
  payment_log: BillingPaymentLogEntry[]
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
  loa_number?: string
  loa_date?: string
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

export interface HmoRecentHistoryItem {
  id: number
  created_at: string | null
  patient_id: number
  patient_name: string | null
  billing_status: string | null
  physical_therapist?: string | null
  doctor?: string | null
  diagnosis?: string | null
  service_name: string | null
  receipt_number: string | null
  hmo_loa_date?: string | null
  total_amount: number
  amount_paid: number
}

export interface HmoSoaParams {
  from: string
  to: string
  limit?: number
  hmo_id?: number
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
    unbilled_appointment_count: number
    incomplete_billing_count: number
    partial_billing_count: number
    gross_income: number
    cash_collected: number
    outstanding_balance: number
    incomplete_billing_balance: number
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
    unbilled_appointment_count: number
    incomplete_billing_count: number
    partial_billing_count: number
    gross_income: number
    cash_collected: number
    outstanding_balance: number
    incomplete_billing_balance: number
    expense_total: number
    net_cash: number
  }
  days: MonthlyIncomeExpenseDay[]
}

export interface DailyExpenseRequest {
  expense_date: string
  clinic_id?: number
  item_name: string
  amount: number
  notes?: string
}

export interface BillingPaymentLogEntry {
  id: number
  billingId: number
  amountApplied: number
  amountTendered: number
  changeGiven: number
  paymentType: string
  referenceNo: string | null
  note: string | null
  balanceBefore: number
  balanceAfter: number
  recordedBy: string
  createdAt: string
}

export interface RecordPaymentRequest {
  amountTendered: number
  paymentType: string
  referenceNo?: string
  note?: string
}

export type PackageGroupPaymentPayload = {
  amountTendered: number
  paymentType: string
  referenceNo?: string
  note?: string
}

export type PackageGroupPaymentResult = {
  package_group_id: number
  package_payment_status: string
  amount_tendered: number
  amount_applied: number
  change_given: number
  package_total: number
  package_paid: number
  package_balance: number
  paid_billing_ids: number[]
  payment_logs: Array<{
    logEntryId: number
    billingId: number
    amountApplied: number
    amountTendered: number
    changeGiven: number
    balanceBefore: number
    balanceAfter: number
    newStatus: string
  }>
}

export interface MarkAppointmentBilledRequest {
  appointment_id: number
  loa_number?: string
  loa_date?: string
}

export interface MarkAppointmentBilledResult {
  appointment_id: number
  billing_status: string
  session_scoped: boolean
}

export const billingPhase1Service = {
  async getAll(params: Record<string, unknown>): Promise<Pageable<BillingListItem> | undefined> {
    const {data} = await pamsAPI.get<Pageable<BillingListItem>>("/billings", {params})
    return data
  },

  async recordPackageGroupPayment(
  packageGroupId: number,
  payload: PackageGroupPaymentPayload
): Promise<PackageGroupPaymentResult> {
  const { data } = await pamsAPI.post<PackageGroupPaymentResult>(
    `/billings/package-groups/${packageGroupId}/pay-full`,
    payload
  )

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
  async getContext(id: number): Promise<BillingContext | undefined> {
    const {data} = await pamsAPI.get<BillingContext>(`/billings/${id}/context`)
    return data
  },
  async update(id: number, payload: BillingRequest): Promise<void> {
    await pamsAPI.put(`/billings/${id}`, payload)
  },
  async markAppointmentBilled(id: number, payload: MarkAppointmentBilledRequest): Promise<MarkAppointmentBilledResult | undefined> {
    const {data} = await pamsAPI.post<MarkAppointmentBilledResult>(`/billings/${id}/appointment-billed`, payload)
    return data
  },
  async getPaymentLog(id: number): Promise<BillingPaymentLogEntry[]> {
    const {data} = await pamsAPI.get<BillingPaymentLogEntry[]>(`/billings/${id}/payment-log`)
    return data ?? []
  },
  async recordPayment(id: number, payload: RecordPaymentRequest): Promise<void> {
    await pamsAPI.post(`/billings/${id}/payment-log`, payload)
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
    return lguBillingService.getPrograms(clinicId)
  },
  async createLguProgram(name: string, clinicId?: number): Promise<LguProgramLookup | undefined> {
    return lguBillingService.createProgram(name, clinicId)
  },
  async getLguBudgetSummary(patientId?: number, appointmentId?: number): Promise<LguBudgetSummary | null | undefined> {
    return lguBillingService.getBudgetSummary(patientId, appointmentId)
  },
  async getLguDashboardBudget(periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardBudget | null | undefined> {
    return lguBillingService.getDashboardBudget(periodYear, periodMonth, programId)
  },
  async saveLguDashboardBudget(payload: LguDashboardBudgetSaveRequest): Promise<LguDashboardBudget | null | undefined> {
    return lguBillingService.saveDashboardBudget(payload)
  },
  async refreshLguDashboardBudget(periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardRefreshResult | undefined> {
    return lguBillingService.refreshDashboardBudget(periodYear, periodMonth, programId)
  },
  async getLguDashboardHistory(limit = 100, periodYear?: number, periodMonth?: number, programId?: number): Promise<LguDashboardHistoryItem[] | undefined> {
    return lguBillingService.getDashboardHistory(limit, periodYear, periodMonth, programId)
  },
  async getHmoRecentHistory(limit = 25, hmoId?: number): Promise<HmoRecentHistoryItem[] | undefined> {
    const { data } = await pamsAPI.get<HmoRecentHistoryItem[]>("/billings/hmo-recent-history", {
      params: { limit, hmo_id: hmoId }
    })
    return data
  },
  async getHmoSoa(params: HmoSoaParams): Promise<HmoRecentHistoryItem[] | undefined> {
    const { data } = await pamsAPI.get<HmoRecentHistoryItem[]>("/billings/hmo-recent-history", { params })
    return data
  },
  async getLguSoa(params: { from: string; to: string; limit?: number; program_id?: number }): Promise<LguDashboardHistoryItem[] | undefined> {
    return lguBillingService.getSoa(params)
  },
    async getLguPatientCreditDetail(patientId: number, periodYear?: number, periodMonth?: number): Promise<LguPatientCreditDetail | null | undefined> {
      return lguBillingService.getPatientCreditDetail(patientId, periodYear, periodMonth)
    },
  async getDailyIncomeExpense(date?: string, clinic_id?: number): Promise<DailyIncomeExpenseReport | undefined> {
    const {data} = await pamsAPI.get<DailyIncomeExpenseReport>("/daily-income-expense", {
      params: {date, ...(clinic_id ? {clinic_id} : {})}
    })
    return data
  },
  async getMonthlyIncomeExpense(month?: string, date?: string, clinic_id?: number): Promise<MonthlyIncomeExpenseReport | undefined> {
    const {data} = await pamsAPI.get<MonthlyIncomeExpenseReport>("/monthly-income-expense", {
      params: {month, date, ...(clinic_id ? {clinic_id} : {})}
    })
    return data
  },
  async addDailyExpense(payload: DailyExpenseRequest): Promise<DailyExpenseEntry | undefined> {
    const {data} = await pamsAPI.post<DailyExpenseEntry>("/daily-income-expense/expenses", payload)
    return data
  },
  async deleteDailyExpense(id: number): Promise<void> {
    await pamsAPI.delete(`/daily-income-expense/expenses/${id}`)
  },
  async createLguMonthlyClaim(payload: { appointment_id?: number; billing_id?: number; billing_month: string }): Promise<LguMonthlyClaimResult | undefined> {
    return lguBillingService.createMonthlyClaim(payload)
  },
  async createLguPatientClaim(payload: { patient_id: number; billing_month: string }): Promise<LguMonthlyClaimResult | undefined> {
    return lguBillingService.createPatientClaim(payload)
  },
  async exportCsv(params: Record<string, unknown>): Promise<AxiosResponse<Blob> | undefined> {
    return await pamsAPI.get("/billings/export/csv", {
      params,
      responseType: "blob"
    })
  }
}
