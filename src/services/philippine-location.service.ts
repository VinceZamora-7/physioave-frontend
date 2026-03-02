import type {Pageable} from "@/models/paging.ts";
import type {
  Baranggay,
  BaranggayRequestPayload,
  City,
  CityRequestPayload,
  Province,
  ProvinceRequestPayload,
  Region,
  RegionRequestPayload
} from "@/models/philippine-location.ts";
import {plaAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {PhilippineLocationResourceKey} from "@/utils/keys/resource-key.ts";

interface PhilippineLocationService {
  getAllRegions(payload: RegionRequestPayload): Promise<Pageable<Region> | undefined>

  getAllProvinces(payload: ProvinceRequestPayload): Promise<Pageable<Province> | undefined>

  getAllCities(payload: CityRequestPayload): Promise<Pageable<City> | undefined>

  getAllBaranggays(payload: BaranggayRequestPayload): Promise<Pageable<Baranggay> | undefined>
}

export const plaService: PhilippineLocationService = {

  async getAllBaranggays(payload: BaranggayRequestPayload): Promise<Pageable<Baranggay> | undefined> {
    try {
      const {region_id, province_id, city_id, page_request} = payload
      const {data: paginatedRegions} = await plaAPI.get<Pageable<Baranggay>>(`/${PhilippineLocationResourceKey.REGIONS}/${region_id}/${PhilippineLocationResourceKey.PROVINCES}/${province_id}/${PhilippineLocationResourceKey.CITIES}/${city_id}/${PhilippineLocationResourceKey.BARANGGAYS}`, {
        params: page_request
      })
      return paginatedRegions
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getAllCities(payload: CityRequestPayload): Promise<Pageable<City> | undefined> {

    try {
      const {region_id, province_id, page_request} = payload
      const {data: paginatedCities} = await plaAPI.get<Pageable<City>>(`/${PhilippineLocationResourceKey.REGIONS}/${region_id}/${PhilippineLocationResourceKey.PROVINCES}/${province_id}/${PhilippineLocationResourceKey.CITIES}`, {
        params: page_request
      })
      return paginatedCities
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getAllProvinces(payload: ProvinceRequestPayload): Promise<Pageable<Province> | undefined> {

    try {
      const {region_id, page_request} = payload
      const {data: paginatedProvinces} = await plaAPI.get<Pageable<Province>>(`/${PhilippineLocationResourceKey.REGIONS}/${region_id}/${PhilippineLocationResourceKey.PROVINCES}`, {
        params: page_request
      })
      return paginatedProvinces
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getAllRegions(payload: RegionRequestPayload): Promise<Pageable<Region> | undefined> {

    try {
      const {data: paginatedRegions} = await plaAPI.get<Pageable<Region>>(`/${PhilippineLocationResourceKey.REGIONS}`, {
        params: payload.page_request
      })
      return paginatedRegions
    } catch (error: unknown) {
      errorHandler(error)
    }
  }

}
