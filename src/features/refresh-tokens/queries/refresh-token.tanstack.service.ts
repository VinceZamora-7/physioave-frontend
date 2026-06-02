import {keepPreviousData, useMutation, useQuery} from "@tanstack/vue-query";
import {refreshTokenService} from "@/features/refresh-tokens/api/refresh-token.service";
import type {Pageable, PageRequestWithStatus} from "@/models/paging.ts";
import type {RefreshToken} from "@/features/refresh-tokens/types/refresh-token";
import type {APIError} from "@/utils/error-handler.ts";
import type {Ref} from "vue";
import {RefreshTokenTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const refreshTokenTanstackService = {
  getAll(
    params: Ref<PageRequestWithStatus>,
    key: RefreshTokenTanstackKey = RefreshTokenTanstackKey.REFRESH_TOKENS
  ) {
    return useQuery<Pageable<RefreshToken> | undefined>({
      queryKey: [key],
      queryFn: () => refreshTokenService.getAll(params.value),
      placeholderData: keepPreviousData,
      retry: 1
    })
  },

  delete(key: RefreshTokenTanstackKey = RefreshTokenTanstackKey.REFRESH_TOKENS) {
    return useMutation<void | undefined, APIError, number>({
      mutationKey: [key],
      mutationFn: refreshTokenService.delete
    })
  }

}

