import {computed, ref} from "vue"
import axios, {HttpStatusCode} from "axios"
import {useToast} from "primevue/usetoast"
import type {Pageable} from "@/models/paging.ts"
import type {OfferLookupDTO} from "@/models/global.model.ts"
import {pamsAPI} from "@/utils/axios-interceptor"
import {OfferResourceKey} from "@/utils/keys/resource-key"
import {errorToast} from "@/utils/toast.util"
import {loadBackendPromosMasterCatalog} from "@/features/promos-offers/composables/promos-master-catalog.composable"

export type ServiceType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

export interface SingleService {
  id: string
  type: ServiceType
  name: string
  price: number
  status: string
}

export function useLguPromosCatalog() {
  const toast = useToast()
  const isLoading = ref(false)
  const refreshPromise = ref<Promise<unknown> | null>(null)

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

  const ensureRefreshed = async (): Promise<void> => {
    if (!refreshPromise.value) {
      refreshPromise.value = pamsAPI.post("/refresh-tokens").finally(() => {
        refreshPromise.value = null
      })
    }
    await refreshPromise.value
  }

  const withRefreshRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation()
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = String(error.response?.data?.message || error.response?.data?.detail || error.message || "").toLowerCase()
        const shouldRefresh =
          status === HttpStatusCode.Unauthorized ||
          status === HttpStatusCode.InternalServerError ||
          message.includes("expired") ||
          message.includes("jwt")
        if (shouldRefresh) {
          await ensureRefreshed()
          return await operation()
        }
      }
      throw error
    }
  }

  const loadCatalog = async (): Promise<void> => {
    try {
      const {machineServices: backendMachines, techniqueServices: backendTechniques} = await loadBackendPromosMasterCatalog()
      machineServices.value = backendMachines as SingleService[]
      techniqueServices.value = backendTechniques as SingleService[]

      const [evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes] = await Promise.all([
        withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/evaluations", {params: {page: 1, size: 1000, name: "", status: "ALL"}})),
        withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/add-on-machines", {params: {page: 1, size: 1000, name: "", status: "ALL"}})),
        withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/add-on-techniques", {params: {page: 1, size: 1000, name: "", status: "ALL"}})),
        withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/add-on-home-services", {params: {page: 1, size: 1000, name: "", status: "ALL"}})),
      ])

      customServices.value = [
        ...(evaluationsRes.data?.content ?? []).map((item: any) => ({id: `evaluation-${item.id}`, type: "evaluation" as ServiceType, name: String(item.name ?? ""), price: Number(item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
        ...(addOnMachinesRes.data?.content ?? []).map((item: any) => ({id: `add-on-machine-${item.id}`, type: "add-on-machine" as ServiceType, name: String(item.name ?? ""), price: Number(item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
        ...(addOnTechniquesRes.data?.content ?? []).map((item: any) => ({id: `add-on-technique-${item.id}`, type: "add-on-technique" as ServiceType, name: String(item.name ?? ""), price: Number(item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
        ...(addOnHomeRes.data?.content ?? []).map((item: any) => ({id: `add-on-home-service-${item.id}`, type: "add-on-home-service" as ServiceType, name: String(item.name ?? ""), price: Number(item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
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
