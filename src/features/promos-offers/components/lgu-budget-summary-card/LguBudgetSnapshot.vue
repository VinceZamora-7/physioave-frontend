<template>
  <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="card in cards"
      :key="card.label"
      :class="['rounded-3xl border p-4 shadow-sm', card.containerClass]"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p :class="['m-0 text-xs font-bold uppercase tracking-widest', card.labelClass]">{{ card.label }}</p>
          <p :class="['m-0 mt-2 text-2xl font-bold', card.valueClass]">{{ asCurrency(card.value) }}</p>
        </div>

        <span :class="['rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-white/10', card.iconClass]">
          <i :class="card.icon" />
        </span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  totalAvailableFund: number
  usedLguFund: number
  pendingUsedLguFund: number
  remainingAvailableFund: number
  asCurrency: (value: number) => string
}>()

const cards = computed(() => [
  {
    label: "Total Available",
    value: props.totalAvailableFund,
    icon: "pi pi-wallet",
    containerClass: "border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-500/10",
    labelClass: "text-sky-700/70 dark:text-sky-200/70",
    valueClass: "text-sky-950 dark:text-sky-100",
    iconClass: "text-sky-700 dark:text-sky-200"
  },
  {
    label: "Used Fund",
    value: props.usedLguFund,
    icon: "pi pi-arrow-up-right",
    containerClass: "border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10",
    labelClass: "text-rose-700/70 dark:text-rose-200/70",
    valueClass: "text-rose-950 dark:text-rose-100",
    iconClass: "text-rose-700 dark:text-rose-200"
  },
  {
    label: "Pending Usage",
    value: props.pendingUsedLguFund,
    icon: "pi pi-clock",
    containerClass: "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
    labelClass: "text-amber-700/70 dark:text-amber-200/70",
    valueClass: "text-amber-950 dark:text-amber-100",
    iconClass: "text-amber-700 dark:text-amber-200"
  },
  {
    label: "Remaining Fund",
    value: props.remainingAvailableFund,
    icon: props.remainingAvailableFund < 0 ? "pi pi-exclamation-triangle" : "pi pi-check-circle",
    containerClass: props.remainingAvailableFund < 0
      ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
      : "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    labelClass: props.remainingAvailableFund < 0
      ? "text-red-700/70 dark:text-red-200/70"
      : "text-emerald-700/70 dark:text-emerald-200/70",
    valueClass: props.remainingAvailableFund < 0
      ? "text-red-950 dark:text-red-100"
      : "text-emerald-950 dark:text-emerald-100",
    iconClass: props.remainingAvailableFund < 0
      ? "text-red-700 dark:text-red-200"
      : "text-emerald-700 dark:text-emerald-200"
  }
])
</script>
