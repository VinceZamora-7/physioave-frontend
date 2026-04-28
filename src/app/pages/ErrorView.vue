<template>
  <main
    class="relative min-h-screen w-screen overflow-hidden grid place-items-center px-6 py-16 sm:py-24
           bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]"
  >
    <div
      class="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-25
             bg-[#3C88B1]/40"
    />
    <div
      class="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full blur-3xl opacity-20
             bg-[#A91D8B]/35"
    />

    <section
      class="relative w-full max-w-xl rounded-3xl p-7 sm:p-10 text-center
             border border-[rgb(var(--app-border))]
             bg-[rgb(var(--app-card))]/85 dark:bg-[rgb(var(--app-card))]/70
             backdrop-blur-xl
             shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]"
    >
      <div
        class="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl
               bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]"
      />

      <div class="mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold text-white
                  bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]">
        {{ badgeLabel }}
      </div>

      <h1 class="mt-5 text-3xl sm:text-5xl font-bold tracking-tight">
        {{ title }}
      </h1>

      <p class="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        {{ description }}
      </p>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          @click="router.back()"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5
                 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]
                 bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B] hover:opacity-95"
        >
          <i class="pi pi-arrow-left" />
          Go back
        </button>

        <RouterLink
          :to="{ name: 'login' }"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5
                 text-sm font-semibold
                 border border-[rgb(var(--app-border))]
                 bg-[rgb(var(--app-bg))]
                 hover:bg-[rgba(60,136,177,0.10)]
                 text-[rgb(var(--app-fg))] transition"
        >
          <i class="pi pi-home" />
          Return to login
        </RouterLink>
      </div>

      <p class="mt-7 text-xs text-slate-500 dark:text-slate-400">
        If you think this is a mistake, contact your administrator.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const router = useRouter()
const route = useRoute()

const errorCode = computed(() => {
  const raw = route.query.error
  return typeof raw === "string" ? raw : ""
})

const badgeLabel = computed(() => {
  return errorCode.value ? "Authentication Error" : "404 - Not Found"
})

const title = computed(() => {
  if (errorCode.value === "staff_not_found") return "Access not allowed"
  if (errorCode.value === "staff_inactive") return "Account is inactive"
  if (errorCode.value === "oauth_redirect_uri_mismatch") return "Google redirect mismatch"
  if (errorCode.value === "oauth_invalid_client") return "Google client rejected"
  if (errorCode.value === "oauth_invalid_grant") return "Google login expired"
  if (errorCode.value === "oauth_access_denied") return "Google access denied"
  if (errorCode.value === "oauth_unauthorized_client") return "Google client unauthorized"
  if (errorCode.value === "oauth2_failed") return "Google sign-in failed"
  if (errorCode.value === "login_failed") return "Login failed"
  return "Page not found"
})

const description = computed(() => {
  if (errorCode.value === "staff_not_found") return "Your Google account is not registered in this system. Please contact your administrator for access."
  if (errorCode.value === "staff_inactive") return "Your account exists but is currently inactive. Please contact your administrator."
  if (errorCode.value === "oauth_redirect_uri_mismatch") return "The Google OAuth redirect URI does not exactly match the backend callback URL configured for this app."
  if (errorCode.value === "oauth_invalid_client") return "Google rejected the configured OAuth client. Check the client ID and client secret in the backend environment."
  if (errorCode.value === "oauth_invalid_grant") return "The Google sign-in code was rejected or expired. Please try signing in again from the login page."
  if (errorCode.value === "oauth_access_denied") return "Google did not grant access to this app. Please try again and approve the requested profile and email access."
  if (errorCode.value === "oauth_unauthorized_client") return "This Google OAuth client is not authorized for the requested local callback."
  if (errorCode.value === "oauth2_failed") return "Google authentication failed before login could be completed. Please try again."
  if (errorCode.value === "login_failed") return "We could not complete your login request. Please try again or contact your administrator."
  return "Sorry, we couldn't find the page you're looking for. It might have been moved or deleted."
})
</script>
