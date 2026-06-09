<template>
  <Dialog
    :visible="visible"
    modal
    header="Appointment Details"
    :style="{ width: '68rem', maxWidth: '96vw' }"
    :draggable="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="appointment" class="space-y-5">
      <section class="app-appointment-card app-appointment-card-accent">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <div class="app-appointment-muted text-xs uppercase tracking-wide">Patient</div>
            <h3 class="app-appointment-title mt-1 truncate text-xl">{{ appointment.patient_name }}</h3>
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag :value="appointment.appointment_status" :severity="statusSeverity(appointment.appointment_status)" />
              <Tag :value="formatPayer(appointment.payer_type)" severity="info" />
              <Tag :value="displayAppointmentPhase(appointment.appointment_phase)" severity="secondary" />
              <Tag
                v-if="appointment.reschedule_flag || Number(appointment.reschedule_count ?? 0) > 0"
                value="Rescheduled"
                severity="warn"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailTile label="Date" :value="formatDate(appointment.starts_at)" />
            <DetailTile label="Time" :value="`${formatTime(appointment.starts_at)} - ${formatTime(appointment.ends_at)}`" />
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="app-appointment-card space-y-3 lg:col-span-2">
          <h4 class="app-appointment-title text-base">Schedule and Care Team</h4>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField label="Clinic" :value="appointment.clinic_name" />
            <DetailField label="Location" :value="displayLocationContext(appointment.location_context)" />
            <DetailField label="PT" :value="appointment.provider_name || appointment.doctor_name" />
            <DetailField label="Referring Staff" :value="appointment.referring_staff_name || appointment.referring_doctor_name" />
            <DetailField label="Support Staff" :value="appointment.support_staff_name" />
            <DetailField label="Specialty" :value="appointment.specialty_tag_name" />
            <DetailField label="Clinic Area" :value="appointment.treatment_area_name" />
            <DetailField label="Appointment Type" :value="appointment.appointment_type" />
          </div>
        </div>

        <div class="app-appointment-card space-y-3">
          <h4 class="app-appointment-title text-base">Status</h4>
          <DetailField label="Billing Status" :value="appointment.billing_status" />
          <DetailField label="Billing Type" :value="appointment.billing_type" />
          <DetailField label="Service Type" :value="appointment.service_type" />
          <DetailField label="Dropout Status" :value="appointment.dropout_status" />
          <DetailField label="Reschedule Count" :value="String(appointment.reschedule_count ?? 0)" />
        </div>
      </section>

      <section v-if="billingPreparation" class="app-appointment-card space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 class="app-appointment-title text-base">Billing</h4>
            <p class="app-appointment-muted mt-1 text-sm">
              {{ formatBillingPreparationStatus(billingPreparation.billing_path.status) }}
            </p>
          </div>

          <Button
            label="Open Billing"
            icon="pi pi-wallet"
            size="small"
            :pt="ptPrimaryBtn"
            @click="$emit('open-billing')"
          />
        </div>
      </section>

<section class="app-appointment-card space-y-3">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h4 class="app-appointment-title text-base">Planned Services</h4>
      <p class="app-appointment-muted mt-1 text-sm">
        Services and credits attached to this appointment.
      </p>
    </div>

    <Button
      v-if="canMarkAttendance"
      label="Attendance"
      icon="pi pi-check-square"
      severity="success"
      outlined
      size="small"
      @click="$emit('attendance')"
    />
  </div>

  <div
    v-if="!plannedServicesList.length"
    class="rounded-lg border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-4 py-4 text-center text-sm text-[rgb(var(--app-fg))]/60"
  >
    No planned services recorded.
  </div>

  <div v-else class="space-y-2">
    <article
      v-for="service in plannedServicesList"
      :key="plannedServiceKey(service)"
      class="flex flex-col gap-2 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <div class="break-words text-sm font-semibold text-[rgb(var(--app-fg))]">
          {{ plannedServiceName(service) }}
        </div>

        <div class="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">
          {{ plannedServiceType(service) }}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="rounded-full bg-[rgb(var(--app-card))] px-2.5 py-1 font-semibold text-[rgb(var(--app-fg))]/70">
          Planned: {{ plannedQuantity(service) }}
        </span>

        <span class="rounded-full bg-[rgb(var(--app-card))] px-2.5 py-1 font-semibold text-[rgb(var(--app-fg))]/70">
          Used: {{ consumedQuantity(service) }}
        </span>

        <span class="rounded-full bg-[rgb(var(--app-card))] px-2.5 py-1 font-semibold text-[rgb(var(--app-fg))]/70">
          Left: {{ remainingQuantity(service) }}
        </span>

        <Tag
          :value="plannedServiceStatus(service)"
          :severity="plannedServiceSeverity(service)"
        />
      </div>
    </article>
  </div>
