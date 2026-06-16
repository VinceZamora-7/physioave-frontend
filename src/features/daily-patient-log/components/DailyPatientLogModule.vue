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

        <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
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
            <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Cancelled</p>
            <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ summary.cancelled }}</p>
          </article>
        </div>
      </div>
    </section>

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
            :disabled="!items.length || isLoading"
            @click="exportDailyLogPdf"
          />
        </div>
      </div>

      <DataTable
        class="app-data-table"
        :value="items"
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
            <div class="flex flex-wrap gap-2">
              <Tag :value="data.appointment_status || 'Unknown'" :severity="statusSeverity(data.appointment_status)" />
              <Tag :value="attendanceLabel(data)" :severity="attendanceSeverity(data)" />
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
            · {{ selectedPtSignatureRow.provider_name || "Unassigned PT" }}
            · {{ appointmentRecordId(selectedPtSignatureRow) }}
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
import { useRoute } from "vue-router"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Tag from "primevue/tag"
import { useToast } from "primevue/usetoast"
import { clinicStore } from "@/stores/clinic.store"
import {
  appointmentPhase1Service,
  type AppointmentEncounterTicket,
  type AppointmentDailyLogItem,
  type AppointmentPlannedService,
} from "@/features/appointments/api/appointment-phase1.service"
import type { Patient } from "@/features/patients/types/patient"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast } from "@/utils/toast.util"

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
const branchStore = clinicStore()
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
const evaluationVisitLogShortcutVisible = ref(false)
const selectedEvaluationVisitLogPatient = ref<Patient>()
const selectedEvaluationLogAppointmentId = ref<number>()
const evaluationVisitLogSection = ref<EvaluationVisitLogSectionExpose | null>(null)
const isOpeningEvaluationVisitLog = ref(false)
const evaluationVisitLogOptionsLoaded = ref(false)
const medicalCategoryOptions = ref<string[]>([])
const medicalDiagnosisOptions = ref<string[]>([])
const ptCaseImpressionOptions = ref<string[]>([])
const SYSTEM_PRINT_FONT_STACK = '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

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

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const summary = computed(() => {
  const total = items.value.length
  const completed = items.value.filter((item) =>
    ["COMPLETED", "ATTENDED", "DONE"].includes(normalizeStatus(item.appointment_status)) ||
    normalizeStatus(item.attendance_status) === "COMPLETED"
  ).length
  const cancelled = items.value.filter((item) =>
    ["CANCELLED", "CANCELED"].includes(normalizeStatus(item.appointment_status))
  ).length

  return {
    total,
    completed,
    cancelled,
    pending: Math.max(0, total - completed - cancelled),
  }
})

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

