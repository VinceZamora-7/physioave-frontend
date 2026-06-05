<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <h4 class="font-medium text-sm">Available Services</h4>

      <div class="overflow-x-auto rounded-lg border border-[rgb(var(--app-border))]">
        <table class="w-full text-sm">
          <thead class="bg-[rgb(var(--app-bg-secondary))] border-b border-[rgb(var(--app-border))]">
            <tr>
              <th class="px-3 py-2 text-left font-semibold">Machine & Modalities</th>
              <th class="px-3 py-2 text-center font-semibold w-24">Price</th>
              <th class="px-3 py-2 text-left font-semibold">Technique</th>
              <th class="px-3 py-2 text-center font-semibold w-24">Price</th>
              <th class="px-3 py-2 text-left font-semibold">Evaluations</th>
              <th class="px-3 py-2 text-center font-semibold w-24">Price</th>
              <th class="px-3 py-2 text-left font-semibold">Add-ons</th>
              <th class="px-3 py-2 text-center font-semibold w-24">Price</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="idx in maxRows"
              :key="idx"
              class="border-b border-[rgb(var(--app-border))] hover:bg-[rgb(var(--app-bg-hover))]"
            >
              <td class="px-3 py-2">
                <div v-if="machines[idx - 1]" class="text-sm">{{ machines[idx - 1].name }}</div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="machines[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(machines[idx - 1].price) }}</span>
                  <Button size="small" text rounded icon="pi pi-plus" class="h-6 w-6" :disabled="disabled" @click="addServiceLine('machine', machines[idx - 1])" />
                </div>
              </td>

              <td class="px-3 py-2">
                <div v-if="techniques[idx - 1]" class="text-sm">{{ techniques[idx - 1].name }}</div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="techniques[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(techniques[idx - 1].price) }}</span>
                  <Button size="small" text rounded icon="pi pi-plus" class="h-6 w-6" :disabled="disabled" @click="addServiceLine('technique', techniques[idx - 1])" />
                </div>
              </td>

              <td class="px-3 py-2">
                <div v-if="evaluations[idx - 1]" class="text-sm">{{ evaluations[idx - 1].name }}</div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="evaluations[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(evaluations[idx - 1].price) }}</span>
                  <Button size="small" text rounded icon="pi pi-plus" class="h-6 w-6" :disabled="disabled" @click="addServiceLine('evaluation', evaluations[idx - 1])" />
                </div>
              </td>

              <td class="px-3 py-2">
                <div v-if="addOns[idx - 1]" class="text-sm">
                  {{ formatAddOnName(addOns[idx - 1]) }}
                </div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="addOns[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(addOns[idx - 1].price) }}</span>
                  <Button size="small" text rounded icon="pi pi-plus" class="h-6 w-6" :disabled="disabled" @click="addServiceLine(addOns[idx - 1].type, addOns[idx - 1])" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modelValue.length > 0" class="space-y-2">
      <h4 class="font-medium text-sm">Selected Items ({{ modelValue.length }})</h4>

      <DataTable :value="modelValue" size="small" dataKey="key" class="rounded-lg border border-[rgb(var(--app-border))]">
        <Column field="name" header="Service" />

        <Column field="type" header="Type" style="width: 120px">
          <template #body="{data}">
            <Tag :value="formatType(data.type)" />
          </template>
        </Column>

        <Column header="Unit Price" style="width: 140px">
          <template #body="{data}">
            <InputNumber
              :model-value="data.price"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="0"
              class="w-full"
              :disabled="disabled"
              @update:model-value="onPriceEdit(data.key, $event)"
            />
          </template>
        </Column>

        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            <InputNumber
              :model-value="data.quantity"
              :min="1"
              :minFractionDigits="0"
              :maxFractionDigits="0"
              class="w-full"
              :disabled="disabled"
              @update:model-value="onQuantityEdit(data.key, $event)"
            />
          </template>
        </Column>

        <Column header="Line Total" style="width: 130px">
          <template #body="{data}">
            {{ asCurrency(toWholePeso(data.price) * toWholeQty(data.quantity)) }}
          </template>
        </Column>

        <Column header="Actions" style="width: 80px">
          <template #body="{data}">
            <Button
              size="small"
              text
              severity="danger"
              icon="pi pi-trash"
              :disabled="disabled"
              @click="removeLine(data.key)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import InputNumber from "primevue/inputnumber"
