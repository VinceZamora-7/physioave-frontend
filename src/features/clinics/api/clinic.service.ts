import type { Pageable, PageableRequest, PageRequestWithNameAndStatus } from "@/models/paging.ts"
import type { Clinic, ClinicEditRequestPayload, ClinicRequestBody } from "@/features/clinics/types/clinic"
import { APIError, errorHandler } from "@/utils/error-handler.ts"
import { pamsAPI } from "@/utils/axios-interceptor.ts"
import type { AxiosResponse } from "axios"
import type { Lookup } from "@/models/global.model.ts"
import { ResourceKey } from "@/utils/keys/resource-key.ts"

interface ClinicService {
  getAll(params: PageableRequest
  ): Promise<Pageable<Clinic> | undefined>

  export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: PageableRequest
  ): Promise<Pageable<Lookup> | undefined>

  save(
    body: ClinicRequestBody
  ): Promise<void | undefined>

  update(
    payload: ClinicEditRequestPayload
  ): Promise<void | undefined>

  toggleStatus(
    id: number
  ): Promise<void | undefined>
}

const clinicsEndpoint = `/${ResourceKey.CLINICS}`

const withClinicServiceError = (operation: string, error: unknown): never => {
  if (error instanceof APIError) {
    throw new APIError(`[clinic.service.${operation}] ${error.message}`, error.status)
  }

  try {
    errorHandler(error)
  } catch (handledError: unknown) {
    if (handledError instanceof APIError) {
      throw new APIError(`[clinic.service.${operation}] ${handledError.message}`, handledError.status)
    }
    throw handledError
  }

  throw new APIError(`[clinic.service.${operation}] Unexpected error occurred!`)
}

export const clinicService: ClinicService = {
  async export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`${clinicsEndpoint}/export`, {
        params,
        responseType: "blob",
      })
    } catch (error: unknown) {
      withClinicServiceError("export", error)
    }
  },

  async getAllLookup(params: PageableRequest): Promise<Pageable<Lookup> | undefined> {
    try {
      const {
        data: paginatedClinics,
      } = await pamsAPI.get<Pageable<Lookup>>(`${clinicsEndpoint}/lookup`, {
        params,
      })
      return paginatedClinics
    } catch (error: unknown) {
      withClinicServiceError("getAllLookup", error)
    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const { data: response } = await pamsAPI.patch<void>(`${clinicsEndpoint}/${id}/status`)

      return response
    } catch (error: unknown) {
      withClinicServiceError("toggleStatus", error)
    }
  },

  async getAll(params: PageableRequest
  ): Promise<Pageable<Clinic> | undefined> {
    try {
      const {
        data: paginatedClinics,
      } = await pamsAPI.get<Pageable<Clinic>>(clinicsEndpoint, {
        params,
      })

      return paginatedClinics
    } catch (error: unknown) {
      withClinicServiceError("getAll", error)
    }
  },

  async save(body: ClinicRequestBody): Promise<void | undefined> {
    try {
      const { data: response } = await pamsAPI.post<void, AxiosResponse<void>, ClinicRequestBody>(clinicsEndpoint, body)

      return response
    } catch (error: unknown) {
      withClinicServiceError("save", error)
    }
  },

  async update(payload: ClinicEditRequestPayload): Promise<void | undefined> {
    try {
      const { id, ...rest } = payload
      const { data } = await pamsAPI.put<void, AxiosResponse<void>, ClinicRequestBody>(`${clinicsEndpoint}/${id}`, rest)

      return data
    } catch (error: unknown) {
      withClinicServiceError("update", error)
    }
  },
}
