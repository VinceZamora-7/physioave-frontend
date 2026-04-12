import { machineService } from "@/services/machine.service"
import { techniqueService } from "@/services/technique.service"
import { Status } from "@/utils/global.type"
import type { PromosServiceCatalogType } from "@/features/promos-offers/composables/promos-storage.composable"

export interface PromosCatalogServiceItem {
  id: string
  type: PromosServiceCatalogType
  name: string
  price: number
  status: string
}

export interface PromosMasterCatalog {
  machineServices: PromosCatalogServiceItem[]
  techniqueServices: PromosCatalogServiceItem[]
}

export const isLocalEditablePromosService = (service: { type: PromosServiceCatalogType }): boolean =>
  service.type !== "machine" && service.type !== "technique"

export const normalizePromosServiceName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ")

export const mapBackendOfferToPromosService = (
  id: number,
  name: string,
  price: number,
  isActive: boolean,
  type: "machine" | "technique"
): PromosCatalogServiceItem => ({
  id: `${type}-${id}`,
  type,
  name,
  price,
  status: isActive ? "Active" : "Inactive"
})

export const loadBackendPromosMasterCatalog = async (): Promise<PromosMasterCatalog> => {
  const [machinesResponse, techniquesResponse] = await Promise.all([
    machineService.getAll({
      page: 1,
      size: 1000,
      name: undefined,
      status: Status.ALL
    }),
    techniqueService.getAll({
      page: 1,
      size: 1000,
      name: undefined,
      status: Status.ALL
    })
  ])

  return {
    machineServices: (machinesResponse?.content ?? []).map(machine =>
      mapBackendOfferToPromosService(machine.id, machine.name, Number(machine.price ?? 0), Boolean(machine.is_active), "machine")
    ),
    techniqueServices: (techniquesResponse?.content ?? []).map(technique =>
      mapBackendOfferToPromosService(technique.id, technique.name, Number(technique.price ?? 0), Boolean(technique.is_active), "technique")
    )
  }
}

export const partitionPromosCustomServices = <T extends PromosCatalogServiceItem>(services: T[]) => {
  const customOnlyServices = services.filter(service => isLocalEditablePromosService(service))
  const legacyMachineTechniqueEntries = services.filter(service => !isLocalEditablePromosService(service))
  return { customOnlyServices, legacyMachineTechniqueEntries }
}

export const remapLegacyPromosServiceId = <T extends PromosCatalogServiceItem>(
  id: string,
  serviceType: "machine" | "technique",
  backendByName: Map<string, string>,
  legacyById: Map<string, T>
): string => {
  const backendPrefix = `${serviceType}-`
  if (id.startsWith(backendPrefix)) return id
  const legacy = legacyById.get(id)
  if (!legacy || legacy.type !== serviceType) return id
  return backendByName.get(normalizePromosServiceName(legacy.name)) ?? id
}
