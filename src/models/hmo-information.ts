export interface PatientHMOInformationRequest {
  company_name: string
  member_id?: string
  card_number?: string
  plan_name?: string
  principal_name?: string
  relationship_to_principal?: string
  approval_code?: string
  validity_start_date?: string
  validity_end_date?: string
  notes?: string
  hmo_id: number
  hmo_type_id: number
}

export interface PatientHMOInformation extends PatientHMOInformationRequest {
  hmo_name: string
  hmo_type_name: string
}

export interface PatientHMOInformationHistoryEntry extends PatientHMOInformation {
  id: number
  archived_at: string
}

export interface PatientHMOInformationPayload extends PatientHMOInformationRequest{
  patient_id: number
}
