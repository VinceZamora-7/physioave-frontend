<template>
  <Dialog v-model:visible="visibleModel" modal :header="selectedPatientDetail ? `${formatPatientName(selectedPatientDetail.patient_name)} - LGU Credit Detail` : 'LGU Credit Detail'" style="width: min(94vw, 980px)" :pt="{ content: { class: 'space-y-4' } }">
    <Message v-if="loadingPatientDetail" severity="secondary" :closable="false" size="small">Loading patient LGU credit details...</Message>
    <Message v-else-if="patientDetailError" severity="warn" :closable="false" size="small">{{ patientDetailError }}</Message>

    <template v-else-if="selectedPatientDetail">
      <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <Tag :value="formatLguStatus(selectedPatientStatus)" :severity="lguStatusSeverity(selectedPatientStatus)" />
              <span class="text-xs text-[rgb(var(--app-fg))]/60">Patient ID: {{ selectedPatientDetail.patient_id }}</span>
            </div>
            <p class="m-0 text-sm text-[rgb(var(--app-fg))]/60">Export patient documents or review LGU appointment, package, and billing records.</p>
          </div>
        </div>

<div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
  <div
    v-for="printable in lguPrintables"
    :key="printable.title"
    class="group flex h-full flex-col rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
  >
    <div class="flex flex-1 items-start gap-3">
      <span
        class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300"
      >
        <i :class="printable.icon" class="text-base" />
      </span>

      <div class="min-w-0 flex-1">
        <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">
          {{ printable.title }}
        </h4>

      </div>
    </div>

    <div class="mt-4 border-t border-[rgb(var(--app-border))] pt-3">
      <Button
        :label="printable.buttonLabel"
        icon="pi pi-print"
        size="small"
        outlined
        class="w-full justify-center"
        @click="printPrintable(printable.event)"
      />
    </div>
  </div>
