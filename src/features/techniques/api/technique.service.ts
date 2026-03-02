import type {Pageable, PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {OfferLookupDTO} from "@/models/global.model.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import type {OfferEditPayload, OfferRequest, Technique} from "@/features/offers/types/offer";
import {OfferResourceKey} from "@/utils/keys/resource-key.ts";

interface TechniqueService {
  getAll(params: PageableRequest): Promise<Pageable<Technique> | undefined>

  export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: PageableRequest): Promise<Pageable<OfferLookupDTO> | undefined>

  save(params: OfferRequest): Promise<void | undefined>

  update(payload: OfferEditPayload): Promise<void | undefined>

  toggleStatus(id: number): Promise<void | undefined>
}


export const techniqueService: TechniqueService = {
  async export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${OfferResourceKey.TECHNIQUES}/export`, {
        params: params,
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAll(params: PageableRequest): Promise<Pageable<Technique> | undefined> {
    try {
      const {data: paginatedTechniques} = await pamsAPI.get<Pageable<Technique>>(`/${OfferResourceKey.TECHNIQUES}`, {
        params: params,
      })

      return paginatedTechniques
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAllLookup(params: PageableRequest): Promise<Pageable<OfferLookupDTO> | undefined> {
    try {
      const {data: paginatedTechniqueLookups} = await pamsAPI.get<Pageable<OfferLookupDTO>>(`/${OfferResourceKey.TECHNIQUES}/lookup`, {
        params: params,
      })
      return paginatedTechniqueLookups
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async save(params: OfferRequest): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.post<void>(`/${OfferResourceKey.TECHNIQUES}`, null, {
        params: params
      })

      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.patch<void>(`/${OfferResourceKey.TECHNIQUES}/${id}/status`)
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async update(payload: OfferEditPayload): Promise<void | undefined> {
    try {
      const {id, ...params} = payload
      const {data: response} = await pamsAPI.put(`/${OfferResourceKey.TECHNIQUES}/${id}`, null, {
        params: params
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  }

}

