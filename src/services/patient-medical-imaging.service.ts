import type {Pageable} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {
  PatientMedicalImaging,
  PatientMedicalImagingDeletePayload,
  PatientMedicalImagingPayload,
  PatientMedicalRequestPayload
} from "@/models/patient-medical.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface PatientMedicalImagingService {
  getAll(payload: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalImaging> | undefined>

  export(patientId: number): Promise<AxiosResponse<Blob> | undefined>

  save(payload: PatientMedicalImagingPayload): Promise<void | undefined>

  remove(payload: PatientMedicalImagingDeletePayload): Promise<void | undefined>
}

export const patientMedicalImagingService: PatientMedicalImagingService = {
  async getAll(payload: PatientMedicalRequestPayload): Promise<Pageable<PatientMedicalImaging> | undefined> {
    try {
      const {patient_id, page_request} = payload
      const {data: paginatedPatientMedicalImagings} = await pamsAPI.get<Pageable<PatientMedicalImaging>>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_IMAGINGS}`, {
        params: page_request
      })
      return paginatedPatientMedicalImagings
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async export(patientId: number): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${ResourceKey.PATIENTS}/${patientId}/${ResourceKey.MEDICAL_IMAGINGS}/export`, {
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async save(payload: PatientMedicalImagingPayload): Promise<void | undefined> {
    try {
      const {patient_id, attachment, medical_imaging_id} = payload
      const {data: response} = await pamsAPI.post<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_IMAGINGS}`, attachment, {
        params: {
          medical_imaging_id: medical_imaging_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async remove(payload: PatientMedicalImagingDeletePayload): Promise<void | undefined> {
    try {
      const {patient_id, medical_imaging_id} = payload
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.MEDICAL_IMAGINGS}`, {
        params: {
          medical_imaging_id: medical_imaging_id
        }
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },
}
