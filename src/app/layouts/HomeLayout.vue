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
      <!-- TOPBAR -->
      <header
        class="sticky top-0 z-30 border-b border-[rgb(var(--app-border))]
               bg-[rgb(var(--app-card))] backdrop-blur"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Mobile hamburger -->
          <button
            type="button"
            class="md:hidden grid h-10 w-10 place-items-center rounded-2xl transition
                   border border-[rgb(var(--app-border))]
                   bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]
                   hover:bg-[rgba(60,136,177,0.12)]"
            aria-label="Open sidebar"
            @click="sidebarRef?.toggleMobile()"
          >
            <i class="pi pi-bars text-[16px]" />
          </button>

          <!-- Title -->
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-[rgb(var(--app-fg))]">
              {{ pageTitle }}
            </p>
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">
              PhysioAve Management System
            </p>
          </div>

          <!-- Right actions -->
          <div class="ml-auto flex items-center gap-3">
            <span class="hidden sm:inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span class="h-2 w-2 rounded-full bg-[rgb(var(--app-accent))] opacity-70" />
              Online
            </span>
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
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import SideBar from "@/app/layouts/SideBar.vue"

const sidebarRef = ref<InstanceType<typeof SideBar> | null>(null)

// ✅ parent-owned state (always reactive)
const sidebarCollapsed = ref(true)

const route = useRoute()
const pageTitle = computed(() => {
  const name = String(route.name ?? "")
  const map: Record<string, string> = {
    clinics: "Clinics",
    staffs: "Staff",
    patients: "Patients",
    hmos: "HMO",
    "refresh-tokens": "Refresh Tokens",
    machines: "Machines",
    techniques: "Techniques",
    evaluations: "Evaluations",
    appointments: "Appointments",
    billing: "Billing",
    reports: "Reports",
    dashboard: "Dashboard",
  }
  return map[name] ?? "PhysioAve"
})
</script>
