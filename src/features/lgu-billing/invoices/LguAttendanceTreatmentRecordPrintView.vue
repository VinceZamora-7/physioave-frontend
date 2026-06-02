<template>
  <LguInvoiceLayout
    title="ATTENDANCE & TREATMENT RECORD"
    :subtitle="`Attendance record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Patient:</strong><span>{{ patientName }}</span>
      <strong>Patient ID:</strong><span>{{ patientIdLabel }}</span>
      <strong>LGU Program:</strong><span>{{ lguProgramLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
        {{ error }}
    </template>

    <template v-if="!error">
        <section class="attendance-summary-grid">
          <article class="attendance-summary-card">
            <div class="font-semibold uppercase tracking-wide text-xs">Attended Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ attendedCount }}</div>
          </article>
          <article class="attendance-summary-card">
            <div class="font-semibold uppercase tracking-wide text-xs">Completed Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ completedCount }}</div>
          </article>
          <article class="attendance-summary-card">
            <div class="font-semibold uppercase tracking-wide text-xs">Dropped Out Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ droppedOutCount }}</div>
          </article>
          <article class="attendance-summary-card">
            <div class="font-semibold uppercase tracking-wide text-xs">Billing Records</div>
            <div class="mt-1 text-lg font-bold">{{ billingCount }}</div>
          </article>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-[0.18em]">Attendance Log</h2>
          <div class="table-wrap">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th class="w-[70px]">Session</th>
                  <th class="w-[120px]">Date</th>
                  <th>Package</th>
                  <th>Services</th>
                  <th class="w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(appointment, index) in appointments" :key="appointment.appointment_id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ formatDateTime(appointment.appointment_date) }}</td>
                  <td>{{ appointment.package_name || '-' }}</td>
                  <td>{{ appointment.availed_services?.length ? appointment.availed_services.join(', ') : '-' }}</td>
                  <td>{{ formatStatus(appointment.status) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-[0.18em]">Treatment / Billing Record</h2>
          <div class="table-wrap">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th class="w-[120px]">Reference</th>
                  <th>Package / Service</th>
                  <th class="w-[120px]">Program Status</th>
                  <th class="w-[90px] text-right">Amount</th>
                  <th class="w-[110px]">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="billing in billings" :key="billing.id">
                  <td>{{ billing.public_id || `BILL-${billing.id}` }}</td>
                  <td>{{ billing.package_name || billing.service_name || '-' }}</td>
                  <td>{{ billing.billing_status }}</td>
                  <td class="text-right">{{ asCurrency(billing.amount_due) }}</td>
                  <td>{{ formatDateTime(billing.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
    </template>
  </LguInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import type { PatientHMOInformation } from "@/models/hmo-information"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import { useLguInvoicePrintActions } from "./lgu-invoice.shared"


const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useLguInvoicePrintActions()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const error = ref("")

const patientId = computed(() => {
  const raw = String(route.query.patient_id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const patientName = computed(() => detail.value?.patient_name || "Patient")
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")
const lguSponsor = computed(() => sponsorInfo.value)
const lguProgramLabel = computed(() => lguSponsor.value?.lgu_program_name || lguSponsor.value?.company_name || "LGU")
const appointments = computed(() => detail.value?.appointments ?? [])
const billings = computed(() => detail.value?.billings ?? [])
const attendedCount = computed(() => appointments.value.length)
const completedCount = computed(() => appointments.value.filter(appointment => appointment.status === "COMPLETED").length)
const droppedOutCount = computed(() =>
  appointments.value.filter(appointment =>
    appointment.status === "DROPPED_OUT" || appointment.status === "CROSS_MONTH_DROPPED_OUT"
  ).length
)
const billingCount = computed(() => billings.value.length)

const asCurrency = (value?: number | string | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-PH")
}

const formatStatus = (value?: string | null): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "COMPLETED") return "Completed"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  if (normalized === "PENDING") return "Pending"
  return value || "N/A"
}

const load = async (): Promise<void> => {
  error.value = ""
  detail.value = null
  sponsorInfo.value = null

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const [detailResult, sponsorResult] = await Promise.all([
      lguBillingService.getPatientCreditDetail(patientId.value),
      patientTanstackService.fetchContext(queryClient, patientId.value)
    ])
    detail.value = detailResult ?? null
    sponsorInfo.value = (sponsorResult?.sponsor_information ?? []).find(item => item.sponsor_context === "LGU") ?? null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load patient LGU profile."
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => printPage(), 50)
    }
  })
})
</script>

<style scoped>
.attendance-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.attendance-summary-card {
  border: 1px solid #111827;
  border-radius: 6px;
  padding: 8px;
  background: #ffffff;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 10px;
}

.attendance-table th,
.attendance-table td {
  border: 1px solid #111827;
  padding: 4px 5px;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.attendance-table th {
  font-weight: 800;
  background: #f3f4f6;
}

@media print {
  .attendance-summary-grid {
    gap: 5px;
    margin-bottom: 6px;
  }

  .attendance-summary-card {
    padding: 5px;
    border-radius: 3px;
  }

  .attendance-table {
    font-size: 8px;
  }

  .attendance-table th,
  .attendance-table td {
    padding: 2px;
  }
}
</style>
