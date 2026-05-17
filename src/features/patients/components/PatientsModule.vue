<template>
  <main class="app-page-shell">
    <Message v-if="isError" severity="error" class="mb-3">Something went wrong!</Message>
    <div class="mb-3 flex justify-end">
      <Button
        label="Export CSV"
        icon="pi pi-download"
        severity="secondary"
        outlined
        :loading="isPatientExportLoading"
        @click="onExportCsv"
      />
    </div>

    <section
      v-if="!isError"
      class="app-section-card"
    >
      <PatientsTable
        :patients="patients"
        :isLoading="isTableLoading"
        :page="page"
        :pageSize="pageSize"
        :rowPerPageOptions="rowPerPageOptions"
        @pageChange="onPageChangeDebounceFn($event, refetch)"
      >
        <template #header>
          <PatientsTableHeader
            v-model:selectedSearch="selectedSearch"
            v-model:selectedStatus="selectedStatus"
            :statuses="statuses"
            :isLoading="isFilterLoading"
            :isExportLoading="isPatientExportLoading"
            @reset="resetFilters"
            @save="onSave"
            @export="onExportToExcelThrottleFn"
          />
        </template>

        <template #actions="{ patient }">
          <Button
            label="View"
            icon="pi pi-eye"
            severity="secondary"
            outlined
            size="small"
            :disabled="isTableLoading"
            @click="onPatientRowClick(patient)"
          />
        </template>
      </PatientsTable>

      <Dialog
        v-model:visible="patientDetailsVisible"
        modal
        header="Patient Full Details"
        :style="{ width: '62rem', maxWidth: '95vw' }"
        :draggable="false"
      >
        <div v-if="selectedPatientDetails" class="space-y-4">
          <div class="app-patient-detail-hero">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex gap-4 items-start flex-1">
                <div v-if="selectedPatientProfileImageUrl" class="shrink-0">
                  <img
                    :src="selectedPatientProfileImageUrl"
                    :alt="`${selectedPatientDetails.full_name} profile`"
                    class="h-20 w-20 rounded-full object-cover border-2 border-white/30"
                  />
                </div>
                <div v-else class="app-patient-avatar h-20 w-20 rounded-full text-lg">
                  {{ getPatientInitials(selectedPatientDetails.full_name) }}
                </div>
                <div>
                  <div class="text-lg font-semibold tracking-tight">{{ selectedPatientDetails.full_name }}</div>
                  <div class="app-muted-text mt-1 text-sm">
                    {{ selectedPatientDetails.gender_name }} • {{ selectedPatientDetails.age }} years old
                  </div>
                  <div class="app-subtle-text mt-1 text-xs">
                    Patient record: {{ selectedPatientDetails.public_id || "Pending patient record code" }}
                  </div>
                  <div class="app-subtle-text mt-1 text-xs">
                    Assigned clinic: {{ selectedPatientDetails.clinic_name }}
                  </div>
                </div>
              </div>
              <Tag
                :severity="selectedPatientDetails.is_active ? 'success' : 'danger'"
                :value="selectedPatientDetails.is_active ? 'Active' : 'Inactive'"
              />
            </div>
          </div>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  <!-- Personal Information -->
  <div class="app-detail-card app-detail-card-primary">
    <div class="mb-4 flex items-center gap-3">
      <div class="app-brand-icon app-brand-icon-primary h-10 w-10">
        <i class="pi pi-user text-base"></i>
      </div>

      <div>
        <div class="app-detail-card-title">
          Personal Information
        </div>
        <div class="app-detail-card-copy text-xs">
          Basic patient profile details
        </div>
      </div>
    </div>

    <div class="space-y-3 text-sm">
      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Civil Status</span>
        <span class="app-detail-value">
          {{ selectedPatientDetails.civil_status_name }}
        </span>
      </div>

      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Religion</span>
        <span class="app-detail-value">
          {{ selectedPatientDetails.religion_name ?? "N/A" }}
        </span>
      </div>

      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Referral Category</span>
        <span class="app-detail-value">
          {{ formatReferralChannel(selectedPatientDetails.mode_of_referral_channel) }}
        </span>
      </div>

      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Referral Source</span>
        <span class="app-detail-value">
          {{ selectedPatientDetails.mode_of_referral_name ?? "N/A" }}
        </span>
      </div>

      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Referring Doctor</span>
        <span class="app-detail-value">
          {{
            selectedPatientDetails.referred_by_staff_name ??
            selectedPatientDetails.referred_by ??
            "N/A"
          }}
        </span>
      </div>
    </div>
  </div>

  <!-- Contact Information -->
  <div class="app-detail-card app-detail-card-secondary">
    <div class="mb-4 flex items-center gap-3">
      <div class="app-brand-icon app-brand-icon-secondary h-10 w-10">
        <i class="pi pi-phone text-base"></i>
      </div>

      <div>
        <div class="app-detail-card-title">
          Contact Information
        </div>
        <div class="app-detail-card-copy text-xs">
          Patient communication details
        </div>
      </div>
    </div>

    <div class="space-y-3 text-sm">
      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Phone Number</span>
        <span class="app-detail-value">
          {{ selectedPatientDetails.phone_number }}
        </span>
      </div>

      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Email</span>
        <span class="app-detail-value max-w-[14rem] truncate">
          {{ selectedPatientDetails.email ?? "N/A" }}
        </span>
      </div>

      <div class="flex items-start justify-between gap-4">
        <span class="app-detail-label">Facebook Link</span>
        <span class="app-detail-value max-w-[14rem] truncate">
          {{ selectedPatientDetails.fb_link ?? "N/A" }}
        </span>
      </div>
    </div>
  </div>

