<template>
  <main class="app-page-shell space-y-5">
    <section class="app-appointment-card app-appointment-card-accent p-4 sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <h2 class="app-appointment-title text-xl">Daily Patient Log</h2>
          <p class="app-appointment-muted max-w-2xl text-sm leading-6">
            Review all patient appointment logs for the selected day.
          </p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="app-appointment-chip">Date: {{ selectedDateLabel }}</span>
            <span class="app-appointment-chip">Branch: {{ selectedClinic?.name || "All branches" }}</span>
          </div>
        </div>

        <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-5 lg:w-auto">
          <article class="app-appointment-summary-card">
            <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Total Logs</p>
            <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ summary.total }}</p>
          </article>
          <article class="app-appointment-summary-card">
            <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Completed</p>
            <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ summary.completed }}</p>
          </article>
          <article class="app-appointment-summary-card">
            <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Pending</p>
            <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ summary.pending }}</p>
          </article>
          <article class="app-appointment-summary-card">
            <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Rescheduled</p>
            <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ summary.rescheduled }}</p>
          </article>
          <article class="app-appointment-summary-card">
            <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Canceled</p>
            <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ summary.cancelled }}</p>
          </article>
        </div>
      </div>
    </section>

    <Message
      v-if="summary.pending > 0"
      severity="warn"
      :closable="false"
    >
      There {{ summary.pending === 1 ? "is" : "are" }} still {{ summary.pending }} pending
      appointment{{ summary.pending === 1 ? "" : "s" }} for this EOD log.
    </Message>

    <section class="app-appointment-card space-y-4 p-4 sm:p-5">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="app-appointment-title text-lg">Patient Logs</h3>
          <p class="app-appointment-muted text-sm">
            Daily table of patients, schedules, PT assignment, attendance, and billing status.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DatePicker
            v-model="selectedDate"
            dateFormat="yy-mm-dd"
            showIcon
            :manualInput="false"
            class="w-full sm:w-48"
          />
          <InputText
            v-model="search"
            placeholder="Search patient"
            class="w-full sm:w-56"
            @keydown.enter="loadDailyLog"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            :loading="isLoading"
            @click="loadDailyLog"
          />
          <Button
            label="Export PDF"
            icon="pi pi-file-pdf"
            severity="secondary"
            outlined
            :loading="isApprovingSignatureException"
            :disabled="!items.length || isLoading"
            @click="exportDailyLogPdf"
          />
        </div>
      </div>

      <DataTable
        class="app-data-table"
        :value="items"
        dataKey="daily_log_row_key"
        :loading="isLoading"
        size="small"
        paginator
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
        scrollable
      >
        <template #empty>
          <div class="py-10 text-center text-sm opacity-70">
            No patient logs found for this day.
          </div>
        </template>

        <Column header="Time" style="min-width: 150px">
          <template #body="{ data }">
            <div class="font-medium">{{ formatTimeRange(data.starts_at, data.ends_at) }}</div>
            <div class="text-xs opacity-60">{{ formatDate(data.starts_at) }}</div>
          </template>
        </Column>

        <Column header="Patient" style="min-width: 240px">
          <template #body="{ data }">
            <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.patient_name || "Unnamed patient" }}</div>
            <div class="text-xs opacity-60">{{ data.patient_public_id || `Patient #${data.patient_id}` }}</div>
          </template>
        </Column>

        <Column header="Branch / Service" style="min-width: 230px">
          <template #body="{ data }">
            <div class="font-medium">{{ data.clinic_name || "No branch" }}</div>
            <div class="text-xs opacity-60">{{ serviceLabel(data) }}</div>
          </template>
        </Column>

        <Column header="Physical Therapyst" style="min-width: 230px">
          <template #body="{ data }">
            <div class="font-medium">{{ data.provider_name || "Unassigned PT" }}</div>

          </template>
        </Column>

        <Column header="Visit Status" style="min-width: 180px">
          <template #body="{ data }">
            <div class="flex flex-wrap items-center gap-2">
              <Tag :value="visitStatusLabel(data)" :severity="visitStatusSeverity(data)" />
              <Tag v-if="isRescheduledOriginal(data)" value="Original schedule" severity="info" />
              <span v-if="rescheduleBasis(data)" class="text-xs opacity-60">
                {{ rescheduleBasis(data) }}
              </span>
            </div>
          </template>
        </Column>

        <Column header="Patient Signature" style="min-width: 190px">
          <template #body="{ data }">
            <button
              v-if="patientSignatureFor(data)"
              type="button"
              class="group flex items-center gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-white px-2 py-1.5 text-left transition hover:border-[rgb(var(--app-primary))]"
              @click="openSignaturePreview(data, 'patient')"
            >
              <img
                :src="patientSignatureFor(data)"
                :alt="`${data.patient_name || 'Patient'} signature`"
                class="h-10 w-24 rounded border border-[rgb(var(--app-border))] bg-white object-contain"
              />
              <span class="text-xs font-medium text-[rgb(var(--app-primary))] group-hover:underline">View</span>
            </button>
            <Tag v-else value="No signature" severity="warn" />
          </template>
        </Column>

        <Column header="PT Signature" style="min-width: 190px">
          <template #body="{ data }">
            <div class="flex flex-col items-start gap-2">
              <button
                v-if="ptSignatureFor(data)"
                type="button"
                class="group flex items-center gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-white px-2 py-1.5 text-left transition hover:border-[rgb(var(--app-primary))]"
                @click="openSignaturePreview(data, 'pt')"
              >
                <img
                  :src="ptSignatureFor(data)"
                  :alt="`${data.provider_name || 'PT'} signature`"
                  class="h-10 w-24 rounded border border-[rgb(var(--app-border))] bg-white object-contain"
                />
                <span class="text-xs font-medium text-[rgb(var(--app-primary))] group-hover:underline">View</span>
              </button>
              <Tag v-else value="No signature" severity="warn" />
              <Button
                :label="ptSignatureFor(data) ? 'Update' : 'Sign'"
                :icon="ptSignatureFor(data) ? 'pi pi-pencil' : 'pi pi-pen-to-square'"
                size="small"
                severity="secondary"
                outlined
                :disabled="isSavingPtSignature"
                @click="openPtSignatureDialog(data)"
              />
            </div>
          </template>
        </Column>

        <Column header="Billing" style="min-width: 190px">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-2">
              <Tag :value="billingTypeLabel(data)" severity="secondary" />
              <Tag :value="data.billing_status || 'Unbilled'" :severity="billingSeverity(data.billing_status)" />
            </div>
          </template>
        </Column>

        <Column header="Session Sequence" style="min-width: 190px">
          <template #body="{ data }">
            <div class="text-xs opacity-60">{{ sessionLabel(data) }}</div>
          </template>
        </Column>

        <Column header="Actions" style="min-width: 190px">
          <template #body="{ data }">
            <Button
              label="Add Eval Log"
              icon="pi pi-file-edit"
              size="small"
              severity="secondary"
              outlined
              :loading="isOpeningEvaluationVisitLog && selectedEvaluationLogAppointmentId === data.id"
              :disabled="isOpeningEvaluationVisitLog"
              @click="openEvaluationVisitLogShortcut(data)"
            />
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog
      v-model:visible="signatureExceptionVisible"
      modal
      header="Document Missing Signature Exception"
      :style="{ width: 'min(640px, 94vw)' }"
    >
      <div class="space-y-5">
        <Message severity="warn" :closable="false">
          {{ missingSignatureRows.length }} completed visit{{ missingSignatureRows.length === 1 ? "" : "s" }}
          {{ missingSignatureRows.length === 1 ? "is" : "are" }} missing a patient or PT signature.
          Printing requires a documented exception and creates a permanent audit entry.
        </Message>

        <div class="max-h-52 overflow-auto rounded-xl border border-[rgb(var(--app-border))]">
          <div
            v-for="row in missingSignatureRows"
            :key="row.item.id"
            class="flex items-start justify-between gap-4 border-b border-[rgb(var(--app-border))] px-4 py-3 last:border-b-0"
          >
            <div>
              <div class="font-medium text-[rgb(var(--app-fg))]">{{ row.item.patient_name || "Unnamed patient" }}</div>
              <div class="text-xs opacity-60">{{ formatTimeRange(row.item.starts_at, row.item.ends_at) }}</div>
            </div>
            <Tag
              :value="row.missingTypes.map(type => type === 'patient' ? 'Patient' : 'PT').join(' + ')"
              severity="warn"
            />
          </div>
        </div>

        <label class="block space-y-2">
          <span class="text-sm font-medium">Reason</span>
          <Select
            v-model="signatureExceptionReason"
            :options="signatureExceptionReasonOptions"
            option-label="label"
            option-value="value"
            placeholder="Select a reason"
            class="w-full"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium">Required explanation</span>
          <Textarea
            v-model="signatureExceptionExplanation"
            rows="4"
            maxlength="1000"
            class="w-full"
            placeholder="Describe what happened and why the signatures can no longer be obtained."
          />
          <span class="block text-xs opacity-60">Minimum 10 characters. This note will appear on the printout and in the audit log.</span>
        </label>

        <Message v-if="signatureExceptionError" severity="error" :closable="false">
          {{ signatureExceptionError }}
        </Message>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="isApprovingSignatureException"
          @click="signatureExceptionVisible = false"
        />
        <Button
          label="Approve Exception & Print"
          icon="pi pi-print"
          :loading="isApprovingSignatureException"
          @click="approveSignatureExceptionAndPrint"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="signaturePreviewVisible"
      modal
      :header="signaturePreviewHeader"
      :style="{ width: 'min(560px, 92vw)' }"
    >
      <div class="space-y-3">
        <div>
          <div class="font-semibold text-[rgb(var(--app-fg))]">
            {{ selectedSignatureRow?.patient_name || "Patient" }}
          </div>
          <div class="text-xs opacity-60">
            {{ selectedSignatureRow ? appointmentRecordId(selectedSignatureRow) : "" }}
          </div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-white p-4">
          <img
            v-if="selectedSignatureDataUrl"
            :src="selectedSignatureDataUrl"
            :alt="signaturePreviewHeader"
            class="h-48 w-full object-contain"
          />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="ptSignatureDialogVisible"
      modal
      header="Log PT Signature"
      :style="{ width: 'min(720px, 94vw)' }"
      :draggable="false"
      @hide="resetPtSignatureDialog"
    >
      <div v-if="selectedPtSignatureRow" class="space-y-4">
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
          <div class="font-semibold text-[rgb(var(--app-fg))]">
            {{ selectedPtSignatureRow.patient_name || "Patient" }}
          </div>
          <div class="text-xs opacity-60">
            {{ formatTimeRange(selectedPtSignatureRow.starts_at, selectedPtSignatureRow.ends_at) }}
            Â· {{ selectedPtSignatureRow.provider_name || "Unassigned PT" }}
            Â· {{ appointmentRecordId(selectedPtSignatureRow) }}
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-[rgb(var(--app-border))] bg-white p-2">
          <canvas
            ref="ptSignatureCanvas"
            class="block h-44 w-full touch-none rounded-lg bg-white"
            @pointerdown="startPtSignature"
            @pointermove="drawPtSignature"
            @pointerup="stopPtSignature"
            @pointercancel="stopPtSignature"
            @pointerleave="stopPtSignature"
            @contextmenu.prevent
          />
        </div>

        <div class="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p class="app-appointment-muted">Signature of PT / authorized staff</p>
          <p v-if="ptSignatureError" class="font-medium text-red-500">{{ ptSignatureError }}</p>
          <p v-else-if="hasPtSignatureDraft" class="font-medium text-green-600">Signature captured</p>
          <p v-else class="font-medium text-orange-500">Draw the PT signature before saving</p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="isSavingPtSignature"
          @click="ptSignatureDialogVisible = false"
        />
        <Button
          label="Clear"
          icon="pi pi-eraser"
          severity="secondary"
          outlined
          :disabled="isSavingPtSignature"
          @click="clearPtSignature"
        />
        <Button
          label="Save PT Signature"
          icon="pi pi-save"
          :loading="isSavingPtSignature"
          :disabled="isSavingPtSignature"
          @click="savePtSignature"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="evaluationVisitLogShortcutVisible"
      modal
      header="Evaluation Visit Log Shortcut"
      :style="{ width: 'min(82rem, 96vw)' }"
      :draggable="false"
      @hide="selectedEvaluationVisitLogPatient = undefined"
    >
      <div v-if="selectedEvaluationVisitLogPatient" class="space-y-3">
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
          <div class="font-semibold text-[rgb(var(--app-fg))]">
            {{ selectedEvaluationVisitLogPatient.full_name }}
          </div>
          <div class="text-xs opacity-60">
            {{ selectedEvaluationVisitLogPatient.public_id || "Patient record" }}
            - {{ selectedEvaluationVisitLogPatient.clinic_name || selectedClinic?.name || "No branch" }}
          </div>
        </div>

        <PatientEvaluationVisitLogSection
          ref="evaluationVisitLogSection"
          :patient="selectedEvaluationVisitLogPatient"
          :medical-category-options="medicalCategoryOptions"
          :medical-diagnosis-options="medicalDiagnosisOptions"
          :pt-case-impression-options="ptCaseImpressionOptions"
        />
      </div>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from "vue-router"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import Textarea from "primevue/textarea"
