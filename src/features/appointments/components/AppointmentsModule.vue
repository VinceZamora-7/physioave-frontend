<template>
  <main class="app-page-shell space-y-5">
    <section :class="sectionCardClass">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 :class="sectionTitleClass">Clinic Calendar</h3>
          <span class="text-sm opacity-70">Selected: {{ selectedDateLabel }}</span>
        </div>
        <IftaLabel class="min-w-[260px]">
          <Select
            v-model="selectedClinicId"
            :options="clinicOptions"
            optionLabel="name"
            optionValue="id"
            fluid
            filter
            placeholder="Select clinic schedule"
          />
          <label>Clinic Schedule</label>
        </IftaLabel>
      </div>
      <small v-if="selectedClinicScheduleLabel" class="opacity-70">{{ selectedClinicScheduleLabel }}</small>
      <DatePicker
        v-model="calendarDate"
        inline
        fluid
        :manualInput="false"
        showWeek
        :disabledDays="calendarDisabledDays"
        @month-change="onCalendarMonthChange"
      >
        <template #date="slotProps">
          <div class="relative h-8 w-8 grid place-items-center">
            <span>{{ slotProps.date.day }}</span>
            <span
              v-if="hasBookingDot(slotProps.date)"
              class="absolute bottom-[2px] h-1.5 w-1.5 rounded-full bg-red-500"
            />
          </div>
        </template>
      </DatePicker>
    </section>

    <section :class="sectionCardClass">
      <div class="flex items-center justify-between gap-2">
        <h3 :class="sectionTitleClass">Appointments</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <IftaLabel>
          <InputText v-model="statusFilter" fluid placeholder="Status (optional)" />
          <label>Status filter</label>
        </IftaLabel>
        <div class="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3">
          <Button label="Create Appointment" icon="pi pi-plus" @click="openCreateDialog" />
          <Button label="Refresh Table" icon="pi pi-refresh" outlined @click="refreshAll" />
          <Button label="Export CSV" icon="pi pi-download" severity="secondary" outlined @click="onExportCsv" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <DataTable
          :value="appointments"
          dataKey="id"
          paginator
          :rows="pageSize"
          :first="(page - 1) * pageSize"
          :totalRecords="totalElements"
          :loading="isLoading"
          @page="onPage"
          selectionMode="single"
          @rowSelect="onSelectRow"
        >
          <Column field="patient_name" header="Patient" />
          <Column field="doctor_name" header="Doctor" />
          <Column field="starts_at" header="Start">
            <template #body="{data}">{{ formatDateTime(data.starts_at) }}</template>
          </Column>
          <Column field="appointment_status" header="Appt Status" />
          <Column field="billing_status" header="Billing">
            <template #body="{data}">
              <Tag :value="displayBillingStatus(data.billing_status)" :severity="billingSeverity(data.billing_status)" />
            </template>
          </Column>
          <Column field="reschedule_count" header="Reschedules" />
          <Column header="Actions">
            <template #body="{data}">
              <div class="flex items-center gap-1">
                <Button size="small" text icon="pi pi-calendar-plus" @click="openReschedule(data)" />
                <Button
                  v-if="canDeleteAppointments"
                  size="small"
                  text
                  severity="danger"
                  icon="pi pi-trash"
                  @click="confirmDeleteAppointment(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

    <section :class="sectionCardClass">
      <h3 :class="sectionTitleClass">Calendar Day Bookings</h3>
      <DataTable :value="dayBookings" dataKey="id" size="small" selectionMode="single" @rowSelect="onSelectRow">
        <Column field="patient_name" header="Patient" />
        <Column field="starts_at" header="Start">
          <template #body="{data}">{{ formatDateTime(data.starts_at) }}</template>
        </Column>
        <Column field="billing_status" header="Billing">
          <template #body="{data}">
            <Tag :value="displayBillingStatus(data.billing_status)" :severity="billingSeverity(data.billing_status)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <section v-if="selectedDetail" :class="sectionCardClass">
      <h3 :class="sectionTitleClass">Appointment Detail</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Patient</div>
          <div class="font-medium">{{ selectedDetail.patient_name }}</div>
        </div>
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Doctor</div>
          <div class="font-medium">{{ selectedDetail.doctor_name || "N/A" }}</div>
        </div>
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Schedule</div>
          <div class="font-medium">{{ formatDateTime(selectedDetail.starts_at) }} - {{ formatDateTime(selectedDetail.ends_at) }}</div>
        </div>
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Billing Status</div>
          <div class="mt-1">
            <Tag :value="displayBillingStatus(selectedDetail.billing_status)" :severity="billingSeverity(selectedDetail.billing_status)" />
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <Button label="Open Patient Record" icon="pi pi-user" outlined class="min-w-[190px]" @click="goToPatients" />
        <Button
          :label="selectedDetail.billing_id ? 'Open Billing Record' : 'Create Billing'"
          icon="pi pi-receipt"
          severity="secondary"
          outlined
          class="min-w-[190px]"
          @click="goToBilling"
        />
      </div>
    </section>

    <Dialog v-model:visible="rescheduleVisible" modal header="Reschedule Appointment" :style="{width:'520px'}">
      <div class="space-y-3">
        <p v-if="activeAppointment">Current reschedules: <strong>{{ activeAppointment.reschedule_count }}</strong> / 3</p>
        <Message v-if="needsOverrideReason" severity="warn" :closable="false">
          Max reschedule reached. Owner override is required and a reason is mandatory.
        </Message>
        <IftaLabel>
          <DatePicker
            v-model="rescheduleStart"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>New Start</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker
            v-model="rescheduleEnd"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>New End</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="overrideReason" fluid :disabled="!needsOverrideReason" />
          <label>Owner override reason (required after 3)</label>
        </IftaLabel>
        <small class="opacity-70">If max reschedule reached, only Owner override is accepted.</small>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="rescheduleVisible = false" />
        <Button label="Submit Reschedule" icon="pi pi-check" @click="submitReschedule" />
      </template>
    </Dialog>

    <Dialog v-model:visible="createVisible" modal header="Create Appointment" :style="{width:'560px'}">
      <div class="space-y-3">
        <IftaLabel>
          <Select
            v-model="createPatient"
            :options="patientOptions"
            optionLabel="name"
            optionValue="id"
            filter
            fluid
            placeholder="Select patient"
          />
          <label>Patient</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="createDoctor"
            :options="doctorOptions"
            optionLabel="name"
            optionValue="id"
            filter
            showClear
            fluid
            placeholder="Select doctor (optional)"
          />
          <label>Doctor (optional)</label>
        </IftaLabel>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IftaLabel>
            <Select
              v-model="createServiceSource"
              :options="serviceSourceOptions"
              optionLabel="label"
              optionValue="value"
              fluid
            />
            <label>Service Source</label>
          </IftaLabel>

          <IftaLabel v-if="createServiceSource === 'PACKAGE'">
            <Select
              v-model="createPackageId"
              :options="packageOptions"
              optionLabel="name"
              optionValue="id"
              filter
              fluid
              placeholder="Select package"
            />
            <label>Package</label>
          </IftaLabel>

          <IftaLabel v-else-if="createServiceSource === 'PROMO'">
            <Select
              v-model="createPromoOfferId"
              :options="promoOfferOptions"
              optionLabel="name"
              optionValue="id"
              filter
              fluid
              placeholder="Select promo offer"
            />
            <label>Promo / Offer</label>
          </IftaLabel>

          <IftaLabel v-else>
            <Select
              v-model="createIndividualServiceId"
              :options="individualServiceOptions"
              optionLabel="name"
              optionValue="id"
              filter
              fluid
              placeholder="Select individual service"
            />
            <label>Individual Service</label>
          </IftaLabel>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IftaLabel>
            <InputNumber v-model="createAmountDue" mode="currency" currency="PHP" locale="en-PH" fluid />
            <label>Pre-created Billing Amount Due</label>
          </IftaLabel>
          <IftaLabel>
            <InputText v-model="createBillingNotes" fluid />
            <label>Billing Notes (optional)</label>
          </IftaLabel>
        </div>
        <small class="opacity-70">
          Applied clinic schedule: {{ selectedClinicScheduleLabel || "No clinic resolved yet" }}
        </small>
        <Message v-if="isOvernightClinicSchedule" severity="warn" :closable="false">
          This clinic schedule is overnight. If this is unintended, verify clinic end time (AM/PM).
        </Message>

        <IftaLabel>
          <DatePicker
            v-model="createStart"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>Start</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker
            v-model="createEnd"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>End</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createVisible = false" />
        <Button label="Create" icon="pi pi-check" @click="submitCreateAppointment" />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {useConfirm, useToast} from "primevue";
