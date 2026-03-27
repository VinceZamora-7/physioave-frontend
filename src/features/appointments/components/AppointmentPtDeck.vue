<template>
  <!-- Header -->
  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <h3 class="app-section-title">Daily PT Deck</h3>
      <p class="text-sm opacity-70">
        Scheduled patients for the selected clinic day. Use Deck Snapshot, Deck Focus, and the table below for deeper list view.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button label="Create Appointment" icon="pi pi-plus" :pt="ptPrimaryBtn" @click="$emit('create')" />
      <Button label="Refresh" icon="pi pi-refresh" outlined :pt="ptOutlinedBtn" @click="$emit('refresh')" />
    </div>
  </div>

  <!-- Main content -->
  <div v-if="displayedAppointments.length" class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">

    <!-- ── Appointment Cards ── -->
    <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <article
        v-for="booking in displayedAppointments"
        :key="booking.id"
        :class="[
          'group relative rounded-2xl border transition-all duration-200 overflow-hidden',
          appointmentBlockBorderStyleClass(booking.location_context),
          isVisuallyMutedAppointment(booking.status) ? 'opacity-60 saturate-0' : '',
          isSelectedAppointment(booking.id)
            ? 'border-[#A91D8B]/45 bg-[linear-gradient(135deg,rgba(169,29,139,0.08),rgba(36,39,87,0.06))] shadow-lg shadow-[#A91D8B]/10'
            : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] hover:border-[#A91D8B]/30 hover:shadow-md'
        ]"
      >
        <!-- Clickable body -->
        <button type="button" class="w-full text-left p-4" @click="$emit('select', booking)">

          <!-- Time + Urgent badges row -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">
              {{ formatTimeRange(booking.start, booking.end) }}
            </span>
            <div class="flex gap-1.5">
              <span
                v-if="isStartingWithinOneHour(booking)"
                class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Soon
              </span>
              <span
                v-if="!booking.pt"
                class="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
              >
                Unassigned
              </span>
            </div>
          </div>

          <!-- Patient name + provider -->
          <div class="mb-3">
            <div class="text-base font-semibold text-[rgb(var(--app-fg))] leading-tight">
              {{ booking.patient.name }}
            </div>
            <div class="mt-0.5 text-sm text-[rgb(var(--app-fg))]/55">
              {{ displayProviderAssignment(booking) }}
            </div>
            <div v-if="booking.treatment_area?.name" class="mt-2">
              <TreatmentAreaChip :name="booking.treatment_area.name" :color="booking.treatment_area.color" />
            </div>
          </div>

          <!-- Tags — grouped by type, smaller -->
          <div class="flex flex-wrap gap-1.5">
            <Tag v-if="booking.specialty?.name" :value="booking.specialty.name" severity="info" class="text-[11px]" />
            <Tag :value="displayAppointmentPhase(booking.phase)" :severity="appointmentPhaseSeverity(booking.phase)" class="text-[11px]" />
            <Tag :value="displayLocationContext(booking.location_context)" :severity="appointmentLocationContextSeverity(booking.location_context)" class="text-[11px]" />
            <Tag :value="displayAppointmentStatus(booking.status)" :severity="appointmentSeverity(booking.status)" class="text-[11px]" />
            <Tag :value="displayBillingStatus(booking.billing_status)" :severity="billingSeverity(booking.billing_status)" class="text-[11px]" />
          </div>

          <!-- Stats row -->
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="rounded-lg bg-[rgb(var(--app-fg))]/[0.04] px-3 py-2">
              <div class="text-[10px] uppercase tracking-wide text-[rgb(var(--app-fg))]/45">Reschedules</div>
              <div class="mt-0.5 text-sm font-semibold text-[rgb(var(--app-fg))]">{{ booking.reschedule_count }}</div>
            </div>
            <div class="rounded-lg bg-[rgb(var(--app-fg))]/[0.04] px-3 py-2">
              <div class="text-[10px] uppercase tracking-wide text-[rgb(var(--app-fg))]/45">Billing</div>
              <div class="mt-0.5 text-sm font-semibold text-[rgb(var(--app-fg))]">{{ displayBillingStatus(booking.billing_status) }}</div>
            </div>
          </div>
        </button>

        <!-- Action bar — revealed on hover -->
        <div class="flex items-center gap-1 border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-fg))]/[0.02] px-3 py-2">
          <Button label="Detail" size="small" text icon="pi pi-eye" class="!text-xs" @click="$emit('select', booking)" />
          <Button label="Billing" size="small" text severity="secondary" icon="pi pi-receipt" class="!text-xs" @click="$emit('billing', booking)" />
          <Button label="Reschedule" size="small" text icon="pi pi-calendar-plus" class="!text-xs" @click="$emit('reschedule', booking)" />
          <div class="ml-auto">
            <Button
              v-if="canDeleteAppointments"
              size="small"
              text
              severity="danger"
              icon="pi pi-trash"
              @click="$emit('delete', booking)"
            />
          </div>
        </div>
      </article>
    </div>

    <!-- ── Sidebar ── -->
    <div class="space-y-3">

      <!-- Deck Snapshot -->
      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">Deck Snapshot</span>
          <span class="text-xs text-[rgb(var(--app-fg))]/40">{{ displayedAppointments.length }} total</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <!-- Pending -->
          <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
            <div class="flex items-center justify-between">
              <div class="text-[10px] uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Pending</div>
              <div class="h-1.5 w-1.5 rounded-full bg-amber-400" />
            </div>
            <div class="mt-1.5 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ pendingAppointmentsCount }}</div>
          </div>
          <!-- Completed -->
          <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
            <div class="flex items-center justify-between">
              <div class="text-[10px] uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Completed</div>
              <div class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <div class="mt-1.5 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ completedAppointmentsCount }}</div>
          </div>
          <!-- Needs Billing -->
          <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
            <div class="flex items-center justify-between">
              <div class="text-[10px] uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Needs Billing</div>
              <div class="h-1.5 w-1.5 rounded-full bg-rose-400" />
            </div>
            <div class="mt-1.5 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ billingAttentionCount }}</div>
          </div>
          <!-- Rescheduled -->
          <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
            <div class="flex items-center justify-between">
              <div class="text-[10px] uppercase tracking-wide text-[rgb(var(--app-fg))]/50">Rescheduled</div>
              <div class="h-1.5 w-1.5 rounded-full bg-sky-400" />
            </div>
            <div class="mt-1.5 text-2xl font-bold text-[rgb(var(--app-fg))]">{{ rescheduledAppointmentsCount }}</div>
          </div>
        </div>
      </div>

      <!-- Deck Focus -->
      <div
        :class="[
          'rounded-2xl border bg-[rgb(var(--app-bg))] p-4 transition-all duration-200',
          deckFocus ? appointmentBlockBorderStyleClass(deckFocus.location_context) : 'border-[rgb(var(--app-border))]',
          deckFocus && isVisuallyMutedAppointment(deckFocus.status) ? 'opacity-60 saturate-0' : ''
        ]"
      >
        <div class="mb-3 text-xs font-semibold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">
          Deck Focus
        </div>

        <template v-if="deckFocus">
          <!-- Time badge -->
          <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">
            {{ formatTimeRange(deckFocus.start, deckFocus.end) }}
          </div>

          <!-- Name -->
          <div class="text-xl font-bold text-[rgb(var(--app-fg))] leading-tight">
            {{ deckFocus.patient.name }}
          </div>
          <div class="mt-0.5 text-sm text-[rgb(var(--app-fg))]/55">
            {{ displayProviderAssignment(deckFocus) }}
          </div>

          <!-- Treatment area -->
          <div v-if="deckFocus.treatment_area?.name" class="mt-3">
            <TreatmentAreaChip :name="deckFocus.treatment_area.name" :color="deckFocus.treatment_area.color" />
          </div>

          <!-- Tags -->
          <div class="mt-3 flex flex-wrap gap-1.5">
            <Tag v-if="!deckFocus.pt" value="UNASSIGNED" severity="warn" class="text-[11px]" />
            <Tag v-if="deckFocus.specialty?.name" :value="deckFocus.specialty.name" severity="info" class="text-[11px]" />
            <Tag :value="displayAppointmentPhase(deckFocus.phase)" :severity="appointmentPhaseSeverity(deckFocus.phase)" class="text-[11px]" />
            <Tag :value="displayLocationContext(deckFocus.location_context)" :severity="appointmentLocationContextSeverity(deckFocus.location_context)" class="text-[11px]" />
            <Tag :value="displayAppointmentStatus(deckFocus.status)" :severity="appointmentSeverity(deckFocus.status)" class="text-[11px]" />
            <Tag :value="displayBillingStatus(deckFocus.billing_status)" :severity="billingSeverity(deckFocus.billing_status)" class="text-[11px]" />
          </div>
        </template>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center py-6 text-center">
          <div class="mb-2 text-3xl opacity-20">📋</div>
          <p class="text-sm text-[rgb(var(--app-fg))]/50">
            Select an appointment card to focus it here.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="mt-5 rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-14 text-center">
    <div class="mb-2 text-4xl opacity-20">🗓️</div>
    <div class="font-medium text-[rgb(var(--app-fg))]">
      {{ isLoading ? "Loading daily PT deck…" : "No bookings for this clinic day." }}
    </div>
    <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/50">
      {{ isLoading ? "Please wait a moment." : "Try selecting a different date or creating a new appointment." }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import Button from "primevue/button";
import Tag from "primevue/tag";
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue";
import type {
  AppointmentLocationContext,
  AppointmentPhase,
  DailyPtDeckBlock,
  DailyPtDeckGroup
} from "@/features/appointments/api/appointment-phase1.service";
import {ptOutlinedBtn, ptPrimaryBtn} from "@/features/shared/table-header.styles";

const props = defineProps<{
  groups: DailyPtDeckGroup[]
  selectedAppointmentId?: number
  canDeleteAppointments: boolean
  isLoading?: boolean
}>()

defineEmits<{
  create: []
  refresh: []
  select: [appointment: DailyPtDeckBlock]
  billing: [appointment: DailyPtDeckBlock]
  reschedule: [appointment: DailyPtDeckBlock]
  delete: [appointment: DailyPtDeckBlock]
}>()

const allAppointments = computed(() =>
  props.groups.flatMap(group => group.appointments)
    .slice()
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())
)
const earliestStartTime = computed(() => allAppointments.value[0]?.start)
const isEarliestAppointment = (appointment: DailyPtDeckBlock): boolean =>
  !!earliestStartTime.value && appointment.start === earliestStartTime.value
