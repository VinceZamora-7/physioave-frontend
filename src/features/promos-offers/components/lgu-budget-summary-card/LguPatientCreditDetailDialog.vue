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

          <div class="flex flex-wrap gap-2">
            <Button label="Invoices" icon="pi pi-file-pdf" size="small" outlined @click="$emit('open-invoice-session-picker')" />
            <!-- <Button label="Billing Summary" icon="pi pi-file-pdf" size="small" outlined @click="$emit('export-patient-billing-summary')" /> -->
            <Button label="SOA" icon="pi pi-file" size="small" outlined @click="$emit('open-patient-soa-picker')" />
            <Button label="LGU Details" icon="pi pi-id-card" size="small" outlined @click="$emit('export-patient-lgu-details')" />
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

defineEmits<{
  "open-invoice-session-picker": []
  "export-patient-billing-summary": []
  "open-patient-soa-picker": []
  "export-patient-lgu-details": []
  "create-claims": []
  "download-claim-pdf": [billingId: number]
}>()

const selectedPatientStatus = computed(() =>
  props.selectedPatientDetail?.package_availments[0]?.status
  ?? props.selectedPatientDetail?.dropout_status
  ?? props.selectedPatientDetail?.authorizations[0]?.authorization_status
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
