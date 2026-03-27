<template>
  <!-- Backdrop (mobile only) -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
    @click="closeMobile"
  />

  <aside :class="asideClass">
    <!-- HEADER / BRAND -->
    <div class="px-2 pt-1">
      <div class="flex items-center gap-3">
        <!-- logo -->
        <div
          class="h-10 w-10 shrink-0 grid place-items-center rounded-2xl overflow-hidden
                 border border-[rgb(var(--app-border))]
                 bg-[rgb(var(--app-bg))]"
        >
          <img
            src="@/assets/img/app-logo.png"
            alt="PhysioAve logo"
            class="h-full w-full object-contain p-1.5"
          />
        </div>

        <!-- company -->
        <div v-if="!collapsed" class="min-w-0 leading-tight">
          <p class="truncate text-sm font-semibold text-[rgb(var(--app-fg))]">PhysioAve</p>
          <p class="truncate text-xs text-slate-500 dark:text-slate-400">Management System</p>
        </div>

        <!-- actions (right) -->
        <div class="ml-auto flex items-center gap-2">
          <!-- collapse (desktop) -->
          <button
            type="button"
            class="hidden md:grid h-10 w-10 place-items-center rounded-2xl transition
                   border border-[rgb(var(--app-border))]
                   bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]
                   hover:bg-[rgba(60,136,177,0.12)]"
            :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :title="collapsed ? 'Expand' : 'Collapse'"
            @click="toggleCollapsed"
          >
            <i class="pi text-[16px]" :class="collapsed ? 'pi-angle-right' : 'pi-angle-left'" />
          </button>

          <!-- close (mobile) -->
          <button
            type="button"
            class="md:hidden grid h-10 w-10 place-items-center rounded-2xl transition
                   border border-[rgb(var(--app-border))]
                   bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]
                   hover:bg-[rgba(60,136,177,0.12)]"
            aria-label="Close sidebar"
            @click="closeMobile"
          >
            <i class="pi pi-times text-[16px]" />
          </button>
        </div>
      </div>

      <div class="mt-4 h-px w-full bg-[rgb(var(--app-border))]" />
    </div>

    <!-- NAV (scrolls) -->
    <nav class="mt-4 flex-1 min-h-0 overflow-y-auto px-2 pb-4 app-scrollbar">
      <div class="space-y-6">
        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400"
          >
            <span v-if="!collapsed">OVERVIEW</span>
          </button>

          <ul class="mt-2 space-y-1">
            <li>
              <button
                type="button"
                @click="goToAndClose('dashboard')"
                :class="itemClass('dashboard')"
                aria-label="Dashboard"
                title="Dashboard"
              >
                <span :class="iconWrapClass('dashboard')"><i class="pi pi-chart-line text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Dashboard</span>
              </button>
            </li>
          </ul>
        </div>

        
        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400"
            @click="patientCareOpen = !patientCareOpen"
          >
            <span v-if="!collapsed">PATIENT CARE</span>
            <i class="pi text-[11px]" :class="patientCareOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>

          <ul v-show="patientCareOpen" class="mt-2 space-y-1">

            <li>
              <button
                type="button"
                @click="goToAndClose('patients')"
                :class="itemClass('patients')"
                aria-label="Patient"
                title="Patient"
              >
                <span :class="iconWrapClass('patients')"><i class="pi pi-users text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Patient</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('appointments')"
                :class="itemClass('appointments')"
                aria-label="Appointments"
                title="Appointments"
              >
                <span :class="iconWrapClass('appointments')"><i class="pi pi-calendar text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Appointments</span>
              </button>
            </li>

          </ul>
        </div>



        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400"
            @click="billingOpen = !billingOpen"
          >
            <span v-if="!collapsed">BILLING</span>
            <i class="pi text-[11px]" :class="billingOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>

          <ul v-show="billingOpen" class="mt-2 space-y-1">

            <li>
              <button
                type="button"
                @click="goToAndClose('billing')"
                :class="itemClass('billing')"
                aria-label="Billing"
                title="Billing"
              >
                <span :class="iconWrapClass('billing')"><i class="pi pi-receipt text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Billing</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('reports')"
                :class="itemClass('reports')"
                aria-label="Reports"
                title="Reports"
              >
                <span :class="iconWrapClass('reports')"><i class="pi pi-chart-bar text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Reports</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('hmos')"
                :class="itemClass('hmos')"
                aria-label="HMO"
                title="HMO"
              >
                <span :class="iconWrapClass('hmos')"><i class="pi pi-table text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">HMO</span>
              </button>
            </li>
          </ul>
        </div>



        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400"
            @click="promosOffersOpen = !promosOffersOpen"
          >
            <span v-if="!collapsed">PROMOS AND OFFERS</span>
            <i class="pi text-[11px]" :class="promosOffersOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>

          <ul v-show="promosOffersOpen" class="mt-2 space-y-1">
            <li>
              <button
                type="button"
                @click="goToAndClose('promos-offers-single-service')"
                :class="itemClass('promos-offers-single-service')"
                aria-label="Single Pay: Single Service"
                title="Single Pay: Single Service"
              >
                <span :class="iconWrapClass('promos-offers-single-service')"><i class="pi pi-bolt text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Single Pay: Single Service</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('promos-offers-package-service')"
                :class="itemClass('promos-offers-package-service')"
                aria-label="Self-Pay: Package Service"
                title="Self-Pay: Package Service"
              >
                <span :class="iconWrapClass('promos-offers-package-service')"><i class="pi pi-box text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Self-Pay: Package Service</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('promos-offers-hmo')"
                :class="itemClass('promos-offers-hmo')"
                aria-label="HMO"
                title="HMO"
              >
                <span :class="iconWrapClass('promos-offers-hmo')"><i class="pi pi-briefcase text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">HMO</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('promos-offers-lgu')"
                :class="itemClass('promos-offers-lgu')"
                aria-label="LGU"
                title="LGU"
              >
                <span :class="iconWrapClass('promos-offers-lgu')"><i class="pi pi-building-columns text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">LGU</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400"
            @click="technicalOpen = !technicalOpen"
          >
            <span v-if="!collapsed">TECHNICAL</span>
            <i class="pi text-[11px]" :class="technicalOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>

          <ul v-show="technicalOpen" class="mt-2 space-y-1">
            <li>
              <button
                type="button"
                @click="goToAndClose('machines')"
                :class="itemClass('machines')"
                aria-label="Machine"
                title="Machine"
              >
                <span :class="iconWrapClass('machines')"><i class="pi pi-cog text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Machine</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('techniques')"
                :class="itemClass('techniques')"
                aria-label="Technique"
                title="Technique"
              >
                <span :class="iconWrapClass('techniques')"><i class="pi pi-bars text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Technique</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('evaluations')"
                :class="itemClass('evaluations')"
                aria-label="Evaluation"
                title="Evaluation"
              >
                <span :class="iconWrapClass('evaluations')"><i class="pi pi-book text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Evaluation</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('refresh-tokens')"
                :class="itemClass('refresh-tokens')"
                aria-label="Refresh Tokens"
                title="Refresh Tokens"
              >
                <span :class="iconWrapClass('refresh-tokens')"><i class="pi pi-hourglass text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Refresh Tokens</span>
              </button>
            </li>
          </ul>
        </div>

                        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400"
            @click="operationsOpen = !operationsOpen"
          >
            <span v-if="!collapsed">OPERATIONS</span>
            <i class="pi text-[11px]" :class="operationsOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
          </button>

          <ul v-show="operationsOpen" class="mt-2 space-y-1">
            <li>
              <button
                type="button"
                @click="goToAndClose('settings')"
                :class="itemClass('settings')"
                aria-label="Settings"
                title="Settings"
              >
                <span :class="iconWrapClass('settings')"><i class="pi pi-sliders-h text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Settings</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('clinics')"
                :class="itemClass('clinics')"
                aria-label="Clinic"
                title="Clinic"
              >
                <span :class="iconWrapClass('clinics')"><i class="pi pi-map-marker text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Clinic</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="goToAndClose('staffs')"
                :class="itemClass('staffs')"
                aria-label="Staff"
                title="Staff"
              >
                <span :class="iconWrapClass('staffs')"><i class="pi pi-users text-[16px]" /></span>
                <span v-if="!collapsed" class="truncate">Staff</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- FOOTER (always bottom) -->
    <div class="mt-auto px-2 pb-4 pt-3 border-t border-[rgb(var(--app-border))]">
      <div class="space-y-3">
        <!-- USER -->
        <div
          class="flex items-center gap-3 rounded-2xl px-2 py-2
                 border border-[rgb(var(--app-border))]
                 bg-[rgb(var(--app-bg))]"
        >
          <div
            class="grid h-10 w-10 place-items-center rounded-2xl text-white text-sm font-semibold
                   bg-gradient-to-br from-[#242757] via-[#5E1869] to-[#A91D8B]"
          >
            {{ userInitials }}
          </div>

          <div v-if="!collapsed" class="min-w-0">
            <p class="truncate text-sm font-semibold text-[rgb(var(--app-fg))]">{{ displayName }}</p>
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ displayRole }}</p>
          </div>
        </div>

        <!-- ACTION ROW (stack when collapsed) -->
        <div :class="['flex items-stretch gap-2', collapsed ? 'flex-col' : 'flex-row']">
          <!-- Logout -->
          <button
            type="button"
            @click="onLogout"
            :disabled="isPending"
            aria-label="Logout"
            title="Logout"
            class="group flex flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold
                   border border-[rgb(var(--app-border))]
                   bg-[rgb(var(--app-card))]
                   text-[rgb(var(--app-fg))]
                   hover:bg-[rgb(var(--app-bg))]
                   active:scale-[0.99] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              class="grid h-9 w-9 place-items-center rounded-2xl transition
                     bg-[rgb(var(--app-bg))]
                     text-[rgb(var(--app-fg))]
                     group-hover:bg-white/60 dark:group-hover:bg-white/10"
            >
              <i class="pi pi-sign-out text-[16px]" />
            </span>

            <span v-if="!collapsed" class="flex-1 text-left">Logout</span>
            <span class="h-2 w-2 rounded-full bg-[rgb(var(--app-accent))] opacity-70" />
          </button>

          <!-- Theme toggle -->
          <button
            type="button"
            @click="toggleTheme"
            :class="[
              'grid place-items-center rounded-2xl text-white shadow-sm transition active:scale-[0.99] hover:opacity-95',
              'bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]',
              collapsed ? 'w-full h-10' : 'w-10'
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
import { useConfirm } from "primevue"
import { authMeService } from "@/services/auth-me.service"
import { useLogout } from "@/services/logout-tanstack.service"

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

