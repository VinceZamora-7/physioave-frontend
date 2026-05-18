import type {PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";
import type {AppointmentProviderType} from "@/models/reference.ts";

export interface BaseStaff {
  name: string
  email: string
  clinic_id: number
  role_id: number
  can_view_all_branches?: boolean
  secondary_role_id?: number
  specialty_tag_id?: number
}

export interface Staff extends BaseStaff {
  id: number
  clinic_name: string
  role_name: string
  appointment_provider_type: AppointmentProviderType
  requires_specialty_tag: boolean
  secondary_role_id?: number
  secondary_role_name?: string
  secondary_appointment_provider_type?: AppointmentProviderType
  specialty_tag_name?: string
  can_view_all_branches?: boolean
  last_seen_at?: string | null
  is_online?: boolean
  is_active: boolean
}

export interface StaffRequestBody extends BaseStaff {
}

export interface StaffEditRequestPayload extends StaffRequestBody {
  id: number
}

export interface StaffRequestParams {
  pageable_request: PageableRequest
  clinic_id: number | undefined
  highest_only?: boolean
  staff_scope?: "ALL" | "PT" | "ADMIN"
}

export interface StaffExportRequestParams {
  clinic_id: number | undefined,
  page_request: PageRequestWithNameAndStatus
  highest_only?: boolean
  staff_scope?: "ALL" | "PT" | "ADMIN"
}
