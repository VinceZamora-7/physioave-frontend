<template>
  <section class="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#edf3fb_0%,#eff4fb_100%)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h3 class="text-xl font-black tracking-tight text-slate-800">EMR Decking Dashboard</h3>
        <p class="mt-1 text-xs font-medium text-slate-600">
          {{ deckModeDescription }}
        </p>
      </div>

      <div class="grid grid-cols-3 gap-3 text-right text-slate-700">
        <div>
          <div class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Booked</div>
          <div class="mt-1 text-lg font-black">{{ displayedAppointments.length }}</div>
        </div>
        <div>
          <div class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Mode</div>
          <div class="mt-1 text-lg font-black">{{ deckModeShortLabel }}</div>
        </div>
        <div>
          <div class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Provider</div>
          <div class="mt-1 text-lg font-black">{{ deckProviderName }}</div>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-2xl bg-white/84 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <h4 class="text-2xl font-black uppercase tracking-tight text-slate-800">Today's Decking Log</h4>

      <div class="mt-4 min-h-[220px] rounded-2xl bg-slate-50/85 p-3">
        <div v-if="displayedAppointments.length" class="space-y-3">
          <article
            v-for="booking in displayedAppointments"
            :key="booking.id"
            :class="[
              'rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200',
              isSelectedAppointment(booking.id) ? 'ring-2 ring-[#3b82f6]/45' : 'hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]',
              isVisuallyMutedAppointment(booking.status) ? 'opacity-60 saturate-0' : ''
            ]"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button type="button" class="flex min-w-0 flex-1 items-center gap-4 text-left" @click="handleSelect(booking)">
                <div class="h-14 w-1 rounded-full" :class="bookingStatusBarClass(booking)" />
                <div class="min-w-0">
                  <div class="text-xl font-black tracking-tight text-slate-800">{{ formatSingleTime(booking.start) }}</div>
                  <div class="mt-1 flex min-w-0 items-center gap-2 text-slate-700">
                    <i class="pi pi-user text-sm text-slate-500" />
                    <span class="truncate text-lg font-medium">{{ booking.patient.name }}</span>
                  </div>
                  <div v-if="booking.referring_doctor?.name" class="mt-1 text-sm text-slate-400">
                    Ref: {{ booking.referring_doctor.name }}
                  </div>
                </div>
              </button>

              <div class="flex flex-col items-start gap-2 md:items-end">
                <span class="inline-flex items-center rounded-full border-2 border-green-600 bg-white px-4 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
                  {{ careTeamBadge(booking) }}
                </span>
                <div class="text-sm text-slate-400">{{ modeForBooking(booking) }}</div>
                <div class="flex flex-wrap items-center gap-1">
                  <Button size="small" text icon="pi pi-eye" class="!text-xs" @click="emit('select', booking)" />
                  <Button size="small" text severity="secondary" icon="pi pi-receipt" class="!text-xs" @click="emit('billing', booking)" />
                  <Button size="small" text icon="pi pi-calendar-plus" class="!text-xs" @click="emit('reschedule', booking)" />
                  <Button
                    v-if="canDeleteAppointments"
                    size="small"
                    text
                    severity="danger"
                    icon="pi pi-trash"
                    class="!text-xs"
                    @click="emit('delete', booking)"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-white/60 px-6 text-center">
          <div class="text-4xl opacity-25">🗓️</div>
          <div class="mt-3 text-lg font-semibold text-slate-700">
            {{ isLoading ? 'Loading deck log...' : 'No bookings in today\'s PT deck.' }}
          </div>
          <p class="mt-1 text-sm text-slate-500">
            {{ isLoading ? 'Please wait a moment.' : 'Try another clinic date or book a new appointment.' }}
          </p>
        </div>
      </div>

      <div class="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <div class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <i class="pi pi-bolt" />
          <span>{{ deckConfigurationLabel }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <div :class="summaryFieldClass">
        <div class="text-sm text-slate-500">Time Slot</div>
        <div class="mt-1.5 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <span>{{ focusTimeSlot }}</span>
          <i class="pi pi-chevron-down text-xs text-slate-400" />
        </div>
      </div>

      <div :class="summaryFieldClass">
        <div class="text-sm text-slate-500">Referring Doctor</div>
        <div class="mt-1.5 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <span class="truncate">{{ focusReferringDoctor }}</span>
          <i class="pi pi-chevron-down text-xs text-slate-400" />
        </div>
      </div>

      <div :class="summaryFieldClass">
        <div class="text-sm text-slate-500">Primary PT</div>
        <div class="mt-1.5 rounded-xl border border-sky-300 bg-sky-50 p-1.5">
          <div class="flex flex-wrap gap-1">
            <button
              v-for="provider in providerOptions"
              :key="provider"
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
              :class="selectedProviderName === provider
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-700 hover:bg-sky-100'"
              @click="selectedProviderName = provider"
            >
              {{ provider }}
            </button>
          </div>
        </div>
      </div>

      <div :class="summaryFieldClass">
        <div class="text-sm text-slate-500">Assistant/Intern</div>
        <div class="mt-1.5 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <span class="truncate">{{ focusSupportStaff }}</span>
          <i class="pi pi-chevron-down text-xs text-slate-400" />
        </div>
      </div>
    </div>

    <div class="mt-3 grid gap-2 md:grid-cols-2">
      <Button label="Book Appointment" class="!rounded-full !border-0 !bg-slate-200 !px-4 !py-2 !font-medium !text-slate-700 hover:!bg-slate-300" @click="emit('create')" />
      <Button label="Clear Log" class="!rounded-full !border-0 !bg-slate-200 !px-4 !py-2 !font-medium !text-slate-700 hover:!bg-slate-300" @click="clearDeckFocus" />
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref, watch} from "vue";
import Button from "primevue/button";
import type {
  AppointmentLocationContext,
  AppointmentPhase,
  DailyPtDeckBlock,
  DailyPtDeckGroup
} from "@/features/appointments/api/appointment-phase1.service";

