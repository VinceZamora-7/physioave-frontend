import axios, { HttpStatusCode } from "axios"
import { errorHandler } from "@/utils/error-handler.ts"
import { pamsAPI } from "@/utils/axios-interceptor.ts"
import { clearAuthUserCache } from "@/utils/auth-user.util"

export type AppointmentProviderType =
  | "NONE"
  | "DOCTOR_CONSULTANT"
  | "PHYSICAL_THERAPIST"
  | "PT_ASSISTANT"
  | "INTERN"

export interface AuthMe {
  id: number | null
  name: string
  email: string

  role_id: number
  role_name: string
  appointment_provider_type: AppointmentProviderType

  is_active: boolean
  permissions: string[]

  clinic_id: number | null
  can_view_all_branches: boolean

  secondary_role_id?: number | null
  secondary_role_name?: string | null
  secondary_appointment_provider_type?: AppointmentProviderType | null
}

interface AuthMeService {
  get(): Promise<AuthMe>
}

const isUnauthorizedError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === HttpStatusCode.Unauthorized
}

const isForbiddenError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === HttpStatusCode.Forbidden
}

const normalizeAuthMe = (authMe: AuthMe): AuthMe => {
  return {
    ...authMe,
    id: authMe.id ?? null,
    clinic_id: authMe.clinic_id ?? null,
    permissions: Array.isArray(authMe.permissions) ? authMe.permissions : [],
    is_active: Boolean(authMe.is_active),
    can_view_all_branches: Boolean(authMe.can_view_all_branches),
  }
}

const handleTerminalAuthError = (error: unknown): never => {
  if (isUnauthorizedError(error) || isForbiddenError(error)) {
    clearAuthUserCache()
  }

  errorHandler(error)

  throw error
}

export const authMeService: AuthMeService = {
  async get(): Promise<AuthMe> {
    try {
      const { data } = await pamsAPI.get<AuthMe>("/auth/me")
      return normalizeAuthMe(data)
    } catch (error: unknown) {
      return handleTerminalAuthError(error)
    }
  },
}
