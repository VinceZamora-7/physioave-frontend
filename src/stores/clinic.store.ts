import {ref} from 'vue'
import {defineStore} from 'pinia'
import type {Clinic} from "@/features/clinics/types/clinic";

export const clinicStore = defineStore('clinicStore', () => {
  const clinic = ref<Clinic | undefined>()

  const resetClinic = () => {
    clinic.value = undefined
  }

  return {clinic, resetClinic}
})
