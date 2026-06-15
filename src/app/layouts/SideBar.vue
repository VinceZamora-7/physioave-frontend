<template>
  <!-- Backdrop (mobile only) -->
  <div
    v-if="mobileOpen"
    class="app-sidebar-backdrop"
    @click="closeMobile"
    aria-hidden="true"
  />

  <aside :class="asideClass" role="navigation" aria-label="Main navigation">

    <!-- ── HEADER / BRAND ──────────────────────────────────── -->
    <div class="px-3 pt-3">
      <div :class="['app-sidebar-brand', collapsed ? 'flex-col items-center' : 'items-center']">
        <div class="app-sidebar-logo">
          <img
            src="@/assets/img/physioave-logo-white.png"
            alt="PhysioAve logo"
            class="h-full w-full object-contain p-1.5"
            loading="eager"
          />
        </div>

        <div v-if="!collapsed" class="min-w-0 flex-1 leading-tight">
          <p class="truncate text-sm font-bold text-brand-navy">PhysioAve</p>
          <p class="mt-0.5 truncate text-xs text-slate-400">Management System</p>
        </div>

        <button
          v-if="!isMobile"
          type="button"
          class="app-sidebar-toggle"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :title="collapsed ? 'Expand' : 'Collapse'"
          @click="toggleCollapsed"
        >
          <i :class="['pi text-[14px]', collapsed ? 'pi-angle-right' : 'pi-angle-left']" />
        </button>
      </div>
    </div>

    <!-- ── NAV ────────────────────────────────────────────── -->
    <nav class="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4 app-scrollbar">

      <!-- PT USER NAV -->
      <div v-if="isPhysicalTherapistUser" class="space-y-1.5">
        <p v-if="!collapsed" class="app-sidebar-section-label app-sidebar-section-label--purple">
          <span class="app-sidebar-section-dot" />
          My Work
        </p>
        <ul class="space-y-1">
          <li v-for="item in ptNavItems" :key="item.name">
            <SidebarNavButton :item="item" :active="currentRouteName === item.name" :collapsed="collapsed" @click="goToAndClose(item.name)" />
          </li>
        </ul>
      </div>

      <!-- ADMIN NAV -->
      <div v-else class="space-y-5">

        <!-- Overview -->
        <div v-if="canAccessRoute('dashboard')">
          <p v-if="!collapsed" class="app-sidebar-section-label app-sidebar-section-label--purple">
            <span class="app-sidebar-section-dot" />
            Overview
          </p>
          <ul class="space-y-1">
            <li>
              <SidebarNavButton
                :item="{ name: 'dashboard', label: 'Dashboard', icon: 'pi-chart-line' }"
                :active="currentRouteName === 'dashboard'"
                :collapsed="collapsed"
                @click="goToAndClose('dashboard')"
              />
            </li>
          </ul>
        </div>

        <!-- Patient Care -->
        <div v-if="patientCareItems.length">
          <button
            v-if="!collapsed"
            type="button"
            class="app-sidebar-section-toggle app-sidebar-section-toggle--purple"
            @click="patientCareOpen = !patientCareOpen"
          >
            <span class="flex items-center gap-2">
              <span class="app-sidebar-section-dot" />
              Patient Care
            </span>
            <i class="pi text-[11px] transition-transform" :class="patientCareOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>
          <ul v-show="collapsed || patientCareOpen" class="space-y-1">
            <li v-for="item in patientCareItems" :key="item.name">
              <SidebarNavButton :item="item" :active="currentRouteName === item.name" :collapsed="collapsed" @click="goToAndClose(item.name)" />
            </li>
          </ul>
        </div>

        <!-- Services & Coverage -->
        <div v-if="servicesItems.length">
          <button
            v-if="!collapsed"
            type="button"
            class="app-sidebar-section-toggle app-sidebar-section-toggle--magenta"
            @click="promosOffersOpen = !promosOffersOpen"
          >
            <span class="flex items-center gap-2">
              <span class="app-sidebar-section-dot app-sidebar-section-dot--magenta" />
              Services &amp; Coverage
            </span>
            <i class="pi text-[11px] transition-transform" :class="promosOffersOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>
          <ul v-show="collapsed || promosOffersOpen" class="space-y-1">
            <li v-for="item in servicesItems" :key="item.name">
              <SidebarNavButton :item="item" :active="currentRouteName === item.name" :collapsed="collapsed" @click="goToAndClose(item.name)" />
            </li>
          </ul>
        </div>

        <!-- Settings -->
        <div v-if="settingsItems.length">
          <button
            v-if="!collapsed"
            type="button"
            class="app-sidebar-section-toggle app-sidebar-section-toggle--navy"
            @click="operationsOpen = !operationsOpen"
          >
            <span class="flex items-center gap-2">
              <span class="app-sidebar-section-dot app-sidebar-section-dot--navy" />
              Settings
            </span>
            <i class="pi text-[11px] transition-transform" :class="operationsOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>
          <ul v-show="collapsed || operationsOpen" class="space-y-1">
            <li v-for="item in settingsItems" :key="item.name">
              <SidebarNavButton :item="item" :active="currentRouteName === item.name" :collapsed="collapsed" @click="goToAndClose(item.name)" />
            </li>
          </ul>
        </div>

      </div>
    </nav>

    <!-- ── FOOTER ──────────────────────────────────────────── -->
    <div class="border-t border-brand-pink/30 px-3 pb-4 pt-3 space-y-2">

      <!-- User Card -->
      <div class="app-sidebar-user-card" :class="collapsed ? 'justify-center' : ''">
        <div
          class="app-sidebar-avatar font-bold shrink-0"
          :class="collapsed ? 'w-9 h-9 text-base' : 'w-9 h-9 text-sm'"
        >
          {{ userInitials }}
        </div>
        <div v-if="!collapsed" class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-brand-navy leading-tight">{{ displayName }}</p>
          <p class="truncate text-xs leading-tight mt-0.5" style="color: var(--color-brand-purple); opacity: 0.6;">{{ displayRole }}</p>
        </div>
      </div>

      <!-- Action row -->
      <div :class="['flex gap-2', collapsed ? 'flex-col' : 'flex-row items-center']">

        <!-- Logout -->
        <button
          type="button"
          @click="onLogout"
          :disabled="isPending"
          aria-label="Logout"
          title="Logout"
          :class="['app-sidebar-action-btn flex-1', collapsed ? 'justify-center' : '']"
        >
          <span class="app-sidebar-action-icon">
            <i class="pi pi-sign-out text-[14px]" />
          </span>
          <span v-if="!collapsed" class="text-sm font-medium">Logout</span>
          <span
            class="ml-auto h-1.5 w-1.5 rounded-full transition-colors"
            :class="isPending ? 'app-sidebar-dot--pending' : 'app-sidebar-dot--idle'"
          />
        </button>

        <!-- Theme toggle -->
        <button
          type="button"
          @click="toggleTheme"
          class="app-sidebar-icon-btn"
          :class="collapsed ? 'w-full' : 'w-9 h-9 shrink-0'"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="isDark ? 'Light mode' : 'Dark mode'"
        >
          <i class="pi text-[14px]" :class="isDark ? 'pi-sun' : 'pi-moon'" />
        </button>

      </div>
    </div>

  </aside>
