<template>
  <div class="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <!-- ✅ v-model binds collapsed -->
    <SideBar v-model:collapsed="sidebarCollapsed" ref="sidebarRef" />


    <!-- Content shell (push right on desktop depending on sidebar width) -->
    <div
      :class="[
        'min-h-screen flex flex-col',
        'transition-[padding-left] duration-300',
        sidebarCollapsed ? 'md:pl-[84px]' : 'md:pl-[260px]',
      ]"
    >
<header
  class="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700
         bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
>
  <div class="flex items-center gap-4 px-4 py-3">

    <!-- Mobile menu button -->
    <button
      type="button"
      class="md:hidden grid h-10 w-10 place-items-center rounded-xl
             border border-slate-200 dark:border-slate-700
             bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
             hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      aria-label="Open sidebar"
      @click="sidebarRef?.toggleMobile()"
    >
      <i class="pi pi-bars text-[18px]" />
    </button>

    <!-- Title -->
    <div class="flex flex-col">
      <p class="truncate font-semibold text-[15px] text-slate-900 dark:text-slate-100">
        {{ pageTitle }}
      </p>
      <p class="truncate text-xs text-slate-500 dark:text-slate-400 tracking-wide">
        PhysioAve Management System
      </p>
    </div>

    <!-- Right side -->
    <div class="ml-auto flex items-center gap-4">

      <!-- Branch selector -->
<div class="hidden sm:block w-[220px]">
  <label
    class="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400"
  >
    Branch
  </label>
  <Select
    v-model="selectedClinicIdProxy"
    :options="clinicSelectOptions"
    optionLabel="name"
    optionValue="id"
    filter
    placeholder="Select branch"
    :loading="isLoadingClinics"
    :disabled="isLoadingClinics || !clinicOptions.length"
    class="rounded-lg w-full"
  />
</div>


      <!-- Online indicator -->
      <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
        Online
      </div>
    </div>

  </div>
</header>


      <!-- MAIN CONTENT (scrolls vertically) -->
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

type SideBarExpose = {
  toggleMobile: () => void
}

const SideBar = defineAsyncComponent(() => import("@/app/layouts/SideBar.vue"))

const sidebarRef = ref<SideBarExpose | null>(null)

// ✅ parent-owned state (always reactive)
const sidebarCollapsed = ref(true)

// ── Clinic branch store ───────────────────────────────────────────────────
const globalClinicStore = clinicStore()
const { clinicOptions, isLoadingClinics, selectedClinicId } = storeToRefs(globalClinicStore)
const { setSelectedClinicId, loadClinics } = globalClinicStore

const clinicSelectOptions = computed(() => ([
  { id: 0, name: "All Branches" },
  ...(clinicOptions.value ?? [])
]))

const selectedClinicIdProxy = computed<number>({
  get: () => selectedClinicId.value ?? 0,
  set: (value: number) => setSelectedClinicId(value > 0 ? value : undefined)
})

const route = useRoute()
let presenceTimer: number | undefined

const touchPresence = async (): Promise<void> => {
  try {
    await pamsAPI.post("/auth/presence")
  } catch {
    // Auth errors are handled by normal API flows; presence should not interrupt navigation.
  }
}

onMounted(() => {
  void loadClinics()
  void touchPresence()
  presenceTimer = window.setInterval(() => {
    void touchPresence()
  }, 60_000)
})

onUnmounted(() => {
  if (presenceTimer !== undefined) {
    window.clearInterval(presenceTimer)
  }
})

const pageTitle = computed(() => {
  const name = String(route.name ?? "")
  const map: Record<string, string> = {
    settings: "Settings",
    clinics: "Clinics",
    staffs: "Staff",
    patients: "Patients",
    hmos: "HMO",
    "refresh-tokens": "Refresh Tokens",
    machines: "Machines",
    techniques: "Techniques",
    evaluations: "Evaluations",
    appointments: "Appointments",
    "patient-daily-log": "Patient Daily Log",
    billing: "Billing",
    reports: "Reports",
    dashboard: "Dashboard",
  }
  return map[name] ?? "PhysioAve"
})
</script>
