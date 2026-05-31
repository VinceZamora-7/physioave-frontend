<template>
  <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <div class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evaluation Visit Log</div>
        <div class="text-base font-semibold text-slate-900 dark:text-slate-100">Visit-based documentation and supporting files</div>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Use this section for per-visit PT documentation. Ancillary medical records such as X-ray, laboratory, prescription, and rehab prescription are uploaded here instead of the static patient attachments area.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tag :value="visitCountLabel" severity="secondary" />
        <Button
          :label="isExpanded ? 'Hide Visit Log' : 'Show Visit Log'"
          :icon="isExpanded ? 'pi pi-minus' : 'pi pi-plus'"
          severity="secondary"
          outlined
          @click="toggleExpanded"
        />
        <Button v-if="isExpanded" label="Add Visit Entry" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
    </div>

    <div v-if="isExpanded" class="mt-5 space-y-4">
      <Message v-if="loadError" severity="warn" :closable="false">{{ loadError }}</Message>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Documentation Scope</div>
          <div class="mt-2 text-sm text-slate-700 dark:text-slate-200">S-ubjective, O-bjective, A-ssessment, and P-lan are recorded per visit as standalone notes.</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ancillary Files</div>
          <div class="mt-2 text-sm text-slate-700 dark:text-slate-200">Choose the ancillary record type first so uploaded PDFs are automatically renamed in a consistent format.</div>
        </div>
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Stored Filename</div>
          <div class="mt-2 text-sm text-slate-700 dark:text-slate-200">{{ ancillaryFileNamePreview }}</div>
        </div>
      </div>

      <DataTable :value="visitLogs" size="small" :loading="isLoading" scrollable stripedRows>
        <template #empty>
          <div class="py-10 text-center text-sm opacity-70">No evaluation visit logs yet.</div>
        </template>

        <Column header="Date" style="min-width: 140px">
          <template #body="{ data }">
            <div class="space-y-1 text-sm">
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(data.visit_date) }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ data.medical_category || 'Uncategorized visit' }}</div>
            </div>
          </template>
        </Column>

        <Column header="Medical Diagnosis" style="min-width: 280px">
          <template #body="{ data }">
            <div class="space-y-2 text-sm">
              <div><span class="font-medium">Doctor Diagnosis:</span> {{ formatDiagnosis(data.doctor_diagnosis, data.doctor_diagnosis_laterality) }}</div>
              <div><span class="font-medium">PT Impression:</span> {{ formatDiagnosis(data.pt_case_impression, data.pt_case_impression_laterality) }}</div>
            </div>
          </template>
        </Column>

        <Column header="S-ubjective" style="min-width: 220px">
          <template #body="{ data }">{{ data.subjective || 'N/A' }}</template>
        </Column>

        <Column header="O-bjective" style="min-width: 220px">
          <template #body="{ data }">{{ data.objective || 'N/A' }}</template>
        </Column>

        <Column header="A-ssessment" style="min-width: 220px">
          <template #body="{ data }">{{ data.assessment || 'N/A' }}</template>
        </Column>

        <Column header="P-lan" style="min-width: 220px">
          <template #body="{ data }">{{ data.plan || 'N/A' }}</template>
        </Column>

        <Column header="Supporting Files" style="min-width: 280px">
          <template #body="{ data }">
            <div class="space-y-3 text-sm">
              <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span class="font-medium">Ancillary Medical Record</span>
                  <Tag :value="data.ancillary_attachment ? 'PDF Attached' : 'No File'" :severity="data.ancillary_attachment ? 'info' : 'secondary'" />
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Type: {{ data.ancillary_record_type || 'Not set' }}</div>
                <Button
                  v-if="data.ancillary_attachment"
                  label="Preview PDF"
                  icon="pi pi-eye"
                  size="small"
                  text
                  class="mt-2"
                  @click="previewAttachment(data.id, 'ancillary')"
                />
              </div>

              <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span class="font-medium">Digital Posture & ROM</span>
                  <Tag :value="data.digital_posture_attachment ? 'PDF Attached' : 'No File'" :severity="data.digital_posture_attachment ? 'info' : 'secondary'" />
                </div>
                <Button
                  v-if="data.digital_posture_attachment"
                  label="Preview PDF"
                  icon="pi pi-eye"
                  size="small"
                  text
                  @click="previewAttachment(data.id, 'digital-posture')"
                />
              </div>
            </div>
          </template>
        </Column>

        <Column header="Actions" style="min-width: 140px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Button icon="pi pi-pen-to-square" size="small" text @click="openEditDialog(data)" />
              <Button icon="pi pi-trash" size="small" text severity="danger" @click="confirmDelete(data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="isDialogVisible" modal :header="dialogHeader" :style="{ width: '76rem', maxWidth: '96vw' }" :draggable="false">
      <div class="space-y-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">Visit Documentation</div>
          <div class="mt-1 text-sm text-slate-600 dark:text-slate-300">Document the visit details first, then attach the ancillary and posture/ROM PDFs that belong to this visit.</div>
        </div>

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div class="space-y-4">
            <div class="rounded-2xl border border-[rgb(var(--app-border))] p-4">
              <div class="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Medical Diagnosis</div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Visit Date</label>
                  <DatePicker v-model="form.visit_date" dateFormat="yy-mm-dd" showIcon fluid :manualInput="false" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Medical Category</label>
                  <Select
                    v-model="form.medical_category"
                    :options="normalizedMedicalCategoryOptions"
                    editable
                    showClear
                    fluid
                    placeholder="Select or type medical category"
                  />
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Doctor Diagnosis</label>
                  <Select
                    v-model="form.doctor_diagnosis"
                    :options="normalizedMedicalDiagnosisOptions"
                    editable
                    showClear
                    fluid
                    placeholder="Select or type doctor diagnosis"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Laterality</label>
                  <Select v-model="form.doctor_diagnosis_laterality" :options="lateralityOptions" optionLabel="label" optionValue="value" showClear fluid />
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
                <div class="space-y-2">
                  <label class="text-sm font-medium">PT Case Impression</label>
                  <Select
                    v-model="form.pt_case_impression"
                    :options="normalizedPTCaseImpressionOptions"
                    editable
                    showClear
                    fluid
                    placeholder="Select or type PT case impression"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Laterality</label>
                  <Select v-model="form.pt_case_impression_laterality" :options="lateralityOptions" optionLabel="label" optionValue="value" showClear fluid />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-[rgb(var(--app-border))] p-4">
              <div class="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">S-ubjective, O-bjective, A-ssessment, P-lan</div>
              <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-medium">S-ubjective</label>
                  <Textarea v-model="form.subjective" rows="4" fluid autoResize />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">O-bjective</label>
                  <Textarea v-model="form.objective" rows="4" fluid autoResize />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">A-ssessment</label>
                  <Textarea v-model="form.assessment" rows="4" fluid autoResize />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">P-lan</label>
                  <Textarea v-model="form.plan" rows="4" fluid autoResize />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">Ancillary Medical Records</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Examples: X-ray, Laboratory, Prescription, Rehab Prescription, Ultrasound.</div>
                </div>
                <Tag :value="form.existing_ancillary_attachment || ancillaryAttachment ? 'Ready' : 'Optional'" :severity="form.existing_ancillary_attachment || ancillaryAttachment ? 'info' : 'secondary'" />
              </div>

              <div class="mt-4 space-y-3">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Ancillary Record Type</label>
                  <Select v-model="form.ancillary_record_type" :options="ancillaryTypeOptions" editable showClear fluid placeholder="Select or type ancillary record type" />
                </div>

                <div class="rounded-xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3">
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Automatic File Name</div>
                  <div class="mt-2 text-sm text-slate-700 dark:text-slate-200">{{ ancillaryFileNamePreview }}</div>
                </div>

                <FileUpload mode="basic" accept=".pdf,application/pdf" chooseLabel="Choose PDF" customUpload :auto="false" @select="onAncillarySelect" />

                <div v-if="ancillaryAttachment?.name" class="text-sm text-slate-700 dark:text-slate-200">Selected file: {{ ancillaryAttachment.name }}</div>
                <div v-else-if="form.existing_ancillary_attachment?.file_id" class="text-sm text-slate-700 dark:text-slate-200">Current file: {{ form.existing_ancillary_attachment.file_id }}</div>

                <div class="flex flex-wrap items-center gap-2">
                  <Button v-if="form.existing_ancillary_attachment?.file_id" label="Preview" icon="pi pi-eye" text size="small" @click="previewAttachment(form.id ?? 0, 'ancillary')" />
                  <Button v-if="ancillaryAttachment || form.existing_ancillary_attachment?.file_id" label="Clear" icon="pi pi-times" text size="small" severity="secondary" @click="clearAncillaryAttachment" />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">Digital Posture & ROM Record</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload the PDF that documents posture findings and range of motion for this same visit.</div>
                </div>
                <Tag :value="form.existing_digital_posture_attachment || digitalPostureAttachment ? 'Ready' : 'Optional'" :severity="form.existing_digital_posture_attachment || digitalPostureAttachment ? 'info' : 'secondary'" />
              </div>

              <div class="mt-4 space-y-3">
                <FileUpload mode="basic" accept=".pdf,application/pdf" chooseLabel="Choose PDF" customUpload :auto="false" @select="onDigitalPostureSelect" />

                <div v-if="digitalPostureAttachment?.name" class="text-sm text-slate-700 dark:text-slate-200">Selected file: {{ digitalPostureAttachment.name }}</div>
                <div v-else-if="form.existing_digital_posture_attachment?.file_id" class="text-sm text-slate-700 dark:text-slate-200">Current file: {{ form.existing_digital_posture_attachment.file_id }}</div>

                <div class="flex flex-wrap items-center gap-2">
                  <Button v-if="form.existing_digital_posture_attachment?.file_id" label="Preview" icon="pi pi-eye" text size="small" @click="previewAttachment(form.id ?? 0, 'digital-posture')" />
                  <Button v-if="digitalPostureAttachment || form.existing_digital_posture_attachment?.file_id" label="Clear" icon="pi pi-times" text size="small" severity="secondary" @click="clearDigitalPostureAttachment" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button label="Cancel" severity="secondary" outlined @click="closeDialog" />
          <Button label="Save Visit Log" icon="pi pi-save" :loading="isSaving" @click="saveVisitLog" />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import FileUpload from "primevue/fileupload"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import Textarea from "primevue/textarea"
