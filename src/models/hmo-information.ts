export interface PatientHMOInformationRequest {
  sponsor_context?: "HMO" | "LGU"
  company_name?: string | null
  member_id?: string | null
  card_number?: string | null
  plan_name?: string | null
  principal_name?: string | null
  relationship_to_principal?: string | null
  approval_code?: string | null
  validity_start_date?: string | null
  validity_end_date?: string | null
  notes?: string | null
  hmo_id?: number | null
  hmo_type_id?: number | null
  lgu_program_id?: number | null
  lgu_program_name?: string | null
  referral_form_no?: string | null
  referral_issued_date?: string | null
}

export interface PatientHMOInformation extends PatientHMOInformationRequest {
  hmo_name?: string | null
  hmo_type_name?: string | null
}

export interface PatientHMOInformationHistoryEntry extends PatientHMOInformation {
  id: number
  archived_at: string
}

export interface PatientHMOInformationPayload extends PatientHMOInformationRequest{
  patient_id: number
}
