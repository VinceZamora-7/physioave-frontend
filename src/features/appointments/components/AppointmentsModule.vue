<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold">Clinic Workflow</h2>
          <p class="text-sm opacity-70">Appointment scheduling, attendance, and home service tracking</p>
        </div>
        <Tag v-if="selectedPatientName" :value="`Patient: ${selectedPatientName}`" severity="info" />
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <InputText v-model="form.patient_name" fluid />
          <label>Patient</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="form.doctor_name" fluid placeholder="Doctor / therapist" />
          <label>Doctor</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="form.clinic_name" fluid placeholder="Clinic name" />
          <label>Clinic</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="form.appointment_type" fluid placeholder="Initial / Follow-up / Session" />
          <label>Type</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-2">
          <DatePicker
            v-model="appointmentAt"
            showTime
            hourFormat="12"
            fluid
            :manualInput="false"
          />
          <label>Appointment Date and Time</label>
        </IftaLabel>

        <div class="flex items-center gap-2">
          <Checkbox v-model="form.is_home_service" input-id="home-service" binary />
          <label for="home-service" class="text-sm">Home service</label>
        </div>

        <Button label="Schedule Appointment" icon="pi pi-calendar-plus" @click="submitAppointment" />
      </div>

      <DataTable :value="rows" dataKey="id" paginator :rows="8" responsiveLayout="scroll" size="small">
        <Column field="patient_name" header="Patient" />
        <Column field="doctor_name" header="Doctor" />
        <Column field="appointment_at" header="Schedule">
          <template #body="{ data }">{{ formatDateTime(data.appointment_at) }}</template>
        </Column>
        <Column field="status" header="Status">
          <template #body="{ data }">
            <Select
              :modelValue="data.status"
              :options="appointmentStatuses"
              class="w-40"
              @update:modelValue="onStatusChange(data.id, $event)"
            />
          </template>
        </Column>
        <Column field="attendance" header="Attendance">
          <template #body="{ data }">
            <Select
              :modelValue="data.attendance"
              :options="attendanceStatuses"
              class="w-36"
              @update:modelValue="onAttendanceChange(data.id, $event)"
            />
          </template>
        </Column>
        <Column field="home_service_attendance" header="Home Service">
          <template #body="{ data }">
            <Select
              :disabled="!data.is_home_service"
              :modelValue="data.home_service_attendance"
              :options="homeServiceStatuses"
              class="w-44"
              @update:modelValue="onHomeServiceChange(data.id, $event)"
            />
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button
              text
              severity="danger"
              icon="pi pi-trash"
              @click="removeRow(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="mt-5 rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Treatment Card</h3>
        <p class="text-sm opacity-70">Session-by-session treatment details</p>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <InputText v-model="treatment.patient_name" fluid />
          <label>Patient</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="treatment.session_no" :min="1" fluid />
          <label>Session No.</label>
        </IftaLabel>

        <IftaLabel>
          <DatePicker v-model="treatmentDate" fluid :manualInput="false" />
          <label>Treatment Date</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="treatment.therapist" fluid />
          <label>Therapist</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-2">
          <InputText v-model="treatment.diagnosis" fluid />
          <label>Diagnosis</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-2">
          <InputText v-model="treatment.treatment_plan" fluid />
          <label>Treatment Plan</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-4">
          <InputText v-model="treatment.remarks" fluid />
          <label>Remarks</label>
        </IftaLabel>
      </div>

      <Button label="Save Treatment Card Entry" icon="pi pi-save" @click="submitTreatmentCard" />

      <DataTable :value="treatmentRows" dataKey="id" paginator :rows="6" responsiveLayout="scroll" size="small">
        <Column field="patient_name" header="Patient" />
        <Column field="session_no" header="Session" />
        <Column field="treatment_date" header="Date" />
        <Column field="diagnosis" header="Diagnosis" />
        <Column field="treatment_plan" header="Treatment Plan" />
        <Column field="therapist" header="Therapist" />
        <Column header="Actions">
          <template #body="{ data }">
            <Button
              text
              severity="danger"
              icon="pi pi-trash"
              @click="removeTreatmentRow(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {useToast} from "primevue";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import IftaLabel from "primevue/iftalabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {appointmentStore, type AppointmentStatus, type AttendanceStatus, type HomeServiceAttendanceStatus} from "@/stores/appointment.store";
import {auditStore} from "@/stores/audit.store";
import {successToast, warningToast} from "@/utils/toast.util";

const toast = useToast()
const useAppointmentStore = appointmentStore()
const useAuditStore = auditStore()

const selectedPatientName = computed(() => useAppointmentStore.patient?.full_name)

