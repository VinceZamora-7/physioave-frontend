<template>
  <section class="app-table-header">
    <div class="app-table-header-row">
      <div class="app-table-header-filters">
        <IconField class="w-full sm:w-80">
          <InputIcon :class="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-search'" />
          <InputText
            v-model="modelSearch"
            placeholder="Search by name"
            size="small"
            class="w-full"
            :pt="ptInputText"
          />
        </IconField>

        <IftaLabel class="w-full sm:w-60">
          <Select
            v-model="modelStatus"
            input-id="staffStatus"
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
          <label for="staffStatus" class="opacity-70">Status</label>
        </IftaLabel>

        <Button
          label="Reset filters"
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
          v-if="canManageSpecialties"
          label="Specialties"
          icon="pi pi-bookmark"
          severity="secondary"
          variant="outlined"
          :loading="isLoading"
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="emit('manageSpecialties')"
        />

        <Button
          v-if="canManageRoles"
          label="Job Titles & Permissions"
          icon="pi pi-shield"
          severity="secondary"
          variant="outlined"
          :loading="isLoading"
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="emit('manageRoles')"
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
import {ptInputText, ptOutlinedBtn, ptPrimaryBtn, ptSelect} from "@/features/shared/table-header.styles"

import type { Status } from "@/utils/global.type"

const props = defineProps<{
  statuses: Status[]
  isLoading: boolean
  isExportLoading: boolean
  canCreateStaff: boolean
  canManageRoles: boolean
  canManageSpecialties?: boolean
  selectedSearch?: string
  selectedStatus: Status
}>()

const emit = defineEmits<{
  (e: "update:selectedSearch", v: string | undefined): void
  (e: "update:selectedStatus", v: Status): void
  (e: "reset"): void
  (e: "manageSpecialties"): void
  (e: "manageRoles"): void
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
