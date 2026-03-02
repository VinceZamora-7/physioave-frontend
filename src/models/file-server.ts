import type {UUID} from "@/utils/global.type.ts";

export interface FileDTO {
  uploaded_at: Date
  folder: UUID
  file_id: UUID
  extension: string
  media_type: string
  checksum: string
  file_name: string
}

export interface FSARequestPayload {
  folder: UUID
  file: File
}

export interface FSAPayload {
  folder: UUID
  file: UUID
}
