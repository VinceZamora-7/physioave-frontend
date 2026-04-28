<template>
  <main
    class="relative min-h-screen w-screen overflow-hidden
           bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]"
  >
    <!-- Decorative blobs -->
    <div
      class="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-30
             bg-[#3C88B1]/50"
    />
    <div
      class="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-25
             bg-[#A91D8B]/45"
    />

    <!-- Theme Toggle -->
    <button
      type="button"
      @click="toggleTheme"
      class="fixed top-5 right-5 z-50 inline-flex items-center gap-2 rounded-2xl px-4 py-2
             text-white shadow-lg transition active:scale-[0.97]
             bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]
             hover:opacity-90 hover:shadow-xl"
      aria-label="Toggle theme"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <i class="pi text-base" :class="isDark ? 'pi-sun' : 'pi-moon'" />
      <span class="hidden sm:inline text-sm font-semibold">{{ isDark ? "Light" : "Dark" }}</span>
    </button>

    <!-- Wrapper -->
    <div class="min-h-screen grid place-items-center px-4 py-10 sm:px-6">
      <section
        class="w-full max-w-4xl overflow-hidden rounded-3xl
               border border-[rgb(var(--app-border))]
               bg-[rgb(var(--app-card))]/90 dark:bg-[rgb(var(--app-card))]/75
               backdrop-blur-xl
               shadow-[0_25px_80px_-20px_rgba(0,0,0,0.4)]"
      >
        <div class="grid lg:grid-cols-2">
          <!-- Left Brand Panel -->
          <aside
            class="hidden lg:flex flex-col justify-between p-10
                   bg-gradient-to-br from-[#242757] via-[#5E1869] to-[#A91D8B]
                   text-white"
          >
            <div class="space-y-8">
              <!-- Logo -->
              <div class="flex items-center gap-4">
                <div
                  class="h-16 w-16 rounded-2xl bg-white/15 border border-white/20
                         grid place-items-center overflow-hidden"
                >
                  <img
                    src="@/assets/img/physioave-white.png"
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
            <div
              class="lg:hidden absolute inset-x-0 top-0 h-1.5 rounded-t-3xl
                     bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]"
            />

            <!-- Mobile Brand Header -->
            <header class="lg:hidden mb-6 pt-2">
              <div class="flex items-center gap-4">
                <div
                  class="grid place-items-center h-14 w-14 rounded-2xl text-white shadow-md
                         bg-gradient-to-br from-[#242757] via-[#5E1869] to-[#A91D8B]
                         overflow-hidden"
                >
                  <img
                    src="@/assets/img/physioave-logo-white.png"
                    alt="PhysioAve logo"
                    class="h-14 w-14 object-contain"
                  />
                </div>
                <div>
                  <p class="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
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
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Sign in with Google to access the system.
              </p>
            </div>

            <!-- Google Sign-In Button -->
            <div class="mt-8">
              <a :href="href" class="block" @click.prevent="onGoogleContinue">
                <button
                  type="button"
                  :disabled="loading"
                  class="group relative h-14 w-full rounded-2xl px-5
                         border border-[rgb(var(--app-border))]
                         bg-[rgb(var(--app-bg))]
                         hover:border-[#3C88B1]/50
                         active:scale-[0.98] transition-all duration-200
                         shadow-sm hover:shadow-lg
                         flex items-center justify-center
                         disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <!-- Hover gradient overlay -->
                  <span
                    class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity
                           bg-gradient-to-r from-[#3C88B1]/10 via-transparent to-[#A91D8B]/10"
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
                      class="pi pi-spin pi-spinner text-lg text-[#3C88B1]"
                      aria-hidden="true"
                    />
                  </span>

                  <span
                    class="relative text-sm sm:text-base font-semibold
                           text-[rgb(var(--app-fg))]
                           group-hover:text-[#3C88B1] transition-colors"
                  >
                    {{ loading ? "Redirecting…" : "Continue with Google" }}
                  </span>
                </button>
              </a>

              <!-- Security badges -->
              <div class="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
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
              <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400 text-center">
                By signing in, you agree to our
                <a
                  href="/privacy-policy/"
                  class="font-medium underline underline-offset-4 decoration-slate-300 dark:decoration-slate-600
                         hover:text-[#3C88B1] hover:decoration-[#3C88B1] transition-colors"
                >
                  Terms of Use
                </a>
                and
                <a
                  href="/privacy-policy/"
                  class="font-medium underline underline-offset-4 decoration-slate-300 dark:decoration-slate-600
                         hover:text-[#3C88B1] hover:decoration-[#3C88B1] transition-colors"
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
import { pamsAPI, pamsBaseURL } from "@/utils/axios-interceptor.ts"

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

  await pamsAPI.get<{ isInitialized: boolean }>("/setup/status").catch(() => {
    // Ignore; router guard handles setup/login routing.
  })
})
</script>
