export type DailyPatientLogPrintRow = {
  id: number
  time_range: string
  date_label: string
  patient_name: string
  clinic_name: string
  service_label: string
  provider_name: string
  visit_status: string
  patient_signature?: string
  pt_signature?: string
  missing_signature_types?: Array<"patient" | "pt">
  billing_type: string
  billing_status: string
  session_label: string
}

export type DailyPatientLogSignatureException = {
  reference: string
  reason_label: string
  explanation: string
  approved_by: string
  approved_role: string
  approved_at: string
}

export type DailyPatientLogPrintPayload = {
  selected_date_label: string
  clinic_name: string
  generated_at: string
  summary: {
    total: number
    completed: number
    pending: number
    rescheduled: number
    cancelled: number
  }
  signature_exception?: DailyPatientLogSignatureException
  rows: DailyPatientLogPrintRow[]
}

export const DAILY_PATIENT_LOG_PRINT_STORAGE_PREFIX = "daily-patient-log-print:"