</template>

<!-- ─────────────────────────────────────────────────────────────────
     Sub-component: SidebarNavButton
──────────────────────────────────────────────────────────────────── -->
<script lang="ts">
import { defineComponent, h } from "vue"

export const SidebarNavButton = defineComponent({
  name: "SidebarNavButton",
  props: {
    item: { type: Object as () => { name: string; label: string; icon: string }, required: true },
    active: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false },
  },
  emits: ["click"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          class: [
            "group w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-150",
            props.active
              ? "app-nav-btn--active"
              : "app-nav-btn--idle",
          ],
          "aria-label": props.item.label,
          title: props.item.label,
          onClick: () => emit("click"),
        },
        [
          h(
            "span",
            {
              class: [
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                props.active ? "app-nav-icon--active" : "app-nav-icon--idle",
              ],
            },
            [h("i", { class: `pi ${props.item.icon} text-[15px]` })]
          ),
          !props.collapsed
            ? h("span", { class: "truncate text-sm" }, props.item.label)
            : null,
        ]
      )
  },
})
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useConfirm } from "primevue/useconfirm"
import { useLogout } from "@/services/logout-tanstack.service"
import { clinicStore } from "@/stores/clinic.store"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { ROUTE_ACCESS_RULES } from "@/shared/permissions"

const props = defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ (e: "update:collapsed", v: boolean): void }>()

