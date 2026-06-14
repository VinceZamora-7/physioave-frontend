<template>
  <section class="app-section-card-comfy space-y-3">
    <ConfirmDialog />

    <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">{{ title }}</h3>
        <p class="text-xs opacity-70">{{ description }}</p>
      </div>
      <Button v-if="canEdit" label="Add New Package" icon="pi pi-plus" @click="openAddDialog" />
    </div>

    <DataTable
      :value="activePackages"
      dataKey="id"
      paginator
      :rows="5"
      :loading="isLoading"
      class="rounded-lg border border-[rgb(var(--app-border))]"
    >
      <template #empty>
        <p class="m-0 text-sm opacity-70">No packages found.</p>
      </template>

      <Column field="name" header="Package Name" />
      <Column header="Service Bundle">
        <template #body="{ data }">
          {{ data.bundleId ? getBundleName(data.bundleId) : "—" }}
        </template>
      </Column>
      <Column field="bundleQty" header="Qty/Sessions" style="width: 120px" />

      <Column header="Machine & Modalities">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag v-for="id in (data.machineIds ?? [])" :key="id" :value="getServiceName(id)" severity="info" class="text-xs" />
            <span v-if="!(data.machineIds ?? []).length" class="text-xs opacity-40">—</span>
          </div>
        </template>
      </Column>
      <Column header="Qty" style="width: 80px">
        <template #body="{ data }">{{ getCategoryTotalQty(data.machineItems, data.machineIds, data.machineQty) }}</template>
      </Column>

      <Column header="Technique">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag v-for="id in (data.techniqueIds ?? [])" :key="id" :value="getServiceName(id)" severity="success" class="text-xs" />
            <span v-if="!(data.techniqueIds ?? []).length" class="text-xs opacity-40">—</span>
          </div>
        </template>
      </Column>
      <Column header="Qty" style="width: 80px">
        <template #body="{ data }">{{ getCategoryTotalQty(data.techniqueItems, data.techniqueIds, data.techniqueQty) }}</template>
      </Column>

      <Column header="Evaluations">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Tag v-for="id in data.evaluationIds" :key="id" :value="getServiceName(id)" severity="warning" class="text-xs" />
            <span v-if="!data.evaluationIds.length" class="text-xs opacity-40">—</span>
          </div>
        </template>
      </Column>
      <Column header="Qty" style="width: 80px">
        <template #body="{ data }">{{ getCategoryTotalQty(data.evaluationItems, data.evaluationIds, data.evaluationQty) }}</template>
      </Column>

      <Column header="Regular Total (Automatically Calculated by the system)" style="width: 300px">
        <template #body="{ data }">
          <span class="opacity-70">{{ asCurrency(calcPackageRegularTotal(data)) }}</span>
        </template>
      </Column>
      <Column field="packagePrice" header="Package Price" style="width: 150px">
        <template #body="{ data }">
          <span class="font-semibold text-green-600">{{ asCurrency(data.packagePrice) }}</span>
        </template>
      </Column>

      <Column header="Actions" style="width: 100px">
        <template #body="{ data }">
          <div v-if="canEdit" class="flex gap-1">
            <Button size="small" text icon="pi pi-pencil" @click="openEditDialog(data)" v-tooltip="'Edit'" />
            <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeactivate(data)" v-tooltip="'Delete'" />
          </div>
          <span v-else class="text-xs opacity-50">Read-only</span>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Edit Package' : 'Add New Package'"
      modal
      :style="{ width: isLguScope ? '1120px' : '820px', maxWidth: '95vw' }"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <IftaLabel>
            <InputText v-model="form.name" fluid />
            <label>Package Name</label>
          </IftaLabel>

          <IftaLabel v-if="!isLguScope">
            <InputNumber v-model="form.packagePrice" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
            <label>Package Price</label>
          </IftaLabel>
          <IftaLabel v-else>
            <InputNumber :modelValue="computedLguPackagePrice" mode="currency" currency="PHP" locale="en-PH" disabled fluid />
            <label>Package Price</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="form.bundleId"
              :options="bundleOptions"
              optionLabel="name"
              optionValue="id"
              showClear
              filter
              fluid
              placeholder="Select bundle (optional)"
            />
            <label>Service Bundle</label>
          </IftaLabel>

          <IftaLabel>
            <InputNumber v-model="form.bundleQty" :min="1" :maxFractionDigits="0" fluid />
            <label>Bundle Qty / Sessions</label>
          </IftaLabel>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <IftaLabel>
            <MultiSelect v-model="form.machineIds" :options="machineOptions" optionLabel="name" optionValue="id" filter display="chip" fluid />
            <label>Machines</label>
          </IftaLabel>
          <IftaLabel>
            <InputNumber v-model="form.machineQty" :min="1" :maxFractionDigits="0" fluid />
            <label>Machine Qty</label>
          </IftaLabel>

          <IftaLabel>
            <MultiSelect v-model="form.techniqueIds" :options="techniqueOptions" optionLabel="name" optionValue="id" filter display="chip" fluid />
            <label>Techniques</label>
          </IftaLabel>
          <IftaLabel>
            <InputNumber v-model="form.techniqueQty" :min="1" :maxFractionDigits="0" fluid />
            <label>Technique Qty</label>
          </IftaLabel>

          <IftaLabel>
            <MultiSelect v-model="form.evaluationIds" :options="evaluationOptions" optionLabel="name" optionValue="id" filter display="chip" fluid />
            <label>Evaluations</label>
          </IftaLabel>
          <IftaLabel>
            <InputNumber v-model="form.evaluationQty" :min="1" :maxFractionDigits="0" fluid />
            <label>Evaluation Qty</label>
          </IftaLabel>

        </div>

        <div
          v-if="isLguScope && pricingMatrixRows.length"
          class="rounded-lg border border-[rgb(var(--app-border))] overflow-hidden"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-2">
            <div>
              <div class="text-sm font-semibold">LGU Line Item Pricing</div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] text-sm">
              <thead class="bg-[rgb(var(--app-bg))] text-left text-xs uppercase tracking-wide opacity-70">
                <tr>
                  <th class="px-3 py-2">Item</th>
                  <th class="px-3 py-2 w-28">Qty</th>
                  <th class="px-3 py-2 w-52">Original Reference Price</th>
                  <th class="px-3 py-2 w-52">LGU Contract Price</th>
                  <th class="px-3 py-2 w-52">Drop-out Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in pricingMatrixRows"
                  :key="row.key"
                  class="border-t border-[rgb(var(--app-border))]"
                >
                  <td class="px-3 py-3 align-top">
                    <div class="flex flex-col gap-1">
                      <Tag :value="row.category" :severity="row.severity" class="w-fit text-xs" />
                      <span class="font-medium">{{ row.name ?? getServiceName(row.item.id) }}</span>
                      <span v-if="row.item.packageUnitPrice === 0" class="text-xs font-semibold text-green-600">FREE</span>
                    </div>
                  </td>
                  <td class="px-3 py-3 align-top">
                    <InputNumber v-model="row.item.qty" :min="1" :maxFractionDigits="0" fluid />
                  </td>
                  <td class="px-3 py-3 align-top">
                    <InputNumber
                      v-model="row.item.standardUnitPrice"
                      :min="0"
                      mode="currency"
                      currency="PHP"
                      locale="en-PH"
                      fluid
                      disabled
                    />
                  </td>
                  <td class="px-3 py-3 align-top">
                    <div class="flex gap-2">
                      <InputNumber v-model="row.item.packageUnitPrice" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
                      <Button label="Free" size="small" outlined @click="markItemFree(row.item)" />
                    </div>
                  </td>
                  <td class="px-3 py-3 align-top">
                    <InputNumber v-model="row.item.dropoutUnitPrice" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm">
          <div class="flex flex-wrap gap-3 items-center justify-between">
            <div class="opacity-70">{{ isLguScope ? "Reference Total" : "Regular Total" }}</div>
            <div class="font-semibold">{{ asCurrency(calcPackageRegularTotal(form)) }}</div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cancel" text @click="dialogVisible = false" />
          <Button label="Save Package" icon="pi pi-check" @click="save" />
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import ConfirmDialog from "primevue/confirmdialog"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import MultiSelect from "primevue/multiselect"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { errorToast, successToast } from "@/utils/toast.util"
import { normalizeOfferScope } from "@/features/promos-offers/lgu/lgu-module.config"
import {
  createPackageOffer,
  listBundlesByScope,
  listPackageOffersByScope,
  togglePackageOfferStatus,
  updatePackageOffer
} from "@/features/promos-offers/lgu/lgu-module.api"

