<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">LGU Billing &amp; Management</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Monitor LGU fund usage, manage program budgets, and review patient credit details across all LGU programs.
          </p>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">{{ LGU_TABLE_NAMES.packages }}</h3>
          <p class="text-sm opacity-70">Manage LGU package offers with session counts, evaluations, and package prices.</p>
        </div>
        <Button :label="`Open ${LGU_TABLE_NAMES.packages}`" icon="pi pi-box" class="mt-auto" :pt="ptPrimaryBtn" @click="showPackages = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">{{ LGU_TABLE_NAMES.services }}</h3>
          <p class="text-sm opacity-70">Browse and manage the full service catalog — machines, techniques, evaluations, and add-ons.</p>
        </div>
        <Button :label="`Open ${LGU_TABLE_NAMES.services}`" icon="pi pi-list" class="mt-auto" :pt="ptPrimaryBtn" @click="showServices = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">{{ LGU_TABLE_NAMES.bundles }}</h3>
          <p class="text-sm opacity-70">Create and manage service bundles used as components in LGU package offers.</p>
        </div>
        <Button :label="`Open ${LGU_TABLE_NAMES.bundles}`" icon="pi pi-objects-column" class="mt-auto" :pt="ptPrimaryBtn" @click="showBundles = true" />
      </div>
    </div>

    <LguPackagesModal v-model:visible="showPackages" />
    <LguAvailableServicesModal v-model:visible="showServices" />
    <LguBundledServicesModal v-model:visible="showBundles" />
  </main>
</template>

<script setup lang="ts">

import { onMounted, ref } from "vue"
import Button from "primevue/button"
import LguPackagesModal from "@/features/promos-offers/components/LguPackagesModal.vue"
import LguAvailableServicesModal from "@/features/promos-offers/components/LguAvailableServicesModal.vue"
import LguBundledServicesModal from "@/features/promos-offers/components/LguBundledServicesModal.vue"
import { LGU_TABLE_NAMES } from "@/features/promos-offers/lgu/lgu-module.config"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

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
