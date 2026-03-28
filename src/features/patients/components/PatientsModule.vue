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
            v-model:selectedClinic="selectedClinic"
            :statuses="statuses"
            :clinics="clinics"
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
          <div class="rounded-2xl border border-[#A91D8B]/25 bg-[linear-gradient(120deg,rgba(36,39,87,0.14),rgba(94,24,105,0.10),rgba(169,29,139,0.18))] shadow-[0_18px_40px_rgba(36,39,87,0.12)] p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div class="text-lg font-semibold tracking-tight">{{ selectedPatientDetails.full_name }}</div>
                <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {{ selectedPatientDetails.gender_name }} • {{ selectedPatientDetails.age }} years old
                </div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Patient record: {{ selectedPatientDetails.public_id || "Pending patient record code" }}
                </div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Assigned clinic: {{ selectedPatientDetails.clinic_name }}
                </div>
              </div>
              <Tag
                :severity="selectedPatientDetails.is_active ? 'success' : 'danger'"
                :value="selectedPatientDetails.is_active ? 'Active' : 'Inactive'"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
              <div class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Personal Information</div>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Civil Status:</span> {{ selectedPatientDetails.civil_status_name }}</div>
                <div><span class="font-medium">Religion:</span> {{ selectedPatientDetails.religion_name ?? "N/A" }}</div>
                <div><span class="font-medium">Mode of Referral:</span> {{ selectedPatientDetails.mode_of_referral_name ?? "N/A" }}</div>
                <div><span class="font-medium">Doctor Referral:</span> {{ selectedPatientDetails.referred_by ?? "N/A" }}</div>
              </div>
            </div>

            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
              <div class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Contact Information</div>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Phone Number:</span> {{ selectedPatientDetails.phone_number }}</div>
                <div><span class="font-medium">Email:</span> {{ selectedPatientDetails.email ?? "N/A" }}</div>
                <div><span class="font-medium">Facebook Link:</span> {{ selectedPatientDetails.fb_link ?? "N/A" }}</div>
              </div>
            </div>

            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 md:col-span-2">
              <div class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Address Information</div>
              <div class="text-sm">
                {{ formatPatientAddress(selectedPatientDetails) }}
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
            <div class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Call To Actions</div>
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

    <PatientAttachmentDialog
      ref="patientLaboratoryAttachmentDialog"
      v-bind="patientLaboratoryAttachmentProps"/>

    <PatientAttachmentDialog
      ref="patientPrescriptionAttachmentDialog"
      v-bind="patientPrescriptionAttachmentProps"/>

    <PatientAttachmentDialog
      ref="patientRehabPrescriptionAttachmentDialog"
      v-bind="patientRehabPrescriptionAttachmentProps"/>
    </section>
  </main>
</template>

<script setup lang="ts">

import {useConfirm, useToast} from "primevue";
import {useQueryClient} from "@tanstack/vue-query";
import PatientForm from "@/components/PatientForm.vue";
import {computed, onMounted, ref, useTemplateRef, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
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
import {errorToast, infoToast, successToast, warningToast} from "@/utils/toast.util.ts";
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
  Religion
} from "@/models/reference.ts";
import type {Lookup} from "@/models/global.model.ts";
import type {Region, RegionRequestPayload} from "@/models/philippine-location.ts";
import {createReferenceQueryService} from "@/services/reference.tanstack.service.ts";
import type {PatientFormState} from "@/features/patients/schema/patient.schema";
import {clinicStore} from "@/stores/clinic.store.ts";
import {appointmentStore} from "@/stores/appointment.store.ts";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import PatientsTable from "@/features/patients/components/PatientsTable.vue";
import PatientsTableHeader from "@/features/patients/components/PatientsTableHeader.vue";
import PatientMedicalCategoryDialog from "@/components/PatientMedicalCategoryDialog.vue";
import PatientMedicalDiagnoseDialog from "@/components/PatientMedicalDiagnoseDialog.vue";
import PatientMedicalHistoryDialog from "@/components/PatientMedicalHistoryDialog.vue";
import {billStore} from "@/stores/bill.store.ts";
import PatientMedicalImagingDialog from "@/components/PatientMedicalImagingDialog.vue";
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
import PatientAttachmentDialog from "@/components/PatientAttachmentDialog.vue";
import PatientHMOInformationForm from "@/components/PatientHMOInformationForm.vue";
import {hmoTanstackService} from "@/features/hmos/queries/hmo.tanstack.service";
import {staffTanstackService} from "@/features/staff/queries/staff.tanstack.service";
import {pamsAPI} from "@/utils/axios-interceptor.ts";