<!-- Address Information -->
<div class="app-detail-card app-detail-card-accent md:col-span-2">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="flex items-start gap-3">
      <div class="app-brand-icon app-brand-icon-accent h-10 w-10 shrink-0">
        <i class="pi pi-map-marker text-base"></i>
      </div>

      <div>
        <div class="app-detail-card-title">
          Address Information
        </div>
        <div class="app-detail-card-copy text-xs">
          Complete patient address
        </div>
      </div>
    </div>

    <div class="hidden rounded-full border border-[rgb(var(--patient-detail-address-border))] bg-[rgb(var(--patient-detail-address-bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--patient-detail-address-fg))] sm:inline-flex">
      Location Details
    </div>
  </div>

  <div class="app-detail-address mt-4">
    <div class="flex items-start gap-3">
      <i class="pi pi-map-marker mt-0.5 text-sm opacity-70"></i>

      <p class="m-0 flex-1 text-sm font-medium leading-relaxed">
        {{ formatPatientAddress(selectedPatientDetails) || "No address provided" }}
      </p>
    </div>
  </div>
</div>
</div>
          <div class="app-detail-card app-detail-card-secondary">
            <div class="app-detail-card-copy mb-3 text-sm font-semibold uppercase tracking-wide">Attachments</div>
            <div class="app-muted-text mb-3 text-sm">
              Keep static patient attachments limited to identification files. Visit-based clinical files are now handled under Evaluation Visit Log.
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-xl">
              <Button label="Profile Image" icon="pi pi-camera" severity="info" outlined @click="patientProfileImageDialog?.open()" />
              <Button label="Valid ID" icon="pi pi-paperclip" severity="secondary" outlined @click="openPatientAttachmentDialog('valid-id', selectedPatientDetails)" />
              <Button label="HMO ID" icon="pi pi-paperclip" severity="secondary" outlined @click="openPatientAttachmentDialog('hmo-id', selectedPatientDetails)" />
            </div>
          </div>

          <PatientEvaluationVisitLogSection
            :patient="selectedPatientDetails"
            :medical-category-options="medicalCategoryOptions"
            :medical-diagnosis-options="medicalDiagnosisOptions"
          />

          <div class="app-detail-card app-detail-card-primary">
            <div class="app-detail-card-copy mb-2 text-sm font-semibold uppercase tracking-wide">Call To Actions</div>
            <Menu :model="menuButtons(selectedPatientDetails)" />
          </div>
        </div>
      </Dialog>

    <PatientForm
      ref="patientForm"
      v-bind="patientFormProps"
      @on-submit="onSubmit"
    />

    <PatientHMOInformationForm
      ref="patientHMOInformationForm"
      v-bind="patientHMOInformationFormProps"
    />

    <PatientMedicalCategoryDialog
      ref="patientMedicalCategoryDialog"
      v-bind="patientMedicalCategoryDialogProps"
    />
    <PatientMedicalDiagnoseDialog
      ref="patientMedicalDiagnoseDialog"
      v-bind="patientMedicalDiagnoseDialogProps"
    />
    <PatientMedicalHistoryDialog
      ref="patientMedicalHistoryDialog"
      v-bind="patientMedicalHistoryDialogProps"
    />
    <PatientMedicalImagingDialog
      ref="patientMedicalImagingDialog"
      v-bind="patientMedicalImagingDialogProps"
    />

    <PatientAttachmentDialog
      ref="patientValidIdAttachmentDialog"
      v-bind="patientValidIdAttachmentProps"/>

    <PatientAttachmentDialog
      ref="patientHMOValidIdAttachmentDialog"
      v-bind="patientHMOValidIdAttachmentProps"/>

    <PatientProfileImageDialog
      ref="patientProfileImageDialog"
      :patient="selectedPatientDetails"
      @updated="void onPatientProfileImageUpdated()"
    />

    <Dialog
      v-model:visible="registerSponsorInfoVisible"
      modal
      header="Register Sponsor Information"
      :style="{ width: '28rem', maxWidth: '95vw' }"
      :draggable="false"
    >
      <div class="space-y-3 text-sm">
        <p class="m-0 opacity-80">
          Would you like to register sponsor information for <span class="font-medium">{{ selectedPatient?.full_name }}</span>?
        </p>
        <div class="flex flex-col gap-2">
          <Button
            label="Register HMO Information"
            icon="pi pi-building"
            :disabled="!selectedPatient"
            @click="openHmoRegistration"
          />
          <Button
            label="Register LGU Information"
            icon="pi pi-flag"
            severity="secondary"
            :disabled="!selectedPatient"
            @click="openLguRegistration"
          />
          <Button
            label="Skip"
            text
            severity="secondary"
            @click="skipSponsorRegistration"
          />
        </div>
      </div>
    </Dialog>

    <PatientAppointmentsDialog
      ref="patientAppointmentsDialog"
      :patient="selectedPatient"
    />

    <PatientBillingsDialog
      ref="patientBillingsDialog"
      :patient="selectedPatient"
    />

    </section>
  </main>
