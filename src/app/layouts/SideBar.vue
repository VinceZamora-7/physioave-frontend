<template>
  <!-- Backdrop (mobile only) -->
  <div
    v-if="mobileOpen"
    class="app-sidebar-backdrop backdrop-blur-sm"
    @click="closeMobile"
    aria-hidden="true"
  />

  <aside :class="asideClass" role="navigation" aria-label="Main navigation">
    <!-- HEADER / BRAND -->
    <div class="px-2 pt-3">
      <div
        :class="[
          'rounded-2xl border border-brand-cyan-soft/50 bg-gradient-to-br from-cyan-soft to-white p-2 shadow-sm',
          collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3'
        ]"
      >
        <!-- Logo -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-cyan shadow-sm"
        >
          <img
            src="@/assets/img/physioave-logo-white.png"
            alt="PhysioAve logo"
            class="h-full w-full object-contain p-1.5"
            loading="eager"
          />
        </div>

        <!-- Company info (expanded only) -->
        <div
          v-if="!collapsed"
          class="min-w-0 flex-1 leading-tight"
        >
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-bold text-brand-navy">
              PhysioAve
            </p>
          </div>
          <p class="mt-0.5 truncate text-xs text-slate-500">
            Management System
          </p>
        </div>

        <!-- Toggle buttons -->
        <div class="flex gap-2">
          <!-- Collapse/Expand desktop -->
          <button
            v-if="!isMobile"
            type="button"
            class="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand-cyan-soft/60 bg-white text-brand-cyan shadow-sm transition hover:bg-cyan-soft"
            :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :title="collapsed ? 'Expand' : 'Collapse'"
            @click="toggleCollapsed"
          >
            <i :class="['pi text-[16px]', collapsed ? 'pi-angle-right' : 'pi-angle-left']" />
          </button>

        </div>
      </div>
    </div>

    <!-- NAV -->
    <nav class="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4 app-scrollbar">
      <!-- PT USER NAV -->
      <div v-if="isPhysicalTherapistUser" class="space-y-5">
        <div>
          <div
            v-if="!collapsed"
            class="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-cyan"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-brand-cyan"></span>
            My Work
          </div>

          <ul class="space-y-1.5">
            <li
              v-for="item in ptNavItems"
              :key="item.name"
            >
              <button
                type="button"
                class="group relative w-full flex items-center gap-3 rounded-xl px-2 py-2 transition"
                :class="currentRouteName === item.name
                  ? 'bg-brand-cyan text-white shadow-sm'
                  : 'text-brand-navy hover:bg-cyan-soft/30'"
                @click="goToAndClose(item.name)"
                :aria-label="item.label"
                :title="item.label"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  :class="currentRouteName === item.name ? 'bg-brand-cyan/20' : 'bg-white shadow-sm'"
                >
                  <i :class="['pi text-[16px]', item.icon]" />
                </span>
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- ADMIN / NON-PT NAV -->
      <div v-else class="space-y-5">
        <!-- Overview -->
        <div v-if="!collapsed">
          <div class="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-cyan">
            <span class="h-1.5 w-1.5 rounded-full bg-brand-cyan"></span>
            Overview
          </div>

          <ul class="space-y-1.5">
            <li v-if="canAccessRoute('dashboard')">
              <button
                type="button"
                class="group relative w-full flex items-center gap-3 rounded-xl px-2 py-2 transition"
                :class="currentRouteName === 'dashboard'
                  ? 'bg-brand-cyan text-white shadow-sm'
                  : 'text-brand-navy hover:bg-cyan-soft/30'"
                @click="goToAndClose('dashboard')"
                aria-label="Dashboard"
                title="Dashboard"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  :class="currentRouteName === 'dashboard' ? 'bg-brand-cyan/20' : 'bg-white shadow-sm'"
                >
                  <i class="pi pi-chart-line text-[16px]" />
                </span>
                <span class="truncate">Dashboard</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Patient Care -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-cyan transition hover:bg-brand-cyan/10"
            @click="patientCareOpen = !patientCareOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-cyan"></span>
              Patient Care
            </span>
            <i
              class="pi text-[11px] transition-transform"
              :class="patientCareOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || patientCareOpen" class="space-y-1.5">
            <li
              v-for="item in patientCareItems"
              :key="item.name"
            >
              <button
                type="button"
                class="group relative w-full flex items-center gap-3 rounded-xl px-2 py-2 transition"
                :class="currentRouteName === item.name
                  ? 'bg-brand-cyan text-white shadow-sm'
                  : 'text-brand-navy hover:bg-cyan-soft/30'"
                @click="goToAndClose(item.name)"
                :aria-label="item.label"
                :title="item.label"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  :class="currentRouteName === item.name ? 'bg-brand-cyan/20' : 'bg-white shadow-sm'"
                >
                  <i :class="['pi text-[16px]', item.icon]" />
                </span>
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Services & Coverage -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-magenta transition hover:bg-brand-magenta/10"
            @click="promosOffersOpen = !promosOffersOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-magenta"></span>
              Services &amp; Coverage
            </span>
            <i
              class="pi text-[11px] transition-transform"
              :class="promosOffersOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || promosOffersOpen" class="space-y-1.5">
            <li
              v-for="item in servicesItems"
              :key="item.name"
            >
              <button
                type="button"
                class="group relative w-full flex items-center gap-3 rounded-xl px-2 py-2 transition"
                :class="currentRouteName === item.name
                  ? 'bg-brand-cyan text-white shadow-sm'
                  : 'text-brand-navy hover:bg-cyan-soft/30'"
                @click="goToAndClose(item.name)"
                :aria-label="item.label"
                :title="item.label"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  :class="currentRouteName === item.name ? 'bg-brand-cyan/20' : 'bg-white shadow-sm'"
                >
                  <i :class="['pi text-[16px]', item.icon]" />
                </span>
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Settings -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-navy transition hover:bg-brand-navy/10"
            @click="operationsOpen = !operationsOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-navy"></span>
              Settings
            </span>
            <i
              class="pi text-[11px] transition-transform"
              :class="operationsOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || operationsOpen" class="space-y-1.5">
            <li
              v-for="item in settingsItems"
              :key="item.name"
            >
              <button
                type="button"
                class="group relative w-full flex items-center gap-3 rounded-xl px-2 py-2 transition"
                :class="currentRouteName === item.name
                  ? 'bg-brand-cyan text-white shadow-sm'
                  : 'text-brand-navy hover:bg-cyan-soft/30'"
                @click="goToAndClose(item.name)"
                :aria-label="item.label"
                :title="item.label"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  :class="currentRouteName === item.name ? 'bg-brand-cyan/20' : 'bg-white shadow-sm'"
                >
                  <i :class="['pi text-[16px]', item.icon]" />
                </span>
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- FOOTER -->
    <div class="mt-auto border-t border-brand-cyan-soft/40 px-3 pb-4 pt-3">
      <div class="space-y-3">
        <!-- User Card -->
        <div
          :class="[
            'rounded-2xl border border-brand-cyan-soft/50 bg-gradient-to-br from-cyan-soft to-white p-2 shadow-sm',
            collapsed ? 'flex justify-center' : ''
          ]"
        >
          <div class="flex items-center gap-3">
            <div
              class="app-sidebar-avatar shrink-0 flex items-center justify-center rounded-full bg-brand-cyan text-white ring-2 ring-brand-cyan-soft/70 font-bold"
              :class="collapsed ? 'w-11 h-11 text-lg' : 'w-10 h-10 text-base'"
            >
              {{ userInitials }}
            </div>

            <div v-if="!collapsed" class="min-w-0">
              <p class="app-sidebar-title truncate text-sm font-bold text-brand-navy">
                {{ displayName }}
              </p>
              <p class="app-sidebar-muted truncate text-xs text-slate-500">
                {{ displayRole }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          :class="[
            'flex items-stretch gap-2',
            collapsed ? 'flex-col' : 'flex-row'
          ]"
        >
          <!-- Logout -->
          <button
            type="button"
            @click="onLogout"
            :disabled="isPending"
            aria-label="Logout"
            title="Logout"
            :class="[
              'app-sidebar-logout group flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition',
              'border-brand-cyan-soft/60 bg-white text-brand-navy',
              'hover:bg-brand-pink/10 hover:text-brand-magenta hover:border-brand-magenta/30',
              'disabled:opacity-50 disabled:pointer-events-none',
              collapsed ? 'w-full justify-center' : 'w-full'
            ]"
          >
            <span class="app-sidebar-logout-icon flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
              <i class="pi pi-sign-out text-[16px]" />
            </span>
            <span v-if="!collapsed" class="flex-1 text-left font-medium">Logout</span>
            <span
              class="app-sidebar-status-dot h-2 w-2 rounded-full"
              :class="isPending ? 'bg-brand-magenta opacity-100' : 'bg-brand-cyan opacity-70'"
            />
          </button>

          <!-- Theme Toggle -->
          <button
            type="button"
            @click="toggleTheme"
            :class="[
              'app-sidebar-theme-button grid place-items-center rounded-xl border px-3 shadow-sm transition',
              'border-brand-cyan-soft/60 bg-white text-brand-cyan',
              'hover:bg-cyan-soft hover:text-brand-cyan-soft',
              collapsed ? 'w-full h-10' : 'w-10 h-10'
            ]"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="isDark ? 'Light mode' : 'Dark mode'"
          >
            <i class="pi text-[16px]" :class="isDark ? 'pi-sun' : 'pi-moon'" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useConfirm } from "primevue/useconfirm"