const patientMedicalCategoryDialog = useTemplateRef<InstanceType<typeof PatientMedicalCategoryDialog>>('patientMedicalCategoryDialog')
const patientMedicalDiagnoseDialog = useTemplateRef<InstanceType<typeof PatientMedicalDiagnoseDialog>>('patientMedicalDiagnoseDialog')
const patientMedicalHistoryDialog = useTemplateRef<InstanceType<typeof PatientMedicalHistoryDialog>>('patientMedicalHistoryDialog')
const patientMedicalImagingDialog = useTemplateRef<InstanceType<typeof PatientMedicalImagingDialog>>('patientMedicalImagingDialog')

const patientValidIdAttachmentDialog = useTemplateRef<InstanceType<typeof PatientAttachmentDialog>>('patientValidIdAttachmentDialog')
const patientHMOValidIdAttachmentDialog = useTemplateRef<InstanceType<typeof PatientAttachmentDialog>>('patientHMOValidIdAttachmentDialog')
const patientLaboratoryAttachmentDialog = useTemplateRef<InstanceType<typeof PatientAttachmentDialog>>('patientLaboratoryAttachmentDialog')
const patientPrescriptionAttachmentDialog = useTemplateRef<InstanceType<typeof PatientAttachmentDialog>>('patientPrescriptionAttachmentDialog')
const patientRehabPrescriptionAttachmentDialog = useTemplateRef<InstanceType<typeof PatientAttachmentDialog>>('patientRehabPrescriptionAttachmentDialog')

const patientForm = useTemplateRef<InstanceType<typeof PatientForm>>('patientForm')
const patientHMOInformationForm = useTemplateRef<InstanceType<typeof PatientHMOInformationForm>>('patientHMOInformationForm')

const useClinicStore = clinicStore()
const useAppointmentStore = appointmentStore()
const useBillStore = billStore()
const router = useRouter()
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
const patientDetailsVisible = ref<boolean>(false)
const pendingPatientDrillDownId = ref<number>()
const pendingPatientDrillDownName = ref<string>()

