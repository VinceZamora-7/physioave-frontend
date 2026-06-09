<template>
  <Dialog
    :visible="visible"
    modal
    :header="editingId ? 'Edit Appointment' : 'Create Appointment'"
    :style="{ width: '108rem', maxWidth: '98vw' }"
    :contentStyle="{ maxHeight: 'calc(100vh - 8rem)', overflow: 'auto' }"
    :draggable="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="appointment-form-shell">
      <section class="appointment-form-hero">
        <div class="min-w-0">
          <h3 class="text-lg font-bold text-white">
            {{ editingId ? "Update appointment" : "New appointment" }}
          </h3>
          <p class="mt-1 text-xs leading-5 text-white/75">
            Complete patient details, billing, care information, schedule, and time slot availability in one organized flow.
          </p>
        </div>

        <div class="hero-stat-card hero-stat-card-cyan">
          <span>Branch</span>
          <strong>{{ selectedClinic?.label || "All branches" }}</strong>
        </div>

        <div class="hero-stat-card hero-stat-card-pink">
          <span>Services</span>
          <strong>{{ selectedServices.length }}</strong>
        </div>

        <div class="hero-stat-card hero-stat-card-purple">
          <span>Sessions</span>
          <strong>{{ sessionCount }}</strong>
        </div>
      </section>

      <div class="appointment-form-workspace">
        <!-- Row 1: Patient Data | Billing Type and Planned Services -->
        <!-- Row 2: Patient Care and Evaluation Visit | Notes -->
        <section class="appointment-top-grid">
          <section class="brand-section-card brand-card-navy">
            <div class="brand-section-header">
              <span class="brand-section-index">1</span>
              <div>
                <h4>Patient Data</h4>
                <p>Patient, branch, and appointment status.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="space-y-1.5 md:col-span-2">
                <label class="form-label">Patient</label>
                <Select
                  v-model="form.patient_id"
                  :options="patientOptions"
                  optionLabel="label"
                  optionValue="value"
                  filter
                  fluid
                  placeholder="Select patient"
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Clinic Branch</label>
                <Select
                  v-model="form.clinic_id"
                  :options="clinicOptions"
                  optionLabel="label"
                  optionValue="value"
                  fluid
                  placeholder="Uses sidebar branch"
                  :disabled="Boolean(activeBranchId)"
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Status</label>
                <div class="readonly-pill">
                  {{ appointmentStatusLabel }}
                </div>
              </div>
            </div>
          </section>

          <section class="brand-section-card brand-card-purple">
            <div class="brand-section-header">
              <span class="brand-section-index">2</span>
              <div>
                <h4>Billing Type and Planned Services</h4>
                <p>Choose billing type, then attach package, bundle, or individual credits.</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div class="space-y-1.5">
                  <label class="form-label">Billing Type</label>
                  <Select
                    v-model="form.payer_type"
                    :options="payerOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    fluid
                    placeholder="Select billing type"
                  />
                </div>

                <div class="service-rule-box">
                  Self Pay Individual allows individual/bundle services. Self Pay Package allows package plus additional services.
                </div>
              </div>

              <div class="space-y-2">
                <label class="form-label">Service Category</label>
                <div class="service-type-button-grid">
                  <Button
                    v-for="option in serviceTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :icon="serviceTypeIcon(String(option.value))"
                    size="small"
                    :outlined="servicePicker.type !== option.value"
                    :severity="servicePicker.type === option.value ? undefined : 'secondary'"
                    @click="setServiceType(String(option.value))"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-end">
                <div class="space-y-1.5">
                  <label class="form-label">Service</label>
                  <Select
                    v-model="servicePicker.id"
                    :options="currentServiceOptions"
                    optionLabel="label"
                    optionValue="value"
                    filter
                    fluid
                    placeholder="Select service"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="form-label">Qty</label>
                  <InputNumber
                    v-model="servicePicker.quantity"
                    :min="1"
                    showButtons
                    fluid
                    :disabled="servicePicker.type === 'PACKAGE'"
                  />
                </div>

                <Button
                  label="Add"
                  icon="pi pi-plus"
                  severity="secondary"
                  outlined
                  @click="$emit('add-picked-service')"
                />
              </div>

              <div class="selected-services-list selected-services-list-wide">
                <div v-if="!selectedServices.length" class="empty-services-state">
                  No planned services selected yet.
                </div>

                <article
                  v-for="(service, index) in selectedServices"
                  :key="`${service.type}-${service.value}-${index}`"
                  class="selected-service-card"
                >
                  <div class="min-w-0">
                    <div class="break-words text-xs font-bold text-[rgb(var(--app-fg))]">
                      {{ service.name }}
                    </div>
                    <div class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">
                      {{ service.typeLabel }} · Qty {{ service.quantity }}
                    </div>
                  </div>

                  <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="danger"
                    aria-label="Remove"
                    @click="$emit('remove-selected-service', index)"
                  />
                </article>
              </div>
            </div>
          </section>

          <section class="brand-section-card brand-card-cyan">
            <div class="brand-section-header">
              <span class="brand-section-index">3</span>
              <div>
                <h4>Patient Care and Evaluation Visit</h4>
                <p>PT assignment, visit details, diagnosis, and laterality.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="space-y-1.5">
                <label class="form-label">PT</label>
                <Select
                  v-model="form.primary_provider_staff_id"
                  :options="ptOptions"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  fluid
                  placeholder="Select PT"
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Referring Doctor</label>
                <Select
                  v-model="form.referring_staff_id"
                  :options="doctorOptions"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  fluid
                  placeholder="Optional"
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Appointment Type</label>
                <Select
                  v-model="form.appointment_type_id"
                  :options="appointmentTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  fluid
                  placeholder="Select type"
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Visit Phase</label>
                <Select
                  v-model="form.appointment_phase"
                  :options="phaseOptions"
                  optionLabel="label"
                  optionValue="value"
                  fluid
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Specialty</label>
                <Select
                  v-model="form.specialty_tag_id"
                  :options="specialtyOptions"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  fluid
                  placeholder="Optional"
                />
              </div>

              <div class="space-y-1.5">
                <label class="form-label">Clinic Area</label>
                <Select
                  v-model="form.treatment_area_id"
                  :options="clinicAreaOptions"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  fluid
                  placeholder="Optional"
                />
              </div>

              <div class="doctor-diagnosis-panel md:col-span-2">
                <div class="doctor-diagnosis-title">Doctor Diagnosis Details</div>
                <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div class="space-y-1.5">
                    <label class="form-label">Doctor Diagnosis</label>
                    <Select
                      v-model="form.medical_diagnose_id"
                      :options="medicalDiagnoseOptions"
                      optionLabel="label"
                      optionValue="value"
                      showClear
                      filter
                      fluid
                      placeholder="Optional"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <label class="form-label">Doctor Laterality</label>
                    <Select
                      v-model="form.diagnosis_laterality"
                      :options="lateralityOptions"
                      optionLabel="label"
                      optionValue="value"
                      showClear
                      fluid
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                                <div class="brand-section-header">
              <span class="brand-section-index">4</span>
              <div>
                <h4>Notes</h4>
                <p>Optional appointment remarks.</p>
              </div>
            </div>

            <Textarea
              v-model="form.notes"
              rows="8"
              autoResize
              fluid
              placeholder="Optional appointment notes"
            />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="brand-section-card brand-card-magenta">
        <!-- Full-width schedule -->
        <section class="brand-section-card brand-card-pink schedule-section-card">
          <div class="schedule-pane-header">
            <div class="brand-section-header mb-0">
              <span class="brand-section-index">5</span>
              <div>
                <h4>Schedule</h4>
                <p>Select session dates, then use available time slots below.</p>
              </div>
            </div>

            <div class="session-counter-pill">
              {{ sessionCount }} session{{ sessionCount === 1 ? "" : "s" }}
            </div>
          </div>

          <div class="schedule-full-grid">
            <div class="schedule-controls-group">
              <div class="schedule-top-grid">
                <div class="space-y-1.5">
                  <label class="form-label">First Start</label>
                  <DatePicker v-model="form.starts_at" showTime hourFormat="12" showIcon fluid />
                </div>

                <div class="space-y-1.5">
                  <label class="form-label">First End</label>
                  <DatePicker v-model="form.ends_at" showTime hourFormat="12" showIcon fluid />
                  <div class="field-hint">Defaults to 60 minutes after start. You can still adjust it.</div>
                </div>

                <div class="session-summary-card">
                  <div class="text-sm font-bold text-[rgb(var(--app-fg))]">Session Dates</div>
                  <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">
                    Required: {{ sessionCount }} appointment{{ sessionCount === 1 ? "" : "s" }} · Sending {{ form.session_dates?.length || 0 }} date{{ (form.session_dates?.length || 0) === 1 ? "" : "s" }}
                  </div>
                </div>
              </div>

              <div class="session-tools-row">
                <Button
                  label="Weekly"
                  icon="pi pi-calendar-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="$emit('generate-session-dates', 'WEEKLY')"
                />
                <Button
                  label="Every Other Day"
                  icon="pi pi-calendar-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="$emit('generate-session-dates', 'EVERY_OTHER_DAY')"
                />
                <Button
                  label="Daily"
                  icon="pi pi-calendar-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="$emit('generate-session-dates', 'DAILY')"
                />
              </div>
            </div>

            <div class="session-date-list session-date-list-horizontal">
              <button
                v-for="(_, index) in form.session_dates"
                :key="index"
                type="button"
                :class="[
                  'session-date-card',
                  activeSessionIndex === index ? 'session-date-card-active' : ''
                ]"
                @click="activeSessionIndex = index"
              >
                <span>Session {{ index + 1 }}</span>
                <strong>{{ formatSessionDate(form.session_dates[index]) }}</strong>
                <small>{{ formatTimeValue(form.session_dates[index]) }}</small>
              </button>
            </div>
          </div>
        </section>
          </section>
        </section>



        <!-- Full-width time slot availability -->
        <section class="time-slots-pane brand-section-card brand-card-cyan">
          <div class="time-slots-header">
            <div class="brand-section-header mb-0">
              <span class="brand-section-index">6</span>
              <div>
                <h4>Time Slot Availability</h4>
                <p>Available and taken slots for the selected session.</p>
              </div>
            </div>

            <div class="availability-counts">
              <span class="available-count">{{ availableSlotCount }} available</span>
              <span class="taken-count">{{ takenSlotCount }} taken</span>
            </div>
          </div>

          <div class="availability-toolbar availability-toolbar-roomy">
            <div>
              <div class="text-base font-black text-[rgb(var(--app-fg))]">{{ selectedAvailabilityDateLabel }}</div>
              <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">{{ availabilityScopeLabel }}</div>
            </div>
          </div>

          <div v-if="isAvailabilityLoading" class="flex items-center gap-2 py-8 text-sm text-[rgb(var(--app-fg))]/60">
            <i class="pi pi-spin pi-spinner text-violet-500" />
            Loading available and taken time slots...
          </div>

          <div v-else class="time-slot-grid time-slot-grid-main">
            <article
              v-for="slot in availabilitySlots"
              :key="slot.key"
              :class="[
                'time-slot-card',
                slot.taken ? 'time-slot-card-taken' : 'time-slot-card-available'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="break-words text-sm font-black leading-tight">
                    {{ formatTime(slot.start) }} - {{ formatTime(slot.end) }}
                  </div>
                  <div class="mt-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {{ slot.taken ? "Taken" : "Available" }}
                  </div>
                </div>

                <Button
                  v-if="!slot.taken"
                  label="Use"
                  size="small"
                  text
                  rounded
                  @click="setSlotForActiveSession(slot)"
                />
              </div>

              <div v-if="slot.taken" class="mt-2 space-y-1.5">
                <div
                  v-for="appointment in slot.takenBy"
                  :key="appointment.id"
                  class="taken-appointment-card"
                >
                  <div class="font-black">{{ appointment.provider_name || appointment.doctor_name || "Unassigned PT" }}</div>
                  <div class="break-words font-semibold">{{ appointment.patient_name || "Unnamed patient" }}</div>
                  <div class="opacity-75">{{ formatTimeValue(appointment.starts_at) }} - {{ formatTimeValue(appointment.ends_at) }}</div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" outlined @click="$emit('update:visible', false)" />
      <Button label="Save Appointment" icon="pi pi-save" :loading="isSaving" :pt="ptPrimaryBtn" @click="$emit('save')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import Select from "primevue/select"