import { useLogout } from "@/services/logout-tanstack.service"
import { clinicStore } from "@/stores/clinic.store"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { ROUTE_ACCESS_RULES } from "@/shared/permissions"

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: "update:collapsed", v: boolean): void
}>()

const router = useRouter()
const route = useRoute()
const confirm = useConfirm()
const { mutate, isPending } = useLogout()
const globalClinicStore = clinicStore()
const authSession = useAuthSessionStore()
const { currentUser, permissionSet } = storeToRefs(authSession)

const mobileOpen = ref(false)
const operationsOpen = ref(false)
const patientCareOpen = ref(true)
const promosOffersOpen = ref(false)
const collapsed = ref<boolean>(props.collapsed ?? true)
const isMobile = ref(false)

// watch parent collapsed
watch(() => props.collapsed, (v) => {
  if (typeof v === "boolean") collapsed.value = v
})

// notify parent
watch(collapsed, (v) => emit("update:collapsed", v), { immediate: true })

// detect mobile
const checkMobile = () => isMobile.value = window.innerWidth < 768
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// theme
const isDark = ref(false)
const syncIsDark = () => isDark.value = document.documentElement.classList.contains("dark")
const toggleTheme = () => {
  const root = document.documentElement
  const nowDark = root.classList.toggle("dark")
  localStorage.setItem("theme", nowDark ? "dark" : "light")
  isDark.value = nowDark
}
onMounted(syncIsDark)

