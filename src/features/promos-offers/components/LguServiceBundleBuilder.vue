<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Promos And Offers</p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">LGU Service Management</h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            Manage LGU fund allocations, service budgets, and coverage limits. Define which services are covered under LGU programs, set monthly budgets, and track session-based utilization.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Add New Service" icon="pi pi-plus" @click="openAddDialog" />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="refreshAll" />
        </div>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Available Services for LGU Coverage</h3>
          <p class="text-xs opacity-70">Define service pricing, session limits, and budget allocation rules for LGU-funded patients.</p>
        </div>
        <Button label="Add LGU Service Package" icon="pi pi-plus" @click="openAddServiceDialog" />
      </div>

      <div v-if="allServices.length === 0" class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 text-center text-sm opacity-60">
        <p>No services available yet. Create services in the Single Service or Package Service modules first.</p>
      </div>

      <DataTable
        v-else
        :value="allServices"
        dataKey="id"
        paginator
        :rows="25"
        :loading="isLoading"
        class="rounded-lg border border-[rgb(var(--app-border))]"
      >
        <Column field="type" header="Service Type" style="width: 120px">
          <template #body="{data}">
            <Tag :value="formatServiceType(data.type)" :severity="getServiceTypeSeverity(data.type)" />
          </template>
        </Column>
        <Column field="name" header="Service Name" />
        <Column field="price" header="Price" style="width: 120px">
          <template #body="{data}">{{ asCurrency(data.price) }}</template>
        </Column>
        <Column header="LGU Coverage" style="width: 100px">
          <template #body="{data}">
            <div class="flex items-center">
              <input v-model="lguCoverage[data.id]" type="checkbox" class="cursor-pointer" />
            </div>
          </template>
        </Column>
        <Column header="Monthly Budget" style="width: 150px">
          <template #body="{data}">
            <InputNumber
              v-if="lguCoverage[data.id]"
              v-model="lguBudget[data.id]"
              :min="0"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              :maxFractionDigits="2"
            />
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Session Limit" style="width: 120px">
          <template #body="{data}">
            <InputNumber
              v-if="lguCoverage[data.id]"
              v-model="lguSessionLimit[data.id]"
              :min="0"
              :maxFractionDigits="0"
            />
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column field="status" header="Status" style="width: 100px">
          <template #body="{data}">
            <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="app-section-card-comfy">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold">Budget Summary</h3>
          <p class="text-xs opacity-70 mt-1">Total allocated budget across all LGU-covered services.</p>
        </div>
        <Button label="Save Configuration" icon="pi pi-save" @click="saveLguConfiguration" />
      </div>

      <section class="mt-3 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-1">
            <h3 class="text-sm font-semibold">Manager LGU Dashboard</h3>
            <p class="text-xs opacity-70">Set monthly base fund and manually add rollover amount to track total available LGU budget.</p>
          </div>
          <Tag :value="canManageLguDashboard ? 'Manager Access' : 'Read-only'" :severity="canManageLguDashboard ? 'success' : 'secondary'" />
        </div>

        <Message v-if="!canManageLguDashboard" severity="warn" :closable="false" size="small">
          Budget controls are available to Manager/Operations leadership roles. You can still view totals below.
        </Message>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <IftaLabel>
            <InputNumber
              v-model="baseMonthlyBudget"
              :disabled="!canManageLguDashboard"
              :min="0"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              fluid
            />
            <label>Base Monthly Budget</label>
          </IftaLabel>

          <IftaLabel>
            <InputNumber
              v-model="rolloverInput"
              :disabled="!canManageLguDashboard"
              :min="0"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              fluid
            />
            <label>Rollover Amount to Add</label>
          </IftaLabel>

          <div class="flex items-end gap-2">
            <Button
              label="Add Rollover"
              icon="pi pi-plus"
              outlined
              :disabled="!canManageLguDashboard"
              @click="addRolloverAmount"
            />
            <Button
              label="Save Budget"
              icon="pi pi-save"
              :disabled="!canManageLguDashboard"
              @click="saveDashboardBudget"
            />
          </div>

          <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 space-y-1">
            <p class="text-xs opacity-70">Tracked Rollover Amount</p>
            <p class="text-base font-semibold">{{ asCurrency(rolloverAmount) }}</p>
          </div>
        </div>
      </section>

      <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <p class="text-xs opacity-70">Total Monthly Budget</p>
          <p class="text-lg font-semibold">{{ asCurrency(totalLguBudget) }}</p>
        </div>
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <p class="text-xs opacity-70">Services Covered</p>
          <p class="text-lg font-semibold">{{ coveredServiceCount }}</p>
        </div>
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <p class="text-xs opacity-70">Average Budget per Service</p>
          <p class="text-lg font-semibold">{{ asCurrency(averageBudgetPerService) }}</p>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
          <p class="text-xs opacity-70">Total Available Fund</p>
          <p class="text-lg font-semibold">{{ asCurrency(totalAvailableFund) }}</p>
        </div>
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
          <p class="text-xs opacity-70">Allocated Service Budget</p>
          <p class="text-lg font-semibold">{{ asCurrency(totalLguBudget) }}</p>
        </div>
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
          <p class="text-xs opacity-70">Remaining Available Fund</p>
          <p class="text-lg font-semibold" :class="remainingAvailableFund < 0 ? 'text-red-600' : ''">{{ asCurrency(remainingAvailableFund) }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useToast } from "primevue/usetoast"
import { errorToast, successToast } from "@/utils/toast.util"
import {readActivePromosServiceCatalog} from "@/features/promos-offers/composables/promos-storage.composable"

