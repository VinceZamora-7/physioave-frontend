import {keepPreviousData, type QueryClient, useMutation, useQuery} from "@tanstack/vue-query";
import type {Pageable} from "@/models/paging.ts";
import type {Ref} from "vue";
import type {AxiosResponse} from "axios";
import type {APIError} from "@/utils/error-handler.ts";
import type {
  PatientMedicalHistory,
  PatientMedicalHistoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {patientMedicalHistoryService} from "@/services/patient-medical-history.service.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const patientMedicalHistoryTanstackService = {
  getAll(
    payload: Ref<PatientMedicalRequestPayload>,
    key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_HISTORY
  ) {
    return useQuery<Pageable<PatientMedicalHistory> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalHistoryService.getAll(payload.value),
      placeholderData: keepPreviousData,
      retry: 2,
      enabled: false
    })
  },

  export(queryClient: QueryClient, patientId: number, key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_HISTORY_EXPORT) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalHistoryService.export(patientId),
      retry: 2
    })
  },

  save(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_HISTORY) {
    return useMutation<void | undefined, APIError, PatientMedicalHistoryPayload>({
      mutationKey: [key],
      mutationFn: patientMedicalHistoryService.save
    })
  },

  remove(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_HISTORY) {
    return useMutation<void | undefined, APIError, PatientMedicalHistoryPayload>({
      mutationKey: [key],
      mutationFn: patientMedicalHistoryService.remove
    })
  }
}