type PackagePricedItem = {
  id: string
  qty: number
  standardUnitPrice: number
  packageUnitPrice: number
  dropoutUnitPrice: number
}
type PricingMatrixRow = {
  key: string
  category: string
  severity: "secondary" | "info" | "success" | "warning"
  item: PackagePricedItem
  name?: string
}
type PackageItemDTO = {
  id?: number | string
  qty?: number | string
  standardUnitPrice?: number | string | null
  standard_unit_price?: number | string | null
  referencePrice?: number | string | null
  reference_price?: number | string | null
  packageUnitPrice?: number | string | null
  package_unit_price?: number | string | null
  contractPrice?: number | string | null
  contract_price?: number | string | null
  allocatedPrice?: number | string | null
  allocated_price?: number | string | null
  dropoutUnitPrice?: number | string | null
  dropout_unit_price?: number | string | null
  dropoutPrice?: number | string | null
  dropout_price?: number | string | null
  isComplimentary?: boolean | number
  is_complimentary?: boolean | number
}
type PackageDTO = {
  id: number
  name: string
  bundle_template_id?: number | null
  bundleId?: number | null
  bundle_qty?: number
  bundleQty?: number
  bundle_items?: PackageItemDTO[]
  bundleItems?: PackageItemDTO[]
  machine_ids?: number[]
  machineIds?: number[]
  machine_qty?: number
  machineQty?: number
  machine_items?: PackageItemDTO[]
  machineItems?: PackageItemDTO[]
  technique_ids?: number[]
  techniqueIds?: number[]
  technique_qty?: number
  techniqueQty?: number
  technique_items?: PackageItemDTO[]
  techniqueItems?: PackageItemDTO[]
  evaluation_ids?: number[]
  evaluationIds?: number[]
  evaluation_qty?: number
  evaluationQty?: number
  evaluation_items?: PackageItemDTO[]
  evaluationItems?: PackageItemDTO[]
  package_price?: number
  packagePrice?: number
  is_active?: boolean
  status?: string
  offer_scope?: "GLOBAL" | "LGU"
  offerScope?: "GLOBAL" | "LGU"
}