import Textarea from "primevue/textarea"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

type SelectOption = { label: string; value: number | string | null }
type Option<T extends string | number = string | number> = { label: string; value: T }
type SessionMode = "DAILY" | "EVERY_OTHER_DAY" | "WEEKLY"
type ScheduleAppointment = Record<string, any>
type TimeSlot = {
  key: string
  start: Date
  end: Date
  taken: boolean
  takenBy: ScheduleAppointment[]
}

const props = defineProps<{
  visible: boolean
  editingId: number | null
  isSaving: boolean
  form: Record<string, any>
  sessionCount: number
  selectedClinic: SelectOption | null
  selectedServices: Array<Record<string, any>>
  patientOptions: SelectOption[]
  clinicOptions: SelectOption[]
  activeBranchId: number | null
  ptOptions: SelectOption[]
  doctorOptions: SelectOption[]
  payerOptions: Option[]
  appointmentTypeOptions: SelectOption[]
  appointmentStatusLabel: string
  phaseOptions: Option[]
  specialtyOptions: SelectOption[]
  clinicAreaOptions: SelectOption[]
  medicalDiagnoseOptions: SelectOption[]
  lateralityOptions: Option[]
  serviceTypeOptions: Option[]
  servicePicker: Record<string, any>
  currentServiceOptions: Array<Record<string, any>>
  scheduleAppointments: ScheduleAppointment[]
  isAvailabilityLoading: boolean
}>()

