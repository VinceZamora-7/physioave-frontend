export const SINGLE_PAY_SERVICES_KEY = "singlePayServices"
export const BUNDLED_SERVICES_KEY = "bundledServices"
export const PACKAGE_SERVICES_KEY = "packageServiceOffers"
export const HMO_PROFILES_KEY = "hmoProfiles"
export const HMO_PRICE_LISTS_KEY = "hmoPriceLists"

export type PromosServiceCatalogType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

export interface PromosServiceCatalogItem {
  id: string
  type: PromosServiceCatalogType
  name: string
  price: number
  status: string
}

export const readPromosStorageArray = <T>(key: string): T[] => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export const writePromosStorageArray = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const readActivePromosServiceCatalog = (): PromosServiceCatalogItem[] =>
  readPromosStorageArray<PromosServiceCatalogItem>(SINGLE_PAY_SERVICES_KEY)
    .filter(item => item && typeof item === "object")
    .filter(item => item.status !== "Inactive")
