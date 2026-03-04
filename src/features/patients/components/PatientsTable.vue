<template>
  <DataTable
    :value="patients?.content"
    :show-gridlines="true"
    :removable-sort="true"
    :scrollable="true"
    class="h-full"
    :pt="pt"
  >
    <template #header>
      <slot name="header" />
    </template>

    <template #empty>
      <div class="text-center font-semibold text-lg py-8">
        <SkeletonLoader :loading="isLoading">
          <span>No records found.</span>
        </SkeletonLoader>
      </div>
    </template>

    <Column :sortable="true" header="Full name" field="full_name">
      <template #body="slotProps"><SkeletonLoader :loading="isLoading">{{ getDisplayFullName(slotProps.data) }}</SkeletonLoader></template>
    </Column>

    <Column :sortable="true" header="Age" field="age">
      <template #body="slotProps"><SkeletonLoader :loading="isLoading">{{ slotProps.data?.age }}</SkeletonLoader></template>
    </Column>

    <Column :sortable="true" header="Gender" field="gender_name">
      <template #body="slotProps"><SkeletonLoader :loading="isLoading">{{ slotProps.data?.gender_name }}</SkeletonLoader></template>
    </Column>

    <Column :sortable="true" header="Clinic" field="clinic_name">
      <template #body="slotProps"><SkeletonLoader :loading="isLoading">{{ slotProps.data?.clinic_name }}</SkeletonLoader></template>
    </Column>

    <Column :sortable="true" header="Phone number" field="phone_number">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <span
            v-if="slotProps.data?.phone_number"
            v-tooltip="'Click to copy to clipboard'"
            class="cursor-copy"
            @click="copyPhoneNumber(slotProps.data?.phone_number)"
          >
            {{ slotProps.data?.phone_number }}
          </span>
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Actions" :pt="{ headerCell: { class: 'w-[96px]' }, bodyCell: { class: 'w-[96px]' } }">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <slot name="actions" :patient="slotProps.data" />
        </SkeletonLoader>
      </template>
    </Column>

    <template #footer>
      <div class="w-full overflow-x-auto">
        <div class="min-w-[1200px] lg:min-w-0">
          <Paginator
            current-page-report-template="Showing {first} to {last} of {totalRecords} records (Page {currentPage} of {totalPages})"
            template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
            :first="(page - 1) * pageSize"
            :rows="pageSize"
            :totalRecords="patients?.total_elements"
            :rowsPerPageOptions="rowPerPageOptions"
            @page="$emit('pageChange', $event)"
          />
        </div>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import { Paginator } from "primevue"

import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import type { Pageable } from "@/models/paging"
import type { Patient } from "@/features/patients/types/patient"

defineProps<{
  patients?: Pageable<Patient>
  isLoading: boolean
  page: number
  pageSize: number
  rowPerPageOptions: number[]
}>()

defineEmits<{
  (e: "pageChange", ev: any): void
}>()

const { copy: copyPhoneNumber } = useClipboard()

const getDisplayFullName = (patient?: Patient): string => {
  if (!patient) return ""
  return [patient.first_name, patient.middle_name, patient.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
}

const pt = {
  root: { class: "flex flex-col h-full" },
  header: { class: "bg-[rgb(var(--app-card))] border-b border-[rgb(var(--app-border))]" },
  footer: { class: "bg-[rgb(var(--app-card))] border-t border-[rgb(var(--app-border))]" },
  column: {
    headerCell: { class: "text-center" },
    bodyCell: { class: "text-center" },
    columnTitle: { class: "mx-auto font-semibold" },
  },
} as const
</script>
