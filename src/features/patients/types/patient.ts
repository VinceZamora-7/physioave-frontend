import type {PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";
import type {UUID} from "@/utils/global.type.ts";

export interface BasePatient {
  first_name: string
  middle_name?: string
  last_name: string
  age: number
  gender_id: number
  civil_status_id: number
  occupation?: string
  religion_id?: number
  mode_of_referral_id?: number
  referred_by?: string
  clinic_id: number

  // Contact information
  phone_number: string
  email?: string
  fb_link?: string

  // Address information
  region_id?: number
  region_name?: string
  province_id?: number
  province_name?: string
  city_id?: number
  city_name?: string
  baranggay_id?: number
  baranggay_name?: string

  details?: string
  folder: UUID
}

export interface Patient extends BasePatient {
  id: number
  public_id?: string

  gender_name: string
  civil_status_name: string
  religion_name?: string
  mode_of_referral_name?: string
  clinic_name: string

  is_active: boolean
  full_name: string
}

export interface PatientRequestBody extends BasePatient {
}

export interface PatientEditRequestPayload extends PatientRequestBody {
  id: number
}

export interface PatientRequestParams {
  pageable_request: PageableRequest
  clinic_id: number | undefined
}

export interface PatientExportRequestParams {
  clinic_id: number | undefined,
  page_request: PageRequestWithNameAndStatus
}
