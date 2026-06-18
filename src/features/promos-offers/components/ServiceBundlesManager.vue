<template>
  <section class="app-section-card-comfy space-y-3">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">{{ title }}</h3>
        <p class="text-xs opacity-70">{{ description }}</p>
      </div>
      <Button
        v-if="canEdit"
        label="Add New Bundle"
        icon="pi pi-plus"
        @click="openAddBundleDialog"
      />
    </div>

    <DataTable
      :value="activeBundles"
      dataKey="id"
      paginator
      :rows="25"
      :loading="isLoading"
      class="rounded-lg border border-[rgb(var(--app-border))]"
    >
      <template #empty>
        <p class="m-0 text-sm opacity-70">No bundles found.</p>
      </template>

      <Column field="name" header="Bundle Name" />

      <Column header="Machines">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag v-for="id in data.machineIds" :key="id" :value="getBundleServiceTagValue(id, data.itemPrices)" severity="info" class="text-xs" />
            <span v-if="!data.machineIds.length" class="text-xs opacity-40">—</span>
          </div>
        </template>
      </Column>

      <Column header="Techniques">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag v-for="id in data.techniqueIds" :key="id" :value="getBundleServiceTagValue(id, data.itemPrices)" severity="success" class="text-xs" />
            <span v-if="!data.techniqueIds.length" class="text-xs opacity-40">—</span>
          </div>
        </template>
      </Column>

      <Column header="Evaluations">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag v-for="id in data.evaluationIds" :key="id" :value="getBundleServiceTagValue(id, data.itemPrices)" severity="warning" class="text-xs" />
            <span v-if="!data.evaluationIds.length" class="text-xs opacity-40">—</span>
          </div>
        </template>
      </Column>

      <Column header="Original Price" style="width: 140px">
        <template #body="{ data }">
          <span class="line-through opacity-50 text-xs">{{ asCurrency(calcOriginalPrice(data)) }}</span>
        </template>
      </Column>

      <Column field="bundledPrice" header="Bundled Price" style="width: 140px">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">{{ asCurrency(data.bundledPrice) }}</span>
        </template>
      </Column>

      <Column field="status" header="Status" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
        </template>
      </Column>

      <Column header="Actions" style="width: 100px">
        <template #body="{ data }">
          <div v-if="canEdit" class="flex gap-1">
            <Button size="small" text icon="pi pi-pencil" @click="openEditBundleDialog(data)" v-tooltip="'Edit'" />
            <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeactivateBundle(data)" v-tooltip="'Delete'" />
          </div>
          <span v-else class="text-xs opacity-50">Read-only</span>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="bundleDialogVisible"
      :header="editingBundleId ? 'Edit Bundle' : 'Add New Bundle'"
      modal
      :style="{width: hasItemPricing ? '760px' : '560px'}"
      :breakpoints="{'820px': '95vw'}"
    >
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="bundleForm.name" fluid />
          <label>Bundle Name</label>
        </IftaLabel>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IftaLabel>
            <MultiSelect
              v-model="bundleForm.machineIds"
              :options="machineOptions"
              optionLabel="name"
              optionValue="id"
              filter
              display="chip"
              fluid
              placeholder="Select machines"
            />
            <label>Machines</label>
          </IftaLabel>

          <IftaLabel>
            <MultiSelect
              v-model="bundleForm.techniqueIds"
              :options="techniqueOptions"
              optionLabel="name"
              optionValue="id"
              filter
              display="chip"
              fluid
              placeholder="Select techniques"
            />
            <label>Techniques</label>
          </IftaLabel>

          <IftaLabel>
            <MultiSelect
              v-model="bundleForm.evaluationIds"
              :options="evaluationOptions"
              optionLabel="name"
              optionValue="id"
              filter
              display="chip"
              fluid
              placeholder="Select evaluations"
            />
            <label>Evaluations</label>
          </IftaLabel>

          <IftaLabel>
            <InputNumber
              :model-value="bundleForm.bundledPrice"
              :min="0"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              fluid
              @update:model-value="handleBundlePriceChange"
            />
            <label>Bundled Price</label>
          </IftaLabel>
        </div>

        <div v-if="hasItemPricing && selectedBundleItems.length" class="space-y-2">
          <div class="text-sm font-semibold">Line Item Pricing</div>
          <DataTable
            :value="selectedBundleItems"
            dataKey="id"
            size="small"
            class="rounded-lg border border-[rgb(var(--app-border))]"
          >
            <Column field="name" header="Service" />
            <Column header="Standard Price" style="width: 140px">
              <template #body="{data}">
                <span class="text-xs opacity-70">{{ asCurrency(data.standardPrice) }}</span>
              </template>
            </Column>
            <Column header="Bundle Item Price" style="width: 180px">
              <template #body="{data}">
                <InputNumber
                  :model-value="getBundleItemFormPrice(data.id)"
                  mode="currency"
                  currency="PHP"
                  locale="en-PH"
                  fluid
                  :min="0"
                  @update:model-value="value => setBundleItemFormPrice(data.id, value)"
                />
              </template>
            </Column>
            <Column header="" style="width: 90px">
              <template #body="{data}">
                <Button label="Free" size="small" text @click="setBundleItemFree(data.id)" />
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" text @click="bundleDialogVisible = false" />
          <Button label="Save Bundle" icon="pi pi-check" @click="saveBundle" />
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import MultiSelect from "primevue/multiselect"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast } from "@/utils/toast.util"
import type { Pageable } from "@/models/paging"

