import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery
} from "@tanstack/vue-query";
import {clinicService} from "@/features/clinics/api/clinic.service";
import {type Ref} from "vue";
import {
  defaultPageSize,
  defaultStatus,
  type Pageable,
  type PageableRequest,
  type PageRequestWithNameAndStatus
} from "@/models/paging.ts";
import type {Clinic, ClinicEditRequestPayload, ClinicRequestBody} from "@/features/clinics/types/clinic";
import type {APIError} from "@/utils/error-handler.ts";
import type {AxiosResponse} from "axios";
import type {Lookup} from "@/models/global.model.ts";
import {ClinicTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const clinicTanstackService = {
  getAll(params: Ref<PageableRequest>, key: ClinicTanstackKey = ClinicTanstackKey.CLINICS) {
    return useQuery<Pageable<Clinic> | undefined, APIError>({
      queryKey: [key],
      queryFn: () => clinicService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    })
  },

  getAllLookup(queryClient: QueryClient,
               page: number,
               name: string | undefined,
               key: ClinicTanstackKey = ClinicTanstackKey.CLINICS_LOOKUP) {

    return queryClient.fetchQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: PageableRequest = {
          page: page,
          size: defaultPageSize,
          status: defaultStatus,
          name: name
        }
        return clinicService.getAllLookup(requestParams)
      }
    })
  },

  getAllInfiniteQuery(name: Ref<string | undefined>, key: ClinicTanstackKey = ClinicTanstackKey.CLINICS_INFINITE_QUERY) {
    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: PageableRequest = {
          page: params.pageParam as number,
          size: defaultPageSize,
          status: defaultStatus,
          name: name.value
        }
        return clinicService.getAllLookup(requestParams)
      },
      initialPageParam: 1,
      getNextPageParam: lastPage => lastPage?.next_page,
      getPreviousPageParam: firstPage => firstPage?.previous_page,
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: false
    })
  },

  export(
    queryClient: QueryClient,
    params: PageRequestWithNameAndStatus,
    key: ClinicTanstackKey = ClinicTanstackKey.CLINICS_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        clinicService.export(params),
    })
  },

  save(key: ClinicTanstackKey = ClinicTanstackKey.CLINICS) {
    return useMutation<void | undefined, APIError, ClinicRequestBody>({
      mutationKey: [key],
      mutationFn: clinicService.save,
    })
  },

  update(key: ClinicTanstackKey = ClinicTanstackKey.CLINICS) {
    return useMutation<void | undefined, APIError, ClinicEditRequestPayload>({
      mutationKey: [key],
      mutationFn: clinicService.update
    })
  },

  toggleStatus(key: ClinicTanstackKey = ClinicTanstackKey.CLINICS) {
    return useMutation<void | undefined, APIError, number>({
      mutationKey: [key],
      mutationFn: clinicService.toggleStatus
    })
  }
}
