<template>
  <Dialog
    v-model:visible="visible"
    :header="LGU_TABLE_NAMES.bundles"
    modal
    maximizable
    :style="{width: '95vw', maxWidth: '1400px'}"
    :breakpoints="{'960px': '95vw'}"
    @show="onShow"
  >
    <ServiceBundlesManager
      :title="LGU_TABLE_NAMES.bundles"
      description="Create and manage bundled services used in LGU billing packages. Bundles created here are scoped to LGU and are separate from self-pay bundles."
      :can-edit="true"
      allow-item-pricing
      :api-path="LGU_BUNDLES_API_PATH"
      offer-scope="LGU"
      :machine-options="catalog.bundleMachineOptions.value"
      :technique-options="catalog.bundleTechniqueOptions.value"
      :evaluation-options="catalog.bundleEvaluationOptions.value"
      :get-service-name="catalog.getServiceName"
      :get-service-price="catalog.getServicePrice"
      @refreshed="catalog.load()"
    />
  </Dialog>
</template>

<script setup lang="ts">
import {ref} from "vue"
import Dialog from "primevue/dialog"
import ServiceBundlesManager from "@/features/promos-offers/components/ServiceBundlesManager.vue"
import {useLguPromosCatalog} from "@/features/promos-offers/composables/lgu-promos-catalog.composable"
import {LGU_BUNDLES_API_PATH} from "@/features/promos-offers/lgu/lgu-module.config"
import {LGU_TABLE_NAMES} from "@/features/promos-offers/lgu/lgu-module.config"

const visible = defineModel<boolean>("visible", {default: false})

const catalog = useLguPromosCatalog()
const loaded = ref(false)

const onShow = async () => {
  if (!loaded.value) {
    await catalog.load()
    loaded.value = true
  }
}
</script>