export type PackageService = {
  id: number
  name: string
  bundleId?: number | string | null
  bundleQty: number
  bundleItems?: PackagePricedItem[]
  machineIds?: string[]
  machineQty?: number
  machineItems?: PackagePricedItem[]
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: PackagePricedItem[]
  evaluationIds: string[]
  evaluationQty?: number
  evaluationItems?: PackagePricedItem[]
  packagePrice: number
  offerScope?: "GLOBAL" | "LGU"
  status: "Active" | "Inactive"
}

type OptionRow = { id: string; name: string; price?: number }

const props = defineProps<{
  title: string
  description: string
  canEdit: boolean
  offerScope?: "GLOBAL" | "LGU"
  machineOptions: OptionRow[]
  techniqueOptions: OptionRow[]
  evaluationOptions: OptionRow[]
  getServiceName: (id: string) => string
  getServicePrice: (id: string) => number
}>()

// Removed unused emit

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const packages = ref<PackageService[]>([])
const activePackages = computed(() => packages.value.filter(p => p.status !== "Inactive"))
const isLguScope = computed(() => normalizeOfferScope(props.offerScope) === "LGU")

const bundles = ref<Array<{ id: number; name: string; bundledPrice: number; status: "Active" | "Inactive" }>>([])
const bundleOptions = computed(() => bundles.value.filter(b => b.status !== "Inactive").map(b => ({ id: b.id, name: b.name })))

const asCurrency = (value: number): string => Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const getBundleName = (id: number | string): string => {
  const parsed = typeof id === "string" ? Number(id) : id
  if (Number.isFinite(parsed)) {
    const found = bundles.value.find(b => b.id === parsed)
    if (found?.name) return found.name
  }
  return String(id)
}