import axios from "axios";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, {type DataTablePageEvent} from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import IftaLabel from "primevue/iftalabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {appointmentPhase1Service, type AppointmentDetail, type AppointmentListItem} from "@/features/appointments/api/appointment-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {errorToast, successToast} from "@/utils/toast.util";
import type {Lookup} from "@/models/global.model";
import {patientService} from "@/features/patients/api/patient.service";
import {staffService} from "@/features/staff/api/staff.service";
import {clinicService} from "@/features/clinics/api/clinic.service";
import {billingPhase1Service, type PackageLookup} from "@/features/billing/api/billing-phase1.service";
import {defaultPage, defaultPageSize} from "@/models/paging";
import {Status} from "@/utils/global.type";
import type {Clinic} from "@/features/clinics/types/clinic";
import type {Patient} from "@/features/patients/types/patient";
import type {Staff} from "@/features/staff/types/staff";
import {PROMO_OFFERS_CATALOG} from "@/features/promos-offers/data/promos-offers.data";
import {techniqueService} from "@/features/techniques/api/technique.service";
import {evaluationService} from "@/features/evaluations/api/evaluation.service";
import {machineService} from "@/features/machines/api/machine.service";
import type {Offer} from "@/features/offers/types/offer";

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const roleName = ref("")

const appointments = ref<AppointmentListItem[]>([])
const dayBookings = ref<AppointmentListItem[]>([])
const selectedDetail = ref<AppointmentDetail>()
const isLoading = ref(false)

