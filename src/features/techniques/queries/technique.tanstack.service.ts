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

import {TechniqueTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {OfferEditPayload, OfferRequest, Technique} from "@/features/offers/types/offer";
import {techniqueService} from "@/features/techniques/api/technique.service";

export const techniqueTanstackService = {
  getAll(params: Ref<PageableRequest>,
         key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES
  ) {
    return useQuery<Pageable<Technique> | undefined>({
      queryKey: [key],
      queryFn: () => techniqueService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1
    })
  },

  getAllLookup(queryClient: QueryClient,
               page: number,
               name: string | undefined,
               key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES_LOOKUP) {

    return queryClient.fetchQuery<Pageable<OfferLookupDTO> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: PageableRequest = {
          page: page,
          size: defaultPageSize,
          status: defaultStatus,
          name: name
        }
        return techniqueService.getAllLookup(requestParams)
      }
    })
  },

  getAllHMOInfiniteQuery(name: Ref<string | undefined>,
                         key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES_INFINITE_QUERY) {

    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: PageableRequest = {
          page: params.pageParam as number,
          size: defaultPageSize,
          status: defaultStatus,
          name: name.value,
        }
        return techniqueService.getAllLookup(requestParams)
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
    key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        techniqueService.export(params),
    })
  },

  save(key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES) {
    return useMutation<void | undefined, Error, OfferRequest>({
      mutationKey: [key],
      mutationFn: techniqueService.save
    })
  },

  update(key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES) {
    return useMutation<void | undefined, Error, OfferEditPayload>({
      mutationKey: [key],
      mutationFn: techniqueService.update
    })
  },

  toggleStatus(key: TechniqueTanstackKey = TechniqueTanstackKey.TECHNIQUES) {
    return useMutation<void | undefined, Error, number>({
      mutationKey: [key],
      mutationFn: techniqueService.toggleStatus
    })
  },

}