const isStartingWithinOneHour = (appointment: DailyPtDeckBlock): boolean => {
  const now = Date.now()
  const startsAt = new Date(appointment.start).getTime()
  const remainingMs = startsAt - now
  return remainingMs >= 0 && remainingMs <= 60 * 60 * 1000
}
const displayedAppointments = computed(() => {
  const highlighted = new Map<number, DailyPtDeckBlock>()

  for (const appointment of allAppointments.value) {
    if (isEarliestAppointment(appointment)) {
      highlighted.set(appointment.id, appointment)
    }
  }

  for (const appointment of allAppointments.value) {
    if (isStartingWithinOneHour(appointment)) {
      highlighted.set(appointment.id, appointment)
    }
  }

  return [...highlighted.values()].sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())
})
const pendingAppointmentsCount = computed(() =>
  allAppointments.value.filter(appointment => normalizeAppointmentStatus(appointment.status) === "PENDING").length
)
const completedAppointmentsCount = computed(() =>
  allAppointments.value.filter(appointment => normalizeAppointmentStatus(appointment.status) === "COMPLETED").length
)
const billingAttentionCount = computed(() =>
  allAppointments.value.filter(appointment => needsBillingAttention(appointment.billing_status)).length
)
const rescheduledAppointmentsCount = computed(() =>
  allAppointments.value.filter(appointment => Number(appointment.reschedule_count ?? 0) > 0).length
)
const deckFocus = computed(() => {
  const selected = props.selectedAppointmentId == null
    ? undefined
    : allAppointments.value.find(appointment => appointment.id === props.selectedAppointmentId)
  return selected ?? displayedAppointments.value[0] ?? allAppointments.value[0]
})

