<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Self Pay: Package Service</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Track self pay package billings, manage package offers, and maintain the service catalog for package-based care.
          </p>
        </div>
        <Button
          label="Manage All Self Pay Package Billings"
          icon="pi pi-list"
          :pt="ptPrimaryBtn"
          @click="router.push({ name: 'billing', query: { billing_type: 'SELF_PAY_PACKAGE' } })"
        />
      </div>
    </section>

    <SelfPayPackageRecentTransactionsCard />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">Package Builder</h3>
          <p class="text-sm opacity-70">Manage self pay package offers with bundled services, sessions, evaluations, and package prices.</p>
        </div>
        <Button label="Open Package Builder" icon="pi pi-box" class="mt-auto" :pt="ptPrimaryBtn" @click="showPackages = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">All Available Services</h3>
          <p class="text-sm opacity-70">Browse the package-service catalog for machines, techniques, evaluations, and add-ons.</p>
        </div>
        <Button label="Open Services" icon="pi pi-list" class="mt-auto" :pt="ptPrimaryBtn" @click="showServices = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">Bundled Services</h3>
          <p class="text-sm opacity-70">Create and manage bundled services used as building blocks for self pay packages.</p>
        </div>
        <Button label="Open Bundles" icon="pi pi-objects-column" class="mt-auto" :pt="ptPrimaryBtn" @click="showBundles = true" />
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
import { useRouter } from "vue-router"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import PackageServiceBundleBuilder from "@/features/promos-offers/components/PackageServiceBundleBuilder.vue"
import SelfPayPackageRecentTransactionsCard from "@/features/promos-offers/components/SelfPayPackageRecentTransactionsCard.vue"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

const router = useRouter()
const showPackages = ref(false)
const showServices = ref(false)
const showBundles = ref(false)
</script>
