<template>
  <div class="space-y-3">
    <div class="overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]">
      <canvas
        ref="canvasRef"
        class="block h-52 w-full touch-none bg-[rgb(var(--app-card))]"
        @pointerdown="startStroke"
        @pointermove="drawStroke"
        @pointerup="endStroke"
        @pointerleave="endStroke"
        @pointercancel="endStroke"
      />
    </div>
    <div class="flex items-center justify-between gap-3 text-xs text-[rgb(var(--app-fg))]/65">
      <span>{{ hasSignature ? "Patient signature captured." : "Patient must sign before saving this slip." }}</span>
      <button
        type="button"
        class="rounded-lg border border-[rgb(var(--app-border))] px-3 py-1.5 font-medium text-[rgb(var(--app-fg))] transition hover:bg-[rgb(var(--app-bg))]"
        @click="clearSignature"
      >
        Clear Signature
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";

const props = withDefaults(defineProps<{
  modelValue?: string
  disabled?: boolean
}>(), {
  modelValue: "",
  disabled: false
})

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasDrawnLocally = ref(false)
let lastPoint = {x: 0, y: 0}

const hasSignature = computed(() => Boolean(props.modelValue?.trim()))

const getContext = (): CanvasRenderingContext2D | null => {
  const canvas = canvasRef.value
  return canvas ? canvas.getContext("2d") : null
}

const configureContext = (): void => {
  const context = getContext()
  if (!context) return

  context.lineCap = "round"
  context.lineJoin = "round"
  context.lineWidth = 2.5
  context.strokeStyle = "#111827"
}

const getPointFromEvent = (event: PointerEvent): {x: number; y: number} => {
  const canvas = canvasRef.value
  if (!canvas) return {x: 0, y: 0}

  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

const drawSignatureGuide = (): void => {
  const canvas = canvasRef.value
  const context = getContext()
  if (!canvas || !context) return

  const width = canvas.width / (window.devicePixelRatio || 1)
  const height = canvas.height / (window.devicePixelRatio || 1)
  context.save()
  context.strokeStyle = "rgba(100, 116, 139, 0.4)"
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(18, height - 28)
  context.lineTo(width - 18, height - 28)
  context.stroke()
  context.restore()
  configureContext()
}

const renderSignature = (): void => {
  const canvas = canvasRef.value
  const context = getContext()
  if (!canvas || !context) return

  const dpr = window.devicePixelRatio || 1
  const width = canvas.width / dpr
  const height = canvas.height / dpr
  context.clearRect(0, 0, width, height)
  drawSignatureGuide()

  if (!props.modelValue) return

  const image = new Image()
  image.onload = () => {
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
  }
  image.src = props.modelValue
}

const resizeCanvas = async (): Promise<void> => {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const width = canvas.clientWidth || 520
  const height = canvas.clientHeight || 208
  canvas.width = width * dpr
  canvas.height = height * dpr

  const context = getContext()
  if (!context) return

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(dpr, dpr)
  configureContext()
  renderSignature()
}

const persistSignature = (): void => {
  const canvas = canvasRef.value
  if (!canvas) return
  emit("update:modelValue", canvas.toDataURL("image/png"))
}

const startStroke = (event: PointerEvent): void => {
  if (props.disabled) return
  const canvas = canvasRef.value
  const context = getContext()
  if (!canvas || !context) return

  isDrawing.value = true
  hasDrawnLocally.value = true
  lastPoint = getPointFromEvent(event)
  canvas.setPointerCapture(event.pointerId)
  context.beginPath()
  context.moveTo(lastPoint.x, lastPoint.y)
}

const drawStroke = (event: PointerEvent): void => {
  if (!isDrawing.value || props.disabled) return
  const context = getContext()
  if (!context) return

  const nextPoint = getPointFromEvent(event)
  context.lineTo(nextPoint.x, nextPoint.y)
  context.stroke()
  lastPoint = nextPoint
}

const endStroke = (event: PointerEvent): void => {
  if (!isDrawing.value) return
  const canvas = canvasRef.value
  isDrawing.value = false
  if (canvas?.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }
  persistSignature()
}

const clearSignature = (): void => {
  hasDrawnLocally.value = false
  emit("update:modelValue", "")
  renderSignature()
}

onMounted(() => {
  void resizeCanvas()
  window.addEventListener("resize", resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas)
})

watch(() => props.modelValue, () => {
  if (!isDrawing.value) {
    renderSignature()
  }
})
</script>
