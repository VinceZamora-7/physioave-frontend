<!-- src/features/clinics/components/ClinicRowActionsMenu.vue -->
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
import type { Clinic } from "@/features/clinics/types/clinic"

const props = defineProps<{
  clinic: Clinic
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: "edit", clinic: Clinic): void
  (e: "toggleStatus", clinic: Clinic): void
  (e: "managePatients", clinic: Clinic): void
  (e: "manageStaffs", clinic: Clinic): void
}>()

const menuRef = ref<any>(null)

const toggle = (event: Event) => {
  menuRef.value?.toggle(event)
}

const items = computed<MenuItem[]>(() => [
  { label: "Edit this record", icon: "pi pi-pen-to-square", command: () => emit("edit", props.clinic) },
  { label: "Toggle Status", icon: "pi pi-exclamation-triangle", command: () => emit("toggleStatus", props.clinic) },
  { label: "Manage Patients", icon: "pi pi-users", command: () => emit("managePatients", props.clinic) },
  { label: "Manage Staffs", icon: "pi pi-users", command: () => emit("manageStaffs", props.clinic) },
])
</script>
