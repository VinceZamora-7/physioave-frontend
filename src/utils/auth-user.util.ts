const STORAGE_CANDIDATE_KEYS = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"] as const
const TOKEN_CANDIDATE_KEYS = ["id_token", "access_token", "token", "auth_token"] as const

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