const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const statusFilter = ref<string>()
const calendarDate = ref<Date>(new Date())

const rescheduleVisible = ref(false)
const activeAppointment = ref<AppointmentListItem>()
const rescheduleStart = ref<Date>(new Date())
const rescheduleEnd = ref<Date>(new Date())
const overrideReason = ref("")

const createVisible = ref(false)
type AppointmentPersonOption = {id: number; name: string; clinic_id: number}
type CreateServiceSource = "PACKAGE" | "PROMO" | "INDIVIDUAL"
type IndividualServiceOption = {id: string; name: string; price: number}
const patientOptions = ref<AppointmentPersonOption[]>([])
const doctorOptions = ref<AppointmentPersonOption[]>([])
const clinicOptions = ref<Clinic[]>([])
const packageOptions = ref<PackageLookup[]>([])
const individualServiceOptions = ref<IndividualServiceOption[]>([])
const promoOfferOptions = PROMO_OFFERS_CATALOG
const serviceSourceOptions: Array<{label: string; value: CreateServiceSource}> = [
  {label: "Package", value: "PACKAGE"},
  {label: "Promo / Offer", value: "PROMO"},
  {label: "Individual Service", value: "INDIVIDUAL"},
]
const selectedClinicId = ref<number>()
const createPatient = ref<number>()
const createDoctor = ref<number>()
const createServiceSource = ref<CreateServiceSource>("PACKAGE")
const createPackageId = ref<number>()
const createPromoOfferId = ref<string>()
const createIndividualServiceId = ref<string>()
const createAmountDue = ref(0)
const createBillingNotes = ref("")
const createStart = ref<Date>(new Date())
const createEnd = ref<Date>(new Date(Date.now() + 60 * 60 * 1000))
const bookedDateKeys = ref<Set<string>>(new Set())
const bookedMonthCache = ref<Map<string, Set<string>>>(new Map())
const visibleMonth = ref<number>(new Date().getMonth())
const visibleYear = ref<number>(new Date().getFullYear())

