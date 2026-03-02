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

import {EvaluationTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {Evaluation, OfferEditPayload, OfferRequest} from "@/features/offers/types/offer";
import {evaluationService} from "@/features/evaluations/api/evaluation.service";

export const evaluationTanstackService = {
  getAll(params: Ref<PageableRequest>,
         key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS
  ) {
    return useQuery<Pageable<Evaluation> | undefined>({
      queryKey: [key],
      queryFn: () => evaluationService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1
    })
  },

  getAllLookup(queryClient: QueryClient,
               page: number,
               name: string | undefined,
               key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS_LOOKUP) {

    return queryClient.fetchQuery<Pageable<OfferLookupDTO> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: PageableRequest = {
          page: page,
          size: defaultPageSize,
          status: defaultStatus,
          name: name
        }
        return evaluationService.getAllLookup(requestParams)
      }
    })
  },

  getAllHMOInfiniteQuery(name: Ref<string | undefined>,
                         key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS_INFINITE_QUERY) {

    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: PageableRequest = {
          page: params.pageParam as number,
          size: defaultPageSize,
          status: defaultStatus,
          name: name.value,
        }
        return evaluationService.getAllLookup(requestParams)
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
    key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        evaluationService.export(params),
    })
  },

  save(key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS) {
    return useMutation<void | undefined, Error, OfferRequest>({
      mutationKey: [key],
      mutationFn: evaluationService.save
    })
  },

  update(key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS) {
    return useMutation<void | undefined, Error, OfferEditPayload>({
      mutationKey: [key],
      mutationFn: evaluationService.update
    })
  },

  toggleStatus(key: EvaluationTanstackKey = EvaluationTanstackKey.EVALUATIONS) {
    return useMutation<void | undefined, Error, number>({
      mutationKey: [key],
      mutationFn: evaluationService.toggleStatus
    })
  },

}

