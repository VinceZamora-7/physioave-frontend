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
          <div class="py-8 text-center text-sm opacity-70">No planned services available. Add planned services first.</div>
        </template>
        <Column header="Done" style="width: 90px">
          <template #body="{ data }">
            <Checkbox v-model="data.selected" binary :disabled="isAttendanceItemDisabled(data)" />
          </template>
        </Column>
        <Column header="Service">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.service_name }}</div>
              <div class="text-xs opacity-60">
                Planned {{ data.planned_quantity }} - This visit {{ data.appointmentConsumed ?? data.appointment_consumed_quantity ?? 0 }} - Balance {{ data.remaining }}
              </div>
            </div>
          </template>
        </Column>
        <Column header="Qty Finished" style="width: 160px">
          <template #body="{ data }">
            <InputNumber v-model="data.quantity" :min="1" :max="Math.max(1, data.remaining)" showButtons fluid :disabled="!data.selected || isAttendanceItemDisabled(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <Button label="Close" severity="secondary" outlined @click="$emit('update:visible', false)" />
      <Button label="Save Attendance" icon="pi pi-check" :loading="isSaving" :pt="ptPrimaryBtn" @click="$emit('save')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type { AppointmentListItem, AppointmentPlannedService } from "@/features/appointments/api/appointment-phase1.service"

type AttendanceItem = AppointmentPlannedService & { selected: boolean; quantity: number; remaining: number; appointmentConsumed?: number }

defineEmits<{
  "update:visible": [value: boolean]
  save: []
}>()

const props = defineProps<{
  visible: boolean
  appointment: AppointmentListItem | null
  attendanceItems: AttendanceItem[]
  isSaving: boolean
  formatDate: (value: string) => string
  formatTime: (value: string) => string
}>()

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
</script>