type BundleDTO = {
  id: number
  name: string
  bundled_price: number
  is_active: boolean
  machine_ids?: number[]
  technique_ids?: number[]
  evaluation_ids?: number[]
  item_prices?: BundleItemPriceDTO[]
}

type BundleItemType =
  | "MACHINE"
  | "TECHNIQUE"
  | "EVALUATION"
  | "ADD_ON_MACHINE"
  | "ADD_ON_TECHNIQUE"
  | "ADD_ON_HOME_SERVICE"

type BundleItemPriceDTO = {
  item_type: BundleItemType
  id: number
  price: number | null
}

export type BundledService = {
  id: number
  name: string
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  itemPrices: Record<string, number>
  bundledPrice: number
  status: "Active" | "Inactive"
}

type OptionRow = { id: string; name: string }

type BundleItemEditorRow = {
  id: string
  numericId: number
  itemType: BundleItemType
  name: string
  standardPrice: number
}

const props = defineProps<{
  title: string
  description: string
  canEdit: boolean
  allowItemPricing?: boolean
  apiPath?: string
  machineOptions: OptionRow[]
  techniqueOptions: OptionRow[]
  evaluationOptions: OptionRow[]
  getServiceName: (id: string) => string
  getServicePrice: (id: string) => number
}>()

const emit = defineEmits<{
  refreshed: []
}>()

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const allBundles = ref<BundledService[]>([])
const activeBundles = computed(() => allBundles.value.filter(b => b.status !== "Inactive"))
const bundleApiPath = computed(() => `/${String(props.apiPath ?? "service-bundles").replace(/^\/+|\/+$/g, "")}`)
const hasItemPricing = computed(() => Boolean(props.allowItemPricing))

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const getApiErrorMessage = (error: unknown): string => {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response
  return typeof response?.data?.message === "string" ? response.data.message : ""
}

const calcOriginalPrice = (bundle: BundledService): number => {
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds]
  return ids.reduce((sum, id) => sum + Number(props.getServicePrice(id) ?? 0), 0)
}

const serviceKeyFromItemPrice = (item: BundleItemPriceDTO): string => {
  if (item.item_type === "MACHINE") return `machine-${item.id}`
  if (item.item_type === "TECHNIQUE") return `technique-${item.id}`
  if (item.item_type === "EVALUATION") return `evaluation-${item.id}`
  if (item.item_type === "ADD_ON_MACHINE") return `add-on-machine-${item.id}`
  if (item.item_type === "ADD_ON_TECHNIQUE") return `add-on-technique-${item.id}`
  return `add-on-home-service-${item.id}`
}

const buildItemPriceMap = (items: BundleItemPriceDTO[] | undefined): Record<string, number> => {
  const map: Record<string, number> = {}
  for (const item of items ?? []) {
    if (item.price == null) continue
    map[serviceKeyFromItemPrice(item)] = Number(item.price)
  }
  return map
}

const getBundleServiceTagValue = (id: string, itemPrices: Record<string, number>): string => {
  const name = props.getServiceName(id)
  if (!hasItemPricing.value) return name
  const price = Number(itemPrices[id] ?? props.getServicePrice(id) ?? 0)
  return `${name} - ${price === 0 ? "Free" : asCurrency(price)}`
}

