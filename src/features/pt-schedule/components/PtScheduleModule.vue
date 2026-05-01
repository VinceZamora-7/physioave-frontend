<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">My Schedule</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            See only your active and upcoming schedules in one place so you can check where you need to go next.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Signed in as: {{ currentUser?.name || "Physical Therapist" }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Role: {{ currentUser?.role_name || "Unknown role" }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :pt="ptOutlinedBtn" :loading="isLoading" @click="refreshSchedule" />
        </div>
      </div>
    </section>

    <Message v-if="loadError" severity="error" :closable="false">
      {{ loadError }}
    </Message>

    <Message v-else-if="!canUseDashboard" severity="info" :closable="false">
      This dashboard is only available for Physical Therapist accounts.
    </Message>

    <template v-else>
      <section class="app-section-card-comfy space-y-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Upcoming Visits</div>
            <div class="mt-2 text-2xl font-semibold">{{ appointments.length }}</div>
          </article>
          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Today</div>
            <div class="mt-2 text-2xl font-semibold">{{ todaysAppointmentsCount }}</div>
          </article>
          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Home Care</div>
            <div class="mt-2 text-2xl font-semibold">{{ homeCareAppointmentsCount }}</div>
          </article>
          <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <div class="text-xs uppercase tracking-wide opacity-55">Clinic Branches</div>
            <div class="mt-2 text-2xl font-semibold">{{ clinicCount }}</div>
          </article>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Next Visit</div>
          <div v-if="nextAppointment" class="mt-2 space-y-1">
            <div class="text-lg font-semibold">{{ nextAppointment.patient_name }}</div>
            <div class="text-sm opacity-75">{{ formatDateTimeRange(nextAppointment.starts_at, nextAppointment.ends_at) }}</div>
            <div class="text-sm opacity-75">
              {{ nextAppointment.location_context === "HOME_CARE" ? "Home Care" : nextAppointment.clinic_name }}
            </div>
          </div>
          <div v-else class="mt-2 text-sm opacity-70">
            No upcoming schedules yet.
          </div>
        </div>
      </section>

      <section class="app-section-card-comfy space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="app-section-title">Schedule View</h3>
            <p class="text-sm opacity-70">Switch between your route list and a calendar view with highlighted schedule days.</p>
          </div>
          <SelectButton
            v-model="scheduleViewMode"
            :options="scheduleViewModeOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
        </div>
      </section>

      <section v-if="scheduleViewMode === 'list'" class="app-section-card-comfy space-y-4">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h3 class="app-section-title">Upcoming Route</h3>
            <p class="text-sm opacity-70">Only your current and future schedules are shown here.</p>
          </div>
          <span class="text-xs uppercase tracking-wide opacity-55">{{ groupedSchedules.length }} day{{ groupedSchedules.length === 1 ? "" : "s" }}</span>
        </div>

        <div v-if="isLoading" class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-10 text-center text-sm opacity-70">
          Loading your schedule...
        </div>

        <div v-else-if="!groupedSchedules.length" class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-10 text-center">
          <div class="font-medium">No future schedules found.</div>
          <p class="mt-1 text-sm opacity-70">Your next appointments will appear here automatically.</p>
        </div>

        <div v-else class="space-y-4">
          <section
            v-for="group in groupedSchedules"
            :key="group.dateKey"
            class="space-y-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-base font-semibold">{{ group.label }}</div>
                <div class="text-sm opacity-70">{{ group.appointments.length }} visit{{ group.appointments.length === 1 ? "" : "s" }}</div>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">{{ group.homeCareCount }} Home Care</span>
                <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">{{ group.clinicCount }} Clinic{{ group.clinicCount === 1 ? "" : "s" }}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <article
                v-for="appointment in group.appointments"
                :key="appointment.id"
                class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">
                      {{ formatTimeRange(appointment.starts_at, appointment.ends_at) }}
                    </div>
                    <div class="mt-1 text-lg font-semibold text-[rgb(var(--app-fg))]">
                      {{ appointment.patient_name }}
                    </div>
                    <div class="mt-1 text-sm text-[rgb(var(--app-fg))]/65">
                      {{ appointment.location_context === "HOME_CARE" ? `Home Care - ${appointment.clinic_name}` : appointment.clinic_name }}
                    </div>
                  </div>
                  <Tag :value="displayAppointmentStatus(appointment.appointment_status)" :severity="appointmentSeverity(appointment.appointment_status)" />
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <Tag :value="displayAppointmentPhase(appointment.appointment_phase)" :severity="appointmentPhaseSeverity(appointment.appointment_phase)" />
                  <Tag :value="displayLocationContext(appointment.location_context)" :severity="appointmentLocationContextSeverity(appointment.location_context)" />
                  <Tag :value="displayBillingStatus(appointment.billing_status)" :severity="billingSeverity(appointment.billing_status)" />
                  <Tag v-if="appointment.specialty_tag_name" :value="appointment.specialty_tag_name" severity="info" />
                </div>

                <div class="mt-3 space-y-2 text-sm text-[rgb(var(--app-fg))]/70">
                  <div v-if="appointment.treatment_area_name" class="flex items-center gap-2">
                    <span class="font-medium">Room:</span>
                    <TreatmentAreaChip :name="appointment.treatment_area_name" :color="appointment.treatment_area_color" />
                  </div>
                  <div v-if="appointment.reschedule_count > 0">
                    <span class="font-medium">Reschedules:</span> {{ appointment.reschedule_count }}
                  </div>
                </div>

                <Button
                  :label="ptCompletionButtonLabel(appointment)"
                  icon="pi pi-file-edit"
                  class="mt-4 w-full"
                  :pt="ptPrimaryBtn"
                  @click="openPtCompletionDialog(appointment)"
                />
              </article>
            </div>
          </section>
        </div>
      </section>

      <section v-else class="app-section-card-comfy space-y-4">
        <div class="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span class="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 dark:border-red-500/20 dark:bg-red-500/10">
            <span class="h-2.5 w-2.5 rounded-full bg-red-500 dark:bg-red-300" />
            Red: Unfinished and unbilled
          </span>
          <span class="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-500/20 dark:bg-blue-500/10">
            <span class="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-300" />
            Blue: Scheduled but not fully paid
          </span>
          <span class="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 dark:border-orange-500/20 dark:bg-orange-500/10">
            <span class="h-2.5 w-2.5 rounded-full bg-orange-500 dark:bg-orange-300" />
            Orange: Unfinished but billed
          </span>
          <span class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 dark:border-amber-500/20 dark:bg-amber-500/10">
            <span class="h-2.5 w-2.5 rounded-full bg-amber-500 dark:bg-amber-300" />
            Yellow: Multi-session already billed
          </span>
          <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
            Green: Finished and billed
          </span>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
            <DatePicker
              v-model="selectedCalendarDate"
              inline
              fluid
              :manualInput="false"
            >
              <template #date="slotProps">
                <div :class="calendarDayCellClass(slotProps.date)">
                  <span>{{ slotProps.date.day }}</span>
                  <span
                    v-if="getCalendarDayStatus(slotProps.date)"
                    :class="calendarDayDotClass(slotProps.date)"
                  />
                </div>
              </template>
            </DatePicker>
          </div>

          <div class="space-y-3">
            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
              <div class="text-xs uppercase tracking-wide opacity-55">Selected Day</div>
              <div class="mt-2 text-lg font-semibold">{{ selectedCalendarDayLabel }}</div>
              <div class="mt-1 text-sm opacity-70">
                {{ selectedCalendarDayAppointments.length }} visit{{ selectedCalendarDayAppointments.length === 1 ? "" : "s" }} scheduled
              </div>
            </div>

            <div v-if="selectedCalendarDayAppointments.length" class="space-y-3">
              <article
                v-for="appointment in selectedCalendarDayAppointments"
                :key="appointment.id"
                class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--app-fg))]/50">
                      {{ formatTimeRange(appointment.starts_at, appointment.ends_at) }}
                    </div>
                    <div class="mt-1 text-lg font-semibold text-[rgb(var(--app-fg))]">
                      {{ appointment.patient_name }}
                    </div>
                    <div class="mt-1 text-sm text-[rgb(var(--app-fg))]/65">
                      {{ appointment.location_context === "HOME_CARE" ? `Home Care - ${appointment.clinic_name}` : appointment.clinic_name }}
                    </div>
                  </div>
                  <Tag :value="displayAppointmentStatus(appointment.appointment_status)" :severity="appointmentSeverity(appointment.appointment_status)" />
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <Tag :value="displayAppointmentPhase(appointment.appointment_phase)" :severity="appointmentPhaseSeverity(appointment.appointment_phase)" />
                  <Tag :value="displayLocationContext(appointment.location_context)" :severity="appointmentLocationContextSeverity(appointment.location_context)" />
                  <Tag :value="displayBillingStatus(appointment.billing_status)" :severity="billingSeverity(appointment.billing_status)" />
                  <Tag v-if="appointment.specialty_tag_name" :value="appointment.specialty_tag_name" severity="info" />
                </div>

                <Button
                  :label="ptCompletionButtonLabel(appointment)"
                  icon="pi pi-file-edit"
                  class="mt-4 w-full"
                  :pt="ptPrimaryBtn"
                  @click="openPtCompletionDialog(appointment)"
                />
              </article>
            </div>

            <div v-else class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-10 text-center">
              <div class="font-medium">No schedules on this day.</div>
              <p class="mt-1 text-sm opacity-70">Pick a highlighted date to review the visits planned for that day.</p>
            </div>
          </div>
        </div>
      </section>
    </template>

    <Dialog
      v-model:visible="ptCompletionVisible"
      modal
      header="PT Session Sign-Off"
      :style="{width:'620px'}"
      :breakpoints="{'1024px':'94vw','768px':'100vw'}"
    >
      <div v-if="selectedPtAppointmentDetail" class="space-y-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
          <div class="text-sm font-semibold text-[rgb(var(--app-fg))]">Session Completion</div>
          <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/65">
            Add your PT signature to confirm the session was completed. Saving here also marks the appointment as completed.
          </p>
          <div class="mt-4 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Date</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ formatDateTimeRange(selectedPtAppointmentDetail.starts_at, selectedPtAppointmentDetail.ends_at) }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">PT Name</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ selectedPtAppointmentProviderLabel }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Patient</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ selectedPtAppointmentDetail.patient_name }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Status</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ displayAppointmentStatus(selectedPtAppointmentDetail.appointment_status) }}</div>
            </div>
          </div>
          <div v-if="selectedPtEncounterTicketHasSignature" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Existing PT sign-off captured
            <span v-if="selectedPtEncounterTicket?.pt_confirmed_at">
              on {{ new Date(selectedPtEncounterTicket.pt_confirmed_at).toLocaleString("en-PH") }}
            </span>
            .
          </div>
          <div v-if="isSelectedPtEncounterTicketLocked" class="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            The patient encounter ticket is already locked, so the PT sign-off is now view-only.
          </div>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Completion Tag / Note</div>
          <div class="mt-2 text-sm text-[rgb(var(--app-fg))]/65">
            Add a short handoff note if needed, like completed at home care location or assisted transfer done.
          </div>
          <InputText
            v-model="ptCompletionTag"
            fluid
            class="mt-4"
            :disabled="isSelectedPtEncounterTicketLocked"
            placeholder="Optional PT completion tag"
          />
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">PT Signature</div>
          <div class="mt-2 text-sm text-[rgb(var(--app-fg))]/65">
            {{ isSelectedPtEncounterTicketLocked
              ? "This stored PT signature is shown for audit review only."
              : "Sign below to confirm the session was completed." }}
          </div>
          <div class="mt-4">
            <PatientSignaturePad v-model="ptCompletionSignatureDataUrl" :disabled="isSelectedPtEncounterTicketLocked" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="isSelectedPtEncounterTicketLocked ? 'Close' : 'Cancel'" text @click="ptCompletionVisible = false" />
        <Button
          v-if="!isSelectedPtEncounterTicketLocked"
          label="Save PT Sign-Off"
          icon="pi pi-check"
          :loading="isPtCompletionSaving"
          :pt="ptPrimaryBtn"
          @click="submitPtCompletion"
        />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from "vue"
