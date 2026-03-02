<template>
  <RouterView />
  <VueQueryDevtools />
  <Toast />
  <ConfirmDialog />

</template>

<script lang="ts" setup>

import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import { VueQueryDevtools } from "@tanstack/vue-query-devtools";

</script>
