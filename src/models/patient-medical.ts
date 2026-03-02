import type {PageRequest} from "@/models/paging.ts";
import type {Attachment} from "@/models/global.model.ts";

export interface PatientMedicalBase {
  patient_id: number
}

export interface PatientMedicalCategoryPayload extends PatientMedicalBase {
  medical_category_id: number
}

export interface PatientMedicalDiagnosePayload extends PatientMedicalBase {
  medical_diagnose_id: number
}

export interface PatientMedicalHistoryPayload extends PatientMedicalBase {
  medical_history_id: number
}

export interface PatientMedicalImagingDeletePayload extends PatientMedicalBase {
  medical_imaging_id: number
}

export interface PatientMedicalImagingPayload extends PatientMedicalImagingDeletePayload {
  attachment: Attachment
}

export interface PatientMedicalCategory extends PatientMedicalCategoryPayload {
  medical_category_name: string
}

export interface PatientMedicalDiagnose extends PatientMedicalDiagnosePayload {
  medical_diagnose_name: string
}

export interface PatientMedicalHistory extends PatientMedicalHistoryPayload {
  medical_history_name: string
}

export interface PatientMedicalImaging extends PatientMedicalImagingDeletePayload, Attachment {
  medical_imaging_name: string
}

export interface PatientMedicalRequestPayload {
  patient_id: number
  page_request: PageRequest
}
