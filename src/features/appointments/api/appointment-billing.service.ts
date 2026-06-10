import { pamsAPI } from "@/utils/axios-interceptor"

export type AppointmentBillingAction =
  | "CREATE_SELF_PAY_APPOINTMENT_BILL"
  | "CREATE_SELF_PAY_PACKAGE_BILL"
  | "CREATE_HMO_CLAIM"
  | "CREATE_LGU_CLAIM"
  | "CREATE_DOCUMENTATION_INVOICE"

export type AppointmentBillingChargeScope =
  | "PER_APPOINTMENT"
  | "PACKAGE_ONCE"
  | "CLAIM_PER_APPOINTMENT"
  | "SPONSOR_CLAIM"
  | "DOCUMENTATION_ONLY"

export interface AppointmentBillingPreparation {
  appointment: {
    id: number
    patient_id: number
    patient_name: string
    clinic_id: number | null
    clinic_name: string | null
    provider_name: string | null
    starts_at: string
    ends_at: string
    payer_type: "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO" | "LGU"
    credit_account_id: number | null
    hmo_id: number | null
    lgu_program_id: number | null
  }
  billing_path: {
    payer_type: "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO" | "LGU"
    action: AppointmentBillingAction
    charge_scope: AppointmentBillingChargeScope
    next_document_type: string
    status: string
    requires_tendering: boolean
    requires_loa: boolean
    requires_sponsor: boolean
    documentation_only: boolean
    allowed_service_scope: string
    message: string
  }
  consumed_services: {
    count: number
    service_types: string[]
    pricing_mode: string
    subtotal: number
  }
  existing_documents: Array<{
    id: number
    document_number: string | null
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
    count: number
  }>
}

export interface AppointmentBillingDocument {
  id: number
  document_number: string | null
  document_type: string
  document_status: string
  payer_type: string
  document_date: string
  totals: {
    subtotal: number
    discount: number
    tax: number
    total: number
    paid: number
    balance: number
  }
  lines?: AppointmentBillingDocumentLine[]
}

export interface AppointmentBillingDocumentLine {
  id: number
  line_total: number
  children?: AppointmentBillingDocumentLine[]
}

export interface PaymentMethodLookup {
  id: number
  name: string
}

export interface TenderSelfPayBillingPayload {
  amount_tendered: number
  payment_method_id: number
  payment_reference?: string | null
  notes?: string | null
  senior_pwd_id_presented?: boolean
  senior_pwd_id_reference?: string | null
  custom_discount_type?: "PERCENTAGE" | "FIXED" | null
  custom_discount_value?: number | null
}

export interface PaymentReceipt {
  id: number
  receipt_number: string | null
  receipt_status: string
  payer_type: string
  patient_id: number
  billing_document_id: number | null
  credit_account_id: number | null
  payment_method: PaymentMethodLookup | null
  payment_reference: string | null
  receipt_date: string
  amount_tendered: number
  amount_applied: number
  change_amount: number
  notes: string | null
}

export interface TenderSelfPayBillingResult {
  receipt: PaymentReceipt
  billing_document: AppointmentBillingDocument
}

export interface PrintableBillingDocumentLine {
  id: number
  parent_line_id: number | null
  credit_account_id?: number | null
  credit_item_id?: number | null
  credit_consumption_id?: number | null
  line_type: string
  type?: string
  service_name: string
  name?: string
  package_name?: string | null
  bundle_name?: string | null
  description?: string | null
  quantity: number
  unit_price: number
  unitPrice?: number
  discount_amount?: number
  line_total: number
  lineTotal?: number
  display_order?: number
  metadata?: unknown
  children?: PrintableBillingDocumentLine[]
}

export interface PrintableBillingDocument {
  header: {
    id: number
    document_number: string | null
    document_type: string
    document_status: string
    payer_type: "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO" | "LGU"
    document_date: string
    due_date?: string | null
    issued_at?: string | null
    pricing_mode?: string | null
    pricing_source?: string | null
    source_reference?: string | null
    notes?: string | null
  }
  patient: {
    id: number
    name: string
    age?: number | null
    address?: string | null
    gender?: string | null
  }
  sponsor: Record<string, unknown>
  clinic: { id: number; name: string | null } | null
  appointment: Record<string, unknown> | null
  credit_account: Record<string, unknown> | null
  lines: PrintableBillingDocumentLine[]
  totals: {
    subtotal: number
    discount: number
    tax: number
    total: number
    paid: number
    balance: number
  }
  print_flags: Record<string, boolean>
}

export const appointmentBillingService = {
  async getPaymentMethods(): Promise<PaymentMethodLookup[]> {
    const { data } = await pamsAPI.get<PaymentMethodLookup[]>("/printables/payment-methods")
    return data ?? []
  },

  async getPreparation(appointmentId: number): Promise<AppointmentBillingPreparation> {
    const { data } = await pamsAPI.get<AppointmentBillingPreparation>(
      `/printables/appointments/${appointmentId}/billing-preparation`
    )
    return data
  },

  async createSelfPayAppointmentBill(appointmentId: number): Promise<AppointmentBillingDocument> {
    const { data } = await pamsAPI.post<AppointmentBillingDocument>(
      `/printables/appointments/${appointmentId}/self-pay-appointment-bill`
    )
    return data
  },

  async createSelfPayPackageBill(appointmentId: number): Promise<AppointmentBillingDocument> {
    const { data } = await pamsAPI.post<AppointmentBillingDocument>(
      `/printables/appointments/${appointmentId}/self-pay-package-bill`
    )
    return data
  },

  async createSessionDocumentationInvoice(appointmentId: number): Promise<AppointmentBillingDocument> {
    const { data } = await pamsAPI.post<AppointmentBillingDocument>(
      `/printables/appointments/${appointmentId}/session-documentation-invoice`
    )
    return data
  },

  async createHmoClaim(appointmentId: number, payload: { loa_number?: string | null; approval_code?: string | null; notes?: string | null } = {}): Promise<AppointmentBillingDocument> {
    const { data } = await pamsAPI.post<AppointmentBillingDocument>(
      `/printables/appointments/${appointmentId}/hmo-claim`,
      payload
    )
    return data
  },

  async createLguClaim(appointmentId: number, payload: { referral_form_no?: string | null; approval_code?: string | null; notes?: string | null } = {}): Promise<AppointmentBillingDocument> {
    const { data } = await pamsAPI.post<AppointmentBillingDocument>(
      `/printables/appointments/${appointmentId}/lgu-claim`,
      payload
    )
    return data
  },

  async tenderSelfPayBillingDocument(
    billingDocumentId: number,
    payload: TenderSelfPayBillingPayload
  ): Promise<TenderSelfPayBillingResult> {
    const { data } = await pamsAPI.post<TenderSelfPayBillingResult>(
      `/printables/billing-documents/${billingDocumentId}/tender`,
      payload
    )
    return data
  },

  async getPrintableBillingDocument(billingDocumentId: number): Promise<PrintableBillingDocument> {
    const { data } = await pamsAPI.get<PrintableBillingDocument>(
      `/printables/billing-documents/${billingDocumentId}`
    )
    return data
  }
}