import {useToast} from "primevue/usetoast"
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import SelectButton from "primevue/selectbutton"
import Tag from "primevue/tag"
import PatientSignaturePad from "@/features/appointments/components/PatientSignaturePad.vue"
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue"
import {
  appointmentPhase1Service,
  type AppointmentDetail,
  type AppointmentEncounterTicket,
  type AppointmentListItem,
  type AppointmentLocationContext,
  type AppointmentPhase,
  type AppointmentPtCompletionPayload
} from "@/features/appointments/api/appointment-phase1.service"
import {authMeService, type AuthMe} from "@/services/auth-me.service"
import {getApiErrorMessage} from "@/utils/actionable-error.util"
import {errorToast, successToast} from "@/utils/toast.util"
import {ptOutlinedBtn, ptPrimaryBtn} from "@/features/shared/table-header.styles"

const toast = useToast()

const currentUser = ref<AuthMe>()
const appointments = ref<AppointmentListItem[]>([])
const isLoading = ref(false)
const loadError = ref("")
const selectedCalendarDate = ref<Date>(new Date())
const ptCompletionVisible = ref(false)
const isPtCompletionSaving = ref(false)
const selectedPtAppointmentDetail = ref<AppointmentDetail>()
const ptCompletionCompletedAt = ref<Date>(new Date())
const ptCompletionTag = ref("")
const ptCompletionSignatureDataUrl = ref("")