import { useToast } from "primevue/usetoast"
import { clinicStore } from "@/stores/clinic.store"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import {
  appointmentPhase1Service,
  type DailyLogPrintExceptionApproval,
  type AppointmentEncounterTicket,
  type AppointmentDailyLogItem,
  type AppointmentPlannedService,
} from "@/features/appointments/api/appointment-phase1.service"
import type { Patient } from "@/features/patients/types/patient"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast, warningToast } from "@/utils/toast.util"
import {
  DAILY_PATIENT_LOG_PRINT_STORAGE_PREFIX,
  type DailyPatientLogPrintPayload
} from "@/features/daily-patient-log/print/daily-patient-log-print"

type EvaluationVisitLogSectionExpose = {
  openCreateDialog: (visitDate?: Date) => void
  loadVisitLogs: () => Promise<void>
}

type ReferenceNameRow = {
  name?: string | null
}

const PatientEvaluationVisitLogSection = defineAsyncComponent(() =>
  import("@/features/patients/components/PatientEvaluationVisitLogSection.vue")
)

const toast = useToast()
const route = useRoute()
const router = useRouter()
const branchStore = clinicStore()
const authSession = useAuthSessionStore()
const { selectedClinicId, selectedClinic } = storeToRefs(branchStore)

const dateFromQuery = (value: unknown): Date | null => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

