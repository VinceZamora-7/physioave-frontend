<!-- src/features/clinics/components/ClinicsTable.vue -->
<template>
  <DataTable
    :value="clinics?.content"
    :selection="selectedClinic"
    :show-gridlines="true"
    :removable-sort="true"
    :scrollable="true"
    dataKey="id"
    selectionMode="single"
    class="h-full"
    :pt="pt"
    @update:selection="$emit('selectClinic', $event ?? undefined)"
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

    <!-- ✅ Only this one is sortable -->
    <Column header="Name" field="name" :sortable="true">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.name }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Start Day" field="start_day">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.start_day_name }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="End Day" field="end_day">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.end_day_name }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Start time" field="start_time">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.start_time_formatted }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="End time" field="end_time">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.end_time_formatted }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Status" field="is_active">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <Tag
            :severity="slotProps.data.is_active ? 'success' : 'danger'"
            :value="slotProps.data.is_active ? 'Operational' : 'Non operational'"
          />
        </SkeletonLoader>
      </template>
    </Column>

    <Column
      header="Actions"
      :pt="{ headerCell: { class: 'w-[96px]' }, bodyCell: { class: 'w-[96px]' } }"
    >
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <slot name="actions" :clinic="slotProps.data" />
        </SkeletonLoader>
      </template>
    </Column>

    <template #footer>
      <div class="w-full overflow-x-auto">
        <div class="min-w-[880px] lg:min-w-0">
          <Paginator
            current-page-report-template="Showing {first} to {last} of {totalRecords} records (Page {currentPage} of {totalPages})"
            template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
            :first="(page - 1) * pageSize"
            :rows="pageSize"
            :totalRecords="clinics?.total_elements"
            :rowsPerPageOptions="rowPerPageOptions"
            @page="$emit('pageChange', $event)"
          />
        </div>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import Tag from "primevue/tag"
import { Paginator } from "primevue"
import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import type { Pageable } from "@/models/paging"
import type { Clinic } from "@/features/clinics/types/clinic"

defineProps<{
  clinics?: Pageable<Clinic>
  isLoading: boolean
  page: number
  pageSize: number
  selectedClinic?: Clinic
  rowPerPageOptions: number[]
}>()

defineEmits<{
  (e: "pageChange", ev: any): void
  (e: "selectClinic", clinic: Clinic | undefined): void
}>()

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