const toStringValue = (value: unknown): string => typeof value === "string" ? value.trim() : ""

const displayName = computed(() => {
  const user = currentUser.value
  if (!user) return "Logged In User"
  const fromName = toStringValue(user.name)
  if (fromName) return fromName
  const fromEmail = toStringValue(user.email)
  if (fromEmail) return fromEmail
  return "Logged In User"
})

const displayRole = computed(() => {
  const user = currentUser.value
  if (!user) return "User"
  const roleFields = [user.role_name, user.secondary_role_name]
  for (const roleField of roleFields) {
    const roleValue = toStringValue(roleField)
    if (roleValue) return roleValue
  }
  return "User"
})

const normalizedUserProviderType = computed(() => {
  const providerType = toStringValue(currentUser.value?.appointment_provider_type).toUpperCase()
  if (providerType === "PHYSICAL_THERAPIST" || providerType === "DOCTOR_CONSULTANT") {
    return providerType
  }
  const secondaryProviderType = toStringValue(currentUser.value?.secondary_appointment_provider_type).toUpperCase()
  if (secondaryProviderType === "PHYSICAL_THERAPIST" || secondaryProviderType === "DOCTOR_CONSULTANT") {
    return secondaryProviderType
  }
  const normalizedRole = displayRole.value.trim().toLowerCase()
  if (normalizedRole.includes("physical therapist")) return "PHYSICAL_THERAPIST"
  if (normalizedRole.includes("doctor consultant")) return "DOCTOR_CONSULTANT"
  return "NONE"
})

const hasPermissionData = computed(() => permissionSet.value.size > 0)

const ADMIN_NAV_ROUTE_NAMES = [
  "dashboard", "general-settings", "pt-team-setup", "admin-setup",
  "clinics", "patients", "billing", "reports",
  "promos-offers", "promos-offers-single-service",
  "promos-offers-package-service", "promos-offers-hmo", "promos-offers-lgu"
]

const hasAdminNavigationAccess = computed(() =>
  ADMIN_NAV_ROUTE_NAMES.some(routeName => {
    const rule = ROUTE_ACCESS_RULES[routeName]
    return rule ? authSession.canAccessRoute(routeName) : false
  })
)

const isPhysicalTherapistUser = computed(() =>
  normalizedUserProviderType.value === "PHYSICAL_THERAPIST" &&
  !hasAdminNavigationAccess.value
)

const canAccessRoute = (routeName: string): boolean => {
  if (!hasPermissionData.value) return false
  return authSession.canAccessRoute(routeName)
}

const userInitials = computed(() => {
  const words = displayName.value.split(/\s+/).filter(Boolean).slice(0, 2)
  if (!words.length) return "U"
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("")
})

// mobile helpers
const closeMobile = () => mobileOpen.value = false
const toggleMobile = () => mobileOpen.value = !mobileOpen.value
const openMobile = () => mobileOpen.value = true

// collapse
const toggleCollapsed = () => collapsed.value = !collapsed.value

defineExpose({
  collapsed,
  toggleMobile,
  openMobile,
  closeMobile,
  toggleCollapsed,
})

const currentRouteName = computed(() => String(route.name ?? ""))

const goToAndClose = async (name: string) => {
  if (currentRouteName.value !== name) await router.push({ name })
  if (mobileOpen.value) mobileOpen.value = false
}