type ScheduleViewMode = "list" | "calendar"
const scheduleViewMode = ref<ScheduleViewMode>("list")
const scheduleViewModeOptions: Array<{label: string; value: ScheduleViewMode}> = [
  {label: "Route List", value: "list"},
  {label: "Calendar", value: "calendar"}
]

type CalendarSlotDate = {
  year: number
  month: number
  day: number
  today?: boolean
  selectable?: boolean
}

type CalendarDayStatus =
  | "unfinished_unbilled"
  | "scheduled_partially_paid"
  | "unfinished_billed"
  | "multi_session_billed"
  | "finished_billed"

const canUseDashboard = computed(() => currentUser.value?.appointment_provider_type === "PHYSICAL_THERAPIST")
const nextAppointment = computed(() => appointments.value[0])
const selectedPtEncounterTicket = computed(() => selectedPtAppointmentDetail.value?.encounter_ticket)
const isSelectedPtEncounterTicketLocked = computed(() =>
  Boolean(selectedPtEncounterTicket.value?.record_locked) &&
  Boolean(selectedPtEncounterTicket.value?.pt_signature_data_url?.trim())
)
const selectedPtEncounterTicketHasSignature = computed(() => Boolean(selectedPtEncounterTicket.value?.pt_signature_data_url?.trim()))
const todaysAppointmentsCount = computed(() => {
  const todayKey = formatDateKey(new Date())
  return appointments.value.filter(appointment => formatDateKey(new Date(appointment.starts_at)) === todayKey).length
})
const homeCareAppointmentsCount = computed(() =>
  appointments.value.filter(appointment => appointment.location_context === "HOME_CARE").length
)
const clinicCount = computed(() =>
  new Set(appointments.value.map(appointment => appointment.clinic_id)).size
)
const selectedCalendarDateKey = computed(() => formatDateKey(selectedCalendarDate.value))
const scheduleDayMap = computed(() => {
  const days = new Map<string, AppointmentListItem[]>()

  for (const appointment of appointments.value) {
    const dateKey = formatDateKey(new Date(appointment.starts_at))
    const existing = days.get(dateKey) ?? []
    existing.push(appointment)
    days.set(dateKey, existing)
  }

  return days
})
const selectedCalendarDayAppointments = computed(() =>
  [...(scheduleDayMap.value.get(selectedCalendarDateKey.value) ?? [])]
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
)
const selectedCalendarDayLabel = computed(() =>
  selectedCalendarDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)
