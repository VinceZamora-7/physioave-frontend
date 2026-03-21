<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy overflow-hidden">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Promos And Offers
          </p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">
            {{ title }}
          </h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            {{ description }}
          </p>
        </div>

        <div
          class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3 text-sm shadow-sm"
        >
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Build Status</p>
          <p class="mt-1 font-medium text-[rgb(var(--app-fg))]">Navigation-ready placeholder</p>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article class="app-section-card-comfy space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing Model</p>
        <h2 class="app-section-title">{{ pricingModel }}</h2>
        <p class="text-sm opacity-80">{{ pricingNote }}</p>
      </article>

      <article class="app-section-card-comfy space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operational Focus</p>
        <h2 class="app-section-title">{{ operationalFocus }}</h2>
        <p class="text-sm opacity-80">{{ operationalNote }}</p>
      </article>

      <article class="app-section-card-comfy space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Next Milestone</p>
        <h2 class="app-section-title">{{ nextMilestone }}</h2>
        <p class="text-sm opacity-80">{{ milestoneNote }}</p>
      </article>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="app-section-title">Planned Scope</h2>
        <span class="rounded-full bg-[rgba(60,136,177,0.12)] px-3 py-1 text-xs font-semibold text-[rgb(var(--app-fg))]">
          Stub Page
        </span>
      </div>

      <ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <li
          v-for="item in checklist"
          :key="item"
          class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3 text-sm"
        >
          {{ item }}
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  pricingModel: string
  pricingNote: string
  operationalFocus: string
  operationalNote: string
  nextMilestone: string
  milestoneNote: string
  checklist: string[]
}>()
</script>