</section>

      <section class="app-appointment-card space-y-3">
        <h4 class="app-appointment-title text-base">Doctor Diagnosis Details</h4>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailField label="Doctor Diagnosis" :value="appointment.medical_diagnose_name" />
          <DetailField label="Doctor Laterality" :value="displayLaterality(appointment.diagnosis_laterality)" />
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="app-appointment-card space-y-3">
          <h4 class="app-appointment-title text-base">Identifiers</h4>
          <DetailField label="Appointment ID" :value="appointment.public_id || String(appointment.id)" />
          <DetailField label="Patient ID" :value="appointment.patient_public_id || String(appointment.patient_id)" />
          <DetailField label="Billing ID" :value="appointment.billing_public_id || formatOptionalNumber(appointment.billing_id)" />
          <DetailField label="Credit Account" :value="appointment.credit_account_name || formatOptionalNumber(appointment.credit_account_id)" />
        </div>

        <div class="app-appointment-card space-y-3">
          <h4 class="app-appointment-title text-base">Authorization</h4>
          <DetailField label="HMO ID" :value="formatOptionalNumber(appointment.hmo_id)" />
          <DetailField label="LGU Program ID" :value="formatOptionalNumber(appointment.lgu_program_id)" />
          <DetailField label="LOA Number" :value="appointment.hmo_loa_number" />
          <DetailField label="LOA Date" :value="appointment.hmo_loa_date ? formatDate(appointment.hmo_loa_date) : undefined" />
        </div>
      </section>

      <section class="app-appointment-card space-y-3">
        <h4 class="app-appointment-title text-base">Notes</h4>
        <p class="app-appointment-muted whitespace-pre-line text-sm leading-6">
          {{ appointment.notes?.trim() || "No notes recorded." }}
        </p>
      </section>
    </div>

    <template #footer>
      <Button label="Close" severity="secondary" outlined @click="$emit('update:visible', false)" />
      <Button v-if="canMarkAttendance" label="Attendance" icon="pi pi-check-square" severity="success" outlined @click="$emit('attendance')" />
      <Button v-if="canEdit" label="Edit Appointment" icon="pi pi-pencil" :pt="ptPrimaryBtn" @click="$emit('edit')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type PropType } from "vue"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Tag from "primevue/tag"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type { AppointmentListItem } from "@/features/appointments/api/appointment-phase1.service"
import type { AppointmentBillingPreparation } from "@/features/appointments/api/appointment-billing.service"

type PlannedServiceRecord = Record<string, any>

const props = withDefaults(defineProps<{
  visible: boolean
  appointment: AppointmentListItem | null
  plannedServices?: PlannedServiceRecord[]
  billingPreparation?: AppointmentBillingPreparation | null
  isBillingActionLoading?: boolean
  formatDate: (value: string) => string
  formatTime: (value: string) => string
  formatPayer: (value?: string | null) => string
  statusSeverity: (value?: string) => "success" | "warn" | "danger" | "info"
  displayAppointmentPhase: (value?: string) => string
  displayLocationContext: (value?: string) => string
  displayLaterality: (value?: string | null) => string
  formatOptionalNumber: (value?: number | null) => string | undefined
  canEdit?: boolean
  canMarkAttendance?: boolean
}>(), {
  plannedServices: () => [],
  billingPreparation: null,
  isBillingActionLoading: false,
  canEdit: true,
  canMarkAttendance: true
})

