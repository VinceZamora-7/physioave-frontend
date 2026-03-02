<template>
  <main
    class="relative min-h-screen w-screen overflow-hidden
           bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]"
  >
    <!-- Decorative blobs -->
    <div
      class="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-25
             bg-[#3C88B1]/40"
    />
    <div
      class="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full blur-3xl opacity-20
             bg-[#A91D8B]/35"
    />

    <!-- Theme Toggle -->
    <button
      type="button"
      @click="toggleTheme"
      class="fixed top-5 right-5 z-50 inline-flex items-center gap-2 rounded-2xl px-4 py-2
             text-white shadow-lg transition active:scale-[0.99]
             bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]
             hover:opacity-95"
      aria-label="Toggle theme"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <i class="pi" :class="isDark ? 'pi-sun' : 'pi-moon'" />
      <span class="hidden sm:inline text-sm font-semibold">{{ isDark ? "Light" : "Dark" }}</span>
    </button>

    <!-- Wrapper -->
    <div class="min-h-screen grid place-items-center px-4 py-10 sm:px-6">
      <section
        class="w-full max-w-4xl overflow-hidden rounded-3xl
               border border-[rgb(var(--app-border))]
               bg-[rgb(var(--app-card))]/85 dark:bg-[rgb(var(--app-card))]/70
               backdrop-blur-xl
               shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]"
      >
        <div class="grid lg:grid-cols-2">
          <!-- Left Brand Panel -->
          <aside
            class="hidden lg:flex flex-col justify-between p-10
                   bg-gradient-to-br from-[#242757] via-[#5E1869] to-[#A91D8B]
                   text-white"
          >
            <div class="space-y-6">
              <div class="w-full flex items-center gap-4">
                <div class="rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                  <img
                    src="@/assets/img/app-logo.png"
                    alt="PhysioAve logo"
                    class="object-contain "
                  />
                </div>
              </div>

              <p class="text-sm text-white/85 leading-relaxed">
                Manage clinics, staff, patients, and services with a clean workflow and secure access.
              </p>

              <ul class="space-y-3 text-sm text-white/85">
                <li class="flex items-center gap-2">
                  <i class="pi pi-shield" />
                  Google OAuth secure sign-in
                </li>
                <li class="flex items-center gap-2">
                  <i class="pi pi-bolt" />
                  Fast dashboard navigation
                </li>
                <li class="flex items-center gap-2">
                  <i class="pi pi-chart-line" />
                  Built for daily operations
                </li>
              </ul>
            </div>

            <p class="text-xs text-white/70">
              © {{ new Date().getFullYear() }} PhysioAve Physical Therapy
            </p>
          </aside>

          <!-- Right Login Panel -->
          <div class="relative p-7 sm:p-9 lg:p-10">
            <!-- Mobile Accent -->
            <div
              class="lg:hidden absolute inset-x-0 top-0 h-1.5 rounded-t-3xl
                     bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]"
            />

            <!-- Mobile Brand Header -->
            <header class="lg:hidden space-y-4 pt-2">
              <div class="flex items-center gap-3">
                <div
                  class="grid place-items-center h-12 w-12 rounded-2xl text-white shadow-sm
                         bg-gradient-to-br from-[#242757] via-[#5E1869] to-[#A91D8B]"
                >
                  <img
                    src="@/assets/img/app-logo.png"
                    alt="PhysioAve logo"
                    class="h-8 w-8 object-contain"
                  />
                </div>

                <div class="leading-tight">
                  <p class="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                    PHYSIOAVE
                  </p>
                  <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
                    Management System
                  </h2>
                </div>
              </div>
            </header>

            <!-- Copy -->
            <div class="mt-4 lg:mt-0 space-y-2">
              <h3 class="text-xl sm:text-2xl font-bold tracking-tight">Log in</h3>
              <p class="text-sm text-slate-600 dark:text-slate-300">
                Continue with Google to access the system.
              </p>
            </div>

            <!-- CTA -->
            <div class="mt-7">
              <a :href="href" class="block" @click.prevent="onGoogleContinue">
                <button
                  type="button"
                  :disabled="loading"
                  class="group relative h-12 w-full rounded-2xl px-4
                         border border-[rgb(var(--app-border))]
                         bg-[rgb(var(--app-bg))]
                         hover:bg-[rgba(60,136,177,0.10)]
                         active:scale-[0.99] transition
                         shadow-sm hover:shadow-md
                         flex items-center justify-center
                         disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span
                    class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition
                           bg-gradient-to-r from-[#3C88B1]/15 via-[#5E1869]/10 to-[#A91D8B]/15"
                    aria-hidden="true"
                  />

                  <span class="absolute left-4 grid place-items-center">
                    <img
                      v-if="!loading"
                      src="@/assets/img/google-logo.png"
                      loading="lazy"
                      class="w-5"
                      alt="Google logo"
                    />
                    <i
                      v-else
                      class="pi pi-spin pi-spinner text-[18px] text-[#3C88B1]"
                      aria-hidden="true"
                    />
                  </span>

                  <span
                    class="relative text-sm sm:text-base font-semibold tracking-wide
                           text-[rgb(var(--app-fg))]
                           group-hover:text-[#3C88B1] transition"
                  >
                    {{ loading ? "Redirecting…" : "Continue with Google" }}
                  </span>
                </button>
              </a>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-2">
                  <i class="pi pi-shield" />
                  Secure sign-in
                </span>
                <span class="inline-flex items-center gap-2">
                  <i class="pi pi-clock" />
                  ~5 seconds
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-7 pt-6 border-t border-[rgb(var(--app-border))]">
              <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400 text-center">
                By proceeding, you agree to our
                <a
                  href="/privacy-policy/"
                  class="underline underline-offset-4 decoration-slate-300 dark:decoration-slate-600 hover:text-[#3C88B1]"
                >
                  Terms of Use
                </a>
                and confirm you have read our
                <a
                  href="/privacy-policy/"
                  class="underline underline-offset-4 decoration-slate-300 dark:decoration-slate-600 hover:text-[#3C88B1]"
                >
                  Privacy and Cookie Statement
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
import { onMounted, ref } from "vue"
import { pamsBaseURL } from "@/utils/axios-interceptor.ts"

const href: string = `${pamsBaseURL}/oauth2/authorization/google`

const isDark = ref(false)
const loading = ref(false)

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

  requestAnimationFrame(() => {
    window.location.href = href
  })
}

onMounted(() => {
  syncIsDark()
})
</script>
