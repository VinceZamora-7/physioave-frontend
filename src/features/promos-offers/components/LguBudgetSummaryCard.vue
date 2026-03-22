<template>
  <section class="app-section-card-comfy space-y-3">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">Manager LGU Dashboard</h3>
        <p class="text-xs opacity-70">Set Base Monthly Budget and manually add Rollover Amount to track the total available LGU fund.</p>
      </div>
      <Tag :value="canManageLguDashboard ? 'Manager Access' : 'Read-only'" :severity="canManageLguDashboard ? 'success' : 'secondary'" />
    </div>

    <Message v-if="!canManageLguDashboard" severity="warn" :closable="false" size="small">
      Budget controls are available to Manager/Operations leadership roles. Totals remain visible.
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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Total Available Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(totalAvailableFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">LGU Package Commitment</p>
        <p class="text-lg font-semibold">{{ asCurrency(totalLguPackageCommitment) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Remaining Available Fund</p>
        <p class="text-lg font-semibold" :class="remainingAvailableFund < 0 ? 'text-red-600' : ''">{{ asCurrency(remainingAvailableFund) }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import Button from "primevue/button"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useToast } from "primevue/usetoast"
import { errorToast, successToast } from "@/utils/toast.util"

type LguPackage = {
  packagePrice?: number
  status?: string
}

const toast = useToast()
const currentRoleName = ref<string>("")
const baseMonthlyBudget = ref<number>(0)
const rolloverAmount = ref<number>(0)
const rolloverInput = ref<number>(0)
const totalLguPackageCommitment = ref<number>(0)

const MANAGER_ROLE_KEYWORDS = [
  "manager",
  "operations manager",
  "chief operations officer",
  "coo",
  "owner"
]

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const totalAvailableFund = computed(() =>
  Math.max(0, Number(baseMonthlyBudget.value ?? 0) + Number(rolloverAmount.value ?? 0))
)

const remainingAvailableFund = computed(() =>
  totalAvailableFund.value - Number(totalLguPackageCommitment.value ?? 0)
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

const loadLguCommitment = (): void => {
  try {
    const stored = localStorage.getItem("lguPackageServiceOffers")
    const parsed = stored ? (JSON.parse(stored) as LguPackage[]) : []
    totalLguPackageCommitment.value = (parsed ?? [])
      .filter(item => String(item.status ?? "Active") !== "Inactive")
      .reduce((sum, item) => sum + Number(item.packagePrice ?? 0), 0)
  } catch {
    totalLguPackageCommitment.value = 0
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

onMounted(() => {
  currentRoleName.value = resolveRoleFromStorage()
  loadDashboardBudget()
  loadLguCommitment()
})
</script>
