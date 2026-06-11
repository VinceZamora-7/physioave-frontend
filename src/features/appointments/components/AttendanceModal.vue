<template>
  <Dialog
    :visible="visible"
    modal
    header="Attendance"
    :style="{ width: '58rem', maxWidth: '96vw' }"
    :draggable="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="appointment" class="space-y-4">
      <div class="app-appointment-card">
        <div class="font-semibold">{{ appointment.patient_name }}</div>
        <div class="text-sm opacity-70">
          {{ formatDate(appointment.starts_at) }} - {{ formatTime(appointment.starts_at) }} to {{ formatTime(appointment.ends_at) }}
        </div>
      </div>

      <DataTable :value="attendanceItems" size="small" class="app-data-table">
        <template #empty>
          <div class="py-8 text-center text-sm opacity-70">
            No planned services available. Add planned services first.
          </div>
        </template>

        <Column header="Done" style="width: 90px">
          <template #body="{ data }">
            <Checkbox
              v-model="data.selected"
              binary
              :disabled="isAttendanceItemDisabled(data)"
            />
          </template>
        </Column>

        <Column header="Service">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.service_name }}</div>
              <div class="text-xs opacity-60">
                Planned {{ data.planned_quantity }} -
                This visit {{ data.appointmentConsumed ?? data.appointment_consumed_quantity ?? 0 }} -
                Balance {{ data.remaining }}
              </div>
            </div>
          </template>
        </Column>

        <Column header="Qty Finished" style="width: 160px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.quantity"
              :min="1"
              :max="Math.max(1, data.remaining)"
              showButtons
              fluid
              :disabled="!data.selected || isAttendanceItemDisabled(data)"
            />
          </template>
        </Column>
      </DataTable>

      <section
        v-if="canShowDropoutPanel"
        class="app-appointment-card app-appointment-card-accent space-y-3"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div class="min-w-0 flex-1 space-y-1">
            <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">
              LGU Drop-out Reason
            </label>

            <Textarea
              v-model="dropoutReason"
              class="w-full"
              rows="2"
              autoResize
              :disabled="isDroppingOut || isAlreadyDroppedOut"
              placeholder="Reason for dropping out"
            />
          </div>

          <div class="flex shrink-0 flex-col gap-2 sm:flex-row md:items-end">
            <Button
              v-if="!isAlreadyDroppedOut"
              label="Drop Out Patient"
              icon="pi pi-user-minus"
              severity="danger"
              class="whitespace-nowrap"
              :loading="isDroppingOut"
              :disabled="!dropoutReason.trim()"
              @click="$emit('drop-out', dropoutReason.trim())"
            />

            <Button
              v-else
              label="Undo Drop Out"
              icon="pi pi-undo"
              severity="secondary"
              outlined
              class="whitespace-nowrap"
              :loading="isDroppingOut"
              @click="$emit('undo-drop-out')"
            />
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <Button
        label="Close"
        severity="secondary"
        outlined
        @click="$emit('update:visible', false)"
      />
      <Button
        label="Save Attendance"
        icon="pi pi-check"
        :loading="isSaving"
        :pt="ptPrimaryBtn"
        @click="$emit('save')"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import Textarea from "primevue/textarea"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type {
  AppointmentListItem,
  AppointmentPlannedService
} from "@/features/appointments/api/appointment-phase1.service"

type AttendanceItem = AppointmentPlannedService & {
  selected: boolean
  quantity: number
  remaining: number
  appointmentConsumed?: number
}

type AppointmentWithDropoutFields = AppointmentListItem & {
  dropout_reason?: string | null
  dropout_status?: string | null
  lgu_patient_id?: number | string | null
  lgu_contract_id?: number | string | null
  billing_type?: string | null
  source_type?: string | null
  payment_source?: string | null
  contract_type?: string | null
}

defineEmits<{
  "update:visible": [value: boolean]
  save: []
  "drop-out": [reason: string]
  "undo-drop-out": []
}>()

const props = defineProps<{
  visible: boolean
  appointment: AppointmentWithDropoutFields | null
  attendanceItems: AttendanceItem[]
  isSaving: boolean
  isDroppingOut?: boolean
  canDropOutLgu?: boolean
  dropoutStatus?: string | null
  formatDate: (value: string) => string
  formatTime: (value: string) => string
}>()

const dropoutReason = ref("")

const normalizeStatus = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase()

const isLguValue = (value?: string | null): boolean =>
  String(value ?? "").trim().toUpperCase() === "LGU"

const isAlreadyDroppedOut = computed(() =>
  normalizeStatus(props.dropoutStatus ?? props.appointment?.dropout_status) === "DROPPED_OUT"
)

const canShowDropoutPanel = computed(() => {
  const appointment = props.appointment

  return Boolean(
    props.canDropOutLgu ||
    isAlreadyDroppedOut.value ||
    appointment?.lgu_patient_id ||
    appointment?.lgu_contract_id ||
    isLguValue(appointment?.billing_type) ||
    isLguValue(appointment?.source_type) ||
    isLguValue(appointment?.payment_source) ||
    isLguValue(appointment?.contract_type)
  )
})

const selectedBundleIds = computed(() =>
  new Set(
    props.attendanceItems
      .filter(item => item.selected && item.type === "BUNDLE")
      .map(item => Number(item.id))
  )
)

const isAttendanceItemDisabled = (item: AttendanceItem): boolean =>
  item.remaining <= 0
  || item.type === "PACKAGE"
  || Number(item.appointmentConsumed ?? item.appointment_consumed_quantity ?? 0) > 0
  || Boolean(item.parent_credit_item_id && selectedBundleIds.value.has(Number(item.parent_credit_item_id)))

watch(
  () => [props.visible, props.appointment?.id, props.appointment?.dropout_reason],
  ([visible]) => {
    if (visible) {
      dropoutReason.value = props.appointment?.dropout_reason ?? ""
    }
  },
  { immediate: true }
)
</script>
