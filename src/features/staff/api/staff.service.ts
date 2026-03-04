import type {Pageable} from "@/models/paging.ts";
import type {
  Staff,
  StaffEditRequestPayload,
  StaffExportRequestParams,
  StaffRequestBody,
  StaffRequestParams
} from "@/features/staff/types/staff";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {type AxiosResponse} from "axios";
import type {Lookup} from "@/models/global.model.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface StaffService {
  getAll(params: StaffRequestParams): Promise<Pageable<Staff> | undefined>

  export(params: StaffExportRequestParams): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: StaffRequestParams): Promise<Pageable<Lookup> | undefined>

  update(
    payload: StaffEditRequestPayload
  ): Promise<void | undefined>

  save(body: StaffRequestBody): Promise<void | undefined>

  toggleStatus(id: number): Promise<void | undefined>

  softDelete(id: number): Promise<void | undefined>

  hardDelete(id: number): Promise<void | undefined>
}

export const staffService: StaffService = {
  async export(request: StaffExportRequestParams): Promise<AxiosResponse<Blob> | undefined> {
    try {
      const {clinic_id, page_request} = request
      return await pamsAPI.get(`/${ResourceKey.STAFFS}/export`, {
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

  async getAllLookup(params: StaffRequestParams): Promise<Pageable<Lookup> | undefined> {
    try {
      const {clinic_id, pageable_request} = params
      const {data: paginatedStaffLookups} = await pamsAPI.get<Pageable<Lookup>>(`/${ResourceKey.STAFFS}/lookup`, {
        params: {
          ...pageable_request,
          clinic_id
        }
      })

      return paginatedStaffLookups
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getAll(params: StaffRequestParams): Promise<Pageable<Staff> | undefined> {
    try {
      const {clinic_id, pageable_request} = params
      const {data: paginatedStaffs} = await pamsAPI.get<Pageable<Staff>>(`/${ResourceKey.STAFFS}`, {
        params: {
          ...pageable_request,
          clinic_id
        }
      })

      return paginatedStaffs
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async save(body: StaffRequestBody): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.post<void, AxiosResponse<void>, StaffRequestBody>(`/${ResourceKey.STAFFS}`, body)

      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.patch<void>(`/${ResourceKey.STAFFS}/${id}/status`)

      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async softDelete(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.STAFFS}/${id}`)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async hardDelete(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.STAFFS}/${id}/hard`)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async update(payload: StaffEditRequestPayload): Promise<void | undefined> {
    try {
      const {id, ...rest} = payload
      const {data: response} = await pamsAPI.put<void, AxiosResponse<void>, StaffRequestBody>(`/${ResourceKey.STAFFS}/${id}`, rest)

      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  }

}
