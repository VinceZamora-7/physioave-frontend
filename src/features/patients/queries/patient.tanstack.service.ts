import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery
} from "@tanstack/vue-query";
import {defaultPageSize, defaultStatus, type Pageable} from "@/models/paging.ts";
import {patientService} from "@/features/patients/api/patient.service";
import type {Ref} from "vue";
import type {
  Patient,
  PatientEditRequestPayload,
  PatientExportRequestParams,
  PatientRequestBody,
  PatientRequestParams
} from "@/features/patients/types/patient";
import type {AxiosResponse} from "axios";

import type {Lookup} from "@/models/global.model.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const patientTanstackService = {
  getAll(params: Ref<PatientRequestParams>,
         key: PatientTanstackKey = PatientTanstackKey.PATIENTS
  ) {
    return useQuery<Pageable<Patient> | undefined>({
      queryKey: [key],
      queryFn: () => patientService.getAll(params.value),
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
               key: PatientTanstackKey = PatientTanstackKey.PATIENTS_LOOKUP) {

    return queryClient.fetchQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: () => {
        const requestParams: PatientRequestParams = {
          pageable_request: {
            page: page,
            size: defaultPageSize,
            status: defaultStatus,
            name: name,
          },
          clinic_id: clinicId
        }
        return patientService.getAllLookup(requestParams)
      }
    })
  },

  getAllInfiniteQuery(name: Ref<string | undefined>,
                      clinicId: Ref<number | undefined>,
                      key: PatientTanstackKey = PatientTanstackKey.PATIENTS_INFINITE_QUERY) {

    return useInfiniteQuery<Pageable<Lookup> | undefined>({
      queryKey: [key],
      queryFn: (params) => {
        const requestParams: PatientRequestParams = {
          pageable_request: {
            page: params.pageParam as number,
            size: defaultPageSize,
            status: defaultStatus,
            name: name.value,
          },
          clinic_id: clinicId.value
        }
        return patientService.getAllLookup(requestParams)
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
    params: PatientExportRequestParams,
    key: PatientTanstackKey = PatientTanstackKey.PATIENTS_EXPORT
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () =>
        patientService.export(params),
    })
  },

  save(key: PatientTanstackKey = PatientTanstackKey.PATIENTS) {
    return useMutation<void | undefined, Error, PatientRequestBody>({
      mutationKey: [key],
      mutationFn: patientService.save
    })
  },

  update(key: PatientTanstackKey = PatientTanstackKey.PATIENTS) {
    return useMutation<void | undefined, Error, PatientEditRequestPayload>({
      mutationKey: [key],
      mutationFn: patientService.update
    })
  },

  toggleStatus(key: PatientTanstackKey = PatientTanstackKey.PATIENTS) {
    return useMutation<void | undefined, Error, number>({
      mutationKey: [key],
      mutationFn: patientService.toggleStatus
    })
  },

}
