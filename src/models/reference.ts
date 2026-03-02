export interface Reference {
  id: number
  name: string
  is_active: boolean
}

export interface Role extends Reference {
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
}

export interface Religion extends Reference {
}

export interface MedicalCategory extends Reference {
}

export interface MedicalHistory extends Reference {
}

export interface MedicalDiagnose extends Reference {
}

export interface MedicalImaging extends Reference {
}