const onPatientRowClick = (patient: Patient): void => {
  selectedPatientDetails.value = patient
  patientDetailsVisible.value = true
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

const selectedClinic = ref<Lookup | undefined>()
const selectedSearch = ref<string | undefined>()
const selectedStatus = ref<Status>(defaultStatus)
const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<Patient> | undefined>()

watchDebounced(
  [selectedClinic, selectedSearch, selectedStatus],
  (): void => {
    page.value = 1
    void refetch()
  },
  {debounce: defaultFilterDebounce, flush: "post"},
)

const resetFilters = (): void => {
  selectedSearch.value = undefined
  selectedStatus.value = defaultStatus
  selectedClinic.value = undefined
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
  hmos: hmos.value
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

const patientLaboratoryAttachmentProps = computed(() => ({
  header: `Add ${selectedPatient.value?.full_name} laboratory`,
  patientAttachmentTanstackKey: PatientAttachmentTanstackKey.LABORATORY,
  patient: selectedPatient.value
}) satisfies PatientAttachmentDialogFormProps)

const patientPrescriptionAttachmentProps = computed(() => ({
  header: `Add ${selectedPatient.value?.full_name} prescription`,
  patientAttachmentTanstackKey: PatientAttachmentTanstackKey.PRESCRIPTION,
  patient: selectedPatient.value
}) satisfies PatientAttachmentDialogFormProps)

const patientRehabPrescriptionAttachmentProps = computed(() => ({
  header: `Add ${selectedPatient.value?.full_name} rehab prescription`,
  patientAttachmentTanstackKey: PatientAttachmentTanstackKey.REHAB_PRESCRIPTION,
  patient: selectedPatient.value
}) satisfies PatientAttachmentDialogFormProps)

const requestParams = computed(() => ({
  pageable_request: {
    page: page.value,
    size: pageSize.value,
    name: selectedSearch.value?.trim() || undefined,
    status: selectedStatus.value
  },
  clinic_id: selectedClinic.value?.id,
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
  selectedPatient.value = undefined
  patientForm.value?.toggleDialog()
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
        referred_by: event.values?.referred_by,
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
            errorToast(toast, `Edit failed ${error.message}`)
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
            confirm.require({
              message: `Would you like to register HMO information for ${fullName}?`,
              header: 'Register HMO Information',
              icon: 'pi pi-address-book',
              acceptLabel: 'Yes, register now',
              rejectLabel: 'Skip',
              accept: () => { patientHMOInformationForm.value?.toggleDialog() },
              reject: () => { selectedPatient.value = undefined },
            })
          }
        },
        async onError(error: APIError) {
          errorToast(toast, `Save failed ${error.message}`)
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
        selectedPatient.value = patient
        patientForm.value?.toggleDialog()
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
                errorToast(toast, `Toggle status failed ${error.message}`)
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
      command: async () => {
        useAppointmentStore.patient = patient
        infoToast(toast, `Viewing appointments for ${patient.full_name}`)
        await router.push("/appointments")
      }
    },
    {
      label: `View Bills`,
      icon: 'pi pi-receipt',
      command: async () => {
        useBillStore.patient = patient
        infoToast(toast, `Viewing bills for ${patient.full_name}`)
        await router.push("/billing")
      },
    },
    {
      label: 'View HMO Information',
      icon: 'pi pi-address-book',
      command: () => {
        selectedPatient.value = patient
        patientHMOInformationForm.value?.toggleDialog()
      },
    },
    {
      separator: true
    },
    {
      label: 'Medical Information',
      icon: 'pi pi-hourglass',
      items: [
        {
          label: `View Medical Categories`,
          icon: 'pi pi-hourglass',
          command: () => {
            selectedPatient.value = patient
            patientMedicalCategoryDialog.value?.toggleDialog()
          }
        },
        {
          label: `View Medical Diagnosis`,
          icon: 'pi pi-hourglass',
          command: () => {
            selectedPatient.value = patient
            patientMedicalDiagnoseDialog.value?.toggleDialog()
          }
        },
        {
          label: `View Medical Histories`,
          icon: 'pi pi-hourglass',
          command: () => {
            selectedPatient.value = patient
            patientMedicalHistoryDialog.value?.toggleDialog()
          }
        },
        {
          label: `View Medical Imagings`,
          icon: 'pi pi-hourglass',
          command: () => {
            selectedPatient.value = patient
            patientMedicalImagingDialog.value?.toggleDialog()
          },
        }
      ]
    },
    {
      label: 'Attachments',
      icon: 'pi pi-paperclip',
      items: [
        {
          label: 'Valid ID',
          icon: 'pi pi-paperclip',
          command: async (): Promise<void> => {
            selectedPatient.value = patient

            patientValidIdAttachmentDialog.value?.toggleDialog()
          },
        },

        {
          label: 'HMO ID',
          icon: 'pi pi-paperclip',
          command: async (): Promise<void> => {
            selectedPatient.value = patient
            patientHMOValidIdAttachmentDialog.value?.toggleDialog()
          },
        },

        {
          label: 'Laboratory',
          icon: 'pi pi-paperclip',
          command: async (): Promise<void> => {
            selectedPatient.value = patient
            patientLaboratoryAttachmentDialog.value?.toggleDialog()
          },
        },

        {
          label: 'Prescription',
          icon: 'pi pi-paperclip',
          command: async (): Promise<void> => {
            selectedPatient.value = patient
            patientPrescriptionAttachmentDialog.value?.toggleDialog()
          },
        },

        {
          label: 'Rehab Prescription',
          icon: 'pi pi-paperclip',
          command: async (): Promise<void> => {
            selectedPatient.value = patient
            patientRehabPrescriptionAttachmentDialog.value?.toggleDialog()
          },
        },

      ]
    }
  ]
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const params: PatientExportRequestParams = {
    clinic_id: selectedClinic.value?.id,
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
      clinic_id: selectedClinic.value?.id,
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
    staffTanstackService.getAllLookup(queryClient, undefined, defaultPage, undefined),
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
  doctors.value = contentOrEmpty(fetchedDoctors)
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

const onClinicRedirect = async (): Promise<void> => {
  const clinicFromStore: Lookup | undefined = useClinicStore.clinic
  if (!clinicFromStore) return
  selectedClinic.value = clinics.value.find(c => c.id === clinicFromStore.id)
  useClinicStore.resetClinic()
}

onMounted(async (): Promise<void> => {
  void initializeDropdowns().then(async () => {
    await onClinicRedirect()
  })
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