const calendarDayStatusMap = computed(() => {
  const statuses = new Map<string, CalendarDayStatus>()

  for (const [dateKey, dayAppointments] of scheduleDayMap.value.entries()) {
    const status = classifyCalendarDayStatus(dayAppointments)
    if (status) {
      statuses.set(dateKey, status)
    }
  }

  return statuses
})

type ScheduleDayGroup = {
  dateKey: string
  label: string
  appointments: AppointmentListItem[]
  homeCareCount: number
  clinicCount: number
}

const groupedSchedules = computed<ScheduleDayGroup[]>(() => {
  const groups = new Map<string, AppointmentListItem[]>()

  for (const appointment of appointments.value) {
    const dateKey = formatDateKey(new Date(appointment.starts_at))
    const existing = groups.get(dateKey) ?? []
    existing.push(appointment)
    groups.set(dateKey, existing)
  }

  return [...groups.entries()].map(([dateKey, groupedAppointments]) => ({
    dateKey,
    label: formatScheduleGroupLabel(dateKey),
    appointments: groupedAppointments,
    homeCareCount: groupedAppointments.filter(appointment => appointment.location_context === "HOME_CARE").length,
    clinicCount: new Set(groupedAppointments.map(appointment => appointment.clinic_id)).size
  }))
})
const selectedPtAppointmentProviderLabel = computed(() =>
  selectedPtEncounterTicket.value?.pt_confirmed_by_name?.trim()
    || selectedPtAppointmentDetail.value?.doctor_name?.trim()
    || currentUser.value?.name
    || "Assigned Physical Therapist"
)

