<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="`Appointments - ${patient?.full_name ?? ''}`"
    :style="{ width: '78rem', maxWidth: '95vw' }"
    :draggable="false"
  >
    <div class="space-y-4">
      <div v-if="!isLoading && appointments.length" class="flex flex-wrap gap-2 text-xs">
        <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-1">
          {{ totalRecords }} total appointment{{ totalRecords === 1 ? '' : 's' }}
        </span>
      </div>

      <div class="overflow-x-auto">
        <DataTable
          :value="appointments"
          dataKey="id"
          paginator
          :rows="pageSize"
          :totalRecords="totalRecords"
          :loading="isLoading"
          lazy
          @page="onPage"
          :pt="{
            column: {
              headerCell: { class: 'px-4 py-3' },
              bodyCell: { class: 'px-4 py-3' }
            }
          }"
        >
          <template #empty>
            <div class="py-10 text-center text-sm opacity-70">
              No appointments found for this patient.
            </div>
          </template>

          <Column field="starts_at" header="Date">
            <template #body="{ data }">
              <div>{{ formatDate(data.starts_at) }}</div>
              <div class="text-xs opacity-60">{{ formatTimeRange(data.starts_at, data.ends_at) }}</div>
            </template>
          </Column>

          <Column field="appointment_status" header="Status">
            <template #body="{ data }">
              <Tag :value="displayStatus(data.appointment_status)" :severity="statusSeverity(data.appointment_status)" />
            </template>
          </Column>

          <Column field="provider_name" header="Provider">
            <template #body="{ data }">
              {{ data.provider_name || "—" }}
            </template>
          </Column>

          <Column field="appointment_phase" header="Phase">
            <template #body="{ data }">
              {{ displayValue(data.appointment_phase) }}
            </template>
          </Column>

          <Column field="billing_status" header="Billing">
            <template #body="{ data }">
              <div>{{ displayStatus(data.billing_status) }}</div>
              <div class="text-xs opacity-60">{{ data.billing_public_id || "No billing record" }}</div>
            </template>
          </Column>

          <Column field="public_id" header="Appointment #">
            <template #body="{ data }">
              {{ data.public_id || `APPT-${data.id}` }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import {ref, watch} from "vue"
import {useToast} from "primevue/usetoast"
import Column from "primevue/column"
import DataTable, {type DataTablePageEvent} from "primevue/datatable"
import Dialog from "primevue/dialog"
import Tag from "primevue/tag"
import {appointmentPhase1Service, type AppointmentListItem} from "@/features/appointments/api/appointment-phase1.service"
import type {Patient} from "@/features/patients/types/patient"
import {errorToast} from "@/utils/toast.util"

const props = defineProps<{
  patient: Patient | undefined
}>()

const toast = useToast()

const visible = ref(false)
const isLoading = ref(false)
const appointments = ref<AppointmentListItem[]>([])
const totalRecords = ref(0)
const page = ref(1)
const pageSize = 15

const open = (): void => {
  visible.value = true
}

defineExpose({open})

const fetchAppointments = async (): Promise<void> => {
  if (!props.patient) return
  try {
    isLoading.value = true
    const response = await appointmentPhase1Service.getAll({
      patient_id: props.patient.id,
      page: page.value,
      size: pageSize
    })
    appointments.value = response?.content ?? []
    totalRecords.value = response?.total_elements ?? 0
  } catch {
    errorToast(toast, "Failed to load appointments for this patient")
  } finally {
    isLoading.value = false
  }
}

const onPage = async (event: DataTablePageEvent): Promise<void> => {
  page.value = Math.floor((event.first ?? 0) / (event.rows ?? pageSize)) + 1
  await fetchAppointments()
}

watch(visible, (isVisible) => {
  if (isVisible) {
    page.value = 1
    void fetchAppointments()
  } else {
    appointments.value = []
    totalRecords.value = 0
  }
})

const formatDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString("en-PH", {month: "short", day: "numeric", year: "numeric"}) : "—"

const formatTime = (iso?: string): string =>
  iso ? new Date(iso).toLocaleTimeString("en-PH", {hour: "numeric", minute: "2-digit"}) : "—"

const formatTimeRange = (start?: string, end?: string): string =>
  `${formatTime(start)} - ${formatTime(end)}`

const displayValue = (value?: string): string =>
  (value ?? "").replace(/_/g, " ").trim() || "—"

const displayStatus = (status?: string): string =>
  displayValue(status).toUpperCase()

const statusSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const s = displayStatus(status)
  if (s.includes("COMPLETE") || s === "PAID" || s === "BILLED") return "success"
  if (s.includes("PENDING") || s.includes("RESCHEDULE") || s === "PARTIAL") return "warn"
  if (s.includes("CANCEL") || s.includes("NO SHOW") || s === "VOID") return "danger"
  return "info"
}
</script>
