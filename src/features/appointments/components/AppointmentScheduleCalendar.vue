<template>
  <section class="app-appointment-card space-y-4">
    <!-- Shared header with toggle -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="app-appointment-title text-lg">
            {{ calendarView === 'weekly' ? 'Weekly Schedule' : 'Clinic Calendar' }}
          </h3>
          <div class="flex overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-slate-700">
            <button
              class="px-3 py-1.5 font-medium transition-colors"
              :class="calendarView === 'weekly' ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
              @click="calendarView = 'weekly'"
            >
              <i class="pi pi-calendar mr-1 text-[10px]" />Weekly
            </button>
            <button
              class="border-l border-slate-200 px-3 py-1.5 font-medium transition-colors dark:border-slate-700"
              :class="calendarView === 'monthly' ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
              @click="calendarView = 'monthly'"
            >
              <i class="pi pi-calendar-clock mr-1 text-[10px]" />Monthly
            </button>
          </div>
        </div>
        <p class="app-appointment-muted max-w-2xl text-sm leading-6">
          {{ calendarView === 'weekly' ? 'PT assignments grouped by appointment status.' : 'View appointment availability and daily status tags for the selected branch.' }}
        </p>
        <div v-if="calendarView === 'monthly'" class="flex flex-wrap gap-2 pt-1 text-xs">
          <span class="app-appointment-chip">Selected: {{ selectedDateLabel }}</span>
          <span v-if="selectedClinicScheduleLabel" class="app-appointment-chip">{{ selectedClinicScheduleLabel }}</span>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="app-appointment-branch-pill">
          Branch:
          <span class="app-appointment-value font-medium">{{ selectedClinic?.name || "No branch selected" }}</span>
        </div>
        <div v-if="calendarView === 'weekly'" class="flex items-center gap-1">
          <Button icon="pi pi-chevron-left" text size="small" rounded @click="prevWeek" />
          <span class="min-w-[190px] text-center text-sm font-medium text-slate-600 dark:text-slate-300">
            {{ weekRangeLabel }}
          </span>
          <Button icon="pi pi-chevron-right" text size="small" rounded @click="nextWeek" />
        </div>
      </div>
    </div>

    <!-- Legend (shared) -->
    <div class="app-appointment-muted flex flex-wrap gap-2 text-xs">
      <span class="app-appointment-legend app-appointment-legend-success">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-success" />
        Completed
      </span>
      <span class="app-appointment-legend app-appointment-legend-warning">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-warning" />
        Pending
      </span>
      <span class="app-appointment-legend app-appointment-legend-muted">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-muted" />
        Canceled
      </span>
    </div>

    <!-- Weekly Schedule -->
    <div
      v-if="calendarView === 'weekly'"
      class="relative overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] shadow-sm"
    >
      <!-- Loading overlay -->
      <div
        v-if="props.loading"
        class="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/60"
      >
        <div class="flex items-center gap-2 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3 text-sm font-medium shadow-sm">
          <i class="pi pi-spin pi-spinner text-violet-500" />
          <span class="text-[rgb(var(--app-fg))]/70">Loading weekly schedule...</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="min-w-[920px]">
          <!-- Sticky header row -->
          <div
            class="sticky top-0 z-20 grid border-b border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]/95 backdrop-blur"
            style="grid-template-columns: 88px repeat(7, minmax(110px, 1fr))"
          >
            <div
              class="flex items-center justify-center border-r border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-2 py-3 text-[11px] font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/45"
            >
              Time
            </div>

            <button
              v-for="day in weekDays"
              :key="day.dateStr"
              type="button"
              class="group min-w-0 border-r border-[rgb(var(--app-border))] px-2 py-3 text-center transition last:border-r-0 hover:bg-violet-50/70 dark:hover:bg-violet-500/10"
              :class="[
                day.dateStr === selectedDayStr
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                  : day.isToday
                    ? 'bg-sky-50/70 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                    : 'text-[rgb(var(--app-fg))]/70'
              ]"
              @click="localCalendarDate = day.date"
            >
              <div class="truncate text-[11px] font-bold uppercase tracking-widest">
                {{ day.weekdayLabel }}
              </div>

              <div
                :class="[
                  'relative mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition',
                  day.dateStr === selectedDayStr
                    ? 'bg-violet-600 text-white shadow-sm ring-4 ring-violet-100 dark:ring-violet-500/20'
                    : day.isToday
                      ? 'bg-sky-500 text-white shadow-sm ring-4 ring-sky-100 dark:ring-sky-500/20'
                      : 'text-[rgb(var(--app-fg))] group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-white/10'
                ]"
              >
                {{ day.date.getDate() }}
                <span
                  v-if="getWeeklyDayAppointmentCount(day.dateStr)"
                  class="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm"
                >
                  {{ getWeeklyDayAppointmentCount(day.dateStr) }}
                </span>
              </div>

              <div v-if="getWeeklyDayStatus(day.dateStr)" class="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                <span :class="getWeeklyDayDotClass(day.dateStr)" />
                <span>{{ getWeeklyDayStatusLabel(day.dateStr) }}</span>
              </div>
            </button>
          </div>

          <!-- Scrollable time rows -->
          <div class="max-h-[560px] overflow-y-auto">
            <div
              v-for="hour in weekHours"
              :key="hour"
              class="grid border-b border-[rgb(var(--app-border))]/70 last:border-b-0"
              style="grid-template-columns: 88px repeat(7, minmax(110px, 1fr))"
            >
              <!-- Time column -->
              <div
                class="sticky left-0 z-10 border-r border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-2 py-3 text-right"
              >
                <div class="text-xs font-bold text-[rgb(var(--app-fg))]/50">
                  {{ hour % 12 || 12 }}:00
                </div>
                <div class="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/35">
                  {{ hour < 12 ? 'AM' : 'PM' }}
                </div>
              </div>

              <!-- Day cells -->
              <div
                v-for="day in weekDays"
                :key="day.dateStr"
                :class="[
                  'min-h-[76px] border-r border-[rgb(var(--app-border))]/60 p-1.5 last:border-r-0 transition-colors',
                  day.dateStr === selectedDayStr
                    ? 'bg-violet-50/60 dark:bg-violet-500/10'
                    : day.isToday
                      ? 'bg-sky-50/50 dark:bg-sky-500/10'
                      : 'bg-[rgb(var(--app-card))] hover:bg-[rgb(var(--app-bg-soft))]'
                ]"
              >
                <div
                  v-for="appt in getApptsByHour(day.dateStr, hour)"
                  :key="appt.id"
                  class="group mb-1.5 cursor-pointer overflow-hidden rounded-xl border px-2.5 py-2 text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:opacity-80"
                  :class="getWeekSlotClass(appt)"
                  :title="`${appt.patient_name} - ${sessionLabel(appt)} - ${appt.provider_name ?? appt.doctor_name ?? 'Unassigned'} (${new Date(appt.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`"
                  @click="selectAppointment(appt)"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="truncate text-[12px] font-bold leading-tight">
                        {{ appt.provider_name ?? appt.doctor_name ?? 'Unassigned PT' }}
                      </div>

                      <div class="mt-1 truncate text-[11px] font-medium leading-tight opacity-85">
                        {{ appt.patient_name }}
                      </div>

                      <div class="mt-1 inline-flex max-w-full items-center rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-current/10 dark:bg-white/10">
                        {{ statusLabel(appt) }}
                      </div>

                      <div
                        v-if="hasMultipleSessions(appt)"
                        class="mt-1 inline-flex max-w-full items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-100 dark:ring-violet-400/30"
                      >
                        {{ sessionLabel(appt) }}
                      </div>
                    </div>

                    <i class="pi pi-chevron-right mt-0.5 text-[10px] opacity-0 transition group-hover:opacity-60" />
                  </div>

                  <div class="mt-2 flex items-center gap-1.5 text-[10px] font-semibold leading-tight opacity-70">
                    <i class="pi pi-clock text-[9px]" />
                    <span>
                      {{ new Date(appt.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }}
                      -
                      {{ new Date(appt.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Small legend / helper -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-2 text-xs text-[rgb(var(--app-fg))]/55">
        <span>
          Click a day header to select a date. Click an appointment card to view details.
        </span>

        <span class="font-semibold">
          Weekly View
        </span>
      </div>
    </div>

    <!-- Monthly Calendar -->
    <template v-else>
      <div class="overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] shadow-sm">
        <div class="flex flex-col gap-3 border-b border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-sm font-bold text-[rgb(var(--app-fg))]">
              {{ visibleMonthLabel }}
            </div>
            <div class="text-xs text-[rgb(var(--app-fg))]/55">
              Daily tags are based on appointment status.
            </div>
          </div>

          <div class="flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/25">
              Completed: {{ monthlyStatusSummary.completed }}
            </span>
            <span class="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/25">
              Pending: {{ monthlyStatusSummary.pending }}
            </span>
            <span class="rounded-full bg-slate-50 px-2.5 py-1 font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:ring-slate-500/30">
              Canceled: {{ monthlyStatusSummary.canceled }}
            </span>
          </div>
        </div>

        <div class="p-3 sm:p-4">
          <DatePicker
            v-model="localCalendarDate"
            inline
            fluid
            :manualInput="false"
            :disabledDays="calendarDisabledDays"
            @month-change="onCalendarMonthChange"
          >
            <template #date="slotProps">
              <div :class="calendarDayCellClass(slotProps.date)">
                <span>{{ slotProps.date.day }}</span>
                <span
                  v-if="getCalendarDayAppointmentCount(slotProps.date)"
                  class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm"
                >
                  {{ getCalendarDayAppointmentCount(slotProps.date) }}
                </span>
                <span
                  v-if="getCalendarDayStatus(slotProps.date)"
                  :class="calendarDayDotClass(slotProps.date)"
                />
              </div>
            </template>
          </DatePicker>
        </div>
      </div>
    </template>

    <div class="flex justify-end pt-1">
      <Button
        v-if="canAddAppointment"
        label="Add Appointment"
        icon="pi pi-plus"
        size="small"
        outlined
        :pt="ptPrimaryBtn"
        @click="emit('addAppointment')"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue"
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import type { AppointmentListItem } from "@/features/appointments/api/appointment-phase1.service"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

const props = withDefaults(defineProps<{
  appointments: AppointmentListItem[]
  loading?: boolean
  canAddAppointment?: boolean
  canViewAppointment?: boolean
}>(), {
  loading: false,
  canAddAppointment: true,
  canViewAppointment: true
})

const emit = defineEmits<{
  selectAppointment: [appointment: AppointmentListItem]
  selectDate: [date: Date]
  visibleRangeChange: [range: CalendarVisibleRange]
  addAppointment: []
}>()

type CalendarView = "weekly" | "monthly"
type CalendarSlotDate = {
  day: number
  month: number
  year: number
  today?: boolean
}
type MonthChangeEvent = {
  month: number
  year: number
}
type CalendarVisibleRange = {
  from: Date
  to: Date
}
type CalendarAppointmentStatus = "completed" | "pending" | "canceled"

const DEFAULT_WEEK_HOURS = Array.from({ length: 13 }, (_, index) => index + 7)
const calendarView = ref<CalendarView>("weekly")
const selectedDate = ref(new Date())
const visibleMonth = ref(new Date())
const calendarDisabledDays: number[] = []

const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

const startOfDay = (value: Date): Date => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const addDays = (value: Date, days: number): Date => {
  const date = startOfDay(value)
  date.setDate(date.getDate() + days)
  return date
}

const getVisibleRange = (): CalendarVisibleRange => {
  if (calendarView.value === "weekly") {
    return {
      from: startOfDay(weekStart.value),
      to: addDays(weekStart.value, 6)
    }
  }

  return {
    from: new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth(), 1),
    to: new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 0)
  }
}

const emitVisibleRange = (): void => {
  emit("visibleRangeChange", getVisibleRange())
}

const localCalendarDate = computed({
  get: () => selectedDate.value,
  set: (date: Date | null) => {
    if (!date) return
    selectedDate.value = new Date(date)
    visibleMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
    emit("selectDate", selectedDate.value)
    emitVisibleRange()
  }
})

const selectedDayStr = computed(() => dateKey(selectedDate.value))

const selectAppointment = (appointment: AppointmentListItem): void => {
  if (!props.canViewAppointment) return
  emit("selectAppointment", appointment)
}

const appointmentsByDate = computed(() => {
  const grouped = new Map<string, AppointmentListItem[]>()
  for (const appointment of props.appointments) {
    const key = dateKey(new Date(appointment.starts_at))
    const current = grouped.get(key) ?? []
    current.push(appointment)
    grouped.set(key, current)
  }
  return grouped
})

const selectedClinic = computed(() => {
  const first = props.appointments.find(appointment => appointment.clinic_id && appointment.clinic_name)
  return first ? { id: first.clinic_id, name: first.clinic_name } : null
})

const visibleMonthLabel = computed(() =>
  visibleMonth.value.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
)

const selectedDateLabel = computed(() =>
  selectedDate.value.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
)

const selectedClinicScheduleLabel = computed(() => {
  const items = appointmentsByDate.value.get(selectedDayStr.value) ?? []
  if (!items.length) return ""
  const packageSessions = items.filter(hasMultipleSessions).length
  const appointmentLabel = `${items.length} appointment${items.length === 1 ? "" : "s"}`
  if (!packageSessions) return appointmentLabel
  return `${appointmentLabel} · ${packageSessions} package session${packageSessions === 1 ? "" : "s"}`
})

const weekStart = computed(() => {
  const date = new Date(selectedDate.value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date
})

const weekDays = computed(() => {
  const todayKey = dateKey(new Date())
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.value)
    date.setDate(weekStart.value.getDate() + index)
    const dateStr = dateKey(date)
    return {
      date,
      dateStr,
      weekdayLabel: date.toLocaleDateString("en-PH", { weekday: "short" }),
      isToday: dateStr === todayKey
    }
  })
})

