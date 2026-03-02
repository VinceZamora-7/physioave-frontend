import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import type {PatientAttachment, PatientAttachmentPayload} from "@/models/patient-attachment.ts";
import type {AxiosResponse} from "axios";
import type {Attachment} from "@/models/global.model.ts";
import type {PatientAttachmentTanstackKey} from "@/utils/keys/tanstack-key.ts";

export interface PatientAttachmentService {
  save(payload: PatientAttachmentPayload): Promise<PatientAttachment | undefined>

  delete(patientId: number): Promise<void>

  get(patientId: number): Promise<PatientAttachment | undefined>
}

export const createPatientAttachmentService = (key: PatientAttachmentTanstackKey): PatientAttachmentService => {
  return {
    async get(patientId: number): Promise<PatientAttachment | undefined> {
      try {
        const {data: response} = await pamsAPI.get<PatientAttachment>(`/patients/${patientId}/attachments/${key}`)
        return response
      } catch (error: unknown) {
        errorHandler(error);
      }
    },

    async delete(patientId: number): Promise<void> {
      try {
        const {data: response} = await pamsAPI.delete<void>(`/patients/${patientId}/attachments/${key}`);

        return response
      } catch (error: unknown) {
        errorHandler(error)
      }
    },

    async save(payload: PatientAttachmentPayload): Promise<PatientAttachment | undefined> {
      try {
        const {patient_id, attachment} = payload
        const {data: patientAttachment} = await pamsAPI.post<PatientAttachment, AxiosResponse<PatientAttachment>, Attachment>(`/patients/${patient_id}/attachments/${key}`, attachment)
        return patientAttachment
      } catch (error: unknown) {
        errorHandler(error)
      }
    }
  }
}
