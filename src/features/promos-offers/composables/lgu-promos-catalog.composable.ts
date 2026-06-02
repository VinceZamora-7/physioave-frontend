import {computed, ref} from "vue"
import {useToast} from "primevue/usetoast"
import type {Pageable} from "@/models/paging.ts"
import type {OfferLookupDTO} from "@/models/global.model.ts"
import {pamsAPI} from "@/utils/axios-interceptor"
import {OfferResourceKey} from "@/utils/keys/resource-key"
import {errorToast} from "@/utils/toast.util"
import {listLguLocalServices} from "@/features/promos-offers/lgu/lgu-module.api"
import {listLguMachines} from "@/features/promos-offers/lgu/lgu-machines.module"
import {listLguTechniques} from "@/features/promos-offers/lgu/lgu-techniques.module"

export type ServiceType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

export interface SingleService {
  id: string
  type: ServiceType
  name: string
  price: number
  status: string
}

type BackendCatalogRow = Record<string, unknown>

const toServiceStatus = (value: unknown): string => value ? "Active" : "Inactive"

export function useLguPromosCatalog() {
  const toast = useToast()
  const isLoading = ref(false)

  const machineServices = ref<SingleService[]>([])
  const techniqueServices = ref<SingleService[]>([])
  const customServices = ref<SingleService[]>([])
  const sessionLookupServices = ref<Array<{id: string; name: string; price: number}>>([])

  const allServices = computed<SingleService[]>(() => [
    ...machineServices.value,
    ...techniqueServices.value,
    ...customServices.value
  ])

  const bundleMachineOptions = computed(() =>
    machineServices.value.filter(s => s.status !== "Inactive").map(s => ({id: s.id, name: s.name}))
  )
  const bundleTechniqueOptions = computed(() =>
    techniqueServices.value.filter(s => s.status !== "Inactive").map(s => ({id: s.id, name: s.name}))
  )
  const bundleEvaluationOptions = computed(() =>
    customServices.value.filter(s => s.type === "evaluation" && s.status !== "Inactive").map(s => ({id: s.id, name: s.name}))
  )

  const getServiceName = (id: string): string => {
    const local = allServices.value.find(s => s.id === id)
    if (local?.name) return local.name
    return sessionLookupServices.value.find(s => s.id === id)?.name ?? id
  }

  const getServicePrice = (id: string): number => {
    const local = allServices.value.find(s => s.id === id)
    if (local?.price != null) return local.price
    return sessionLookupServices.value.find(s => s.id === id)?.price ?? 0
  }

  const withRefreshRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
    return await operation()
  }

  const loadCatalog = async (): Promise<void> => {
    try {
      const [machinesRes, techniquesRes, evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes] = await Promise.all([
        withRefreshRetry(() => listLguMachines()),
        withRefreshRetry(() => listLguTechniques()),
        withRefreshRetry(() => listLguLocalServices<BackendCatalogRow>("evaluation")),
        withRefreshRetry(() => listLguLocalServices<BackendCatalogRow>("add-on-machine")),
        withRefreshRetry(() => listLguLocalServices<BackendCatalogRow>("add-on-technique")),
        withRefreshRetry(() => listLguLocalServices<BackendCatalogRow>("add-on-home-service")),
      ])

      machineServices.value = (machinesRes.content ?? []).map((item) => ({
        id: `machine-${item.id}`,
        type: "machine" as ServiceType,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: toServiceStatus(item.is_active)
      }))

      techniqueServices.value = (techniquesRes.content ?? []).map((item) => ({
        id: `technique-${item.id}`,
        type: "technique" as ServiceType,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: toServiceStatus(item.is_active)
      }))

      customServices.value = [
        ...(evaluationsRes.content ?? []).map((item) => ({id: `evaluation-${item.id}`, type: "evaluation" as ServiceType, name: String(item.name ?? ""), price: Number(item.price ?? 0), status: toServiceStatus(item.is_active)})),
        ...(addOnMachinesRes.content ?? []).map((item) => ({id: `add-on-machine-${item.id}`, type: "add-on-machine" as ServiceType, name: String(item.name ?? item.machine_name ?? ""), price: Number(item.add_on_price ?? item.price ?? 0), status: toServiceStatus(item.is_active)})),
        ...(addOnTechniquesRes.content ?? []).map((item) => ({id: `add-on-technique-${item.id}`, type: "add-on-technique" as ServiceType, name: String(item.name ?? item.technique_name ?? ""), price: Number(item.add_on_price ?? item.price ?? 0), status: toServiceStatus(item.is_active)})),
        ...(addOnHomeRes.content ?? []).map((item) => ({id: `add-on-home-service-${item.id}`, type: "add-on-home-service" as ServiceType, name: String(item.name ?? item.label ?? `Home Service - ${item.start ?? ""} km`), price: Number(item.add_on_price ?? item.price ?? 0), status: toServiceStatus(item.is_active)})),
      ]
    } catch {
      machineServices.value = []
      techniqueServices.value = []
      customServices.value = []
    }
  }

  const loadSessionLookup = async (): Promise<void> => {
    try {
      const {data} = await withRefreshRetry(() =>
        pamsAPI.get<Pageable<OfferLookupDTO>>(`/${OfferResourceKey.SESSIONS}/lookup`, {
          params: {page: 1, size: 200, name: "", status: "ACTIVE"}
        })
      )
      sessionLookupServices.value = (data.content ?? []).map(item => ({
        id: String(item.id),
        name: item.name,
        price: Number(item.price ?? 0)
      }))
    } catch {
      sessionLookupServices.value = []
      errorToast(toast, "Failed to load recurring PT sessions")
    }
  }

  const load = async (): Promise<void> => {
    isLoading.value = true
    try {
      await Promise.all([loadCatalog(), loadSessionLookup()])
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    allServices,
    machineServices,
    techniqueServices,
    customServices,
    sessionLookupServices,
    bundleMachineOptions,
    bundleTechniqueOptions,
    bundleEvaluationOptions,
    getServiceName,
    getServicePrice,
    withRefreshRetry,
    load
  }
}
