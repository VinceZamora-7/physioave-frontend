<template>
  <Dialog v-model:visible="visibleModel" modal :header="selectedPatientDetail ? `${selectedPatientDetail.patient_name} - LGU Credit Detail` : 'LGU Credit Detail'" style="width: min(94vw, 980px)" :pt="{ content: { class: 'space-y-4' } }">
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
            <p class="m-0 text-sm text-[rgb(var(--app-fg))]/60">Export patient documents or review LGU appointment, package, and claim records.</p>
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
          <Button label="Create Claim" icon="pi pi-file" size="small" :loading="isCreatingClaims" :disabled="isCreatingClaims" @click="$emit('create-claims')" />
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
              <tr v-for="(appointment, index) in selectedPatientDetail.appointments" :key="appointment.appointment_id" :class="['border-t border-[rgb(var(--app-border))]', firstDroppedOutAppointmentId === appointment.appointment_id ? 'bg-red-50/70 dark:bg-red-900/20' : 'bg-[rgb(var(--app-card))]']">
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

        <EmptyBlock v-if="!selectedPatientDetail.appointments.length" text="No appointments recorded yet." />
      </section>

      <section class="space-y-3">
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
      </section>

      <section class="space-y-3">
        <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">Billing Summary</h4>
        <div v-if="selectedPatientDetail.billings.length" class="overflow-x-auto rounded-2xl border border-[rgb(var(--app-border))]">
          <table class="min-w-full text-sm">
            <thead class="bg-[rgb(var(--app-bg-soft))] text-left text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/60">
              <tr>
                <th class="px-3 py-2 font-bold">Reference</th>
                <th class="px-3 py-2 font-bold">Availed Package</th>
                <th class="px-3 py-2 font-bold">Type</th>
                <th class="px-3 py-2 font-bold">Program Status</th>
                <th class="px-3 py-2 font-bold">Sessions Rendered</th>
                <th class="px-3 py-2 text-right font-bold">Amount</th>
                <th class="px-3 py-2 font-bold">Status</th>
                <th class="px-3 py-2 font-bold">Date</th>
                <th class="px-3 py-2 font-bold">PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="billing in selectedPatientDetail.billings" :key="billing.id" class="border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]">
                <td class="px-3 py-2 font-mono text-xs">{{ billing.public_id }}</td>
                <td class="px-3 py-2 text-xs">{{ billing.package_name || billing.service_name || '-' }}</td>
                <td class="px-3 py-2">
                  <span v-if="billing.pricing_source === 'LGU_DROPOUT_INDIVIDUAL_CLAIM'" class="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Dropout Claim</span>
                  <span v-else-if="billing.pricing_source === 'LGU_PACKAGE_MONTHLY_CLAIM'" class="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Monthly Claim</span>
                  <span v-else class="text-xs text-[rgb(var(--app-fg))]/60">{{ billing.pricing_source || '-' }}</span>
                </td>
                <td class="px-3 py-2">
                  <Tag :value="getProgramStatusLabel(billing)" :severity="getProgramStatusSeverity(billing)" class="text-xs" />
                </td>
                <td class="px-3 py-2 text-xs">
                  <div class="space-y-1">
                    <div class="font-semibold">{{ sessionsRenderedLabel }}</div>
                    <div class="h-1.5 w-28 overflow-hidden rounded-full bg-[rgb(var(--app-border))]">
                      <div class="h-full bg-emerald-500" :style="{ width: sessionsRenderedPercent + '%' }" />
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2 text-right font-bold">{{ asCurrency(getBillingSummaryAmount(billing)) }}</td>
                <td class="px-3 py-2">
                  <Tag :value="billing.billing_status" :severity="billing.billing_status === 'PAID' ? 'success' : billing.billing_status === 'BILLED' ? 'info' : billing.billing_status === 'VOID' ? 'danger' : 'secondary'" class="text-xs" />
                </td>
                <td class="px-3 py-2 text-xs text-[rgb(var(--app-fg))]/60">{{ formatDateTime(billing.created_at) }}</td>
                <td class="px-3 py-2">
                  <Button label="Billing Summary" icon="pi pi-file-pdf" size="small" outlined :loading="printingClaimBillingId === billing.id" @click="$emit('download-claim-pdf', billing.id)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyBlock v-else text="No LGU claim billings generated yet." />
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
import type { LguPatientBilling, LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"

const props = defineProps<{
  selectedPatientDetail: LguPatientCreditDetail | null
  loadingPatientDetail: boolean
  patientDetailError: string
  firstDroppedOutAppointmentId: number | null
  isCreatingClaims: boolean
  printingClaimBillingId: number | null
  formatDateTime: (value?: string) => string
  formatLguStatus: (value?: string | null) => string
  lguStatusSeverity: (value?: string | null) => "success" | "warn" | "danger" | "info" | "secondary"
  asCurrency: (value: number) => string
  getBillingSummaryAmount: (billing: LguPatientBilling) => number
}>()

const visibleModel = defineModel<boolean>("visible", { required: true })

const emit = defineEmits<{
  "print-attendance-record": []
  "export-patient-lgu-details": []
  "create-claims": []
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
    buttonLabel: "Print Patient Billing Summary",
    icon: "pi pi-file",
    event: "export-patient-billing-summary" as LguPrintableEvent
  },
  // {
  //   title: "Attendance & Treatment Record",
  //   buttonLabel: "Print Attendance Record",
  //   icon: "pi pi-calendar-clock",
  //   event: "print-attendance-record" as LguPrintableEvent
  // },
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

const selectedPatientStatus = computed(() =>
  props.selectedPatientDetail?.package_availments[0]?.status
  ?? props.selectedPatientDetail?.dropout_status
  ?? props.selectedPatientDetail?.authorizations[0]?.authorization_status
)

const completedAppointmentCount = computed(() =>
  props.selectedPatientDetail?.appointments.filter(appointment => appointment.status === "COMPLETED").length ?? 0
)

const totalAuthorizedSessions = computed(() => {
  const authorizations = props.selectedPatientDetail?.authorizations ?? []
  const totalFromAuthorizations = authorizations.reduce((sum, auth) => sum + Number(auth.total_sessions ?? 0), 0)
  if (totalFromAuthorizations > 0) return totalFromAuthorizations
  const packageAvailments = props.selectedPatientDetail?.package_availments ?? []
  return packageAvailments.reduce((sum, pkg) => sum + Number(pkg.availed_count ?? 0), 0)
})

const sessionsRenderedLabel = computed(() => {
  const total = totalAuthorizedSessions.value
  return `${completedAppointmentCount.value} / ${total || 0} Sessions`
})

const sessionsRenderedPercent = computed(() => {
  const total = totalAuthorizedSessions.value
  if (!total) return 0
  return Math.min(100, Math.max(0, (completedAppointmentCount.value / total) * 100))
})

const getProgramStatusLabel = (billing: LguPatientBilling): string => {
  const pricingSource = String(billing.pricing_source ?? "").toUpperCase()
  if (pricingSource.includes("DROPOUT")) return "DROPPED_OUT"
  const fallback = selectedPatientStatus.value
  if (!fallback) return "ACTIVE"
  return String(fallback).trim().toUpperCase()
}

const getProgramStatusSeverity = (billing: LguPatientBilling): "success" | "warn" | "danger" | "info" | "secondary" => {
  const status = getProgramStatusLabel(billing)
  if (status === "DROPPED_OUT" || status === "CROSS_MONTH_DROPPED_OUT") return "danger"
  if (status === "ACTIVE") return "success"
  return "info"
}
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
