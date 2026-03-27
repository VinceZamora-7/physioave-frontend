import axios, { HttpStatusCode } from "axios"
import { errorHandler } from "@/utils/error-handler.ts"
import { pamsAPI } from "@/utils/axios-interceptor.ts"

export interface AuthMe {
  id: number | null
  name: string
  email: string
  role_id: number
  role_name: string
  is_active: boolean
  permissions: string[]
}

interface AuthMeService {
  get(): Promise<AuthMe | undefined>
}

export const authMeService: AuthMeService = {
  async get(): Promise<AuthMe | undefined> {
    try {
      const { data } = await pamsAPI.get<AuthMe>("/auth/me")
      return data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === HttpStatusCode.Unauthorized) {
        try {
          await pamsAPI.post("/refresh-tokens")
          const { data } = await pamsAPI.get<AuthMe>("/auth/me")
          return data
        } catch (retryError: unknown) {
          return errorHandler(retryError)
        }
      }

      return errorHandler(error)
    }
  },
}
