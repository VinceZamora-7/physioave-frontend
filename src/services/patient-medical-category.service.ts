import type {Pageable} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {
  PatientMedicalCategory,
  PatientMedicalCategoryPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface PatientMedicalCategoryService {
  getAll(payload: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalCategory> | undefined>

  export(patientId: number): Promise<AxiosResponse<Blob> | undefined>

  save(payload: PatientMedicalCategoryPayload): Promise<void | undefined>

  remove(payload: PatientMedicalCategoryPayload): Promise<void | undefined>
}

export const patientMedicalCategoryService: PatientMedicalCategoryService = {
  async getAll(payload: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalCategory> | undefined> {
    try {
      const {patient_id, page_request} = payload
      const {data: paginatedPatientMedicalCategories} = await pamsAPI.get<Pageable<PatientMedicalCategory>>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_CATEGORIES}`, {
        params: page_request
      })
      return paginatedPatientMedicalCategories
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async export(patientId: number): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${ResourceKey.PATIENTS}/${patientId}/${ResourceKey.MEDICAL_CATEGORIES}/export`, {
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async save(payload: PatientMedicalCategoryPayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_category_id} = payload

      const {data: response} = await pamsAPI.post<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_CATEGORIES}`, null, {
        params: {
          medical_category_id: medical_category_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async remove(payload: PatientMedicalCategoryPayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_category_id} = payload
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_CATEGORIES}`, {
        params: {
          medical_category_id: medical_category_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },
}