const getCategoryTotalQty = (
  items?: Array<{ id: string; qty: number }>,
  ids?: string[],
  fallbackQty?: number
): number => {
  if ((items ?? []).length > 0) return (items ?? []).reduce((sum, entry) => sum + Number(entry.qty ?? 0), 0)
  return Number((ids ?? []).length) * Number(fallbackQty ?? 1)
}

const toPositiveWhole = (value: unknown, fallback = 1): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.trunc(parsed)) : fallback
}

const toNonNegativeNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const pickAmount = (entry: PackageItemDTO, keys: Array<keyof PackageItemDTO>, fallback: number): number => {
  for (const key of keys) {
    const value = entry[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return toNonNegativeNumber(value, fallback)
    }
  }
  return fallback
}

const makePricedItem = (
  id: string,
  fallbackQty: number,
  existing?: Partial<PackagePricedItem>,
  referencePrice = props.getServicePrice(id)
): PackagePricedItem => {
  const standardUnitPrice = toNonNegativeNumber(existing?.standardUnitPrice, referencePrice)
  return {
    id,
    qty: toPositiveWhole(existing?.qty, fallbackQty),
    standardUnitPrice,
    packageUnitPrice: toNonNegativeNumber(existing?.packageUnitPrice, standardUnitPrice),
    dropoutUnitPrice: toNonNegativeNumber(existing?.dropoutUnitPrice, standardUnitPrice)
  }
}

const normalizePricedItemsFromApi = (
  entries: PackageItemDTO[] | undefined,
  fallbackIds: number[] | undefined,
  prefix: string,
  fallbackQty: number,
  getReferencePrice: (id: string) => number = props.getServicePrice
): PackagePricedItem[] => {
  const sourceEntries: PackageItemDTO[] = (entries ?? []).length
    ? entries ?? []
    : (fallbackIds ?? []).map((id) => ({ id, qty: fallbackQty }))

  return sourceEntries
    .map((entry) => {
      const numericId = Number(entry.id ?? 0)
      if (!Number.isFinite(numericId) || numericId <= 0) return null
      const id = `${prefix}${numericId}`
      const referencePrice = getReferencePrice(id)
      const standardUnitPrice = pickAmount(entry, ["standardUnitPrice", "standard_unit_price", "referencePrice", "reference_price"], referencePrice)
      const packageUnitPrice = Boolean(entry.isComplimentary ?? entry.is_complimentary)
        ? 0
        : pickAmount(entry, ["packageUnitPrice", "package_unit_price", "contractPrice", "contract_price", "allocatedPrice", "allocated_price"], standardUnitPrice)
      return {
        id,
        qty: toPositiveWhole(entry.qty, fallbackQty),
        standardUnitPrice,
        packageUnitPrice,
        dropoutUnitPrice: pickAmount(entry, ["dropoutUnitPrice", "dropout_unit_price", "dropoutPrice", "dropout_price"], standardUnitPrice)
      }
    })
    .filter((entry): entry is PackagePricedItem => entry !== null)
}

const syncItemsFromSelection = (
  ids: string[] | undefined,
  existing: PackagePricedItem[] | undefined,
  fallbackQty: number
): PackagePricedItem[] => {
  const existingById = new Map((existing ?? []).map((item) => [item.id, item]))
  return (ids ?? []).map((id) => makePricedItem(id, fallbackQty, existingById.get(id)))
}

const getBundleReferencePrice = (id: string | number | null | undefined): number => {
  const rawId = String(id ?? "").replace(/^bundle-/, "")
  const parsed = Number(rawId)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Number(bundles.value.find(bundle => bundle.id === parsed)?.bundledPrice ?? 0)
}

const syncBundleFromSelection = (): void => {
  const bundleId = form.bundleId ? Number(form.bundleId) : 0
  if (!Number.isFinite(bundleId) || bundleId <= 0) {
    form.bundleItems = []
    return
  }
  const id = `bundle-${bundleId}`
  const existing = form.bundleItems?.find(item => item.id === id)
  form.bundleItems = [makePricedItem(id, Number(form.bundleQty ?? 1), existing, getBundleReferencePrice(id))]
}