const calendarDayStatusStyles: Record<CalendarDayStatus, {cell: string; dot: string}> = {
  unfinished_unbilled: {
    cell: "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-300"
  },
  scheduled_partially_paid: {
    cell: "bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-300"
  },
  unfinished_billed: {
    cell: "bg-orange-100 text-orange-800 ring-1 ring-orange-300 dark:bg-orange-500/20 dark:text-orange-100 dark:ring-orange-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-300"
  },
  multi_session_billed: {
    cell: "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-300"
  },
  finished_billed: {
    cell: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300"
  }
}

const refreshSchedule = async (): Promise<void> => {
  isLoading.value = true
  loadError.value = ""

  try {
    currentUser.value = await authMeService.get()

    if (!currentUser.value) {
      loadError.value = "Could not load the current user."
      appointments.value = []
      return
    }

    if (currentUser.value.appointment_provider_type !== "PHYSICAL_THERAPIST") {
      appointments.value = []
      return
    }

    appointments.value = await appointmentPhase1Service.getMyUpcoming({limit: 200}) ?? []
    if (appointments.value.length) {
      const currentDayStillHasSchedules = scheduleDayMap.value.has(selectedCalendarDateKey.value)
      if (!currentDayStillHasSchedules) {
        selectedCalendarDate.value = new Date(appointments.value[0].starts_at)
      }
    }
  } catch (error: unknown) {
    appointments.value = []
    loadError.value = extractMessage(error)
    errorToast(toast, loadError.value)
  } finally {
    isLoading.value = false
  }
}

