import {computed, ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {clinicService} from "@/features/clinics/api/clinic.service"
import type {Clinic} from "@/features/clinics/types/clinic";
import {defaultPage, defaultPageSize} from "@/models/paging"

const SELECTED_CLINIC_STORAGE_KEY = "selected_clinic_id"

const readStoredClinicId = (): number | undefined => {
  const raw = localStorage.getItem(SELECTED_CLINIC_STORAGE_KEY)
  if (!raw) return undefined

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return parsed
}

export const clinicStore = defineStore('clinicStore', () => {
  const clinic = ref<Clinic | undefined>()
  const clinicOptions = ref<Clinic[]>([])
  const isLoadingClinics = ref(false)
  const hasLoadedClinics = ref(false)
  const selectedClinicId = ref<number | undefined>(readStoredClinicId())

  const selectedClinic = computed(() =>
    clinicOptions.value.find((item) => item.id === selectedClinicId.value)
  )

  const persistSelectedClinicId = (id: number | undefined) => {
    if (typeof id === "number" && Number.isFinite(id) && id > 0) {
      localStorage.setItem(SELECTED_CLINIC_STORAGE_KEY, String(id))
      return
    }

    localStorage.removeItem(SELECTED_CLINIC_STORAGE_KEY)
  }

  const setSelectedClinicId = (id: number | string | undefined) => {
    const parsed = typeof id === "number" ? id : Number(id)
    const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    selectedClinicId.value = normalized
    clinic.value = clinicOptions.value.find((item) => item.id === normalized)
    persistSelectedClinicId(normalized)
  }

  const ensureSelectedClinic = () => {
    // Undefined means "All branches" (no clinic filter).
    if (selectedClinicId.value == null) {
      clinic.value = undefined
      return
    }

    const isSelectedStillValid = clinicOptions.value.some((item) => item.id === selectedClinicId.value)
    if (!isSelectedStillValid) {
      setSelectedClinicId(clinicOptions.value[0]?.id)
      return
    }

    clinic.value = selectedClinic.value
  }

  watch(selectedClinicId, (id) => {
    clinic.value = clinicOptions.value.find((item) => item.id === id)
    persistSelectedClinicId(id)
  })

  const loadClinics = async (force = false): Promise<Clinic[]> => {
    if (!force && hasLoadedClinics.value && clinicOptions.value.length > 0) {
      ensureSelectedClinic()
      return clinicOptions.value
    }

    try {
      isLoadingClinics.value = true
      const paged = await clinicService.getAll({
        page: defaultPage,
        size: defaultPageSize,
        name: undefined,
        status: undefined,
      })
      clinicOptions.value = paged?.content ?? []
      hasLoadedClinics.value = true
      ensureSelectedClinic()
      return clinicOptions.value
    } finally {
      isLoadingClinics.value = false
    }
  }

  const resetClinic = () => {
    clinic.value = undefined
    setSelectedClinicId(undefined)
    clinicOptions.value = []
    hasLoadedClinics.value = false
  }

  return {
    clinic,
    clinicOptions,
    isLoadingClinics,
    selectedClinicId,
    selectedClinic,
    setSelectedClinicId,
    loadClinics,
    resetClinic,
  }
})
