<template>
  <span
    v-if="name"
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
    :style="chipStyle"
  >
    {{ name }}
  </span>
  <span v-else class="opacity-70">N/A</span>
</template>

<script setup lang="ts">
import {computed} from "vue";

const props = defineProps<{
  name?: string
  color?: string
}>()

const normalizeColor = (value?: string): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : "#94A3B8"
}

const hexToRgb = (hex: string): {r: number; g: number; b: number} => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16)
})

const chipStyle = computed(() => {
  const color = normalizeColor(props.color)
  const {r, g, b} = hexToRgb(color)
  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b)
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.16)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
    color: luminance > 150 ? "#0F172A" : color
  }
})
</script>