const selectedDate = ref(dateFromQuery(route.query.date) ?? new Date())
const search = ref("")
const items = ref<AppointmentDailyLogItem[]>([])
const encounterTicketsByAppointmentId = ref<Record<number, AppointmentEncounterTicket>>({})
const plannedServicesByAppointmentId = ref<Record<number, AppointmentPlannedService[]>>({})
const patientSignaturesByAppointmentId = ref<Record<number, string>>({})
const ptSignaturesByAppointmentId = ref<Record<number, string>>({})
const signaturePreviewVisible = ref(false)
const selectedSignatureRow = ref<AppointmentDailyLogItem | null>(null)
const selectedSignatureType = ref<"patient" | "pt">("patient")
const isLoading = ref(false)
const ptSignatureDialogVisible = ref(false)
const selectedPtSignatureRow = ref<AppointmentDailyLogItem | null>(null)
const ptSignatureCanvas = ref<HTMLCanvasElement | null>(null)
const isDrawingPtSignature = ref(false)
const hasPtSignatureDraft = ref(false)
const ptSignatureError = ref("")
const isSavingPtSignature = ref(false)
const signatureExceptionVisible = ref(false)
const signatureExceptionReason = ref("")
const signatureExceptionExplanation = ref("")
const signatureExceptionError = ref("")
const isApprovingSignatureException = ref(false)
const evaluationVisitLogShortcutVisible = ref(false)
const selectedEvaluationVisitLogPatient = ref<Patient>()
const selectedEvaluationLogAppointmentId = ref<number>()
const evaluationVisitLogSection = ref<EvaluationVisitLogSectionExpose | null>(null)
const isOpeningEvaluationVisitLog = ref(false)
const evaluationVisitLogOptionsLoaded = ref(false)
const medicalCategoryOptions = ref<string[]>([])
const medicalDiagnosisOptions = ref<string[]>([])
const ptCaseImpressionOptions = ref<string[]>([])

const signatureExceptionReasonOptions = [
  { label: "Patient left before signing", value: "PATIENT_LEFT" },
  { label: "Patient declined to sign", value: "PATIENT_DECLINED" },
  { label: "PT unavailable to sign", value: "PT_UNAVAILABLE" },
  { label: "Technical issue prevented signing", value: "TECHNICAL_ISSUE" },
  { label: "Other documented reason", value: "OTHER" },
]

