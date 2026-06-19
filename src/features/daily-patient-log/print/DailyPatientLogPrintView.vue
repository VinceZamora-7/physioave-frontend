<template>
  <SponsorInvoiceLayout title="Daily Patient Log" :has-error="!!error">
    <template #meta>
      <strong>Date:</strong><span>{{ payload?.selected_date_label || "--" }}</span>
      <strong>Branch:</strong><span>{{ payload?.clinic_name || "All branches" }}</span>
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
          <div class="line"><span class="label">Pending:</span><span class="value">{{ payload.summary.pending }}</span></div>
          <div class="line"><span class="label">Canceled:</span><span class="value">{{ payload.summary.cancelled }}</span></div>
        </div>
      </div>
    </template>

    <div v-if="payload?.signature_exception" class="signature-exception">
      <strong>Missing Signature Exception</strong>
      <span>{{ payload.signature_exception.reason_label }} — {{ payload.signature_exception.explanation }}</span>
      <span>
        Approved by {{ payload.signature_exception.approved_by }}
        ({{ payload.signature_exception.approved_role || "Authorized staff" }})
        on {{ payload.signature_exception.approved_at }}
      </span>
      <span>Audit reference: {{ payload.signature_exception.reference }}</span>
    </div>

    <div v-if="payload" class="table-wrap">
      <table class="summary-table daily-log-table">
        <thead style="text-transform: uppercase;">
          <tr>
            <th class="number-column">No.</th>
            <th>Time</th>
            <th>Patient</th>
            <th>Branch / Service</th>
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
          <tr v-for="(row, index) in payload.rows" :key="row.id">
            <td class="text-center">{{ index + 1 }}</td>
            <td>
              <strong>{{ row.time_range }}</strong>
              <span>{{ row.date_label }}</span>
            </td>
            <td><strong>{{ row.patient_name }}</strong></td>
            <td>
              <strong>{{ row.clinic_name }}</strong>
              <span>{{ row.service_label }}</span>
            </td>
            <td><strong>{{ row.provider_name }}</strong></td>
            <td><strong>{{ formatVisitStatus(row.visit_status) }}</strong></td>
            <td class="signature-cell">
              <img v-if="row.patient_signature" class="signature" :src="row.patient_signature" alt="Patient signature" />
              <span v-else>{{ signatureFallback(row, "patient") }}</span>
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

const formatVisitStatus = (status: string): string => {
  const normalizedStatus = status.trim().toUpperCase()

  if (normalizedStatus.includes("RESCHEDULE")) return "Reschedule"
  if (["CANCELLED", "CANCELED", "NO SHOW", "NO_SHOW"].includes(normalizedStatus)) return "Cancelled"
  if (["COMPLETED", "ATTENDED", "DONE"].includes(normalizedStatus)) return "Completed"

  return status
}

const signatureFallback = (
  row: DailyPatientLogPrintRow,
  signatureType: "patient" | "pt"
): string => {
  if (row.missing_signature_types?.includes(signatureType)) {
    return "Unavailable — exception documented"
  }
  return formatVisitStatus(row.visit_status) === "Completed" ? "No signature" : "Not required"
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
  width: 32px;
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

  .signature {
    width: 86px !important;
    height: 34px !important;
  }
}
</style>
