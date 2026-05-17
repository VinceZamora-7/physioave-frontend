<template>
  <main class="app-auth-page">
    <!-- Theme Toggle -->
    <button
      type="button"
      @click="toggleTheme"
      class="app-primary-action fixed right-5 top-5 z-50 inline-flex items-center gap-2 py-2 shadow-lg"
      aria-label="Toggle theme"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <i class="pi text-base" :class="isDark ? 'pi-sun' : 'pi-moon'" />
      <span class="hidden sm:inline text-sm font-semibold">{{ isDark ? "Light" : "Dark" }}</span>
    </button>

    <!-- Wrapper -->
    <div class="min-h-screen grid place-items-center px-4 py-10 sm:px-6">
      <section class="app-auth-card">
        <div class="grid lg:grid-cols-2">
          <!-- Left Brand Panel -->
          <aside class="app-auth-brand-panel">
            <div class="space-y-8">
              <!-- Logo -->
              <div class="flex items-center gap-4">
                <div
                  class="app-auth-logo-frame h-16 w-16"
                >
                  <img
                    src="@/assets/img/physioave-logo-white.png"
                    alt="PhysioAve logo"
                    class="h-14 w-14 object-contain"
                  />
                </div>
                <div>
                  <p class="text-xs font-semibold tracking-widest text-white/70 uppercase">
                    PhysioAve
                  </p>
                  <p class="text-lg font-bold tracking-tight">
                    Management System
                  </p>
                </div>
              </div>

              <!-- Description -->
              <p class="text-sm text-white/85 leading-relaxed">
                Manage clinics, staff, patients, and services with a clean workflow and secure access.
              </p>

              <!-- Features -->
              <ul class="space-y-4 text-sm text-white/90">
                <li class="flex items-start gap-3">
                  <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/15">
                    <i class="pi pi-shield text-xs" />
                  </span>
                  <span>Google OAuth secure sign-in</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/15">
                    <i class="pi pi-bolt text-xs" />
                  </span>
                  <span>Fast dashboard navigation</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/15">
                    <i class="pi pi-chart-line text-xs" />
                  </span>
                  <span>Built for daily operations</span>
                </li>
              </ul>
            </div>

            <p class="text-xs text-white/60">
              © {{ new Date().getFullYear() }} PhysioAve Physical Therapy
            </p>
          </aside>

          <!-- Right Login Panel -->
          <div class="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <!-- Mobile Accent Bar -->
            <div class="app-auth-mobile-accent lg:hidden" />

            <!-- Mobile Brand Header -->
            <header class="lg:hidden mb-6 pt-2">
              <div class="flex items-center gap-4">
                <div
                  class="app-auth-mobile-logo h-14 w-14"
                >
                  <img
                    src="@/assets/img/physioave-logo-white.png"
                    alt="PhysioAve logo"
                    class="h-14 w-14 object-contain"
                  />
                </div>
                <div>
                  <p class="app-subtle-text text-xs font-semibold tracking-widest uppercase">
                    PhysioAve
                  </p>
                  <h2 class="text-xl font-bold tracking-tight">
                    Management System
                  </h2>
                </div>
              </div>
            </header>

            <!-- Heading -->
            <div class="space-y-2">
              <h3 class="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h3>
              <p class="app-muted-text text-sm">
                Sign in with Google to access the system.
              </p>
            </div>

            <!-- Google Sign-In Button -->
            <div class="mt-8">
              <a :href="href" class="block " @click.prevent="onGoogleContinue">
                <button
                  type="button"
                  :disabled="loading"
                  class="app-oauth-button group"
                >
                  <!-- Hover gradient overlay -->
                  <span
                    class="app-oauth-button-overlay"
                    aria-hidden="true"
                  />

                  <!-- Google icon / spinner -->
                  <span class="absolute left-5 grid place-items-center">
                    <img
                      v-if="!loading"
                      src="@/assets/img/google-logo.png"
                      loading="lazy"
                      class="w-5 h-5"
                      alt="Google logo"
                    />
                    <i
                      v-else
                      class="pi pi-spin pi-spinner text-lg text-[rgb(var(--app-secondary))]"
                      aria-hidden="true"
                    />
                  </span>

                  <span
                    class="relative text-sm sm:text-base font-semibold
                           text-[rgb(var(--app-fg))]
                           group-hover:text-[rgb(var(--app-secondary))] transition-colors"
                  >
                    {{ loading ? "Redirecting…" : "Continue with Google" }}
                  </span>
                </button>
              </a>

              <!-- Security badges -->
              <div class="app-subtle-text mt-5 flex flex-wrap items-center justify-center gap-4 text-xs">
                <span class="inline-flex items-center gap-1.5">
                  <i class="pi pi-lock text-[10px]" />
                  256-bit encryption
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <i class="pi pi-shield text-[10px]" />
                  Secure OAuth 2.0
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-10 pt-6 border-t border-[rgb(var(--app-border))]">
              <p class="app-subtle-text text-xs leading-relaxed text-center">
                By signing in, you agree to our
                <a
                  href="/privacy-policy/"
                  class="app-link"
                >
                  Terms of Use
                </a>
                and
                <a
                  href="/privacy-policy/"
                  class="app-link"
                >
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { getSetupStatus } from "@/app/setup-status"
import { pamsBaseURL } from "@/utils/axios-interceptor.ts"

const router = useRouter()

const isDark = ref(false)
const loading = ref(false)

const href = computed(() => {
  const redirectOrigin = encodeURIComponent(window.location.origin)

  return `${pamsBaseURL}/oauth2/authorization/google?redirect_origin=${redirectOrigin}`
})

const syncIsDark = () => {
  isDark.value = document.documentElement.classList.contains("dark")
}

const toggleTheme = () => {
  const root = document.documentElement
  const nowDark = root.classList.toggle("dark")

  localStorage.setItem("theme", nowDark ? "dark" : "light")
  isDark.value = nowDark
}

const onGoogleContinue = () => {
  if (loading.value) return

  loading.value = true

  const redirectOrigin = encodeURIComponent(window.location.origin)

  window.location.href =
    `${pamsBaseURL}/oauth2/authorization/google?redirect_origin=${redirectOrigin}`
}

onMounted(async () => {
  syncIsDark()

  const params = new URLSearchParams(window.location.search)
  const onboardingToken = params.get("onboardingToken")

  if (onboardingToken) {
    sessionStorage.setItem("onboardingToken", onboardingToken)
    window.history.replaceState({}, document.title, window.location.pathname)

    await router.replace({ name: "setup" })
    return
  }

  await getSetupStatus().catch(() => {
    // Ignore; router guard handles setup/login routing.
  })
})
</script>