const selectedSignatureDataUrl = computed(() =>
  selectedSignatureRow.value
    ? selectedSignatureType.value === "pt"
      ? ptSignatureFor(selectedSignatureRow.value)
      : patientSignatureFor(selectedSignatureRow.value)
    : ""
)

const signaturePreviewHeader = computed(() =>
  selectedSignatureType.value === "pt" ? "PT Signature" : "Patient Signature"
)

const toDateKey = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const selectedDateKey = computed(() => toDateKey(selectedDate.value))
const selectedDateLabel = computed(() =>
  selectedDate.value.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
)

const appointmentDate = (item: AppointmentDailyLogItem): Date => {
  const date = item.starts_at ? new Date(item.starts_at) : selectedDate.value
  return Number.isNaN(date.getTime()) ? selectedDate.value : date
}

const toShortcutPatient = (item: AppointmentDailyLogItem): Patient => ({
  id: Number(item.patient_id ?? 0),
  public_id: typeof item.patient_public_id === "string" ? item.patient_public_id : undefined,
  first_name: String(item.patient_name || "Patient"),
  middle_name: "",
  last_name: "",
  age: 0,
  gender_id: 0,
  civil_status_id: 0,
  clinic_id: Number(item.clinic_id ?? selectedClinicId.value ?? 0),
  phone_number: "",
  folder: "",
  gender_name: "",
  civil_status_name: "",
  clinic_name: String(item.clinic_name || selectedClinic.value?.name || ""),
  is_active: true,
  full_name: String(item.patient_name || "Patient"),
} as Patient)

const extractReferenceNames = (data: unknown): string[] => {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown[] })?.content)
      ? (data as { content: unknown[] }).content
      : []

  return Array.from(
    new Set(
      rows
        .map(row => String((row as ReferenceNameRow)?.name ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))
}

const loadEvaluationVisitLogOptions = async (): Promise<void> => {
  if (evaluationVisitLogOptionsLoaded.value) return

  const [categories, diagnoses, impressions] = await Promise.allSettled([
    pamsAPI.get("/references/medical-categories", { params: { page: 1, size: 1000, status: "ACTIVE" } }),
    pamsAPI.get("/references/medical-diagnoses", { params: { page: 1, size: 1000, status: "ACTIVE" } }),
    pamsAPI.get("/references/pt-case-impressions", { params: { page: 1, size: 1000, status: "ACTIVE" } }),
  ])

  medicalCategoryOptions.value = categories.status === "fulfilled" ? extractReferenceNames(categories.value.data) : []
  medicalDiagnosisOptions.value = diagnoses.status === "fulfilled" ? extractReferenceNames(diagnoses.value.data) : []
  ptCaseImpressionOptions.value = impressions.status === "fulfilled" ? extractReferenceNames(impressions.value.data) : []
  evaluationVisitLogOptionsLoaded.value = true
}

const openCreateVisitLogWhenReady = async (visitDate: Date): Promise<void> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await nextTick()
    if (evaluationVisitLogSection.value) {
      evaluationVisitLogSection.value.openCreateDialog(visitDate)
      return
    }
    await new Promise(resolve => window.setTimeout(resolve, 40))
  }
}

const openEvaluationVisitLogShortcut = async (item: AppointmentDailyLogItem): Promise<void> => {
  if (!item.patient_id) {
    errorToast(toast, "Patient record is missing for this appointment")
    return
  }

  try {
    isOpeningEvaluationVisitLog.value = true
    selectedEvaluationLogAppointmentId.value = item.id
    await loadEvaluationVisitLogOptions()
    selectedEvaluationVisitLogPatient.value = toShortcutPatient(item)
    evaluationVisitLogShortcutVisible.value = true
    await openCreateVisitLogWhenReady(appointmentDate(item))
  } catch {
    errorToast(toast, "Unable to open evaluation visit log shortcut")
  } finally {
    isOpeningEvaluationVisitLog.value = false
    selectedEvaluationLogAppointmentId.value = undefined
  }
}

const normalizeStatus = (value?: unknown): string =>
  String(value ?? "").trim().toUpperCase()


const summary = computed(() => {
  const total = items.value.length
  const completed = items.value.filter((item) => visitStatusLabel(item) === "Completed").length
  const cancelled = items.value.filter((item) => visitStatusLabel(item) === "Canceled").length
  const rescheduled = items.value.filter((item) => visitStatusLabel(item) === "Rescheduled").length

  return {
    total,
    completed,
    cancelled,
    rescheduled,
    pending: Math.max(0, total - completed - cancelled - rescheduled),
  }
})

const missingSignatureRows = computed(() =>
  items.value
    .filter(item => visitStatusLabel(item) === "Completed")
    .map(item => {
      const missingTypes: Array<"patient" | "pt"> = []
      if (!patientSignatureFor(item)) missingTypes.push("patient")
      if (!ptSignatureFor(item)) missingTypes.push("pt")
      return { item, missingTypes }
    })
    .filter(row => row.missingTypes.length > 0)
)

const warnIfPendingAppointments = (): void => {
  if (summary.value.pending <= 0) return
  warningToast(
    toast,
    `There ${summary.value.pending === 1 ? "is" : "are"} still ${summary.value.pending} pending appointment${summary.value.pending === 1 ? "" : "s"} for this EOD log.`
  )
}

const loadDailyLog = async (): Promise<void> => {
  try {
    isLoading.value = true
    encounterTicketsByAppointmentId.value = {}
    plannedServicesByAppointmentId.value = {}
    patientSignaturesByAppointmentId.value = {}
    ptSignaturesByAppointmentId.value = {}
    const response = await appointmentPhase1Service.getDailyLog({
      date: selectedDateKey.value,
      clinic_id: selectedClinicId.value,
      search: search.value.trim() || undefined,
      size: 500,
    })
    items.value = response.items ?? []
    await loadPatientSignatures(items.value)
    warnIfPendingAppointments()
  } catch {
    items.value = []
    encounterTicketsByAppointmentId.value = {}
    plannedServicesByAppointmentId.value = {}
    patientSignaturesByAppointmentId.value = {}
    ptSignaturesByAppointmentId.value = {}
    errorToast(toast, "Failed to load daily patient log")
  } finally {
    isLoading.value = false
  }
}

