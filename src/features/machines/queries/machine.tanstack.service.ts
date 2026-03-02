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

import type {Lookup, OfferLookupDTO} from "@/models/global.model.ts";

import {MachineTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {Machine, OfferEditPayload, OfferRequest} from "@/features/offers/types/offer";
import {machineService} from "@/features/machines/api/machine.service";

export const machineTanstackService = {
  getAll(params: Ref<PageableRequest>,
         key: MachineTanstackKey = MachineTanstackKey.MACHINES
  ) {
    return useQuery<Pageable<Machine> | undefined>({
      queryKey: [key],
      queryFn: () => machineService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1
    })
  },

  getAllLookup(queryClient: QueryClient,
               page: number,
               name: string | undefined,
               key: MachineTanstackKey = MachineTanstackKey.MACHINES_LOOKUP) {

    return queryClient.fetchQuery<Pageable<OfferLookupDTO> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: PageableRequest = {
          page: page,
          size: defaultPageSize,
          status: defaultStatus,
          name: name
        }
        return machineService.getAllLookup(requestParams)
      }
    })
  },

  getAllHMOInfiniteQuery(name: Ref<string | undefined>,
                         key: MachineTanstackKey = MachineTanstackKey.MACHINES_INFINITE_QUERY) {

    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: PageableRequest = {
          page: params.pageParam as number,
          size: defaultPageSize,
          status: defaultStatus,
          name: name.value,
        }
        return machineService.getAllLookup(requestParams)
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
    key: MachineTanstackKey = MachineTanstackKey.MACHINES_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        machineService.export(params),
    })
  },

  save(key: MachineTanstackKey = MachineTanstackKey.MACHINES) {
    return useMutation<void | undefined, Error, OfferRequest>({
      mutationKey: [key],
      mutationFn: machineService.save
    })
  },

  update(key: MachineTanstackKey = MachineTanstackKey.MACHINES) {
    return useMutation<void | undefined, Error, OfferEditPayload>({
      mutationKey: [key],
      mutationFn: machineService.update
    })
  },

  toggleStatus(key: MachineTanstackKey = MachineTanstackKey.MACHINES) {
    return useMutation<void | undefined, Error, number>({
      mutationKey: [key],
      mutationFn: machineService.toggleStatus
    })
  },

}

