<template class="h-screen w-screen uppercase">
  <RouterView />
  <component :is="VueQueryDevtools" v-if="VueQueryDevtools" />
  <Toast />
  <ConfirmDialog />

</template>

<script lang="ts" setup>
import {defineAsyncComponent} from "vue";

import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";

const VueQueryDevtools = import.meta.env.DEV
  ? defineAsyncComponent(() => import("@tanstack/vue-query-devtools").then((module) => module.VueQueryDevtools))
  : null

</script>