const router = useRouter()
const route = useRoute()
const confirm = useConfirm()
const { mutate, isPending } = useLogout()
const globalClinicStore = clinicStore()
const authSession = useAuthSessionStore()
const { currentUser, permissionSet } = storeToRefs(authSession)

const mobileOpen       = ref(false)
const operationsOpen   = ref(false)
const patientCareOpen  = ref(true)
const promosOffersOpen = ref(false)
const collapsed = ref<boolean>(props.collapsed ?? true)
const isMobile  = ref(false)
const isDark    = ref(false)

watch(() => props.collapsed, (v) => { if (typeof v === "boolean") collapsed.value = v })
watch(collapsed, (v) => emit("update:collapsed", v), { immediate: true })

const checkMobile = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => { checkMobile(); window.addEventListener("resize", checkMobile) })
onUnmounted(() => window.removeEventListener("resize", checkMobile))

const syncIsDark = () => { isDark.value = document.documentElement.classList.contains("dark") }
const toggleTheme = () => {
  const nowDark = document.documentElement.classList.toggle("dark")
  localStorage.setItem("theme", nowDark ? "dark" : "light")
  isDark.value = nowDark
}
onMounted(syncIsDark)

const toStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

const displayName = computed(() => {
  const u = currentUser.value
  if (!u) return "Logged In User"
  return toStr(u.name) || toStr(u.email) || "Logged In User"
})

const displayRole = computed(() => {
  const u = currentUser.value
  if (!u) return "User"
  return toStr(u.role_name) || toStr(u.secondary_role_name) || "User"
})

const userInitials = computed(() =>
  displayName.value
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("") || "U"
)

const hasPermissionData = computed(() => permissionSet.value.size > 0)

const ADMIN_NAV_ROUTE_NAMES = [
  "dashboard", "general-settings", "pt-team-setup", "admin-setup",
  "clinics", "patients", "billing", "reports",
  "promos-offers", "promos-offers-single-service",
  "promos-offers-package-service", "promos-offers-hmo", "promos-offers-lgu",
]

const hasAdminNavigationAccess = computed(() =>
  ADMIN_NAV_ROUTE_NAMES.some((r) => {
    const rule = ROUTE_ACCESS_RULES[r]
    return rule ? authSession.canAccessRoute(r) : false
  })
)

const isPhysicalTherapistUser = computed(() => {
  const pt  = toStr(currentUser.value?.appointment_provider_type).toUpperCase()
  const spt = toStr(currentUser.value?.secondary_appointment_provider_type).toUpperCase()
  const role = displayRole.value.toLowerCase()
  const ispt =
    pt === "PHYSICAL_THERAPIST" ||
    spt === "PHYSICAL_THERAPIST" ||
    role.includes("physical therapist")
  return ispt && !hasAdminNavigationAccess.value
})

const canAccessRoute = (name: string): boolean =>
  hasPermissionData.value && authSession.canAccessRoute(name)

const ptNavItems = computed(() =>
  [
    { name: "dashboard",         label: "Dashboard",         icon: "pi-chart-line" },
    { name: "patients",          label: "Patients",          icon: "pi-users" },
    { name: "appointments",      label: "Appointments",      icon: "pi-calendar-plus" },
    { name: "patient-daily-log", label: "Daily Patient Log", icon: "pi-list-check" },
    { name: "billing",           label: "Billing",           icon: "pi-wallet" },
    { name: "reports",           label: "Reports",           icon: "pi-chart-bar" },
  ].filter((i) => canAccessRoute(i.name))
)

const patientCareItems = computed(() =>
  [
    { name: "patients",          label: "Patients",          icon: "pi-users" },
    { name: "appointments",      label: "Appointments",      icon: "pi-calendar-plus" },
    { name: "patient-daily-log", label: "Daily Patient Log", icon: "pi-list-check" },
    { name: "billing",           label: "Billing",           icon: "pi-wallet" },
    { name: "reports",           label: "Reports",           icon: "pi-chart-bar" },
  ].filter((i) => canAccessRoute(i.name))
)

const servicesItems = computed(() =>
  [
    { name: "promos-offers-single-service",  label: "Single Service", icon: "pi-bolt" },
    { name: "promos-offers-package-service", label: "Package Service", icon: "pi-box" },
    { name: "promos-offers-hmo",             label: "HMO",             icon: "pi-briefcase" },
    { name: "promos-offers-lgu",             label: "LGU",             icon: "pi-building-columns" },
  ].filter((i) => canAccessRoute(i.name))
)

