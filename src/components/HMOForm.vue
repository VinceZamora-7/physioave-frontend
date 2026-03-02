<template>
  <HMOFormFeature
    v-bind="props"
    @on-close="emit('onClose')"
    @on-submit="(event) => emit('onSubmit', event)"
  />
</template>

<script setup lang="ts">
import HMOFormFeature from '@/features/hmos/components/HMOForm.vue'
import type { HMOFormEmits, HMOFormProps } from "@/features/hmos/components/hmo.type"

const props = defineProps<HMOFormProps>()
const emit = defineEmits<HMOFormEmits>()
</script>
