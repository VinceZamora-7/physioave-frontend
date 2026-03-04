<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] space-y-4">
    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-3">
      <div class="flex flex-wrap items-end gap-3">
        <Button label="Create Appointment" icon="pi pi-plus" @click="openCreateDialog" />
        <IftaLabel>
          <DatePicker v-model="calendarDate" fluid :manualInput="false" />
          <label>Calendar Day</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="statusFilter" fluid placeholder="Status (optional)" />
          <label>Status filter</label>
        </IftaLabel>
        <Button label="Refresh Table" icon="pi pi-refresh" outlined @click="refreshAll" />
        <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="onExportCsv" />
      </div>

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
            <Tag :value="data.billing_status" :severity="billingSeverity(data.billing_status)" />
          </template>
        </Column>
        <Column field="reschedule_count" header="Reschedules" />
        <Column header="Actions">
          <template #body="{data}">
            <Button size="small" text icon="pi pi-calendar-plus" @click="openReschedule(data)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-3">
      <h3 class="text-lg font-semibold">Calendar Day Bookings</h3>
      <DataTable :value="dayBookings" dataKey="id" size="small" selectionMode="single" @rowSelect="onSelectRow">
        <Column field="patient_name" header="Patient" />
        <Column field="starts_at" header="Start">
          <template #body="{data}">{{ formatDateTime(data.starts_at) }}</template>
        </Column>
        <Column field="billing_status" header="Billing">
          <template #body="{data}">
            <Tag :value="data.billing_status" :severity="billingSeverity(data.billing_status)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <section v-if="selectedDetail" class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-2">
      <h3 class="text-lg font-semibold">Appointment Detail</h3>
      <p><strong>Patient:</strong> {{ selectedDetail.patient_name }}</p>
      <p><strong>Doctor:</strong> {{ selectedDetail.doctor_name || "N/A" }}</p>
      <p><strong>Schedule:</strong> {{ formatDateTime(selectedDetail.starts_at) }} - {{ formatDateTime(selectedDetail.ends_at) }}</p>
      <p><strong>Billing Status:</strong> {{ selectedDetail.billing_status }}</p>
      <div class="flex flex-wrap gap-2">
        <Button label="Go to Patient" icon="pi pi-user" outlined @click="goToPatients" />
        <Button label="Go to Billing" icon="pi pi-receipt" severity="secondary" outlined @click="goToBilling" />
      </div>
    </section>

    <Dialog v-model:visible="rescheduleVisible" modal header="Reschedule Appointment" :style="{width:'520px'}">
      <div class="space-y-3">
        <p v-if="activeAppointment">Current reschedules: <strong>{{ activeAppointment.reschedule_count }}</strong> / 3</p>
        <IftaLabel>
          <DatePicker v-model="rescheduleStart" showTime fluid :manualInput="false" />
          <label>New Start</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker v-model="rescheduleEnd" showTime fluid :manualInput="false" />
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

        <IftaLabel>
          <DatePicker v-model="createStart" showTime fluid :manualInput="false" />
          <label>Start</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker v-model="createEnd" showTime fluid :manualInput="false" />
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
import {useToast} from "primevue";
import axios from "axios";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, {type DataTablePageEvent} from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import IftaLabel from "primevue/iftalabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {appointmentPhase1Service, type AppointmentDetail, type AppointmentListItem} from "@/features/appointments/api/appointment-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {errorToast, successToast} from "@/utils/toast.util";
import type {Lookup} from "@/models/global.model";
import {patientService} from "@/features/patients/api/patient.service";
import {staffService} from "@/features/staff/api/staff.service";
import {defaultPage, defaultPageSize} from "@/models/paging";
import {Status} from "@/utils/global.type";

const router = useRouter()
const toast = useToast()

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
const patientOptions = ref<Lookup[]>([])
const doctorOptions = ref<Lookup[]>([])
const createPatient = ref<number>()
const createDoctor = ref<number>()
const createStart = ref<Date>(new Date())
const createEnd = ref<Date>(new Date(Date.now() + 60 * 60 * 1000))

const needsOverrideReason = computed(() => (activeAppointment.value?.reschedule_count ?? 0) >= 3)

const selectedDateIso = computed(() => calendarDate.value.toISOString().slice(0, 10))

const billingSeverity = (status: string): "success" | "warn" | "danger" | "info" => {
  const normalized = status.toUpperCase()
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

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
  const [patientsLookup, doctorsLookup] = await Promise.all([
    patientService.getAllLookup({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: defaultPageSize,
        status: Status.ACTIVE,
        name: undefined
      }
    }),
    staffService.getAllLookup({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: defaultPageSize,
        status: Status.ACTIVE,
        name: undefined
      }
    })
  ])

  patientOptions.value = patientsLookup?.content ?? []
  doctorOptions.value = doctorsLookup?.content ?? []
}

const openCreateDialog = async (): Promise<void> => {
  if (!patientOptions.value.length) {
    await loadCreateLookups()
  }
  createPatient.value = undefined
  createDoctor.value = undefined
  createStart.value = new Date()
  createEnd.value = new Date(Date.now() + 60 * 60 * 1000)
  createVisible.value = true
}

const submitCreateAppointment = async (): Promise<void> => {
  if (!createPatient.value) {
    errorToast(toast, "Patient is required")
    return
  }

  try {
    await appointmentPhase1Service.create({
      patient_id: createPatient.value,
      doctor_id: createDoctor.value,
      starts_at: createStart.value.toISOString(),
      ends_at: createEnd.value.toISOString()
    })
    successToast(toast, "Appointment created")
    createVisible.value = false
    await refreshAll()
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
  rescheduleStart.value = new Date(appointment.starts_at)
  rescheduleEnd.value = new Date(appointment.ends_at)
  overrideReason.value = ""
  rescheduleVisible.value = true
}

const submitReschedule = async (): Promise<void> => {
  if (!activeAppointment.value) return
  try {
    await appointmentPhase1Service.reschedule(activeAppointment.value.id, {
      starts_at: rescheduleStart.value.toISOString(),
      ends_at: rescheduleEnd.value.toISOString(),
      override_reason: overrideReason.value.trim() || undefined
    })
    successToast(toast, "Reschedule successful")
    rescheduleVisible.value = false
    await refreshAll()
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

const goToPatients = async (): Promise<void> => {
  await router.push("/patients")
}

const goToBilling = async (): Promise<void> => {
  await router.push("/billing")
}

watch([calendarDate, statusFilter], async () => {
  page.value = 1
  await refreshAll()
})

onMounted(async () => {
  await refreshAll()
})
</script>
