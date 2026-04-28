<template>
  <section class="app-table-header">
    <div class="app-table-header-row">
      <div class="app-table-header-filters">
        <IconField class="w-full sm:w-80">
          <InputIcon :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-search'" />
          <InputText
            v-model="selectedSearch"
            placeholder="Search name or patient record ID"
            size="small"
            class="w-full"
            :pt="ptInputText"
          />
        </IconField>

        <IftaLabel class="w-full sm:w-60">
          <Select
            v-model="selectedStatus"
            input-id="patientStatus"
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
          <label for="patientStatus" class="opacity-70">Status</label>
        </IftaLabel>

        <Button
          label="Reset Filters"
          icon="pi pi-filter-slash"
          variant="outlined"
          :loading="isLoading"
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="emit('reset')"
        />
      </div>

      <div class="app-table-header-actions">
        <Button
          label="Add Patient"
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
import Button from "primevue/button"
import IconField from "primevue/iconfield"
import InputIcon from "primevue/inputicon"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import IftaLabel from "primevue/iftalabel"
import { ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect } from "@/features/shared/table-header.styles"

import type { Status } from "@/utils/global.type"

// 1. Define standard props
defineProps<{
  statuses: Status[]
  isLoading: boolean
  isExportLoading: boolean
}>()

// 2. Define standard emits
const emit = defineEmits<{
  (e: "reset"): void
  (e: "save"): void
  (e: "export"): void
}>()

// 3. Use Vue 3.4+ defineModel for two-way binding (Replaces the manual computed get/set)
const selectedSearch = defineModel<string>("selectedSearch")
const selectedStatus = defineModel<Status>("selectedStatus", { required: true })
</script>
