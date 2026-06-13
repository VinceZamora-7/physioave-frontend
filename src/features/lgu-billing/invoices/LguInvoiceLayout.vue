<template>
  <SponsorInvoiceLayout
    :title="title"
    :subtitle="subtitle"
    :has-error="hasError"
  >
    <template #meta>
      <slot name="meta" />
    </template>

    <template #toolbar>
      <slot name="toolbar" />
    </template>

    <template #error>
      <slot name="error" />
    </template>

    <template #details>
      <slot name="details" />
    </template>

    <slot />

    <template #bottom>
      <slot name="bottom" />
    </template>
  </SponsorInvoiceLayout>
</template>

<script setup lang="ts">
import SponsorInvoiceLayout from "@/features/shared/invoices/SponsorInvoiceLayout.vue"

withDefaults(defineProps<{
  title: string
  subtitle?: string
  hasError?: boolean
}>(), {
  subtitle: "",
  hasError: false
})
</script>