const weeklyAppointments = computed(() =>
  weekDays.value.flatMap(day => appointmentsByDate.value.get(day.dateStr) ?? [])
)

const weekHours = computed(() => {
  const appointmentHours = weeklyAppointments.value
    .map(appointment => new Date(appointment.starts_at).getHours())
    .filter(hour => Number.isFinite(hour) && hour >= 0 && hour <= 23)

  return Array.from(new Set([...DEFAULT_WEEK_HOURS, ...appointmentHours]))
    .sort((left, right) => left - right)
})

const getWeeklyDayAppointments = (day: string): AppointmentListItem[] =>
  appointmentsByDate.value.get(day) ?? []

const getWeeklyDayAppointmentCount = (day: string): number =>
  getWeeklyDayAppointments(day).length


const weekRangeLabel = computed(() => {
  const start = weekDays.value[0]?.date ?? selectedDate.value
  const end = weekDays.value[6]?.date ?? selectedDate.value
  const startLabel = start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
  const endLabel = end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
  return `${startLabel} - ${endLabel}`
})

const numberValue = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const firstNumberField = (appointment: AppointmentListItem, keys: string[]): number | null => {
  const row = appointment as unknown as Record<string, unknown>
  for (const key of keys) {
    const value = numberValue(row[key])
    if (value !== null) return value
  }
  return null
}