const props = defineProps<{
  groups: DailyPtDeckGroup[]
  selectedAppointmentId?: number
  canDeleteAppointments: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
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
const clearedFocus = ref(false)
const selectedProviderName = ref<string>("ALL")

const providerOptions = computed(() => {
  const names = new Set<string>()
  allAppointments.value.forEach(appointment => {
    const providerName = appointment.pt?.name?.trim() || appointment.doctor_name?.trim()
    if (providerName) names.add(providerName)
  })
  return ["ALL", ...Array.from(names)]
})

watch(
  providerOptions,
  (options) => {
    if (!options.includes(selectedProviderName.value)) {
      selectedProviderName.value = "ALL"
    }
  },
  {immediate: true}
)

watch(
  () => props.selectedAppointmentId,
  (value) => {
    if (value != null) clearedFocus.value = false
  }
)

const isStartingWithinOneHour = (appointment: DailyPtDeckBlock): boolean => {
  const now = Date.now()
  const startsAt = new Date(appointment.start).getTime()
  const remainingMs = startsAt - now
  return remainingMs >= 0 && remainingMs <= 60 * 60 * 1000
}
const displayedAppointments = computed(() =>
  selectedProviderName.value === "ALL"
    ? allAppointments.value
    : allAppointments.value.filter(appointment => {
      const providerName = appointment.pt?.name?.trim() || appointment.doctor_name?.trim() || ""
      return providerName === selectedProviderName.value
    })
)
const pendingAppointmentsCount = computed(() =>
  displayedAppointments.value.filter(appointment => normalizeAppointmentStatus(appointment.status) === "PENDING").length
)
const completedAppointmentsCount = computed(() =>
  displayedAppointments.value.filter(appointment => normalizeAppointmentStatus(appointment.status) === "COMPLETED").length
)
const billingAttentionCount = computed(() =>
  displayedAppointments.value.filter(appointment => needsBillingAttention(appointment.billing_status)).length
)
const rescheduledAppointmentsCount = computed(() =>
  displayedAppointments.value.filter(appointment => Number(appointment.reschedule_count ?? 0) > 0).length
)
const deckFocus = computed(() => {
  if (clearedFocus.value) return undefined
  const selected = props.selectedAppointmentId == null
    ? undefined
    : allAppointments.value.find(appointment => appointment.id === props.selectedAppointmentId)
  return selected ?? displayedAppointments.value[0] ?? allAppointments.value[0]
})
const summaryFieldClass = "rounded-2xl"
const deckModeShortLabel = computed(() =>
  displayedAppointments.value.some(appointment => appointment.support_staff?.name) ? "Efficient" : "Standard"
)
const deckModeDescription = computed(() =>
  deckModeShortLabel.value === "Efficient"
    ? "High-Efficiency Mode: 30-minute overlap booking enabled"
    : "Standard Mode: one patient per primary PT time slot"
)
const deckConfigurationLabel = computed(() =>
  deckModeShortLabel.value === "Efficient"
    ? "Current Configuration: High-Efficiency (30m)"
    : "Current Configuration: Standard Deck"
)
const deckProviderName = computed(() =>
  (selectedProviderName.value !== "ALL" ? selectedProviderName.value : undefined)
  || deckFocus.value?.pt?.name?.trim()
  || props.groups.find(group => group.doctor_name?.trim())?.doctor_name?.trim()
  || "Unassigned"
)
const focusTimeSlot = computed(() => deckFocus.value ? formatSingleTime(deckFocus.value.start) : "Select slot")
const focusReferringDoctor = computed(() => deckFocus.value?.referring_doctor?.name?.trim() || "No referring doctor")
const focusPrimaryPt = computed(() => selectedProviderName.value === "ALL"
  ? (deckFocus.value?.pt?.name?.trim() || "Needs PT")
  : selectedProviderName.value
)
const focusSupportStaff = computed(() => deckFocus.value?.support_staff?.name?.trim() || "No assistant")

const normalizeAppointmentStatus = (status?: string): string =>
  (status || "PENDING").trim().toUpperCase().split(" ").join("_")
const appointmentSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeAppointmentStatus(status)
  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger"
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
const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}
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
const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  })
const formatSingleTime = (value: string): string => formatTime(value)
const bookingStatusBarClass = (booking: DailyPtDeckBlock): string => {
  const normalized = normalizeAppointmentStatus(booking.status)
  if (normalized === "COMPLETED") return "bg-emerald-500"
  if (normalized === "RESCHEDULED") return "bg-amber-500"
  if (needsBillingAttention(booking.billing_status)) return "bg-red-500"
  return "bg-green-600"
}
const careTeamBadge = (booking: DailyPtDeckBlock): string => {
  const names = [booking.pt?.name, booking.support_staff?.name].filter(Boolean)
  if (!names.length) return "PT Pending"
  return names.join(" + ").toUpperCase()
}
const modeForBooking = (booking: DailyPtDeckBlock): string => booking.support_staff?.name ? "High-Efficiency" : "Standard"
const handleSelect = (booking: DailyPtDeckBlock): void => {
  clearedFocus.value = false
  emit("select", booking)
}
const clearDeckFocus = (): void => {
  clearedFocus.value = true
  selectedProviderName.value = "ALL"
}
</script>