const loadBundles = async (): Promise<void> => {
  isLoading.value = true
  try {
    const { data } = await pamsAPI.get<Pageable<BundleDTO>>(bundleApiPath.value, {
      params: {
        page: 1, size: 1000, name: "", status: "ALL",
      }
    })
    const rows = (data?.content ?? []) as BundleDTO[]
    allBundles.value = rows.map(row => ({
      id: Number(row.id),
      name: row.name,
      machineIds: (row.machine_ids ?? []).map(id => `machine-${id}`),
      techniqueIds: (row.technique_ids ?? []).map(id => `technique-${id}`),
      evaluationIds: (row.evaluation_ids ?? []).map(id => `evaluation-${id}`),
      itemPrices: buildItemPriceMap(row.item_prices),
      bundledPrice: Number(row.bundled_price ?? 0),
      status: row.is_active ? "Active" : "Inactive"
    }))
    emit("refreshed")
  } catch {
    allBundles.value = []
    errorToast(toast, "Failed to load bundles")
  } finally {
    isLoading.value = false
  }
}

const bundleDialogVisible = ref(false)
const editingBundleId = ref<number | null>(null)
const bundleForm = reactive<{
  name: string
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  itemPrices: Record<string, number>
  bundledPrice: number
}>({
  name: "",
  machineIds: [],
  techniqueIds: [],
  evaluationIds: [],
  itemPrices: {},
  bundledPrice: 0
})

const bundlePriceManuallyEdited = ref(false)

const selectedBundleItems = computed<BundleItemEditorRow[]>(() => [
  ...bundleForm.machineIds.map(id => ({
    id,
    numericId: parseNumericId(id, "machine-"),
    itemType: "MACHINE" as BundleItemType,
    name: props.getServiceName(id),
    standardPrice: Number(props.getServicePrice(id) ?? 0),
  })),
  ...bundleForm.techniqueIds.map(id => ({
    id,
    numericId: parseNumericId(id, "technique-"),
    itemType: "TECHNIQUE" as BundleItemType,
    name: props.getServiceName(id),
    standardPrice: Number(props.getServicePrice(id) ?? 0),
  })),
  ...bundleForm.evaluationIds.map(id => ({
    id,
    numericId: parseNumericId(id, "evaluation-"),
    itemType: "EVALUATION" as BundleItemType,
    name: props.getServiceName(id),
    standardPrice: Number(props.getServicePrice(id) ?? 0),
  })),
])

const getSelectedBundleItemPrice = (item: BundleItemEditorRow): number => {
  if (!hasItemPricing.value) {
    return item.standardPrice
  }

  const configuredPrice = Number(bundleForm.itemPrices[item.id])
  return Number.isFinite(configuredPrice) ? configuredPrice : item.standardPrice
}

const getSelectedBundleTotal = (): number =>
  selectedBundleItems.value.reduce((sum, item) => sum + getSelectedBundleItemPrice(item), 0)

const replaceItemPrices = (prices: Record<string, number>): void => {
  for (const key of Object.keys(bundleForm.itemPrices)) {
    delete bundleForm.itemPrices[key]
  }
  for (const [key, value] of Object.entries(prices)) {
    bundleForm.itemPrices[key] = value
  }
}

const syncSelectedItemPrices = (): void => {
  if (!hasItemPricing.value) return

  const selectedIds = new Set(selectedBundleItems.value.map(item => item.id))
  for (const key of Object.keys(bundleForm.itemPrices)) {
    if (!selectedIds.has(key)) delete bundleForm.itemPrices[key]
  }
  for (const item of selectedBundleItems.value) {
    if (bundleForm.itemPrices[item.id] == null || !Number.isFinite(Number(bundleForm.itemPrices[item.id]))) {
      bundleForm.itemPrices[item.id] = item.standardPrice
    }
  }
}

const syncBundlePriceFromSelection = (): void => {
  if (editingBundleId.value !== null || bundlePriceManuallyEdited.value) {
    return
  }

  bundleForm.bundledPrice = getSelectedBundleTotal()
}

const getBundleItemFormPrice = (id: string): number => Number(bundleForm.itemPrices[id] ?? 0)

const setBundleItemFormPrice = (id: string, value: number | null): void => {
  bundleForm.itemPrices[id] = Number(value ?? 0)
}

const setBundleItemFree = (id: string): void => {
  bundleForm.itemPrices[id] = 0
}

const buildBundleItemPricePayload = () =>
  hasItemPricing.value
    ? selectedBundleItems.value.map(item => ({
      item_type: item.itemType,
      id: item.numericId,
      price: getSelectedBundleItemPrice(item),
    }))
    : []

