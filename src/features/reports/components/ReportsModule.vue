<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <h2 class="text-lg font-semibold">Accomplishment Report</h2>
      <p class="text-sm opacity-70">Summary by module and action count (from user logs)</p>

      <DataTable :value="accomplishments" responsiveLayout="scroll" size="small">
        <Column field="module" header="Module" />
        <Column field="actions" header="Actions Logged" />
        <Column field="latest" header="Latest Activity" />
      </DataTable>
    </section>

    <section class="mt-5 rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">User Logs</h3>
          <p class="text-sm opacity-70">Track edits and transactions for accountability</p>
        </div>
        <Button
          label="Clear Logs"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="clearLogs"
        />
      </div>

      <DataTable :value="logs" paginator :rows="10" responsiveLayout="scroll" size="small">
        <Column field="timestamp" header="Time">
          <template #body="{ data }">{{ formatDateTime(data.timestamp) }}</template>
        </Column>
        <Column field="user" header="User" />
        <Column field="module" header="Module" />
        <Column field="action" header="Action" />
        <Column field="details" header="Details" />
      </DataTable>
    </section>

    <section class="mt-5 rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <h3 class="text-lg font-semibold">Permissions Matrix</h3>
      <p class="text-sm opacity-70">Role-based checks to reduce untracked edits and skimming risk</p>

      <DataTable :value="permissions" responsiveLayout="scroll" size="small">
        <Column field="role" header="Role" />
        <Column field="module" header="Module" />
        <Column field="can_view" header="View">
          <template #body="{ data }"><Checkbox v-model="data.can_view" binary /></template>
        </Column>
        <Column field="can_create" header="Create">
          <template #body="{ data }"><Checkbox v-model="data.can_create" binary /></template>
        </Column>
        <Column field="can_edit" header="Edit">
          <template #body="{ data }"><Checkbox v-model="data.can_edit" binary /></template>
        </Column>
        <Column field="can_delete" header="Delete">
          <template #body="{ data }"><Checkbox v-model="data.can_delete" binary /></template>
        </Column>
      </DataTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import {computed} from "vue";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import {auditStore} from "@/stores/audit.store";

const useAuditStore = auditStore()

const logs = computed(() => useAuditStore.sortedLogs)
const permissions = computed(() => useAuditStore.permissions)

const accomplishments = computed(() => {
  const grouped = new Map<string, {module: string; actions: number; latest: string; latest_ts: string}>()

  for (const log of logs.value) {
    const existing = grouped.get(log.module)
    if (!existing) {
      grouped.set(log.module, {
        module: log.module,
        actions: 1,
        latest: formatDateTime(log.timestamp),
        latest_ts: log.timestamp
      })
      continue
    }
    existing.actions += 1
    const existingTime = new Date(existing.latest_ts).getTime()
    const currentTime = new Date(log.timestamp).getTime()
    if (currentTime > existingTime) {
      existing.latest = formatDateTime(log.timestamp)
      existing.latest_ts = log.timestamp
    }
  }

  return [...grouped.values()]
    .map(({latest_ts, ...rest}) => rest)
    .sort((a, b) => b.actions - a.actions)
})

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const clearLogs = (): void => {
  useAuditStore.clearLogs()
}
</script>
