import type {Pageable, PageableRequest, PageRequestWithNameAndStatus} from "@/models/paging.ts";
import type {AxiosResponse} from "axios";
import type {OfferLookupDTO} from "@/models/global.model.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import type {Machine, OfferEditPayload, OfferRequest} from "@/features/offers/types/offer";
import {OfferResourceKey} from "@/utils/keys/resource-key.ts";

interface MachineService {
  getAll(params: PageableRequest): Promise<Pageable<Machine> | undefined>

  export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined>

  getAllLookup(params: PageableRequest): Promise<Pageable<OfferLookupDTO> | undefined>

  save(params: OfferRequest): Promise<void | undefined>

  update(payload: OfferEditPayload): Promise<void | undefined>

  toggleStatus(id: number): Promise<void | undefined>
}


export const machineService: MachineService = {
  async export(params: PageRequestWithNameAndStatus): Promise<AxiosResponse<Blob> | undefined> {
    try {
      return await pamsAPI.get(`/${OfferResourceKey.MACHINES}/export`, {
        params: params,
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAll(params: PageableRequest): Promise<Pageable<Machine> | undefined> {
    try {
      const {data: paginatedMachines} = await pamsAPI.get<Pageable<Machine>>(`/${OfferResourceKey.MACHINES}`, {
        params: params,
      })

      return paginatedMachines
    } catch (error: unknown) {
      errorHandler(error)

    }
  },
  async getAllLookup(params: PageableRequest): Promise<Pageable<OfferLookupDTO> | undefined> {
    try {
      const {data: paginatedMachineLookups} = await pamsAPI.get<Pageable<OfferLookupDTO>>(`/${OfferResourceKey.MACHINES}/lookup`, {
        params: params,
      })
      return paginatedMachineLookups
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async save(params: OfferRequest): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.post<void>(`/${OfferResourceKey.MACHINES}`, null, {
        params: params
      })

      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async toggleStatus(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.patch<void>(`/${OfferResourceKey.MACHINES}/${id}/status`)
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  },

  async update(payload: OfferEditPayload): Promise<void | undefined> {
    try {
      const {id, ...params} = payload
      const {data: response} = await pamsAPI.put(`/${OfferResourceKey.MACHINES}/${id}`, null, {
        params: params
      })
      return response
    } catch (error: unknown) {
      errorHandler(error)

    }
  }

}