const areCreditsFullyConsumed = (appointment: AppointmentListItem): boolean => {
  const remaining = firstNumberField(appointment, [
    "remaining_credits",
    "remaining_credit_count",
    "remaining_sessions",
    "remaining_quantity"
  ])

  if (remaining !== null) return remaining <= 0

  const consumed = firstNumberField(appointment, [
    "consumed_credits",
    "consumed_credit_count",
    "consumed_sessions",
    "consumed_quantity",
    "completed_sessions"
  ])

  const total = firstNumberField(appointment, [
    "total_credits",
    "total_credit_count",
    "total_sessions",
    "planned_quantity"
  ])

  return consumed !== null && total !== null && total > 0 && consumed >= total
}

const normalizeStatus = (appointment: AppointmentListItem): CalendarAppointmentStatus => {
  const attendanceStatus = String((appointment as unknown as Record<string, unknown>).attendance_status ?? "").toUpperCase()
  const appointmentStatus = String(appointment.appointment_status ?? "").toUpperCase()

  if (appointmentStatus.includes("CANCEL") || appointmentStatus.includes("NO SHOW") || attendanceStatus.includes("CANCEL")) return "canceled"
  if (attendanceStatus.includes("COMPLETE") || attendanceStatus.includes("ATTENDED")) return "completed"
  if (appointmentStatus.includes("COMPLETE") || areCreditsFullyConsumed(appointment)) return "completed"

  return "pending"
}