// Navigation items (data-driven)
const ptNavItems = computed(() => [
  { name: 'dashboard', label: 'Dashboard', icon: 'pi-chart-line' },
  { name: 'patients', label: 'Patients', icon: 'pi-users' },
  { name: 'appointments', label: 'Appointments', icon: 'pi-calendar-plus' },
  { name: 'billing', label: 'Billing', icon: 'pi-wallet' },
  { name: 'reports', label: 'Reports', icon: 'pi-chart-bar' },
].filter(item => canAccessRoute(item.name)))

const patientCareItems = computed(() => [
  { name: 'patients', label: 'Patients', icon: 'pi-users' },
  { name: 'appointments', label: 'Appointments', icon: 'pi-calendar-plus' },
  { name: 'billing', label: 'Billing', icon: 'pi-wallet' },
  { name: 'reports', label: 'Reports', icon: 'pi-chart-bar' },
].filter(item => canAccessRoute(item.name)))

const servicesItems = computed(() => [
  { name: 'promos-offers-single-service', label: 'Single Service', icon: 'pi-bolt' },
  { name: 'promos-offers-package-service', label: 'Package Service', icon: 'pi-box' },
  { name: 'promos-offers-hmo', label: 'HMO', icon: 'pi-briefcase' },
  { name: 'promos-offers-lgu', label: 'LGU', icon: 'pi-building-columns' },
].filter(item => canAccessRoute(item.name)))

const settingsItems = computed(() => [
  { name: 'general-settings', label: 'General Settings', icon: 'pi-cog' },
  { name: 'admin-setup', label: 'Admin Setup', icon: 'pi-users' },
  { name: 'pt-team-setup', label: 'PT Team Setup', icon: 'pi-sliders-h' },
  { name: 'clinics', label: 'Clinics', icon: 'pi-map-marker' },
].filter(item => canAccessRoute(item.name)))

const asideClass = computed(() => [
  "fixed inset-y-0 left-0 z-50",
  "flex flex-col",
  "shadow-sm",
  "transition-[transform,width] duration-300",
  "app-sidebar-shell border-r bg-white",
  collapsed.value ? "w-[84px]" : "w-[260px]",
  mobileOpen.value ? "translate-x-0" : "-translate-x-full",
  "md:translate-x-0",
])

const onLogout = () => {
  if (isPending.value) return
  confirm.require({
    message: "Are you sure you want to logout?",
    header: "Logout Confirmation",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: isPending.value,
    },
    acceptProps: {
      label: "Logout",
      severity: "danger",
      icon: "pi pi-sign-out",
      loading: isPending.value,
    },
    accept: () => {
      if (isPending.value) return
      mutate(undefined, {
        async onSuccess() {
          await router.push({ name: "login" })
        },
      })
    },
  })
}

// auth
const handleAuthUserUpdated = () => void authSession.refresh().catch(() => authSession.clear())

onMounted(() => {
  void authSession.ensureLoaded().catch(() => authSession.clear())
  void globalClinicStore.initializeFromAuthSession().catch(() => globalClinicStore.loadClinics())
  window.addEventListener("auth-user-updated", handleAuthUserUpdated)
})

onUnmounted(() => {
  window.removeEventListener("auth-user-updated", handleAuthUserUpdated)
})
</script>

<style>
/* App scrollbar */
.app-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-brand-cyan-soft) transparent;
}

.app-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.app-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.app-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-brand-cyan-soft);
  border-radius: 3px;
}

.app-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-brand-cyan);
}

/* Sidebar shell */
.app-sidebar-shell {
  background: #ffffff;
}

/* Avatar */
.app-sidebar-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
}

/* Title & muted */
.app-sidebar-title {
  font-size: 14px;
}

.app-sidebar-muted {
  font-size: 12px;
  color: #64748b;
}

/* Logout button */
.app-sidebar-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 8px 12px;
  background: #ffffff;
  color: var(--color-brand-navy);
  border: 1px solid var(--color-brand-cyan-soft);
  transition: all 0.2s;
}

.app-sidebar-logout:hover:not(:disabled) {
  background: rgba(219, 101, 198, 0.1);
  color: var(--color-brand-magenta);
}

.app-sidebar-logout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

/* Theme button */
.app-sidebar-theme-button {
  display: grid;
  place-items: center;
  border-radius: 12px;
  padding: 8px;
  background: #ffffff;
  color: var(--color-brand-cyan);
  border: 1px solid var(--color-brand-cyan-soft);
  transition: all 0.2s;
}

.app-sidebar-theme-button:hover {
  background: var(--color-brand-cyan-soft);
}

/* Status dot */
.app-sidebar-status-dot {
  background: var(--color-brand-cyan);
}

/* Backdrop */
.app-sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}
</style>
