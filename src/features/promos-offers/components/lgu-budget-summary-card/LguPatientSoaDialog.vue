<template>
  <Dialog v-model:visible="visibleModel" header="Select SOA Transaction Period" modal :style="{ width: 'min(92vw, 520px)' }">
    <div class="space-y-3">
      <IftaLabel>
        <DatePicker v-model="patientSoaRangeModel" selectionMode="range" dateFormat="yy-mm-dd" :manualInput="false" showIcon fluid />
        <label>Transaction Period</label>
      </IftaLabel>
      <Message severity="secondary" :closable="false" size="small">Choose the date range to include in the patient SOA.</Message>
    </div>

    <template #footer>
      <Button label="Cancel" text @click="visibleModel = false" />
      <Button label="Open SOA" icon="pi pi-print" :disabled="!hasValidPatientSoaRange" @click="$emit('export-patient-soa')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import Message from "primevue/message"

defineProps<{ hasValidPatientSoaRange: boolean }>()

const visibleModel = defineModel<boolean>("visible", { required: true })
const patientSoaRangeModel = defineModel<Date[] | null>("patientSoaRange", { required: true })

defineEmits<{ "export-patient-soa": [] }>()
</script>
