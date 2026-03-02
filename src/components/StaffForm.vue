<template>
  <StaffFormFeature v-bind="props" @on-submit="emit('onSubmit', $event)" @on-close="emit('onClose')" />
</template>

<script setup lang="ts">
import StaffFormFeature from "@/features/staff/components/StaffForm.vue"
import type { StaffFormEmits, StaffFormProps } from "@/features/staff/types/staff.type"

const props = defineProps<StaffFormProps>()
const emit = defineEmits<StaffFormEmits>()
</script>