const syncAllSelectedItems = (): void => {
  syncBundleFromSelection()
  form.machineItems = syncItemsFromSelection(form.machineIds, form.machineItems, Number(form.machineQty ?? 1))
  form.techniqueItems = syncItemsFromSelection(form.techniqueIds, form.techniqueItems, Number(form.techniqueQty ?? 1))
  form.evaluationItems = syncItemsFromSelection(form.evaluationIds, form.evaluationItems, Number(form.evaluationQty ?? 1))
}

const pricingMatrixRows = computed<PricingMatrixRow[]>(() => [
  ...(form.bundleItems ?? []).map((item) => ({ key: `bundle-${item.id}`, category: "Bundle", severity: "secondary" as const, item, name: getBundleName(parseNumericId(item.id, "bundle-")) })),
  ...(form.machineItems ?? []).map((item) => ({ key: `machine-${item.id}`, category: "Machine", severity: "info" as const, item })),
  ...(form.techniqueItems ?? []).map((item) => ({ key: `technique-${item.id}`, category: "Technique", severity: "success" as const, item })),
  ...(form.evaluationItems ?? []).map((item) => ({ key: `evaluation-${item.id}`, category: "Evaluation", severity: "warning" as const, item }))
])

const markItemFree = (item: PackagePricedItem): void => {
  item.packageUnitPrice = 0
}

const sumConfiguredItemPrices = (items?: PackagePricedItem[]): number =>
  (items ?? []).reduce((sum, entry) => sum + toPositiveWhole(entry.qty, 1) * toNonNegativeNumber(entry.packageUnitPrice, 0), 0)

const sumReferenceItemPrices = (items?: PackagePricedItem[]): number =>
  (items ?? []).reduce((sum, entry) => sum + toPositiveWhole(entry.qty, 1) * toNonNegativeNumber(entry.standardUnitPrice, 0), 0)

const calcConfiguredPackagePrice = (item: PackageService): number =>
  Number((
    sumConfiguredItemPrices(item.bundleItems) +
    sumConfiguredItemPrices(item.machineItems) +
    sumConfiguredItemPrices(item.techniqueItems) +
    sumConfiguredItemPrices(item.evaluationItems)
  ).toFixed(2))

const computedLguPackagePrice = computed(() => calcConfiguredPackagePrice(form))

const calcPackageRegularTotal = (item: PackageService): number => {
  const isLguItem = normalizeOfferScope(item.offerScope ?? props.offerScope) === "LGU"
  const hasConfiguredReferenceItems = [
    ...(item.bundleItems ?? []),
    ...(item.machineItems ?? []),
    ...(item.techniqueItems ?? []),
    ...(item.evaluationItems ?? [])
  ].length > 0

  if (isLguItem && hasConfiguredReferenceItems) {
    return Number((
      sumReferenceItemPrices(item.bundleItems) +
      sumReferenceItemPrices(item.machineItems) +
      sumReferenceItemPrices(item.techniqueItems) +
      sumReferenceItemPrices(item.evaluationItems)
    ).toFixed(2))
  }

  const bundleIdRaw = item.bundleId
  const bundleId = bundleIdRaw === undefined || bundleIdRaw === null || String(bundleIdRaw).trim() === "" ? null : Number(bundleIdRaw)
  const bundle = bundleId ? bundles.value.find(b => b.id === bundleId) : undefined
  const bundleRegularTotal = Number(bundle?.bundledPrice ?? 0) * Number(item.bundleQty ?? 1)

  const machineRegularTotal = (item.machineItems?.length
    ? item.machineItems
    : (item.machineIds ?? []).map((id: string) => ({ id, qty: Number(item.machineQty ?? 1) }))
  ).reduce((sum: number, entry) => sum + (props.getServicePrice(entry.id) * Number(entry.qty ?? 1)), 0)

  const techniqueRegularTotal = (item.techniqueItems?.length
    ? item.techniqueItems
    : (item.techniqueIds ?? []).map((id: string) => ({ id, qty: Number(item.techniqueQty ?? 1) }))
  ).reduce((sum: number, entry) => sum + (props.getServicePrice(entry.id) * Number(entry.qty ?? 1)), 0)

  const evaluationRegularTotal = (item.evaluationItems?.length
    ? item.evaluationItems
    : (item.evaluationIds ?? []).map((id: string) => ({ id, qty: Number(item.evaluationQty ?? 1) }))
  ).reduce((sum: number, entry) => sum + (props.getServicePrice(entry.id) * Number(entry.qty ?? 1)), 0)

  return bundleRegularTotal + machineRegularTotal + techniqueRegularTotal + evaluationRegularTotal
}

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<PackageService>({
  id: 0,
  name: "",
  bundleId: null,
  bundleQty: 1,
  bundleItems: [],
  machineIds: [],
  machineQty: 1,
  machineItems: [],
  techniqueIds: [],
  techniqueQty: 1,
  techniqueItems: [],
  evaluationIds: [],
  evaluationQty: 1,
  evaluationItems: [],
  packagePrice: 0,
  status: "Active",
  offerScope: "GLOBAL"
})

