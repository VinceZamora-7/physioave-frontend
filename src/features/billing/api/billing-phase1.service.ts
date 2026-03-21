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
}

export interface BillingListItem {
  id: number
  created_at: string
  patient_id: number
  patient_name: string
  appointment_id?: number
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
}

export interface BillingRequest {
  patient_id: number
  appointment_id?: number
  package_id?: number
  billing_type: BillingType
  service_type: ServiceType
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
  async exportCsv(params: Record<string, unknown>): Promise<AxiosResponse<Blob> | undefined> {
    return await pamsAPI.get("/billings/export/csv", {
      params,
      responseType: "blob"
    })
  }
}
