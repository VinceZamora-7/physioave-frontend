<template>
  <div class="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <SideBar v-model:collapsed="sidebarCollapsed" ref="sidebarRef" />

    <!-- Content shell -->
    <div
      :class="[
        'min-h-screen flex flex-col',
        'transition-[padding-left] duration-300 ease-in-out',
        sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[248px]',
      ]"
    >

      <!-- ── HEADER ───────────────────────────────────────────── -->
      <header class="app-header sticky top-0 z-30">
        <div class="flex items-center gap-3 px-4 py-3">

          <!-- Mobile menu button (only on mobile) -->
          <button
            v-if="isMobile"
            type="button"
            class="app-header-icon-btn"
            aria-label="Open sidebar"
            @click="sidebarRef?.toggleMobile()"
          >
            <i class="pi pi-bars text-[17px]" />
          </button>

          <!-- Page title -->
          <div class="min-w-0 flex flex-col">
            <p class="truncate font-semibold text-[15px] text-brand-navy">
              {{ pageTitle }}
            </p>
            <p class="truncate text-xs tracking-wide" style="color: var(--color-brand-purple); opacity: 0.55;">
              PhysioAve Management System
            </p>
          </div>

          <!-- Right side -->
          <div class="ml-auto flex items-center gap-3">

            <!-- Branch selector -->
            <div class="hidden sm:block w-[200px]">
              <Select
                v-model="selectedClinicIdProxy"
                :options="clinicSelectOptions"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Select branch"
                :loading="isLoadingClinics"
                :disabled="isLoadingClinics || isBranchLocked || !clinicOptions.length"
                class="app-header-select w-full"
              />
            </div>

            <!-- Online indicator -->
            <div class="app-header-online hidden sm:flex items-center gap-1.5 text-xs">
              <span class="app-header-online-dot" />
              Online
            </div>

          </div>
        </div>
      </header>

      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-4 sm:p-6">
          <router-view />
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from "vue"
import { useRoute } from "vue-router"
import Select from "primevue/select"
import { storeToRefs } from "pinia"
import { clinicStore } from "@/stores/clinic.store"
import { pamsAPI } from "@/utils/axios-interceptor"

type SideBarExpose = { toggleMobile: () => void }

const SideBar = defineAsyncComponent(() => import("@/app/layouts/SideBar.vue"))
const sidebarRef       = ref<SideBarExpose | null>(null)
const sidebarCollapsed = ref(true)
const isMobile         = ref(false)
const checkMobile      = () => { isMobile.value = window.innerWidth < 768 }

// ── Clinic store ─────────────────────────────────────────────────
const globalClinicStore = clinicStore()
const {
  clinicOptions,
  isLoadingClinics,
  selectedClinicId,
  isBranchLocked,
  canSelectAllBranches,
} = storeToRefs(globalClinicStore)
const { setSelectedClinicId, initializeFromAuthSession, loadClinics } = globalClinicStore

const clinicSelectOptions = computed(() => [
  ...(canSelectAllBranches.value ? [{ id: 0, name: "All Branches" }] : []),
  ...(clinicOptions.value ?? []),
])

const selectedClinicIdProxy = computed<number>({
  get: () => selectedClinicId.value ?? 0,
  set: (value: number) => setSelectedClinicId(value > 0 ? value : undefined),
})

// ── Presence ping ────────────────────────────────────────────────
const route = useRoute()
let presenceTimer: number | undefined

const touchPresence = async (): Promise<void> => {
  try { await pamsAPI.post("/auth/presence") } catch { /* handled by API flow */ }
}

onMounted(() => {
  checkMobile()
  window.addEventListener("resize", checkMobile)
  void initializeFromAuthSession().catch(() => loadClinics())
  void touchPresence()
  presenceTimer = window.setInterval(() => void touchPresence(), 60_000)
})
onUnmounted(() => {
  window.removeEventListener("resize", checkMobile)
  if (presenceTimer !== undefined) window.clearInterval(presenceTimer)
})

// ── Page title map ───────────────────────────────────────────────
const pageTitle = computed(() => {
  const map: Record<string, string> = {
    dashboard:          "Dashboard",
    patients:           "Patients",
    appointments:       "Appointments",
    "patient-daily-log":"Patient Daily Log",
    billing:            "Billing",
    reports:            "Reports",
    clinics:            "Clinics",
    staffs:             "Staff",
    hmos:               "HMO",
    "refresh-tokens":   "Refresh Tokens",
    machines:           "Machines",
    techniques:         "Techniques",
    evaluations:        "Evaluations",
    settings:           "Settings",
    "general-settings": "General Settings",
    "admin-setup":      "Admin Setup",
    "pt-team-setup":    "PT Team Setup",
    "promos-offers-single-service":  "Single Service",
    "promos-offers-package-service": "Package Service",
    "promos-offers-hmo":             "HMO Coverage",
    "promos-offers-lgu":             "LGU Coverage",
  }
  return map[String(route.name ?? "")] ?? "PhysioAve"
})
</script>

<style scoped>
/* ── Header shell ───────────────────────────────────────────────── */
.app-header {
  border-bottom: 1px solid rgba(219, 101, 198, 0.2);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 8px rgba(94, 24, 105, 0.05);
}

/* ── Mobile hamburger ───────────────────────────────────────────── */
.app-header-icon-btn {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(219, 101, 198, 0.25);
  background: #fff;
  color: var(--color-brand-purple);
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.app-header-icon-btn:hover {
  background: rgba(94, 24, 105, 0.07);
  color: var(--color-brand-magenta);
}

/* ── Branch select ──────────────────────────────────────────────── */
.app-header-select :deep(.p-select) {
  border-color: rgba(219, 101, 198, 0.3);
  border-radius: 10px;
  font-size: 13px;
}
.app-header-select :deep(.p-select:hover) {
  border-color: var(--color-brand-purple);
}
.app-header-select :deep(.p-select:focus-within) {
  box-shadow: 0 0 0 2px rgba(94, 24, 105, 0.15);
  border-color: var(--color-brand-purple);
}

/* ── Online indicator ───────────────────────────────────────────── */
.app-header-online {
  color: var(--color-brand-purple);
  opacity: 0.65;
  font-size: 12px;
}

.app-header-online-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-brand-purple);
  box-shadow: 0 0 0 2px rgba(94, 24, 105, 0.2);
  flex-shrink: 0;
}
</style>
