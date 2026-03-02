import type {PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";

export interface BaseStaff {
  name: string
  email: string
  clinic_id: number
  role_id: number
}

export interface Staff extends BaseStaff {
  id: number
  clinic_name: string
  role_name: string
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
}

export interface StaffExportRequestParams {
  clinic_id: number | undefined,
  page_request: PageRequestWithNameAndStatus
}
