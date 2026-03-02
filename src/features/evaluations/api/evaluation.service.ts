import type {Pageable, PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {OfferLookupDTO} from "@/models/global.model.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import type {Evaluation, OfferEditPayload, OfferRequest} from "@/features/offers/types/offer";
import {OfferResourceKey} from "@/utils/keys/resource-key.ts";

interface EvaluationService {
  getAll(params: PageableRequest): Promise<Pageable<Evaluation> | undefined>

  export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: PageableRequest): Promise<Pageable<OfferLookupDTO> | undefined>

  save(params: OfferRequest): Promise<void | undefined>

  update(payload: OfferEditPayload): Promise<void | undefined>

  toggleStatus(id: number): Promise<void | undefined>
}


export const evaluationService: EvaluationService = {
  async export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${OfferResourceKey.EVALUATIONS}/export`, {
        params: params,
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAll(params: PageableRequest): Promise<Pageable<Evaluation> | undefined> {
    try {
      const {data: paginatedEvaluations} = await pamsAPI.get<Pageable<Evaluation>>(`/${OfferResourceKey.EVALUATIONS}`, {
        params: params,
      })

      return paginatedEvaluations
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAllLookup(params: PageableRequest): Promise<Pageable<OfferLookupDTO> | undefined> {
    try {
      const {data: paginatedEvaluationLookups} = await pamsAPI.get<Pageable<OfferLookupDTO>>(`/${OfferResourceKey.EVALUATIONS}/lookup`, {
        params: params,
      })
      return paginatedEvaluationLookups
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async save(params: OfferRequest): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.post<void>(`/${OfferResourceKey.EVALUATIONS}`, null, {
        params: params
      })

      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.patch<void>(`/${OfferResourceKey.EVALUATIONS}/${id}/status`)
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async update(payload: OfferEditPayload): Promise<void | undefined> {
    try {
      const {id, ...params} = payload
      const {data: response} = await pamsAPI.put(`/${OfferResourceKey.EVALUATIONS}/${id}`, null, {
        params: params
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  }

}

