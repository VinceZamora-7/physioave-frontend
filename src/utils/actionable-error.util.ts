import axios from "axios"
import { APIError } from "@/utils/error-handler"

export type ApiErrorMessageOptions = {
  baseMessage: string
  permissionHint?: string
  invalidInputHint?: string
  notFoundHint?: string
  retryHint?: string
}

const normalizeBaseMessage = (value: string): string => value.trim().replace(/[.\s]+$/g, "")

export const getApiErrorMessage = (error: unknown, options: ApiErrorMessageOptions): string => {
  const baseMessage = `${normalizeBaseMessage(options.baseMessage)}.`

  if (error instanceof APIError) {
    if (error.status === 403) {
      const permissionSentence = options.permissionHint
        ? ` Ask an admin to grant ${options.permissionHint}.`
        : ""
      return `${baseMessage} This role does not have permission for this action.${permissionSentence}`
    }

    if (error.status === 401) {
      return `${baseMessage} Your session has expired. Please log in again and retry.`
    }

    if (error.status === 404) {
      return options.notFoundHint ? `${baseMessage} ${options.notFoundHint}` : `${baseMessage} The requested record was not found. Refresh and try again.`
    }

    if (error.status === 400 && error.message.trim()) {
      return `${baseMessage} ${error.message}`
    }

    if (error.message.trim()) {
      return `${baseMessage} ${error.message}`
    }
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const apiMessage = String(error.response?.data?.message ?? error.response?.data?.detail ?? "").trim()

    if (status === 403) {
      const permissionSentence = options.permissionHint
        ? ` Ask an admin to grant ${options.permissionHint}.`
        : ""
      return `${baseMessage} This role does not have permission for this action.${permissionSentence}`
    }

    if (status === 401) {
      return `${baseMessage} Your session has expired. Please log in again and retry.`
    }

    if (status === 404) {
      return options.notFoundHint ? `${baseMessage} ${options.notFoundHint}` : `${baseMessage} The requested record was not found. Refresh and try again.`
    }

    if (status === 400) {
      if (apiMessage) return `${baseMessage} ${apiMessage}`
      return options.invalidInputHint
        ? `${baseMessage} ${options.invalidInputHint}`
        : `${baseMessage} Some inputs are invalid. Please review the values and try again.`
    }

    if (status && status >= 500) {
      return `${baseMessage} The server is temporarily unavailable. Please try again in a few minutes.`
    }

    if (apiMessage) {
      return `${baseMessage} ${apiMessage}`
    }

    return options.retryHint ? `${baseMessage} ${options.retryHint}` : `${baseMessage} Please try again.`
  }

  if (error instanceof Error && /network|timeout|failed to fetch/i.test(error.message)) {
    return `${baseMessage} Cannot connect to the server. Check your internet or VPN, then try again.`
  }

  return options.retryHint ? `${baseMessage} ${options.retryHint}` : `${baseMessage} Please try again.`
}