const appointmentStatuses: AppointmentStatus[] = ["scheduled", "completed", "cancelled", "no-show"]
const attendanceStatuses: AttendanceStatus[] = ["pending", "present", "absent"]
const homeServiceStatuses: HomeServiceAttendanceStatus[] = ["not-applicable", "en-route", "arrived", "completed", "cancelled"]

const appointmentAt = ref<Date>(new Date())
const form = ref({
  patient_name: selectedPatientName.value ?? "",
  doctor_name: useAppointmentStore.staff?.name ?? "",
  clinic_name: useAppointmentStore.patient?.clinic_name ?? "",
  appointment_type: "Session",
  is_home_service: false
})

const treatmentDate = ref<Date>(new Date())
const treatment = ref({
  patient_name: selectedPatientName.value ?? "",
  session_no: 1,
  diagnosis: "",
  treatment_plan: "",
  therapist: useAppointmentStore.staff?.name ?? "",
  remarks: ""
})

const rows = computed(() => useAppointmentStore.selectedPatientAppointments)
const treatmentRows = computed(() => useAppointmentStore.selectedPatientTreatmentCards)

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString()

const submitAppointment = (): void => {
  const patientId = useAppointmentStore.patient?.id
  if (!patientId || !form.value.patient_name.trim() || !form.value.doctor_name.trim()) {
    warningToast(toast, "Patient and doctor are required")
    return
  }

  const created = useAppointmentStore.scheduleAppointment({
    patient_id: patientId,
    patient_name: form.value.patient_name.trim(),
    doctor_id: useAppointmentStore.staff?.id,
    doctor_name: form.value.doctor_name.trim(),
    clinic_name: form.value.clinic_name.trim() || "No clinic",
    appointment_at: appointmentAt.value.toISOString(),
    appointment_type: form.value.appointment_type.trim() || "Session",
    status: "scheduled",
    attendance: "pending",
    is_home_service: form.value.is_home_service,
    home_service_attendance: form.value.is_home_service ? "en-route" : "not-applicable",
    notes: undefined
  })

  useAuditStore.logAction({
    user: "Current User",
    module: "Appointments",
    action: "Create",
    details: `Scheduled appointment for ${created.patient_name} with ${created.doctor_name}`
  })

  successToast(toast, "Appointment scheduled")
}

const onStatusChange = (id: string, value: AppointmentStatus): void => {
  useAppointmentStore.updateAppointment(id, {status: value})
  useAuditStore.logAction({
    user: "Current User",
    module: "Appointments",
    action: "Status Update",
    details: `Appointment status changed to ${value}`
  })
}

const onAttendanceChange = (id: string, value: AttendanceStatus): void => {
  useAppointmentStore.updateAppointment(id, {attendance: value})
  useAuditStore.logAction({
    user: "Current User",
    module: "Appointments",
    action: "Attendance Update",
    details: `Attendance changed to ${value}`
  })
}

const onHomeServiceChange = (id: string, value: HomeServiceAttendanceStatus): void => {
  useAppointmentStore.updateAppointment(id, {home_service_attendance: value})
  useAuditStore.logAction({
    user: "Current User",
    module: "Appointments",
    action: "Home Service Update",
    details: `Home service attendance changed to ${value}`
  })
}

const removeRow = (id: string): void => {
  useAppointmentStore.removeAppointment(id)
  useAuditStore.logAction({
    user: "Current User",
    module: "Appointments",
    action: "Delete",
    details: "Deleted appointment record"
  })
}

const submitTreatmentCard = (): void => {
  const patientId = useAppointmentStore.patient?.id
  if (!patientId || !treatment.value.diagnosis.trim() || !treatment.value.treatment_plan.trim()) {
    warningToast(toast, "Patient, diagnosis, and treatment plan are required")
    return
  }

  const created = useAppointmentStore.saveTreatmentCard({
    patient_id: patientId,
    patient_name: treatment.value.patient_name.trim(),
    session_no: treatment.value.session_no || 1,
    treatment_date: treatmentDate.value.toISOString().slice(0, 10),
    diagnosis: treatment.value.diagnosis.trim(),
    treatment_plan: treatment.value.treatment_plan.trim(),
    therapist: treatment.value.therapist.trim() || "N/A",
    remarks: treatment.value.remarks.trim() || undefined
  })

  useAuditStore.logAction({
    user: "Current User",
    module: "Treatment Card",
    action: "Create",
    details: `Saved treatment card session #${created.session_no} for ${created.patient_name}`
  })
  successToast(toast, "Treatment card saved")
}

const removeTreatmentRow = (id: string): void => {
  useAppointmentStore.removeTreatmentCard(id)
  useAuditStore.logAction({
    user: "Current User",
    module: "Treatment Card",
    action: "Delete",
    details: "Deleted treatment card entry"
  })
}
</script>
