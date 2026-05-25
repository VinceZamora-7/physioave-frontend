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
          {{ calendarView === 'weekly' ? 'PT assignments for the selected week.' : 'View valid booking days, monthly billing status, and branch schedule availability.' }}
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
      <span class="app-appointment-legend app-appointment-legend-danger">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-danger" />
        Pending
      </span>
      <span class="app-appointment-legend app-appointment-legend-info">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-info" />
        Partial
      </span>
      <span class="app-appointment-legend app-appointment-legend-success">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-success" />
        Billed
      </span>
      <span class="app-appointment-legend app-appointment-legend-muted">
        <span class="app-appointment-legend-dot app-appointment-legend-dot-muted" />
        LGU Dropped Out
      </span>
    </div>

    <!-- Weekly Schedule -->
    <div
      v-if="calendarView === 'weekly'"
      class="relative overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] shadow-sm"
    >
      <!-- Loading overlay -->
      <div
        v-if="weeklyLoading"
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
                  'mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition',
                  day.dateStr === selectedDayStr
                    ? 'bg-violet-600 text-white shadow-sm ring-4 ring-violet-100 dark:ring-violet-500/20'
                    : day.isToday
                      ? 'bg-sky-500 text-white shadow-sm ring-4 ring-sky-100 dark:ring-sky-500/20'
                      : 'text-[rgb(var(--app-fg))] group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-white/10'
                ]"
              >
                {{ day.date.getDate() }}
              </div>
            </button>
          </div>

          <!-- Scrollable time rows -->
          <div class="max-h-[560px] overflow-y-auto">
            <div
              v-for="hour in WEEK_HOURS"
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
                  :title="`${appt.patient_name} — ${appt.doctor_name ?? 'Unassigned'} (${new Date(appt.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`"
                  @click="emit('appointment-click', appt)"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="truncate text-[12px] font-bold leading-tight">
                        {{ appt.doctor_name ?? 'Unassigned PT' }}
                      </div>

                      <div class="mt-1 truncate text-[11px] font-medium leading-tight opacity-85">
                        {{ appt.patient_name }}
                      </div>
                    </div>

                    <i class="pi pi-chevron-right mt-0.5 text-[10px] opacity-0 transition group-hover:opacity-60" />
                  </div>

                  <div class="mt-2 flex items-center gap-1.5 text-[10px] font-semibold leading-tight opacity-70">
                    <i class="pi pi-clock text-[9px]" />
                    <span>
                      {{ new Date(appt.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }}
                      –
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
              v-if="getCalendarDayStatus(slotProps.date)"
              :class="calendarDayDotClass(slotProps.date)"
            />
          </div>
        </template>
      </DatePicker>
    </template>

    <div class="flex justify-end pt-1">
      <Button
        label="Add Appointment"
        icon="pi pi-plus"
        size="small"
        outlined
        :pt="ptPrimaryBtn"
        @click="emit('add-appointment')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import { appointmentPhase1Service, type AppointmentListItem } from "@/features/appointments/api/appointment-phase1.service"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import { clinicStore } from "@/stores/clinic.store"

// ── Props & Emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  calendarDate: Date
}>()

const emit = defineEmits<{
  'update:calendarDate': [date: Date]
  'appointment-click': [appt: AppointmentListItem]
  'add-appointment': []
}>()

// Writable computed for v-model
const localCalendarDate = computed({
  get: () => props.calendarDate,
  set: (v: Date) => emit('update:calendarDate', v)
})

// ── Store ────────────────────────────────────────────────────────────────────

const globalClinicStore = clinicStore()
const { clinicOptions, selectedClinicId } = storeToRefs(globalClinicStore)
const selectedClinic = computed(() => clinicOptions.value.find(c => c.id === selectedClinicId.value))

// ── Types ────────────────────────────────────────────────────────────────────

type CalendarDayStatus = "pending" | "partial" | "billed" | "lgu-dropped-out"
type CalendarSlotDate = { year: number; month: number; day: number; today?: boolean; selectable?: boolean }

// ── State ────────────────────────────────────────────────────────────────────

const calendarView = ref<'weekly' | 'monthly'>('weekly')
const WEEK_HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7 AM – 7 PM
const weeklyApptMap = ref<Map<string, AppointmentListItem[]>>(new Map())
const weeklyLoading = ref(false)
const calendarDayStatusMap = ref<Map<string, CalendarDayStatus>>(new Map())
const bookedMonthCache = ref<Map<string, Map<string, CalendarDayStatus>>>(new Map())
const visibleMonth = ref<number>(new Date().getMonth())
const visibleYear = ref<number>(new Date().getFullYear())

// ── Clinic helpers (for disabled days) ──────────────────────────────────────

const selectedClinicScheduleLabel = computed(() => {
  if (!selectedClinic.value) return ""
  return `${selectedClinic.value.name}: ${selectedClinic.value.start_day_name} to ${selectedClinic.value.end_day_name}, ${selectedClinic.value.start_time_formatted} - ${selectedClinic.value.end_time_formatted}`
})