defineEmits<{
  "update:visible": [value: boolean]
  "generate-session-dates": [mode: SessionMode]
  "add-picked-service": []
  "remove-selected-service": [index: number]
  save: []
}>()

const activeSessionIndex = ref(0)
const SLOT_START_HOUR = 7
const SLOT_END_HOUR = 19
const SLOT_STEP_MINUTES = 30

const asDate = (value: unknown): Date | null => {
  if (!value) return null
  const date = value instanceof Date ? new Date(value) : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

const formatTime = (value: Date): string =>
  value.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })

const formatTimeValue = (value: unknown): string => {
  const date = asDate(value)
  return date ? formatTime(date) : "--"
}

const selectedSessionDate = computed(() => {
  const sessionDate = asDate(props.form.session_dates?.[activeSessionIndex.value])
  return sessionDate ?? asDate(props.form.starts_at) ?? new Date()
})

const selectedAvailabilityDateLabel = computed(() =>
  selectedSessionDate.value.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
)

const formatSessionDate = (value: unknown): string => {
  const date = asDate(value)
  return date ? date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "No date"
}

const slotDurationMs = computed(() => {
  const startsAt = asDate(props.form.starts_at)
  const endsAt = asDate(props.form.ends_at)
  if (!startsAt || !endsAt) return 60 * 60 * 1000
  return Math.max(15 * 60 * 1000, endsAt.getTime() - startsAt.getTime())
})

