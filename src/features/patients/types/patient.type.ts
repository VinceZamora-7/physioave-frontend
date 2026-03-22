import type {Patient} from "@/features/patients/types/patient";
import type {ButtonProps} from "primevue";
import type {FormSubmitEvent} from "@primevue/forms";
import type {
  CivilStatus,
  Gender,
  HMOType,
  MedicalCategory,
  MedicalDiagnose,
  MedicalHistory,
  MedicalImaging,
  ModeOfReferral,
  Religion
} from "@/models/reference.ts";
import type {Lookup} from "@/models/global.model.ts";
import type {Region} from "@/models/philippine-location.ts";
import type {DraftService} from "@/services/draft.service.ts";
import type {QueryClient} from "@tanstack/vue-query";
import type {PatientFormState} from "@/features/patients/schema/patient.schema";
import type {PatientAttachmentTanstackKey} from "@/utils/keys/tanstack-key.ts";

export interface PatientFormProps {
  selectedPatient?: Patient
  isLoading: boolean
  buttonProps: ButtonProps,
  draftService: DraftService<PatientFormState>
  queryClient: QueryClient

  genders: Gender[]
  civilStatuses: CivilStatus[]
  religions: Religion[]
  modeOfReferrals: ModeOfReferral[]
  clinics: Lookup[]
  doctors: Lookup[]

  regions: Region[]
}

export interface PatientFormEmits {
  onSubmit: [event: FormSubmitEvent]
  onClose: []
}

export interface PatientMedicalCategoryDialogProps {
  header: string
  patient: Patient | undefined
  medicalCategories: MedicalCategory[]
}

export interface PatientMedicalDiagnoseDialogProps {
  header: string
  patient: Patient | undefined
  medicalDiagnoses: MedicalDiagnose[]
}

export interface PatientMedicalHistoryDialogProps {
  header: string
  patient: Patient | undefined
  medicalHistories: MedicalHistory[]
}

export interface PatientMedicalImagingDialogProps {
  header: string
  patient: Patient | undefined
  medicalImagings: MedicalImaging[]
}

export interface PatientMedicalImagingDialogFormProps {
  isLoading: boolean
  header: string
  medicalImagings: MedicalImaging[]
  selectedMedicalImaging?: MedicalImaging
}

export interface PatientMedicalImagingDialogFormSubmitEvent {
  medicalImaging: MedicalImaging | undefined
  attachment: File | undefined
}

export interface PatientMedicalImagingDialogFormEmits {
  onSubmit: [event: PatientMedicalImagingDialogFormSubmitEvent]
  onClose: []
}

export interface PatientAttachmentDialogFormProps {
  header: string
  patient: Patient | undefined
  patientAttachmentTanstackKey: PatientAttachmentTanstackKey
}

export interface PatientAttachmentDialogFormEmits {
  onClose: []
}

export interface PatientHMOInformationFormProps {
  isLoading: boolean
  patient: Patient | undefined
  hmoTypes: HMOType[]
  hmos: Lookup[]
}

export interface PatientHMOInformationFormEmits {
  onClose: []
}