const openAddBundleDialog = (): void => {
  editingBundleId.value = null
  bundlePriceManuallyEdited.value = false
  bundleForm.name = ""
  bundleForm.machineIds = []
  bundleForm.techniqueIds = []
  bundleForm.evaluationIds = []
  replaceItemPrices({})
  bundleForm.bundledPrice = 0
  bundleDialogVisible.value = true
}

const openEditBundleDialog = (bundle: BundledService): void => {
  editingBundleId.value = bundle.id
  bundlePriceManuallyEdited.value = true
  bundleForm.name = bundle.name
  bundleForm.machineIds = [...bundle.machineIds]
  bundleForm.techniqueIds = [...bundle.techniqueIds]
  bundleForm.evaluationIds = [...bundle.evaluationIds]
  replaceItemPrices(bundle.itemPrices)
  syncSelectedItemPrices()
  bundleForm.bundledPrice = bundle.bundledPrice
  bundleDialogVisible.value = true
}

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const handleBundlePriceChange = (value: number | null): void => {
  bundlePriceManuallyEdited.value = true
  bundleForm.bundledPrice = Number(value ?? 0)
}

const saveBundle = async (): Promise<void> => {
  if (!props.canEdit) return
  if (!bundleForm.name.trim()) {
    errorToast(toast, "Bundle name is required")
    return
  }
  const total = bundleForm.machineIds.length + bundleForm.techniqueIds.length + bundleForm.evaluationIds.length
  if (total === 0) {
    errorToast(toast, "Add at least one machine, technique, or evaluation")
    return
  }
  if (bundleForm.bundledPrice < 0) {
    errorToast(toast, "Bundled price must be 0 or greater")
    return
  }
  if (hasItemPricing.value && buildBundleItemPricePayload().some(item => !Number.isFinite(item.price) || item.price < 0)) {
    errorToast(toast, "Bundle item prices must be 0 or greater")
    return
  }

  isLoading.value = true
  try {
    const bundledPrice = editingBundleId.value === null && !bundlePriceManuallyEdited.value
      ? getSelectedBundleTotal()
      : Number(bundleForm.bundledPrice ?? 0)

    const apiPayload = {
      name: bundleForm.name,
      bundled_price: bundledPrice,
      machine_ids: [...bundleForm.machineIds].map(id => parseNumericId(id, "machine-")).filter(Boolean),
      technique_ids: [...bundleForm.techniqueIds].map(id => parseNumericId(id, "technique-")).filter(Boolean),
      evaluation_ids: [...bundleForm.evaluationIds].map(id => parseNumericId(id, "evaluation-")).filter(Boolean),
      add_on_machine_ids: [] as number[],
      add_on_technique_ids: [] as number[],
      add_on_home_service_ids: [] as number[],
      item_prices: buildBundleItemPricePayload()
    }

    if (editingBundleId.value) {
      await pamsAPI.put(`${bundleApiPath.value}/${editingBundleId.value}`, apiPayload)
      successToast(toast, "Bundle updated")
    } else {
      await pamsAPI.post(bundleApiPath.value, apiPayload)
      successToast(toast, "Bundle added")
    }

    bundleDialogVisible.value = false
    await loadBundles()
  } catch (error) {
    errorToast(toast, getApiErrorMessage(error) || "Failed to save bundle")
  } finally {
    isLoading.value = false
  }
}

const confirmDeactivateBundle = (bundle: BundledService): void => {
  if (!props.canEdit) return
  confirm.require({
    message: `If you proceed, \"${bundle.name}\" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      isLoading.value = true
      try {
        await pamsAPI.patch(`${bundleApiPath.value}/${bundle.id}/status`)
        successToast(toast, "Bundle updated")
        await loadBundles()
      } catch {
        errorToast(toast, "Failed to update bundle status")
      } finally {
        isLoading.value = false
      }
    }
  })
}

watch(
  () => [
    bundleForm.machineIds.join("|"),
    bundleForm.techniqueIds.join("|"),
    bundleForm.evaluationIds.join("|"),
    hasItemPricing.value ? JSON.stringify(bundleForm.itemPrices) : "",
    hasItemPricing.value ? "priced" : "plain",
  ],
  () => {
    syncSelectedItemPrices()
    syncBundlePriceFromSelection()
  }
)

onMounted(() => {
  void loadBundles()
})
</script>
