import type {Pageable, PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {Lookup} from "@/models/global.model.ts";
import type {HMO, HMOEditRequestPayload, HMOSaveRequestParams} from "@/features/hmos/types/hmo";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface HMOService {
  getAll(params: PageableRequest): Promise<Pageable<HMO> | undefined>

  export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: PageableRequest): Promise<Pageable<Lookup> | undefined>

  save(params: HMOSaveRequestParams): Promise<void | undefined>

  update(payload: HMOEditRequestPayload): Promise<void | undefined>

  toggleStatus(id: number): Promise<void | undefined>
}


export const hmoService: HMOService = {
  async export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${ResourceKey.HMOS}/export`, {
        params: params,
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAll(params: PageableRequest): Promise<Pageable<HMO> | undefined> {
    try {
      const {data: paginatedHMOs} = await pamsAPI.get<Pageable<HMO>>(`/${ResourceKey.HMOS}`, {
        params: params,
      })

      return paginatedHMOs
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAllLookup(params: PageableRequest): Promise<Pageable<Lookup> | undefined> {
    try {
      const {data: paginatedHMOLookups} = await pamsAPI.get<Pageable<Lookup>>(`/${ResourceKey.HMOS}/lookup`, {
        params: params,
      })
      return paginatedHMOLookups
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async save(params: HMOSaveRequestParams): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.post<void>(`/${ResourceKey.HMOS}`, null, {
        params: params
      })

      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.patch<void>(`/${ResourceKey.HMOS}/${id}/status`)
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async update(payload: HMOEditRequestPayload): Promise<void | undefined> {
    try {
      const {id, ...params} = payload
      const {data: response} = await pamsAPI.put(`/${ResourceKey.HMOS}/${id}`, null, {
        params: params
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  }

}