const openAddDialog = (): void => {
  editingId.value = null
  form.name = ""
  form.bundleId = null
  form.bundleQty = 1
  form.bundleItems = []
  form.machineIds = []
  form.machineQty = 1
  form.machineItems = []
  form.techniqueIds = []
  form.techniqueQty = 1
  form.techniqueItems = []
  form.evaluationIds = []
  form.evaluationQty = 1
  form.evaluationItems = []
  form.packagePrice = 0
  dialogVisible.value = true
}

const openEditDialog = (row: PackageService): void => {
  editingId.value = row.id
  form.name = row.name
  form.bundleId = row.bundleId ?? null
  form.bundleQty = Number(row.bundleQty ?? 1)
  form.bundleItems = (row.bundleItems ?? []).map((item) => makePricedItem(item.id, Number(row.bundleQty ?? 1), item, getBundleReferencePrice(item.id)))
  form.machineIds = [...(row.machineIds ?? [])]
  form.machineQty = Number(row.machineQty ?? 1)
  form.machineItems = (row.machineItems ?? []).map((item) => makePricedItem(item.id, Number(row.machineQty ?? 1), item))
  form.techniqueIds = [...(row.techniqueIds ?? [])]
  form.techniqueQty = Number(row.techniqueQty ?? 1)
  form.techniqueItems = (row.techniqueItems ?? []).map((item) => makePricedItem(item.id, Number(row.techniqueQty ?? 1), item))
  form.evaluationIds = [...(row.evaluationIds ?? [])]
  form.evaluationQty = Number(row.evaluationQty ?? 1)
  form.evaluationItems = (row.evaluationItems ?? []).map((item) => makePricedItem(item.id, Number(row.evaluationQty ?? 1), item))
  form.packagePrice = Number(row.packagePrice ?? 0)
  syncAllSelectedItems()
  dialogVisible.value = true
}

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const loadBundles = async (): Promise<void> => {
  try {
    const res = await listBundlesByScope(props.offerScope)
    bundles.value = (res.content ?? []).map((row) => ({
      id: Number(row.id),
      name: row.name,
      bundledPrice: Number(row.bundled_price ?? 0),
      status: typeof row.is_active === "boolean" ? (row.is_active ? "Active" : "Inactive") : "Inactive"
    }))
  } catch {
    bundles.value = []
  }
}