</div>
      </section>

      <section class="space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">Appointments</h4>
            <p class="m-0 mt-1 text-xs text-[rgb(var(--app-fg))]/60">Sessions linked to this patient's LGU credit.</p>
          </div>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-[rgb(var(--app-border))]">
          <table class="min-w-full text-sm">
            <thead class="bg-[rgb(var(--app-bg-soft))] text-left text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/60">
              <tr>
                <th class="px-3 py-2 font-bold">Appointment</th>
                <th class="px-3 py-2 font-bold">Date</th>
                <th class="px-3 py-2 font-bold">Package</th>
                <th class="px-3 py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(appointment, index) in sortedAppointments" :key="appointment.appointment_id" :class="['border-t border-[rgb(var(--app-border))]', firstDroppedOutAppointmentId === appointment.appointment_id ? 'bg-red-50/70 dark:bg-red-900/20' : 'bg-[rgb(var(--app-card))]']">
                <td class="px-3 py-2">
                  <div class="text-xs font-bold text-[rgb(var(--app-fg))]">Session {{ index + 1 }}</div>
                  <div class="font-mono text-[11px] text-[rgb(var(--app-fg))]/60">APT-{{ appointment.appointment_id }}</div>
                </td>
                <td class="px-3 py-2 text-xs text-[rgb(var(--app-fg))]/70">{{ formatDateTime(appointment.appointment_date) }}</td>
                <td class="px-3 py-2 text-xs text-[rgb(var(--app-fg))]/70">{{ appointment.package_name || '-' }}</td>
                <td class="px-3 py-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <Tag :value="formatLguStatus(appointment.status)" :severity="lguStatusSeverity(appointment.status)" class="text-xs" />
                    <span v-if="firstDroppedOutAppointmentId === appointment.appointment_id" class="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300">Dropout Starts Here</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyBlock v-if="!sortedAppointments.length" text="No appointments recorded yet." />
      </section>

      <!-- <section class="space-y-3">
        <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">Package Availment</h4>
        <div class="overflow-x-auto rounded-2xl border border-[rgb(var(--app-border))]">
          <table class="min-w-full text-sm">
            <thead class="bg-[rgb(var(--app-bg-soft))] text-left text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/60">
              <tr>
                <th class="px-3 py-2 font-bold">Availed Package</th>
                <th class="px-3 py-2 text-right font-bold">Total Purchased</th>
                <th class="px-3 py-2 text-right font-bold">Used</th>
                <th class="px-3 py-2 text-right font-bold">Balance</th>
                <th class="px-3 py-2 font-bold">Expiry</th>
                <th class="px-3 py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pkg in selectedPatientDetail.package_availments" :key="pkg.authorization_id" class="border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]">
                <td class="px-3 py-2 font-medium">{{ pkg.package_name }}</td>
                <td class="px-3 py-2 text-right">{{ pkg.availed_count }}</td>
                <td class="px-3 py-2 text-right">{{ pkg.used_count }}</td>
                <td class="px-3 py-2 text-right font-bold">{{ pkg.available_balance }}</td>
                <td class="px-3 py-2 text-xs text-[rgb(var(--app-fg))]/70">{{ pkg.expiry_date || '-' }}</td>
                <td class="px-3 py-2"><Tag :value="formatLguStatus(pkg.status)" :severity="lguStatusSeverity(pkg.status)" class="text-xs" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyBlock v-if="!selectedPatientDetail.package_availments.length" text="No package availment records yet." />
      </section> -->

      <section class="space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">Billing Summary</h4>
            <p class="m-0 mt-1 text-xs text-[rgb(var(--app-fg))]/60">Generate or review this patient's LGU claim billings.</p>
          </div>

          <Button
            label="Create Claim"
            icon="pi pi-plus-circle"
            size="small"
            :loading="creatingClaim"
            :disabled="creatingClaim"
            @click="$emit('create-claim')"
          />
        </div>

        <div v-if="billingSummaryRows.length" class="overflow-x-auto rounded-2xl border border-[rgb(var(--app-border))]">
          <table class="min-w-full text-sm">
            <thead class="bg-[rgb(var(--app-bg-soft))] text-left text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/60">
              <tr>
                <th class="px-3 py-2 font-bold">Reference</th>
                <th class="px-3 py-2 font-bold">Appointment ID</th>
                <th class="px-3 py-2 font-bold">Session Sequence</th>
                <th class="px-3 py-2 font-bold">Appointment Status</th>
                <th class="px-3 py-2 font-bold">Date of Appointment</th>
                <th class="px-3 py-2 font-bold">PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in billingSummaryRows" :key="row.key" class="border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]">
                <td class="px-3 py-2">
                  <div class="font-mono text-xs font-semibold">{{ row.reference }}</div>
                  <div class="mt-0.5 text-[11px] text-[rgb(var(--app-fg))]/60">{{ row.serviceName }}</div>
                </td>
                <td class="px-3 py-2 font-mono text-xs">APT-{{ row.appointmentId }}</td>
                <td class="px-3 py-2 text-xs">{{ row.sessionSequenceLabel }}</td>
                <td class="px-3 py-2">
                  <Tag :value="formatLguStatus(row.appointmentStatus)" :severity="lguStatusSeverity(row.appointmentStatus)" class="text-xs" />
                </td>
                <td class="px-3 py-2 text-xs text-[rgb(var(--app-fg))]/60">{{ formatDateTime(row.appointmentDate) }}</td>
                <td class="px-3 py-2">
                  <Button
                    :label="row.billingId ? 'PDF' : 'No Claim'"
                    icon="pi pi-file-pdf"
                    size="small"
                    outlined
                    :disabled="!row.billingId"
                    :loading="row.billingId !== null && printingClaimBillingId === row.billingId"
                    @click="row.billingId && $emit('download-claim-pdf', row.billingId)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyBlock v-else text="No consumed LGU sessions recorded yet." />
      </section>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Message from "primevue/message"