const mobileOpen = ref(false)
const userSnapshot = ref<Record<string, unknown> | null>(null)
const operationsOpen = ref(true)
const patientCareOpen = ref(true)
const billingOpen = ref(true)
const promosOffersOpen = ref(true)
const technicalOpen = ref(true)

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

const extractUserFromStorage = (): Record<string, unknown> | null => {
  const candidateKeys = [
    "auth_user",
    "currentUser",
    "user",
    "profile",
    "loggedInUser",
    "google_user",
  ]

  const parseEntry = (raw: string | null): Record<string, unknown> | null => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }

  const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    const segments = token.split(".")
    if (segments.length < 2) return null

    try {
      const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/")
      const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
      const json = atob(normalized)
      const payload = JSON.parse(json) as unknown
      return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null
    } catch {
      return null
    }
  }

  for (const key of candidateKeys) {
    const localValue = parseEntry(localStorage.getItem(key))
    if (localValue) return localValue

    const sessionValue = parseEntry(sessionStorage.getItem(key))
    if (sessionValue) return sessionValue
  }

  const tokenKeys = ["id_token", "access_token", "token", "auth_token"]
  for (const key of tokenKeys) {
    const localToken = localStorage.getItem(key)
    if (localToken) {
      const payload = decodeJwtPayload(localToken)
      if (payload) return payload
    }

    const sessionToken = sessionStorage.getItem(key)
    if (sessionToken) {
      const payload = decodeJwtPayload(sessionToken)
      if (payload) return payload
    }
  }

  return null
}

