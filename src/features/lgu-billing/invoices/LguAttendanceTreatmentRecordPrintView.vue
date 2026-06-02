<template>
  <main class="min-h-screen bg-white text-black">
    <section class="mx-auto max-w-[1180px] px-6 py-6 space-y-4 print:px-0 print:py-0">
      <header class="space-y-2 border-b border-black pb-3">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold tracking-tight">PHYSIOAVE</h1>
            <p class="text-xs uppercase tracking-[0.22em]">Attendance &amp; Treatment Record</p>
          </div>
          <div class="flex gap-2 print:hidden">
            <Button label="Print" icon="pi pi-print" @click="printPage" />
            <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="router.back()" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
          <div>
            <div class="font-semibold">Patient</div>
            <div>{{ patientName }}</div>
          </div>
          <div>
            <div class="font-semibold">Patient ID</div>
            <div>{{ patientIdLabel }}</div>
          </div>
          <div>
            <div class="font-semibold">LGU Program</div>
            <div>{{ lguProgramLabel }}</div>
          </div>
        </div>
      </header>

      <section v-if="error" class="border border-black p-3 text-sm">
        {{ error }}
      </section>

      <template v-else>
        <section class="grid grid-cols-1 gap-3 md:grid-cols-4 text-sm">
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Attended Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ attendedCount }}</div>
          </article>
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Completed Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ completedCount }}</div>
          </article>
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Dropped Out Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ droppedOutCount }}</div>
          </article>
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Billing Records</div>
            <div class="mt-1 text-lg font-bold">{{ billingCount }}</div>
          </article>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-[0.18em]">Attendance Log</h2>
          <div class="overflow-x-auto border border-black">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-black">
                  <th class="border-r border-black p-2 text-left w-[90px]">Session</th>
                  <th class="border-r border-black p-2 text-left w-[170px]">Date</th>
                  <th class="border-r border-black p-2 text-left">Package</th>
                  <th class="border-r border-black p-2 text-left">Services</th>
                  <th class="p-2 text-left w-[150px]">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(appointment, index) in appointments" :key="appointment.appointment_id" class="border-b border-black">
                  <td class="border-r border-black p-2">{{ index + 1 }}</td>
                  <td class="border-r border-black p-2">{{ formatDateTime(appointment.appointment_date) }}</td>
                  <td class="border-r border-black p-2">{{ appointment.package_name || '-' }}</td>
                  <td class="border-r border-black p-2">{{ appointment.availed_services?.length ? appointment.availed_services.join(', ') : '-' }}</td>
                  <td class="p-2">{{ formatStatus(appointment.status) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-[0.18em]">Treatment / Billing Record</h2>
          <div class="overflow-x-auto border border-black">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-black">
                  <th class="border-r border-black p-2 text-left w-[160px]">Reference</th>
                  <th class="border-r border-black p-2 text-left">Package / Service</th>
                  <th class="border-r border-black p-2 text-left w-[170px]">Program Status</th>
                  <th class="border-r border-black p-2 text-right w-[140px]">Amount</th>
                  <th class="p-2 text-left w-[160px]">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="billing in billings" :key="billing.id" class="border-b border-black">
                  <td class="border-r border-black p-2">{{ billing.public_id || `BILL-${billing.id}` }}</td>
                  <td class="border-r border-black p-2">{{ billing.package_name || billing.service_name || '-' }}</td>
                  <td class="border-r border-black p-2">{{ billing.billing_status }}</td>
                  <td class="border-r border-black p-2 text-right">{{ asCurrency(billing.amount_due) }}</td>
                  <td class="p-2">{{ formatDateTime(billing.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import type { PatientHMOInformation } from "@/models/hmo-information"


const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const printPage = (): void => window.print()

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

