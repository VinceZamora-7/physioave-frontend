import {keepPreviousData, type QueryClient, useMutation, useQuery} from "@tanstack/vue-query";
import type {Pageable} from "@/models/paging.ts";
import type {Ref} from "vue";
import type {AxiosResponse} from "axios";
import type {APIError} from "@/utils/error-handler.ts";
import {patientMedicalCategoryService} from "@/services/patient-medical-category.service.ts";
import type {
  PatientMedicalCategory,
  PatientMedicalCategoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const patientMedicalCategoryTanstackService = {
  getAll(payload: Ref<PatientMedicalRequestPayload>, key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_CATEGORIES) {
    return useQuery<Pageable<PatientMedicalCategory> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalCategoryService.getAll(payload.value),
      placeholderData: keepPreviousData,
      retry: 2,
      enabled: false
    })
  },

  export(queryClient: QueryClient, patientId: number, key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_CATEGORY_EXPORT) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalCategoryService.export(patientId),
      retry: 2
    })
  },

  save(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_CATEGORIES) {
    return useMutation<void | undefined, APIError, PatientMedicalCategoryPayload>({
      mutationKey: [key],
      mutationFn: patientMedicalCategoryService.save
    })
  },

  remove(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_CATEGORIES) {
    return useMutation<void | undefined, APIError, PatientMedicalCategoryPayload>({
      mutationKey: [key],
      mutationFn: patientMedicalCategoryService.remove
    })
  }
}
