<template>
  <Dialog v-model:visible="visibleModel" header="Select SOA Scope" modal :style="{ width: 'min(92vw, 560px)' }">
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-2 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-1">
        <Button
          label="Date Range"
          :severity="patientSoaModeModel === 'range' ? 'info' : 'secondary'"
          :outlined="patientSoaModeModel !== 'range'"
          @click="patientSoaModeModel = 'range'"
        />
        <Button
          label="Single Session"
          :severity="patientSoaModeModel === 'session' ? 'info' : 'secondary'"
          :outlined="patientSoaModeModel !== 'session'"
          @click="patientSoaModeModel = 'session'"
        />
      </div>

      <IftaLabel>
        <DatePicker
          v-if="patientSoaModeModel === 'range'"
          v-model="patientSoaRangeModel"
          selectionMode="range"
          dateFormat="yy-mm-dd"
          :manualInput="false"
          showIcon
          fluid
        />
        <Select
          v-else
          v-model="selectedPatientSoaSessionKeyModel"
          :options="sessionOptions"
          optionLabel="label"
          optionValue="key"
          showClear
          fluid
          placeholder="Select one session"
        />
        <label>Transaction Period</label>
      </IftaLabel>
      <Message severity="secondary" :closable="false" size="small">
        {{ patientSoaModeModel === 'range' ? 'Choose the date range to include in the patient SOA.' : 'Choose one availed session to print as its own SOA.' }}
      </Message>
    </div>

    <template #footer>
      <Button label="Cancel" text @click="visibleModel = false" />
      <Button label="Open SOA" icon="pi pi-print" :disabled="!canExportPatientSoa" @click="$emit('export-patient-soa')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import Message from "primevue/message"
import Select from "primevue/select"
import type { LguInvoiceSessionOption } from "./types"

const props = defineProps<{
  hasValidPatientSoaRange: boolean
  invoiceSessionOptions: LguInvoiceSessionOption[]
  formatDateTime: (value?: string) => string
}>()

const visibleModel = defineModel<boolean>("visible", { required: true })
const patientSoaRangeModel = defineModel<Date[] | null>("patientSoaRange", { required: true })
const patientSoaModeModel = defineModel<"range" | "session">("patientSoaMode", { required: true })
const selectedPatientSoaSessionKeyModel = defineModel<string | null>("selectedPatientSoaSessionKey", { required: true })

const sessionOptions = computed(() =>
  props.invoiceSessionOptions.map(option => ({
    key: option.key,
    label: `${option.label} - ${props.formatDateTime(option.appointmentDate)} - ${option.serviceName}`
  }))
)

const canExportPatientSoa = computed(() =>
  patientSoaModeModel.value === "range"
    ? props.hasValidPatientSoaRange
    : Boolean(selectedPatientSoaSessionKeyModel.value)
)

defineEmits<{ "export-patient-soa": [] }>()
</script>
