<template>
  <LguInvoiceLayout
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
  </LguInvoiceLayout>
</template>

<script setup lang="ts">
import LguInvoiceLayout from "@/features/lgu-billing/invoices/LguInvoiceLayout.vue"

withDefaults(defineProps<{
  title: string
  subtitle?: string
  hasError?: boolean
}>(), {
  subtitle: "",
  hasError: false
})
</script>
