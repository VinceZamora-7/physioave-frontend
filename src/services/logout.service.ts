import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";

interface LogoutService {
  logout(): Promise<void | undefined>
}

export const logoutService: LogoutService = {
  async logout(): Promise<void | undefined> {
    try {
      const {data: response} = await pamsAPI.delete<void>(`/${ResourceKey.LOGOUT}`)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  }
}
