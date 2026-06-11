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
  package_name?: string | null
  line_items_json?: string | null
  consumed_services_json?: string | null
  amount_due: number
  billing_status: string
  pricing_source?: string | null
  created_at: string
}

export interface LguPatientAuthorization {
  authorization_id: number
  phase1_billing_id?: number | null
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
  referral_form_no?: string | null
  treatment_date?: string | null
  session_sequence?: number | null
  total_sessions?: number | null
  billing_status?: string | null
  billing_amount_due?: number | null
  amount_paid?: number | null
  program_status?: string | null
  pricing_source?: string | null
  physical_therapist?: string | null
  doctor?: string | null
  diagnosis?: string | null
  service_name?: string | null
  package_name?: string | null
  line_items_json?: string | null
  consumed_services_json?: string | null
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

type LguSoaBillingRow = {
  id: number
  public_id?: string
  created_at: string
  patient_id?: number | null
  patient_public_id?: string | null
  patient_name?: string | null
  appointment_id?: number | null
  session_sequence?: number | null
  total_sessions?: number | null
  billing_status?: string | null
  amount_due?: number | null
  amount_paid?: number | null
  total_amount?: number | null
  pricing_source?: string | null
  physical_therapist?: string | null
  doctor?: string | null
  diagnosis?: string | null
  service_name?: string | null
  package_name?: string | null
  line_items_json?: string | null
  receipt_number?: string | null
  lgu_program_name?: string | null
  lgu_reference_label?: string | null
  lgu_patient_referral_form_no?: string | null
  lgu_patient_program_status?: string | null
}

export interface LguPackageCredit {
  id: number
  package_group_id: number
  service_id?: number | string | null
  service_type?: string | null
  service_name: string
  total_quantity: number
  consumed_quantity: number
  remaining_quantity: number
}

export interface LguPackageCreditsResult {
  package_group_id: number
  credits: LguPackageCredit[]
}

const parseDatePart = (value?: string | null): string | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toISOString().slice(0, 10)
}

const parseLineItems = (value?: string | null): Array<Record<string, unknown>> => {
  if (!value) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      : []
  } catch {
    return []
  }
}

const flattenLineItems = (
  lines: Array<Record<string, unknown>>
): Array<Record<string, unknown>> => {
  const output: Array<Record<string, unknown>> = []

  const walk = (items: Array<Record<string, unknown>>): void => {
    for (const item of items) {
      output.push(item)

      const children = item.children
      if (Array.isArray(children)) {
        walk(children.filter((child): child is Record<string, unknown> => !!child && typeof child === "object"))
      }
    }
  }

  walk(lines)
  return output
}

const getFirstLineText = (
  lines: Array<Record<string, unknown>>,
  keys: string[]
): string | null => {
  const flattened = flattenLineItems(lines)

  for (const line of flattened) {
    for (const key of keys) {
      const value = line[key]
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value)
      }
    }
  }

  return null
}