const extractMessage = (error: unknown): string => {
  return getApiErrorMessage(error, {
    baseMessage: "Failed to load your upcoming schedule",
    permissionHint: "Appointment read access for PT schedule",
    invalidInputHint: "Schedule filters are invalid. Refresh and try again.",
    retryHint: "Please try again."
  })
}

const seedPtCompletionForm = (ticket?: AppointmentEncounterTicket): void => {
  ptCompletionCompletedAt.value = ticket?.pt_confirmed_at ? new Date(ticket.pt_confirmed_at) : new Date()
  ptCompletionTag.value = ticket?.pt_completion_tag ?? ""
  ptCompletionSignatureDataUrl.value = ticket?.pt_signature_data_url ?? ""
}

const openPtCompletionDialog = async (appointment: AppointmentListItem): Promise<void> => {
  try {
    const detail = await appointmentPhase1Service.getById(appointment.id)
    if (!detail) {
      errorToast(toast, "Failed to load the selected appointment")
      return
    }

    selectedPtAppointmentDetail.value = detail
    seedPtCompletionForm(detail.encounter_ticket)
    ptCompletionVisible.value = true
  } catch (error: unknown) {
    errorToast(toast, extractMessage(error))
  }
}

const submitPtCompletion = async (): Promise<void> => {
  if (!selectedPtAppointmentDetail.value) return
  if (!ptCompletionSignatureDataUrl.value.trim()) {
    errorToast(toast, "PT signature is required before saving the session sign-off")
    return
  }

  const appointmentId = selectedPtAppointmentDetail.value.id
  const payload: AppointmentPtCompletionPayload = {
    completed_at: ptCompletionCompletedAt.value.toISOString(),
    pt_signature_data_url: ptCompletionSignatureDataUrl.value,
    pt_completion_tag: ptCompletionTag.value.trim() || undefined
  }

  try {
    isPtCompletionSaving.value = true
    await appointmentPhase1Service.processPtCompletion(appointmentId, payload)
    successToast(toast, "PT sign-off saved and the appointment is now marked completed")
    ptCompletionVisible.value = false
    await refreshSchedule()
  } catch (error: unknown) {
    errorToast(toast, extractMessage(error))
  } finally {
    isPtCompletionSaving.value = false
  }
}

const formatDateKey = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatScheduleGroupLabel = (dateKey: string): string => {
  const parsed = new Date(`${dateKey}T00:00:00`)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const normalizedTarget = formatDateKey(parsed)
  if (normalizedTarget === formatDateKey(today)) return "Today"
  if (normalizedTarget === formatDateKey(tomorrow)) return "Tomorrow"

  return parsed.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  })
}

const formatTimeRange = (startsAt: string, endsAt: string): string =>
  `${formatTime(startsAt)} - ${formatTime(endsAt)}`

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  })

const formatDateTimeRange = (startsAt: string, endsAt: string): string =>
  `${new Date(startsAt).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric"
  })} - ${formatTimeRange(startsAt, endsAt)}`

const ptCompletionButtonLabel = (appointment: AppointmentListItem): string =>
  isFinishedAppointmentStatus(appointment.appointment_status)
    ? "Review PT Sign-Off"
    : "Complete and Sign"

const normalizeAppointmentStatus = (status?: string): string =>
  (status || "PENDING").trim().toUpperCase().split(" ").join("_")
const normalizeBillingTypeForCalendar = (value?: string): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")
const normalizeServiceTypeForCalendar = (value?: string): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")
const displayAppointmentStatus = (status?: string): string =>
  normalizeAppointmentStatus(status).split("_").join(" ")
const displayBillingStatus = (status?: string): string =>
  (status?.trim() || "UNBILLED").toUpperCase()
