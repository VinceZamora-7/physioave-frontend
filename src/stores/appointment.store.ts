import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useStorage} from "@vueuse/core";
import type {Staff} from "@/models/staff.ts";
import type {Patient} from "@/models/patient.ts";

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show'
export type AttendanceStatus = 'pending' | 'present' | 'absent'
export type HomeServiceAttendanceStatus = 'not-applicable' | 'en-route' | 'arrived' | 'completed' | 'cancelled'

export interface AppointmentRecord {
  id: string
  patient_id: number
  patient_name: string
  doctor_id?: number
  doctor_name: string
  clinic_name: string
  appointment_at: string
  appointment_type: string
  status: AppointmentStatus
  attendance: AttendanceStatus
  is_home_service: boolean
  home_service_attendance: HomeServiceAttendanceStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface TreatmentCardEntry {
  id: string
  patient_id: number
  patient_name: string
  session_no: number
  treatment_date: string
  diagnosis: string
  treatment_plan: string
  therapist: string
  remarks?: string
  created_at: string
}

const makeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const appointmentStore = defineStore('appointmentStore', () => {
  const staff = ref<Staff | undefined>()
  const patient = ref<Patient | undefined>()
  const appointments = useStorage<AppointmentRecord[]>('pams:appointments', [])
  const treatmentCards = useStorage<TreatmentCardEntry[]>('pams:treatment-cards', [])

  const selectedPatientAppointments = computed(() => {
    if (!patient.value) return appointments.value
    return appointments.value.filter(a => a.patient_id === patient.value?.id)
  })

  const selectedPatientTreatmentCards = computed(() => {
    if (!patient.value) return treatmentCards.value
    return treatmentCards.value.filter(card => card.patient_id === patient.value?.id)
  })

  const resetStaff = () => {
    staff.value = undefined
  }

  const resetPatient = () => {
    patient.value = undefined
  }

  const scheduleAppointment = (payload: Omit<AppointmentRecord, 'id' | 'created_at' | 'updated_at'>): AppointmentRecord => {
    const now = new Date().toISOString()
    const newAppointment: AppointmentRecord = {
      ...payload,
      id: makeId(),
      created_at: now,
      updated_at: now
    }
    appointments.value = [newAppointment, ...appointments.value]
    return newAppointment
  }

  const updateAppointment = (id: string, patch: Partial<AppointmentRecord>): void => {
    appointments.value = appointments.value.map(appointment =>
      appointment.id === id
        ? {...appointment, ...patch, updated_at: new Date().toISOString()}
        : appointment
    )
  }

  const removeAppointment = (id: string): void => {
    appointments.value = appointments.value.filter(appointment => appointment.id !== id)
  }

  const saveTreatmentCard = (
    payload: Omit<TreatmentCardEntry, 'id' | 'created_at'>
  ): TreatmentCardEntry => {
    const newCard: TreatmentCardEntry = {
      ...payload,
      id: makeId(),
      created_at: new Date().toISOString()
    }
    treatmentCards.value = [newCard, ...treatmentCards.value]
    return newCard
  }

  const removeTreatmentCard = (id: string): void => {
    treatmentCards.value = treatmentCards.value.filter(card => card.id !== id)
  }

  return {
    staff,
    patient,
    appointments,
    treatmentCards,
    selectedPatientAppointments,
    selectedPatientTreatmentCards,

    resetStaff,
    resetPatient,
    scheduleAppointment,
    updateAppointment,
    removeAppointment,
    saveTreatmentCard,
    removeTreatmentCard
  }
})