</template>

<script setup lang="ts">

import {computed, defineAsyncComponent, onMounted, ref, useTemplateRef, watch} from "vue";
import {storeToRefs} from "pinia";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import {useQueryClient} from "@tanstack/vue-query";
import {useRoute} from "vue-router";
import type {
  Patient,
  PatientEditRequestPayload,
  PatientExportRequestParams,
  PatientRequestBody,
  PatientRequestParams
} from "@/features/patients/types/patient";
import type {
  PatientAttachmentDialogFormProps,
  PatientFormProps,
  PatientHMOInformationFormProps,
  PatientMedicalCategoryDialogProps,
  PatientMedicalDiagnoseDialogProps,
  PatientMedicalHistoryDialogProps,
  PatientMedicalImagingDialogProps
} from "@/features/patients/types/patient.type";
import type {FormSubmitEvent} from "@primevue/forms";
import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import {
  defaultPage,
  defaultPageSize,
  defaultStatus,
  type Pageable,
  type PageRequestWithStatus
} from "@/models/paging.ts";
import Message from "primevue/message";
import Dialog from "primevue/dialog";
import Tag from "primevue/tag";
import {
  defaultFilterDebounce,
  defaultThrottle,
  rowPerPageOptions,
  Status,
  statuses,
  toUUID,
  type UUID
} from "@/utils/global.type.ts";
import {useThrottleFn, watchDebounced} from "@vueuse/core";
import type {AxiosResponse} from "axios";
import {exportToExcel} from "@/utils/export-excel.util.ts";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import Button from "primevue/button";
import Menu from "primevue/menu";
import type {MenuItem} from "primevue/menuitem";
import { getApiErrorMessage } from "@/utils/actionable-error.util";
import {errorToast, successToast, warningToast} from "@/utils/toast.util.ts";
import type {APIError} from "@/utils/error-handler.ts";
import {createDraftService} from "@/services/draft.service.ts";
import type {
  CivilStatus,
  Gender,
  HMOType,
  MedicalCategory,
  MedicalDiagnose,
  MedicalHistory,
  MedicalImaging,
  ModeOfReferral,
  ReferralChannel,
  Religion
} from "@/models/reference.ts";
import type {Lookup} from "@/models/global.model.ts";
import type {Region, RegionRequestPayload} from "@/models/philippine-location.ts";
import {createReferenceQueryService} from "@/services/reference.tanstack.service.ts";
import type {PatientFormState} from "@/features/patients/schema/patient.schema";
import {clinicStore} from "@/stores/clinic.store.ts";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import PatientsTable from "@/features/patients/components/PatientsTable.vue";
import PatientsTableHeader from "@/features/patients/components/PatientsTableHeader.vue";
import {
  philippineLocationTanstackService
} from "@/services/philippine-location.tanstack.service.ts";
import {clinicTanstackService} from "@/features/clinics/queries/clinic.tanstack.service";
import {
  ClinicTanstackKey,
  FileServerTanstackKey,
  HMOTanstackKey,
  PatientAttachmentTanstackKey,
  PatientTanstackKey,
  PhilippineLocationTanstackKey,
  ReferenceTanstackKey
} from "@/utils/keys/tanstack-key.ts";
import {IndexedDBKey} from "@/utils/keys/indexeddb-key.ts";
import {patientTanstackService} from "@/features/patients/queries/patient.tanstack.service";
import {fileServerTanstackService} from "@/services/file-server.tanstack.service.ts";
import {hmoTanstackService} from "@/features/hmos/queries/hmo.tanstack.service";
import {staffService} from "@/features/staff/api/staff.service";
import {pamsAPI} from "@/utils/axios-interceptor.ts";

type ToggleDialogExpose = {
  toggleDialog: () => void
}

type OpenDialogExpose = {
  open: () => void
}

const PatientForm = defineAsyncComponent(() => import("@/components/PatientForm.vue"))
const PatientHMOInformationForm = defineAsyncComponent(() => import("@/components/PatientHMOInformationForm.vue"))
const PatientMedicalCategoryDialog = defineAsyncComponent(() => import("@/components/PatientMedicalCategoryDialog.vue"))
const PatientMedicalDiagnoseDialog = defineAsyncComponent(() => import("@/components/PatientMedicalDiagnoseDialog.vue"))
const PatientMedicalHistoryDialog = defineAsyncComponent(() => import("@/components/PatientMedicalHistoryDialog.vue"))
const PatientMedicalImagingDialog = defineAsyncComponent(() => import("@/components/PatientMedicalImagingDialog.vue"))
const PatientAttachmentDialog = defineAsyncComponent(() => import("@/components/PatientAttachmentDialog.vue"))
const PatientProfileImageDialog = defineAsyncComponent(() => import("@/components/PatientProfileImageDialog.vue"))
const PatientEvaluationVisitLogSection = defineAsyncComponent(() => import("@/features/patients/components/PatientEvaluationVisitLogSection.vue"))
const PatientAppointmentsDialog = defineAsyncComponent(() => import("@/features/patients/components/PatientAppointmentsDialog.vue"))
const PatientBillingsDialog = defineAsyncComponent(() => import("@/features/patients/components/PatientBillingsDialog.vue"))