const hasMultipleSessions = (appointment: AppointmentListItem): boolean =>
  Number(appointment.total_sessions ?? 1) > 1

const sessionLabel = (appointment: AppointmentListItem): string => {
  const sequence = Math.max(1, Number(appointment.session_sequence ?? 1))
  const total = Math.max(sequence, Number(appointment.total_sessions ?? 1))
  return total > 1 ? `Session ${sequence}/${total}` : "Single Session"
}


const monthlyStatusSummary = computed(() => {
  const summary = { completed: 0, pending: 0, canceled: 0 }
  for (const appointment of props.appointments) {
    const date = new Date(appointment.starts_at)
    if (date.getMonth() !== visibleMonth.value.getMonth() || date.getFullYear() !== visibleMonth.value.getFullYear()) continue
    const status = normalizeStatus(appointment)
    if (status === "completed") summary.completed += 1
    else if (status === "canceled") summary.canceled += 1
    else summary.pending += 1
  }
  return summary
})

const shiftSelectedDate = (days: number): void => {
  const next = new Date(selectedDate.value)
  next.setDate(next.getDate() + days)
  localCalendarDate.value = next
}

const prevWeek = (): void => shiftSelectedDate(-7)

const nextWeek = (): void => shiftSelectedDate(7)

const getApptsByHour = (day: string, hour: number): AppointmentListItem[] =>
  (appointmentsByDate.value.get(day) ?? [])
    .filter(appointment => new Date(appointment.starts_at).getHours() === hour)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())

