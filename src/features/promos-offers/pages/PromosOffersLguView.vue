<template>
  <main class="app-page-shell space-y-5">
    <LguBudgetSummaryCard />

    <PackageServiceBundleBuilder
      pageTitle="LGU: Package Service Management"
      pageDescription="Uses the same centralized Package Builder as Self Pay: Package Service to avoid data mismatches across billing routes."
      bundledSectionTitle="LGU Bundled Services"
      bundledSectionDescription="Create and manage bundled services using the same logic and saved data as Package Service."
      packageOfferScope="LGU"
    />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LguBudgetSummaryCard from "@/features/promos-offers/components/LguBudgetSummaryCard.vue"
import PackageServiceBundleBuilder from "@/features/promos-offers/components/PackageServiceBundleBuilder.vue"

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