import { useFileSelect } from "@/composables/file-select.composable.ts"
import { pamsAPI } from "@/utils/axios-interceptor.ts"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util.ts"
import type { Patient } from "@/features/patients/types/patient"
import {
  patientEvaluationVisitLogService,
  type PatientEvaluationVisitLogAttachment,
  type PatientEvaluationVisitLogItem,
  type PatientEvaluationVisitLogSavePayload,
} from "@/features/patients/api/patient-evaluation-visit-log.service"

const props = defineProps<{
  patient?: Patient
  medicalCategoryOptions?: string[]
  medicalDiagnosisOptions?: string[]
  ptCaseImpressionOptions?: string[]
}>()

const toast = useToast()
const confirm = useConfirm()

const isExpanded = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref("")
const visitLogs = ref<PatientEvaluationVisitLogItem[]>([])
const isDialogVisible = ref(false)

const {
  selected: ancillaryAttachment,
  onSelect: onAncillarySelect,
  reset: resetAncillaryAttachment,
} = useFileSelect()
const {
  selected: digitalPostureAttachment,
  onSelect: onDigitalPostureSelect,
  reset: resetDigitalPostureAttachment,
} = useFileSelect()

const lateralityOptions = [
  { label: "Right", value: "RIGHT" },
  { label: "Left", value: "LEFT" },
  { label: "Both", value: "BOTH" },
]

