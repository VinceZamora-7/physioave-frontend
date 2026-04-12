import { pamsAPI } from "@/utils/axios-interceptor.ts"

export interface PatientEvaluationVisitLogAttachment {
  file_id: string
  checksum: string
  media_type: string
  extension: string
  file_url?: string
}

export interface PatientEvaluationVisitLogItem {
  id: number
  patient_id: number
  visit_date: string
  medical_category?: string | null
  doctor_diagnosis?: string | null
  doctor_diagnosis_laterality?: string | null
  pt_case_impression?: string | null
  pt_case_impression_laterality?: string | null
  subjective?: string | null
  objective?: string | null
  assessment?: string | null
  plan?: string | null
  ancillary_record_type?: string | null
  ancillary_attachment?: PatientEvaluationVisitLogAttachment | null
  digital_posture_attachment?: PatientEvaluationVisitLogAttachment | null
}

export interface PatientEvaluationVisitLogAttachmentUploadPayload {
  file_name: string
  media_type: string
  content_base64: string
}

export interface PatientEvaluationVisitLogSavePayload {
  visit_date: string
  medical_category?: string | null
  doctor_diagnosis?: string | null
  doctor_diagnosis_laterality?: string | null
  pt_case_impression?: string | null
  pt_case_impression_laterality?: string | null
  subjective?: string | null
  objective?: string | null
  assessment?: string | null
  plan?: string | null
  ancillary_record_type?: string | null
  ancillary_attachment?: PatientEvaluationVisitLogAttachmentUploadPayload | null
  digital_posture_attachment?: PatientEvaluationVisitLogAttachmentUploadPayload | null
  remove_ancillary_attachment?: boolean
  remove_digital_posture_attachment?: boolean
}

export const patientEvaluationVisitLogService = {
  async getAll(patientId: number): Promise<PatientEvaluationVisitLogItem[]> {
    const { data } = await pamsAPI.get<PatientEvaluationVisitLogItem[]>(`/patients/${patientId}/evaluation-visit-logs`)
    return data ?? []
  },

  async create(patientId: number, payload: PatientEvaluationVisitLogSavePayload): Promise<PatientEvaluationVisitLogItem> {
    const { data } = await pamsAPI.post<PatientEvaluationVisitLogItem>(`/patients/${patientId}/evaluation-visit-logs`, payload)
    return data
  },

  async update(patientId: number, logId: number, payload: PatientEvaluationVisitLogSavePayload): Promise<PatientEvaluationVisitLogItem> {
    const { data } = await pamsAPI.put<PatientEvaluationVisitLogItem>(`/patients/${patientId}/evaluation-visit-logs/${logId}`, payload)
    return data
  },

  async delete(patientId: number, logId: number): Promise<void> {
    await pamsAPI.delete(`/patients/${patientId}/evaluation-visit-logs/${logId}`)
  }
}
