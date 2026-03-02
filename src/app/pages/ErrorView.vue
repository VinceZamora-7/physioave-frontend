<template>
  <main
    class="relative min-h-screen w-screen overflow-hidden grid place-items-center px-6 py-16 sm:py-24
           bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]"
  >
    <!-- decorative blobs (brand) -->
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
      <!-- top accent -->
      <div
        class="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl
               bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]"
      />

      <!-- badge -->
      <div class="mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold text-white
                  bg-gradient-to-r from-[#242757] via-[#5E1869] to-[#A91D8B]">
        404 • Not Found
      </div>

      <h1 class="mt-5 text-3xl sm:text-5xl font-bold tracking-tight">
        Page not found
      </h1>

      <p class="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        Sorry, we couldn’t find the page you’re looking for. It might have been moved or deleted.
      </p>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <!-- back -->
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

        <!-- go home (optional) -->
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
import { useRouter } from "vue-router"

const router = useRouter()
</script>
