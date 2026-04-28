import axios from "axios";

/**
 * Helpers
 */
const scheme = import.meta.env.VITE_SCHEME || "http";

function joinUrl(...parts: Array<string | undefined>) {
  return parts
    .filter(Boolean)
    .map((p) => String(p).replace(/^\/+|\/+$/g, "")) // trim leading/trailing slashes
    .join("/");
}

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
    import.meta.env.VITE_PAMS_PORT,
    import.meta.env.VITE_PAMS_CONTEXT_PATH
  )

export const pamsAPI = axios.create({
  baseURL: pamsBaseURL,
  withCredentials: true
})
