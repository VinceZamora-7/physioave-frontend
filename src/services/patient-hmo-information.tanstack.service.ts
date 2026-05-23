import {useMutation, useQuery} from "@tanstack/vue-query";
import type {
  PatientHMOInformation,
  PatientHMOInformationHistoryEntry,
  PatientHMOInformationPayload
} from "@/models/hmo-information.ts";
import {patientHMOInformationService} from "@/services/patient-hmo-information.service.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {Ref} from "vue";
import {computed} from "vue";

export const patientHmoInformationTanstackService = {
  getByPatientId(patientId: Ref<number>, key: PatientTanstackKey = PatientTanstackKey.PATIENT_HMO_INFORMATION) {
    return useQuery<PatientHMOInformation[]>({
      queryKey: computed(() => [key, patientId.value]),
      queryFn: () => patientHMOInformationService.getByPatientId(patientId.value),
      enabled: false,
      retry: 2
    })
  },

  getHistoryByPatientId(patientId: Ref<number>, key: PatientTanstackKey = PatientTanstackKey.PATIENT_HMO_INFORMATION_HISTORY) {
    return useQuery<PatientHMOInformationHistoryEntry[]>({
      queryKey: computed(() => [key, patientId.value]),
      queryFn: () => patientHMOInformationService.getHistoryByPatientId(patientId.value),
      enabled: false,
      retry: 2
    })
  },

  updateByPatientId(key: PatientTanstackKey = PatientTanstackKey.PATIENT_HMO_INFORMATION) {
    return useMutation<void | undefined, Error, PatientHMOInformationPayload>({
      mutationKey: [key],
      mutationFn: patientHMOInformationService.updateByPatientId,
    })
  },

  save(key: PatientTanstackKey = PatientTanstackKey.PATIENT_HMO_INFORMATION) {
    return useMutation<void | undefined, Error, PatientHMOInformationPayload>({
      mutationKey: [key],
      mutationFn: patientHMOInformationService.save,
    })
  }
}
