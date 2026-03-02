<template>
  <div class="flex justify-center">
    <Button
      :disabled="disabled"
      icon="pi pi-ellipsis-v"
      class="p-button-text p-button-secondary"
      @click="toggle"
    />

    <TieredMenu ref="menuRef" :model="items" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import Button from "primevue/button"
import TieredMenu from "primevue/tieredmenu"
import type { MenuItem } from "primevue/menuitem"

defineProps<{
  items: MenuItem[]
  disabled?: boolean
}>()

const menuRef = ref<any>(null)

const toggle = (event: Event) => {
  menuRef.value?.toggle(event)
}
</script>
