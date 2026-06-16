<template>
  <div class="app-patient-table-shell">
    <DataTable
      :value="isLoading ? virtualItems : patients?.content"
      :show-gridlines="false"
      :removable-sort="true"
      :scrollable="true"
      scroll-height="flex"
      striped-rows
      row-hover
      size="small"
      class="h-full flex-1"
      :pt="pt"
    >
      <template #header>
        <div class="app-patient-table-header">
          <slot name="header" />
        </div>
      </template>

      <template #empty>
        <div
          v-if="!isLoading"
          class="app-empty-state"
        >
          <div class="app-empty-state-icon">
            <i class="pi pi-inbox text-3xl opacity-60"></i>
          </div>

          <span class="text-lg font-semibold">
            No patient records found
          </span>

          <span class="app-muted-text mt-1 text-sm">
            Try adjusting your search or filter.
          </span>
        </div>
      </template>

      <!-- Patient -->
      <Column
        :sortable="true"
        header="Patient"
        field="last_name"
        class="min-w-[260px]"
      >
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div class="flex items-center gap-3 text-left">
              <div class="app-patient-avatar h-11 w-11 text-sm">
                {{
                  toPascalCase(getDisplayFullName(slotProps.data))
                    ?.charAt(0) || "P"
                }}
              </div>

              <div class="min-w-0">
                <div class="truncate text-sm font-bold">
                  {{ toPascalCase(getDisplayFullName(slotProps.data)) }}
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <span class="app-record-badge">
                    <i class="pi pi-id-card text-[10px]"></i>
                    {{ slotProps.data?.public_id || "PENDING ID" }}
                  </span>
                </div>
              </div>
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <!-- Age -->
      <Column
        :sortable="true"
        header="Age"
        field="age"
        class="w-[90px]"
      >
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div class="flex justify-center">
              <span class="app-age-pill">
                {{ slotProps.data?.age ?? "—" }}
              </span>
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <!-- Gender -->
      <Column
        :sortable="true"
        header="Gender"
        field="gender_name"
        class="min-w-[130px]"
      >
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div class="flex justify-center">
              <span class="app-value-pill gap-1.5 rounded-full px-3 py-1">
                <i class="pi pi-user text-[10px]"></i>
                {{ toPascalCase(slotProps.data?.gender_name) || "—" }}
              </span>
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <!-- Clinic -->
      <Column
        :sortable="true"
        header="Clinic"
        field="clinic_name"
        class="min-w-[220px]"
      >
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <div class="flex items-center gap-3">
              <div class="app-patient-avatar h-9 w-9 rounded-xl">
                <i class="pi pi-building text-sm"></i>
              </div>

              <div class="min-w-0">
                <div class="truncate text-sm font-semibold">
                  {{ toPascalCase(slotProps.data?.clinic_name) || "—" }}
                </div>

                <div class="app-subtle-text text-xs">
                  Assigned branch
                </div>
              </div>
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <!-- Phone -->
      <Column
        :sortable="true"
        header="Phone Number"
        field="phone_number"
        class="min-w-[190px]"
      >
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <button
              v-if="slotProps.data?.phone_number"
              v-tooltip.top="'Click to copy'"
              type="button"
              class="app-copy-button group"
              @click="handleCopy(slotProps.data?.phone_number)"
            >
              <i class="app-copy-button-icon pi pi-phone text-xs"></i>

              <span class="font-mono">
                {{ slotProps.data?.phone_number }}
              </span>

              <i
                class="pi pi-copy text-[10px] opacity-40 transition group-hover:opacity-100"
              ></i>
            </button>

            <span
              v-else
              class="app-subtle-text inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium"
            >
              —
            </span>
          </SkeletonLoader>
        </template>
      </Column>

      <!-- Actions -->
      <Column
        header="Actions"
        class="w-[120px]"
        frozen
        align-frozen="right"
      >
        <template #body="slotProps">
          <SkeletonLoader :loading="isLoading" class="flex justify-center">
            <div class="flex justify-center">
              <slot name="actions" :patient="slotProps.data" />
            </div>
          </SkeletonLoader>
        </template>
      </Column>

      <template #footer>
        <div class="app-patient-table-footer">
          <div class="overflow-x-auto">
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
  const name = [patient.last_name, patient.first_name]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ")
  return name || "Unknown Patient"
}

const handleCopy = (text: string) => {
  copy(text)
  // Logic for a toast notification could go here
}

const pt = {
  root: { class: "flex flex-col h-full overflow-hidden" },
  header: { class: "app-patient-table-pt-header" },
  thead: { class: "app-patient-table-pt-thead" },
  column: {
    headerCell: { class: "app-patient-table-pt-th" },
    bodyCell: { class: "app-patient-table-pt-td" },
  },
} as const
</script>
