import {computed, ref} from "vue"
import axios, {HttpStatusCode} from "axios"
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
      const [machinesRes, techniquesRes, evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes] = await Promise.all([
        withRefreshRetry(() => listLguMachines()),
        withRefreshRetry(() => listLguTechniques()),
        withRefreshRetry(() => listLguLocalServices<any>("evaluation")),
        withRefreshRetry(() => listLguLocalServices<any>("add-on-machine")),
        withRefreshRetry(() => listLguLocalServices<any>("add-on-technique")),
        withRefreshRetry(() => listLguLocalServices<any>("add-on-home-service")),
      ])

      machineServices.value = (machinesRes.content ?? []).map((item: any) => ({
        id: `machine-${item.id}`,
        type: "machine" as ServiceType,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: item.is_active ? "Active" : "Inactive"
      }))

      techniqueServices.value = (techniquesRes.content ?? []).map((item: any) => ({
        id: `technique-${item.id}`,
        type: "technique" as ServiceType,
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        status: item.is_active ? "Active" : "Inactive"
      }))

      customServices.value = [
        ...(evaluationsRes.content ?? []).map((item: any) => ({id: `evaluation-${item.id}`, type: "evaluation" as ServiceType, name: String(item.name ?? ""), price: Number(item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
        ...(addOnMachinesRes.content ?? []).map((item: any) => ({id: `add-on-machine-${item.id}`, type: "add-on-machine" as ServiceType, name: String(item.name ?? item.machine_name ?? ""), price: Number(item.add_on_price ?? item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
        ...(addOnTechniquesRes.content ?? []).map((item: any) => ({id: `add-on-technique-${item.id}`, type: "add-on-technique" as ServiceType, name: String(item.name ?? item.technique_name ?? ""), price: Number(item.add_on_price ?? item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
        ...(addOnHomeRes.content ?? []).map((item: any) => ({id: `add-on-home-service-${item.id}`, type: "add-on-home-service" as ServiceType, name: String(item.name ?? item.label ?? `Home Service - ${item.start ?? ""} km`), price: Number(item.add_on_price ?? item.price ?? 0), status: item.is_active ? "Active" : "Inactive"})),
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
