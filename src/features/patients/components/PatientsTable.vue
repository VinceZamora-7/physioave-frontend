<template>
  <div class="h-full border rounded-lg overflow-hidden flex flex-col bg-[rgb(var(--app-card))] shadow-sm">
    <DataTable
      :value="isLoading ? virtualItems : patients?.content"
      :show-gridlines="false"
      :removable-sort="true"
      :scrollable="true"
      scroll-height="flex"
      class="h-full flex-1"
      :pt="pt"
    >
      <template #header>
        <div class="p-2">
          <slot name="header" />
        </div>
      </template>

      <template #empty>
        <div v-if="!isLoading" class="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <i class="pi pi-inbox text-4xl mb-4 opacity-20"></i>
          <span class="font-medium text-lg">No patient records found.</span>
        </div>
      </template>

      <Column :sortable="true" header="Full Name" field="last_name">
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div class="flex flex-col items-start text-left">
              <span class="font-bold text-primary">
                {{ toPascalCase(getDisplayFullName(slotProps.data)) }}
              </span>
              <span class="text-[10px] font-mono uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border">
                {{ slotProps.data?.public_id || "PENDING ID" }}
              </span>
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <Column :sortable="true" header="Age" field="age" class="w-[80px]">
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <span class="font-medium text-slate-700">{{ slotProps.data?.age ?? '—' }}</span>
          </SkeletonLoader>
        </template>
      </Column>

      <Column :sortable="true" header="Gender" field="gender_name">
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              {{ toPascalCase(slotProps.data?.gender_name) }}
            </span>
          </SkeletonLoader>
        </template>
      </Column>

      <Column :sortable="true" header="Clinic" field="clinic_name">
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-xs opacity-40"></i>
              <span>{{ toPascalCase(slotProps.data?.clinic_name) }}</span>
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <Column :sortable="true" header="Phone Number" field="phone_number">
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div
              v-if="slotProps.data?.phone_number"
              v-tooltip.top="'Click to copy'"
              class="group flex items-center justify-center gap-2 cursor-pointer hover:text-primary transition-colors"
              @click="handleCopy(slotProps.data?.phone_number)"
            >
              <span class="font-mono text-sm">{{ slotProps.data?.phone_number }}</span>
              <i class="pi pi-copy text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
            <span v-else class="text-slate-400">—</span>
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Actions" class="w-[120px]">
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading" class="flex justify-center">
            <slot name="actions" :patient="slotProps.data" />
          </SkeletonLoader>
        </template>
      </Column>

      <template #footer>
        <div class="overflow-x-auto border-t bg-slate-50/50">
          <Paginator
            template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            :first="(page - 1) * pageSize"
            :rows="pageSize"
            :totalRecords="patients?.total_elements || 0"
            :rowsPerPageOptions="rowPerPageOptions"
            class="!bg-transparent"
            @page="$emit('pageChange', $event)"
          />
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import Paginator from "primevue/paginator"
import SkeletonLoader from "@/composables/SkeletonLoader.vue"

import type { Pageable } from "@/models/paging"
import type { Patient } from "@/features/patients/types/patient"

const props = defineProps<{
  patients?: Pageable<Patient>
  isLoading: boolean
  page: number
  pageSize: number
  rowPerPageOptions: number[]
}>()

const emit = defineEmits<{
  (e: "pageChange", ev: any): void
}>()

const { copy } = useClipboard()

// Mock items for skeleton loading rows
const virtualItems = Array.from({ length: 10 }, (_, i) => ({ id: i }))

/**
 * Ensures string is in Pascal Case (also known as Title Case)
 */
const toPascalCase = (str?: string): string => {
  if (!str) return "N/A"
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getDisplayFullName = (patient?: Patient): string => {
  if (!patient) return ""
  const name = [patient.first_name, patient.middle_name, patient.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
  return name || "Unknown Patient"
}

const handleCopy = (text: string) => {
  copy(text)
  // Logic for a toast notification could go here
}

const pt = {
  root: { class: "flex flex-col h-full overflow-hidden" },
  header: { class: "bg-white border-b border-slate-200" },
  thead: { class: "bg-slate-50" },
  column: {
    headerCell: { class: "bg-slate-50 text-slate-600 text-xs uppercase tracking-wider py-4 border-b" },
    bodyCell: { class: "py-4 px-4 text-sm border-b border-slate-100" },
  },
} as const
</script>

<style scoped>
/* Ensure the paginator text doesn't wrap awkwardly */
:deep(.p-paginator-current) {
  font-size: 0.875rem;
  color: #64748b;
  margin-right: auto;
}
</style>
