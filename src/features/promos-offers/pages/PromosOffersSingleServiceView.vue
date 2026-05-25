<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Self Pay: Single Service</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Track single-service billings, manage the service catalog, and maintain bundled service offerings.
          </p>
        </div>
        <Button
          label="Manage All Self Pay Single-Service Billings"
          icon="pi pi-list"
          :pt="ptPrimaryBtn"
          @click="router.push({ name: 'billing', query: { billing_type: 'SELF_PAY_SINGLE' } })"
        />
      </div>
    </section>

    <SelfPaySingleRecentTransactionsCard />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">All Available Services</h3>
          <p class="text-sm opacity-70">Browse the single-service catalog for machines, techniques, evaluations, and add-ons.</p>
        </div>
        <Button label="Open Services" icon="pi pi-list" class="mt-auto" :pt="ptPrimaryBtn" @click="showServices = true" />
      </div>

      <div class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">Bundled Services</h3>
          <p class="text-sm opacity-70">Create and manage bundled services used for self pay single-service offers.</p>
        </div>
        <Button label="Open Bundles" icon="pi pi-objects-column" class="mt-auto" :pt="ptPrimaryBtn" @click="showBundles = true" />
      </div>
    </div>

    <Dialog v-model:visible="showServices" header="All Available Services" modal maximizable :style="{ width: '95vw', maxWidth: '1400px' }" :breakpoints="{ '960px': '95vw' }">
      <SingleServiceBundleBuilder
        v-if="showServices"
        :show-hero="true"
        :show-service-catalog="true"
        :show-bundled-services="false"
        page-title="All Available Services"
        page-description="Browse and manage the single-service catalog used by self pay single-service appointments and billings."
      />
    </Dialog>

    <Dialog v-model:visible="showBundles" header="Bundled Services" modal maximizable :style="{ width: '95vw', maxWidth: '1400px' }" :breakpoints="{ '960px': '95vw' }">
      <SingleServiceBundleBuilder
        v-if="showBundles"
        :show-hero="false"
        :show-service-catalog="false"
        :show-bundled-services="true"
      />
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import SelfPaySingleRecentTransactionsCard from "@/features/promos-offers/components/SelfPaySingleRecentTransactionsCard.vue"
import SingleServiceBundleBuilder from "@/features/promos-offers/components/SingleServiceBundleBuilder.vue"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

const router = useRouter()
const showServices = ref(false)
const showBundles = ref(false)
</script>
