<template>
  <!-- Backdrop (mobile only) -->
  <div
    v-if="mobileOpen"
    class="app-sidebar-backdrop backdrop-blur-sm"
    @click="closeMobile"
  />

  <aside :class="asideClass">
    <!-- HEADER / BRAND -->
<!-- HEADER / BRAND -->
<div class="px-2 pt-3">
  <!-- Expanded header -->
  <div
    v-if="!collapsed"
    class="rounded-2xl border border-[#A3D9E8]/50 bg-gradient-to-br from-[#EEF8FB] to-white p-2 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <!-- Logo -->
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#3C88B1] shadow-sm"
      >
        <img
          src="@/assets/img/physioave-logo-white.png"
          alt="PhysioAve logo"
          class="h-full w-full object-contain p-1.5"
        />
      </div>

      <!-- Company -->
      <div class="min-w-0 flex-1 leading-tight">
        <div class="flex items-center gap-2">
          <p class="truncate text-sm font-bold text-[#242757]">
            PhysioAve
          </p>

          <span
            class="rounded-full bg-[#3C88B1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3C88B1]"
          >
            PAMS
          </span>
        </div>

        <p class="mt-0.5 truncate text-xs text-slate-500">
          Management System
        </p>
      </div>

      <!-- Collapse desktop -->
      <button
        type="button"
        class="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#A3D9E8]/60 bg-white text-[#3C88B1] shadow-sm transition hover:bg-[#E8F6FB] hidden md:grid"
        aria-label="Collapse sidebar"
        title="Collapse"
        @click="toggleCollapsed"
      >
        <i class="pi pi-angle-left text-[16px]" />
      </button>

      <!-- Close mobile -->
      <button
        type="button"
        class="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#A3D9E8]/60 bg-white text-[#3C88B1] shadow-sm transition hover:bg-[#E8F6FB] md:hidden"
        aria-label="Close sidebar"
        @click="closeMobile"
      >
        <i class="pi pi-times text-[16px]" />
      </button>
    </div>
  </div>

  <!-- Collapsed header -->
  <div
    v-else
    class="flex flex-col items-center gap-2 rounded-2xl border border-[#A3D9E8]/50 bg-gradient-to-br from-[#EEF8FB] to-white p-2 shadow-sm"
  >
    <!-- Logo -->
    <div
      class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#3C88B1] shadow-sm"
    >
      <img
        src="@/assets/img/physioave-logo-white.png"
        alt="PhysioAve logo"
        class="h-full w-full object-contain p-1.5"
      />
    </div>

    <!-- Expand desktop -->
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-xl border border-[#A3D9E8]/60 bg-white text-[#3C88B1] shadow-sm transition hover:bg-[#E8F6FB] hidden md:grid"
      aria-label="Expand sidebar"
      title="Expand"
      @click="toggleCollapsed"
    >
      <i class="pi pi-angle-right text-[15px]" />
    </button>

    <!-- Close mobile -->
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-xl border border-[#A3D9E8]/60 bg-white text-[#3C88B1] shadow-sm transition hover:bg-[#E8F6FB] md:hidden"
      aria-label="Close sidebar"
      @click="closeMobile"
    >
      <i class="pi pi-times text-[15px]" />
    </button>
  </div>
</div>

    <!-- NAV -->
    <nav class="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4 app-scrollbar">
      <!-- PT USER NAV -->
      <div v-if="isPhysicalTherapistUser" class="space-y-5">
        <div>
          <div
            v-if="!collapsed"
            class="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3C88B1]"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-[#3C88B1]"></span>
            My Work
          </div>

          <ul class="space-y-1.5">
            <li v-if="canAccessRoute('dashboard')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('dashboard')"
                :class="itemClass('dashboard')"
                aria-label="Dashboard"
                title="Dashboard"
              >
                <span :class="iconWrapClass('dashboard')">
                  <i class="pi pi-chart-line text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Dashboard</span>
              </button>
            </li>

            <li v-if="canAccessRoute('patients')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('patients')"
                :class="itemClass('patients')"
                aria-label="Patients"
                title="Patients"
              >
                <span :class="iconWrapClass('patients')">
                  <i class="pi pi-users text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Patients</span>
              </button>
            </li>

            <li v-if="canAccessRoute('appointments')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('appointments')"
                :class="itemClass('appointments')"
                aria-label="Appointments"
                title="Appointments"
              >
                <span :class="iconWrapClass('appointments')">
                  <i class="pi pi-calendar text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Appointments</span>
              </button>
            </li>

            <li v-if="canAccessRoute('patient-daily-log')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('patient-daily-log')"
                :class="itemClass('patient-daily-log')"
                aria-label="Patient Daily Log"
                title="Patient Daily Log"
              >
                <span :class="iconWrapClass('patient-daily-log')">
                  <i class="pi pi-clipboard text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Daily Log</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- ADMIN / NON-PT NAV -->
      <div v-else class="space-y-5">
        <!-- Overview -->
        <div>
          <div
            v-if="!collapsed"
            class="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3C88B1]"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-[#3C88B1]"></span>
            Overview
          </div>

          <ul class="space-y-1.5">
            <li v-if="canAccessRoute('dashboard')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('dashboard')"
                :class="itemClass('dashboard')"
                aria-label="Dashboard"
                title="Dashboard"
              >
                <span :class="iconWrapClass('dashboard')">
                  <i class="pi pi-chart-line text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Dashboard</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Patient Care -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3C88B1] transition hover:bg-[#3C88B1]/10"
            @click="patientCareOpen = !patientCareOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#3C88B1]"></span>
              Patient Care
            </span>

            <i
              class="pi text-[11px] transition-transform"
              :class="patientCareOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || patientCareOpen" class="space-y-1.5">
            <li v-if="canAccessRoute('patients')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('patients')"
                :class="itemClass('patients')"
                aria-label="Patients"
                title="Patients"
              >
                <span :class="iconWrapClass('patients')">
                  <i class="pi pi-users text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Patients</span>
              </button>
            </li>

            <li v-if="canAccessRoute('appointments')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('appointments')"
                :class="itemClass('appointments')"
                aria-label="Appointments"
                title="Appointments"
              >
                <span :class="iconWrapClass('appointments')">
                  <i class="pi pi-calendar text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Appointments</span>
              </button>
            </li>

            <li v-if="canAccessRoute('patient-daily-log')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('patient-daily-log')"
                :class="itemClass('patient-daily-log')"
                aria-label="Patient Daily Log"
                title="Patient Daily Log"
              >
                <span :class="iconWrapClass('patient-daily-log')">
                  <i class="pi pi-clipboard text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Daily Log</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Finance -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5E1869] transition hover:bg-[#5E1869]/10"
            @click="billingOpen = !billingOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#5E1869]"></span>
              Finance
            </span>

            <i
              class="pi text-[11px] transition-transform"
              :class="billingOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || billingOpen" class="space-y-1.5">
            <li v-if="canAccessRoute('billing')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('billing')"
                :class="itemClass('billing')"
                aria-label="Billing"
                title="Billing"
              >
                <span :class="iconWrapClass('billing')">
                  <i class="pi pi-receipt text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Billing</span>
              </button>
            </li>

            <li v-if="canAccessRoute('reports')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('reports')"
                :class="itemClass('reports')"
                aria-label="Finance and Reports"
                title="Finance and Reports"
              >
                <span :class="iconWrapClass('reports')">
                  <i class="pi pi-chart-bar text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Finance &amp; Reports</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Offers & Coverage -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A91D8B] transition hover:bg-[#A91D8B]/10"
            @click="promosOffersOpen = !promosOffersOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#A91D8B]"></span>
              Offers &amp; Coverage
            </span>

            <i
              class="pi text-[11px] transition-transform"
              :class="promosOffersOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || promosOffersOpen" class="space-y-1.5">
            <!-- <li v-if="canAccessRoute('promos-offers')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('promos-offers')"
                :class="itemClass('promos-offers')"
                aria-label="Offers Overview"
                title="Offers Overview"
              >
                <span :class="iconWrapClass('promos-offers')">
                  <i class="pi pi-briefcase text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Offers Overview</span>
              </button>
            </li> -->

            <li v-if="canAccessRoute('promos-offers-single-service')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('promos-offers-single-service')"
                :class="itemClass('promos-offers-single-service')"
                aria-label="Single Pay: Single Service"
                title="Single Pay: Single Service"
              >
                <span :class="iconWrapClass('promos-offers-single-service')">
                  <i class="pi pi-bolt text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Single Service</span>
              </button>
            </li>

            <li v-if="canAccessRoute('promos-offers-package-service')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('promos-offers-package-service')"
                :class="itemClass('promos-offers-package-service')"
                aria-label="Self-Pay: Package Service"
                title="Self-Pay: Package Service"
              >
                <span :class="iconWrapClass('promos-offers-package-service')">
                  <i class="pi pi-box text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Package Service</span>
              </button>
            </li>

            <li v-if="canAccessRoute('promos-offers-hmo')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('promos-offers-hmo')"
                :class="itemClass('promos-offers-hmo')"
                aria-label="HMO"
                title="HMO"
              >
                <span :class="iconWrapClass('promos-offers-hmo')">
                  <i class="pi pi-briefcase text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">HMO</span>
              </button>
            </li>

            <li v-if="canAccessRoute('promos-offers-lgu')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('promos-offers-lgu')"
                :class="itemClass('promos-offers-lgu')"
                aria-label="LGU"
                title="LGU"
              >
                <span :class="iconWrapClass('promos-offers-lgu')">
                  <i class="pi pi-building-columns text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">LGU</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Administration -->
        <div>
          <button
            v-if="!collapsed"
            type="button"
            class="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#242757] transition hover:bg-[#242757]/10"
            @click="operationsOpen = !operationsOpen"
          >
            <span class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#242757]"></span>
              Administration
            </span>

            <i
              class="pi text-[11px] transition-transform"
              :class="operationsOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
          </button>

          <ul v-show="collapsed || operationsOpen" class="space-y-1.5">
            <li v-if="canAccessRoute('general-settings')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('general-settings')"
                :class="itemClass('general-settings')"
                aria-label="General Settings"
                title="General Settings"
              >
                <span :class="iconWrapClass('general-settings')">
                  <i class="pi pi-cog text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">General Settings</span>
              </button>
            </li>

            <li v-if="canAccessRoute('admin-setup')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('admin-setup')"
                :class="itemClass('admin-setup')"
                aria-label="Admin Setup"
                title="Admin Setup"
              >
                <span :class="iconWrapClass('admin-setup')">
                  <i class="pi pi-users text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Admin Setup</span>
              </button>
            </li>

            <li v-if="canAccessRoute('pt-team-setup')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('pt-team-setup')"
                :class="itemClass('pt-team-setup')"
                aria-label="PT Team Setup"
                title="PT Team Setup"
              >
                <span :class="iconWrapClass('pt-team-setup')">
                  <i class="pi pi-sliders-h text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">PT Team Setup</span>
              </button>
            </li>

            <li v-if="canAccessRoute('clinics')">
              <button
                type="button"
                class="group relative w-full"
                @click="goToAndClose('clinics')"
                :class="itemClass('clinics')"
                aria-label="Clinics"
                title="Clinics"
              >
                <span :class="iconWrapClass('clinics')">
                  <i class="pi pi-map-marker text-[16px]" />
                </span>
                <span v-if="!collapsed" class="truncate">Clinics</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- FOOTER -->
    <div class="mt-auto border-t border-[#A3D9E8]/40 px-3 pb-4 pt-3">
      <div class="space-y-3">
        <!-- User Card -->
        <div
          :class="[
            'rounded-2xl border border-[#A3D9E8]/50 bg-gradient-to-br from-white to-[#EEF8FB] p-2 shadow-sm',
            collapsed ? 'flex justify-center' : ''
          ]"
        >
          <div class="flex items-center gap-3">
            <div class="app-sidebar-avatar shrink-0 ring-2 ring-[#A3D9E8]/70">
              {{ userInitials }}
            </div>

            <div v-if="!collapsed" class="min-w-0">
              <p class="app-sidebar-title truncate text-sm font-bold text-[#242757]">
                {{ displayName }}
              </p>
              <p class="app-sidebar-muted truncate text-xs">
                {{ displayRole }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div :class="['flex items-stretch gap-2', collapsed ? 'flex-col' : 'flex-row']">
          <!-- Logout -->
          <button
            type="button"
            @click="onLogout"
            :disabled="isPending"
            aria-label="Logout"
            title="Logout"
            class="app-sidebar-logout group"
          >
            <span class="app-sidebar-logout-icon">
              <i class="pi pi-sign-out text-[16px]" />
            </span>

            <span v-if="!collapsed" class="flex-1 text-left">Logout</span>
            <span class="app-sidebar-status-dot h-2 w-2 rounded-full opacity-70" />
          </button>

          <!-- Theme Toggle -->
          <button
            type="button"
            @click="toggleTheme"
            :class="[
              'app-sidebar-theme-button',
              collapsed ? 'h-10 w-full' : 'w-10'
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
const operationsOpen = ref(true)
const patientCareOpen = ref(true)
const billingOpen = ref(true)
const promosOffersOpen = ref(true)

// v-model ready collapsed state
const collapsed = ref<boolean>(props.collapsed ?? true)

// keep sync if parent controls it
watch(
  () => props.collapsed,
  (v) => {
    if (typeof v === "boolean") collapsed.value = v
  }
)

// notify parent when it changes
watch(
  collapsed,
  (v) => emit("update:collapsed", v),
  { immediate: true }
)

// theme
const isDark = ref(false)
const syncIsDark = () => (isDark.value = document.documentElement.classList.contains("dark"))

const toggleTheme = () => {
  const root = document.documentElement
  const nowDark = root.classList.toggle("dark")
  localStorage.setItem("theme", nowDark ? "dark" : "light")
  isDark.value = nowDark
}

onMounted(syncIsDark)

const toStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

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
  "dashboard",
  "general-settings",
  "pt-team-setup",
  "admin-setup",
  "clinics",
  "patients",
  "promos-offers",
  "promos-offers-single-service",
  "promos-offers-package-service",
  "promos-offers-hmo",
  "promos-offers-lgu",
  "appointments",
  "patient-daily-log",
  "billing",
  "reports"
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
  if (!hasPermissionData.value) {
    return false
  }

  return authSession.canAccessRoute(routeName)
}

const userInitials = computed(() => {
  const words = displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!words.length) return "U"

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("")
})

// mobile helpers
const openMobile = () => (mobileOpen.value = true)
const closeMobile = () => (mobileOpen.value = false)
const toggleMobile = () => (mobileOpen.value = !mobileOpen.value)

// collapse
const toggleCollapsed = () => (collapsed.value = !collapsed.value)

defineExpose({
  collapsed, // parent can still read if it wants
  toggleMobile,
  openMobile,
  closeMobile,
  toggleCollapsed,
})

const handleAuthUserUpdated = () => {
  void authSession.refresh().catch(() => authSession.clear())
}

onMounted(() => {
  void authSession.ensureLoaded().catch(() => authSession.clear())
  void globalClinicStore.initializeFromAuthSession().catch(() => globalClinicStore.loadClinics())
  window.addEventListener("auth-user-updated", handleAuthUserUpdated)
})

onUnmounted(() => {
  window.removeEventListener("auth-user-updated", handleAuthUserUpdated)
})

const asideClass = computed(() => [
  "fixed inset-y-0 left-0 z-50",
  "flex flex-col",
  "shadow-sm",
  "transition-[transform,width] duration-300",
  "app-sidebar-shell border-r",
  collapsed.value ? "w-[84px]" : "w-[260px]",
  mobileOpen.value ? "translate-x-0" : "-translate-x-full",
  "md:translate-x-0",
])

const currentRouteName = computed(() => String(route.name ?? ""))

const goToAndClose = async (name: string) => {
  if (currentRouteName.value !== name) await router.push({ name })
  if (mobileOpen.value) mobileOpen.value = false
}

const itemClass = (name: string) => {
  const active = currentRouteName.value === name
  return [
    "app-sidebar-nav-item group",
    active ? "app-sidebar-nav-item-active" : "",
  ].join(" ")
}

const iconWrapClass = (name: string) => {
  const active = currentRouteName.value === name
  return [
    "app-sidebar-icon-wrap",
    active ? "app-sidebar-icon-wrap-active" : "",
  ].join(" ")
}

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
</script>