const needsOverrideReason = computed(() => (activeAppointment.value?.reschedule_count ?? 0) >= 3)
const canDeleteAppointments = computed(() => roleName.value === "Owner")

const formatLocalDateKey = (date: Date): string => {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const selectedDateIso = computed(() => formatLocalDateKey(calendarDate.value))
const sectionCardClass = "app-section-card-comfy space-y-4"
const sectionTitleClass = "app-section-title"
const detailCardClass = "rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"
const selectedClinic = computed(() => clinicOptions.value.find(clinic => clinic.id === selectedClinicId.value))
const selectedDateLabel = computed(() =>
  calendarDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)
const selectedClinicScheduleLabel = computed(() => {
  if (!selectedClinic.value) return ""
  return `${selectedClinic.value.name}: ${selectedClinic.value.start_day_name} to ${selectedClinic.value.end_day_name}, ${selectedClinic.value.start_time_formatted} - ${selectedClinic.value.end_time_formatted}`
})
const isOvernightClinicSchedule = computed(() => {
  const start = getClinicStartMinutes()
  const end = getClinicEndMinutes()
  if (start == null || end == null) return false
  return end < start
})
const calendarDisabledDays = computed<number[]>(() => {
  if (!selectedClinic.value) return []
  const disabled: number[] = []
  for (let jsDay = 0; jsDay < 7; jsDay++) {
    const clinicDay = jsDay === 0 ? 7 : jsDay
    if (!isClinicDayAllowed(clinicDay)) disabled.push(jsDay)
  }
  return disabled
})

const billingSeverity = (status: string): "success" | "warn" | "danger" | "info" => {
  const normalized = (status || "UNBILLED").toUpperCase()
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}
const displayBillingStatus = (status?: string): string => (status?.trim() || "UNBILLED").toUpperCase()
const selectedPromoOffer = computed(() =>
  promoOfferOptions.find(option => option.id === createPromoOfferId.value)
)
const selectedPackageOption = computed(() =>
  packageOptions.value.find(option => option.id === createPackageId.value)
)
const selectedIndividualService = computed(() =>
  individualServiceOptions.value.find(option => option.id === createIndividualServiceId.value)
)

const formatDateTime = (value: string): string => new Date(value).toLocaleString()
const toDateKey = (year: number, month: number, day: number): string => {
  const mm = String(month + 1).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

const hasBookingDot = (date: {year: number; month: number; day: number}): boolean => {
  // PrimeVue month in slot date can vary by version (0-based vs 1-based).
  const monthAsZeroBased = toDateKey(date.year, date.month, date.day)
  const monthAsOneBased = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`
  return bookedDateKeys.value.has(monthAsZeroBased) || bookedDateKeys.value.has(monthAsOneBased)
}

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

const getClinicStartMinutes = (): number | undefined => {
  const clinic = selectedClinic.value
  if (!clinic) return undefined
  return toMinutesFromTime((clinic as {start_time_formatted?: string}).start_time_formatted) ??
    toMinutesFromTime(clinic.start_time)
}

const getClinicEndMinutes = (): number | undefined => {
  const clinic = selectedClinic.value
  if (!clinic) return undefined
  return toMinutesFromTime((clinic as {end_time_formatted?: string}).end_time_formatted) ??
    toMinutesFromTime(clinic.end_time)
}

const isClinicDayAllowed = (clinicDay: number): boolean => {
  const clinic = selectedClinic.value
  if (!clinic) return true
  if (clinic.start_day <= clinic.end_day) {
    return clinicDay >= clinic.start_day && clinicDay <= clinic.end_day
  }
  return clinicDay >= clinic.start_day || clinicDay <= clinic.end_day
}

const isWithinClinicTime = (date: Date): boolean => {
  if (!selectedClinic.value) return true
  const startMinutes = getClinicStartMinutes()
  const endMinutes = getClinicEndMinutes()
  if (startMinutes == null || endMinutes == null) return true
  const minutes = date.getHours() * 60 + date.getMinutes()
  if (endMinutes >= startMinutes) {
    return minutes >= startMinutes && minutes <= endMinutes
  }
  // Overnight schedule support (e.g. 8:00 AM to 5:00 AM next day).
  return minutes >= startMinutes || minutes <= endMinutes
}

const isFiveMinuteAligned = (date: Date): boolean => {
  return date.getMinutes() % 5 === 0 && date.getSeconds() === 0
}

const validateClinicSchedule = (start: Date, end: Date): boolean => {
  if (end <= start) {
    errorToast(toast, "End time must be after start time")
    return false
  }

  const startClinicDay = start.getDay() === 0 ? 7 : start.getDay()
  const endClinicDay = end.getDay() === 0 ? 7 : end.getDay()

  if (!isClinicDayAllowed(startClinicDay) || !isClinicDayAllowed(endClinicDay)) {
    errorToast(toast, "Selected date is outside clinic operating days")
    return false
  }

  if (!isWithinClinicTime(start) || !isWithinClinicTime(end)) {
    errorToast(toast, "Selected time is outside clinic operating hours")
    return false
  }

  if (!isFiveMinuteAligned(start) || !isFiveMinuteAligned(end)) {
    errorToast(toast, "Time must be in 5-minute increments")
    return false
  }
  return true
}

const findNextAllowedDate = (baseDate: Date): Date => {
  const next = new Date(baseDate)
  for (let i = 0; i < 14; i++) {
    const clinicDay = next.getDay() === 0 ? 7 : next.getDay()
    if (isClinicDayAllowed(clinicDay)) return next
    next.setDate(next.getDate() + 1)
  }
  return baseDate
}

const snapToFiveMinutes = (date: Date): Date => {
  const result = new Date(date)
  const snappedMinutes = Math.floor(result.getMinutes() / 5) * 5
  result.setMinutes(snappedMinutes, 0, 0)
  return result
}

const alignToClinicStart = (date: Date): Date => {
  const result = new Date(date)
  result.setSeconds(0, 0)
  const clinicStart = getClinicStartMinutes()
  if (clinicStart != null) {
    result.setHours(Math.floor(clinicStart / 60), clinicStart % 60, 0, 0)
  } else {
    return snapToFiveMinutes(result)
  }
  return result
}

const fetchBookedDatesForMonth = async (year: number, month: number): Promise<void> => {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const cached = bookedMonthCache.value.get(monthKey)
  if (cached) {
    bookedDateKeys.value = new Set(cached)
    return
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthDots = new Set<string>()

  // Use sequential requests to avoid overloading API and missing dots from transient failures.
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toDateKey(year, month, day)
    let hasBooking = false
    try {
      const rows = await appointmentPhase1Service.getDay(dateKey)
      hasBooking = (rows ?? []).length > 0
    } catch {
      try {
        const retryRows = await appointmentPhase1Service.getDay(dateKey)
        hasBooking = (retryRows ?? []).length > 0
      } catch {
        hasBooking = false
      }
    }
    if (hasBooking) monthDots.add(dateKey)
  }

  bookedMonthCache.value.set(monthKey, monthDots)
  bookedDateKeys.value = new Set(monthDots)
}

const refreshBookedDotsForVisibleMonth = async (): Promise<void> => {
  const monthKey = `${visibleYear.value}-${String(visibleMonth.value + 1).padStart(2, "0")}`
  bookedMonthCache.value.delete(monthKey)
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const onCalendarMonthChange = async (event: {month: number; year: number}): Promise<void> => {
  visibleMonth.value = event.month
  visibleYear.value = event.year
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const fetchAppointments = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await appointmentPhase1Service.getAll({
      page: page.value,
      size: pageSize.value,
      status: statusFilter.value?.trim() || undefined,
      date: selectedDateIso.value
    })
    appointments.value = response?.content ?? []
    totalElements.value = response?.total_elements ?? 0
  } catch (error: unknown) {
    errorToast(toast, "Failed to load appointments")
  } finally {
    isLoading.value = false
  }
}

const fetchDayBookings = async (): Promise<void> => {
  try {
    dayBookings.value = await appointmentPhase1Service.getDay(selectedDateIso.value) ?? []
  } catch (error: unknown) {
    dayBookings.value = []
  }
}

const refreshAll = async (): Promise<void> => {
  await fetchAppointments()
  await fetchDayBookings()
}

const loadCreateLookups = async (): Promise<void> => {
  const [patientsPage, doctorsPage, clinics, packages, techniquesPage, evaluationsPage, machinesPage] = await Promise.all([
    patientService.getAll({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined
      }
    }),
    staffService.getAll({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined
      }
    }),
    clinicService.getAll({
      page: defaultPage,
      size: 100,
      status: Status.ACTIVE,
      name: undefined
    }),
    billingPhase1Service.getPackages(),
    techniqueService.getAll({page: defaultPage, size: 100, name: undefined, status: Status.ACTIVE}),
    evaluationService.getAll({page: defaultPage, size: 100, name: undefined, status: Status.ACTIVE}),
    machineService.getAll({page: defaultPage, size: 100, name: undefined, status: Status.ACTIVE}),
  ])

  patientOptions.value = (patientsPage?.content ?? []).map((patient: Patient) => ({
    id: patient.id,
    name: [patient.first_name, patient.middle_name, patient.last_name]
      .filter((part): part is string => !!part && part.toLowerCase() !== "null")
      .join(" "),
    clinic_id: patient.clinic_id
  }))
  doctorOptions.value = (doctorsPage?.content ?? []).map((doctor: Staff) => ({
    id: doctor.id,
    name: doctor.name,
    clinic_id: doctor.clinic_id
  }))
  packageOptions.value = packages ?? []
  individualServiceOptions.value = [
    ...(techniquesPage?.content ?? []).map((item: Offer) => ({id: `technique-${item.id}`, name: `Technique: ${item.name}`, price: item.price})),
    ...(evaluationsPage?.content ?? []).map((item: Offer) => ({id: `evaluation-${item.id}`, name: `Evaluation: ${item.name}`, price: item.price})),
    ...(machinesPage?.content ?? []).map((item: Offer) => ({id: `machine-${item.id}`, name: `Machine: ${item.name}`, price: item.price})),
  ]
  clinicOptions.value = clinics?.content ?? []
  if (!selectedClinicId.value && clinicOptions.value.length) {
    selectedClinicId.value = clinicOptions.value[0].id
  }
}

const openCreateDialog = async (): Promise<void> => {
  if (!patientOptions.value.length) {
    await loadCreateLookups()
  }
  createPatient.value = undefined
  createDoctor.value = undefined
  createServiceSource.value = "PACKAGE"
  createPackageId.value = undefined
  createPromoOfferId.value = undefined
  createIndividualServiceId.value = undefined
  createAmountDue.value = 0
  createBillingNotes.value = ""
  const base = alignToClinicStart(findNextAllowedDate(new Date(calendarDate.value)))
  createStart.value = base
  createEnd.value = new Date(base.getTime() + 60 * 60 * 1000)
  createVisible.value = true
}

const submitCreateAppointment = async (): Promise<void> => {
  if (!createPatient.value) {
    errorToast(toast, "Patient is required")
    return
  }
  if (createAmountDue.value <= 0) {
    errorToast(toast, "Please select a service/package with valid amount due")
    return
  }
  if (!validateClinicSchedule(createStart.value, createEnd.value)) return

  const appointmentPayload: Parameters<typeof appointmentPhase1Service.create>[0] = {
    patient_id: createPatient.value,
    doctor_id: createDoctor.value,
    starts_at: createStart.value.toISOString(),
    ends_at: createEnd.value.toISOString(),
    amount_due: createAmountDue.value,
    notes: createBillingNotes.value.trim() || undefined,
  }

  if (createServiceSource.value === "PACKAGE") {
    if (!createPackageId.value || !selectedPackageOption.value) {
      errorToast(toast, "Package is required")
      return
    }
    appointmentPayload.package_id = createPackageId.value
    appointmentPayload.service_name = selectedPackageOption.value.name
    appointmentPayload.billing_type = "PACKAGE_BILLING"
    appointmentPayload.service_type = "PACKAGE"
  } else if (createServiceSource.value === "PROMO") {
    if (!selectedPromoOffer.value) {
      errorToast(toast, "Promo offer is required")
      return
    }
    appointmentPayload.service_name = selectedPromoOffer.value.name
    appointmentPayload.billing_type = selectedPromoOffer.value.billing_type
    appointmentPayload.service_type = selectedPromoOffer.value.service_type
  } else {
    if (!selectedIndividualService.value) {
      errorToast(toast, "Individual service is required")
      return
    }
    appointmentPayload.service_name = selectedIndividualService.value.name
    appointmentPayload.billing_type = "INDIVIDUAL_PRICING"
    appointmentPayload.service_type = "SINGLE"
  }

  try {
    await appointmentPhase1Service.create(appointmentPayload)
    successToast(toast, "Appointment created")
    createVisible.value = false
    await refreshAll()
    await refreshBookedDotsForVisibleMonth()
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const detail = error.response?.data?.message || error.response?.data?.detail || error.message
      if (status === 401) {
        errorToast(toast, "Session expired (401). Please log in again.")
        return
      }
      if (status === 403) {
        errorToast(toast, "Permission denied (403): cannot create appointment.")
        return
      }
      errorToast(toast, `Create failed${status ? ` (${status})` : ""}: ${detail}`)
      return
    }
    errorToast(toast, "Failed to create appointment")
  }
}

const onPage = async (event: DataTablePageEvent): Promise<void> => {
  page.value = Math.floor((event.first ?? 0) / (event.rows ?? pageSize.value)) + 1
  pageSize.value = event.rows ?? pageSize.value
  await fetchAppointments()
}

const onSelectRow = async (event: {data: AppointmentListItem}): Promise<void> => {
  const detail = await appointmentPhase1Service.getById(event.data.id)
  selectedDetail.value = detail
}

const openReschedule = (appointment: AppointmentListItem): void => {
  activeAppointment.value = appointment
  rescheduleStart.value = snapToFiveMinutes(new Date(appointment.starts_at))
  rescheduleEnd.value = snapToFiveMinutes(new Date(appointment.ends_at))
  overrideReason.value = ""
  rescheduleVisible.value = true
}

const submitReschedule = async (): Promise<void> => {
  if (!activeAppointment.value) return
  if (needsOverrideReason.value && !overrideReason.value.trim()) {
    errorToast(toast, "Owner override reason is required after 3 reschedules")
    return
  }
  if (!validateClinicSchedule(rescheduleStart.value, rescheduleEnd.value)) return
  try {
    await appointmentPhase1Service.reschedule(activeAppointment.value.id, {
      starts_at: rescheduleStart.value.toISOString(),
      ends_at: rescheduleEnd.value.toISOString(),
      override_reason: overrideReason.value.trim() || undefined
    })
    successToast(toast, "Reschedule successful")
    rescheduleVisible.value = false
    await refreshAll()
    await refreshBookedDotsForVisibleMonth()
    if (selectedDetail.value?.id === activeAppointment.value.id) {
      selectedDetail.value = await appointmentPhase1Service.getById(activeAppointment.value.id)
    }
  } catch (error: unknown) {
    errorToast(toast, "Reschedule blocked. Check max count or owner override reason.")
  }
}

const onExportCsv = async (): Promise<void> => {
  const response = await appointmentPhase1Service.exportCsv({
    status: statusFilter.value?.trim() || undefined,
    date: selectedDateIso.value
  })
  if (!response) return
  exportToExcel(response)
}

const syncRoleFromStorage = () => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole
      if (typeof role === "string" && role.trim()) {
        roleName.value = role.trim()
        return
      }
    } catch {
      // ignore malformed value
    }
  }
  roleName.value = ""
}

const confirmDeleteAppointment = (appointment: AppointmentListItem): void => {
  confirm.require({
    message: `Delete appointment for ${appointment.patient_name}?`,
    header: "Delete Appointment",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
      icon: "pi pi-trash",
    },
    accept: async () => {
      try {
        await appointmentPhase1Service.delete(appointment.id)
        successToast(toast, "Appointment deleted")
        if (selectedDetail.value?.id === appointment.id) {
          selectedDetail.value = undefined
        }
        await refreshAll()
        await refreshBookedDotsForVisibleMonth()
      } catch {
        errorToast(toast, "Delete appointment failed")
      }
    },
  })
}

const goToPatients = async (): Promise<void> => {
  if (!selectedDetail.value) return
  await router.push({
    path: "/patients",
    query: {
      patientId: String(selectedDetail.value.patient_id),
      name: selectedDetail.value.patient_name
    }
  })
}

const goToBilling = async (): Promise<void> => {
  if (!selectedDetail.value) return
  await router.push({
    path: "/billing",
    query: {
      patientId: String(selectedDetail.value.patient_id),
      appointmentId: String(selectedDetail.value.id),
      ...(selectedDetail.value.billing_id ? {billingId: String(selectedDetail.value.billing_id)} : {})
    }
  })
}

watch([calendarDate, statusFilter], async () => {
  page.value = 1
  await refreshAll()
})

watch(selectedClinicId, () => {
  const normalizedDate = findNextAllowedDate(new Date(calendarDate.value))
  if (normalizedDate.toDateString() !== calendarDate.value.toDateString()) {
    calendarDate.value = normalizedDate
  }
})

watch(createPatient, (patientId) => {
  if (!patientId) return
  const selectedPatientOption = patientOptions.value.find(option => option.id === patientId)
  if (selectedPatientOption?.clinic_id) {
    selectedClinicId.value = selectedPatientOption.clinic_id
  }
})

watch(createDoctor, (doctorId) => {
  if (!doctorId || createPatient.value) return
  const selectedDoctorOption = doctorOptions.value.find(option => option.id === doctorId)
  if (selectedDoctorOption?.clinic_id) {
    selectedClinicId.value = selectedDoctorOption.clinic_id
  }
})

watch(createServiceSource, (source) => {
  if (source === "PACKAGE") {
    createPromoOfferId.value = undefined
    createIndividualServiceId.value = undefined
    createAmountDue.value = selectedPackageOption.value?.price ?? 0
    return
  }
  if (source === "PROMO") {
    createPackageId.value = undefined
    createIndividualServiceId.value = undefined
    createAmountDue.value = selectedPromoOffer.value?.promo_price ?? 0
    return
  }
  createPackageId.value = undefined
  createPromoOfferId.value = undefined
  createAmountDue.value = selectedIndividualService.value?.price ?? 0
})

watch(createPackageId, () => {
  if (createServiceSource.value !== "PACKAGE") return
  createAmountDue.value = selectedPackageOption.value?.price ?? 0
})

watch(createPromoOfferId, () => {
  if (createServiceSource.value !== "PROMO") return
  createAmountDue.value = selectedPromoOffer.value?.promo_price ?? 0
})

watch(createIndividualServiceId, () => {
  if (createServiceSource.value !== "INDIVIDUAL") return
  createAmountDue.value = selectedIndividualService.value?.price ?? 0
})

onMounted(async () => {
  syncRoleFromStorage()
  await loadCreateLookups()
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
  await refreshAll()
})
</script>


