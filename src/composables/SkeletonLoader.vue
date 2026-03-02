<template>
  <Skeleton v-if="loading" class="mb-2"/>
  <slot v-else/>
</template>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

defineProps<{
  loading: boolean
}>()


</script>