const syncUserSnapshot = () => {
  userSnapshot.value = extractUserFromStorage()
}

const fetchCurrentUser = async () => {
  try {
    const me = await authMeService.get()
    if (me) {
      userSnapshot.value = me as unknown as Record<string, unknown>
      localStorage.setItem("auth_user", JSON.stringify(me))
      return
    }
  } catch {
    // Ignore request errors and fallback to local/session storage.
  }

  syncUserSnapshot()
}

const toStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

const displayName = computed(() => {
  const user = userSnapshot.value
  if (!user) return "Logged In User"

  const fromName = toStringValue(user.name)
  if (fromName) return fromName

  const fromFullName = toStringValue(user.fullName)
  if (fromFullName) return fromFullName

  const fromDisplayName = toStringValue(user.displayName)
  if (fromDisplayName) return fromDisplayName

  const fromGivenAndFamilyName = `${toStringValue(user.given_name)} ${toStringValue(user.family_name)}`.trim()
  if (fromGivenAndFamilyName) return fromGivenAndFamilyName

  const firstName = toStringValue(user.firstName)
  const lastName = toStringValue(user.lastName)
  const joined = `${firstName} ${lastName}`.trim()
  if (joined) return joined

  const fromUsername = toStringValue(user.username)
  if (fromUsername) return fromUsername

  const fromEmail = toStringValue(user.email)
  if (fromEmail) return fromEmail

  const fromEmailClaim = toStringValue(user.email_address)
  if (fromEmailClaim) return fromEmailClaim

  return "Logged In User"
})