const patientMedicalCategoryDialog = useTemplateRef<ToggleDialogExpose>('patientMedicalCategoryDialog')
const patientMedicalDiagnoseDialog = useTemplateRef<ToggleDialogExpose>('patientMedicalDiagnoseDialog')
const patientMedicalHistoryDialog = useTemplateRef<ToggleDialogExpose>('patientMedicalHistoryDialog')
const patientMedicalImagingDialog = useTemplateRef<ToggleDialogExpose>('patientMedicalImagingDialog')

const patientValidIdAttachmentDialog = useTemplateRef<ToggleDialogExpose>('patientValidIdAttachmentDialog')
const patientHMOValidIdAttachmentDialog = useTemplateRef<ToggleDialogExpose>('patientHMOValidIdAttachmentDialog')
const patientProfileImageDialog = useTemplateRef<OpenDialogExpose>('patientProfileImageDialog')
const patientAppointmentsDialog = useTemplateRef<OpenDialogExpose>('patientAppointmentsDialog')
const patientBillingsDialog = useTemplateRef<OpenDialogExpose>('patientBillingsDialog')

const patientForm = useTemplateRef<ToggleDialogExpose>('patientForm')
const patientHMOInformationForm = useTemplateRef<ToggleDialogExpose>('patientHMOInformationForm')

const registerSponsorInfoVisible = ref(false)
const sponsorContext = ref<"HMO" | "LGU">("HMO")
const openHmoRegistration = (): void => {
  registerSponsorInfoVisible.value = false
  sponsorContext.value = "HMO"
  patientHMOInformationForm.value?.toggleDialog()
}

// For now LGU uses the same dialog as HMO until requirements are finalized.
const openLguRegistration = (): void => {
  registerSponsorInfoVisible.value = false
  sponsorContext.value = "LGU"
  patientHMOInformationForm.value?.toggleDialog()
}

const skipSponsorRegistration = (): void => {
  registerSponsorInfoVisible.value = false
  selectedPatient.value = undefined
}

const useClinicStore = clinicStore()
const { selectedClinicId } = storeToRefs(useClinicStore)
const route = useRoute()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const isFSALoading = useIsLoading(FileServerTanstackKey.FSA)

const isPatientLoading = useIsLoading(PatientTanstackKey.PATIENTS)
const isPatientExportLoading = useIsLoading(PatientTanstackKey.PATIENTS_EXPORT)

const isGendersLoading = useIsLoading(ReferenceTanstackKey.GENDERS)
const isCivilStatusesLoading = useIsLoading(ReferenceTanstackKey.CIVIL_STATUSES)
const isReligionsLoading = useIsLoading(ReferenceTanstackKey.RELIGIONS)
const isModeOfReferralsLoading = useIsLoading(ReferenceTanstackKey.MODE_OF_REFERRALS)
const isMedicalCategoriesLoading = useIsLoading(ReferenceTanstackKey.MEDICAL_CATEGORIES)
const isMedicalDiagnosesLoading = useIsLoading(ReferenceTanstackKey.MEDICAL_DIAGNOSES)
const isMedicalHistoriesLoading = useIsLoading(ReferenceTanstackKey.MEDICAL_HISTORIES)
const isMedicalImagingsLoading = useIsLoading(ReferenceTanstackKey.MEDICAL_IMAGINGS)
const isHMOTypesLoading = useIsLoading(ReferenceTanstackKey.HMO_TYPES)
const isHMOLoading = useIsLoading(HMOTanstackKey.HMOS_LOOKUP)
const isClinicsLoading = useIsLoading(ClinicTanstackKey.CLINICS_LOOKUP)

const isRegionsLoading = useIsLoading(PhilippineLocationTanstackKey.REGIONS)
const isProvincesLoading = useIsLoading(PhilippineLocationTanstackKey.PROVINCES)
const isCitiesLoading = useIsLoading(PhilippineLocationTanstackKey.CITIES)
const isBaranggaysLoading = useIsLoading(PhilippineLocationTanstackKey.BARANGGAYS)

const isTableLoading = computed<boolean>(() =>
  isPatientLoading.value ||
  isPatientExportLoading.value)

const isFilterLoading = computed<boolean>(() =>
  isPatientLoading.value ||
  isClinicsLoading.value)

const isLoading = computed<boolean>(() =>
  isFSALoading.value ||
  isTableLoading.value ||

  isGendersLoading.value ||
  isCivilStatusesLoading.value ||
  isReligionsLoading.value ||
  isModeOfReferralsLoading.value ||
  isMedicalCategoriesLoading.value ||
  isMedicalDiagnosesLoading.value ||
  isMedicalHistoriesLoading.value ||
  isMedicalImagingsLoading.value ||
  isHMOTypesLoading.value ||
  isHMOLoading.value ||
  isClinicsLoading.value ||

  isRegionsLoading.value ||
  isProvincesLoading.value ||
  isCitiesLoading.value ||
  isBaranggaysLoading.value)

const draftService = createDraftService<PatientFormState>(IndexedDBKey.PATIENT)

