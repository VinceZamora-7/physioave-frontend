<template>
  <Dialog v-model:visible="visibleModel" header="LGU Exports" modal :style="{ width: 'min(92vw, 620px)' }">
    <div class="space-y-4">
      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <i class="pi pi-file" />
          </span>
          <div class="min-w-0 flex-1 space-y-3">
            <div>
              <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">Statement of Account</h4>
              <p class="m-0 mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/60">
                Generate a printable SOA for {{ selectedProgramName || "the selected LGU" }} using the selected date range.
              </p>
            </div>

            <IftaLabel>
              <DatePicker v-model="soaRangeModel" selectionMode="range" dateFormat="yy-mm-dd" :manualInput="false" showIcon fluid />
              <label>Transaction Period</label>
            </IftaLabel>

            <div class="flex justify-end">
              <Button label="Generate SOA" icon="pi pi-print" :disabled="!hasValidSoaRange" @click="$emit('generate-soa')" />
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <i class="pi pi-users" />
          </span>
          <div class="min-w-0 flex-1">
            <h4 class="m-0 text-sm font-bold text-[rgb(var(--app-fg))]">Copy of Patients</h4>
            <p class="m-0 mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/60">Print all patients with saved LGU Information.</p>
            <div class="mt-3 flex justify-end">
              <Button label="Print Patient Copy" icon="pi pi-users" :loading="exportingLguPatients" @click="$emit('export-lgu-patient-copy')" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Close" text @click="visibleModel = false" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"

defineProps<{
  selectedProgramName: string
  hasValidSoaRange: boolean
  exportingLguPatients: boolean
}>()

const visibleModel = defineModel<boolean>("visible", { required: true })
const soaRangeModel = defineModel<Date[] | null>("soaRange", { required: true })

defineEmits<{
  "generate-soa": []
  "export-lgu-patient-copy": []
}>()
</script>