const settingsItems = computed(() =>
  [
    { name: "general-settings", label: "General Settings", icon: "pi-cog" },
    { name: "admin-setup",      label: "Admin Setup",      icon: "pi-users" },
    { name: "pt-team-setup",    label: "PT Team Setup",    icon: "pi-sliders-h" },
    { name: "clinics",          label: "Clinics",          icon: "pi-map-marker" },
  ].filter((i) => canAccessRoute(i.name))
)

const asideClass = computed(() => [
  "fixed inset-y-0 left-0 z-50 flex flex-col",
  "app-sidebar-shell",
  "transition-[transform,width] duration-300 ease-in-out",
  collapsed.value ? "w-[72px]" : "w-[248px]",
  mobileOpen.value ? "translate-x-0" : "-translate-x-full",
  "md:translate-x-0",
])

const currentRouteName = computed(() => String(route.name ?? ""))

const goToAndClose = async (name: string) => {
  if (currentRouteName.value !== name) await router.push({ name })
  if (mobileOpen.value) mobileOpen.value = false
}

const closeMobile    = () => { mobileOpen.value = false }
const toggleMobile   = () => { mobileOpen.value = !mobileOpen.value }
const openMobile     = () => { mobileOpen.value = true }
const toggleCollapsed = () => { collapsed.value = !collapsed.value }

defineExpose({ collapsed, toggleMobile, openMobile, closeMobile, toggleCollapsed })

const onLogout = () => {
  if (isPending.value) return
  confirm.require({
    message: "Are you sure you want to logout?",
    header: "Logout Confirmation",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: { label: "Logout", severity: "danger", icon: "pi pi-sign-out" },
    accept: () => {
      if (isPending.value) return
      mutate(undefined, {
        async onSuccess() { await router.push({ name: "login" }) },
      })
    },
  })
}

const handleAuthUserUpdated = () =>
  void authSession.refresh().catch(() => authSession.clear())

onMounted(() => {
  void authSession.ensureLoaded().catch(() => authSession.clear())
  void globalClinicStore.initializeFromAuthSession().catch(() => globalClinicStore.loadClinics())
  window.addEventListener("auth-user-updated", handleAuthUserUpdated)
})
onUnmounted(() => window.removeEventListener("auth-user-updated", handleAuthUserUpdated))
</script>

<style scoped>
/* ─── Tokens (purple palette) ──────────────────────────────────────
   Primary accent : brand-purple  #5E1869
   Secondary      : brand-magenta #A91D8B
   Soft tint      : brand-pink    #DB65C6  (used at low opacity)
   Text/structure : brand-navy    #242757
─────────────────────────────────────────────────────────────────── */

/* ── Shell ──────────────────────────────────────────────────────── */
.app-sidebar-shell {
  background: #ffffff;
  border-right: 1px solid rgba(219, 101, 198, 0.2); /* brand-pink/20 */
  box-shadow: 2px 0 12px rgba(94, 24, 105, 0.06);   /* brand-purple glow */
}

/* ── Scrollbar ──────────────────────────────────────────────────── */
.app-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(219,101,198,0.35) transparent; }
.app-scrollbar::-webkit-scrollbar { width: 4px; }
.app-scrollbar::-webkit-scrollbar-track { background: transparent; }
.app-scrollbar::-webkit-scrollbar-thumb { background: rgba(219,101,198,0.35); border-radius: 4px; }
.app-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-brand-magenta); }

/* ── Backdrop ───────────────────────────────────────────────────── */
.app-sidebar-backdrop {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(36, 39, 87, 0.3); /* navy tint */
  backdrop-filter: blur(2px);
}

/* ── Brand header card ──────────────────────────────────────────── */
.app-sidebar-brand {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(219, 101, 198, 0.25);
  background: linear-gradient(135deg, rgba(219,101,198,0.08) 0%, #ffffff 100%);
}

.app-sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px; min-width: 40px;
  border-radius: 10px;
  background: var(--color-brand-purple);
  box-shadow: 0 2px 6px rgba(94,24,105,0.35);
  overflow: hidden;
}

