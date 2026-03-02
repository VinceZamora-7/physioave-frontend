import {type QueryClient} from "@tanstack/vue-query";
import {plaService} from "@/services/philippine-location.service.ts";
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
import {PhilippineLocationTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const philippineLocationTanstackService = {
  getAllRegions(
    queryClient: QueryClient,
    payload: RegionRequestPayload,
    key: PhilippineLocationTanstackKey = PhilippineLocationTanstackKey.REGIONS
  ) {
    return queryClient.fetchQuery<Pageable<Region> | undefined>({
      queryKey: [key],
      queryFn: () => plaService.getAllRegions(payload),
      retry: 2
    })
  },

  getAllProvinces(
    queryClient: QueryClient,
    payload: ProvinceRequestPayload,
    key: PhilippineLocationTanstackKey = PhilippineLocationTanstackKey.PROVINCES
  ) {
    return queryClient.fetchQuery<Pageable<Province> | undefined>({
      queryKey: [key],
      queryFn: () => plaService.getAllProvinces(payload),
      retry: 2
    })
  },

  getAllCities(
    queryClient: QueryClient,
    payload: CityRequestPayload,
    key: PhilippineLocationTanstackKey = PhilippineLocationTanstackKey.CITIES
  ) {
    return queryClient.fetchQuery<Pageable<City> | undefined>({
      queryKey: [key],
      queryFn: () => plaService.getAllCities(payload),
      retry: 2
    })
  },

  getAllBaranggays(
    queryClient: QueryClient,
    payload: BaranggayRequestPayload,
    key: PhilippineLocationTanstackKey = PhilippineLocationTanstackKey.BARANGGAYS
  ) {
    return queryClient.fetchQuery<Pageable<Baranggay> | undefined>({
      queryKey: [key],
      queryFn: () => {
        return plaService.getAllBaranggays(payload)
      },
      retry: 2
    })
  },

}