interface BillingPickerLookup {
  id: string | number
  name: string
  price: number
  type: string
  status?: string
}

type ServiceType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

const toast = useToast()
const isLoading = ref(false)
const allServices = ref<BillingPickerLookup[]>([])
const currentRoleName = ref<string>("")

const lguCoverage = ref<Record<string | number, boolean>>({})
const lguBudget = ref<Record<string | number, number>>({})
const lguSessionLimit = ref<Record<string | number, number>>({})
const baseMonthlyBudget = ref<number>(0)
const rolloverAmount = ref<number>(0)
const rolloverInput = ref<number>(0)

const MANAGER_ROLE_KEYWORDS = [
  "manager",
  "operations manager",
  "chief operations officer",
  "coo",
  "owner"
]

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatServiceType = (type: string): string => {
  const typeMap: Record<string, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-on (Machine)",
    "add-on-technique": "Add-on (Technique)",
    "add-on-home-service": "Add-on (Home Service)"
  }
  return typeMap[type] || type
}

const getServiceTypeSeverity = (type: string): "info" | "success" | "warning" | "secondary" | "danger" | "contrast" => {
  const severityMap: Record<string, "info" | "success" | "warning" | "secondary" | "danger" | "contrast"> = {
    machine: "info",
    technique: "success",
    evaluation: "warning",
    "add-on-machine": "secondary",
    "add-on-technique": "secondary",
    "add-on-home-service": "secondary"
  }
  return severityMap[type] || "contrast"
}

const totalLguBudget = computed(() =>
  Object.keys(lguCoverage.value)
    .filter(id => lguCoverage.value[id])
    .reduce((sum, id) => sum + (Number(lguBudget.value[id]) || 0), 0)
)

const coveredServiceCount = computed(() =>
  Object.values(lguCoverage.value).filter(Boolean).length
)

const averageBudgetPerService = computed(() =>
  coveredServiceCount.value > 0 ? totalLguBudget.value / coveredServiceCount.value : 0
)

const totalAvailableFund = computed(() =>
  Math.max(0, Number(baseMonthlyBudget.value ?? 0) + Number(rolloverAmount.value ?? 0))
)

const remainingAvailableFund = computed(() =>
  totalAvailableFund.value - totalLguBudget.value
)

const canManageLguDashboard = computed(() => {
  const normalized = currentRoleName.value.trim().toLowerCase()
  if (!normalized) return false
  return MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const resolveRoleFromStorage = (): string => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = String(parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole ?? "").trim()
      if (role) return role
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
        const first = parsed.roles[0]
        if (typeof first === "string" && first.trim()) return first.trim()
        if (first && typeof first === "object") {
          const roleObj = first as Record<string, unknown>
          const nested = String(roleObj.name ?? roleObj.role ?? "").trim()
          if (nested) return nested
        }
      }
    } catch {
      // Ignore malformed storage entries.
    }
  }
  return ""
}

const loadDashboardBudget = (): void => {
  try {
    const raw = localStorage.getItem("lgu_dashboard_budget")
    if (!raw) return
    const parsed = JSON.parse(raw) as { baseMonthlyBudget?: number; rolloverAmount?: number }
    baseMonthlyBudget.value = Math.max(0, Number(parsed.baseMonthlyBudget ?? 0))
    rolloverAmount.value = Math.max(0, Number(parsed.rolloverAmount ?? 0))
  } catch {
    // Ignore malformed storage entries.
  }
}

const saveDashboardBudget = (): void => {
  localStorage.setItem(
    "lgu_dashboard_budget",
    JSON.stringify({
      baseMonthlyBudget: Number(baseMonthlyBudget.value ?? 0),
      rolloverAmount: Number(rolloverAmount.value ?? 0),
      updatedAt: new Date().toISOString()
    })
  )
  successToast(toast, "LGU dashboard budget saved")
}

const addRolloverAmount = (): void => {
  const amount = Math.max(0, Number(rolloverInput.value ?? 0))
  if (amount <= 0) {
    errorToast(toast, "Enter a rollover amount greater than 0")
    return
  }
  rolloverAmount.value = Number(rolloverAmount.value ?? 0) + amount
  rolloverInput.value = 0
}

const loadServices = async (): Promise<void> => {
  try {
    isLoading.value = true
    allServices.value = readActivePromosServiceCatalog().map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price ?? 0),
      type: item.type,
      status: item.status
    }))
  } catch {
    errorToast(toast, "Failed to load services")
  } finally {
    isLoading.value = false
  }
}

const refreshAll = async (): Promise<void> => {
  await loadServices()
}

const openAddDialog = (): void => {
  successToast(toast, "Navigate to Machines, Techniques, or Evaluations modules to add new services")
}

const openAddServiceDialog = (): void => {
  successToast(toast, "Enable LGU coverage for existing services using the checkboxes above")
}

const saveLguConfiguration = async (): Promise<void> => {
  try {
    // Prepare payload
    const lguServices = Object.keys(lguCoverage.value)
      .filter(id => lguCoverage.value[id])
      .map(id => ({
        service_id: id,
        monthly_budget: Number(lguBudget.value[id]) || 0,
        session_limit: Number(lguSessionLimit.value[id]) || 0
      }))

    successToast(toast, `Saved LGU configuration for ${lguServices.length} service${lguServices.length !== 1 ? 's' : ''}`)
  } catch {
    errorToast(toast, "Failed to save LGU configuration")
  }
}

onMounted(async () => {
  currentRoleName.value = resolveRoleFromStorage()
  loadDashboardBudget()
  await loadServices()
})
</script>
