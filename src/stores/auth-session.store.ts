import { computed, ref } from "vue"
import { defineStore } from "pinia"
import {
  authMeService,
  type AppointmentProviderType,
  type AuthMe
} from "@/services/auth-me.service"
import {
  hasAllPermissionsInSet,
  hasAnyPermissionInSet,
  hasSystemAdminPermissions,
  MODULE_ACCESS_RULES,
  ROUTE_ACCESS_RULES,
} from "@/shared/permissions"

const AUTH_USER_STORAGE_KEY = "auth_user"

const normalizeProviderType = (value: unknown): AppointmentProviderType => {
  const normalized = String(value ?? "NONE").trim().toUpperCase()
  return normalized === "DOCTOR_CONSULTANT" ||
    normalized === "PHYSICAL_THERAPIST" ||
    normalized === "PT_ASSISTANT" ||
    normalized === "INTERN"
    ? normalized
    : "NONE"
}

const normalizeAuthSnapshot = (value: unknown): AuthMe | null => {
  if (!value || typeof value !== "object") return null

  const raw = value as Record<string, unknown>
  const id = raw.id === null || raw.id === undefined ? null : Number(raw.id)
  const roleId = Number(raw.role_id)
  const clinicId = raw.clinic_id === null || raw.clinic_id === undefined
    ? null
    : Number(raw.clinic_id)
  const secondaryRoleId = raw.secondary_role_id === null || raw.secondary_role_id === undefined
    ? null
    : Number(raw.secondary_role_id)

  if (id !== null && (!Number.isFinite(id) || id <= 0)) return null
  if (!Number.isFinite(roleId) || roleId <= 0) return null
  if (clinicId !== null && (!Number.isFinite(clinicId) || clinicId <= 0)) return null
  if (secondaryRoleId !== null && (!Number.isFinite(secondaryRoleId) || secondaryRoleId <= 0)) return null

  return {
    id,
    name: String(raw.name ?? "").trim(),
    email: String(raw.email ?? "").trim(),
    role_id: roleId,
    role_name: String(raw.role_name ?? "").trim(),
    appointment_provider_type: normalizeProviderType(raw.appointment_provider_type),
    is_active: Boolean(raw.is_active),
    permissions: Array.isArray(raw.permissions)
      ? raw.permissions.map(permission => String(permission ?? "").trim()).filter(Boolean)
      : [],
    clinic_id: clinicId,
    can_view_all_branches: Boolean(raw.can_view_all_branches),
    secondary_role_id: secondaryRoleId,
    secondary_role_name: String(raw.secondary_role_name ?? "").trim() || null,
    secondary_appointment_provider_type: raw.secondary_appointment_provider_type === null ||
      raw.secondary_appointment_provider_type === undefined
      ? null
      : normalizeProviderType(raw.secondary_appointment_provider_type)
  }
}

const readStoredAuthUser = (): AuthMe | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    return raw ? normalizeAuthSnapshot(JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

const persistAuthUser = (user: AuthMe | null): void => {
  if (!user) {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
}

export const useAuthSessionStore = defineStore("authSession", () => {
  const currentUser = ref<AuthMe | null>(readStoredAuthUser())
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const loadError = ref<unknown>(null)
  let loadPromise: Promise<AuthMe> | null = null

  const permissions = computed(() => currentUser.value?.permissions ?? [])
  const permissionSet = computed(() => new Set(permissions.value))
  const isAuthenticated = computed(() => Boolean(currentUser.value?.id))
  const staffId = computed(() => currentUser.value?.id ?? null)
  const staffName = computed(() => currentUser.value?.name ?? "")
  const roleName = computed(() => currentUser.value?.role_name ?? "")
  const clinicId = computed(() => currentUser.value?.clinic_id ?? null)
  const canViewAllBranches = computed(() => Boolean(currentUser.value?.can_view_all_branches))

  const hasAnyPermission = (...requiredPermissions: string[]): boolean =>
    hasAnyPermissionInSet(permissionSet.value, requiredPermissions)

  const hasAllPermissions = (...requiredPermissions: string[]): boolean =>
    hasAllPermissionsInSet(permissionSet.value, requiredPermissions)

  const canAccessModule = (moduleName: keyof typeof MODULE_ACCESS_RULES): boolean =>
    hasAnyPermissionInSet(permissionSet.value, MODULE_ACCESS_RULES[moduleName])

  const canAccessRoute = (routeName: string): boolean => {
    const rule = ROUTE_ACCESS_RULES[routeName]
    return rule ? hasAnyPermissionInSet(permissionSet.value, rule.anyOf) : true
  }

  const isOwnerEquivalent = computed(() =>
    roleName.value.trim().toLowerCase() === "owner" ||
    hasSystemAdminPermissions(permissionSet.value)
  )

  const setCurrentUser = (user: AuthMe | null): void => {
    currentUser.value = user
    isLoaded.value = true
    persistAuthUser(user)
  }

  const refresh = async (): Promise<AuthMe> => {
    if (loadPromise) return loadPromise

    isLoading.value = true
    loadError.value = null

    loadPromise = authMeService
      .get()
      .then(user => {
        setCurrentUser(user)
        return user
      })
      .catch(error => {
        currentUser.value = null
        isLoaded.value = false
        loadError.value = error
        throw error
      })
      .finally(() => {
        isLoading.value = false
        loadPromise = null
      })

    return loadPromise
  }

  const ensureLoaded = async (): Promise<AuthMe> => {
    if (currentUser.value && isLoaded.value) return currentUser.value
    return refresh()
  }

  const clear = (): void => {
    currentUser.value = null
    isLoaded.value = false
    loadError.value = null
    persistAuthUser(null)
  }

  return {
    currentUser,
    isLoaded,
    isLoading,
    loadError,
    permissions,
    permissionSet,
    isAuthenticated,
    staffId,
    staffName,
    roleName,
    clinicId,
    canViewAllBranches,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    canAccessRoute,
    isOwnerEquivalent,
    ensureLoaded,
    refresh,
    clear
  }
})
