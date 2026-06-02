import type {Pageable, PageRequestWithStatus} from "@/models/paging.ts";
import type {RefreshToken} from "@/features/refresh-tokens/types/refresh-token";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface RefreshTokenService {
  getAll(
    params: PageRequestWithStatus
  ): Promise<Pageable<RefreshToken> | undefined>

  delete(id: number): Promise<void | undefined>
}

export const refreshTokenService: RefreshTokenService = {
  async delete(id: number): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.delete<void>(`${ResourceKey.REFRESH_TOKENS}/${id}`)

      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async getAll(
    params: PageRequestWithStatus
  ): Promise<Pageable<RefreshToken> | undefined> {
    try {
      const {data: paginatedRefreshTokens} = await pamsAPI.get<Pageable<RefreshToken>>(`${ResourceKey.REFRESH_TOKENS}`, {
        params: params
      })

      return paginatedRefreshTokens
    } catch (error: unknown) {
      errorHandler(error)
    }
  }
}