import Tag from "primevue/tag"

export type BillingLineType =
  | "machine"
  | "technique"
  | "evaluation"
  | "add-on-machine"
  | "add-on-technique"
  | "add-on-home-service"

export interface BillingPickerLookup {
  id: number | string
  name: string
  price: number
  type?: BillingLineType
}

export interface BillingPickedLine {
  key: string
  id: number | string
  type: BillingLineType
  name: string
  price: number
  quantity: number
}

interface Props {
  modelValue: BillingPickedLine[]
  machines: BillingPickerLookup[]
  techniques: BillingPickerLookup[]
  evaluations: BillingPickerLookup[]
  addOnMachines: BillingPickerLookup[]
  addOnTechniques: BillingPickerLookup[]
  addOnHomeServices: BillingPickerLookup[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  "update:modelValue": [value: BillingPickedLine[]]
}>()

const disabled = computed(() => props.disabled)

const toWholePeso = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
}

const toWholeQty = (value: unknown): number => {
  const parsed = Number(value ?? 1)
  return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : 1
}

const createLineKey = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const asCurrency = (value: number): string =>
  toWholePeso(value).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

const formatType = (type: BillingLineType): string => {
  const typeMap: Record<BillingLineType, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-on (Machine)",
    "add-on-technique": "Add-on (Technique)",
    "add-on-home-service": "Add-on (Home Service)"
  }

  return typeMap[type] || type
}

const formatAddOnName = (item: BillingPickerLookup): string => {
  const typeLabel =
    item.type === "add-on-machine"
      ? "Machine"
      : item.type === "add-on-technique"
        ? "Technique"
        : "Home Service"

  return `Add-on: ${item.name} (${typeLabel})`
}

const addOns = computed(() => [
  ...props.addOnMachines.map(item => ({ ...item, type: "add-on-machine" as BillingLineType })),
  ...props.addOnTechniques.map(item => ({ ...item, type: "add-on-technique" as BillingLineType })),
  ...props.addOnHomeServices.map(item => ({ ...item, type: "add-on-home-service" as BillingLineType }))
])

const maxRows = computed(() =>
  Math.max(
    props.machines.length,
    props.techniques.length,
    props.evaluations.length,
    addOns.value.length
  )
)

const getServiceDisplayName = (type: BillingLineType, service: BillingPickerLookup): string =>
  type.startsWith("add-on")
    ? formatAddOnName({ ...service, type })
    : service.name

const addServiceLine = (type: BillingLineType, service: BillingPickerLookup): void => {
  if (props.disabled) return

  const existing = props.modelValue.find(item =>
    item.type === type && String(item.id) === String(service.id)
  )

  if (existing) {
    emit("update:modelValue", props.modelValue.map(item =>
      item.key === existing.key
        ? { ...item, quantity: toWholeQty(item.quantity) + 1 }
        : item
    ))
    return
  }

  emit("update:modelValue", [
    ...props.modelValue,
    {
      key: createLineKey(),
      id: service.id,
      type,
      name: getServiceDisplayName(type, service),
      price: toWholePeso(service.price),
      quantity: 1
    }
  ])
}

const removeLine = (key: string): void => {
  if (props.disabled) return
  emit("update:modelValue", props.modelValue.filter(item => item.key !== key))
}

const onPriceEdit = (key: string, newPrice: unknown): void => {
  if (props.disabled) return

  emit("update:modelValue", props.modelValue.map(item =>
    item.key === key
      ? { ...item, price: toWholePeso(newPrice) }
      : item
  ))
}

const onQuantityEdit = (key: string, newQuantity: unknown): void => {
  if (props.disabled) return

  emit("update:modelValue", props.modelValue.map(item =>
    item.key === key
      ? { ...item, quantity: toWholeQty(newQuantity) }
      : item
  ))
}
</script>