const loadPatientSignatures = async (logItems: AppointmentDailyLogItem[]): Promise<void> => {
  type DailyLogDetailEntry = {
    id: number
    ticket: AppointmentEncounterTicket | null
    plannedServices: AppointmentPlannedService[]
    patientSignature: string
    ptSignature: string
  }

  const entries = await Promise.all(
    logItems.map(async (item): Promise<DailyLogDetailEntry | null> => {
      const [ticketResult, plannedServicesResult] = await Promise.allSettled([
        appointmentPhase1Service.getEncounterTicket(item.id),
        appointmentPhase1Service.getPlannedServices(item.id),
      ])

      const ticket = ticketResult.status === "fulfilled" ? ticketResult.value : null
      const plannedServices = plannedServicesResult.status === "fulfilled" ? plannedServicesResult.value : []

      if (!ticket && !plannedServices.length) {
        return null
      }

      const patientSignature = String(ticket?.patient_signature_data_url ?? "").trim()
      const ptSignature = String(ticket?.pt_signature_data_url ?? "").trim()
      return { id: item.id, ticket, plannedServices, patientSignature, ptSignature }
    })
  )

  encounterTicketsByAppointmentId.value = Object.fromEntries(
    entries
      .filter((entry): entry is DailyLogDetailEntry =>
        entry !== null && entry.ticket !== null
      )
      .map(entry => [entry.id, entry.ticket as AppointmentEncounterTicket])
  )
  plannedServicesByAppointmentId.value = Object.fromEntries(
    entries
      .filter((entry): entry is DailyLogDetailEntry =>
        entry !== null && entry.plannedServices.length > 0
      )
      .map(entry => [entry.id, entry.plannedServices])
  )
  patientSignaturesByAppointmentId.value = Object.fromEntries(
    entries
      .filter((entry): entry is DailyLogDetailEntry =>
        entry !== null && Boolean(entry.patientSignature)
      )
      .map(entry => [entry.id, entry.patientSignature])
  )
  ptSignaturesByAppointmentId.value = Object.fromEntries(
    entries
      .filter((entry): entry is DailyLogDetailEntry =>
        entry !== null && Boolean(entry.ptSignature)
      )
      .map(entry => [entry.id, entry.ptSignature])
  )
}

const patientSignatureFor = (item: AppointmentDailyLogItem): string =>
  patientSignaturesByAppointmentId.value[item.id] ?? ""

const ptSignatureFor = (item: AppointmentDailyLogItem): string =>
  ptSignaturesByAppointmentId.value[item.id] ?? ""

const appointmentRecordId = (item: AppointmentDailyLogItem): string =>
  String(item.public_id || item.appointment_id || item.id || "").trim()
    ? String(item.public_id || item.appointment_id || item.id)
    : "Not recorded"

const openSignaturePreview = (item: AppointmentDailyLogItem, type: "patient" | "pt"): void => {
  selectedSignatureRow.value = item
  selectedSignatureType.value = type
  signaturePreviewVisible.value = true
}

const getCanvasContext = (canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
  if (!canvas) return null

  const context = canvas.getContext("2d")
  if (!context) return null

  context.lineWidth = 2
  context.lineCap = "round"
  context.lineJoin = "round"
  context.strokeStyle = "#111827"

  return context
}

const getPointerPosition = (event: PointerEvent, canvas: HTMLCanvasElement | null): { x: number; y: number } | null => {
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const drawExistingSignature = (canvas: HTMLCanvasElement, dataUrl?: string | null): void => {
  if (!dataUrl) return

  const image = new Image()
  image.onload = () => {
    const context = canvas.getContext("2d")
    if (!context) return

    const rect = canvas.getBoundingClientRect()
    context.drawImage(image, 0, 0, rect.width, rect.height)
    hasPtSignatureDraft.value = true
  }
  image.src = dataUrl
}

const initializePtSignatureCanvas = (existingSignature?: string | null): void => {
  const canvas = ptSignatureCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1

  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(rect.height * ratio))

  const context = canvas.getContext("2d")
  if (!context) return

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, rect.width, rect.height)
  context.lineWidth = 2
  context.lineCap = "round"
  context.lineJoin = "round"
  context.strokeStyle = "#111827"

  hasPtSignatureDraft.value = false
  ptSignatureError.value = ""
  drawExistingSignature(canvas, existingSignature)
}

const openPtSignatureDialog = async (item: AppointmentDailyLogItem): Promise<void> => {
  selectedPtSignatureRow.value = item
  ptSignatureDialogVisible.value = true
  ptSignatureError.value = ""

  await nextTick()
  initializePtSignatureCanvas(ptSignatureFor(item))
}

const resetPtSignatureDialog = (): void => {
  selectedPtSignatureRow.value = null
  isDrawingPtSignature.value = false
  hasPtSignatureDraft.value = false
  ptSignatureError.value = ""
}

const startPtSignature = (event: PointerEvent): void => {
  if (isSavingPtSignature.value) return

  const canvas = ptSignatureCanvas.value
  const context = getCanvasContext(canvas)
  const position = getPointerPosition(event, canvas)

  if (!canvas || !context || !position) return

  canvas.setPointerCapture?.(event.pointerId)
  isDrawingPtSignature.value = true
  ptSignatureError.value = ""
  context.beginPath()
  context.moveTo(position.x, position.y)
}

