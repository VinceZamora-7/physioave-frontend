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

const PSGC_BASE_URL = "https://psgc.gitlab.io/api"

type PSGCNode = {
  code: string
  name: string
}

const fetchPSGC = async (path: string): Promise<PSGCNode[]> => {
  const response = await fetch(`${PSGC_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`PSGC request failed with status ${response.status}`)
  }
  return await response.json() as PSGCNode[]
}

const toNumericId = (code: string): number => Number(code)
const toPsgcCode = (id: number): string => String(id).padStart(9, "0")
const toRegionCode = toPsgcCode
const toProvinceCode = toPsgcCode
const toCityCode = toPsgcCode

const paginate = <T>(items: T[], page: number, size: number): T[] => {
  const start = Math.max(0, (page - 1) * size)
  return items.slice(start, start + size)
}

const toPageable = <T>(items: T[], page: number, size: number): Pageable<T> => {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const content = paginate(items, currentPage, size)

  return {
    content,
    page_request: {
      page: currentPage,
      size
    },
    total_elements: totalElements,
    total_pages: totalPages,
    has_next_page: currentPage < totalPages,
    has_previous_page: currentPage > 1,
    next_page: currentPage < totalPages ? currentPage + 1 : null,
    previous_page: currentPage > 1 ? currentPage - 1 : null
  }
}

interface PhilippineLocationService {
  getAllRegions(payload: RegionRequestPayload): Promise<Pageable<Region> | undefined>

  getAllProvinces(payload: ProvinceRequestPayload): Promise<Pageable<Province> | undefined>

  getAllCities(payload: CityRequestPayload): Promise<Pageable<City> | undefined>

  getAllBaranggays(payload: BaranggayRequestPayload): Promise<Pageable<Baranggay> | undefined>
}

export const plaService: PhilippineLocationService = {

  async getAllBaranggays(payload: BaranggayRequestPayload): Promise<Pageable<Baranggay> | undefined> {
    const cityCode = toCityCode(payload.city_id)
    const items = await fetchPSGC(`/cities-municipalities/${cityCode}/barangays`)
    const mapped: Baranggay[] = items.map(item => ({
      id: toNumericId(item.code),
      name: item.name,
      region_id: payload.region_id,
      province_id: payload.province_id,
      city_id: payload.city_id
    }))

    return toPageable(mapped, payload.page_request.page, payload.page_request.size)
  },

  async getAllCities(payload: CityRequestPayload): Promise<Pageable<City> | undefined> {
    const regionCode = toRegionCode(payload.region_id)
    const isDirectCityRegion = String(payload.province_id).length <= 2 || payload.province_id === payload.region_id

    const items = isDirectCityRegion
      ? await fetchPSGC(`/regions/${regionCode}/cities-municipalities`)
      : await fetchPSGC(`/provinces/${toProvinceCode(payload.province_id)}/cities-municipalities`)

    const mapped: City[] = items.map(item => ({
      id: toNumericId(item.code),
      name: item.name,
      region_id: payload.region_id,
      province_id: payload.province_id
    }))

    return toPageable(mapped, payload.page_request.page, payload.page_request.size)
  },

  async getAllProvinces(payload: ProvinceRequestPayload): Promise<Pageable<Province> | undefined> {
    const regionCode = toRegionCode(payload.region_id)
    const items = await fetchPSGC(`/regions/${regionCode}/provinces`)

    if (!items.length) {
      // NCR and similar regions can expose cities directly under region.
      const synthetic: Province[] = [{
        id: payload.region_id,
        name: "Direct cities (no province)",
        region_id: payload.region_id
      }]
      return toPageable(synthetic, payload.page_request.page, payload.page_request.size)
    }

    const mapped: Province[] = items.map(item => ({
      id: toNumericId(item.code),
      name: item.name,
      region_id: payload.region_id
    }))

    return toPageable(mapped, payload.page_request.page, payload.page_request.size)
  },

  async getAllRegions(payload: RegionRequestPayload): Promise<Pageable<Region> | undefined> {
    const items = await fetchPSGC(`/regions`)
    const mapped: Region[] = items
      .map(item => ({
        id: toNumericId(item.code),
        name: item.name,
        description: item.name
      }))
      .sort((a, b) => a.id - b.id)

    return toPageable(mapped, payload.page_request.page, payload.page_request.size)
  }

}
