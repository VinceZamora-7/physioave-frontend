<template class="h-screen w-screen uppercase">
  <div v-if="isSandbox" class="sandbox-badge" aria-label="Sandbox training environment">
    SANDBOX / TRAINING
  </div>
  <RouterView />
  <component :is="VueQueryDevtools" v-if="VueQueryDevtools" />
  <Toast />
  <ConfirmDialog />

</template>

<script lang="ts" setup>
import { defineAsyncComponent, onBeforeUnmount, onMounted } from "vue"

import Toast from "primevue/toast"
import ConfirmDialog from "primevue/confirmdialog"
import { sp501SignaturePad } from "@/utils/sp501-signature-pad.util"

const VueQueryDevtools = import.meta.env.DEV
  ? defineAsyncComponent(() => import("@tanstack/vue-query-devtools").then((module) => module.VueQueryDevtools))
  : null

const isSandbox = String(import.meta.env.VITE_SANDBOX_MODE ?? "").toLowerCase() === "true"

let stopSp501IdlePageKeepalive: (() => void) | null = null

onMounted(() => {
  stopSp501IdlePageKeepalive = sp501SignaturePad.startIdlePageKeepalive()
})

onBeforeUnmount(() => {
  stopSp501IdlePageKeepalive?.()
})
</script>

<style scoped>
.sandbox-badge {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 10000;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 0 0 8px 8px;
  background: #b45309;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  pointer-events: none;
}
</style>
