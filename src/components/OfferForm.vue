<template>
  <OfferFormFeature
    v-bind="props"
    @on-close="emit('onClose')"
    @on-submit="(event) => emit('onSubmit', event)"
  />
</template>

<script setup lang="ts">
import OfferFormFeature from '@/features/offers/components/OfferForm.vue'
import type { OfferFormEmits, OfferFormProps } from "@/features/offers/components/offer.type"
import type { Offer } from "@/features/offers/types/offer"

const props = defineProps<OfferFormProps<Offer>>()
const emit = defineEmits<OfferFormEmits>()
</script>
