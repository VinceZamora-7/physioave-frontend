<template>
  <Dialog
    :visible="visible"
    modal
    header="Digital Sign-Off Slip"
    :style="{ width: 'min(680px, 100vw)' }"
    :breakpoints="{ '1024px': '94vw', '768px': '100vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="selectedDetail" class="space-y-4">
      <!-- Header Summary -->
      <section
        class="overflow-hidden rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]"
      >
        <div class="border-b border-[rgb(var(--app-border))] px-4 py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Encounter Ticket
              </p>

              <h3 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                Digital Sign-Off Slip
              </h3>

              <p class="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Review the session details, confirm the PT completion record, then let the patient sign to authorize attendance and session deduction.
              </p>
            </div>

            <Tag
              :value="isSelectedEncounterTicketLocked ? 'Locked' : selectedEncounterTicket ? 'Pending Signature' : 'New Slip'"
              :severity="isSelectedEncounterTicketLocked ? 'success' : selectedEncounterTicket ? 'warn' : 'info'"
              class="shrink-0"
            />
          </div>
        </div>

        <!-- Step Indicator -->
        <div class="grid grid-cols-1 gap-2 px-4 py-4 text-xs sm:grid-cols-3">
          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/10">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                1
              </span>
              <span class="font-medium text-slate-800 dark:text-slate-100">
                Review details
              </span>
            </div>
          </div>

          <div
            class="rounded-2xl border px-3 py-2"
            :class="selectedEncounterTicketHasPtSignature
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
              : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'"
          >
            <div class="flex items-center gap-2">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                :class="selectedEncounterTicketHasPtSignature
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'"
              >
                2
              </span>
              <span class="font-medium text-slate-800 dark:text-slate-100">
                PT confirmation
              </span>
            </div>
          </div>

          <div
            class="rounded-2xl border px-3 py-2"
            :class="isSelectedEncounterTicketLocked
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
              : 'border-white/50 bg-white/60 dark:border-white/10 dark:bg-white/10'"
          >
            <div class="flex items-center gap-2">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                :class="isSelectedEncounterTicketLocked
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'"
              >
                3
              </span>
              <span class="font-medium text-slate-800 dark:text-slate-100">
                Patient sign-off
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Transaction Details -->
      <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Session Details
            </p>

            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Confirm that the service and deduction details are correct before collecting the signature.
            </p>
          </div>
        </div>

        <div class="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Date
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ formatDateTime(selectedDetail.starts_at) }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              PT Name
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ selectedDetail.doctor_name || "Unassigned" }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Service Rendered
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ encounterServiceRenderedLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Session Deduction
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ encounterSessionDeductionLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Session Sequence
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ selectedEncounterTicket?.billing_snapshot?.session_sequence_label || "N/A" }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Encounter Ticket ID
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ encounterTicketRecordLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10 md:col-span-2">
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Billing Package Link
            </p>

            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ selectedEncounterTicketPackageLabel }}
            </p>

            <p
              v-if="selectedEncounterTicketPackageSourceLabel"
              class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400"
            >
              {{ selectedEncounterTicketPackageSourceLabel }}
            </p>
          </div>
        </div>

        <div
          v-if="selectedEncounterTicket"
          class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span class="font-medium">Existing slip:</span>
              <strong class="ml-1">
                {{ selectedEncounterTicket.slip_number || `#${selectedEncounterTicket.id}` }}
              </strong>
            </div>

            <span class="text-xs">
              {{
                isSelectedEncounterTicketLocked
                  ? selectedEncounterTicket.signed_off_at
                    ? `Patient signed ${formatDateTime(selectedEncounterTicket.signed_off_at)}`
                    : "Patient signed"
                  : "Waiting for patient sign-off"
              }}
            </span>
          </div>
        </div>

        <div
          v-if="isSelectedEncounterTicketLocked"
          class="mt-3 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          This signed ticket is locked as a permanent billing record and can no longer be changed.
        </div>
      </section>

      <!-- PT Confirmation -->
      <section
        class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              PT Confirmation
            </p>

            <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {{
                selectedEncounterTicketHasPtSignature
                  ? "The assigned PT has confirmed this completed session."
                  : "PT confirmation is not yet available for this encounter ticket."
              }}
            </p>
          </div>

          <Tag
            :value="selectedEncounterTicketHasPtSignature ? 'Confirmed' : 'Pending'"
            :severity="selectedEncounterTicketHasPtSignature ? 'success' : 'warn'"
            class="shrink-0"
          />
        </div>

        <template v-if="selectedEncounterTicketHasPtSignature">
          <div class="mt-4 rounded-2xl border border-white/50 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/10">
            <p class="text-sm leading-6 text-slate-700 dark:text-slate-200">
              {{ selectedEncounterTicketPtConfirmedByLabel }}

              <span v-if="selectedEncounterTicket?.pt_confirmed_at">
                signed on {{ formatDateTime(selectedEncounterTicket.pt_confirmed_at) }}
              </span>

              to confirm the session was completed.
            </p>

            <div
              v-if="selectedEncounterTicketPtCompletionTag"
              class="mt-3 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
            >
              {{ selectedEncounterTicketPtCompletionTag }}
            </div>
          </div>

          <div
            v-if="selectedEncounterTicket?.pt_signature_data_url"
            class="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-white p-3"
          >
            <img
              :src="selectedEncounterTicket.pt_signature_data_url"
              alt="PT signature"
              class="h-28 w-full object-contain"
            />
          </div>
        </template>
      </section>

      <!-- Patient Signature -->
      <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Patient Signature
            </p>

            <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {{
                isSelectedEncounterTicketLocked
                  ? "This stored patient signature is linked to billing and shown for record review only."
                  : "Ask the patient to sign below to acknowledge attendance and authorize this session to be tallied."
              }}
            </p>
          </div>

          <Tag
            :value="isSelectedEncounterTicketLocked ? 'Signed' : 'Required'"
            :severity="isSelectedEncounterTicketLocked ? 'success' : 'warn'"
            class="shrink-0"
          />
        </div>

        <div
          class="mt-4 rounded-2xl border border-white/50 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10"
        >
          <PatientSignaturePad
            v-model="signatureProxy"
            :disabled="isSelectedEncounterTicketLocked"
          />
        </div>

        <p
          v-if="!isSelectedEncounterTicketLocked && !signatureProxy"
          class="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300"
        >
          Patient signature is required before generating the sign-off slip.
        </p>
      </section>
    </div>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          :label="isSelectedEncounterTicketLocked ? 'Close' : 'Cancel'"
          text
          class="w-full sm:w-auto"
          @click="emit('update:visible', false)"
        />

        <Button
          v-if="!isSelectedEncounterTicketLocked"
          label="Generate Sign-Off Slip"
          icon="pi pi-check"
          :loading="isEncounterTicketSaving"
          :disabled="!signatureProxy || isEncounterTicketSaving"
          :pt="ptPrimaryBtn"
          class="w-full sm:w-auto"
          @click="emit('submit')"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import PatientSignaturePad from "@/features/appointments/components/PatientSignaturePad.vue"

