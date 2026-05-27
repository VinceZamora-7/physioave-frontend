import type { ServiceType } from "@/features/promos-offers/composables/lgu-promos-catalog.composable"

export const LGU_BUNDLES_API_PATH = "/lgu-service-bundles"
export const GLOBAL_BUNDLES_API_PATH = "/service-bundles"
export const PACKAGE_OFFERS_API_PATH = "/package-service-offers"

export const LGU_TABLE_NAMES = {
  services: "LGU All Services",
  packages: "LGU Packages",
  bundles: "LGU Bundles"
} as const

export const LGU_LOCAL_SERVICE_ENDPOINTS: Record<ServiceType, string> = {
  machine: "/lgu-machines",
  technique: "/lgu-techniques",
  evaluation: "/lgu-evaluations",
  "add-on-machine": "/lgu-add-on-machines",
  "add-on-technique": "/lgu-add-on-techniques",
  "add-on-home-service": "/lgu-add-on-home-services"
}

export const LGU_LOCAL_SERVICE_PREFIXES: Record<ServiceType, string> = {
  machine: "machine-",
  technique: "technique-",
  evaluation: "evaluation-",
  "add-on-machine": "add-on-machine-",
  "add-on-technique": "add-on-technique-",
  "add-on-home-service": "add-on-home-service-"
}

export function normalizeOfferScope(value: unknown): "GLOBAL" | "LGU" {
  return String(value ?? "GLOBAL").trim().toUpperCase() === "LGU" ? "LGU" : "GLOBAL"
}

export function resolveBundleApiPath(value: unknown): string {
  return normalizeOfferScope(value) === "LGU" ? LGU_BUNDLES_API_PATH : GLOBAL_BUNDLES_API_PATH
}
