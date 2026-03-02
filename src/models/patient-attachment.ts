import type {Attachment} from "@/models/global.model.ts";

export interface PatientAttachment extends Attachment {
  patient_id: number
}

export interface PatientAttachmentPayload {
  patient_id: number
  attachment: Attachment
}

