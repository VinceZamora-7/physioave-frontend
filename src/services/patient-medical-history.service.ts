import type {Pageable} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {
  PatientMedicalHistory,
  PatientMedicalHistoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface PatientMedicalHistoryService {
  getAll(params: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalHistory> | undefined>

  export(patientId: number): Promise<AxiosResponse<Blob> | undefined>

  save(payload: PatientMedicalHistoryPayload): Promise<void | undefined>

  remove(payload: PatientMedicalHistoryPayload): Promise<void | undefined>
}

export const patientMedicalHistoryService: PatientMedicalHistoryService = {
  async getAll(payload: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalHistory> | undefined> {
    try {
      const {patient_id, page_request} = payload
      const {data: paginatedPatientMedicalHistories} = await pamsAPI.get<Pageable<PatientMedicalHistory>>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_HISTORIES}`, {
        params: page_request
      })
      return paginatedPatientMedicalHistories
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async export(patientId: number): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${ResourceKey.PATIENTS}/${patientId}/${ResourceKey.MEDICAL_HISTORIES}/export`, {
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async save(payload: PatientMedicalHistoryPayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_history_id} = payload
      const {data: response} = await pamsAPI.post<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_HISTORIES}`, null, {
        params: {
          medical_history_id: medical_history_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async remove(payload: PatientMedicalHistoryPayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_history_id} = payload
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_HISTORIES}`, {
        params: {
          medical_history_id: medical_history_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },
}
