<template>
  <main class="app-page-shell space-y-5">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <h2 class="text-xl font-semibold">LGU Billing & Management</h2>
      <RouterLink
        :to="{ name: 'billing', query: { billing_type: 'LGU_BILLING' } }"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
      >
        <i class="pi pi-list" />
        Manage All LGU Billings
      </RouterLink>
    </div>

    <LguBudgetSummaryCard />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Package Builder</h3>
          <p class="text-xs opacity-70">Manage LGU package offers with session counts, evaluations, and package prices.</p>
        </div>
        <Button label="Open Packages" icon="pi pi-box" class="mt-auto" @click="showPackages = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">All Available Services</h3>
          <p class="text-xs opacity-70">Browse and manage the full service catalog — machines, techniques, evaluations, and add-ons.</p>
        </div>
        <Button label="Open Services" icon="pi pi-list" class="mt-auto" @click="showServices = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Bundled Services</h3>
          <p class="text-xs opacity-70">Create and manage service bundles used as components in LGU package offers.</p>
        </div>
        <Button label="Open Bundles" icon="pi pi-objects-column" class="mt-auto" @click="showBundles = true" />
      </div>
    </div>

    <LguPackagesModal v-model:visible="showPackages" />
    <LguAvailableServicesModal v-model:visible="showServices" />
    <LguBundledServicesModal v-model:visible="showBundles" />
  </main>
</template>

<script setup lang="ts">

import {onMounted, ref} from "vue"
import {RouterLink} from "vue-router"
import Button from "primevue/button"
import LguBudgetSummaryCard from "@/features/lgu-billing/components/LguBudgetSummaryCard.vue"
import LguPackagesModal from "@/features/promos-offers/components/LguPackagesModal.vue"
import LguAvailableServicesModal from "@/features/promos-offers/components/LguAvailableServicesModal.vue"
import LguBundledServicesModal from "@/features/promos-offers/components/LguBundledServicesModal.vue"

const showPackages = ref(false)
const showServices = ref(false)
const showBundles = ref(false)

type NamedRecord = { id?: string | number; name?: string }

const mergeLegacyCatalog = (legacyKey: string, canonicalKey: string): void => {
  try {
    const legacyRaw = localStorage.getItem(legacyKey)
    if (!legacyRaw) return

    const legacyParsed = JSON.parse(legacyRaw) as unknown
    const canonicalParsed = JSON.parse(localStorage.getItem(canonicalKey) || "[]") as unknown

    const legacyItems = Array.isArray(legacyParsed) ? (legacyParsed as NamedRecord[]) : []
    const canonicalItems = Array.isArray(canonicalParsed) ? (canonicalParsed as NamedRecord[]) : []

    if (!legacyItems.length) {
      localStorage.removeItem(legacyKey)
      return
    }

    const usedIds = new Set(canonicalItems.map(item => String(item?.id ?? "").trim()).filter(Boolean))
    const usedNames = new Set(canonicalItems.map(item => String(item?.name ?? "").trim().toLowerCase()).filter(Boolean))

    const merged = [...canonicalItems]
    for (const item of legacyItems) {
      const id = String(item?.id ?? "").trim()
      const name = String(item?.name ?? "").trim().toLowerCase()
      if ((id && usedIds.has(id)) || (name && usedNames.has(name))) continue

      merged.push(item)
      if (id) usedIds.add(id)
      if (name) usedNames.add(name)
    }

    localStorage.setItem(canonicalKey, JSON.stringify(merged))
    localStorage.removeItem(legacyKey)
  } catch {
    // Best-effort migration only.
  }
}

onMounted(() => {
  mergeLegacyCatalog("lguBundledServices", "bundledServices")
  mergeLegacyCatalog("lguPackageServiceOffers", "packageServiceOffers")
})
</script>