const loadPackages = async (): Promise<void> => {
  isLoading.value = true
  try {
    let allRows: PackageDTO[] = []
    const res = await listPackageOffersByScope<PackageDTO>(normalizeOfferScope(props.offerScope))
    allRows = res.content ?? []
    packages.value = allRows.map((row) => {
      const machineQty = Number(row.machine_qty ?? row.machineQty ?? 1)
      const techniqueQty = Number(row.technique_qty ?? row.techniqueQty ?? 1)
      const evaluationQty = Number(row.evaluation_qty ?? row.evaluationQty ?? 1)
      const machineItems = normalizePricedItemsFromApi(row.machine_items ?? row.machineItems, row.machine_ids ?? row.machineIds, "machine-", machineQty)
      const techniqueItems = normalizePricedItemsFromApi(row.technique_items ?? row.techniqueItems, row.technique_ids ?? row.techniqueIds, "technique-", techniqueQty)
      const evaluationItems = normalizePricedItemsFromApi(row.evaluation_items ?? row.evaluationItems, row.evaluation_ids ?? row.evaluationIds, "evaluation-", evaluationQty)
      const bundleId = row.bundle_template_id ?? row.bundleId ?? null
      const bundleQty = Number(row.bundle_qty ?? row.bundleQty ?? 1)
      const bundleItems = normalizePricedItemsFromApi(
        row.bundle_items ?? row.bundleItems,
        bundleId ? [Number(bundleId)] : [],
        "bundle-",
        bundleQty,
        getBundleReferencePrice
      )

      return {
        id: Number(row.id),
        name: row.name,
        bundleId,
        bundleQty,
        bundleItems,
        machineIds: machineItems.length ? machineItems.map((item) => item.id) : (row.machine_ids ?? row.machineIds ?? []).map((id: number) => `machine-${id}`),
        machineQty,
        machineItems,
        techniqueIds: techniqueItems.length ? techniqueItems.map((item) => item.id) : (row.technique_ids ?? row.techniqueIds ?? []).map((id: number) => `technique-${id}`),
        techniqueQty,
        techniqueItems,
        evaluationIds: evaluationItems.length ? evaluationItems.map((item) => item.id) : (row.evaluation_ids ?? row.evaluationIds ?? []).map((id: number) => `evaluation-${id}`),
        evaluationQty,
        evaluationItems,
        packagePrice: Number(row.package_price ?? row.packagePrice ?? 0),
        status: row.is_active === false ? "Inactive" : ((row.status === "Inactive" || row.status === "Active") ? row.status : "Active"),
        offerScope: normalizeOfferScope(row.offer_scope ?? row.offerScope),
      }
    })
  } catch {
    packages.value = []
  } finally {
    isLoading.value = false
  }
}

const save = async (): Promise<void> => {
  if (!props.canEdit) return
  syncAllSelectedItems()
  if (!String(form.name ?? "").trim()) {
    errorToast(toast, "Package name is required")
    return
  }
  if (!isLguScope.value && Number(form.packagePrice ?? 0) < 0) {
    errorToast(toast, "Package price must be 0 or greater")
    return
  }
  if ((form.evaluationIds ?? []).length === 0 && (form.machineIds ?? []).length === 0 && (form.techniqueIds ?? []).length === 0 && !form.bundleId) {
    errorToast(toast, "Select at least one service or a bundle")
    return
  }
  if (isLguScope.value) {
    const invalidRow = pricingMatrixRows.value.find((row) => (
      toPositiveWhole(row.item.qty, 0) <= 0 ||
      row.item.standardUnitPrice < 0 ||
      row.item.packageUnitPrice < 0 ||
      row.item.dropoutUnitPrice < 0
    ))
    if (invalidRow) {
      errorToast(toast, "LGU line item quantities and prices must be 0 or greater")
      return
    }
  }

  const serializeItems = (items: PackagePricedItem[] | undefined, prefix: string) => (items ?? [])
    .map((entry) => ({
      id: parseNumericId(entry.id, prefix),
      qty: toPositiveWhole(entry.qty, 1),
      standard_unit_price: toNonNegativeNumber(entry.standardUnitPrice, 0),
      package_unit_price: toNonNegativeNumber(entry.packageUnitPrice, 0),
      dropout_unit_price: toNonNegativeNumber(entry.dropoutUnitPrice, 0),
      is_complimentary: toNonNegativeNumber(entry.packageUnitPrice, 0) === 0
    }))
    .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)

  isLoading.value = true
  try {
    const bundleItems = isLguScope.value ? serializeItems(form.bundleItems, "bundle-") : []
    const effectiveBundleQty = bundleItems[0]?.qty ?? toPositiveWhole(form.bundleQty, 1)
    const machineItems = isLguScope.value ? serializeItems(form.machineItems, "machine-") : []
    const techniqueItems = isLguScope.value ? serializeItems(form.techniqueItems, "technique-") : []
    const evaluationItems = isLguScope.value ? serializeItems(form.evaluationItems, "evaluation-") : []
    const apiPayload = {
      name: String(form.name).trim(),
      bundle_template_id: form.bundleId ? Number(form.bundleId) : null,
      bundle_qty: effectiveBundleQty,
      bundle_items: bundleItems,
      machine_ids: (form.machineIds ?? []).map((id: string) => parseNumericId(id, "machine-")).filter(Boolean),
      machine_qty: Number(form.machineQty ?? 1),
      machine_items: machineItems,
      technique_ids: (form.techniqueIds ?? []).map((id: string) => parseNumericId(id, "technique-")).filter(Boolean),
      technique_qty: Number(form.techniqueQty ?? 1),
      technique_items: techniqueItems,
      evaluation_ids: (form.evaluationIds ?? []).map((id: string) => parseNumericId(id, "evaluation-")).filter(Boolean),
      evaluation_qty: Number(form.evaluationQty ?? 1),
      evaluation_items: evaluationItems,
      session_ids: [],
      session_qty: 1,
      package_price: isLguScope.value ? computedLguPackagePrice.value : Number(form.packagePrice ?? 0),
      offer_scope: normalizeOfferScope(props.offerScope)
    }

    // If LGU, always generate a unique name for backend, but do not show suffix in UI
    const lguSuffix = (apiPayload.offer_scope === "LGU" && !editingId.value)
      ? ` (LGU ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()})`
      : ""
    if (lguSuffix) {
      apiPayload.name = `${apiPayload.name}${lguSuffix}`
    }

    if (editingId.value) {
      await updatePackageOffer(editingId.value, apiPayload)
      successToast(toast, "Package updated")
    } else {
      await createPackageOffer(apiPayload)
      successToast(toast, "Package added")
    }

    dialogVisible.value = false
    await loadPackages()
  } catch (err: unknown) {
    // Show clearer backend error messages
    let msg = "Failed to save package"
    let lguSuffix = ""
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      (err as { response?: { data?: { message?: string } } }).response &&
      (err as { response: { data?: { message?: string } } }).response.data &&
      (err as { response: { data: { message?: string } } }).response.data.message
    ) {
      msg = (err as { response: { data: { message: string } } }).response.data.message
      // Clean up duplicate LGU suffix in error message if present
      lguSuffix = (props.offerScope === "LGU" && !editingId.value)
        ? ` (LGU ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()})`
        : ""
      msg = msg.replace(lguSuffix, "")
    }
    errorToast(toast, msg)
  } finally {
    isLoading.value = false
  }
}

