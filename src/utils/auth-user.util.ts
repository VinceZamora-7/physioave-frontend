const STORAGE_CANDIDATE_KEYS = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"] as const
const TOKEN_CANDIDATE_KEYS = ["id_token", "access_token", "token", "auth_token"] as const

export type StoredAuthSnapshot = {
  roleName: string
  permissions: Set<string>
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map(entry => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
}

export const readStoredAuthSnapshot = (): StoredAuthSnapshot => {
  let roleName = ""
  let permissions = new Set<string>()

  for (const key of STORAGE_CANDIDATE_KEYS) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>

      const roleCandidate = parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole
      if (typeof roleCandidate === "string" && roleCandidate.trim()) {
        roleName = roleCandidate.trim()
      }

      const permissionValues = [
        ...normalizeStringArray(parsed.permissions),
        ...normalizeStringArray(parsed.authorities),
      ]

      if (permissionValues.length) {
        permissions = new Set<string>(permissionValues)
      }

      if (roleName || permissions.size) {
        break
      }
    } catch {
      // Ignore malformed storage JSON and continue to the next key.
    }
  }

  return { roleName, permissions }
}

export const hasAnyStoredPermission = (permissionSet: Set<string>, ...required: string[]): boolean =>
  required.some(permission => permissionSet.has(permission))

export const clearAuthUserCache = (): void => {
  for (const key of STORAGE_CANDIDATE_KEYS) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }

  for (const key of TOKEN_CANDIDATE_KEYS) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }

  window.dispatchEvent(new CustomEvent("auth-user-updated"))
}
