<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">
            LGU Billing &amp; Management
          </div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Monitor LGU fund usage, manage program budgets, and review patient credit details across all LGU programs.
          </p>
        </div>
      </div>
    </section>

    <LguBudgetSummaryCard />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <section class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">
            {{ LGU_TABLE_NAMES.packages }}
          </h3>
          <p class="text-sm opacity-70">
            Manage LGU package offers with session counts, evaluations, and package prices.
          </p>
        </div>

        <Button
          :label="`Open ${LGU_TABLE_NAMES.packages}`"
          icon="pi pi-box"
          class="mt-auto"
          :pt="ptPrimaryBtn"
          @click="activeModal = 'packages'"
        />
      </section>

      <section class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">
            {{ LGU_TABLE_NAMES.services }}
          </h3>
          <p class="text-sm opacity-70">
            Browse and manage the full service catalog: machines, techniques, evaluations, and add-ons.
          </p>
        </div>

        <Button
          :label="`Open ${LGU_TABLE_NAMES.services}`"
          icon="pi pi-list"
          class="mt-auto"
          :pt="ptPrimaryBtn"
          @click="activeModal = 'services'"
        />
      </section>

      <section class="app-section-card-comfy flex flex-col gap-3">
        <div class="space-y-1">
          <h3 class="app-section-title text-base">
            {{ LGU_TABLE_NAMES.bundles }}
          </h3>
          <p class="text-sm opacity-70">
            Create and manage service bundles used as components in LGU package offers.
          </p>
        </div>

        <Button
          :label="`Open ${LGU_TABLE_NAMES.bundles}`"
          icon="pi pi-objects-column"
          class="mt-auto"
          :pt="ptPrimaryBtn"
          @click="activeModal = 'bundles'"
        />
      </section>
    </div>

    <LguPackagesModal
      :visible="activeModal === 'packages'"
      @update:visible="handleModalVisible('packages', $event)"
    />

    <LguAvailableServicesModal
      :visible="activeModal === 'services'"
      @update:visible="handleModalVisible('services', $event)"
    />

    <LguBundledServicesModal
      :visible="activeModal === 'bundles'"
      @update:visible="handleModalVisible('bundles', $event)"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue"
import Button from "primevue/button"
import LguBudgetSummaryCard from "@/features/promos-offers/components/LguBudgetSummaryCard.vue"
import LguPackagesModal from "@/features/promos-offers/components/LguPackagesModal.vue"
import LguAvailableServicesModal from "@/features/promos-offers/components/LguAvailableServicesModal.vue"
import LguBundledServicesModal from "@/features/promos-offers/components/LguBundledServicesModal.vue"
import { LGU_TABLE_NAMES } from "@/features/promos-offers/lgu/lgu-module.config"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

type ActiveLguModal = "packages" | "services" | "bundles" | null

const activeModal = ref<ActiveLguModal>(null)

function handleModalVisible(modal: Exclude<ActiveLguModal, null>, visible: boolean): void {
  if (visible) {
    activeModal.value = modal
    return
  }

  if (activeModal.value === modal) {
    activeModal.value = null
  }
}
</script>
