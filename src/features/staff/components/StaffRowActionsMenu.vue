<template>
  <div class="flex justify-center">
    <Button
      :disabled="disabled"
      icon="pi pi-ellipsis-v"
      class="p-button-text p-button-secondary"
      @click="toggle"
    />
    <Menu ref="menuRef" :model="items" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import Button from "primevue/button"
import Menu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"

import type { Staff } from "@/features/staff/types/staff"

const props = defineProps<{
  staff: Staff
  disabled?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  (e: "edit", staff: Staff): void
  (e: "toggleStatus", staff: Staff): void
  (e: "hardDelete", staff: Staff): void
}>()

const menuRef = ref<any>(null)

const toggle = (event: Event) => {
  menuRef.value?.toggle(event)
}

const items = computed<MenuItem[]>(() => [
  {
    label: "Edit this record",
    icon: "pi pi-pen-to-square",
    command: () => emit("edit", props.staff),
    visible: props.canUpdate ?? false,
  },
  {
    label: "Toggle Status",
    icon: "pi pi-exclamation-triangle",
    command: () => emit("toggleStatus", props.staff),
    visible: props.canUpdate ?? false,
  },
  {
    label: "Permanently Delete",
    icon: "pi pi-times-circle",
    command: () => emit("hardDelete", props.staff),
    visible: !props.staff.is_active && (props.canDelete ?? false),
  },
])
</script>
