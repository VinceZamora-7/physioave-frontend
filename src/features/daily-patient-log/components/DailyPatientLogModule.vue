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

        <Column header="PT / Doctor" style="min-width: 230px">
          <template #body="{ data }">
            <div class="font-medium">{{ data.provider_name || "Unassigned PT" }}</div>
            <div class="text-xs opacity-60">{{ data.doctor_name || data.referring_doctor_name || "No doctor listed" }}</div>
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

        <Column header="Appointment Record ID" style="min-width: 190px">
          <template #body="{ data }">
            <div class="font-medium">{{ appointmentRecordId(data) }}</div>
            <div class="text-xs opacity-60">{{ sessionLabel(data) }}</div>
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
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
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
  type AppointmentDailyLogItem,
} from "@/features/appointments/api/appointment-phase1.service"
import { errorToast } from "@/utils/toast.util"

const toast = useToast()
const branchStore = clinicStore()
const { selectedClinicId, selectedClinic } = storeToRefs(branchStore)

const selectedDate = ref(new Date())
const search = ref("")
const items = ref<AppointmentDailyLogItem[]>([])
const patientSignaturesByAppointmentId = ref<Record<number, string>>({})
const ptSignaturesByAppointmentId = ref<Record<number, string>>({})
const signaturePreviewVisible = ref(false)
const selectedSignatureRow = ref<AppointmentDailyLogItem | null>(null)
const selectedSignatureType = ref<"patient" | "pt">("patient")
const isLoading = ref(false)

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
    patientSignaturesByAppointmentId.value = {}
    ptSignaturesByAppointmentId.value = {}
    errorToast(toast, "Failed to load daily patient log")
  } finally {
    isLoading.value = false
  }
}

const loadPatientSignatures = async (logItems: AppointmentDailyLogItem[]): Promise<void> => {
  const entries = await Promise.all(
    logItems.map(async (item): Promise<{ id: number; patientSignature: string; ptSignature: string } | null> => {
      try {
        const ticket = await appointmentPhase1Service.getEncounterTicket(item.id)
        const patientSignature = String(ticket?.patient_signature_data_url ?? "").trim()
        const ptSignature = String(ticket?.pt_signature_data_url ?? "").trim()
        return patientSignature || ptSignature
          ? { id: item.id, patientSignature, ptSignature }
          : null
      } catch {
        return null
      }
    })
  )

  patientSignaturesByAppointmentId.value = Object.fromEntries(
    entries
      .filter((entry): entry is { id: number; patientSignature: string; ptSignature: string } =>
        entry !== null && Boolean(entry.patientSignature)
      )
      .map(entry => [entry.id, entry.patientSignature])
  )
  ptSignaturesByAppointmentId.value = Object.fromEntries(
    entries
      .filter((entry): entry is { id: number; patientSignature: string; ptSignature: string } =>
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
      <body style="font-family: Arial, sans-serif; padding: 24px;">Preparing PDF...</body>
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
          <div class="muted">${escapeHtml(item.patient_public_id || `Patient #${item.patient_id}`)}</div>
        </td>
        <td>
          <strong>${escapeHtml(item.clinic_name || "No branch")}</strong>
          <div class="muted">${escapeHtml(serviceLabel(item))}</div>
        </td>
        <td>
          <strong>${escapeHtml(item.provider_name || "Unassigned PT")}</strong>
          <div class="muted">${escapeHtml(item.doctor_name || item.referring_doctor_name || "No doctor listed")}</div>
        </td>
        <td>
          <strong>${escapeHtml(item.appointment_status || "Unknown")}</strong>
          <div class="muted">${escapeHtml(attendanceLabel(item))}</div>
        </td>
        <td>
          <strong>${escapeHtml(billingTypeLabel(item))}</strong>
          <div class="muted">${escapeHtml(item.billing_status || "Unbilled")}</div>
        </td>
        <td class="signature-cell">${patientSignatureHtml}</td>
        <td class="signature-cell">${ptSignatureHtml}</td>
        <td>
          <strong>${escapeHtml(appointmentRecordId(item))}</strong>
          <div class="muted">${escapeHtml(sessionLabel(item))}</div>
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
          @page { size: landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          :root {
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
            font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
              font-size: 7px !important;
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
              font-size: 8px !important;
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
                        <th>PT / Doctor</th>
                        <th>Visit Status</th>
                        <th>Billing</th>
                        <th>Patient Signature</th>
                        <th>PT Signature</th>
                        <th>Appointment Record ID</th>
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

const sessionLabel = (item: AppointmentDailyLogItem): string => {
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

onMounted(() => {
  void loadDailyLog()
})
</script>
