import type {Pageable} from "@/models/paging.ts";
import type {
  Patient,
  PatientEditRequestPayload,
  PatientExportRequestParams,
  PatientRequestBody,
  PatientRequestParams
} from "@/features/patients/types/patient";
import type {AxiosResponse} from "axios";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";

import type {Lookup} from "@/models/global.model.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface PatientService {
  getAll(params: PatientRequestParams): Promise<Pageable<Patient> | undefined>

  export(request: PatientExportRequestParams): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: PatientRequestParams): Promise<Pageable<Lookup> | undefined>

  save(body: PatientRequestBody): Promise<{id: number; public_id?: string} | undefined>

  update(payload: PatientEditRequestPayload): Promise<void | undefined>

  toggleStatus(id: number): Promise<void | undefined>

  getById(id: number): Promise<Patient | undefined>

  uploadProfileImage(id: number, payload: {file_name: string, media_type: string, content_base64: string}): Promise<void | undefined>

  deleteProfileImage(id: number): Promise<void | undefined>
}

export const patientService: PatientService = {
  async getAllLookup(params: PatientRequestParams): Promise<Pageable<Lookup> | undefined> {
    try {
      const {clinic_id, pageable_request} = params
      const {data: paginatedPatientLookups} = await pamsAPI.get<Pageable<Lookup>>(`${ResourceKey.PATIENTS}/lookup`, {
        params: {
          ...pageable_request,
          clinic_id
        }
      })

      return paginatedPatientLookups
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async export(params: PatientExportRequestParams): Promise<AxiosResponse<Blob> | undefined> {
    try {
      const {clinic_id, page_request} = params
      return await pamsAPI.get(`${ResourceKey.PATIENTS}/export`, {
        params: {
          ...page_request,
          clinic_id
        },
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getAll(params: PatientRequestParams): Promise<Pageable<Patient> | undefined> {
    try {
      const {clinic_id, pageable_request} = params
      const {data: paginatedPatients} = await pamsAPI.get<Pageable<Patient>>(`${ResourceKey.PATIENTS}`, {
        params: {
          ...pageable_request,
          clinic_id
        }
      })

      return paginatedPatients
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async save(body: PatientRequestBody): Promise<{id: number; public_id?: string} | undefined> {
    try {
      const {data: response} = await pamsAPI.post<{id: number; public_id?: string}, AxiosResponse<{id: number; public_id?: string}>, PatientRequestBody>(`${ResourceKey.PATIENTS}`, body)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.patch<void>(`${ResourceKey.PATIENTS}/${id}/status`)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async update(payload: PatientEditRequestPayload): Promise<void | undefined> {
    try {
      const {id, ...rest} = payload
      const {data: response} = await pamsAPI.put<void, AxiosResponse<void>, PatientRequestBody>(`${ResourceKey.PATIENTS}/${id}`, rest)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getById(id: number): Promise<Patient | undefined> {
    try {
      const {data: patient} = await pamsAPI.get<Patient>(`${ResourceKey.PATIENTS}/${id}`)
      return patient
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async uploadProfileImage(id: number, payload: {file_name: string, media_type: string, content_base64: string}): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.post<void>(`${ResourceKey.PATIENTS}/${id}/profile-image`, payload)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async deleteProfileImage(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.delete<void>(`${ResourceKey.PATIENTS}/${id}/profile-image`)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  }
}