const openPdfWindow = (title: string): Window => {
  const printWindow = window.open("", "_blank")
  if (!printWindow || printWindow.closed) {
    throw new Error("Unable to open PDF window. Allow pop-ups for this site, then try again.")
  }

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family: ${SYSTEM_PRINT_FONT_STACK}; padding: 24px;">Preparing PDF...</body>
    </html>
  `)
  printWindow.document.close()

  return printWindow
}

const exportDailyLogPdf = (): void => {
  if (!items.value.length) {
    errorToast(toast, "No patient logs to export")
    return
  }

  let printWindow: Window
  try {
    printWindow = openPdfWindow("Daily Patient Log")
  } catch (error) {
    errorToast(toast, error instanceof Error ? error.message : "Unable to open PDF window")
    return
  }

  const generatedAt = new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const rows = items.value.map((item, index) => {
    const patientSignature = patientSignatureFor(item)
    const ptSignature = ptSignatureFor(item)
    const patientSignatureHtml = patientSignature
      ? `<img class="signature" src="${escapeHtml(patientSignature)}" alt="Patient signature" />`
      : `<span class="muted">No signature</span>`
    const ptSignatureHtml = ptSignature
      ? `<img class="signature" src="${escapeHtml(ptSignature)}" alt="PT signature" />`
      : `<span class="muted">No signature</span>`

    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(formatTimeRange(item.starts_at, item.ends_at))}</strong>
          <div class="muted">${escapeHtml(formatDate(item.starts_at))}</div>
        </td>
        <td>
          <strong>${escapeHtml(item.patient_name || "Unnamed patient")}</strong>
        </td>
        <td>
          <strong>${escapeHtml(item.clinic_name || "No branch")}</strong>
          <div class="muted">${escapeHtml(serviceLabel(item))}</div>
        </td>
        <td>
          <strong>${escapeHtml(item.provider_name || "Unassigned PT")}</strong>
        </td>
        <td>
          <strong>${escapeHtml(item.appointment_status || "Unknown")}</strong>
        </td>
        <td class="signature-cell">${patientSignatureHtml}</td>
        <td class="signature-cell">${ptSignatureHtml}</td>
        <td>
          <strong>${escapeHtml(billingTypeLabel(item))}</strong>
          <div class="muted">${escapeHtml(item.billing_status || "Unbilled")}</div>
        </td>
        <td>
          ${escapeHtml(sessionLabel(item))}
        </td>
      </tr>
    `
  }).join("")

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Daily Patient Log</title>
        <meta charset="utf-8" />
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap");

          @page { size: landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          :root {
            --system-font-family: ${SYSTEM_PRINT_FONT_STACK};
            --lgu-accent: #d31d6e;
            --lgu-accent-soft: #f3a8c8;
            --lgu-border: #e5e7eb;
            --lgu-text: #000000;
            --lgu-muted: #374151;
            --lgu-card: #ffffff;
            --lgu-soft-bg: #f8fafc;
          }
          body {
            margin: 0;
            color: var(--lgu-text);
            background: #f5f5f5;
            font-family: var(--system-font-family);
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          button {
            font: inherit;
          }
          .lgu-invoice-page {
            min-height: 100vh;
            background: #f5f5f5;
            color: var(--lgu-text);
          }
          .lgu-invoice-container {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding: 16px;
          }
          .lgu-invoice-sheet {
            width: 100%;
            max-width: 297mm;
            min-height: 190mm;
            margin: 0 auto;
            padding: 12px 16px 10px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #ffffff;
            color: #000000;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .lgu-invoice-top {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 8px;
          }
          .lgu-invoice-heading {
            width: 100%;
            min-width: 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }
          .lgu-invoice-logo {
            display: block;
            height: 90px;
            width: auto;
            flex-shrink: 0;
            object-fit: contain;
          }
          .lgu-invoice-meta-grid {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 2px 8px;
            min-width: min(320px, 100%);
            max-width: 420px;
            font-size: 12px;
            line-height: 1.25;
            font-weight: 600;
          }
          .lgu-invoice-meta-grid strong {
            white-space: nowrap;
            font-weight: 800;
            letter-spacing: 0.06em;
          }
          .lgu-invoice-meta-grid span {
            min-width: 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .lgu-invoice-title-block {
            width: 100%;
            text-align: center;
          }
          .lgu-invoice-title {
            width: 100%;
            margin: 2px 0 0;
            text-align: center;
            font-size: 24px;
            line-height: 1.1;
            letter-spacing: 0.05em;
            font-weight: 800;
            color: #111827;
          }
          .lgu-invoice-title span {
            text-decoration: underline;
            text-decoration-thickness: 1.5px;
            text-underline-offset: 3px;
          }
          .lgu-invoice-toolbar {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin: 8px 0 10px;
          }
          .print-action {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
          .print-action button {
            min-width: 80px;
            border: 1px solid var(--lgu-accent);
            border-radius: 6px;
            background: var(--lgu-accent);
            color: white;
            padding: 8px 12px;
            font-weight: 700;
            cursor: pointer;
          }
          .lgu-invoice-details {
            margin: 15px 0;
            width: 100%;
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            width: 100%;
            padding: 8px;
            border: 1px solid var(--lgu-accent);
            background: var(--lgu-card);
            font-size: 11px;
            line-height: 1.35;
          }
          .details-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
          }
          .line {
            display: grid;
            grid-template-columns: minmax(95px, 32%) minmax(0, 1fr);
            gap: 6px;
            min-width: 0;
          }
          .label {
            font-weight: 800;
            color: var(--lgu-text);
          }
          .value {
            min-width: 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .lgu-invoice-body {
            width: 100%;
            margin-top: 10px;
          }
          .table-wrap {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
          }
          .summary-table {
            width: 100%;
            min-width: 980px;
            table-layout: fixed;
            border-collapse: collapse;
            margin-top: 6px;
            background: var(--lgu-card);
            font-size: 9px;
            color: var(--lgu-text);
          }
          th, td {
            padding: 4px 5px;
            vertical-align: top;
            border: 1px solid var(--lgu-border);
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          th {
            text-align: center;
            font-weight: 800;
            font-size: 8px;
            line-height: 1.12;
            background: var(--lgu-card);
            border-top: 3px solid var(--lgu-accent);
            border-bottom: 3px solid var(--lgu-accent);
          }
          tr { break-inside: avoid; }
          .muted {
            margin-top: 2px;
            color: var(--lgu-muted);
            font-size: 9px;
          }
          .signature-cell {
            text-align: center;
            vertical-align: middle;
          }
          .signature {
            display: block;
            width: 108px;
            height: 44px;
            object-fit: contain;
            margin: 0 auto;
            border: 1px solid var(--lgu-border);
            border-radius: 4px;
            background: white;
          }
          .lgu-invoice-footer {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid var(--lgu-border);
            font-size: 10px;
            color: var(--lgu-muted);
          }
          .footer-link {
            color: inherit;
            text-decoration: none;
          }
          @media print {
            html,
            body {
              width: auto !important;
              min-width: 0 !important;
              max-width: none !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }
            .print-action,
            .lgu-invoice-toolbar {
              display: none !important;
            }
            .lgu-invoice-page {
              width: auto !important;
              min-width: 0 !important;
              max-width: none !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }
            .lgu-invoice-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .lgu-invoice-sheet {
              width: 100% !important;
              min-width: 0 !important;
              max-width: none !important;
              min-height: 0 !important;
              height: auto !important;
              margin: 0 auto !important;
              padding: 5mm !important;
              overflow: visible !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
            .table-wrap {
              width: 100% !important;
              max-width: 100% !important;
              overflow: visible !important;
            }
            .summary-table {
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              table-layout: fixed !important;
              font-size: 10px !important;
            }
            .summary-table th,
            .summary-table td {
              padding: 2px 3px !important;
              font-size: inherit !important;
              line-height: 1.12 !important;
              white-space: normal !important;
              word-break: break-word !important;
              overflow-wrap: anywhere !important;
            }
            .details-grid {
              width: 100% !important;
              padding: 5px !important;
              gap: 8px !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              background: #ffffff !important;
              border: 1px solid var(--lgu-accent) !important;
            }
            .signature {
              width: 86px !important;
              height: 34px !important;
            }
          }
        </style>
      </head>
      <body>
        <main class="lgu-invoice-page">
          <section class="lgu-invoice-container">
            <article class="lgu-invoice-sheet" role="article">
              <header class="lgu-invoice-top">
                <div class="lgu-invoice-heading">
                  <img class="lgu-invoice-logo" src="/physioave-logo-dark-updated.png" alt="PhysioAve Logo" />
                  <div class="lgu-invoice-meta-grid">
                    <strong>Date:</strong><span>${escapeHtml(selectedDateLabel.value)}</span>
                    <strong>Branch:</strong><span>${escapeHtml(selectedClinic.value?.name || "All branches")}</span>
                    <strong>Generated:</strong><span>${escapeHtml(generatedAt)}</span>
                  </div>
                </div>
                <div class="lgu-invoice-title-block">
                  <h1 class="lgu-invoice-title"><span>Daily Patient Log</span></h1>
                </div>
              </header>

              <div class="lgu-invoice-toolbar">
                <div class="print-action">
                  <button onclick="window.print()">Print / Save PDF</button>
                </div>
              </div>

              <div class="lgu-invoice-details">
                <div class="details-grid">
                  <div class="details-group">
                    <div class="line"><span class="label">Total Logs:</span><span class="value">${summary.value.total}</span></div>
                    <div class="line"><span class="label">Completed:</span><span class="value">${summary.value.completed}</span></div>
                  </div>
                  <div class="details-group">
                    <div class="line"><span class="label">Pending:</span><span class="value">${summary.value.pending}</span></div>
                    <div class="line"><span class="label">Cancelled:</span><span class="value">${summary.value.cancelled}</span></div>
                  </div>
                </div>
              </div>

              <div class="lgu-invoice-body">
                <div class="table-wrap">
                  <table class="summary-table">
                    <thead>
                      <tr>
                        <th style="width: 32px;">No.</th>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>Branch / Service</th>
                        <th>Physical Therapyst</th>
                        <th>Visit Status</th>
                        <th>Patient Signature</th>
                        <th>PT Signature</th>
                        <th>Billing</th>
                        <th>Session Sequence</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              </div>

              <footer class="lgu-invoice-footer" role="contentinfo">
                <a href="https://www.physioave.com" class="footer-link">www.physioave.com</a>
                <a href="tel:+639655712455" class="footer-link">+63-965-571-2455</a>
                <a href="mailto:admin@physioave.com" class="footer-link">admin@physioave.com</a>
              </footer>
            </article>
          </section>
        </main>
        <script>
          window.addEventListener("load", () => {
            window.setTimeout(() => window.print(), 250)
          })
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
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

const serviceLabel = (item: AppointmentDailyLogItem): string =>
  String(item.service_name ?? item.appointment_type ?? item.appointment_phase ?? "Appointment")

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

const attendanceLabel = (item: AppointmentDailyLogItem): string => {
  const status = normalizeStatus(item.attendance_status)
  if (status === "COMPLETED") return "Attendance Done"
  if (status === "CANCELED" || status === "CANCELLED") return "Attendance Cancelled"
  return "Attendance Pending"
}

const statusSeverity = (value?: string): "success" | "info" | "warn" | "danger" | "secondary" => {
  const status = normalizeStatus(value)
  if (["COMPLETED", "ATTENDED", "DONE"].includes(status)) return "success"
  if (["CANCELLED", "CANCELED", "NO SHOW", "NO_SHOW"].includes(status)) return "danger"
  if (["RESCHEDULED"].includes(status)) return "warn"
  return "info"
}

const attendanceSeverity = (item: AppointmentDailyLogItem): "success" | "warn" | "danger" | "secondary" => {
  const status = normalizeStatus(item.attendance_status)
  if (status === "COMPLETED") return "success"
  if (status === "CANCELED" || status === "CANCELLED") return "danger"
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
