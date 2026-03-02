<!-- src/features/clinics/components/ClinicsTableHeader.vue -->
<template>
  <section class="flex flex-col gap-3 text-[rgb(var(--app-fg))]">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <!-- LEFT: Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <!-- Search -->
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
        <Button
          label="Save Clinic"
          icon="pi pi-plus"
          severity="info"
          :loading="isLoading"
          class="w-full sm:w-auto"
          :pt="ptPrimaryBtn"
          @click="emit('save')"
        />

        <Button
          label="Export"
          icon="pi pi-file-excel"
          severity="success"
          variant="outlined"
          :loading="isExportLoading"
          class="w-full sm:w-auto"
          :pt="ptOutlinedBtn"
          @click="emit('export')"
        />

      </div>

      <!-- RIGHT: Actions -->
      <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:ml-auto lg:justify-end">
                <!-- Status -->
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
    </div>

    <div class="h-px w-full bg-[rgb(var(--app-border))] opacity-80" />
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

/**
 * Controls: consistent height/radius and sidebar-token colors
 */
const controlBase =
  "h-10 rounded-xl " +
  "bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] " +
  "border border-[rgb(var(--app-border))] " +
  "shadow-sm focus:ring-0 focus:shadow-none outline-none"

const ptInputText = {
  root: {
    class:
      controlBase +
      " pl-10 pr-3 text-sm placeholder:opacity-60 " +
      "focus:border-[rgba(var(--app-fg),0.35)]",
  },
}

const ptSelect = {
  root: {
    class:
      "h-12 rounded-xl " +
      "bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] " +
      "border border-[rgb(var(--app-border))] shadow-sm " +
      "focus:ring-0 focus:shadow-none outline-none " +
      "flex items-center", // ✅ helps internal alignment
  },

  // ✅ make the label vertically centered + prevent clipping
  label: {
    class:
      "flex items-center h-10 px-3 text-sm leading-none " +
      "text-[rgb(var(--app-fg))] truncate",
  },

  // ✅ keep trigger aligned too
  trigger: {
    class: "flex items-center h-10 px-3 opacity-80",
  },

  panel: {
    class:
      "mt-1 rounded-xl overflow-hidden " +
      "bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] " +
      "border border-[rgb(var(--app-border))] shadow-lg",
  },

  item: {
    class: "px-3 py-2 text-sm hover:bg-[rgba(var(--app-fg),0.06)]",
  },
}


const ptOutlinedBtn = {
  root: {
    class:
      "h-10 rounded-xl px-4 text-sm font-semibold " +
      "border border-[rgb(var(--app-border))] " +
      "text-[rgb(var(--app-fg))] bg-transparent " +
      "hover:bg-[rgba(var(--app-fg),0.06)] " +
      "active:scale-[0.99] transition " +
      "focus:ring-0 focus:shadow-none",
  },
}

const ptPrimaryBtn = {
  root: {
    class:
      "h-10 rounded-xl px-4 text-sm font-semibold " +
      "active:scale-[0.99] transition " +
      "focus:ring-0 focus:shadow-none shadow-sm",
  },
}
</script>