const drawPtSignature = (event: PointerEvent): void => {
  if (!isDrawingPtSignature.value || isSavingPtSignature.value) return

  const context = getCanvasContext(ptSignatureCanvas.value)
  const position = getPointerPosition(event, ptSignatureCanvas.value)
  if (!context || !position) return

  context.lineTo(position.x, position.y)
  context.stroke()
  hasPtSignatureDraft.value = true
  ptSignatureError.value = ""
}

const stopPtSignature = (event?: PointerEvent): void => {
  const canvas = ptSignatureCanvas.value
  if (canvas && event) {
    try {
      canvas.releasePointerCapture?.(event.pointerId)
    } catch {
      // Pointer capture can already be released by the browser.
    }
  }

  isDrawingPtSignature.value = false
}

const clearPtSignature = (): void => {
  initializePtSignatureCanvas(null)
}

const savePtSignature = async (): Promise<void> => {
  const appointment = selectedPtSignatureRow.value
  const canvas = ptSignatureCanvas.value
  if (!appointment || !canvas) return

  if (!hasPtSignatureDraft.value) {
    ptSignatureError.value = "PT signature is required."
    return
  }

  const ptSignatureDataUrl = canvas.toDataURL("image/png")
  const existingTicket = encounterTicketsByAppointmentId.value[appointment.id]
  const patientSignatureDataUrl =
    String(existingTicket?.patient_signature_data_url ?? patientSignatureFor(appointment) ?? "").trim() || undefined

  try {
    isSavingPtSignature.value = true
    const ticket = await appointmentPhase1Service.processEncounterTicket(appointment.id, {
      patient_signature_data_url: patientSignatureDataUrl,
      patient_signature_signed_by: existingTicket?.patient_acknowledged_by || appointment.patient_name || null,
      pt_signature_data_url: ptSignatureDataUrl,
      pt_confirmed_at: new Date().toISOString(),
      pt_completion_tag: "ATTENDANCE_CONFIRMED",
      notes: existingTicket?.notes ?? null,
    })

    encounterTicketsByAppointmentId.value = {
      ...encounterTicketsByAppointmentId.value,
      [appointment.id]: ticket,
    }
    if (ticket.patient_signature_data_url) {
      patientSignaturesByAppointmentId.value = {
        ...patientSignaturesByAppointmentId.value,
        [appointment.id]: ticket.patient_signature_data_url,
      }
    }
    ptSignaturesByAppointmentId.value = {
      ...ptSignaturesByAppointmentId.value,
      [appointment.id]: ticket.pt_signature_data_url || ptSignatureDataUrl,
    }

    successToast(toast, "PT signature saved")
    ptSignatureDialogVisible.value = false
  } catch (error) {
    const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
    errorToast(toast, message ? String(message) : "Failed to save PT signature")
  } finally {
    isSavingPtSignature.value = false
  }
}

const openDailyLogPrint = (
  signatureException?: DailyLogPrintExceptionApproval,
  targetWindow?: Window | null
): void => {
  if (!items.value.length) {
    errorToast(toast, "No patient logs to export")
    targetWindow?.close()
    return
  }

  warnIfPendingAppointments()

  const missingSignaturesByAppointmentId = new Map(
    (signatureException?.missing_signatures ?? []).map(row => [
      row.appointment_id,
      row.missing_signature_types,
    ])
  )
  const payloadKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const payload: DailyPatientLogPrintPayload = {
    selected_date_label: selectedDateLabel.value,
    clinic_name: selectedClinic.value?.name || "All branches",
    generated_at: new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    summary: { ...summary.value },
    signature_exception: signatureException
      ? {
        reference: signatureException.reference,
        reason_label: signatureException.reason_label,
        explanation: signatureException.explanation,
        approved_by: signatureException.approved_by,
        approved_role: signatureException.approved_role,
        approved_at: new Date(signatureException.approved_at).toLocaleString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }
      : undefined,
    rows: items.value.map((item) => ({
      id: item.id,
      time_range: formatTimeRange(item.starts_at, item.ends_at),
      date_label: formatDate(item.starts_at),
      patient_name: item.patient_name || "Unnamed patient",
      clinic_name: item.clinic_name || "No branch",
      service_label: serviceLabel(item),
      provider_name: String(item.provider_name || "Unassigned PT"),
      visit_status: visitStatusLabel(item),
      patient_signature: patientSignatureFor(item) || undefined,
      pt_signature: ptSignatureFor(item) || undefined,
      missing_signature_types: missingSignaturesByAppointmentId.get(item.id),
      billing_type: billingTypeLabel(item),
      billing_status: String(item.billing_status || "Unbilled"),
      session_label: sessionLabel(item),
      row_key: String(item.daily_log_row_key || `${item.id}-${item.starts_at}`),
      reschedule_basis: rescheduleBasis(item) || undefined,
    })),
  }

  const storageKey = `${DAILY_PATIENT_LOG_PRINT_STORAGE_PREFIX}${payloadKey}`
  const serializedPayload = JSON.stringify(payload)
  try {
    sessionStorage.setItem(storageKey, serializedPayload)
    targetWindow?.sessionStorage.setItem(storageKey, serializedPayload)
  } catch {
    targetWindow?.close()
    errorToast(toast, "Unable to prepare the print view. Try exporting fewer patient logs.")
    return
  }

  const printUrl = router.resolve({
    name: "daily-patient-log-print",
    query: { payload_key: payloadKey },
  }).href
  if (targetWindow) {
    targetWindow.location.href = printUrl
    return
  }

  const printWindow = window.open(printUrl, "_blank")
  if (!printWindow) {
    sessionStorage.removeItem(storageKey)
    errorToast(toast, "Unable to open print view. Allow pop-ups for this site, then try again.")
  }
}