const selectedPatient = ref<Patient | undefined>()
const selectedPatientDetails = ref<Patient | undefined>()
const selectedPatientProfileImageUrl = ref<string>()
const patientDetailsVisible = ref<boolean>(false)
const pendingPatientDrillDownId = ref<number>()
const pendingPatientDrillDownName = ref<string>()

const revokeSelectedPatientProfileImageUrl = (): void => {
  if (selectedPatientProfileImageUrl.value) {
    URL.revokeObjectURL(selectedPatientProfileImageUrl.value)
  }
  selectedPatientProfileImageUrl.value = undefined
}

const loadSelectedPatientProfileImage = async (patientId?: number): Promise<void> => {
  revokeSelectedPatientProfileImageUrl()
  if (!patientId) return

  try {
    const response = await pamsAPI.get<Blob>(`/patients/${patientId}/profile-image/file?t=${Date.now()}`, {
      responseType: 'blob'
    })
    selectedPatientProfileImageUrl.value = URL.createObjectURL(response.data)
  } catch {
    selectedPatientProfileImageUrl.value = undefined
  }
}

const onPatientRowClick = (patient: Patient): void => {
  selectedPatientDetails.value = patient
  patientDetailsVisible.value = true
  void loadSelectedPatientProfileImage(patient.id)
}

