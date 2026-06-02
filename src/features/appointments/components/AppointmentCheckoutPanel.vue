<template>
  <Dialog
    v-model:visible="visibleProxy"
    :modal="false"
    position="right"
    dismissableMask
    :draggable="false"
    :resizable="false"
    :style="{ width: 'min(430px, 100vw)' }"
    :breakpoints="{ '1280px': '92vw', '768px': '100vw' }"
    header="Appointment Checkout"
  >
    <div v-if="selectedDetail" class="space-y-4">
      <!-- Header -->
      <div class="app-hero-panel">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Checkout For
        </p>

        <h3 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
          {{ selectedDetail.patient_name }}
        </h3>

        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ selectedDetail.public_id || "Pending appointment record code" }}
          ·
          {{ formatDateTime(selectedDetail.starts_at) }}
        </p>

        <div
          class="mt-3 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
        >
          Follow the checkout flow: verify responsibility, open or create billing, then finalize the sign-off slip.
        </div>
      </div>

      <!-- Step 1 -->
      <div class="space-y-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Step 1 · Verify Payment Responsibility
        </p>

        <div
          :class="hasPatientWalletAmountToCollect
            ? 'rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
            : 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'"
        >
          <p class="text-xs font-medium uppercase tracking-wide opacity-75">
            Wallet 1 · Patient Responsibility
          </p>

          <template v-if="hasPatientWalletAmountToCollect">
            <p class="mt-2 text-sm font-medium">
              Collect this out-of-pocket balance before checkout clears.
            </p>

            <p class="mt-1 text-2xl font-semibold">
              {{ asCurrency(patientWalletAmountToCollect) }}
            </p>
          </template>

          <p v-else class="mt-2 text-sm font-medium">
            No out-of-pocket cash due right now.
          </p>
        </div>

        <div class="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/10">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Wallet 2 · Third-Party / Packages
              </p>

              <p class="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                {{ sponsorWalletSummary?.display_text || "No HMO/LGU authorization attached to this appointment." }}
              </p>

              <p v-if="sponsorWalletSummary" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Sponsor balances stay hidden here. Only authorization and session usage are shown.
              </p>
            </div>

            <Tag
              v-if="sponsorWalletSummary"
              :value="sponsorWalletSummary.sponsor_type"
              severity="info"
              class="shrink-0"
            />
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="space-y-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Step 2 · Open Billing and Collect Payment
        </p>

        <div class="grid grid-cols-1 gap-2">
          <Button
            label="Open Patient Record"
            icon="pi pi-user"
            outlined
            :pt="ptOutlinedBtn"
            class="w-full justify-center"
            @click="emit('open-patient-record')"
          />

          <Button
            v-if="selectedDetail.billing_id"
            label="Open Billing / Tender Payment"
            icon="pi pi-wallet"
            :pt="ptPrimaryBtn"
            class="w-full justify-center"
            @click="emit('open-tender-payment')"
          />

          <Button
            v-if="!selectedDetail.billing_id"
            label="Create Billing"
            icon="pi pi-plus"
            severity="secondary"
            outlined
            :pt="ptOutlinedBtn"
            class="w-full justify-center"
            @click="emit('create-billing')"
          />
        </div>

        <div
          class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2 text-xs text-slate-500 dark:text-slate-400"
        >
          Billing Record ID:
          <span class="font-medium text-slate-800 dark:text-slate-100">
            {{ selectedDetail.billing_public_id || "No billing linked yet" }}
          </span>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="space-y-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Step 3 · Finalize Attendance Sign-Off
        </p>

        <Button
          :label="encounterTicketButtonLabel"
          icon="pi pi-receipt"
          :pt="ptPrimaryBtn"
          class="w-full justify-center"
          :disabled="!canProcessEncounterTicket"
          @click="emit('open-encounter-ticket')"
        />

        <Button
          v-if="isSelectedEncounterTicketLocked"
          label="Export Ticket PDF"
          icon="pi pi-file-pdf"
          outlined
          class="w-full justify-center"
          @click="emit('export-ticket-pdf')"
        />

        <p v-if="!canProcessEncounterTicket" class="text-xs leading-5 text-slate-500 dark:text-slate-400">
          Create or open the billing record first so the signed ticket can be attached to the patient’s billing profile.
        </p>
      </div>

            <div class="flex flex-wrap gap-2 border-t border-[rgb(var(--app-border))] pt-4">
        <Tag
          v-if="selectedDetail.specialty_tag_name"
          :value="selectedDetail.specialty_tag_name"
          severity="info"
        />

        <Tag
          v-if="selectedDetail.specialty_tag_name && selectedDetail.specialty_tag_is_active === false"
          value="Inactive Specialty"
          severity="secondary"
        />

        <Tag
          v-if="selectedDetail.treatment_area_name && selectedDetail.treatment_area_is_active === false"
          value="Inactive Room"
          severity="secondary"
        />

        <Tag
          v-if="selectedEncounterTicketHasPtSignature"
          value="PT Signed-Off"
          severity="success"
        />

        <Tag
          :value="displayAppointmentPhase(selectedDetail.appointment_phase)"
          :severity="appointmentPhaseSeverity(selectedDetail.appointment_phase)"
        />

        <Tag
          :value="displayLocationContext(selectedDetail.location_context)"
          :severity="appointmentLocationContextSeverity(selectedDetail.location_context)"
        />

        <Tag
          :value="displayAppointmentStatus(selectedDetail.appointment_status)"
          :severity="appointmentSeverity(selectedDetail.appointment_status)"
        />

        <Tag
          :value="displayBillingStatus(selectedDetail.billing_status)"
          :severity="billingSeverity(selectedDetail.billing_status)"
        />

        <Tag
          :value="encounterAttendanceLabel"
          :severity="selectedEncounterTicket ? 'success' : 'warn'"
        />
      </div>

      <!-- Reference toggle -->
      <button
        class="flex w-full items-center justify-between rounded-xl border border-dashed border-[rgb(22,23,26)] bg-[rgb(var(--app-card))] px-3 py-2 text-left transition-colors hover:bg-[rgb(var(--app-bg))]"
        @click="showDetails = !showDetails"
      >
        <div>
          <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Reference Details
          </p>
          <p class="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Tags, audit fields, encounter ticket info, and LGU ledger
          </p>
        </div>
        <i :class="showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="shrink-0 text-slate-400" />
      </button>

      <div v-show="showDetails" class="space-y-4">

      <!-- Tags -->


      <!-- Additional Details -->
      <div class="mt-1 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Additional Details
        </p>

        <div class="mt-3 grid grid-cols-1 gap-3 text-sm">
          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Clinic</p>
            <p class="font-medium">{{ selectedDetail.clinic_name }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Patient Record ID</p>
            <p class="font-medium">{{ selectedDetail.patient_public_id || "Pending patient record code" }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Appointment Record ID</p>
            <p class="font-medium">{{ selectedDetail.public_id || "Pending appointment record code" }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Billing Record ID</p>
            <p class="font-medium">{{ selectedDetail.billing_public_id || "No billing linked yet" }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Assigned PT</p>
            <p class="font-medium">{{ selectedDetail.doctor_name || "N/A" }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Referring Doctor</p>
            <p class="font-medium">{{ selectedDetail.referring_doctor_name || "N/A" }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Supporting PT / Intern</p>
            <p class="font-medium">{{ selectedDetail.support_staff_name || "N/A" }}</p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Schedule</p>
            <p class="font-medium">
              {{ formatDateTime(selectedDetail.starts_at) }}
              -
              {{ formatDateTime(selectedDetail.ends_at) }}
            </p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Specialty</p>
            <p class="font-medium">{{ selectedDetail.specialty_tag_name || "N/A" }}</p>

            <p
              v-if="selectedDetail.specialty_tag_name && selectedDetail.specialty_tag_is_active === false"
              class="mt-1 text-xs opacity-70"
            >
              Inactive now, preserved on this appointment for audit history.
            </p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Clinic Room</p>

            <div class="mt-1">
              <TreatmentAreaChip
                :name="selectedDetail.treatment_area_name"
                :color="selectedDetail.treatment_area_color"
              />
            </div>

            <p
              v-if="selectedDetail.treatment_area_name && selectedDetail.treatment_area_is_active === false"
              class="mt-1 text-xs opacity-70"
            >
              Inactive now, preserved on this appointment for audit history.
            </p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Appointment Status</p>

            <div class="mt-1">
              <Tag
                :value="displayAppointmentStatus(selectedDetail.appointment_status)"
                :severity="appointmentSeverity(selectedDetail.appointment_status)"
              />
            </div>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Encounter Ticket</p>

            <p class="font-medium">
              {{ selectedEncounterTicket?.slip_number || "Not generated yet" }}
            </p>

            <p class="mt-1 text-xs opacity-70">
              {{ selectedEncounterTicketSummaryLabel }}
            </p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Encounter Ticket ID</p>

            <p class="font-medium">
              {{ encounterTicketRecordLabel }}
            </p>

            <p class="mt-1 text-xs opacity-70">
              {{
                isSelectedEncounterTicketLocked
                  ? "Locked as the independent attendance ledger record for this appointment."
                  : "This attendance ledger record stays open until patient sign-off locks it."
              }}
            </p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">Active Billing Package</p>

            <p class="font-medium">
              {{ selectedEncounterTicketPackageLabel }}
            </p>

            <p v-if="selectedEncounterTicketPackageSourceLabel" class="mt-1 text-xs opacity-70">
              {{ selectedEncounterTicketPackageSourceLabel }}
            </p>
          </div>

          <div v-if="isLguBilling" :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">LGU Program Status</p>

            <div class="mt-2 flex flex-wrap items-center gap-2">
              <Tag
                :value="dropoutStatusLabel"
                :severity="dropoutStatusSeverity"
              />

              <Button
                v-if="!isSelectedEncounterTicketLocked || dropoutStatusValue !== 'DROPPED_OUT'"
                :label="dropoutToggleLabel"
                :icon="dropoutToggleIcon"
                :severity="dropoutToggleSeverity"
                size="small"
                outlined
                :loading="dropoutLoading"
                @click="emit('toggle-dropout-status')"
              />
            </div>

            <p class="mt-1 text-xs opacity-70">
              {{ dropoutStatusDescription }}
            </p>
          </div>

          <div :class="detailCardClass">
            <p class="text-xs uppercase tracking-wide opacity-70">PT Session Confirmation</p>

            <p class="font-medium">
              {{
                selectedEncounterTicketHasPtSignature
                  ? `Signed by ${selectedEncounterTicketPtConfirmedByLabel}`
                  : "PT has not signed this session yet"
              }}
            </p>

            <p class="mt-1 text-xs opacity-70">
              {{
                selectedEncounterTicket?.pt_confirmed_at
                  ? `Captured ${formatDateTime(selectedEncounterTicket.pt_confirmed_at)}`
                  : "Higher-ups can review the PT signature here before final patient sign-off."
              }}
            </p>

            <div
              v-if="selectedEncounterTicketPtCompletionTag"
              class="mt-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
            >
              {{ selectedEncounterTicketPtCompletionTag }}
            </div>

            <div
              v-if="selectedEncounterTicket?.pt_signature_data_url"
              class="mt-3 overflow-hidden rounded-xl border border-[rgb(var(--app-border))] bg-white p-2"
            >
              <img
                :src="selectedEncounterTicket.pt_signature_data_url"
                alt="PT signature"
                class="h-24 w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- LGU Credit Ledger -->
      <div
        v-if="selectedDetail.lgu_credit_summary?.items?.length"
        class="overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))]"
      >
        <div class="border-b border-[rgb(var(--app-border))] px-4 py-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-[rgb(var(--app-fg))]">
                LGU Credit Ledger
              </p>

              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ selectedDetail.lgu_credit_summary.package_name }}:
                {{ selectedDetail.lgu_credit_summary.consumed_sessions }}
                of
                {{ selectedDetail.lgu_credit_summary.total_sessions }}
                consumed
              </p>
            </div>

            <Button
              v-if="selectedDetail.lgu_credit_summary.consumed_sessions > selectedDetail.lgu_credit_summary.billed_sessions && ['ACTIVE', 'COMPLETED'].includes(selectedDetail.lgu_credit_summary.authorization_status)"
              label="Create Month-End Claim"
              icon="pi pi-file"
              size="small"
              :pt="ptPrimaryBtn"
              class="w-full sm:w-auto"
              @click="emit('open-lgu-monthly-claim')"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-black/5 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th class="px-4 py-3 font-medium">Service Item</th>
                <th class="px-4 py-3 font-medium">Package</th>
                <th class="px-4 py-3 text-right font-medium">Total</th>
                <th class="px-4 py-3 text-right font-medium">Used</th>
                <th class="px-4 py-3 text-right font-medium">Balance</th>
                <th class="px-4 py-3 font-medium">Expiry</th>
                <th class="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in selectedDetail.lgu_credit_summary.items"
                :key="item.id"
                class="border-t border-[rgb(var(--app-border))]"
              >
                <td class="px-4 py-3 font-medium">
                  {{ item.service_item }}
                </td>

                <td class="px-4 py-3">
                  {{ item.package_name }}
                </td>

                <td class="px-4 py-3 text-right">
                  {{ item.total_purchased }}
                </td>

                <td class="px-4 py-3 text-right">
                  {{ item.used }}
                </td>

                <td class="px-4 py-3 text-right">
                  {{ item.balance }}
                </td>

                <td class="px-4 py-3">
                  {{ item.expiry_date || "Open" }}
                </td>

                <td class="px-4 py-3">
                  <Tag
                    :value="item.status"
                    :severity="item.balance <= 0 ? 'contrast' : item.status === 'DROPPED_OUT' ? 'danger' : 'info'"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      </div><!-- end collapsible -->
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Tag from "primevue/tag"
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue"
import type {
  AppointmentLocationContext,
  AppointmentPhase
} from "@/features/appointments/api/appointment-phase1.service"

type PrimeSeverity =
  | "success"
  | "info"
  | "warn"
  | "danger"
  | "secondary"
  | "contrast"
  | undefined

type ClassValue = string | string[] | Record<string, boolean>
type PassThroughValue = Record<string, unknown>

interface SponsorWalletSummary {
  sponsor_type: "HMO" | "LGU" | string
  display_text: string
}

interface SelectedEncounterTicket {
  slip_number?: string
  pt_confirmed_at?: string
  pt_signature_data_url?: string
}

interface LguCreditLedgerItem {
  id: number
  service_item: string
  package_name: string
  total_purchased: number
  used: number
  balance: number
  expiry_date?: string
  status: string
}

interface LguCreditSummary {
  package_name: string
  total_sessions: number
  consumed_sessions: number
  billed_sessions: number
  authorization_status: string
  items: LguCreditLedgerItem[]
}

interface AppointmentCheckoutDetail {
  patient_name: string
  public_id?: string
  patient_public_id?: string
  clinic_name: string
  billing_id?: number
  billing_public_id?: string
  doctor_name?: string
  referring_doctor_name?: string
  support_staff_name?: string
  starts_at: string
  ends_at: string
  specialty_tag_name?: string
  specialty_tag_is_active?: boolean
  treatment_area_name?: string
  treatment_area_color?: string
  treatment_area_is_active?: boolean
  appointment_phase: AppointmentPhase
  location_context: AppointmentLocationContext
  appointment_status: string
  billing_status: string
  lgu_credit_summary?: LguCreditSummary
}

const props = defineProps<{
  visible: boolean
  selectedDetail?: AppointmentCheckoutDetail | null

  sponsorWalletSummary?: SponsorWalletSummary | null
  hasPatientWalletAmountToCollect: boolean
  patientWalletAmountToCollect: number

  selectedEncounterTicket?: SelectedEncounterTicket | null
  selectedEncounterTicketHasPtSignature: boolean
  selectedEncounterTicketSummaryLabel: string
  selectedEncounterTicketPackageLabel: string
  selectedEncounterTicketPackageSourceLabel?: string
  selectedEncounterTicketPtConfirmedByLabel: string
  selectedEncounterTicketPtCompletionTag?: string

  encounterTicketButtonLabel: string
  encounterTicketRecordLabel: string
  encounterAttendanceLabel: string
  canProcessEncounterTicket: boolean
  isSelectedEncounterTicketLocked: boolean

  isLguBilling: boolean
  dropoutStatusLabel: string
  dropoutStatusSeverity: PrimeSeverity
  dropoutStatusValue: string
  dropoutToggleLabel: string
  dropoutToggleIcon: string
  dropoutToggleSeverity: PrimeSeverity
  dropoutLoading: boolean
  dropoutStatusDescription: string

  ptPrimaryBtn?: PassThroughValue
  ptOutlinedBtn?: PassThroughValue
  detailCardClass: ClassValue

  formatDateTime: (value: string | Date) => string
  asCurrency: (value: number) => string

  displayAppointmentPhase: (value?: AppointmentPhase) => string
  appointmentPhaseSeverity: (value?: AppointmentPhase) => PrimeSeverity

  displayLocationContext: (value?: AppointmentLocationContext) => string
  appointmentLocationContextSeverity: (value?: AppointmentLocationContext) => PrimeSeverity

  displayAppointmentStatus: (value?: string) => string
  appointmentSeverity: (value?: string) => PrimeSeverity

  displayBillingStatus: (value?: string) => string
  billingSeverity: (value: string) => PrimeSeverity
}>()

const emit = defineEmits<{
  "update:visible": [value: boolean]
  close: []
  "open-patient-record": []
  "open-tender-payment": []
  "create-billing": []
  "open-encounter-ticket": []
  "export-ticket-pdf": []
  "toggle-dropout-status": []
  "open-lgu-monthly-claim": []
}>()

const showDetails = ref(false)

const visibleProxy = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    emit("update:visible", value)
    if (!value) {
      emit("close")
    }
  }
})
</script>