const displayRole = computed(() => {
  const user = userSnapshot.value
  if (!user) return "User"

  const roleFields = [user.role, user.role_name, user.userRole, user.primaryRole]
  for (const roleField of roleFields) {
    const roleValue = toStringValue(roleField)
    if (roleValue) return roleValue
  }

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0]
    if (typeof firstRole === "string" && firstRole.trim()) return firstRole.trim()
    if (firstRole && typeof firstRole === "object") {
      const roleObj = firstRole as Record<string, unknown>
      const roleName = toStringValue(roleObj.name) || toStringValue(roleObj.role)
      if (roleName) return roleName
    }
  }

  if (Array.isArray(user.authorities) && user.authorities.length > 0) {
    const firstAuthority = user.authorities[0]
    if (typeof firstAuthority === "string" && firstAuthority.trim()) return firstAuthority.trim()
  }

  return "User"
})

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

onMounted(() => {
  void fetchCurrentUser()
  window.addEventListener("storage", syncUserSnapshot)
})

onUnmounted(() => {
  window.removeEventListener("storage", syncUserSnapshot)
})

const asideClass = computed(() => [
  "fixed inset-y-0 left-0 z-50",
  "flex flex-col",
  "shadow-sm",
  "transition-[transform,width] duration-300",
  "border-r border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]",
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
    "group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-sm font-medium transition",
    "focus:outline-none focus:ring-4 focus:ring-[rgba(60,136,177,0.18)]",
    active
      ? "bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] border border-[rgb(var(--app-border))]"
      : "text-[rgb(var(--app-fg))] hover:bg-[rgba(60,136,177,0.10)]",
  ].join(" ")
}

const iconWrapClass = (name: string) => {
  const active = currentRouteName.value === name
  return [
    "grid h-10 w-10 place-items-center rounded-2xl transition shrink-0",
    active
      ? "bg-[rgba(60,136,177,0.14)] text-[rgb(var(--app-fg))]"
      : "bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] group-hover:bg-white/60 dark:group-hover:bg-white/10",
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
