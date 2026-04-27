<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="`Appointments — ${patient?.full_name ?? ''}`"
    :style="{ width: '72rem', maxWidth: '95vw' }"
    :draggable="false"
  >
    <div class="space-y-4">
      <!-- summary badges -->
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

          <Column field="starts_at" header="Date & Time">
            <template #body="{ data }">
              <div>{{ formatDate(data.starts_at) }}</div>
              <div class="text-xs opacity-60">{{ formatTime(data.starts_at) }} – {{ formatTime(data.ends_at) }}</div>
            </template>
          </Column>

          <Column field="clinic_name" header="Clinic" />

          <Column field="doctor_name" header="Assigned PT">
            <template #body="{ data }">{{ data.doctor_name || 'Unassigned' }}</template>
          </Column>

          <Column field="appointment_phase" header="Phase">
            <template #body="{ data }">
              <Tag :value="displayPhase(data.appointment_phase)" :severity="phaseSeverity(data.appointment_phase)" />
            </template>
          </Column>

          <Column field="appointment_status" header="Status">
            <template #body="{ data }">
              <Tag :value="displayStatus(data.appointment_status)" :severity="statusSeverity(data.appointment_status)" />
            </template>
          </Column>

          <Column field="billing_status" header="Billing">
            <template #body="{ data }">
              <Tag :value="displayBilling(data.billing_status)" :severity="billingSeverity(data.billing_status)" />
            </template>
          </Column>

          <Column field="location_context" header="Location">
            <template #body="{ data }">
              <Tag
                :value="data.location_context === 'HOME_CARE' ? 'Home Care' : 'In-Clinic'"
                :severity="data.location_context === 'HOME_CARE' ? 'warn' : 'success'"
              />
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
import {
  appointmentPhase1Service,
  type AppointmentListItem,
  type AppointmentPhase
} from "@/features/appointments/api/appointment-phase1.service"
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

// helpers
const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-PH", {weekday: "short", month: "short", day: "numeric", year: "numeric"})

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("en-PH", {hour: "numeric", minute: "2-digit"})

const displayPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}

const phaseSeverity = (phase?: AppointmentPhase): "contrast" | "info" | "warn" => {
  if (phase === "EVAL") return "info"
  if (phase === "RE_EVAL") return "warn"
  return "contrast"
}

const displayStatus = (status?: string): string =>
  String(status ?? "PENDING").trim().toUpperCase().split("_").join(" ")

const statusSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const s = String(status ?? "").trim().toUpperCase().split(" ").join("_")
  if (s === "COMPLETED") return "success"
  if (s === "RESCHEDULED") return "warn"
  if (s === "CANCELLED" || s === "NO_SHOW") return "danger"
  return "info"
}

const displayBilling = (status?: string): string =>
  (status?.trim() || "UNBILLED").toUpperCase()

const billingSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const s = displayBilling(status)
  if (s === "PAID" || s === "BILLED") return "success"
  if (s === "PARTIAL" || s === "PENDING") return "warn"
  if (s === "VOID") return "danger"
  return "info"
}
</script>
