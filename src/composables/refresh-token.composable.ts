import {type Ref, watch} from "vue";
import type {APIError} from "@/utils/error-handler.ts";
import {refreshTokenTanstackService} from "@/features/refresh-tokens/queries/refresh-token.tanstack.service";
import {useLogout} from "@/services/logout-tanstack.service.ts";
import {HttpStatusCode} from "axios";
import {useRouter} from "vue-router";
import type {QueryObserverResult, RefetchOptions} from "@tanstack/vue-query";

export const useRefreshToken = <TData>(
  error: Ref<APIError | null>,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData>>
) => {

  const router = useRouter()
  const {
    mutate: refreshAccessToken
  } = refreshTokenTanstackService.refresh()

  const {
    mutate: logoutMutation
  } = useLogout()

  watch(error, (newVal) => {
    if (newVal?.status !== HttpStatusCode.Unauthorized) return

    refreshAccessToken(undefined, {
      async onSuccess() {
        await refetch()
      },
      async onError() {
        logoutMutation(undefined, {
          async onSuccess() {
            await router.push("/")
          },
          async onError() {
            await router.push("/")
          },
        })
      },
    })
  })
}

