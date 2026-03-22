<template>
  <main class="app-page-shell space-y-5">
    <LguBudgetSummaryCard />

    <PackageServiceBundleBuilder
      pageTitle="LGU: Package Service Management"
      pageDescription="Use the same service inventory flow as Self Pay Package Service. All listed products are considered LGU-covered, and you can create LGU-specific bundles and packages from this screen."
      bundledSectionTitle="LGU Bundled Services"
      bundledSectionDescription="Create and manage bundled services dedicated to LGU billing."
      bundleStorageKey="lguBundledServices"
      packageStorageKey="lguPackageServiceOffers"
    />
  </main>
</template>

<script setup lang="ts">
import LguBudgetSummaryCard from "@/features/promos-offers/components/LguBudgetSummaryCard.vue"
import PackageServiceBundleBuilder from "@/features/promos-offers/components/PackageServiceBundleBuilder.vue"
</script>
