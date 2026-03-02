import type {Reference} from "@/models/reference.ts";

import type {Pageable} from "@/models/paging.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import type {ReferenceTanstackKey} from "@/utils/keys/tanstack-key.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

export interface ReferenceService<T extends Reference> {
  getAll(params: Record<string, any>): Promise<Pageable<T> | undefined>
}

export const createReferenceService = <T extends Reference>(key: ReferenceTanstackKey): ReferenceService<T> => {
  return {
    async getAll(params: Record<string, any>): Promise<Pageable<T> | undefined> {
      try {
        const {data: paginatedReferences} = await pamsAPI.get<Pageable<T>>(`/${ResourceKey.REFERENCES}/${key}`, {
          params: params
        })

        return paginatedReferences
      } catch (error: unknown) {
        errorHandler(error)
      }
    }
  }
}
