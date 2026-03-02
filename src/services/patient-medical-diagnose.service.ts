import type {Pageable} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {
  PatientMedicalDiagnose,
  PatientMedicalDiagnosePayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface PatientMedicalDiagnoseService {
  getAll(params: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalDiagnose> | undefined>

  export(patientId: number): Promise<AxiosResponse<Blob> | undefined>

  save(payload: PatientMedicalDiagnosePayload): Promise<void | undefined>

  remove(payload: PatientMedicalDiagnosePayload): Promise<void | undefined>
}

export const patientMedicalDiagnoseService: PatientMedicalDiagnoseService = {
  async getAll(payload: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalDiagnose> | undefined> {
    try {
      const {patient_id, page_request} = payload
      const {data: paginatedPatientMedicalDiagnoses} = await pamsAPI.get<Pageable<PatientMedicalDiagnose>>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_DIAGNOSES}`, {
        params: page_request
      })
      return paginatedPatientMedicalDiagnoses
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async export(patientId: number): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${ResourceKey.PATIENTS}/${patientId}/${ResourceKey.MEDICAL_DIAGNOSES}/export`, {
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async save(payload: PatientMedicalDiagnosePayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_diagnose_id} = payload
      const {data: response} = await pamsAPI.post<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_DIAGNOSES}`, null, {
        params: {
          medical_diagnose_id: medical_diagnose_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async remove(payload: PatientMedicalDiagnosePayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_diagnose_id} = payload
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_DIAGNOSES}`, {
        params: {
          medical_diagnose_id: medical_diagnose_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },
}