defineEmits<{
  "update:visible": [value: boolean]
  edit: []
  attendance: []
  "open-billing": []
  "create-self-pay-appointment-bill": []
  "create-self-pay-package-bill": []
  "create-session-documentation-invoice": []
}>()

const plannedServicesList = computed(() => props.plannedServices ?? [])

const formatBillingPreparationStatus = (value?: string | null): string =>
  String(value ?? "N/A")
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")

const firstValue = (record: PlannedServiceRecord, keys: string[]): unknown =>
  keys.map(key => record?.[key]).find(value => value !== undefined && value !== null && String(value).trim() !== "")

const numberValue = (value: unknown, fallback = 0): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const plannedServiceKey = (service: PlannedServiceRecord): string => {
  const key = firstValue(service, ["id", "credit_item_id", "service_id", "name", "service_name"])
  return `${String(key ?? Math.random())}-${plannedServiceName(service)}`
}

const plannedServiceName = (service: PlannedServiceRecord): string =>
  String(firstValue(service, ["service_name", "name", "item_name", "credit_item_name", "description"]) ?? "Unnamed service")

const plannedServiceType = (service: PlannedServiceRecord): string =>
  String(firstValue(service, ["type", "service_type", "service_category", "credit_type"]) ?? "Service")
    .split("_")
    .join(" ")

const plannedQuantity = (service: PlannedServiceRecord): number =>
  numberValue(firstValue(service, ["planned_quantity", "quantity", "qty", "total_quantity"]), 0)

const consumedQuantity = (service: PlannedServiceRecord): number =>
  numberValue(firstValue(service, ["appointment_consumed_quantity", "consumed_quantity", "used_quantity", "finished_quantity", "completed_quantity"]), 0)

const remainingQuantity = (service: PlannedServiceRecord): number => {
  const explicitRemaining = firstValue(service, ["remaining_quantity", "balance_quantity", "remaining"])
  if (explicitRemaining !== undefined) return Math.max(0, numberValue(explicitRemaining, 0))
  return Math.max(0, plannedQuantity(service) - consumedQuantity(service))
}

const plannedServiceStatus = (service: PlannedServiceRecord): string => {
  if (plannedQuantity(service) > 0 && remainingQuantity(service) <= 0) return "Completed"
  if (consumedQuantity(service) > 0) return "Partial"
  return "Pending"
}

const plannedServiceSeverity = (service: PlannedServiceRecord): "success" | "warn" | "info" => {
  const status = plannedServiceStatus(service)
  if (status === "Completed") return "success"
  if (status === "Partial") return "warn"
  return "info"
}

const DetailTile = defineComponent({
  name: "DetailTile",
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  setup(props) {
    return () => h("div", { class: "app-appointment-card px-4 py-3" }, [
      h("div", { class: "app-appointment-muted text-xs uppercase tracking-wide" }, props.label),
      h("div", { class: "app-appointment-value mt-1 font-semibold" }, props.value)
    ])
  }
})

const DetailField = defineComponent({
  name: "DetailField",
  props: {
    label: { type: String, required: true },
    value: { type: String as PropType<string | undefined | null>, default: undefined }
  },
  setup(props) {
    return () => h("div", { class: "rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-2" }, [
      h("div", { class: "app-appointment-muted text-[11px] font-semibold uppercase tracking-wide" }, props.label),
      h("div", { class: "app-appointment-value mt-1 break-words text-sm font-medium" }, props.value?.toString().trim() || "Not recorded")
    ])
  }
})
</script>
