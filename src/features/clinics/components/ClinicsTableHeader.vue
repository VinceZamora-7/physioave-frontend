<template>
  <section class="app-table-header">
    <div class="app-table-header-row">
      <div class="app-table-header-filters">
        <IconField class="w-full sm:w-80">
          <InputIcon :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-search'" />
          <InputText
            v-model="modelSearch"
            placeholder="Search clinic name"
            size="small"
            class="w-full"
            :pt="ptInputText"
          />
        </IconField>

        <IftaLabel class="w-full sm:w-60">
          <Select
            v-model="modelStatus"
            input-id="clinicStatus"
            :options="statuses"
            :loading="isLoading"
            class="w-full"
            :pt="ptSelect"
          >
            <template #value="slotProps">
              <span v-if="slotProps.value" class="truncate">{{ slotProps.value }}</span>
              <span v-else class="opacity-70">Select status</span>
            </template>
            <template #option="slotProps">
              <span class="truncate">{{ slotProps.option }}</span>
            </template>
          </Select>
          <label for="clinicStatus" class="opacity-70">Status</label>
        </IftaLabel>
      </div>

      <div class="app-table-header-actions">
        <Button
          label="Save Clinic"
          icon="pi pi-plus"
          severity="primary"
          :loading="isLoading"
          class="w-full sm:w-auto"
          :pt="ptPrimaryBtn"
          @click="emit('save')"
        />

        <Button
          label="Export"
          icon="pi pi-file-excel"
          severity="secondary"
          variant="outlined"
          :loading="isExportLoading"
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="emit('export')"
        />
      </div>
    </div>

    <div class="app-divider" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Button from "primevue/button"
import IconField from "primevue/iconfield"
import IftaLabel from "primevue/iftalabel"
import InputIcon from "primevue/inputicon"
import InputText from "primevue/inputtext"
import Select from "primevue/select"

import type { Status } from "@/utils/global.type"
import {ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect} from "@/features/shared/table-header.styles"

const props = defineProps<{
  statuses: Status[]
  isLoading: boolean
  isExportLoading: boolean
  selectedSearch?: string
  selectedStatus: Status
}>()

const emit = defineEmits<{
  (e: "update:selectedSearch", v: string | undefined): void
  (e: "update:selectedStatus", v: Status): void
  (e: "save"): void
  (e: "export"): void
}>()

const modelSearch = computed({
  get: () => props.selectedSearch,
  set: (v) => emit("update:selectedSearch", v),
})

const modelStatus = computed({
  get: () => props.selectedStatus,
  set: (v) => emit("update:selectedStatus", v),
})
</script>
