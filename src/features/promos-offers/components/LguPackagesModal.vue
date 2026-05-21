<template>
  <Dialog
    v-model:visible="visible"
    header="LGU Package Builder"
    modal
    maximizable
    :style="{width: '95vw', maxWidth: '1400px'}"
    :breakpoints="{'960px': '95vw'}"
    @show="onShow"
  >
    <PackageOffersManager
      title="LGU Package Builder"
      description="Manage package offers for LGU billing. Packages are scoped to LGU and will appear in LGU billing selections."
      :can-edit="true"
      offer-scope="LGU"
      :machine-options="catalog.bundleMachineOptions.value"
      :technique-options="catalog.bundleTechniqueOptions.value"
      :evaluation-options="catalog.bundleEvaluationOptions.value"
      :get-service-name="catalog.getServiceName"
      :get-service-price="catalog.getServicePrice"
    />
  </Dialog>
</template>

<script setup lang="ts">
import {ref, watch} from "vue"
import Dialog from "primevue/dialog"
import PackageOffersManager from "@/features/promos-offers/components/PackageOffersManager.vue"
import {useLguPromosCatalog} from "@/features/promos-offers/composables/lgu-promos-catalog.composable"

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