const availabilityScopeLabel = computed(() => {
  const selectedPt = props.ptOptions.find(option => Number(option.value) === Number(props.form.primary_provider_staff_id))
  if (selectedPt?.label) return `Checking PT: ${selectedPt.label}`
  return "Checking branch schedule"
})

const matchesSelectedClinic = (appointment: ScheduleAppointment): boolean => {
  if (!props.form.clinic_id) return true
  return Number(appointment.clinic_id) === Number(props.form.clinic_id)
}

const appointmentProviderId = (appointment: ScheduleAppointment): number | null => {
  const value = appointment.primary_provider_staff_id ?? appointment.provider_staff_id ?? appointment.doctor_id
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const isCanceledAppointment = (appointment: ScheduleAppointment): boolean => {
  const status = String(appointment.appointment_status ?? "").toUpperCase()
  return status.includes("CANCEL") || status.includes("NO SHOW") || status.includes("NO_SHOW")
}

const matchesSelectedPt = (appointment: ScheduleAppointment): boolean => {
  if (!props.form.primary_provider_staff_id) return true
  return appointmentProviderId(appointment) === Number(props.form.primary_provider_staff_id)
}

const appointmentsForSelectedSession = computed(() => {
  const selectedKey = dateKey(selectedSessionDate.value)
  return props.scheduleAppointments.filter(appointment => {
    if (Number(appointment.id) === Number(props.editingId)) return false
    if (isCanceledAppointment(appointment)) return false
    const startsAt = asDate(appointment.starts_at)
    if (!startsAt || dateKey(startsAt) !== selectedKey) return false
    return matchesSelectedClinic(appointment) && matchesSelectedPt(appointment)
  })
})

const overlaps = (leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date): boolean =>
  leftStart.getTime() < rightEnd.getTime() && rightStart.getTime() < leftEnd.getTime()

const availabilitySlots = computed<TimeSlot[]>(() => {
  const base = new Date(selectedSessionDate.value)
  base.setHours(0, 0, 0, 0)

  const closingTime = new Date(base)
  closingTime.setHours(SLOT_END_HOUR, 0, 0, 0)

  const slots: TimeSlot[] = []
  for (let minutes = SLOT_START_HOUR * 60; minutes < SLOT_END_HOUR * 60; minutes += SLOT_STEP_MINUTES) {
    const start = new Date(base)
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    const end = new Date(start.getTime() + slotDurationMs.value)

    if (end.getTime() > closingTime.getTime()) continue

    const takenBy = appointmentsForSelectedSession.value.filter(appointment => {
      const appointmentStart = asDate(appointment.starts_at)
      const appointmentEnd = asDate(appointment.ends_at)
      return appointmentStart && appointmentEnd && overlaps(start, end, appointmentStart, appointmentEnd)
    })

    slots.push({
      key: `${dateKey(start)}-${String(start.getHours()).padStart(2, "0")}-${String(start.getMinutes()).padStart(2, "0")}`,
      start,
      end,
      taken: takenBy.length > 0,
      takenBy
    })
  }

  return slots
})

const availableSlotCount = computed(() => availabilitySlots.value.filter(slot => !slot.taken).length)
const takenSlotCount = computed(() => availabilitySlots.value.filter(slot => slot.taken).length)

const handleServiceTypeChange = (): void => {
  props.servicePicker.id = null
  if (props.servicePicker.type === "PACKAGE") props.servicePicker.quantity = 1
}

const setServiceType = (type: string): void => {
  props.servicePicker.type = type
  handleServiceTypeChange()
}

const serviceTypeIcon = (type: string): string => {
  if (type === "PACKAGE") return "pi pi-box"
  if (type === "BUNDLE") return "pi pi-th-large"
  if (type.includes("MACHINE")) return "pi pi-cog"
  if (type.includes("TECHNIQUE")) return "pi pi-heart"
  if (type.includes("EVALUATION")) return "pi pi-clipboard"
  if (type.includes("HOME")) return "pi pi-home"
  return "pi pi-plus"
}

const setSlotForActiveSession = (slot: TimeSlot): void => {
  if (!Array.isArray(props.form.session_dates)) props.form.session_dates = []

  props.form.session_dates[activeSessionIndex.value] = new Date(slot.start)

  if (activeSessionIndex.value === 0 || !props.form.starts_at) {
    props.form.starts_at = new Date(slot.start)
    props.form.ends_at = new Date(slot.end)
  }
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) activeSessionIndex.value = 0
  }
)