const normalizeAppointmentStatus = (status?: string): string =>
  (status || "PENDING").trim().toUpperCase().split(" ").join("_")
const appointmentSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeAppointmentStatus(status)
  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger"
  return "info"
}
const billingSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = displayBillingStatus(status)
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}
const appointmentPhaseSeverity = (phase?: AppointmentPhase): "info" | "contrast" | "warn" => {
  if (phase === "EVAL") return "info"
  if (phase === "RE_EVAL") return "warn"
  return "contrast"
}
const appointmentLocationContextSeverity = (locationContext?: AppointmentLocationContext): "success" | "warn" => {
  if (locationContext === "HOME_CARE") return "warn"
  return "success"
}
const appointmentBlockBorderStyleClass = (locationContext?: AppointmentLocationContext): "border-dashed" | "border-solid" => {
  if (locationContext === "HOME_CARE") return "border-dashed"
  return "border-solid"
}
const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}
const displayLocationContext = (locationContext?: AppointmentLocationContext): string => {
  if (locationContext === "HOME_CARE") return "HOME CARE"
  return "IN-CLINIC"
}
const displayAppointmentStatus = (status?: string): string => normalizeAppointmentStatus(status).split("_").join(" ")
const displayBillingStatus = (status?: string): string => (status?.trim() || "UNBILLED").toUpperCase()
const needsBillingAttention = (status?: string): boolean => {
  const normalized = displayBillingStatus(status)
  return normalized !== "PAID" && normalized !== "BILLED"
}
const isSelectedAppointment = (appointmentId: number): boolean => props.selectedAppointmentId === appointmentId
const isVisuallyMutedAppointment = (status?: string): boolean => {
  const normalized = normalizeAppointmentStatus(status)
  return normalized === "COMPLETED" || normalized === "CANCELLED"
}
const displayProviderAssignment = (appointment: DailyPtDeckBlock): string =>
  appointment.pt?.name?.trim() || appointment.doctor_name?.trim() || "Needs Doctor Consultant assignment"
const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  })
const formatTimeRange = (start: string, end: string): string => `${formatTime(start)} - ${formatTime(end)}`
</script>