const exportDailyLogPdf = (): void => {
  if (!items.value.length) {
    errorToast(toast, "No patient logs to export")
    return
  }

  if (!missingSignatureRows.value.length) {
    openDailyLogPrint()
    return
  }

  if (!authSession.hasAnyPermission("Appointment::UPDATE")) {
    errorToast(toast, "Completed visits have missing signatures. An authorized staff member must approve a print exception.")
    return
  }

  signatureExceptionReason.value = ""
  signatureExceptionExplanation.value = ""
  signatureExceptionError.value = ""
  signatureExceptionVisible.value = true
}

const approveSignatureExceptionAndPrint = async (): Promise<void> => {
  signatureExceptionError.value = ""
  const explanation = signatureExceptionExplanation.value.trim()
  if (!signatureExceptionReason.value) {
    signatureExceptionError.value = "Select a reason for the missing signatures."
    return
  }
  if (explanation.length < 10) {
    signatureExceptionError.value = "Provide an explanation of at least 10 characters."
    return
  }

  const printWindow = window.open("about:blank", "_blank")
  if (!printWindow) {
    signatureExceptionError.value = "Allow pop-ups for this site, then try again."
    return
  }

  try {
    isApprovingSignatureException.value = true
    const approval = await appointmentPhase1Service.approveDailyLogPrintException({
      appointment_ids: missingSignatureRows.value.map(row => row.item.id),
      selected_date: toDateKey(selectedDate.value),
      clinic_id: selectedClinicId.value || undefined,
      reason_code: signatureExceptionReason.value,
      explanation,
    })
    signatureExceptionVisible.value = false
    openDailyLogPrint(approval, printWindow)
  } catch (error) {
    printWindow.close()
    const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
    signatureExceptionError.value = message
      ? String(message)
      : "Unable to approve the missing-signature exception."
  } finally {
    isApprovingSignatureException.value = false
  }
}

const formatDate = (value: string): string =>
  value
    ? new Date(value).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "No date"

const formatTime = (value: string): string =>
  value
    ? new Date(value).toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    })
    : "--"

const formatTimeRange = (start: string, end: string): string =>
  `${formatTime(start)} - ${formatTime(end)}`

const formatServiceLabel = (value: unknown): string =>
  String(value ?? "Appointment").replace(/^Dr\.?\s+Consultation$/i, "Consultation")

const serviceLabel = (item: AppointmentDailyLogItem): string =>
  formatServiceLabel(item.service_name ?? item.appointment_type ?? item.appointment_phase)

const billingTypeLabel = (item: AppointmentDailyLogItem): string =>
  String(item.billing_type ?? item.payer_type ?? "Self Pay").replace(/_/g, " ")

type SessionQuantityRecord = Record<string, unknown>

const SESSION_CHILD_KEYS = [
  "line_items",
  "lineItems",
  "planned_services",
  "plannedServices",
  "consumed_services",
  "consumedServices",
  "included_services",
  "includedServices",
  "package_services",
  "packageServices",
  "bundle_services",
  "bundleServices",
  "bundle_items",
  "bundleItems",
  "package_items",
  "packageItems",
  "service_items",
  "serviceItems",
  "children",
  "items",
  "services",
  "included",
] as const

const toSessionRecord = (value: unknown): SessionQuantityRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as SessionQuantityRecord
    : null

const parseSessionRecordArray = (value: unknown): SessionQuantityRecord[] => {
  if (Array.isArray(value)) {
    return value.map(toSessionRecord).filter((record): record is SessionQuantityRecord => record !== null)
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return parseSessionRecordArray(JSON.parse(value) as unknown)
    } catch {
      return []
    }
  }

  return []
}

const sessionNumberFromValues = (...values: unknown[]): number => {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed)
  }

  return 0
}

const sessionNumberFromKeys = (record: SessionQuantityRecord | null | undefined, keys: string[]): number =>
  record ? sessionNumberFromValues(...keys.map(key => record[key])) : 0

const normalizedSessionText = (...values: unknown[]): string =>
  values
    .map(value => String(value ?? "").trim().toUpperCase())
    .filter(Boolean)
    .join(" ")

const isBundleSessionRecord = (record: SessionQuantityRecord): boolean => {
  const marker = normalizedSessionText(
    record.type,
    record.line_type,
    record.source_type,
    record.service_category,
    record.bundle_name,
    record.bundleName,
    record.parent_line_type,
    record.parentLineType,
    record.item_name_snapshot,
    record.service_name,
    record.name
  )

  return marker.includes("BUNDLE")
}

const isBundleParentSessionRecord = (record: SessionQuantityRecord): boolean =>
  normalizedSessionText(
    record.type,
    record.line_type,
    record.service_category
  )
    .split(" ")
    .includes("BUNDLE")

const flattenSessionRecords = (values: unknown[]): SessionQuantityRecord[] => {
  const seen = new Set<SessionQuantityRecord>()
  const flattened: SessionQuantityRecord[] = []

  const visit = (value: unknown): void => {
    const records = parseSessionRecordArray(value)
    if (records.length) {
      records.forEach(visit)
      return
    }

    const record = toSessionRecord(value)
    if (!record || seen.has(record)) return

    seen.add(record)
    flattened.push(record)
    SESSION_CHILD_KEYS.forEach(key => visit(record[key]))
  }

  values.forEach(visit)
  return flattened
}

const plannedSessionQuantity = (record: SessionQuantityRecord): number =>
  sessionNumberFromKeys(record, [
    "planned_quantity",
    "plannedQuantity",
    "included_quantity",
    "includedQuantity",
    "selected_quantity",
    "selectedQuantity",
    "total_quantity",
    "totalQuantity",
    "total_qty",
    "totalQty",
    "bundle_qty",
    "bundleQty",
    "bundle_quantity",
    "bundleQuantity",
    "service_quantity",
    "serviceQuantity",
    "sessions",
    "session_count",
    "number_of_sessions",
    "total_sessions",
    "totalSessions",
    "quantity",
    "qty",
  ])