const getPatientInitials = (fullName?: string): string => {
  if (!fullName?.trim()) {
    return "NA"
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return `${first}${last}`.toUpperCase() || "NA"
}

const onPatientProfileImageUpdated = async (): Promise<void> => {
  await refetch()
  if (!selectedPatientDetails.value?.id) return
  const refreshed = await pamsAPI.get<Patient>(`/patients/${selectedPatientDetails.value.id}`)
  selectedPatientDetails.value = refreshed.data
  await loadSelectedPatientProfileImage(selectedPatientDetails.value.id)
}

watch(patientDetailsVisible, (visible) => {
  if (!visible) {
    revokeSelectedPatientProfileImageUrl()
  }
})

const openPatientAttachmentDialog = (
  attachmentType: "valid-id" | "hmo-id",
  patient?: Patient
): void => {
  if (!patient) return
  selectedPatient.value = patient

  if (attachmentType === "valid-id") {
    patientValidIdAttachmentDialog.value?.toggleDialog()
    return
  }
  if (attachmentType === "hmo-id") {
    patientHMOValidIdAttachmentDialog.value?.toggleDialog()
    return
  }
}

const applyAppointmentDrillDown = async (): Promise<void> => {
  const patientIdRaw = route.query.patientId
  const patientNameRaw = route.query.name

  const patientId = Number(Array.isArray(patientIdRaw) ? patientIdRaw[0] : patientIdRaw)
  const patientName = (Array.isArray(patientNameRaw) ? patientNameRaw[0] : patientNameRaw)?.toString().trim()

  pendingPatientDrillDownId.value = Number.isFinite(patientId) && patientId > 0 ? patientId : undefined
  pendingPatientDrillDownName.value = patientName || undefined

  if (pendingPatientDrillDownName.value) {
    selectedSearch.value = pendingPatientDrillDownName.value
    page.value = 1
    await refetch()
  }
}

const tryOpenDrillDownPatient = (): void => {
  if (!pendingPatientDrillDownId.value && !pendingPatientDrillDownName.value) return
  const content = patients.value?.content ?? []
  if (!content.length) return

  const byId = pendingPatientDrillDownId.value
    ? content.find(patient => patient.id === pendingPatientDrillDownId.value)
    : undefined
  const byName = pendingPatientDrillDownName.value
    ? content.find(patient => patient.full_name.toLowerCase() === pendingPatientDrillDownName.value?.toLowerCase())
    : undefined

  const target = byId ?? byName ?? content[0]
  onPatientRowClick(target)

  pendingPatientDrillDownId.value = undefined
  pendingPatientDrillDownName.value = undefined
}

const formatPatientAddress = (patient: Patient): string => {
  const addressParts = [
    patient.details,
    patient.baranggay_name,
    patient.city_name,
    patient.province_name,
    patient.region_name
  ].filter(Boolean)

  return addressParts.length ? addressParts.join(", ") : "N/A"
}

const formatReferralChannel = (channel?: ReferralChannel): string => {
  if (channel === "ONLINE") return "Online"
  if (channel === "OFFLINE") return "Offline"
  return "N/A"
}

const selectedSearch = ref<string | undefined>()
const selectedStatus = ref<Status>(defaultStatus)
const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<Patient> | undefined>()

watchDebounced(
  [selectedClinicId, selectedSearch, selectedStatus],
  (): void => {
    page.value = 1
    void refetch()
  },
  {debounce: defaultFilterDebounce, flush: "post"},
)

const resetFilters = (): void => {
  selectedSearch.value = undefined
  selectedStatus.value = defaultStatus
}

const genders = ref<Gender[]>([])
const civilStatuses = ref<CivilStatus[]>([])
const religions = ref<Religion[]>([])
const modeOfReferrals = ref<ModeOfReferral[]>([])
const clinics = ref<Lookup[]>([])
const doctors = ref<Lookup[]>([])
const regions = ref<Region[]>([])

const medicalCategories = ref<MedicalCategory[]>([])
const medicalDiagnoses = ref<MedicalDiagnose[]>([])
const medicalHistories = ref<MedicalHistory[]>([])
const medicalImagings = ref<MedicalImaging[]>([])

const medicalCategoryOptions = computed<string[]>(() => {
  return Array.from(new Set((medicalCategories.value ?? []).map((item) => item.name).filter(Boolean))).sort((a, b) => a.localeCompare(b))
})

const medicalDiagnosisOptions = computed<string[]>(() => {
  return Array.from(new Set((medicalDiagnoses.value ?? []).map((item) => item.name).filter(Boolean))).sort((a, b) => a.localeCompare(b))
})

const hmos = ref<Lookup[]>([])
const hmoTypes = ref<HMOType[]>([])

const patientFormProps = computed(() => ({
  selectedPatient: selectedPatient.value,
  isLoading: isLoading.value,
  buttonProps: {
    label: selectedPatient.value ? `Edit ${selectedPatient.value.full_name}` : `Add Patient`,
    icon: selectedPatient.value ? 'pi pi-pen-to-square' : 'pi pi-save',
    severity: selectedPatient.value ? 'success' : 'info'
  },
  draftService: draftService,
  queryClient: queryClient,
  genders: genders.value,
  civilStatuses: civilStatuses.value,
  religions: religions.value,
  modeOfReferrals: modeOfReferrals.value,
  clinics: clinics.value,
  doctors: doctors.value,
  regions: regions.value,
}) satisfies PatientFormProps)

const patientHMOInformationFormProps = computed(() => ({
  isLoading: isLoading.value,
  patient: selectedPatient.value,
  hmoTypes: hmoTypes.value,
  hmos: hmos.value,
  sponsor_context: sponsorContext.value
}) satisfies PatientHMOInformationFormProps)

const patientMedicalCategoryDialogProps = computed(() => ({
  header: `Medical categories for ${selectedPatient.value?.full_name}`,
  patient: selectedPatient.value,
  medicalCategories: medicalCategories.value
}) satisfies PatientMedicalCategoryDialogProps)

const patientMedicalDiagnoseDialogProps = computed(() => ({
  header: `Medical diagnosis for ${selectedPatient.value?.full_name}`,
  patient: selectedPatient.value,
  medicalDiagnoses: medicalDiagnoses.value
}) satisfies PatientMedicalDiagnoseDialogProps)

const patientMedicalHistoryDialogProps = computed(() => ({
  header: `Medical histories for ${selectedPatient.value?.full_name}`,
  patient: selectedPatient.value,
  medicalHistories: medicalHistories.value
}) satisfies PatientMedicalHistoryDialogProps)

const patientMedicalImagingDialogProps = computed(() => ({
  header: `Medical imagings for ${selectedPatient.value?.full_name}`,
  patient: selectedPatient.value,
  medicalImagings: medicalImagings.value
}) satisfies PatientMedicalImagingDialogProps)

const patientValidIdAttachmentProps = computed(() => ({
  header: `Add ${selectedPatient.value?.full_name} valid id`,
  patientAttachmentTanstackKey: PatientAttachmentTanstackKey.VALID_ID,
  patient: selectedPatient.value
}) satisfies PatientAttachmentDialogFormProps)

const patientHMOValidIdAttachmentProps = computed(() => ({
  header: `Add ${selectedPatient.value?.full_name} hmo valid id`,
  patientAttachmentTanstackKey: PatientAttachmentTanstackKey.HMO_ID,
  patient: selectedPatient.value
}) satisfies PatientAttachmentDialogFormProps)

const requestParams = computed(() => ({
  pageable_request: {
    page: page.value,
    size: pageSize.value,
    name: selectedSearch.value?.trim() || undefined,
    status: selectedStatus.value
  },
  clinic_id: selectedClinicId.value,
}) satisfies PatientRequestParams)

const {
  data: patients,
  isError,
  error,
  refetch
} = patientTanstackService.getAll(requestParams)
useRefreshToken<Pageable<Patient> | undefined>(error, refetch)

const {mutate: saveMutation} = patientTanstackService.save()
const {mutate: editMutation} = patientTanstackService.update()
const {mutate: toggleStatusMutation} = patientTanstackService.toggleStatus()


const folderSaveMutation = (): UUID => toUUID(crypto.randomUUID())

const onSave = (): void => {
  void openCreatePatient()
}

const onSubmit = async (event: FormSubmitEvent): Promise<void> => {
  confirm.require({
    message: 'Are you sure you want to proceed?',
    header: `${patientFormProps.value.buttonProps.label} Confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading.value
    },
    acceptProps: {
      label: `${patientFormProps.value.buttonProps.label}`,
      severity: `${patientFormProps.value.buttonProps.severity}`,
      icon: `${patientFormProps.value.buttonProps.icon}`,
      loading: isLoading.value
    },
    accept: async (): Promise<void> => {
      const folder: UUID = folderSaveMutation()
      const selectedReferringDoctor = event.values?.referred_by_staff
      const referredByDoctorName = selectedReferringDoctor?.name ?? event.values?.referred_by

      const body: PatientRequestBody = {
        first_name: event.values?.first_name,
        middle_name: event.values?.middle_name,
        last_name: event.values?.last_name,
        age: event.values?.age,
        gender_id: event.values?.gender?.id,
        civil_status_id: event.values?.civil_status?.id,
        occupation: event.values?.occupation,
        religion_id: event.values?.religion?.id,
        mode_of_referral_id: event.values?.mode_of_referral?.id,
        referred_by: referredByDoctorName,
        referred_by_staff_id: selectedReferringDoctor?.id,
        clinic_id: event.values?.clinic?.id,
        phone_number: event.values?.phone_number,
        email: event.values?.email,
        fb_link: event.values?.fb_link,
        region_id: event.values?.region?.id,
        region_name: event.values?.region?.name,
        province_id: event.values?.province?.id,
        province_name: event.values?.province?.name,
        city_id: event.values?.city?.id,
        city_name: event.values?.city?.name,
        baranggay_id: event.values?.baranggay?.id,
        baranggay_name: event.values?.baranggay?.name,
        details: event.values?.details,
        folder: folder
      }

      if (selectedPatient.value) {
        const payload: PatientEditRequestPayload = {
          id: selectedPatient.value.id,
          ...body,
        }

        editMutation(payload, {
          async onSuccess() {
            patientForm.value?.toggleDialog()
            successToast(toast, 'Edit success')
            event.reset()
            await resetQueries()
          },
          async onError(error: APIError) {
            errorToast(toast, getApiErrorMessage(error, {
              baseMessage: "Patient edit failed",
              permissionHint: "Patient access (Can Edit) in Role Access",
              invalidInputHint: "Some patient form values are invalid. Review required fields and try again.",
              retryHint: "Please try again."
            }))
            await resetQueries()
          },
        })
        return
      }

      saveMutation(body, {
        async onSuccess(result) {
          patientForm.value?.toggleDialog()
          successToast(toast, 'Save success')
          event.reset()
          await Promise.all([
            resetQueries(),
            draftService.delete()
          ])

          const newPatientId = result?.id ?? 0
          if (newPatientId > 0) {
            const fullName = [body.first_name, body.middle_name, body.last_name]
              .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
            selectedPatient.value = {
              ...body,
              id: newPatientId,
              public_id: result?.public_id,
              full_name: fullName,
              gender_name: '',
              civil_status_name: '',
              clinic_name: '',
              is_active: true,
            }
            registerSponsorInfoVisible.value = true
          }
        },
        async onError(error: APIError) {
          errorToast(toast, getApiErrorMessage(error, {
            baseMessage: "Patient save failed",
            permissionHint: "Patient access (Can Edit) in Role Access",
            invalidInputHint: "Some patient form values are invalid. Review required fields and try again.",
            retryHint: "Please try again."
          }))
          await resetQueries()
        },
      })
    }
  })
}


const menuButtons = (patient: Patient): MenuItem[] => {
  return [
    {
      label: `Edit this record`,
      icon: 'pi pi-pen-to-square',
      command: () => {
        void openEditPatient(patient)
      },
    },
    {
      label: `Toggle Status`,
      icon: 'pi pi-exclamation-triangle',
      command: () => {
        selectedPatient.value = patient
        confirm.require({
          message: `If you proceed this patient will be updated from ${statusLabel(selectedPatient.value.is_active)} to ${statusLabel(!selectedPatient.value.is_active)}`,
          header: `Toggle Status for ${selectedPatient.value.full_name} Confirmation`,
          icon: 'pi pi-exclamation-triangle',
          rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true,
            loading: isLoading.value
          },
          acceptProps: {
            label: `Toggle Status`,
            severity: `warning`,
            icon: `pi pi-exclamation-triangle`,
            loading: isLoading.value
          },
          accept: () => {
            if (!selectedPatient.value?.id) {
              warningToast(toast, "No selected patient")
              return
            }

            toggleStatusMutation(selectedPatient.value.id, {
              async onSuccess() {
                successToast(toast, 'Toggle status success')
                await resetQueries()
              },
              async onError(error: APIError) {
                errorToast(toast, getApiErrorMessage(error, {
                  baseMessage: "Toggle patient status failed",
                  permissionHint: "Patient access (Can Edit) in Role Access",
                  retryHint: "Please try again."
                }))
                await resetQueries()
              },
            })
          },
        })
      }
    },
    {
      separator: true
    },
    {
      label: `View Appointments`,
      icon: 'pi pi-calendar-clock',
      command: () => {
        selectedPatient.value = patient
        patientAppointmentsDialog.value?.open()
      }
    },
    {
      label: `View Bills`,
      icon: 'pi pi-receipt',
      command: () => {
        selectedPatient.value = patient
        patientBillingsDialog.value?.open()
      },
    },
    {
      label: 'View Sponsor Information',
      icon: 'pi pi-address-book',
      command: () => {
        selectedPatient.value = patient
        registerSponsorInfoVisible.value = true
      },
    },
    {
      separator: true
    }
  ]
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const params: PatientExportRequestParams = {
    clinic_id: selectedClinicId.value,
    page_request: {
      name: selectedSearch.value?.trim() || undefined,
      status: selectedStatus.value
    }
  }

  const response: AxiosResponse<Blob> | undefined = await patientTanstackService.export(queryClient, params)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onExportCsv = async (): Promise<void> => {
  const response: AxiosResponse<Blob> = await pamsAPI.get("/patients/export/csv", {
    params: {
      clinic_id: selectedClinicId.value,
      name: selectedSearch.value?.trim() || undefined,
      status: selectedStatus.value
    },
    responseType: "blob"
  })
  exportToExcel(response)
}

const statusLabel = (isActive: boolean): string => {
  return isActive ? 'Active' : 'Inactive'
}

const initializeDropdowns = async (): Promise<void> => {
  const requestParams: PageRequestWithStatus = {
    page: defaultPage,
    size: defaultPageSize,
    status: defaultStatus
  }

  const regionRequestParams: RegionRequestPayload = {
    page_request: {
      page: defaultPage,
      size: defaultPageSize,
      name: undefined
    }
  }

  const [
    fetchedGenders,
    fetchedCivilStatuses,
    fetchedReligions,
    fetchedModeOfReferrals,
    fetchedClinics,
    fetchedDoctors,
    fetchedRegions,
    fetchedMedicalCategories,
    fetchedMedicalDiagnoses,
    fetchedMedicalHistories,
    fetchedMedicalImagings,
    fetchedHMOTypes,
    fetchedHMOs
  ] = await Promise.allSettled([
    createReferenceQueryService<Gender>(queryClient, ReferenceTanstackKey.GENDERS, requestParams),
    createReferenceQueryService<CivilStatus>(queryClient, ReferenceTanstackKey.CIVIL_STATUSES, requestParams),
    createReferenceQueryService<Religion>(queryClient, ReferenceTanstackKey.RELIGIONS, requestParams),
    createReferenceQueryService<ModeOfReferral>(queryClient, ReferenceTanstackKey.MODE_OF_REFERRALS, requestParams),
    clinicTanstackService.getAllLookup(queryClient, defaultPage, undefined),
    staffService.getAll({
      pageable_request: {
        page: defaultPage,
        size: 1000,
        status: Status.ALL,
        name: undefined
      },
      clinic_id: undefined
    }),
    philippineLocationTanstackService.getAllRegions(queryClient, regionRequestParams),
    createReferenceQueryService<MedicalCategory>(queryClient, ReferenceTanstackKey.MEDICAL_CATEGORIES, requestParams),
    createReferenceQueryService<MedicalDiagnose>(queryClient, ReferenceTanstackKey.MEDICAL_DIAGNOSES, requestParams),
    createReferenceQueryService<MedicalHistory>(queryClient, ReferenceTanstackKey.MEDICAL_HISTORIES, requestParams),
    createReferenceQueryService<MedicalImaging>(queryClient, ReferenceTanstackKey.MEDICAL_IMAGINGS, requestParams),
    createReferenceQueryService<HMOType>(queryClient, ReferenceTanstackKey.HMO_TYPES, requestParams),
    hmoTanstackService.getAllLookup(queryClient, defaultPage, undefined)
  ])

  const contentOrEmpty = <T>(result: PromiseSettledResult<Pageable<T> | undefined>): T[] =>
    result.status === "fulfilled" ? (result.value?.content ?? []) : []

  genders.value = contentOrEmpty(fetchedGenders)
  civilStatuses.value = contentOrEmpty(fetchedCivilStatuses)
  religions.value = contentOrEmpty(fetchedReligions)
  modeOfReferrals.value = contentOrEmpty(fetchedModeOfReferrals)
  clinics.value = contentOrEmpty(fetchedClinics)
  doctors.value = fetchedDoctors.status === "fulfilled"
    ? (fetchedDoctors.value?.content ?? [])
        .filter(staff => staff.appointment_provider_type === "DOCTOR_CONSULTANT")
        .map(staff => ({
          id: staff.id,
          name: staff.name
        }))
    : []
  regions.value = contentOrEmpty(fetchedRegions)

  medicalCategories.value = contentOrEmpty(fetchedMedicalCategories)
  medicalDiagnoses.value = contentOrEmpty(fetchedMedicalDiagnoses)
  medicalHistories.value = contentOrEmpty(fetchedMedicalHistories)
  medicalImagings.value = contentOrEmpty(fetchedMedicalImagings)

  hmoTypes.value = contentOrEmpty(fetchedHMOTypes)
  hmos.value = contentOrEmpty(fetchedHMOs)
}

const resetQueries = async (): Promise<void> => {
  await queryClient.invalidateQueries({queryKey: [PatientTanstackKey.PATIENTS]})
}

const dropdownsReady = ref(false)
const dropdownsLoading = ref(false)
const ensureDropdownsLoaded = async (): Promise<void> => {
  if (dropdownsReady.value || dropdownsLoading.value) return
  dropdownsLoading.value = true
  try {
    await initializeDropdowns()
    dropdownsReady.value = true
  } finally {
    dropdownsLoading.value = false
  }
}

const openCreatePatient = async (): Promise<void> => {
  selectedPatient.value = undefined
  await ensureDropdownsLoaded()
  patientForm.value?.toggleDialog()
}

const openEditPatient = async (patient: Patient): Promise<void> => {
  selectedPatient.value = patient
  await ensureDropdownsLoaded()
  patientForm.value?.toggleDialog()
}

onMounted(async (): Promise<void> => {
  await applyAppointmentDrillDown()
})

watch(
  () => patients.value?.content,
  () => {
    tryOpenDrillDownPatient()
  },
  {deep: true}
)
</script>