watch(
  () => props.form.session_dates?.length ?? 0,
  (length) => {
    if (!length) {
      activeSessionIndex.value = 0
      return
    }

    if (activeSessionIndex.value > length - 1) {
      activeSessionIndex.value = length - 1
    }
  }
)
</script>

<style scoped>
.appointment-form-shell {
  --color-brand-navy: #242757;
  --color-brand-cyan: #3c88b1;
  --color-brand-cyan-soft: #a3d9e8;
  --color-brand-purple: #5e1869;
  --color-brand-magenta: #a91d8b;
  --color-brand-pink: #db65c6;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: visible;
}

.appointment-form-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, minmax(130px, 170px));
  gap: 0.75rem;
  align-items: center;
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top right, rgba(219, 101, 198, 0.45), transparent 28rem),
    linear-gradient(135deg, var(--color-brand-navy), var(--color-brand-purple));
  padding: 0.875rem 1rem;
  box-shadow: 0 16px 36px rgba(36, 39, 87, 0.18);
}

.hero-stat-card {
  min-width: 0;
  border-radius: 1rem;
  padding: 0.65rem 0.8rem;
  color: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.hero-stat-card span {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.75;
  text-transform: uppercase;
}

.hero-stat-card strong {
  display: block;
  margin-top: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

.hero-stat-card-cyan { background: rgba(60, 136, 177, 0.82); }
.hero-stat-card-pink { background: rgba(219, 101, 198, 0.75); }
.hero-stat-card-purple { background: rgba(169, 29, 139, 0.72); }

.appointment-form-workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-top-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.brand-section-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(var(--app-border) / 0.9);
  border-radius: 1.25rem;
  background: rgb(var(--app-card));
  padding: 0.875rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
}

.brand-section-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.38rem;
  background: var(--section-color);
}

