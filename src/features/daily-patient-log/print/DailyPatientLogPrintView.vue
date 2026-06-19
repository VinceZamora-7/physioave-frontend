<template>
  <SponsorInvoiceLayout
    title="Daily Patient Log"
    :subtitle="`Treatment and signature log for ${payload?.selected_date_label || '--'}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Date:</strong><span>{{ payload?.selected_date_label || "--" }}</span>
      <strong>Branch:</strong><span>{{ formatPrintableName(payload?.clinic_name, "All branches") }}</span>
      <strong>Generated:</strong><span>{{ payload?.generated_at || "--" }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage('landscape')" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-if="payload" #details>
      <div class="details-grid daily-log-summary">
        <div class="details-group">
          <div class="line"><span class="label">Total Logs:</span><span class="value">{{ payload.summary.total }}</span></div>
          <div class="line"><span class="label">Completed:</span><span class="value">{{ payload.summary.completed }}</span></div>
          <div class="line"><span class="label">Rescheduled:</span><span class="value">{{ payload.summary.rescheduled }}</span></div>
        </div>
        <div class="details-group">
          <div class="line"><span class="label">Canceled:</span><span class="value">{{ payload.summary.cancelled }}</span></div>
        </div>
      </div>
    </template>

    <div v-if="payload?.signature_exception" class="signature-exception">
      <strong>Missing Signature Exception</strong>
      <span>{{ payload.signature_exception.reason_label }} - {{ payload.signature_exception.explanation }}</span>
      <span>
        Approved by {{ formatPrintableName(payload.signature_exception.approved_by, "Authorized staff") }}
        on {{ payload.signature_exception.approved_at }}
      </span>
    </div>

    <div v-if="payload" class="table-wrap">
      <table class="summary-table daily-log-table">
        <thead style="text-transform: uppercase;">
          <tr>
            <th class="number-column">No.</th>
            <th>Time</th>
            <th>Patient</th>
            <th>Service</th>
            <th>Physical Therapist</th>
            <th>Visit Status</th>
            <th>Patient Signature</th>
            <th>PT Signature</th>
            <th>Billing</th>
            <th>Session Sequence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!payload.rows.length">
            <td colspan="10" class="empty-row">No patient logs found for this date.</td>
          </tr>
          <tr v-for="(row, index) in payload.rows" :key="row.row_key">
            <td class="text-center number-column">{{ index + 1 }}</td>
            <td>
              <strong>{{ row.time_range }}</strong>
              <span>{{ row.date_label }}</span>
            </td>
            <td><strong>{{ formatPrintableName(row.patient_name, "Unnamed patient") }}</strong></td>
            <td>
              <strong>{{ formatServiceLabel(row.service_label) }}</strong>
            </td>
            <td><strong>{{ formatPrintableName(row.provider_name, "Unassigned PT") }}</strong></td>
            <td>
              <strong>{{ formatVisitStatus(row.visit_status) }}</strong>
              <span v-if="row.reschedule_basis" class="reschedule-basis">{{ row.reschedule_basis }}</span>
            </td>
            <td class="signature-cell">
              <img v-if="row.patient_signature" class="signature" :src="row.patient_signature" alt="Patient signature" />
              <div v-else class="signature-missing">
                <strong>{{ signatureFallback(row, "patient") }}</strong>
                <span v-if="signatureMissingReason(row, 'patient')">
                  Reason: {{ signatureMissingReason(row, "patient") }}
                </span>
              </div>
            </td>
            <td class="signature-cell">
              <img v-if="row.pt_signature" class="signature" :src="row.pt_signature" alt="PT signature" />
              <span v-else>{{ signatureFallback(row, "pt") }}</span>
            </td>
            <td>
              <strong>{{ row.billing_type }}</strong>
              <span>{{ row.billing_status }}</span>
            </td>
            <td>{{ row.session_label }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </SponsorInvoiceLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import SponsorInvoiceLayout from "@/features/shared/invoices/SponsorInvoiceLayout.vue"
import { useSponsorInvoicePrintActions } from "@/features/shared/invoices/sponsor-invoice.shared"
import {
  DAILY_PATIENT_LOG_PRINT_STORAGE_PREFIX,
  type DailyPatientLogPrintRow,
  type DailyPatientLogPrintPayload
} from "./daily-patient-log-print"

const route = useRoute()
const { printPage, goBack } = useSponsorInvoicePrintActions()
const payload = ref<DailyPatientLogPrintPayload>()
const error = ref("")

const formatPrintableName = (value?: string | null, fallback = "N/A"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const formatServiceLabel = (value?: string | null): string =>
  String(value || "Appointment").replace(/^Dr\.?\s+Consultation$/i, "Consultation")

const formatVisitStatus = (status: string): string => {
  const normalizedStatus = status.trim().toUpperCase()

  if (normalizedStatus.includes("RESCHEDULE")) return "Rescheduled"
  if (["CANCELLED", "CANCELED", "NO SHOW", "NO_SHOW"].includes(normalizedStatus)) return "Cancelled"
  if (["COMPLETED", "ATTENDED", "DONE"].includes(normalizedStatus)) return "Completed"

  return status
}

const signatureFallback = (
  row: DailyPatientLogPrintRow,
  signatureType: "patient" | "pt"
): string => {
  if (row.missing_signature_types?.includes(signatureType)) {
    return "Unavailable - exception documented"
  }
  return formatVisitStatus(row.visit_status) === "Completed" ? "No signature" : "Not required"
}

const signatureMissingReason = (
  row: DailyPatientLogPrintRow,
  signatureType: "patient" | "pt"
): string => {
  if (!row.missing_signature_types?.includes(signatureType)) return ""

  const exception = payload.value?.signature_exception
  if (!exception) return ""

  const reason = exception.reason_label.trim()
  const explanation = exception.explanation.trim()
  return [reason, explanation].filter(Boolean).join(": ")
}

onMounted(() => {
  const payloadKey = String(route.query.payload_key ?? "").trim()
  if (!payloadKey) {
    error.value = "Daily patient log print data is missing. Return to the log and export it again."
    return
  }

  const storageKey = `${DAILY_PATIENT_LOG_PRINT_STORAGE_PREFIX}${payloadKey}`
  const rawPayload = sessionStorage.getItem(storageKey)
  sessionStorage.removeItem(storageKey)

  if (!rawPayload) {
    error.value = "Daily patient log print data has expired. Return to the log and export it again."
    return
  }

  try {
    payload.value = JSON.parse(rawPayload) as DailyPatientLogPrintPayload
  } catch {
    error.value = "Daily patient log print data could not be read."
  }
})
</script>

<style scoped>
.daily-log-summary {
  margin: 0;
}

.daily-log-table {
  min-width: 980px;
  font-size: 9px;
}

.daily-log-table th,
.daily-log-table td {
  padding: 4px 5px;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.daily-log-table td span {
  display: block;
  margin-top: 2px;
  color: #374151;
  font-size: 8px;
}

.number-column {
  width: 24px !important;
  min-width: 24px !important;
  max-width: 24px !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
  white-space: nowrap;
}

.signature-exception {
  display: grid;
  gap: 3px;
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid #d97706;
  border-radius: 4px;
  background: #fffbeb;
  color: #78350f;
  font-size: 9px;
}

.signature-exception span {
  display: block;
}

.signature-cell {
  text-align: center;
  vertical-align: middle !important;
}

.reschedule-basis-tag {
  display: inline-block !important;
  width: fit-content;
  margin-top: 3px;
  padding: 1px 4px;
  border: 1px solid #2563eb;
  border-radius: 999px;
  color: #1d4ed8 !important;
  font-size: 7px !important;
  font-weight: 700;
  text-transform: uppercase;
}

.reschedule-basis {
  color: #374151;
  font-size: 7px !important;
  line-height: 1.2;
}

.signature-missing {
  display: grid;
  gap: 2px;
  color: #374151;
  font-size: 8px;
  line-height: 1.2;
}

.signature-missing strong {
  color: #111827;
  font-size: 8px;
}

.signature-missing span {
  margin-top: 0;
}

.signature {
  display: block;
  width: 108px;
  height: 44px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #ffffff;
  object-fit: contain;
}

@media print {
  .daily-log-table {
    min-width: 0 !important;
    font-size: 7px !important;
  }

  .daily-log-table th,
  .daily-log-table td {
    padding: 2px 3px !important;
    line-height: 1.12 !important;
  }

  .daily-log-table td span {
    font-size: 6.5px !important;
  }

  .number-column {
    width: 18px !important;
    min-width: 18px !important;
    max-width: 18px !important;
    padding-left: 1px !important;
    padding-right: 1px !important;
  }

  .signature {
    width: 86px !important;
    height: 34px !important;
  }
}
</style>
