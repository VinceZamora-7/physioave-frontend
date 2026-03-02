import {useMutation} from "@tanstack/vue-query";
import {logoutService} from "@/services/logout.service.ts";
import type {APIError} from "@/utils/error-handler.ts";
import {LogoutTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const useLogout = () => {
  return useMutation<void, APIError, void>({
    mutationKey: [LogoutTanstackKey.LOGOUT],
    mutationFn: logoutService.logout
  })
}
