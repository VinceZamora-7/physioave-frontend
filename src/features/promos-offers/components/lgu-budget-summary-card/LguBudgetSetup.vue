<template>
  <section id="lgu-budget-ledger-panel" class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-1">
        <h4 class="m-0 text-base font-bold text-[rgb(var(--app-fg))]">Budget Setup</h4>
        <p class="m-0 max-w-2xl text-sm leading-6 text-[rgb(var(--app-fg))]/60">
          Configure the monthly LGU budget, add rollover funds, and publish the budget used by appointments and billing.
        </p>
      </div>

      <Tag :value="lguDashboardBudget ? 'Live Budget' : 'Draft / Not Opened'" :severity="lguDashboardBudget ? 'success' : 'secondary'" />
    </div>

    <div class="mt-4 grid gap-2">
      <Message v-if="!canManageLguDashboard" severity="warn" :closable="false" size="small">
        Budget controls are available to Manager/Operations leadership roles. Totals remain visible.
      </Message>
      <Message v-if="budgetSyncError" severity="warn" :closable="false" size="small">{{ budgetSyncError }}</Message>
      <Message v-else-if="loadingDashboardBudget" severity="secondary" :closable="false" size="small">
        Loading live LGU budget for {{ budgetMonthLabel }}...
      </Message>
      <Message v-else-if="hasLocalOnlyBudgetDraft" severity="warn" :closable="false" size="small">
        This budget was only saved in this browser before. Click <strong>Save Budget</strong> to publish it to appointments and LGU billing for {{ budgetMonthLabel }}.
      </Message>
      <Message v-else-if="lguDashboardBudget" severity="info" :closable="false" size="small">
        Live LGU budget is open for {{ budgetMonthLabel }}. Used so far: <strong>{{ asCurrency(usedLguFund) }}</strong>.
      </Message>
      <Message v-else severity="secondary" :closable="false" size="small">
        No live LGU budget is open for {{ budgetMonthLabel }} yet. Save this month's budget here to make LGU appointments billable.
      </Message>
      <Message v-if="isFutureBudgetMonth" severity="info" :closable="false" size="small">
        You are preparing the LGU budget for {{ budgetMonthLabel }} in advance. This stays separate from {{ currentMonthLabel }} and will not add into the current month fund.
      </Message>
    </div>

    <div class="mt-4 rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-2 xl:col-span-2">
          <IftaLabel>
            <Select v-model="selectedProgramIdModel" :options="lguProgramOptions" optionLabel="label" optionValue="id" placeholder="Select LGU Program" :loading="loadingPrograms" :disabled="savingDashboardBudget" fluid />
            <label>LGU Program</label>
          </IftaLabel>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <InputText v-if="showNewProgramInputModel" v-model="newProgramNameModel" placeholder="e.g. Gapan" size="small" fluid @keyup.enter="$emit('create-program')" />
            <Button v-if="showNewProgramInputModel" icon="pi pi-check" size="small" :loading="creatingProgram" :disabled="!newProgramNameModel.trim()" @click="$emit('create-program')" />
            <Button
              :label="showNewProgramInputModel ? 'Cancel' : 'Add LGU Program'"
              :icon="showNewProgramInputModel ? 'pi pi-times' : 'pi pi-plus'"
              size="small"
              :severity="showNewProgramInputModel ? 'secondary' : 'info'"
              text
              :disabled="!canManageLguDashboard"
              @click="toggleNewProgram"
            />
          </div>
        </div>

        <IftaLabel>
          <DatePicker v-model="selectedBudgetMonthDateModel" view="month" dateFormat="MM yy" :manualInput="false" showIcon fluid :minDate="currentMonthStart" :disabled="savingDashboardBudget" />
          <label>Budget Month</label>
        </IftaLabel>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3">
          <p class="m-0 text-xs font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/55">Tracked Rollover</p>
          <p class="m-0 mt-2 text-lg font-bold text-[rgb(var(--app-fg))]">{{ asCurrency(rolloverAmount) }}</p>
        </div>

        <IftaLabel>
          <InputNumber v-model="baseMonthlyBudgetModel" :disabled="!canManageLguDashboard || savingDashboardBudget" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Base Monthly Budget</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="rolloverInputModel" :disabled="!canManageLguDashboard || savingDashboardBudget" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Rollover Amount to Add</label>
        </IftaLabel>

        <div class="flex flex-col gap-2 md:col-span-2 xl:col-span-2 xl:flex-row xl:items-end xl:justify-end">
          <Button label="Refresh Budget" icon="pi pi-refresh" outlined class="w-full xl:w-auto" :loading="refreshingDashboardBudget" :disabled="loadingDashboardBudget || loadingTransactionHistory || savingDashboardBudget" @click="$emit('refresh-budget')" />
          <Button label="Add Rollover" icon="pi pi-plus" outlined class="w-full xl:w-auto" :disabled="!canManageLguDashboard || savingDashboardBudget" @click="$emit('add-rollover')" />
          <Button label="Save Budget" icon="pi pi-save" class="w-full xl:w-auto" :disabled="!canManageLguDashboard || loadingDashboardBudget || savingDashboardBudget" :loading="savingDashboardBudget" @click="$emit('save-budget')" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import type { LguDashboardBudget, LguProgramLookup } from "@/features/lgu-billing/api/lgu-billing.service"

defineProps<{
  lguDashboardBudget: LguDashboardBudget | null
  canManageLguDashboard: boolean
  budgetSyncError: string
  loadingDashboardBudget: boolean
  hasLocalOnlyBudgetDraft: boolean
  budgetMonthLabel: string
  usedLguFund: number
  isFutureBudgetMonth: boolean
  currentMonthLabel: string
  lguProgramOptions: Array<LguProgramLookup & { label: string }>
  loadingPrograms: boolean
  savingDashboardBudget: boolean
  currentMonthStart: Date
  rolloverAmount: number
  creatingProgram: boolean
  refreshingDashboardBudget: boolean
  loadingTransactionHistory: boolean
  asCurrency: (value: number) => string
}>()

const selectedProgramIdModel = defineModel<number | null>("selectedProgramId")
const showNewProgramInputModel = defineModel<boolean>("showNewProgramInput", { required: true })
const newProgramNameModel = defineModel<string>("newProgramName", { required: true })
const selectedBudgetMonthDateModel = defineModel<Date>("selectedBudgetMonthDate", { required: true })
const baseMonthlyBudgetModel = defineModel<number>("baseMonthlyBudget", { required: true })
const rolloverInputModel = defineModel<number>("rolloverInput", { required: true })

defineEmits<{
  "create-program": []
  "refresh-budget": []
  "add-rollover": []
  "save-budget": []
}>()

const toggleNewProgram = (): void => {
  showNewProgramInputModel.value = !showNewProgramInputModel.value
  newProgramNameModel.value = ""
}
</script>
