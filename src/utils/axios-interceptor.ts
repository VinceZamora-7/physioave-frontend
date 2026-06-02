import axios, { HttpStatusCode, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAuthUserCache } from "@/utils/auth-user.util";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
    authRefreshRetry?: boolean
  }

  export interface InternalAxiosRequestConfig {
    skipAuthRefresh?: boolean
    authRefreshRetry?: boolean
  }
}

/**
 * Helpers
 */
const scheme = import.meta.env.VITE_SCHEME || "http";

function normalizeBaseUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return raw.replace(/\/+$/g, "");
}

function buildBaseURL(host?: string, port?: string | number, contextPath?: string) {
  const h = host || "127.0.0.1";
  const p = port ? `:${port}` : "";
  const ctx = contextPath ? `/${String(contextPath).replace(/^\/+/, "")}` : "";
  return `${scheme}://${h}${p}${ctx}`;
}

/**
 * PLA
 */
const explicitPlaBaseURL = normalizeBaseUrl(import.meta.env.VITE_PLA_BASE_URL);
export const plaBaseURL =
  explicitPlaBaseURL ??
  buildBaseURL(
    import.meta.env.VITE_PLA_HOST || "127.0.0.1",
    import.meta.env.VITE_PLA_PORT,
    import.meta.env.VITE_PLA_CONTEXT_PATH
  );

export const plaAPI = axios.create({
  baseURL: plaBaseURL,
});

/**
 * FSA
 */
const explicitFsaBaseURL = normalizeBaseUrl(import.meta.env.VITE_FSA_BASE_URL);
export const fsaBaseURL =
  explicitFsaBaseURL ??
  buildBaseURL(
    import.meta.env.VITE_FSA_HOST || "127.0.0.1",
    import.meta.env.VITE_FSA_PORT,
    import.meta.env.VITE_FSA_CONTEXT_PATH
  );

export const fsaAPI = axios.create({
  baseURL: fsaBaseURL,
});

/**
 * PAMS
 * NOTE: host must be 127.0.0.1 if "localhost" is broken on your machine.
 */

const explicitPamsBaseURL = normalizeBaseUrl(import.meta.env.VITE_PAMS_BASE_URL);
export const pamsBaseURL =
  explicitPamsBaseURL ??
  buildBaseURL(
    import.meta.env.VITE_PAMS_HOST || "127.0.0.1",
    import.meta.env.VITE_PAMS_PORT || 8079,
    import.meta.env.VITE_PAMS_CONTEXT_PATH || "/api/v2/pams"
  )

export const pamsAPI = axios.create({
  baseURL: pamsBaseURL,
  withCredentials: true
})

let refreshTokenPromise: Promise<void> | null = null

const getRequestPath = (config?: InternalAxiosRequestConfig): string => {
  const rawUrl = String(config?.url ?? "")
  try {
    const parsed = new URL(rawUrl, pamsBaseURL)
    return parsed.pathname.replace(/^\/api\/v\d+\/pams/, "")
  } catch {
    return rawUrl
  }
}

const shouldAttemptAuthRefresh = (error: AxiosError): boolean => {
  const config = error.config
  if (!config) return false
  if (config.skipAuthRefresh || config.authRefreshRetry) return false
  if (error.response?.status !== HttpStatusCode.Unauthorized) return false

  const path = getRequestPath(config)
  return path !== "/refresh-tokens" && path !== "/auth/login" && !path.startsWith("/setup/")
}

const refreshAccessToken = async (): Promise<void> => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = pamsAPI
      .post<void>("/refresh-tokens", undefined, { skipAuthRefresh: true })
      .then(() => undefined)
      .finally(() => {
        refreshTokenPromise = null
      })
  }

  return refreshTokenPromise
}

pamsAPI.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (!shouldAttemptAuthRefresh(error)) {
      return Promise.reject(error)
    }

    try {
      await refreshAccessToken()
      const originalRequest = error.config
      if (!originalRequest) return Promise.reject(error)

      originalRequest.authRefreshRetry = true
      return await pamsAPI.request(originalRequest)
    } catch (refreshError) {
      clearAuthUserCache()
      return Promise.reject(refreshError)
    }
  }
)
