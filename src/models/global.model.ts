import type {UUID} from "@/utils/global.type.ts";

export interface Lookup {
  id: number
  name: string
}

export interface OfferLookupDTO extends Lookup{
  price: number
}

export interface Attachment {
  file_id: UUID
  checksum: string
  media_type: string
  extension: string
}
