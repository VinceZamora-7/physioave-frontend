import {keepPreviousData, type QueryClient, useMutation, useQuery} from "@tanstack/vue-query";
import type {Pageable} from "@/models/paging.ts";
import type {Ref} from "vue";
import type {AxiosResponse} from "axios";
import type {APIError} from "@/utils/error-handler.ts";
import type {
  PatientMedicalImaging,
  PatientMedicalImagingDeletePayload,
  PatientMedicalImagingPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {patientMedicalImagingService} from "@/services/patient-medical-imaging.service.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const patientMedicalImagingTanstackService = {
  getAll(payload: Ref<PatientMedicalRequestPayload>, key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_IMAGING) {
    return useQuery<Pageable<PatientMedicalImaging> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalImagingService.getAll(payload.value),
      placeholderData: keepPreviousData,
      retry: 2,
      enabled: false
    })
  },

  export(queryClient: QueryClient,
         patientId: number,
         key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_IMAGING_EXPORT) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalImagingService.export(patientId),
      retry: 2
    })
  },

  save(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_IMAGING) {
    return useMutation<void | undefined, APIError, PatientMedicalImagingPayload>({
      mutationKey: [key],
      mutationFn: patientMedicalImagingService.save
    })
  },

  remove(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_IMAGING) {
    return useMutation<void | undefined, APIError, PatientMedicalImagingDeletePayload>({
      mutationKey: [key],
      mutationFn: patientMedicalImagingService.remove
    })
  }
}
