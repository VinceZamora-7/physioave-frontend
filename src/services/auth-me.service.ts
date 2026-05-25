import axios, { HttpStatusCode } from "axios"
import { errorHandler } from "@/utils/error-handler.ts"
import { pamsAPI } from "@/utils/axios-interceptor.ts"
import { clearAuthUserCache } from "@/utils/auth-user.util"

export interface AuthMe {
  id: number | null
  name: string
  email: string
  role_id: number
  role_name: string
  appointment_provider_type: "NONE" | "DOCTOR_CONSULTANT" | "PHYSICAL_THERAPIST" | "PT_ASSISTANT" | "INTERN"
  is_active: boolean
  permissions: string[]
  clinic_id: number | null
  can_view_all_branches: boolean
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
          clearAuthUserCache()
          return errorHandler(retryError)
        }
      }

      if (axios.isAxiosError(error) && error.response?.status === HttpStatusCode.Forbidden) {
        clearAuthUserCache()
      }

      return errorHandler(error)
    }
  },
}
