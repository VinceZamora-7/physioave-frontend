<template>
  <Dialog
    :visible="visible"
    modal
    header="Planned Services"
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

      <div class="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_140px_auto] md:items-end">
        <Select v-model="servicePicker.type" :options="serviceTypeOptions" optionLabel="label" optionValue="value" fluid @change="servicePicker.id = null" />
        <Select v-model="servicePicker.id" :options="currentServiceOptions" optionLabel="label" optionValue="pickerValue" filter fluid placeholder="Select service" />
        <InputNumber v-model="servicePicker.quantity" :min="1" showButtons fluid />
        <Button label="Add" icon="pi pi-plus" severity="secondary" outlined @click="$emit('add-picked-service')" />
      </div>

      <DataTable :value="selectedServices" size="small" class="app-data-table">
        <template #empty>
          <div class="py-8 text-center text-sm opacity-70">No services selected yet.</div>
        </template>
        <Column field="typeLabel" header="Type" style="min-width: 160px" />
        <Column field="name" header="Service" />
        <Column field="quantity" header="Qty" style="width: 100px" />
        <Column field="price" header="Unit" style="width: 120px">
          <template #body="{ data }">{{ formatCurrency(data.price) }}</template>
        </Column>
        <Column header="Total" style="width: 120px">
          <template #body="{ data }">{{ formatCurrency(data.price * data.quantity) }}</template>
        </Column>
        <Column header="" style="width: 80px">
          <template #body="{ index }">
            <Button icon="pi pi-times" text rounded severity="danger" aria-label="Remove" @click="$emit('remove-selected-service', index)" />
          </template>
        </Column>
      </DataTable>

      <div class="app-appointment-card text-sm">
        <div class="font-semibold">Saved planned services</div>
        <div v-if="!plannedServices.length" class="mt-2 opacity-70">No planned services saved for this appointment.</div>
        <ul v-else class="mt-2 space-y-1">
          <li v-for="item in plannedServices" :key="item.id" class="flex justify-between gap-3">
            <span>
              <span v-if="item.package_name">{{ item.package_name }} / </span>
              <span v-if="item.bundle_name">{{ item.bundle_name }} / </span>
              {{ item.service_name }} x {{ item.planned_quantity }}
            </span>
            <span>{{ item.consumed_quantity }} done</span>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <Button label="Close" severity="secondary" outlined @click="$emit('update:visible', false)" />
      <Button label="Save Planned Services" icon="pi pi-save" :loading="isSaving" :pt="ptPrimaryBtn" @click="$emit('save')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import Select from "primevue/select"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type { AppointmentListItem, AppointmentPlannedService } from "@/features/appointments/api/appointment-phase1.service"

type Option = { label: string; value: string | number }

defineProps<{
  visible: boolean
  appointment: AppointmentListItem | null
  selectedServices: Array<Record<string, any>>
  plannedServices: AppointmentPlannedService[]
  serviceTypeOptions: Option[]
  servicePicker: Record<string, any>
  currentServiceOptions: Array<Record<string, any>>
  isSaving: boolean
  formatDate: (value: string) => string
  formatTime: (value: string) => string
  formatCurrency: (value: number) => string
}>()

defineEmits<{
  "update:visible": [value: boolean]
  "add-picked-service": []
  "remove-selected-service": [index: number]
  save: []
}>()
</script>