import Tag from "primevue/tag"
import type { LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"

const props = defineProps<{
  selectedPatientDetail: LguPatientCreditDetail | null
  loadingPatientDetail: boolean
  patientDetailError: string
  firstDroppedOutAppointmentId: number | null
  printingClaimBillingId: number | null
  creatingClaim: boolean
  formatDateTime: (value?: string) => string
  formatLguStatus: (value?: string | null) => string
  lguStatusSeverity: (value?: string | null) => "success" | "warn" | "danger" | "info" | "secondary"
}>()

const visibleModel = defineModel<boolean>("visible", { required: true })

const formatPatientName = (value?: string | null, fallback = "Patient"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const emit = defineEmits<{
  "print-attendance-record": []
  "export-patient-lgu-details": []
  "export-patient-billing-summary": []
  "create-claim": []
  "download-claim-pdf": [billingId: number]
}>()

type LguPrintableEvent = "print-attendance-record" | "export-patient-lgu-details"
  | "export-patient-billing-summary"

const lguPrintables = [
  {
    title: "Patient LGU Profile",
    buttonLabel: "Print Patient Profile",
    icon: "pi pi-id-card",
    event: "export-patient-lgu-details" as LguPrintableEvent
  },
  {
    title: "Patient Billing Summary",
    buttonLabel: "Print Billing Summary",
    icon: "pi pi-file",
    event: "export-patient-billing-summary" as LguPrintableEvent
  },
]

const printPrintable = (event: LguPrintableEvent): void => {
  if (event === "print-attendance-record") {
    emit("print-attendance-record")
    return
  }
  if (event === "export-patient-billing-summary") {
    emit("export-patient-billing-summary")
    return
  }
  emit("export-patient-lgu-details")
}

const getNormalizedStatus = (value?: string | null): string => String(value ?? "").trim().toUpperCase()

const appointmentStatusSummary = computed(() => {
  const statuses = (props.selectedPatientDetail?.appointments ?? [])
    .map(appointment => getNormalizedStatus(appointment.status))
    .filter(Boolean)

  const dropoutStatus = statuses.find(status => status === "DROPPED_OUT" || status === "CROSS_MONTH_DROPPED_OUT")
  if (dropoutStatus) return dropoutStatus

  if (statuses.includes("COMPLETED")) return "COMPLETED"

  return ""
})

const selectedPatientStatus = computed(() =>
  appointmentStatusSummary.value
  || getNormalizedStatus(props.selectedPatientDetail?.dropout_status)
  || getNormalizedStatus(props.selectedPatientDetail?.authorizations[0]?.authorization_status)
  || (completedAppointmentCount.value > 0 && completedAppointmentCount.value === (props.selectedPatientDetail?.appointments.length ?? 0)
    ? "COMPLETED"
    : getNormalizedStatus(props.selectedPatientDetail?.package_availments[0]?.status))
)

const completedAppointmentCount = computed(() =>
  props.selectedPatientDetail?.appointments.filter(appointment => appointment.status === "COMPLETED").length ?? 0
)

const sortedAppointments = computed(() =>
  [...(props.selectedPatientDetail?.appointments ?? [])].sort((left, right) => {
    const leftTime = new Date(left.appointment_date).getTime()
    const rightTime = new Date(right.appointment_date).getTime()
    const leftSort = Number.isNaN(leftTime) ? 0 : leftTime
    const rightSort = Number.isNaN(rightTime) ? 0 : rightTime

    return leftSort - rightSort || Number(left.appointment_id) - Number(right.appointment_id)
  })
)

const billingsById = computed(() =>
  new Map((props.selectedPatientDetail?.billings ?? []).map(billing => [Number(billing.id), billing]))
)

const appointmentsById = computed(() =>
  new Map(sortedAppointments.value.map(appointment => [Number(appointment.appointment_id), appointment]))
)

const billingSummaryRows = computed(() =>
  (props.selectedPatientDetail?.authorizations ?? []).flatMap(authorization => {
    const sortedSessions = [...(authorization.sessions ?? [])].sort((left, right) => {
      const leftTime = new Date(left.appointment_date).getTime()
      const rightTime = new Date(right.appointment_date).getTime()
      const leftSort = Number.isNaN(leftTime) ? 0 : leftTime
      const rightSort = Number.isNaN(rightTime) ? 0 : rightTime

      return leftSort - rightSort
        || Number(left.appointment_id ?? 0) - Number(right.appointment_id ?? 0)
        || Number(left.id ?? 0) - Number(right.id ?? 0)
    })
    const totalSessions = Math.max(1, sortedSessions.length)

    return sortedSessions.map((session, index) => {
      const billingId = Number(session.dropout_billing_id ?? session.monthly_billing_id ?? 0) || null
      const billing = billingId ? billingsById.value.get(billingId) : undefined
      const appointment = appointmentsById.value.get(Number(session.appointment_id))

      return {
        key: `${authorization.authorization_id}-${session.id}`,
        reference: billing?.public_id || (billingId ? `BILLING-${billingId}` : "No claim yet"),
        serviceName: session.service_name || appointment?.package_name || authorization.package_name || "LGU Session",
        appointmentId: Number(session.appointment_id),
        sessionSequenceLabel: `${index + 1} of ${totalSessions}`,
        appointmentStatus: appointment?.status ?? authorization.authorization_status ?? "PENDING",
        appointmentDate: session.appointment_date || appointment?.appointment_date || "",
        billingId
      }
    })
  })
)

</script>

<script lang="ts">
const EmptyBlock = {
  props: {
    text: { type: String, required: true }
  },
  template: `
    <div class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] p-4 text-center text-xs text-[rgb(var(--app-fg))]/60">
      {{ text }}
    </div>
  `
}
</script>
