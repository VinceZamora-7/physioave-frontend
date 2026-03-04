import axios from 'axios'
import {ZodError} from "zod";
import {warningToast} from "@/utils/toast.util.ts";
import type {ToastServiceMethods} from "primevue";

export class APIError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'APIError'
    this.status = status
  }
}

export const errorHandler = (error: unknown): never => {
  if (error instanceof APIError) {
    throw error
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any
    const status = error.response?.status

    let message = error.message
    if (typeof data === "string") {
      message = data
    } else if (data?.detail) {
      message = data.detail
    } else if (Array.isArray(data?.errors) && data.errors.length) {
      message = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(", ")
    } else if (status === 403) {
      message = "Forbidden (403): You do not have permission to perform this action."
    } else if (status === 401) {
      message = "Unauthorized (401): Please login again."
    }

    throw new APIError(message, status)
  }

  if (typeof error === "object" && error !== null) {
    const e = error as any
    const status = e?.status ?? e?.response?.status
    const data = e?.response?.data ?? e?.data

    let message = e?.message
    if (typeof data === "string") {
      message = data
    } else if (data?.detail) {
      message = data.detail
    } else if (Array.isArray(data?.errors) && data.errors.length) {
      message = data.errors.map((item: any) => `${item.field}: ${item.message}`).join(", ")
    }

    if (typeof message === "string" && message.trim()) {
      throw new APIError(message, status)
    }
  }

  if (error instanceof Error && error.message.trim()) {
    throw new APIError(error.message)
  }

  throw new APIError("Unexpected error occurred!")
}


export const zodErrorHandler = (toast: ToastServiceMethods, error: unknown) => {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      warningToast(toast, issue.message ?? 'Validation failed')
    }
  }
}