const selectedDateLabel = computed(() =>
  localCalendarDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const toMinutesFromTime = (value: unknown): number | undefined => {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes()
  if (typeof value !== "string") return undefined
  const hhmmss = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (hhmmss) return Number(hhmmss[1]) * 60 + Number(hhmmss[2])
  const ampm = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let hour = Number(ampm[1]) % 12
    if (ampm[3].toUpperCase() === "PM") hour += 12
    return hour * 60 + Number(ampm[2])
  }
  return undefined
}

const isClinicDayAllowed = (clinicDay: number): boolean => {
  const clinic = selectedClinic.value
  if (!clinic) return true
  if (clinic.start_day <= clinic.end_day) {
    return clinicDay >= clinic.start_day && clinicDay <= clinic.end_day
  }
  return clinicDay >= clinic.start_day || clinicDay <= clinic.end_day
}

const calendarDisabledDays = computed<number[]>(() => {
  if (!selectedClinic.value) return []
  const disabled: number[] = []
  for (let jsDay = 0; jsDay < 7; jsDay++) {
    const clinicDay = jsDay === 0 ? 7 : jsDay
    if (!isClinicDayAllowed(clinicDay)) disabled.push(jsDay)
  }
  return disabled
})

// ── Date key utilities ───────────────────────────────────────────────────────

const toDateKey = (year: number, month: number, day: number): string => {
  const mm = String(month + 1).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

const formatCalendarDateKey = (year: number, monthOneBased: number, day: number): string =>
  `${year}-${String(monthOneBased).padStart(2, "0")}-${String(day).padStart(2, "0")}`

const getBookedMonthCacheKey = (year: number, month: number, clinicId?: number): string => {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  return `${monthKey}::clinic:${clinicId ?? "all"}`
}

// ── Weekly schedule ──────────────────────────────────────────────────────────

const selectedDayStr = computed(() => {
  const d = localCalendarDate.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const weekStartDate = computed(() => {
  const d = new Date(localCalendarDate.value)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
})

const weekDays = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate.value)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return {
      date: d,
      dateStr: `${y}-${mo}-${day}`,
      weekdayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: d.getTime() === today.getTime()
    }
  })
})

const weekRangeLabel = computed(() => {
  const days = weekDays.value
  const first = days[0].date
  const last = days[6].date
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return first.getMonth() === last.getMonth()
    ? `${first.toLocaleDateString('en-US', opts)} – ${last.getDate()}, ${last.getFullYear()}`
    : `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', opts)}, ${last.getFullYear()}`
})

async function fetchWeeklyAppointments(): Promise<void> {
  weeklyLoading.value = true
  try {
    const days = weekDays.value
    const clinicId = selectedClinicId.value
    const results = await Promise.all(
      days.map(day => appointmentPhase1Service.getDay(day.dateStr, clinicId ? { clinic_id: clinicId } : {}))
    )
    const map = new Map<string, AppointmentListItem[]>()
    days.forEach((day, i) => { map.set(day.dateStr, results[i]) })
    weeklyApptMap.value = map
  } catch {
    // silent
  } finally {
    weeklyLoading.value = false
  }
}

function getApptsByHour(dateStr: string, hour: number): AppointmentListItem[] {
  return (weeklyApptMap.value.get(dateStr) ?? []).filter(
    appt => new Date(appt.starts_at).getHours() === hour
  )
}

function getWeekSlotClass(appt: AppointmentListItem): string {
  const s = (appt.appointment_status ?? '').toLowerCase()
  if (s === 'cancelled') return 'border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-600/30 dark:bg-slate-700/20 dark:text-slate-500 line-through'
  if (s === 'completed') return 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300'
  if (s === 'no show' || s === 'no_show') return 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-300'
  return 'border border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-200'
}

function prevWeek(): void {
  const d = new Date(localCalendarDate.value)
  d.setDate(d.getDate() - 7)
  localCalendarDate.value = d
}

function nextWeek(): void {
  const d = new Date(localCalendarDate.value)
  d.setDate(d.getDate() + 7)
  localCalendarDate.value = d
}

// ── Calendar dot helpers ─────────────────────────────────────────────────────

const isFullyBilledStatus = (status?: string): boolean =>
  ["PAID", "BILLED"].includes((status?.trim() || "").toUpperCase())

const isPartiallyPaidStatus = (status?: string): boolean =>
  (status?.trim() || "").toUpperCase() === "PARTIAL"

const isUnbilledStatus = (status?: string): boolean =>
  ["UNBILLED", "PENDING"].includes((status?.trim() || "UNBILLED").toUpperCase())