const appointmentSessionQuantity = (record: SessionQuantityRecord): number =>
  sessionNumberFromKeys(record, [
    "appointment_consumed_quantity",
    "appointmentConsumedQuantity",
    "appointmentConsumed",
    "appointment_consumption_count",
    "appointmentConsumptionCount",
  ])

const bundleSessionQuantityLabel = (item: AppointmentDailyLogItem): string => {
  const ticket = encounterTicketsByAppointmentId.value[item.id]
  const plannedServices = plannedServicesByAppointmentId.value[item.id] ?? []
  const snapshot = toSessionRecord(ticket?.billing_snapshot)

  const records = flattenSessionRecords([
    plannedServices,
    snapshot?.line_items,
    snapshot?.lineItems,
    snapshot?.planned_services,
    snapshot?.plannedServices,
    snapshot?.consumed_services,
    snapshot?.consumedServices,
    snapshot,
  ])
  const bundleRecords = records.filter(isBundleSessionRecord)
  if (!bundleRecords.length) return ""

  const bundleParentRecords = records.filter(isBundleParentSessionRecord)
  const quantityRecords = bundleParentRecords.length ? bundleParentRecords : bundleRecords
  const totalQuantity = Math.max(0, ...quantityRecords.map(plannedSessionQuantity))
  if (totalQuantity <= 0) return ""

  const visitQuantity = sessionNumberFromValues(
    ...quantityRecords.map(appointmentSessionQuantity),
    item.appointment_consumed_quantity,
    item.appointment_consumption_count
  )

  return `Session ${visitQuantity} of ${totalQuantity}`
}

const sessionLabel = (item: AppointmentDailyLogItem): string => {
  const bundleLabel = bundleSessionQuantityLabel(item)
  if (bundleLabel) return bundleLabel

  if (item.session_sequence && item.total_sessions) {
    return `Session ${item.session_sequence} of ${item.total_sessions}`
  }
  return String(item.appointment_phase ?? "Single visit").replace(/_/g, " ")
}

const visitStatusLabel = (item: AppointmentDailyLogItem): "Completed" | "Pending" | "Canceled" | "Rescheduled" => {
  if (item.daily_log_status === "RESCHEDULED_ORIGINAL") return "Rescheduled"

  const appointmentStatus = normalizeStatus(item.appointment_status)
  const attendanceStatus = normalizeStatus(item.attendance_status)
  if (
    ["CANCELLED", "CANCELED", "NO SHOW", "NO_SHOW"].includes(appointmentStatus) ||
    ["CANCELLED", "CANCELED", "NO SHOW", "NO_SHOW"].includes(attendanceStatus)
  ) return "Canceled"
  if (
    ["COMPLETED", "ATTENDED", "DONE"].includes(appointmentStatus) ||
    ["COMPLETED", "ATTENDED", "DONE"].includes(attendanceStatus)
  ) return "Completed"

  const hasLegacyRescheduleStatus = !item.daily_log_status && (
    Number(item.reschedule_history_count ?? 0) > 0 ||
    Number(item.reschedule_count ?? 0) > 0 ||
    appointmentStatus.includes("RESCHEDULE")
  )
  if (hasLegacyRescheduleStatus) {
    return "Rescheduled"
  }

  return "Pending"
}

const isRescheduledOriginal = (item: AppointmentDailyLogItem): boolean =>
  item.daily_log_status === "RESCHEDULED_ORIGINAL"

const rescheduleBasis = (item: AppointmentDailyLogItem): string => {
  if (!isRescheduledOriginal(item)) return ""

  const rescheduledTo = formatRescheduledTo(item)
  const reason = String(item.daily_log_reschedule_reason ?? "").trim()
  const basis = rescheduledTo ? `Rescheduled to ${rescheduledTo}` : "Rescheduled from this original appointment schedule"
  return reason ? `${basis} - Reason: ${reason}` : basis
}

const formatRescheduledTo = (item: AppointmentDailyLogItem): string => {
  const startsAt = String(item.daily_log_rescheduled_to ?? "").trim()
  if (!startsAt) return ""

  const startsDate = new Date(startsAt)
  if (Number.isNaN(startsDate.getTime())) return ""

  const dateLabel = startsDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const timeLabel = formatTime(startsAt)

  const endsAt = String(item.daily_log_rescheduled_to_end ?? "").trim()
  if (!endsAt) return `${dateLabel} ${timeLabel}`

  const endsDate = new Date(endsAt)
  if (Number.isNaN(endsDate.getTime())) return `${dateLabel} ${timeLabel}`

  return `${dateLabel} ${timeLabel} - ${formatTime(endsAt)}`
}

const visitStatusSeverity = (item: AppointmentDailyLogItem): "success" | "warn" | "danger" => {
  const status = visitStatusLabel(item)
  if (status === "Completed") return "success"
  if (status === "Canceled") return "danger"
  return "warn"
}

const billingSeverity = (value?: string): "success" | "info" | "warn" | "danger" | "secondary" => {
  const status = normalizeStatus(value)
  if (["PAID", "BILLED", "CLAIMED", "APPROVED"].includes(status)) return "success"
  if (["PARTIAL", "PENDING"].includes(status)) return "warn"
  if (["VOID", "CANCELLED", "CANCELED"].includes(status)) return "danger"
  return "secondary"
}

watch([selectedDateKey, selectedClinicId], () => {
  void loadDailyLog()
})

watch(
  () => route.query.date,
  (value) => {
    const date = dateFromQuery(value)
    if (!date) return
    if (toDateKey(date) === selectedDateKey.value) return
    selectedDate.value = date
  }
)

onMounted(() => {
  void loadDailyLog()
})
</script>
