<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Promos And Offers</p>
      <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">Offer Workspaces</h1>
      <p class="max-w-3xl text-sm leading-6 opacity-80">
        Use these workspaces to separate self-pay, package, HMO, and LGU pricing logic instead of forcing them into a single generic catalog.
      </p>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <RouterLink
        v-for="workspace in workspaces"
        :key="workspace.routeName"
        :to="{ name: workspace.routeName }"
        class="app-section-card-comfy block space-y-3 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ workspace.kicker }}</p>
            <h2 class="mt-2 text-xl font-semibold text-[rgb(var(--app-fg))]">{{ workspace.title }}</h2>
          </div>
          <span class="rounded-full bg-[rgba(60,136,177,0.12)] px-3 py-1 text-xs font-semibold text-[rgb(var(--app-fg))]">
            Open
          </span>
        </div>

        <p class="text-sm leading-6 opacity-80">
          {{ workspace.description }}
        </p>
      </RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
const workspaces = [
  {
    routeName: "promos-offers-single-service",
    kicker: "Single Visit",
    title: "Single Pay: Single Service",
    description: "Build bundled self-pay services from individual machines, techniques, evaluations, and add-ons.",
  },
  {
    routeName: "promos-offers-package-service",
    kicker: "Prepaid Care",
    title: "Self-Pay: Package Service",
    description: "Define package templates, included credits, package pricing, and patient balance logic.",
  },
  {
    routeName: "promos-offers-hmo",
    kicker: "Institutional Payer",
    title: "HMO",
    description: "Prepare HMO-specific item rates, covered services, and claim-ready billing previews.",
  },
  {
    routeName: "promos-offers-lgu",
    kicker: "Public Program",
    title: "LGU",
    description: "Manage LGU budgets, rollover, session sequence, and adjustment-charge scenarios.",
  },
]
</script>
