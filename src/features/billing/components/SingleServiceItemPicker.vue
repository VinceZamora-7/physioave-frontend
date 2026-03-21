<template>
  <div class="space-y-4">
    <!-- Available Services Table -->
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
            <tr v-for="idx in maxRows" :key="idx" class="border-b border-[rgb(var(--app-border))] hover:bg-[rgb(var(--app-bg-hover))]">
              <!-- Machines -->
              <td class="px-3 py-2">
                <div v-if="machines[idx - 1]" class="text-sm">{{ machines[idx - 1].name }}</div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="machines[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(machines[idx - 1].price) }}</span>
                  <Button
                    size="small"
                    text
                    rounded
                    icon="pi pi-plus"
                    class="h-6 w-6"
                    @click="addServiceLine('machine', machines[idx - 1])"
                  />
                </div>
              </td>

              <!-- Techniques -->
              <td class="px-3 py-2">
                <div v-if="techniques[idx - 1]" class="text-sm">{{ techniques[idx - 1].name }}</div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="techniques[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(techniques[idx - 1].price) }}</span>
                  <Button
                    size="small"
                    text
                    rounded
                    icon="pi pi-plus"
                    class="h-6 w-6"
                    @click="addServiceLine('technique', techniques[idx - 1])"
                  />
                </div>
              </td>

              <!-- Evaluations -->
              <td class="px-3 py-2">
                <div v-if="evaluations[idx - 1]" class="text-sm">{{ evaluations[idx - 1].name }}</div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="evaluations[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(evaluations[idx - 1].price) }}</span>
                  <Button
                    size="small"
                    text
                    rounded
                    icon="pi pi-plus"
                    class="h-6 w-6"
                    @click="addServiceLine('evaluation', evaluations[idx - 1])"
                  />
                </div>
              </td>

              <!-- Add-ons -->
              <td class="px-3 py-2">
                <div v-if="addOns[idx - 1]" class="text-sm">
                  {{ formatAddOnName(addOns[idx - 1]) }}
                </div>
              </td>
              <td class="px-3 py-2 text-center">
                <div v-if="addOns[idx - 1]" class="flex items-center justify-between gap-2">
                  <span class="text-xs">{{ asCurrency(addOns[idx - 1].price) }}</span>
                  <Button
                    size="small"
                    text
                    rounded
                    icon="pi pi-plus"
                    class="h-6 w-6"
                    @click="addServiceLine(addOns[idx - 1].type, addOns[idx - 1])"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Selected Items with Price Editing -->
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
              v-model="data.price"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              :min="0"
              class="w-full"
              @update:model-value="onPriceEdit(data.key, $event)"
            />
          </template>
        </Column>
        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            <InputNumber
              v-model="data.quantity"
              :min="1"
              class="w-full"
              @update:model-value="onQuantityEdit(data.key, $event)"
            />
          </template>
        </Column>
        <Column header="Line Total" style="width: 130px">
          <template #body="{data}">{{ asCurrency(data.price * data.quantity) }}</template>
        </Column>
        <Column header="Actions" style="width: 80px">
          <template #body="{data}">
            <Button
              size="small"
              text
              severity="danger"
              icon="pi pi-trash"
              @click="removeLine(data.key)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
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
  id: number
  name: string
  price: number
  type?: BillingLineType
}

export interface BillingPickedLine {
  key: string
  id: number
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
}

const props = defineProps<Props>()
const emit = defineEmits<{
  "update:modelValue": [value: BillingPickedLine[]]
}>()

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

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
  const typeLabel = item.type === "add-on-machine"
    ? "Machine"
    : item.type === "add-on-technique"
      ? "Technique"
      : "Home Service"
  return `Add-on: ${item.name} (${typeLabel})`
}

// Combine all add-ons into a single array with type info
const addOns = computed(() => [
  ...props.addOnMachines.map(m => ({...m, type: "add-on-machine" as BillingLineType})),
  ...props.addOnTechniques.map(m => ({...m, type: "add-on-technique" as BillingLineType})),
  ...props.addOnHomeServices.map(m => ({...m, type: "add-on-home-service" as BillingLineType}))
])

const maxRows = computed(() => {
  return Math.max(
    props.machines.length,
    props.techniques.length,
    props.evaluations.length,
    addOns.value.length
  )
})

const addServiceLine = (type: BillingLineType, service: BillingPickerLookup): void => {
  const next: BillingPickedLine[] = [
    ...props.modelValue,
    {
      key: crypto.randomUUID(),
      id: service.id,
      type,
      name: type.startsWith("add-on")
        ? `Add-on: ${service.name}`
        : service.name,
      price: Number(service.price ?? 0),
      quantity: 1
    }
  ]
  emit("update:modelValue", next)
}

const removeLine = (key: string): void => {
  emit("update:modelValue", props.modelValue.filter(item => item.key !== key))
}

const onPriceEdit = (key: string, newPrice: number): void => {
  const updated = props.modelValue.map(item =>
    item.key === key ? {...item, price: newPrice} : item
  )
  emit("update:modelValue", updated)
}

const onQuantityEdit = (key: string, newQuantity: number): void => {
  const updated = props.modelValue.map(item =>
    item.key === key ? {...item, quantity: Math.max(1, newQuantity)} : item
  )
  emit("update:modelValue", updated)
}
</script>
