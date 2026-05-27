import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"
import type { ServiceType } from "@/features/promos-offers/composables/lgu-promos-catalog.composable"
import {
  LGU_BUNDLES_API_PATH,
  LGU_LOCAL_SERVICE_ENDPOINTS,
  PACKAGE_OFFERS_API_PATH,
  normalizeOfferScope,
  resolveBundleApiPath
} from "@/features/promos-offers/lgu/lgu-module.config"

export type OfferScope = "GLOBAL" | "LGU"

export type BundleLookup = {
  id: number
  name: string
  bundled_price?: number
  is_active: boolean
}

export type LguAddOnSyncOptions = {
  dryRun?: boolean
  includeInactive?: boolean
  confirmWrite?: boolean
}

export type LguAddOnSyncSummary = {
  options: {
    includeInactive: boolean
    dryRun: boolean
  }
  machine: { scanned: number; inserted: number; skipped: number }
  technique: { scanned: number; inserted: number; skipped: number }
  home_service: { scanned: number; inserted: number; skipped: number }
  total: { scanned: number; inserted: number; skipped: number }
}

export async function listBundlesByScope(scope: unknown): Promise<Pageable<BundleLookup>> {
  const apiPath = resolveBundleApiPath(scope)
  const { data } = await pamsAPI.get<Pageable<BundleLookup>>(apiPath, {
    params: { page: 1, size: 1000, name: "", status: "ALL" }
  })
  return data
}

export async function listLguBundles(): Promise<Pageable<BundleLookup>> {
  const { data } = await pamsAPI.get<Pageable<BundleLookup>>(LGU_BUNDLES_API_PATH, {
    params: { page: 1, size: 1000, name: "", status: "ALL" }
  })
  return data
}

export async function listPackageOffersByScope<T>(scope: unknown): Promise<Pageable<T>> {
  const normalizedScope = normalizeOfferScope(scope)
  const { data } = await pamsAPI.get<Pageable<T>>(PACKAGE_OFFERS_API_PATH, {
    params: { page: 1, size: 1000, name: "", status: "ALL", scope: normalizedScope }
  })
  return data
}

export async function createPackageOffer(payload: Record<string, unknown>): Promise<void> {
  await pamsAPI.post(PACKAGE_OFFERS_API_PATH, payload)
}

export async function updatePackageOffer(id: number, payload: Record<string, unknown>): Promise<void> {
  await pamsAPI.put(`${PACKAGE_OFFERS_API_PATH}/${id}`, payload)
}

export async function togglePackageOfferStatus(id: number): Promise<void> {
  await pamsAPI.patch(`${PACKAGE_OFFERS_API_PATH}/${id}/status`)
}

export async function listLguLocalServices<T>(type: ServiceType): Promise<Pageable<T>> {
  const { data } = await pamsAPI.get<Pageable<T>>(LGU_LOCAL_SERVICE_ENDPOINTS[type], {
    params: { page: 1, size: 1000, name: "", status: "ALL" }
  })
  return data
}

export async function createLguLocalService(type: ServiceType, payload: Record<string, unknown>): Promise<void> {
  await pamsAPI.post(LGU_LOCAL_SERVICE_ENDPOINTS[type], payload)
}

export async function updateLguLocalService(type: ServiceType, id: number, payload: Record<string, unknown>): Promise<void> {
  await pamsAPI.put(`${LGU_LOCAL_SERVICE_ENDPOINTS[type]}/${id}`, payload)
}

export async function toggleLguLocalServiceStatus(type: ServiceType, id: number): Promise<void> {
  await pamsAPI.patch(`${LGU_LOCAL_SERVICE_ENDPOINTS[type]}/${id}/status`)
}

export async function syncLguAddOns(options: LguAddOnSyncOptions = {}): Promise<LguAddOnSyncSummary> {
  const { data } = await pamsAPI.post<LguAddOnSyncSummary>("/lgu-billing/catalog-sync/add-ons", {
    dry_run: options.dryRun ?? true,
    include_inactive: options.includeInactive ?? false,
    confirm_write: options.confirmWrite ?? false
  })
  return data
}
