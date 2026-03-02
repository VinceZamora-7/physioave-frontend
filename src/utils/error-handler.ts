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

export const errorHandler = (error: unknown): undefined => {
  if (axios.isAxiosError(error)) {

    throw new APIError(error.response?.data ?? error.message, error.response?.status)
  }

  throw new APIError('Unexpected error occurred!')
}

export const zodErrorHandler = (toast: ToastServiceMethods, error: unknown) => {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      warningToast(toast, issue.message ?? 'Validation failed')
    }
  }
}