watch(() => form.machineIds ?? [], () => {
  form.machineItems = syncItemsFromSelection(form.machineIds, form.machineItems, Number(form.machineQty ?? 1))
}, { deep: true })

watch(() => form.bundleId, () => {
  syncBundleFromSelection()
})

watch(() => form.techniqueIds ?? [], () => {
  form.techniqueItems = syncItemsFromSelection(form.techniqueIds, form.techniqueItems, Number(form.techniqueQty ?? 1))
}, { deep: true })

watch(() => form.evaluationIds ?? [], () => {
  form.evaluationItems = syncItemsFromSelection(form.evaluationIds, form.evaluationItems, Number(form.evaluationQty ?? 1))
}, { deep: true })

watch(() => form.machineQty, (qty) => {
  form.machineItems = (form.machineItems ?? []).map((item) => ({ ...item, qty: toPositiveWhole(qty, 1) }))
})

watch(() => form.bundleQty, (qty) => {
  form.bundleItems = (form.bundleItems ?? []).map((item) => ({ ...item, qty: toPositiveWhole(qty, 1) }))
})

watch(() => form.techniqueQty, (qty) => {
  form.techniqueItems = (form.techniqueItems ?? []).map((item) => ({ ...item, qty: toPositiveWhole(qty, 1) }))
})

watch(() => form.evaluationQty, (qty) => {
  form.evaluationItems = (form.evaluationItems ?? []).map((item) => ({ ...item, qty: toPositiveWhole(qty, 1) }))
})

const confirmDeactivate = (row: PackageService): void => {
  if (!props.canEdit) return
  confirm.require({
    message: `If you proceed, \"${row.name}\" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      isLoading.value = true
      try {
        await togglePackageOfferStatus(row.id)
        successToast(toast, "Package updated")
        await loadPackages()
      } catch {
        errorToast(toast, "Failed to update package status")
      } finally {
        isLoading.value = false
      }
    }
  })
}

onMounted(async () => {
  await loadBundles()
  await loadPackages()
})
</script>