const ancillaryTypeOptions = [
  "X-ray",
  "Laboratory",
  "Prescription",
  "Rehab Prescription",
  "Ultrasound",
  "MRI",
  "CT Scan",
  "Medical Certificate",
  "Other",
]

type VisitLogFormState = {
  id: number | null
  visit_date: Date | null
  medical_category: string
  doctor_diagnosis: string
  doctor_diagnosis_laterality: string | null
  pt_case_impression: string
  pt_case_impression_laterality: string | null
  subjective: string
  objective: string
  assessment: string
  plan: string
  ancillary_record_type: string | null
  existing_ancillary_attachment: PatientEvaluationVisitLogAttachment | null
  existing_digital_posture_attachment: PatientEvaluationVisitLogAttachment | null
  remove_ancillary_attachment: boolean
  remove_digital_posture_attachment: boolean
}

const createEmptyForm = (): VisitLogFormState => ({
  id: null,
  visit_date: new Date(),
  medical_category: "",
  doctor_diagnosis: "",
  doctor_diagnosis_laterality: null,
  pt_case_impression: "",
  pt_case_impression_laterality: null,
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  ancillary_record_type: null,
  existing_ancillary_attachment: null,
  existing_digital_posture_attachment: null,
  remove_ancillary_attachment: false,
  remove_digital_posture_attachment: false,
})

