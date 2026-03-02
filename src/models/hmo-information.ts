export interface PatientHMOInformationRequest {
  company_name: string
  hmo_id: number
  hmo_type_id: number
}

export interface PatientHMOInformation extends PatientHMOInformationRequest {
  hmo_name: string
  hmo_type_name: string
}

export interface PatientHMOInformationPayload extends PatientHMOInformationRequest{
  patient_id: number
}
