import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery
} from "@tanstack/vue-query";
import {
  defaultPageSize,
  defaultStatus,
  type Pageable,
  type PageableRequest,
  type PageRequestWithNameAndStatus
} from "@/models/paging.ts";

import type {Ref} from "vue";
import type {AxiosResponse} from "axios";

import type {Lookup} from "@/models/global.model.ts";
import {HMOTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {HMO, HMOEditRequestPayload, HMOSaveRequestParams} from "@/features/hmos/types/hmo";
import {hmoService} from "@/features/hmos/api/hmo.service";

export const hmoTanstackService = {
  getAll(params: Ref<PageableRequest>,
         key: HMOTanstackKey = HMOTanstackKey.HMOS
  ) {
    return useQuery<Pageable<HMO> | undefined>({
      queryKey: [key],
      queryFn: () => hmoService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1
    })
  },

  getAllLookup(queryClient: QueryClient,
               page: number,
               name: string | undefined,
               key: HMOTanstackKey = HMOTanstackKey.HMOS_LOOKUP) {

    return queryClient.fetchQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: PageableRequest = {
          page: page,
          size: defaultPageSize,
          status: defaultStatus,
          name: name
        }
        return hmoService.getAllLookup(requestParams)
      }
    })
  },

  getAllHMOInfiniteQuery(name: Ref<string | undefined>,
                         key: HMOTanstackKey = HMOTanstackKey.HMOS_INFINITE_QUERY) {

    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: PageableRequest = {
          page: params.pageParam as number,
          size: defaultPageSize,
          status: defaultStatus,
          name: name.value,
        }
        return hmoService.getAllLookup(requestParams)
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
    key: HMOTanstackKey = HMOTanstackKey.HMOS_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        hmoService.export(params),
    })
  },

  save(key: HMOTanstackKey = HMOTanstackKey.HMOS) {
    return useMutation<void | undefined, Error, HMOSaveRequestParams>({
      mutationKey: [key],
      mutationFn: hmoService.save
    })
  },

  update(key: HMOTanstackKey = HMOTanstackKey.HMOS) {
    return useMutation<void | undefined, Error, HMOEditRequestPayload>({
      mutationKey: [key],
      mutationFn: hmoService.update
    })
  },

  toggleStatus(key: HMOTanstackKey = HMOTanstackKey.HMOS) {
    return useMutation<void | undefined, Error, number>({
      mutationKey: [key],
      mutationFn: hmoService.toggleStatus
    })
  },

}

