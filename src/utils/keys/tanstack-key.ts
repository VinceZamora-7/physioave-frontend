export enum StaffTanstackKey {
  STAFFS = 'staffs',
  STAFFS_INFINITE_QUERY = 'staffsInfiniteQuery',
  STAFFS_EXPORT = 'staffsExport',
  STAFFS_LOOKUP = 'staffsLookup'
}

export enum HMOTanstackKey {
  HMOS = 'hmos',
  HMOS_EXPORT = 'hmosExport',
  HMOS_LOOKUP = 'hmosLookup',
  HMOS_INFINITE_QUERY = 'hmosInfiniteQuery',
}

export enum ReferenceTanstackKey {
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  GENDERS = 'genders',
  CIVIL_STATUSES = 'civil-statuses',
  RELIGIONS = 'religions',
  MODE_OF_REFERRALS = 'mode-of-referrals',
  MEDICAL_CATEGORIES = 'medical-categories',
  MEDICAL_DIAGNOSES = 'medical-diagnoses',
  MEDICAL_HISTORIES = 'medical-histories',
  MEDICAL_IMAGINGS = 'medical-imagings',
  HMO_TYPES = 'hmo-types',
  SPECIALTY_TAGS = 'specialty-tags',
  TREATMENT_AREAS = 'treatment-areas',
}

export enum ClinicTanstackKey {
  CLINICS = 'clinics',
  CLINICS_INFINITE_QUERY = 'clinicsInfiniteQuery',
  CLINICS_EXPORT = 'clinicsExport',
  CLINICS_LOOKUP = 'clinicsLookup'
}

export enum RefreshTokenTanstackKey {
  REFRESH_TOKENS = 'refresh-tokens',
}

export enum PatientTanstackKey {
  PATIENTS = 'patients',
  PATIENTS_INFINITE_QUERY = 'patientsInfiniteQuery',
  PATIENTS_EXPORT = 'patientsExport',
  PATIENTS_LOOKUP = 'patientsLookup',
  PATIENT_MEDICAL_CATEGORIES = 'patientMedicalCategories',
  PATIENT_MEDICAL_CATEGORY_EXPORT = 'patientMedicalCategoriesExport',

  PATIENT_MEDICAL_DIAGNOSES = 'patientMedicalDiagnoses',
  PATIENT_MEDICAL_DIAGNOSES_EXPORT = 'patientMedicalDiagnosesExport',

  PATIENT_MEDICAL_HISTORY = 'patientMedicalHistory',
  PATIENT_MEDICAL_HISTORY_EXPORT = 'patientMedicalHistoryExport',

  PATIENT_MEDICAL_IMAGING = 'patientMedicalImaging',
  PATIENT_MEDICAL_IMAGING_EXPORT = 'patientMedicalImagingExport',

  PATIENT_HMO_INFORMATION = 'patientHMOInformation'
}

export enum PhilippineLocationTanstackKey {
  REGIONS = 'regions',
  PROVINCES = 'provinces',
  CITIES = 'cities',
  BARANGGAYS = 'baranggays',
}

export enum FileServerTanstackKey {
  FSA = 'fileServer API',
  FSA_RETRIEVE_FILE = 'fileServerRetrieveFile',
  FSA_VERIFY_FILE = 'fileServerAPIVerifyFile'
}

export enum LogoutTanstackKey {
  LOGOUT = 'logout',
}

export enum EvaluationTanstackKey {
  EVALUATIONS = 'evaluations',
  EVALUATIONS_EXPORT = 'evaluationsExport',
  EVALUATIONS_LOOKUP = 'evaluationsLookup',
  EVALUATIONS_INFINITE_QUERY = 'evaluationsInfiniteQuery',
}

export enum TechniqueTanstackKey {
  TECHNIQUES = 'techniques',
  TECHNIQUES_EXPORT = 'techniquesExport',
  TECHNIQUES_LOOKUP = 'techniquesLookup',
  TECHNIQUES_INFINITE_QUERY = 'techniquesInfiniteQuery',
}

export enum MachineTanstackKey {
  MACHINES = 'machines',
  MACHINES_EXPORT = 'machinesExport',
  MACHINES_LOOKUP = 'machinesLookup',
  MACHINES_INFINITE_QUERY = 'machinesInfiniteQuery',
}

export enum PatientAttachmentTanstackKey {
  VALID_ID = 'valid-id',
  HMO_ID = 'hmo-valid-id',
  LABORATORY = 'laboratory',
  REHAB_PRESCRIPTION = 'rehab-prescription',
  PRESCRIPTION = 'prescription',
}
