import type {PageRequestWithName} from "@/models/paging.ts";

interface BasePLA {
  id: number
  name: string
}

export interface Region extends BasePLA {
  description: string
}

export interface Province extends BasePLA {
  region_id: number
}

export interface City extends Province {
  province_id: number
}

export interface Baranggay extends City {
  city_id: number
}

export interface RegionRequestPayload {
  page_request: PageRequestWithName
}

export interface ProvinceRequestPayload extends RegionRequestPayload {
  region_id: number
}

export interface CityRequestPayload extends ProvinceRequestPayload {
  province_id: number
}

export interface BaranggayRequestPayload extends CityRequestPayload {
  city_id: number
}