.brand-section-card::after {
  content: "";
  position: absolute;
  inset: -5rem -5rem auto auto;
  width: 10rem;
  height: 10rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--section-color) 16%, transparent);
  pointer-events: none;
}

.brand-card-navy { --section-color: var(--color-brand-navy); }
.brand-card-cyan { --section-color: var(--color-brand-cyan); }
.brand-card-purple { --section-color: var(--color-brand-purple); }
.brand-card-magenta { --section-color: var(--color-brand-magenta); }
.brand-card-pink { --section-color: var(--color-brand-pink); }

.brand-section-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.brand-section-index {
  display: flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.85rem;
  background: var(--section-color);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--section-color) 32%, transparent);
}

.brand-section-header h4 {
  margin: 0;
  color: rgb(var(--app-fg));
  font-size: 0.98rem;
  font-weight: 900;
}

.brand-section-header p {
  margin-top: 0.15rem;
  color: rgb(var(--app-fg) / 0.58);
  font-size: 0.72rem;
  line-height: 1.25rem;
}

.form-label {
  display: block;
  color: rgb(var(--app-fg) / 0.58);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-hint {
  color: rgb(var(--app-fg) / 0.5);
  font-size: 0.68rem;
  line-height: 1rem;
}

.readonly-pill,
.service-rule-box,
.session-summary-card {
  border-radius: 0.9rem;
  border: 1px solid rgb(var(--app-border));
  background: rgb(var(--app-bg-soft));
  padding: 0.62rem 0.75rem;
  color: rgb(var(--app-fg) / 0.72);
  font-size: 0.78rem;
  line-height: 1.2rem;
}

.selected-services-list {
  display: grid;
  max-height: 13rem;
  gap: 0.45rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.selected-services-list-wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-height: 14rem;
}

.empty-services-state {
  border-radius: 1rem;
  border: 1px dashed rgb(var(--app-border));
  padding: 1rem;
  text-align: center;
  color: rgb(var(--app-fg) / 0.55);
  font-size: 0.82rem;
}

.selected-service-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--color-brand-cyan) 28%, rgb(var(--app-border)));
  background: linear-gradient(135deg, rgba(163, 217, 232, 0.26), rgb(var(--app-card)) 58%);
  padding: 0.55rem 0.65rem;
}

