import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery
} from "@tanstack/vue-query";
import {defaultPageSize, defaultStatus, type Pageable} from "@/models/paging.ts";
import type {
  Staff,
  StaffEditRequestPayload,
  StaffExportRequestParams,
  StaffRequestBody,
  StaffRequestParams
} from "@/features/staff/types/staff";
import {type Ref} from "vue";
import {staffService} from "@/features/staff/api/staff.service";
import type {AxiosResponse} from "axios";
import type {Lookup} from "@/models/global.model.ts";
import {StaffTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const staffTanstackService = {
  getAll(params: Ref<StaffRequestParams>, key: StaffTanstackKey = StaffTanstackKey.STAFFS) {
    return useQuery<Pageable<Staff> | undefined>({
      queryKey: [key],
      queryFn: () => staffService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    })
  },

  getAllLookup(queryClient: QueryClient,
               clinicId: number | undefined,
               page: number,
               name: string | undefined,
               key: StaffTanstackKey = StaffTanstackKey.STAFFS_LOOKUP) {

    return queryClient.fetchQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: StaffRequestParams = {
          pageable_request: {
            page: page,
            size: defaultPageSize,
            status: defaultStatus,
            name: name,
          },
          clinic_id: clinicId
        }
        return staffService.getAllLookup(requestParams)
      }
    })
  },

  getAllInfiniteQuery(name: Ref<string | undefined>,
                      clinicId: Ref<number | undefined>,
                      key: StaffTanstackKey = StaffTanstackKey.STAFFS_INFINITE_QUERY) {

    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: StaffRequestParams = {
          pageable_request: {
            page: params.pageParam as number,
            size: defaultPageSize,
            status: defaultStatus,
            name: name.value,
          },
          clinic_id: clinicId.value
        }
        return staffService.getAllLookup(requestParams)
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
    params: StaffExportRequestParams,
    key: StaffTanstackKey = StaffTanstackKey.STAFFS_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        staffService.export(params),
    })
  },

  save(key: StaffTanstackKey = StaffTanstackKey.STAFFS
  ) {
    return useMutation<void | undefined, Error, StaffRequestBody>({
      mutationKey: [key],
      mutationFn: staffService.save
    })
  },

  update(key: StaffTanstackKey = StaffTanstackKey.STAFFS) {
    return useMutation<void | undefined, Error, StaffEditRequestPayload>({
      mutationKey: [key],
      mutationFn: staffService.update
    })
  },

  toggleStatus(key: StaffTanstackKey = StaffTanstackKey.STAFFS
  ) {
    return useMutation<void | undefined, Error, number>({
      mutationKey: [key],
      mutationFn: staffService.toggleStatus
    })
  }
}