const mapBillingRowToSoaItem = (
  row: LguSoaBillingRow,
  fallbackYear: number,
  fallbackMonth: number
): LguDashboardHistoryItem => {
  const lineItems = parseLineItems(row.line_items_json)
  const hasLineItems = lineItems.length > 0

  const treatmentDate =
    getFirstLineText(lineItems, ["treatment_date", "service_date", "date"]) ??
    parseDatePart(row.created_at)

  return {
    id: Number(row.id),
    created_at: row.created_at,
    program_name: String(row.lgu_program_name ?? ""),
    period_year: fallbackYear,
    period_month: fallbackMonth,
    patient_id: row.patient_id ?? null,
    patient_public_id: row.patient_public_id ?? null,
    patient_name: row.patient_name ?? null,
    phase1_billing_id: Number(row.id),
    phase1_billing_public_id: row.public_id ?? null,
    referral_form_no: row.lgu_patient_referral_form_no ?? row.lgu_reference_label ?? null,
    treatment_date: treatmentDate,
    session_sequence: row.session_sequence ?? null,
    total_sessions: row.total_sessions ?? null,
    billing_status: row.billing_status ?? null,
    billing_amount_due: Number(row.total_amount ?? row.amount_due ?? 0),
    amount_paid: Number(row.amount_paid ?? 0),
    program_status: row.lgu_patient_program_status ?? null,
    pricing_source: row.pricing_source ?? null,
    physical_therapist: row.physical_therapist ?? null,
    doctor: row.doctor ?? null,
    diagnosis: row.diagnosis ?? null,

    // Keep fallback so SOA does not become empty when /billings has no line_items_json.
    service_name: hasLineItems
      ? row.service_name ?? null
      : row.service_name ?? getFirstLineText(lineItems, ["service_name", "name"]) ?? null,

    package_name: row.package_name ?? getFirstLineText(lineItems, ["package_name"]) ?? null,

    // Important: SOA print should use this to render bundle/child hierarchy.
    line_items_json: row.line_items_json ?? null,
    consumed_services_json: row.line_items_json ?? null,

    receipt_number: row.receipt_number ?? null,
    entry_type: "SESSION_CHARGE",
    usage_status: row.billing_status ?? "BILLED",
    amount_in: 0,
    amount_out: Number(row.total_amount ?? row.amount_due ?? 0),
    reference_label: row.public_id ?? null,
    notes: null
  }
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
      params: {
        limit,
        period_year: periodYear,
        period_month: periodMonth,
        program_id: programId
      }
    })

    return data
  },

  async getSoa(params: {
    from: string
    to: string
    limit?: number
    program_id?: number
  }): Promise<LguDashboardHistoryItem[] | undefined> {
    const fromDate = new Date(params.from)
    const fallbackYear = Number.isNaN(fromDate.getTime())
      ? new Date().getFullYear()
      : fromDate.getFullYear()
    const fallbackMonth = Number.isNaN(fromDate.getTime())
      ? new Date().getMonth() + 1
      : fromDate.getMonth() + 1

    const maxRows = Math.max(1, Number(params.limit ?? 5000))
    const pageSize = Math.min(500, maxRows)
    const rows: LguSoaBillingRow[] = []

    let page = 1
    let hasNextPage = true

    while (rows.length < maxRows && hasNextPage) {
      const { data } = await pamsAPI.get<{
        content?: LguSoaBillingRow[]
        has_next_page?: boolean
        next_page?: number | null
      }>("/billings", {
        params: {
          page,
          size: pageSize,
          billing_type: "LGU_BILLING",
          from_date: params.from,
          to_date: params.to,
          ...(params.program_id ? { lgu_program_id: params.program_id } : {})
        }
      })

      const pageRows = data.content ?? []
      rows.push(...pageRows)

      hasNextPage = Boolean(data.has_next_page) && pageRows.length > 0
      page = Number(data.next_page ?? page + 1)
    }

    return rows
      .slice(0, maxRows)
      .map(row => mapBillingRowToSoaItem(row, fallbackYear, fallbackMonth))
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

  async createMonthlyClaim(payload: {
    appointment_id?: number
    billing_id?: number
    billing_month: string
  }): Promise<LguMonthlyClaimResult | undefined> {
    const { data } = await pamsAPI.post<LguMonthlyClaimResult>("/lgu-billing/monthly-claims", payload)
    return data
  },

  async createPatientClaim(payload: {
    patient_id: number
    billing_month: string
  }): Promise<LguMonthlyClaimResult | undefined> {
    const { data } = await pamsAPI.post<LguMonthlyClaimResult>("/lgu-billing/patient-claims", payload)
    return data
  },

  async getPackageGroupCredits(packageGroupId: number | string): Promise<LguPackageCreditsResult | undefined> {
    const { data } = await pamsAPI.get<LguPackageCreditsResult>(`/lgu/package-groups/${packageGroupId}/credits`)
    return data
  }
}
