import type { Pageable, PageableRequest } from "@/models/paging"
import type { TreatmentArea } from "@/models/reference"
import { APIError, errorHandler } from "@/utils/error-handler"
import { pamsAPI } from "@/utils/axios-interceptor"

export interface ClinicTreatmentAreaUpsertPayload {
  name: string
  color: string
}

interface ClinicTreatmentAreaService {
  getAll(clinicId: number, params: PageableRequest): Promise<Pageable<TreatmentArea> | undefined>
  create(clinicId: number, payload: ClinicTreatmentAreaUpsertPayload): Promise<TreatmentArea | undefined>
  update(clinicId: number, treatmentAreaId: number, payload: ClinicTreatmentAreaUpsertPayload): Promise<TreatmentArea | undefined>
  toggleStatus(clinicId: number, treatmentAreaId: number): Promise<void | undefined>
}

const withClinicTreatmentAreaError = (operation: string, error: unknown): never => {
  if (error instanceof APIError) {
    throw new APIError(`[clinic-treatment-area.service.${operation}] ${error.message}`, error.status)
  }

  try {
    errorHandler(error)
  } catch (handledError: unknown) {
    if (handledError instanceof APIError) {
      throw new APIError(`[clinic-treatment-area.service.${operation}] ${handledError.message}`, handledError.status)
    }
    throw handledError
  }

  throw new APIError(`[clinic-treatment-area.service.${operation}] Unexpected error occurred!`)
}

export const clinicTreatmentAreaService: ClinicTreatmentAreaService = {
  async getAll(clinicId: number, params: PageableRequest): Promise<Pageable<TreatmentArea> | undefined> {
    try {
      const { data } = await pamsAPI.get<Pageable<TreatmentArea>>(`/clinics/${clinicId}/treatment-areas`, {
        params
      })
      return data
    } catch (error: unknown) {
      withClinicTreatmentAreaError("getAll", error)
    }
  },

  async create(clinicId: number, payload: ClinicTreatmentAreaUpsertPayload): Promise<TreatmentArea | undefined> {
    try {
      const { data } = await pamsAPI.post<TreatmentArea>(`/clinics/${clinicId}/treatment-areas`, payload)
      return data
    } catch (error: unknown) {
      withClinicTreatmentAreaError("create", error)
    }
  },

  async update(clinicId: number, treatmentAreaId: number, payload: ClinicTreatmentAreaUpsertPayload): Promise<TreatmentArea | undefined> {
    try {
      const { data } = await pamsAPI.put<TreatmentArea>(`/clinics/${clinicId}/treatment-areas/${treatmentAreaId}`, payload)
      return data
    } catch (error: unknown) {
      withClinicTreatmentAreaError("update", error)
    }
  },

  async toggleStatus(clinicId: number, treatmentAreaId: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.patch<void>(`/clinics/${clinicId}/treatment-areas/${treatmentAreaId}/status`)
      return data
    } catch (error: unknown) {
      withClinicTreatmentAreaError("toggleStatus", error)
    }
  }
}