const classifyCalendarDayStatus = (rows: AppointmentListItem[]): CalendarDayStatus | null => {
  if (!rows.length) return null
  const isDroppedOut = (row: AppointmentListItem) =>
    String(row.dropout_status ?? "").toUpperCase() === "DROPPED_OUT"
  const activeRows = rows.filter(row => !isDroppedOut(row))
  if (activeRows.length === 0) return "lgu-dropped-out"
  if (activeRows.some(row => isUnbilledStatus(row.billing_status))) return "pending"
  if (activeRows.some(row => isPartiallyPaidStatus(row.billing_status))) return "partial"
  if (activeRows.some(row => isFullyBilledStatus(row.billing_status))) return "billed"
  return null
}

const calendarDayStatusStyles: Record<CalendarDayStatus, { cell: string; dot: string }> = {
  pending: {
    cell: "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-300"
  },
  partial: {
    cell: "bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-300"
  },
  billed: {
    cell: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300"
  },
  "lgu-dropped-out": {
    cell: "bg-slate-100 text-slate-500 ring-1 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:ring-slate-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-400"
  }
}

const getBookedDateCandidateKeys = (date: CalendarSlotDate): string[] => {
  const candidateKeys = new Set<string>()
  const year = Number(date.year)
  const month = Number(date.month)
  const day = Number(date.day)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return []
  if (month >= 0 && month <= 11) {
    candidateKeys.add(toDateKey(year, month, day))
    candidateKeys.add(formatCalendarDateKey(year, month + 1, day))
  }
  if (month >= 1 && month <= 12) {
    candidateKeys.add(formatCalendarDateKey(year, month, day))
  }
  const isVisibleMonth =
    (month >= 0 && month <= 11 && month === visibleMonth.value)
    || (month >= 1 && month <= 12 && (month - 1) === visibleMonth.value)
  if (isVisibleMonth) {
    candidateKeys.add(toDateKey(visibleYear.value, visibleMonth.value, day))
  }
  return [...candidateKeys]
}

const getCalendarDayStatus = (date: CalendarSlotDate): CalendarDayStatus | null => {
  const candidateKey = getBookedDateCandidateKeys(date)
    .find(key => calendarDayStatusMap.value.has(key))
  return candidateKey ? calendarDayStatusMap.value.get(candidateKey) ?? null : null
}

const calendarDayCellClass = (date: CalendarSlotDate): string[] => {
  const dayStatus = getCalendarDayStatus(date)
  return [
    "relative flex h-full min-h-8 w-full items-center justify-center rounded-xl px-1 text-sm font-medium transition-colors",
    dayStatus ? calendarDayStatusStyles[dayStatus].cell : "",
    date.today && !dayStatus ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" : "",
    date.today ? "ring-2 ring-violet-500 dark:ring-violet-400 font-semibold" : "",
    date.selectable === false ? "opacity-40" : ""
  ]
}

const calendarDayDotClass = (date: CalendarSlotDate): string => {
  const dayStatus = getCalendarDayStatus(date)
  return dayStatus ? calendarDayStatusStyles[dayStatus].dot : ""
}

// ── Booked dates fetch ───────────────────────────────────────────────────────

const fetchBookedDatesForMonth = async (year: number, month: number): Promise<void> => {
  const clinicId = selectedClinicId.value
  if (!clinicId) {
    calendarDayStatusMap.value = new Map()
    return
  }
  const monthKey = getBookedMonthCacheKey(year, month, clinicId)
  const cached = bookedMonthCache.value.get(monthKey)
  if (cached) {
    calendarDayStatusMap.value = new Map(cached)
    return
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthStatuses = new Map<string, CalendarDayStatus>()
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toDateKey(year, month, day)
    let dayStatus: CalendarDayStatus | null = null
    try {
      const rows = await appointmentPhase1Service.getDay(dateKey, { clinic_id: clinicId })
      dayStatus = classifyCalendarDayStatus(rows ?? [])
    } catch {
      try {
        const retryRows = await appointmentPhase1Service.getDay(dateKey, { clinic_id: clinicId })
        dayStatus = classifyCalendarDayStatus(retryRows ?? [])
      } catch {
        dayStatus = null
      }
    }
    if (dayStatus) monthStatuses.set(dateKey, dayStatus)
  }
  bookedMonthCache.value.set(monthKey, monthStatuses)
  calendarDayStatusMap.value = new Map(monthStatuses)
}

const refreshBookedDotsForVisibleMonth = async (): Promise<void> => {
  const monthKey = getBookedMonthCacheKey(visibleYear.value, visibleMonth.value, selectedClinicId.value)
  bookedMonthCache.value.delete(monthKey)
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const onCalendarMonthChange = async (event: { month: number; year: number }): Promise<void> => {
  visibleMonth.value = Math.max(0, Math.min(11, Number(event.month) - 1))
  visibleYear.value = event.year
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

// ── Watchers & lifecycle ─────────────────────────────────────────────────────

watch([weekStartDate, selectedClinicId], () => { void fetchWeeklyAppointments() }, { immediate: true })

watch(selectedClinicId, () => { void refreshBookedDotsForVisibleMonth() })

onMounted(async () => {
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
})

// ── Exposed API ──────────────────────────────────────────────────────────────

defineExpose({ refreshDots: refreshBookedDotsForVisibleMonth })
</script>
