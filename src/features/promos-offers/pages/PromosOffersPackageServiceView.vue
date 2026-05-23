<template>
  <main class="app-page-shell space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 class="text-xl font-semibold">Self Pay: Package Service</h2>
      <RouterLink
        :to="{ name: 'billing', query: { billing_type: 'SELF_PAY_PACKAGE' } }"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
      >
        <i class="pi pi-list" />
        Manage All Self Pay Package Billings
      </RouterLink>
    </div>

    <SelfPayPackageRecentTransactionsCard />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Package Builder</h3>
          <p class="text-xs opacity-70">Manage self pay package offers with bundled services, sessions, evaluations, and package prices.</p>
        </div>
        <Button label="Open Package Builder" icon="pi pi-box" class="mt-auto" @click="showPackages = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">All Available Services</h3>
          <p class="text-xs opacity-70">Browse the package-service catalog for machines, techniques, evaluations, and add-ons.</p>
        </div>
        <Button label="Open Services" icon="pi pi-list" class="mt-auto" @click="showServices = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Bundled Services</h3>
          <p class="text-xs opacity-70">Create and manage bundled services used as building blocks for self pay packages.</p>
        </div>
        <Button label="Open Bundles" icon="pi pi-objects-column" class="mt-auto" @click="showBundles = true" />
      </div>
    </div>

    <Dialog v-model:visible="showPackages" header="Self Pay Package Builder" modal maximizable :style="{ width: '95vw', maxWidth: '1400px' }" :breakpoints="{ '960px': '95vw' }">
      <PackageServiceBundleBuilder
        v-if="showPackages"
        :show-hero="false"
        :show-package-builder="true"
        :show-service-catalog="false"
        :show-bundled-services="false"
        page-title="Self Pay Package Builder"
        page-description="Manage self pay package offers with sessions, evaluations, regular totals, and package prices."
      />
    </Dialog>

    <Dialog v-model:visible="showServices" header="All Available Services" modal maximizable :style="{ width: '95vw', maxWidth: '1400px' }" :breakpoints="{ '960px': '95vw' }">
      <PackageServiceBundleBuilder
        v-if="showServices"
        :show-hero="true"
        :show-package-builder="false"
        :show-service-catalog="true"
        :show-bundled-services="false"
        page-title="All Available Services"
        page-description="Browse and manage the package-service catalog used by self pay package offers."
      />
    </Dialog>

    <Dialog v-model:visible="showBundles" header="Bundled Services" modal maximizable :style="{ width: '95vw', maxWidth: '1400px' }" :breakpoints="{ '960px': '95vw' }">
      <PackageServiceBundleBuilder
        v-if="showBundles"
        :show-hero="false"
        :show-package-builder="false"
        :show-service-catalog="false"
        :show-bundled-services="true"
        bundled-section-title="Bundled Services"
        bundled-section-description="Create and manage service bundles used in self pay package offers."
      />
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { RouterLink } from "vue-router"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import PackageServiceBundleBuilder from "@/features/promos-offers/components/PackageServiceBundleBuilder.vue"
import SelfPayPackageRecentTransactionsCard from "@/features/promos-offers/components/SelfPayPackageRecentTransactionsCard.vue"

const showPackages = ref(false)
const showServices = ref(false)
const showBundles = ref(false)
</script>
