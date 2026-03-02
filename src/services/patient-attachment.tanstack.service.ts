import {
  useMutation,
  type UseMutationReturnType,
  useQuery,
  type UseQueryReturnType
} from "@tanstack/vue-query";
import {PatientAttachmentTanstackKey} from "@/utils/keys/tanstack-key.ts";
import {
  createPatientAttachmentService,
  type PatientAttachmentService
} from "@/services/patient-attachment.service.ts";
import type {PatientAttachment, PatientAttachmentPayload} from "@/models/patient-attachment.ts";
import type {Ref} from "vue";

export interface PatientAttachmentTanstackService {
  get(patientId: Ref<number | undefined>): UseQueryReturnType<PatientAttachment | undefined, Error>

  save(): UseMutationReturnType<
    PatientAttachment | undefined,
    Error,
    PatientAttachmentPayload,
    unknown
  >

  delete(): UseMutationReturnType<
    void,
    Error,
    number,
    unknown
  >
}

export const createPatientAttachmentTanstackService = (key: PatientAttachmentTanstackKey): PatientAttachmentTanstackService => {
  const patientAttachmentService: PatientAttachmentService = createPatientAttachmentService(key)

  return {
    get(patientId: Ref<number | undefined>): UseQueryReturnType<PatientAttachment | undefined, Error> {
      return useQuery<PatientAttachment | undefined>({
        queryKey: [key],
        queryFn: () => patientAttachmentService.get(patientId.value ?? 0),
        enabled: false
      })
    },

    save(): UseMutationReturnType<
      PatientAttachment | undefined,
      Error,
      PatientAttachmentPayload,
      unknown
    > {
      return useMutation<PatientAttachment | undefined, Error, PatientAttachmentPayload>({
        mutationKey: [key],
        mutationFn: patientAttachmentService.save
      })
    },

    delete(): UseMutationReturnType<
      void,
      Error,
      number,
      unknown
    > {
      return useMutation<void, Error, number>({
        mutationKey: [key],
        mutationFn: patientAttachmentService.delete
      })
    }
  }
}