.service-type-button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.doctor-diagnosis-panel {
  border-radius: 1rem;
  border: 1px solid rgb(var(--app-border));
  background: rgb(var(--app-bg-soft));
  padding: 0.75rem;
}

.doctor-diagnosis-title {
  color: rgb(var(--app-fg));
  font-size: 0.8rem;
  font-weight: 900;
}

.schedule-section-card,
.time-slots-pane {
  width: 100%;
}

.schedule-pane-header,
.time-slots-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgb(var(--app-border));
  padding-bottom: 0.75rem;
  margin-bottom: 0.85rem;
}

.session-counter-pill {
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(219, 101, 198, 0.14);
  color: var(--color-brand-magenta);
  box-shadow: inset 0 0 0 1px rgba(169, 29, 139, 0.16);
  padding: 0.45rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 900;
}

.schedule-full-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.72fr) minmax(0, 1.28fr);
  gap: 1rem;
  align-items: start;
}

.schedule-controls-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-top-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.schedule-top-grid .session-summary-card {
  grid-column: 1 / -1;
}

.session-tools-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.session-date-list {
  display: grid;
  gap: 0.6rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.session-date-list-horizontal {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-height: 14rem;
}

.session-date-card {
  display: grid;
  gap: 0.15rem;
  border-radius: 1rem;
  border: 1px solid rgb(var(--app-border));
  background: rgb(var(--app-card));
  padding: 0.7rem 0.75rem;
  text-align: left;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease;
}

.session-date-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.session-date-card span {
  color: rgb(var(--app-fg) / 0.5);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.session-date-card strong {
  color: rgb(var(--app-fg));
  font-size: 0.85rem;
}

.session-date-card small {
  color: rgb(var(--app-fg) / 0.6);
  font-weight: 700;
}

.session-date-card-active {
  border-color: color-mix(in srgb, var(--color-brand-magenta) 60%, rgb(var(--app-border)));
  background: linear-gradient(135deg, rgba(219, 101, 198, 0.18), rgba(163, 217, 232, 0.18));
}

.availability-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
  padding-bottom: 0.65rem;
}

.availability-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 900;
}

.available-count,
.taken-count {
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
}

.available-count {
  background: rgba(60, 136, 177, 0.12);
  color: var(--color-brand-cyan);
  box-shadow: inset 0 0 0 1px rgba(60, 136, 177, 0.22);
}

.taken-count {
  background: rgba(169, 29, 139, 0.1);
  color: var(--color-brand-magenta);
  box-shadow: inset 0 0 0 1px rgba(169, 29, 139, 0.18);
}

.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  overflow-y: visible;
  padding-right: 0.2rem;
}

.time-slot-card {
  min-height: 6.75rem;
  border-radius: 1.1rem;
  border: 1px solid transparent;
  padding: 0.75rem;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.time-slot-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
}

.time-slot-card-available {
  border-color: rgba(60, 136, 177, 0.26);
  background: linear-gradient(135deg, rgba(163, 217, 232, 0.55), rgba(60, 136, 177, 0.12));
  color: #1f5f81;
}

.time-slot-card-taken {
  border-color: rgba(169, 29, 139, 0.24);
  background: linear-gradient(135deg, rgba(219, 101, 198, 0.28), rgba(169, 29, 139, 0.09));
  color: #6f1660;
}

.taken-appointment-card {
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.72);
  padding: 0.45rem 0.55rem;
  font-size: 0.68rem;
  line-height: 1rem;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
}

@media (min-width: 1600px) {
  .time-slot-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .appointment-top-grid,
  .schedule-full-grid,
  .appointment-form-hero {
    grid-template-columns: 1fr;
  }

  .time-slot-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .selected-services-list-wide,
  .schedule-top-grid,
  .session-date-list-horizontal {
    grid-template-columns: 1fr;
  }

  .time-slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .schedule-pane-header,
  .time-slots-header,
  .availability-toolbar-roomy {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .time-slot-grid {
    grid-template-columns: 1fr;
  }
}
</style>
