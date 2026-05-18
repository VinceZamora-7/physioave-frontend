<template>
  <DataTable
    :value="staffs?.content"
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

    <Column header="Name" field="name" :sortable="true">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.name }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Email" field="email" :sortable="true">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <span
            v-tooltip="'Click to copy to clipboard'"
            @click="copy(slotProps.data?.email)"
            class="cursor-copy"
          >
            {{ slotProps.data?.email }}
          </span>
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Clinic" field="clinic_name" :sortable="true">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.clinic_name }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Job Title" field="role_name" :sortable="true">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.role_name }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Specialty" field="specialty_tag_name" :sortable="true">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          {{ slotProps.data?.specialty_tag_name || "N/A" }}
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Presence" field="is_online">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <Tag
            :severity="slotProps.data?.is_online ? 'success' : 'secondary'"
            :value="slotProps.data?.is_online ? 'Online' : 'Offline'"
            v-tooltip="formatLastSeen(slotProps.data?.last_seen_at)"
          />
        </SkeletonLoader>
      </template>
    </Column>

    <Column header="Status" field="is_active">
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <Tag :severity="slotProps.data?.is_active ? 'success' : 'danger'" :value="slotProps.data?.is_active ? 'Active' : 'Inactive'" />
        </SkeletonLoader>
      </template>
    </Column>

    <Column
      header="Actions"
      :pt="{ headerCell: { class: 'w-[96px]' }, bodyCell: { class: 'w-[96px]' } }"
    >
      <template #body="slotProps">
        <SkeletonLoader :loading="isLoading">
          <slot name="actions" :staff="slotProps.data" />
        </SkeletonLoader>
      </template>
    </Column>

    <template #footer>
      <div class="w-full overflow-x-auto">
        <div class="min-w-[1080px] lg:min-w-0">
          <Paginator
            current-page-report-template="Showing {first} to {last} of {totalRecords} records (Page {currentPage} of {totalPages})"
            template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
            :first="(page - 1) * pageSize"
            :rows="pageSize"
            :totalRecords="staffs?.total_elements"
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
import Tag from "primevue/tag"
import Paginator from "primevue/paginator"

import SkeletonLoader from "@/composables/SkeletonLoader.vue"
import type { Pageable } from "@/models/paging"
import type { Staff } from "@/features/staff/types/staff"

defineProps<{
  staffs?: Pageable<Staff>
  isLoading: boolean
  page: number
  pageSize: number
  rowPerPageOptions: number[]
}>()

defineEmits<{
  (e: "pageChange", ev: any): void
}>()

const { copy } = useClipboard()

const formatLastSeen = (value?: string | null): string => {
  if (!value) return "No recent activity"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "No recent activity"
  return `Last seen ${parsed.toLocaleString()}`
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
