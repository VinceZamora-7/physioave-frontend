import {pamsAPI} from "@/utils/axios-interceptor";
import type {Pageable} from "@/models/paging";
import type {AxiosResponse} from "axios";

export type BillingType = "INDIVIDUAL_PRICING" | "PACKAGE_BILLING" | "ALA_CARTE"
export type ServiceType = "SINGLE" | "PACKAGE" | "HMO"

export interface BillingListItem {
  id: number
  created_at: string
  patient_id: number
  patient_name: string
  appointment_id?: number
  billing_type: string
  service_type: string
  service_name?: string
  package_id?: number
  package_name?: string
  billing_status: string
  amount_due: number
  amount_paid: number
}

export interface BillingRequest {
  patient_id: number
  appointment_id?: number
  package_id?: number
  billing_type: BillingType
  service_type: ServiceType
  service_name?: string
  amount_due: number
  amount_paid: number
  notes?: string
}

export interface PackageLookup {
  id: number
  name: string
  price: number
  display_order: number
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
  async update(id: number, payload: BillingRequest): Promise<void> {
    await pamsAPI.put(`/billings/${id}`, payload)
  },
  async getPackages(name?: string): Promise<PackageLookup[] | undefined> {
    const {data} = await pamsAPI.get<PackageLookup[]>("/billings/packages", {params: {name}})
    return data
  },
  async exportCsv(params: Record<string, unknown>): Promise<AxiosResponse<Blob> | undefined> {
    return await pamsAPI.get("/billings/export/csv", {
      params,
      responseType: "blob"
    })
  }
}