interface AppointmentDetail {
  starts_at: string
  doctor_name?: string
}

interface EncounterTicketBillingSnapshot {
  session_sequence_label?: string
}

interface EncounterTicket {
  id: number
  slip_number?: string
  signed_off_at?: string
  pt_confirmed_at?: string
  pt_signature_data_url?: string
  billing_snapshot?: EncounterTicketBillingSnapshot
}

type PassThroughValue = Record<string, unknown>

const props = defineProps<{
  visible: boolean
  signatureDataUrl: string

  selectedDetail?: AppointmentDetail | null
  selectedEncounterTicket?: EncounterTicket | null

  selectedEncounterTicketHasPtSignature: boolean
  selectedEncounterTicketPtConfirmedByLabel: string
  selectedEncounterTicketPtCompletionTag?: string

  encounterServiceRenderedLabel: string
  encounterSessionDeductionLabel: string
  encounterTicketRecordLabel: string

  selectedEncounterTicketPackageLabel: string
  selectedEncounterTicketPackageSourceLabel?: string

  isSelectedEncounterTicketLocked: boolean
  isEncounterTicketSaving: boolean

  ptPrimaryBtn?: PassThroughValue

  formatDateTime: (value: string | Date) => string
}>()

const emit = defineEmits<{
  "update:visible": [value: boolean]
  "update:signatureDataUrl": [value: string]
  submit: []
}>()

const signatureProxy = computed({
  get: () => props.signatureDataUrl,
  set: (value: string) => emit("update:signatureDataUrl", value)
})
</script>
