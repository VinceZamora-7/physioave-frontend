export interface Reference {
  id: number
  name: string
  is_active: boolean
}

export type AppointmentProviderType = "NONE" | "DOCTOR_CONSULTANT" | "PHYSICAL_THERAPIST" | "PT_ASSISTANT" | "INTERN"
export type ReferralChannel = "ONLINE" | "OFFLINE"

export interface Role extends Reference {
  appointment_provider_type: AppointmentProviderType
  requires_specialty_tag: boolean
}

export interface Permission extends Reference {
  description: string
  module_id: number
  module_name: string
}

export interface Module extends Reference {
}

export interface HMOType extends Reference {
}

export interface PaymentMethod extends Reference {
}

export interface AppointmentStatus extends Reference {
  description: string
}

export interface AppointmentType extends Reference {
  color: string
}

export interface CivilStatus extends Reference {
}

export interface Gender extends Reference {
}

export interface ModeOfReferral extends Reference {
  referral_channel: ReferralChannel
}

export interface Religion extends Reference {
}

export interface MedicalCategory extends Reference {
}

export interface MedicalHistory extends Reference {
}

export interface MedicalDiagnose extends Reference {
}

export interface PTCaseImpression extends Reference {
}

export interface MedicalImaging extends Reference {
}

export interface TreatmentArea extends Reference {
  clinic_id: number
  color: string
}

export interface SpecialtyTag extends Reference {
}
