import {keepPreviousData, type QueryClient, useMutation, useQuery} from "@tanstack/vue-query";
import type {Pageable} from "@/models/paging.ts";
import type {Ref} from "vue";
import type {AxiosResponse} from "axios";
import type {APIError} from "@/utils/error-handler.ts";
import type {
  PatientMedicalDiagnose,
  PatientMedicalDiagnosePayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {patientMedicalDiagnoseService} from "@/services/patient-medical-diagnose.service.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const patientMedicalDiagnoseTanstackService = {
  getAll(
    payload: Ref<PatientMedicalRequestPayload>,
    key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_DIAGNOSES
  ) {
    return useQuery<Pageable<PatientMedicalDiagnose> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalDiagnoseService.getAll(payload.value),
      placeholderData: keepPreviousData,
      retry: 2,
      enabled: false
    })
  },

  export(queryClient: QueryClient, patientId: number, key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_DIAGNOSES_EXPORT) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () => patientMedicalDiagnoseService.export(patientId),
      retry: 2
    })
  },

  save(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_DIAGNOSES) {
    return useMutation<void | undefined, APIError, PatientMedicalDiagnosePayload>({
      mutationKey: [key],
      mutationFn: patientMedicalDiagnoseService.save
    })
  },

  remove(key: PatientTanstackKey = PatientTanstackKey.PATIENT_MEDICAL_DIAGNOSES) {
    return useMutation<void | undefined, APIError, PatientMedicalDiagnosePayload>({
      mutationKey: [key],
      mutationFn: patientMedicalDiagnoseService.remove
    })
  }
}