/* ── Collapse toggle ────────────────────────────────────────────── */
.app-sidebar-toggle {
  display: grid; place-items: center;
  width: 30px; height: 30px; min-width: 30px;
  border-radius: 8px;
  border: 1px solid rgba(219,101,198,0.3);
  background: #fff;
  color: var(--color-brand-purple);
  transition: background 0.15s, color 0.15s;
}
.app-sidebar-toggle:hover {
  background: rgba(219,101,198,0.1);
  color: var(--color-brand-magenta);
}

/* ── Section labels (static) ────────────────────────────────────── */
.app-sidebar-section-label {
  display: flex; align-items: center; gap: 6px;
  padding: 0 8px; margin-bottom: 6px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
}
.app-sidebar-section-label--purple { color: var(--color-brand-purple); }

.app-sidebar-section-dot {
  display: inline-block;
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  background: var(--color-brand-purple);
}
.app-sidebar-section-dot--magenta { background: var(--color-brand-magenta); }
.app-sidebar-section-dot--navy    { background: var(--color-brand-navy); }

/* ── Section toggles (collapsible) ─────────────────────────────── */
.app-sidebar-section-toggle {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 4px 8px; margin-bottom: 6px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  border-radius: 8px; transition: background 0.15s;
}
.app-sidebar-section-toggle--purple {
  color: var(--color-brand-purple);
}
.app-sidebar-section-toggle--purple:hover { background: rgba(94,24,105,0.08); }

.app-sidebar-section-toggle--magenta { color: var(--color-brand-magenta); }
.app-sidebar-section-toggle--magenta:hover { background: rgba(169,29,139,0.08); }

.app-sidebar-section-toggle--navy { color: var(--color-brand-navy); }
.app-sidebar-section-toggle--navy:hover { background: rgba(36,39,87,0.08); }

/* ── Nav buttons ────────────────────────────────────────────────── */
.app-nav-btn--active {
  background: var(--color-brand-purple);
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(94,24,105,0.3);
}
.app-nav-btn--idle {
  color: var(--color-brand-navy);
}
.app-nav-btn--idle:hover {
  background: rgba(94,24,105,0.07);
  color: var(--color-brand-purple);
}

.app-nav-icon--active {
  background: rgba(255,255,255,0.2);
  color: #ffffff;
}
.app-nav-icon--idle {
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  color: var(--color-brand-purple);
}
.app-nav-btn--idle:hover .app-nav-icon--idle {
  background: rgba(94,24,105,0.1);
}

/* ── User card (footer) ─────────────────────────────────────────── */
.app-sidebar-user-card {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(219,101,198,0.25);
  background: linear-gradient(135deg, rgba(219,101,198,0.07) 0%, #ffffff 100%);
}

.app-sidebar-avatar {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--color-brand-purple);
  color: #fff;
  outline: 2px solid rgba(219,101,198,0.35);
  outline-offset: 1px;
  flex-shrink: 0;
}

/* ── Logout button ──────────────────────────────────────────────── */
.app-sidebar-action-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 10px;
  border: 1px solid rgba(219,101,198,0.3);
  background: #fff;
  color: var(--color-brand-navy);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  cursor: pointer;
}
.app-sidebar-action-btn:hover:not(:disabled) {
  background: rgba(169,29,139,0.07);
  border-color: rgba(169,29,139,0.3);
  color: var(--color-brand-magenta);
}
.app-sidebar-action-btn:disabled { opacity: 0.45; pointer-events: none; }

.app-sidebar-action-icon {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(94,24,105,0.08);
  color: var(--color-brand-purple);
  flex-shrink: 0; transition: background 0.15s, color 0.15s;
}
.app-sidebar-action-btn:hover .app-sidebar-action-icon {
  background: rgba(169,29,139,0.12);
  color: var(--color-brand-magenta);
}

/* Status dots */
.app-sidebar-dot--idle    { background: var(--color-brand-purple); opacity: 0.5; }
.app-sidebar-dot--pending { background: var(--color-brand-magenta); opacity: 1; }

/* ── Theme toggle ───────────────────────────────────────────────── */
.app-sidebar-icon-btn {
  display: grid; place-items: center;
  height: 36px; border-radius: 10px;
  border: 1px solid rgba(219,101,198,0.3);
  background: #fff;
  color: var(--color-brand-purple);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  cursor: pointer;
}
.app-sidebar-icon-btn:hover {
  background: rgba(94,24,105,0.08);
  border-color: rgba(94,24,105,0.25);
  color: var(--color-brand-magenta);
}
</style>