const getWeekSlotClass = (appointment: AppointmentListItem): string => {
  const status = normalizeStatus(appointment)
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-100"
  if (status === "canceled") return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-700/30 dark:text-slate-300"
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100"
}

const statusLabel = (appointment: AppointmentListItem): string => {
  const status = normalizeStatus(appointment)
  if (status === "completed") return "Completed"
  if (status === "canceled") return "Canceled"
  return "Pending"
}

const getWeeklyDayStatus = (day: string): CalendarAppointmentStatus | "" => {
  const items = getWeeklyDayAppointments(day)
  if (!items.length) return ""
  if (items.some(appointment => normalizeStatus(appointment) === "pending")) return "pending"
  if (items.some(appointment => normalizeStatus(appointment) === "completed")) return "completed"
  return "canceled"
}

const getWeeklyDayStatusLabel = (day: string): string => {
  const status = getWeeklyDayStatus(day)
  if (status === "completed") return "Completed"
  if (status === "canceled") return "Canceled"
  if (status === "pending") return "Pending"
  return ""
}

const getWeeklyDayDotClass = (day: string): string[] => {
  const status = getWeeklyDayStatus(day)
  return [
    "h-1.5 w-1.5 rounded-full",
    status === "completed"
      ? "bg-emerald-500"
      : status === "canceled"
        ? "bg-slate-400"
        : "bg-amber-500"
  ]
}

const calendarSlotDate = (date: CalendarSlotDate): Date =>
  new Date(date.year, date.month, date.day)

const getCalendarDayStatus = (date: CalendarSlotDate): CalendarAppointmentStatus | "" => {
  const items = appointmentsByDate.value.get(dateKey(calendarSlotDate(date))) ?? []
  if (!items.length) return ""
  if (items.some(appointment => normalizeStatus(appointment) === "pending")) return "pending"
  if (items.some(appointment => normalizeStatus(appointment) === "completed")) return "completed"
  return "canceled"
}

const getCalendarDayAppointmentCount = (date: CalendarSlotDate): number =>
  appointmentsByDate.value.get(dateKey(calendarSlotDate(date)))?.length ?? 0


const calendarDayCellClass = (date: CalendarSlotDate): string[] => {
  const isSelected = dateKey(calendarSlotDate(date)) === selectedDayStr.value
  return [
    "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
    isSelected
      ? "bg-violet-600 text-white"
      : date.today
        ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"
        : "text-[rgb(var(--app-fg))]/75 hover:bg-[rgb(var(--app-bg-soft))]"
  ]
}

const calendarDayDotClass = (date: CalendarSlotDate): string[] => {
  const status = getCalendarDayStatus(date)
  return [
    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
    status === "completed"
      ? "bg-emerald-500"
      : status === "canceled"
        ? "bg-slate-400"
        : "bg-amber-500"
  ]
}

const onCalendarMonthChange = (event: MonthChangeEvent): void => {
  visibleMonth.value = new Date(event.year, event.month, 1)
  emitVisibleRange()
}

watch(
  calendarView,
  () => {
    emitVisibleRange()
  },
  { immediate: true }
)
</script>