const form = ref<VisitLogFormState>(createEmptyForm())

const normalizedMedicalCategoryOptions = computed<string[]>(() => {
  return Array.from(new Set((props.medicalCategoryOptions ?? []).map((item) => String(item).trim()).filter(Boolean)))
})

const normalizedMedicalDiagnosisOptions = computed<string[]>(() => {
  return Array.from(new Set((props.medicalDiagnosisOptions ?? []).map((item) => String(item).trim()).filter(Boolean)))
})

const normalizedPTCaseImpressionOptions = computed<string[]>(() => {
  return Array.from(new Set((props.ptCaseImpressionOptions ?? []).map((item) => String(item).trim()).filter(Boolean)))
})

const dialogHeader = computed(() => form.value.id ? "Edit Evaluation Visit Log" : "Add Evaluation Visit Log")
const visitCountLabel = computed(() => `${visitLogs.value.length} visit${visitLogs.value.length === 1 ? "" : "s"}`)

const ancillaryFileNamePreview = computed(() => {
  const normalizedType = String(form.value.ancillary_record_type ?? "").trim() || "AncillaryMedicalRecords"
  const patientRecordCode = String(props.patient?.public_id ?? "PAT-RECORD").trim() || "PAT-RECORD"
  const now = new Date()
  const uploadDate = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`
  const segment = (value: string): string => value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "Record"

  return `${segment(normalizedType)}-${segment(patientRecordCode)}-${uploadDate}.pdf`
})

const toDateParam = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDate = (value?: string): string => {
  if (!value) return "N/A"
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const formatDiagnosis = (value?: string | null, laterality?: string | null): string => {
  const diagnosis = String(value ?? "").trim()
  const normalizedLaterality = String(laterality ?? "").trim()
  if (!diagnosis) return "N/A"
  return normalizedLaterality ? `${diagnosis} (${normalizedLaterality})` : diagnosis
}

const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer()
  let binary = ""
  const chunkSize = 0x8000
  const view = new Uint8Array(bytes)

  for (let index = 0; index < view.length; index += chunkSize) {
    const chunk = view.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

const buildUploadPayload = async (file: File | undefined) => {
  if (!file) return null
  return {
    file_name: file.name,
    media_type: file.type,
    content_base64: await fileToBase64(file),
  }
}

const loadVisitLogs = async (): Promise<void> => {
  if (!props.patient?.id) {
    visitLogs.value = []
    return
  }

  try {
    isLoading.value = true
    loadError.value = ""
    visitLogs.value = await patientEvaluationVisitLogService.getAll(props.patient.id)
  } catch (error: unknown) {
    visitLogs.value = []
    loadError.value = getApiErrorMessage(error, {
      baseMessage: "Failed to load evaluation visit logs",
      permissionHint: "Patient access (Read or Lookup) in Role Access",
      retryHint: "Refresh and try again."
    })
  } finally {
    isLoading.value = false
  }
}

const toggleExpanded = async (): Promise<void> => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    await loadVisitLogs()
  }
}

const resetForm = (): void => {
  form.value = createEmptyForm()
  resetAncillaryAttachment()
  resetDigitalPostureAttachment()
}

const openCreateDialog = (): void => {
  resetForm()
  isDialogVisible.value = true
}

const openEditDialog = (log: PatientEvaluationVisitLogItem): void => {
  resetForm()
  form.value = {
    id: log.id,
    visit_date: log.visit_date ? new Date(`${log.visit_date}T00:00:00`) : new Date(),
    medical_category: log.medical_category ?? "",
    doctor_diagnosis: log.doctor_diagnosis ?? "",
    doctor_diagnosis_laterality: log.doctor_diagnosis_laterality ?? null,
    pt_case_impression: log.pt_case_impression ?? "",
    pt_case_impression_laterality: log.pt_case_impression_laterality ?? null,
    subjective: log.subjective ?? "",
    objective: log.objective ?? "",
    assessment: log.assessment ?? "",
    plan: log.plan ?? "",
    ancillary_record_type: log.ancillary_record_type ?? null,
    existing_ancillary_attachment: log.ancillary_attachment ?? null,
    existing_digital_posture_attachment: log.digital_posture_attachment ?? null,
    remove_ancillary_attachment: false,
    remove_digital_posture_attachment: false,
  }
  isDialogVisible.value = true
}

const closeDialog = (): void => {
  isDialogVisible.value = false
  resetForm()
}

const clearAncillaryAttachment = (): void => {
  resetAncillaryAttachment()
  form.value.remove_ancillary_attachment = true
  form.value.existing_ancillary_attachment = null
}

const clearDigitalPostureAttachment = (): void => {
  resetDigitalPostureAttachment()
  form.value.remove_digital_posture_attachment = true
  form.value.existing_digital_posture_attachment = null
}

const previewAttachment = async (logId: number, kind: "ancillary" | "digital-posture"): Promise<void> => {
  if (!props.patient?.id || !logId) return

  const response = await pamsAPI.get(`/patients/${props.patient.id}/evaluation-visit-logs/${logId}/attachments/${kind}/file`, {
    responseType: "blob"
  })
  const url = URL.createObjectURL(response.data)
  window.open(url, "_blank", "noopener,noreferrer")
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

const saveVisitLog = async (): Promise<void> => {
  if (!props.patient?.id) return
  if (!form.value.visit_date) {
    errorToast(toast, "Visit date is required")
    return
  }

  if (ancillaryAttachment.value && ancillaryAttachment.value.type !== "application/pdf") {
    errorToast(toast, "Ancillary Medical Records must be a PDF")
    return
  }
  if (digitalPostureAttachment.value && digitalPostureAttachment.value.type !== "application/pdf") {
    errorToast(toast, "Digital Posture & ROM Record must be a PDF")
    return
  }
  if (ancillaryAttachment.value && !String(form.value.ancillary_record_type ?? "").trim()) {
    errorToast(toast, "Ancillary record type is required when uploading an ancillary PDF")
    return
  }

  try {
    isSaving.value = true
    const hasAncillaryFile = Boolean(form.value.existing_ancillary_attachment || ancillaryAttachment.value)
    const payload: PatientEvaluationVisitLogSavePayload = {
      visit_date: toDateParam(form.value.visit_date),
      medical_category: form.value.medical_category.trim() || null,
      doctor_diagnosis: form.value.doctor_diagnosis.trim() || null,
      doctor_diagnosis_laterality: form.value.doctor_diagnosis_laterality,
      pt_case_impression: form.value.pt_case_impression.trim() || null,
      pt_case_impression_laterality: form.value.pt_case_impression_laterality,
      subjective: form.value.subjective.trim() || null,
      objective: form.value.objective.trim() || null,
      assessment: form.value.assessment.trim() || null,
      plan: form.value.plan.trim() || null,
      ancillary_record_type: hasAncillaryFile ? String(form.value.ancillary_record_type ?? "").trim() || null : null,
      ancillary_attachment: await buildUploadPayload(ancillaryAttachment.value),
      digital_posture_attachment: await buildUploadPayload(digitalPostureAttachment.value),
      remove_ancillary_attachment: form.value.remove_ancillary_attachment,
      remove_digital_posture_attachment: form.value.remove_digital_posture_attachment,
    }

    if (form.value.id) {
      await patientEvaluationVisitLogService.update(props.patient.id, form.value.id, payload)
      successToast(toast, "Evaluation visit log updated")
    } else {
      await patientEvaluationVisitLogService.create(props.patient.id, payload)
      successToast(toast, "Evaluation visit log added")
    }

    await loadVisitLogs()
    closeDialog()
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, {
      baseMessage: "Failed to save evaluation visit log",
      permissionHint: "Patient access (Can Edit) in Role Access",
      invalidInputHint: "Some visit log values are invalid. Check required fields and PDF attachments, then try again.",
      retryHint: "Please try again."
    }))
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (logId: number): void => {
  const patientId = props.patient?.id
  if (!patientId) return
  confirm.require({
    message: "Delete this evaluation visit log?",
    header: "Delete Evaluation Visit Log",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
      icon: "pi pi-trash",
    },
    accept: async () => {
      try {
        await patientEvaluationVisitLogService.delete(patientId, logId)
        successToast(toast, "Evaluation visit log deleted")
        await loadVisitLogs()
      } catch (error: unknown) {
        errorToast(toast, getApiErrorMessage(error, {
          baseMessage: "Failed to delete evaluation visit log",
          permissionHint: "Patient access (Can Edit) in Role Access",
          retryHint: "Refresh the visit list and try again."
        }))
      }
    }
  })
}

watch(() => props.patient?.id, () => {
  visitLogs.value = []
  loadError.value = ""
  resetForm()
})
</script>