const isFullyBilledStatus = (status?: string): boolean => {
  const normalized = displayBillingStatus(status)
  return normalized === "PAID" || normalized === "BILLED"
}
const isPartiallyPaidStatus = (status?: string): boolean => displayBillingStatus(status) === "PARTIAL"
const isUnbilledStatus = (status?: string): boolean => {
  const normalized = displayBillingStatus(status)
  return normalized === "UNBILLED" || normalized === "PENDING"
}
const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}
const displayLocationContext = (locationContext?: AppointmentLocationContext): string => {
  if (locationContext === "HOME_CARE") return "HOME CARE"
  return "IN-CLINIC"
}
const appointmentSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeAppointmentStatus(status)
  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger"
  return "info"
}
const billingSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = displayBillingStatus(status)
  if (normalized === "PAID" || normalized === "BILLED") return "success"
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
const isFinishedAppointmentStatus = (status?: string): boolean => {
  const normalized = normalizeAppointmentStatus(status)
  return normalized === "COMPLETED" || normalized === "CANCELLED" || normalized === "NO_SHOW"
}
const isMultiSessionAppointment = (appointment: AppointmentListItem): boolean => {
  const normalizedBillingType = normalizeBillingTypeForCalendar(appointment.billing_type)
  const normalizedServiceType = normalizeServiceTypeForCalendar(appointment.service_type)

  return normalizedServiceType === "PACKAGE"
    || normalizedBillingType === "SELF_PAY_PACKAGE"
}
const classifyCalendarDayStatus = (rows: AppointmentListItem[]): CalendarDayStatus | null => {
  if (!rows.length) return null

  if (rows.some(row => !isFinishedAppointmentStatus(row.appointment_status) && isUnbilledStatus(row.billing_status))) {
    return "unfinished_unbilled"
  }

  if (rows.some(row => isPartiallyPaidStatus(row.billing_status))) {
    return "scheduled_partially_paid"
  }

  if (rows.some(row => isMultiSessionAppointment(row) && isFullyBilledStatus(row.billing_status))) {
    return "multi_session_billed"
  }

  if (rows.some(row => !isFinishedAppointmentStatus(row.appointment_status) && isFullyBilledStatus(row.billing_status))) {
    return "unfinished_billed"
  }

  if (rows.every(row => isFinishedAppointmentStatus(row.appointment_status) && isFullyBilledStatus(row.billing_status))) {
    return "finished_billed"
  }

  return "unfinished_unbilled"
}
const formatCalendarDateKey = (year: number, monthOneBased: number, day: number): string =>
  `${year}-${String(monthOneBased).padStart(2, "0")}-${String(day).padStart(2, "0")}`
const getCalendarDateCandidateKeys = (date: CalendarSlotDate): string[] => {
  const candidateKeys = new Set<string>()
  const year = Number(date.year)
  const month = Number(date.month)
  const day = Number(date.day)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return []
  }

  if (month >= 0 && month <= 11) {
    candidateKeys.add(formatCalendarDateKey(year, month + 1, day))
  }

  if (month >= 1 && month <= 12) {
    candidateKeys.add(formatCalendarDateKey(year, month, day))
  }

  return [...candidateKeys]
}
const getCalendarDayStatus = (date: CalendarSlotDate): CalendarDayStatus | null => {
  const candidateKey = getCalendarDateCandidateKeys(date)
    .find(key => calendarDayStatusMap.value.has(key))

  return candidateKey ? calendarDayStatusMap.value.get(candidateKey) ?? null : null
}
const calendarDayCellClass = (date: CalendarSlotDate): string[] => {
  const dayStatus = getCalendarDayStatus(date)
  return [
    "relative flex h-full min-h-8 w-full items-center justify-center rounded-xl px-1 text-sm font-medium transition-colors",
    dayStatus ? calendarDayStatusStyles[dayStatus].cell : "",
    date.today ? "ring-2 ring-slate-400/70 dark:ring-slate-300/60" : ""
  ]
}
const calendarDayDotClass = (date: CalendarSlotDate): string => {
  const dayStatus = getCalendarDayStatus(date)
  return dayStatus ? calendarDayStatusStyles[dayStatus].dot : ""
}

onMounted(() => {
  void refreshSchedule()
})
</script>
