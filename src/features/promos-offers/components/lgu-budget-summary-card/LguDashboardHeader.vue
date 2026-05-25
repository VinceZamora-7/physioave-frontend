<template>
  <section class="app-section-card-comfy relative overflow-hidden">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10" />

    <div class="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <i class="pi pi-building text-base" />
            </span>

            <div class="min-w-0">
              <h3 class="m-0 text-lg font-bold text-[rgb(var(--app-fg))] sm:text-xl">Manager LGU Dashboard</h3>
              <p class="m-0 text-sm text-[rgb(var(--app-fg))]/60">
                {{ selectedProgramName || "All LGU programs" }} - {{ budgetMonthLabel }}
              </p>
            </div>
          </div>

          <p class="max-w-3xl text-sm leading-6 text-[rgb(var(--app-fg))]/65">
            Monitor LGU fund usage, review recent ledger transactions, and open patient credit details from one focused workspace.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <IftaLabel class="min-w-[220px]">

            <label>LGU Program</label>
                        <Select
              v-model="selectedProgramIdModel"
              :options="lguProgramOptions"
              optionLabel="label"
              optionValue="id"
              placeholder="Filter by LGU"
              :loading="loadingPrograms"
              size="small"
              fluid
            />
          </IftaLabel>

          <Tag :value="canManageLguDashboard ? 'Manager Access' : 'Read-only'" :severity="canManageLguDashboard ? 'success' : 'secondary'" />

          <Button
            :label="budgetLedgerVisible ? 'Hide Budget Setup' : 'Show Budget Setup'"
            :icon="budgetLedgerVisible ? 'pi pi-chevron-up' : 'pi pi-sliders-h'"
            outlined
            size="small"
            aria-controls="lgu-budget-ledger-panel"
            :aria-expanded="budgetLedgerVisible"
            @click="$emit('toggle-budget')"
          />

          <Button label="Exports" icon="pi pi-arrow-up-right" size="small" @click="$emit('open-exports')" />
        </div>
    </div>
</section>
</template>

<script setup lang="ts">
import Button from "primevue/button"
import IftaLabel from "primevue/iftalabel"
import Select from "primevue/select"
import Tag from "primevue/tag"
import type { LguProgramLookup } from "@/features/lgu-billing/api/lgu-billing.service"

defineProps<{
  selectedProgramName: string
  budgetMonthLabel: string
  canManageLguDashboard: boolean
  budgetLedgerVisible: boolean
  lguProgramOptions: Array<LguProgramLookup & { label: string }>
  loadingPrograms: boolean
}>()

const selectedProgramIdModel = defineModel<number | null>("selectedProgramId")

defineEmits<{
  "toggle-budget": []
  "open-exports": []
}>()
</script>
