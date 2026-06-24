<template class="h-screen w-screen uppercase">
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

let stopSp501IdlePageKeepalive: (() => void) | null = null

onMounted(() => {
  stopSp501IdlePageKeepalive = sp501SignaturePad.startIdlePageKeepalive()
})

onBeforeUnmount(() => {
  stopSp501IdlePageKeepalive?.()
})
</script>
