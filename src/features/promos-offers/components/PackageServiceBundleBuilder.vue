<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Promos And Offers</p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">{{ props.pageTitle }}</h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            {{ props.pageDescription }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Add New Service" icon="pi pi-plus" @click="openAddDialog" />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="refreshAll" />
        </div>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Package Builder</h3>
          <p class="text-xs opacity-70">Regular Total = (Bundled Price x Qty/Sessions) + (Evaluation original Price x Qty).</p>
        </div>
        <Button label="Add New Package" icon="pi pi-plus" @click="openAddPackageDialog" />
      </div>

      <DataTable
        :value="allPackages"
        dataKey="id"
        paginator
        :rows="25"
        :loading="isLoading"
        class="rounded-lg border border-[rgb(var(--app-border))]"
      >
        <Column field="name" header="Package Name" />
        <Column header="Service Bundle">
          <template #body="{data}">
            {{ data.bundleId ? getBundleName(data.bundleId) : "—" }}
          </template>
        </Column>
        <Column field="bundleQty" header="Qty/Sessions" style="width: 120px" />
        <Column header="Machine & Modalities">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in (data.machineIds ?? [])" :key="id" :value="getServiceName(id)" severity="info" class="text-xs" />
              <span v-if="!(data.machineIds ?? []).length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            {{ getCategoryTotalQty(data.machineItems, data.machineIds, data.machineQty) }}
          </template>
        </Column>
        <Column header="Technique">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in (data.techniqueIds ?? [])" :key="id" :value="getServiceName(id)" severity="success" class="text-xs" />
              <span v-if="!(data.techniqueIds ?? []).length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            {{ getCategoryTotalQty(data.techniqueItems, data.techniqueIds, data.techniqueQty) }}
          </template>
        </Column>
        <Column header="Evaluations">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in data.evaluationIds" :key="id" :value="getServiceName(id)" severity="warning" class="text-xs" />
              <span v-if="!data.evaluationIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            {{ getCategoryTotalQty(data.evaluationItems, data.evaluationIds, data.evaluationQty) }}
          </template>
        </Column>
        <Column header="Add-ons">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in (data.addOnIds ?? [])" :key="id" :value="getServiceName(id)" severity="secondary" class="text-xs" />
              <span v-if="!(data.addOnIds ?? []).length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            {{ getCategoryTotalQty(data.addOnItems, data.addOnIds, data.addOnQty) }}
          </template>
        </Column>
        <Column header="Recurring PT Sessions">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in (data.sessionIds ?? [])" :key="id" :value="getServiceName(id)" severity="info" class="text-xs" />
              <span v-if="!(data.sessionIds ?? []).length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Qty" style="width: 80px">
          <template #body="{data}">
            {{ getCategoryTotalQty(data.sessionItems, data.sessionIds, data.sessionQty) }}
          </template>
        </Column>
        <Column header="Regular Total (Automatically Calculated by the system)" style="width: 300px">
          <template #body="{data}">
            <span class="opacity-70">{{ asCurrency(calcPackageRegularTotal(data)) }}</span>
          </template>
        </Column>
        <Column field="packagePrice" header="Package Price" style="width: 150px">
          <template #body="{data}">
            <span class="font-semibold text-green-600">{{ asCurrency(data.packagePrice) }}</span>
          </template>
        </Column>
        <Column header="Actions" style="width: 100px">
          <template #body="{data}">
            <div class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEditPackageDialog(data)" v-tooltip="'Edit'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeletePackage(data)" v-tooltip="'Delete'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="space-y-2">
        <h3 class="text-sm font-semibold">All Available Services</h3>
        <DataTable
          :value="allServices"
          dataKey="id"
          paginator
          :rows="25"
          :loading="isLoading"
          class="rounded-lg border border-[rgb(var(--app-border))]"
        >
          <Column field="type" header="Type" style="width: 120px">
            <template #body="{data}">
              <Tag :value="formatType(data.type)" :severity="getTypeSeverity(data.type)" />
            </template>
          </Column>
          <Column field="name" header="Service Name" />
          <Column field="price" header="Price" style="width: 120px">
            <template #body="{data}">{{ asCurrency(data.price) }}</template>
          </Column>
          <Column field="status" header="Status" style="width: 100px">
            <template #body="{data}">
              <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
            </template>
          </Column>
          <Column header="Actions" style="width: 100px">
            <template #body="{data}">
              <div class="flex gap-1">
                <Button size="small" text icon="pi pi-pencil" @click="openEditDialog(data)" v-tooltip="'Edit'" />
                <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDelete(data)" v-tooltip="'Delete'" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">{{ props.bundledSectionTitle }}</h3>
          <p class="text-xs opacity-70">{{ props.bundledSectionDescription }}</p>
        </div>
        <Button label="Add New Bundle" icon="pi pi-plus" @click="openAddBundleDialog" />
      </div>

      <DataTable
        :value="allBundles"
        dataKey="id"
        paginator
        :rows="25"
        :loading="isLoading"
        class="rounded-lg border border-[rgb(var(--app-border))]"
      >
        <Column field="name" header="Bundle Name" />
        <Column header="Machines">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in data.machineIds" :key="id" :value="getServiceName(id)" severity="info" class="text-xs" />
              <span v-if="!data.machineIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Techniques">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in data.techniqueIds" :key="id" :value="getServiceName(id)" severity="success" class="text-xs" />
              <span v-if="!data.techniqueIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Evaluations">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in data.evaluationIds" :key="id" :value="getServiceName(id)" severity="warning" class="text-xs" />
              <span v-if="!data.evaluationIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Add-ons">
          <template #body="{data}">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="id in data.addOnIds" :key="id" :value="getServiceName(id)" severity="secondary" class="text-xs" />
              <span v-if="!data.addOnIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>
        <Column header="Original Price" style="width: 140px">
          <template #body="{data}">
            <span class="line-through opacity-50 text-xs">{{ asCurrency(calcOriginalPrice(data)) }}</span>
          </template>
        </Column>
        <Column field="bundledPrice" header="Bundled Price" style="width: 140px">
          <template #body="{data}">
            <span class="font-semibold text-green-600">{{ asCurrency(data.bundledPrice) }}</span>
          </template>
        </Column>
        <Column field="status" header="Status" style="width: 100px">
          <template #body="{data}">
            <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
          </template>
        </Column>
        <Column header="Actions" style="width: 100px">
          <template #body="{data}">
            <div class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEditBundleDialog(data)" v-tooltip="'Edit'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeleteBundle(data)" v-tooltip="'Delete'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Edit Service' : 'Add New Service'" modal :style="{width: '480px'}">
      <div class="space-y-3">
        <IftaLabel>
          <Select v-model="formData.type" :options="typeOptions" optionLabel="label" optionValue="value" fluid />
          <label>Service Type</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="formData.name" fluid placeholder="Enter service name" />
          <label>Service Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="formData.price" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" />
          <label>Price</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="formData.status"
            :options="[{label: 'Active', value: 'Active'},{label: 'Inactive', value: 'Inactive'}]"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <label>Status</label>
        </IftaLabel>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button label="Save" icon="pi pi-check" @click="saveService" />
      </template>
    </Dialog>

    <Dialog v-model:visible="bundleDialogVisible" :header="editingBundleId ? 'Edit Bundle' : 'Add New Bundle'" modal :style="{width: '600px'}">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="bundleFormData.name" fluid placeholder="Enter bundle name" />
          <label>Bundle Name</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect v-model="bundleFormData.machineIds" :options="machineServices" optionLabel="name" optionValue="id" filter placeholder="Select machines" fluid />
          <label>Machines</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect v-model="bundleFormData.techniqueIds" :options="techniqueServices" optionLabel="name" optionValue="id" filter placeholder="Select techniques" fluid />
          <label>Techniques</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect v-model="bundleFormData.evaluationIds" :options="evaluationServices" optionLabel="name" optionValue="id" filter placeholder="Select evaluations" fluid />
          <label>Evaluations</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect v-model="bundleFormData.addOnIds" :options="addOnServices" optionLabel="name" optionValue="id" filter placeholder="Select add-ons (optional)" fluid />
          <label>Add-ons (optional)</label>
        </IftaLabel>

        <div v-if="bundlePreviewOriginalPrice > 0" class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-1 text-sm">
          <div class="flex justify-between text-xs opacity-60">
            <span>Original total</span>
            <span class="line-through">{{ asCurrency(bundlePreviewOriginalPrice) }}</span>
          </div>
          <div v-if="bundleFormData.bundledPrice > 0 && bundleFormData.bundledPrice < bundlePreviewOriginalPrice" class="flex justify-between text-xs text-green-600">
            <span>You save</span>
            <span>{{ asCurrency(bundlePreviewOriginalPrice - bundleFormData.bundledPrice) }}</span>
          </div>
        </div>

        <IftaLabel>
          <InputNumber v-model="bundleFormData.bundledPrice" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" />
          <label>Bundled Price</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="bundleFormData.status"
            :options="[{label: 'Active', value: 'Active'},{label: 'Inactive', value: 'Inactive'}]"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <label>Status</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="bundleDialogVisible = false" />
        <Button label="Save Bundle" icon="pi pi-check" @click="saveBundle" />
      </template>
    </Dialog>

    <Dialog v-model:visible="packageDialogVisible" :header="editingPackageId ? 'Edit Package' : 'Add New Package'" modal :style="{width: '620px'}">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="packageFormData.name" fluid placeholder="Enter package name" />
          <label>Package Name</label>
        </IftaLabel>

        <IftaLabel>
          <Select v-model="packageFormData.bundleId" :options="activeBundles" optionLabel="name" optionValue="id" filter fluid placeholder="Select service bundle" />
          <label>Service Bundle</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="packageFormData.bundleQty" :min="1" fluid />
          <label>Bundle Qty</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect v-model="packageFormData.machineIds" :options="machineServices" optionLabel="name" optionValue="id" filter placeholder="Select Machine & Modalities" fluid />
          <label>Machine & Modalities</label>
        </IftaLabel>

        <div v-if="packageFormData.machineItems.length" class="space-y-2 rounded-lg border border-[rgb(var(--app-border))] p-3">
          <div class="text-xs font-semibold opacity-70">Machine Session Quantities</div>
          <div v-for="item in packageFormData.machineItems" :key="`machine-${item.id}`" class="flex items-center justify-between gap-3">
            <span class="text-sm">{{ getServiceName(item.id) }}</span>
            <InputNumber v-model="item.qty" :min="1" inputClass="w-20" />
          </div>
        </div>

        <IftaLabel>
          <MultiSelect v-model="packageFormData.techniqueIds" :options="techniqueServices" optionLabel="name" optionValue="id" filter placeholder="Select Technique" fluid />
          <label>Technique</label>
        </IftaLabel>

        <div v-if="packageFormData.techniqueItems.length" class="space-y-2 rounded-lg border border-[rgb(var(--app-border))] p-3">
          <div class="text-xs font-semibold opacity-70">Technique Session Quantities</div>
          <div v-for="item in packageFormData.techniqueItems" :key="`technique-${item.id}`" class="flex items-center justify-between gap-3">
            <span class="text-sm">{{ getServiceName(item.id) }}</span>
            <InputNumber v-model="item.qty" :min="1" inputClass="w-20" />
          </div>
        </div>

        <IftaLabel>
          <MultiSelect v-model="packageFormData.evaluationIds" :options="evaluationServices" optionLabel="name" optionValue="id" filter placeholder="Select evaluations" fluid />
          <label>Evaluations</label>
        </IftaLabel>

        <div v-if="packageFormData.evaluationItems.length" class="space-y-2 rounded-lg border border-[rgb(var(--app-border))] p-3">
          <div class="text-xs font-semibold opacity-70">Evaluation Session Quantities</div>
          <div v-for="item in packageFormData.evaluationItems" :key="`evaluation-${item.id}`" class="flex items-center justify-between gap-3">
            <span class="text-sm">{{ getServiceName(item.id) }}</span>
            <InputNumber v-model="item.qty" :min="1" inputClass="w-20" />
          </div>
        </div>

        <IftaLabel>
          <MultiSelect v-model="packageFormData.addOnIds" :options="addOnServices" optionLabel="name" optionValue="id" filter placeholder="Select Add-ons" fluid />
          <label>Add-ons</label>
        </IftaLabel>

        <div v-if="packageFormData.addOnItems.length" class="space-y-2 rounded-lg border border-[rgb(var(--app-border))] p-3">
          <div class="text-xs font-semibold opacity-70">Add-on Session Quantities</div>
          <div v-for="item in packageFormData.addOnItems" :key="`addon-${item.id}`" class="flex items-center justify-between gap-3">
            <span class="text-sm">{{ getServiceName(item.id) }}</span>
            <InputNumber v-model="item.qty" :min="1" inputClass="w-20" />
          </div>
        </div>

        <IftaLabel>
          <MultiSelect v-model="packageFormData.sessionIds" :options="sessionServices" optionLabel="name" optionValue="id" filter placeholder="Select Recurring PT Sessions" fluid />
          <label>Recurring PT Sessions</label>
        </IftaLabel>

        <div v-if="packageFormData.sessionItems.length" class="space-y-2 rounded-lg border border-[rgb(var(--app-border))] p-3">
          <div class="text-xs font-semibold opacity-70">Session Quantities</div>
          <div v-for="item in packageFormData.sessionItems" :key="`session-${item.id}`" class="flex items-center justify-between gap-3">
            <span class="text-sm">{{ getServiceName(item.id) }}</span>
            <InputNumber v-model="item.qty" :min="1" inputClass="w-20" />
          </div>
        </div>



        <div v-if="packageRegularTotal > 0" class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-1 text-sm">
          <div class="flex justify-between text-xs opacity-60">
            <span>Regular total</span>
            <span>{{ asCurrency(packageRegularTotal) }}</span>
          </div>
          <div v-if="packageFormData.packagePrice > 0 && packageFormData.packagePrice < packageRegularTotal" class="flex justify-between text-xs text-green-600">
            <span>You save</span>
            <span>{{ asCurrency(packageRegularTotal - packageFormData.packagePrice) }}</span>
          </div>
        </div>

        <IftaLabel>
          <InputNumber v-model="packageFormData.packagePrice" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" />
          <label>Package Price</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="packageFormData.status"
            :options="[{label: 'Active', value: 'Active'},{label: 'Inactive', value: 'Inactive'}]"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <label>Status</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="packageDialogVisible = false" />
        <Button label="Save Package" icon="pi pi-check" @click="savePackage" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from "vue"
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
import axios, {HttpStatusCode} from "axios"
import {useConfirm, useToast} from "primevue"
import type {Pageable} from "@/models/paging.ts"
import type {OfferLookupDTO} from "@/models/global.model.ts"
import {pamsAPI} from "@/utils/axios-interceptor"
import {OfferResourceKey} from "@/utils/keys/resource-key"
import {errorToast, successToast} from "@/utils/toast.util"
import {
  BUNDLED_SERVICES_KEY,
  PACKAGE_SERVICES_KEY,
  SINGLE_PAY_SERVICES_KEY,
  readPromosStorageArray,
  writePromosStorageArray
} from "@/features/promos-offers/composables/promos-storage.composable"

type ServiceType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

interface SingleService {
  id: string
  type: ServiceType
  name: string
  price: number
  status: string
}

interface BundledService {
  id: string
  name: string
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
  bundledPrice: number
  status: string
}

interface PackageService {
  id: string
  name: string
  bundleId?: string
  bundleQty: number
  machineIds?: string[]
  machineQty?: number
  machineItems?: Array<{id: string; qty: number}>
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: Array<{id: string; qty: number}>
  evaluationIds: string[]
  evaluationQty: number
  evaluationItems?: Array<{id: string; qty: number}>
  addOnIds?: string[]
  addOnQty?: number
  addOnItems?: Array<{id: string; qty: number}>
  sessionIds?: string[]
  sessionQty?: number
  sessionItems?: Array<{id: string; qty: number}>
  packagePrice: number
  status: string
}

const toast = useToast()
const confirm = useConfirm()
const props = withDefaults(defineProps<{
  pageTitle?: string
  pageDescription?: string
  bundledSectionTitle?: string
  bundledSectionDescription?: string
  bundleStorageKey?: string
  packageStorageKey?: string
}>(), {
  pageTitle: "Self Pay: Package Service Management",
  pageDescription: "Manage the same service inventory used by single-service billing, reuse service bundles, and assemble package offers with session counts, evaluations, regular totals, and package prices.",
  bundledSectionTitle: "Bundled Services",
  bundledSectionDescription: "Same bundled-services table and logic used in Self Pay: Single Service.",
  bundleStorageKey: BUNDLED_SERVICES_KEY,
  packageStorageKey: PACKAGE_SERVICES_KEY,
})
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const bundleDialogVisible = ref(false)
const editingBundleId = ref<string | null>(null)
const packageDialogVisible = ref(false)
const editingPackageId = ref<string | null>(null)
const refreshPromise = ref<Promise<unknown> | null>(null)

const allServices = ref<SingleService[]>([])
const allBundles = ref<BundledService[]>([])
const allPackages = ref<PackageService[]>([])
const sessionLookupServices = ref<Array<{id: string; name: string; price: number}>>([])

const ensureRefreshed = async (): Promise<void> => {
  if (!refreshPromise.value) {
    refreshPromise.value = pamsAPI.post("/refresh-tokens")
      .finally(() => {
        refreshPromise.value = null
      })
  }

  await refreshPromise.value
}

const withRefreshRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = String(error.response?.data?.message || error.response?.data?.detail || error.message || "").toLowerCase()
      const shouldRefresh =
        status === HttpStatusCode.Unauthorized ||
        status === HttpStatusCode.InternalServerError ||
        message.includes("expired") ||
        message.includes("jwt")

      if (shouldRefresh) {
        await ensureRefreshed()
        return await operation()
      }
    }

    throw error
  }
}

const typeOptions = [
  {label: "Machine & Modalities", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluations", value: "evaluation"},
  {label: "Add-Ons", value: "add-on-machine"}
]

const formData = reactive<{
  type: ServiceType
  name: string
  price: number
  status: string
}>({
  type: "machine",
  name: "",
  price: 0,
  status: "Active"
})

const bundleFormData = reactive<{
  name: string
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
  bundledPrice: number
  status: string
}>({
  name: "",
  machineIds: [],
  techniqueIds: [],
  evaluationIds: [],
  addOnIds: [],
  bundledPrice: 0,
  status: "Active"
})

const packageFormData = reactive<{
  name: string
  bundleId?: string
  bundleQty: number
  machineIds: string[]
  machineItems: Array<{id: string; qty: number}>
  techniqueIds: string[]
  techniqueItems: Array<{id: string; qty: number}>
  evaluationIds: string[]
  evaluationItems: Array<{id: string; qty: number}>
  addOnIds: string[]
  addOnItems: Array<{id: string; qty: number}>
  sessionIds: string[]
  sessionItems: Array<{id: string; qty: number}>
  packagePrice: number
  status: string
}>({
  name: "",
  bundleId: undefined,
  bundleQty: 1,
  machineIds: [],
  machineItems: [],
  techniqueIds: [],
  techniqueItems: [],
  evaluationIds: [],
  evaluationItems: [],
  addOnIds: [],
  addOnItems: [],
  sessionIds: [],
  sessionItems: [],
  packagePrice: 0,
  status: "Active"
})

const syncItemsFromSelection = (
  selectedIds: string[],
  currentItems: Array<{id: string; qty: number}>
): Array<{id: string; qty: number}> => {
  const currentMap = new Map(currentItems.map(item => [item.id, item.qty]))
  return selectedIds.map(id => ({id, qty: Number(currentMap.get(id) ?? 1)}))
}

watch(
  () => packageFormData.machineIds,
  (ids) => {
    packageFormData.machineItems = syncItemsFromSelection(ids, packageFormData.machineItems)
  },
  {deep: true}
)

watch(
  () => packageFormData.techniqueIds,
  (ids) => {
    packageFormData.techniqueItems = syncItemsFromSelection(ids, packageFormData.techniqueItems)
  },
  {deep: true}
)

watch(
  () => packageFormData.evaluationIds,
  (ids) => {
    packageFormData.evaluationItems = syncItemsFromSelection(ids, packageFormData.evaluationItems)
  },
  {deep: true}
)

watch(
  () => packageFormData.addOnIds,
  (ids) => {
    packageFormData.addOnItems = syncItemsFromSelection(ids, packageFormData.addOnItems)
  },
  {deep: true}
)

watch(
  () => packageFormData.sessionIds,
  (ids) => {
    packageFormData.sessionItems = syncItemsFromSelection(ids, packageFormData.sessionItems)
  },
  {deep: true}
)

const machineServices = computed(() => allServices.value.filter(service => service.type === "machine"))
const techniqueServices = computed(() => allServices.value.filter(service => service.type === "technique"))
const evaluationServices = computed(() => allServices.value.filter(service => service.type === "evaluation"))
const addOnServices = computed(() => allServices.value.filter(service => service.type.startsWith("add-on")))
const sessionServices = computed(() => sessionLookupServices.value)
const activeBundles = computed(() => allBundles.value.filter(bundle => bundle.status !== "Inactive"))

const asCurrency = (value: number): string => Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const formatType = (type: ServiceType): string => ({
  machine: "Machine",
  technique: "Technique",
  evaluation: "Evaluation",
  "add-on-machine": "Add-Ons",
  "add-on-technique": "Add-Ons",
  "add-on-home-service": "Add-Ons"
}[type] ?? type)

const getTypeSeverity = (type: ServiceType): string => ({
  machine: "info",
  technique: "success",
  evaluation: "warning",
  "add-on-machine": "secondary",
  "add-on-technique": "secondary",
  "add-on-home-service": "secondary"
}[type] ?? "info")

const getServiceName = (id: string): string => {
  const local = allServices.value.find(service => service.id === id)
  if (local?.name) return local.name
  return sessionLookupServices.value.find(service => service.id === id)?.name ?? id
}

const getServicePrice = (id: string): number => {
  const local = allServices.value.find(service => service.id === id)
  if (local?.price != null) return local.price
  return sessionLookupServices.value.find(service => service.id === id)?.price ?? 0
}
const getBundleName = (id: string): string => allBundles.value.find(bundle => bundle.id === id)?.name ?? id

const calcOriginalPrice = (bundle: BundledService): number => {
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds, ...bundle.addOnIds]
  return ids.reduce((sum, id) => sum + getServicePrice(id), 0)
}

const calcPackageRegularTotal = (item: PackageService | {bundleId?: string; bundleQty: number; machineIds?: string[]; machineItems?: Array<{id: string; qty: number}>; techniqueIds?: string[]; techniqueItems?: Array<{id: string; qty: number}>; evaluationIds: string[]; evaluationItems?: Array<{id: string; qty: number}>; addOnIds?: string[]; addOnItems?: Array<{id: string; qty: number}>; sessionIds?: string[]; sessionItems?: Array<{id: string; qty: number}>}): number => {
  const typed = item as PackageService
  const bundle = typed.bundleId ? allBundles.value.find(entry => entry.id === typed.bundleId) : undefined
  const bundleRegularTotal = Number(bundle?.bundledPrice ?? 0) * Number(typed.bundleQty ?? 1)
  const machineRegularTotal = (typed.machineItems?.length
    ? typed.machineItems
    : (typed.machineIds ?? []).map(id => ({id, qty: Number(typed.machineQty ?? 1)}))
  ).reduce((sum, itemEntry) => sum + (getServicePrice(itemEntry.id) * Number(itemEntry.qty ?? 1)), 0)
  const techniqueRegularTotal = (typed.techniqueItems?.length
    ? typed.techniqueItems
    : (typed.techniqueIds ?? []).map(id => ({id, qty: Number(typed.techniqueQty ?? 1)}))
  ).reduce((sum, itemEntry) => sum + (getServicePrice(itemEntry.id) * Number(itemEntry.qty ?? 1)), 0)
  const evaluationRegularTotal = (typed.evaluationItems?.length
    ? typed.evaluationItems
    : (typed.evaluationIds ?? []).map(id => ({id, qty: Number(typed.evaluationQty ?? 1)}))
  ).reduce((sum, itemEntry) => sum + (getServicePrice(itemEntry.id) * Number(itemEntry.qty ?? 1)), 0)
  const addOnRegularTotal = (typed.addOnItems?.length
    ? typed.addOnItems
    : (typed.addOnIds ?? []).map(id => ({id, qty: Number(typed.addOnQty ?? 1)}))
  ).reduce((sum, itemEntry) => sum + (getServicePrice(itemEntry.id) * Number(itemEntry.qty ?? 1)), 0)
  const sessionRegularTotal = (typed.sessionItems?.length
    ? typed.sessionItems
    : (typed.sessionIds ?? []).map(id => ({id, qty: Number(typed.sessionQty ?? 1)}))
  ).reduce((sum, itemEntry) => sum + (getServicePrice(itemEntry.id) * Number(itemEntry.qty ?? 1)), 0)
  return bundleRegularTotal + machineRegularTotal + techniqueRegularTotal + evaluationRegularTotal + addOnRegularTotal + sessionRegularTotal
}

const getCategoryTotalQty = (
  items?: Array<{id: string; qty: number}>,
  ids?: string[],
  fallbackQty?: number
): number => {
  if ((items ?? []).length > 0) {
    return (items ?? []).reduce((sum, entry) => sum + Number(entry.qty ?? 1), 0)
  }
  return (ids ?? []).length * Number(fallbackQty ?? 1)
}

const bundlePreviewOriginalPrice = computed(() => calcOriginalPrice({
  id: "preview",
  name: "preview",
  machineIds: bundleFormData.machineIds,
  techniqueIds: bundleFormData.techniqueIds,
  evaluationIds: bundleFormData.evaluationIds,
  addOnIds: bundleFormData.addOnIds,
  bundledPrice: bundleFormData.bundledPrice,
  status: bundleFormData.status
}))

const packageRegularTotal = computed(() => calcPackageRegularTotal(packageFormData))

const loadServices = (): void => {
  try {
    allServices.value = readPromosStorageArray<SingleService>(SINGLE_PAY_SERVICES_KEY)
  } catch {
    allServices.value = []
  }
}

const loadBundles = (): void => {
  try {
    allBundles.value = readPromosStorageArray<BundledService>(props.bundleStorageKey)
  } catch {
    allBundles.value = []
  }
}

const loadPackages = (): void => {
  try {
    allPackages.value = readPromosStorageArray<PackageService>(props.packageStorageKey)
  } catch {
    allPackages.value = []
  }
}

const loadSessionLookupServices = async (): Promise<void> => {
  try {
    const {data} = await withRefreshRetry(() =>
      pamsAPI.get<Pageable<OfferLookupDTO>>(`/${OfferResourceKey.SESSIONS}/lookup`, {
        params: {
          page: 1,
          size: 200,
          name: "",
          status: "ACTIVE"
        }
      })
    )
    sessionLookupServices.value = (data.content ?? []).map(item => ({
      id: String(item.id),
      name: item.name,
      price: Number(item.price ?? 0)
    }))
  } catch {
    sessionLookupServices.value = []
    errorToast(toast, "Failed to load recurring PT sessions")
  }
}

const refreshAll = async (): Promise<void> => {
  isLoading.value = true
  try {
    loadServices()
    loadBundles()
    loadPackages()
    await loadSessionLookupServices()
  } finally {
    isLoading.value = false
  }
}

const openAddDialog = (): void => {
  editingId.value = null
  formData.type = "machine"
  formData.name = ""
  formData.price = 0
  formData.status = "Active"
  dialogVisible.value = true
}

const openEditDialog = (service: SingleService): void => {
  editingId.value = service.id
  formData.type = service.type.startsWith("add-on") ? "add-on-machine" : service.type
  formData.name = service.name
  formData.price = service.price
  formData.status = service.status
  dialogVisible.value = true
}

const saveService = (): void => {
  if (!formData.name.trim()) {
    errorToast(toast, "Service name is required")
    return
  }
  if (formData.price < 0) {
    errorToast(toast, "Price must be 0 or greater")
    return
  }

  if (editingId.value) {
    const index = allServices.value.findIndex(service => service.id === editingId.value)
    if (index >= 0) {
      allServices.value[index] = {id: editingId.value, type: formData.type, name: formData.name, price: formData.price, status: formData.status}
    }
  } else {
    allServices.value.push({id: `service-${Date.now()}`, type: formData.type, name: formData.name, price: formData.price, status: formData.status})
  }

  writePromosStorageArray(SINGLE_PAY_SERVICES_KEY, allServices.value)
  dialogVisible.value = false
  successToast(toast, editingId.value ? "Service updated" : "Service added")
}

const confirmDelete = (service: SingleService): void => {
  confirm.require({
    message: `Delete "${service.name}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      allServices.value = allServices.value.filter(entry => entry.id !== service.id)
      writePromosStorageArray(SINGLE_PAY_SERVICES_KEY, allServices.value)
      successToast(toast, "Service deleted")
      refreshAll()
    }
  })
}

const openAddBundleDialog = (): void => {
  editingBundleId.value = null
  bundleFormData.name = ""
  bundleFormData.machineIds = []
  bundleFormData.techniqueIds = []
  bundleFormData.evaluationIds = []
  bundleFormData.addOnIds = []
  bundleFormData.bundledPrice = 0
  bundleFormData.status = "Active"
  bundleDialogVisible.value = true
}

const openEditBundleDialog = (bundle: BundledService): void => {
  editingBundleId.value = bundle.id
  bundleFormData.name = bundle.name
  bundleFormData.machineIds = [...bundle.machineIds]
  bundleFormData.techniqueIds = [...bundle.techniqueIds]
  bundleFormData.evaluationIds = [...bundle.evaluationIds]
  bundleFormData.addOnIds = [...bundle.addOnIds]
  bundleFormData.bundledPrice = bundle.bundledPrice
  bundleFormData.status = bundle.status
  bundleDialogVisible.value = true
}

const saveBundle = (): void => {
  if (!bundleFormData.name.trim()) {
    errorToast(toast, "Bundle name is required")
    return
  }
  const total = bundleFormData.machineIds.length + bundleFormData.techniqueIds.length + bundleFormData.evaluationIds.length
  if (total === 0) {
    errorToast(toast, "Add at least one machine, technique, or evaluation")
    return
  }
  if (bundleFormData.bundledPrice < 0) {
    errorToast(toast, "Bundled price must be 0 or greater")
    return
  }

  if (editingBundleId.value) {
    const index = allBundles.value.findIndex(bundle => bundle.id === editingBundleId.value)
    if (index >= 0) {
      allBundles.value[index] = {
        id: editingBundleId.value,
        name: bundleFormData.name,
        machineIds: [...bundleFormData.machineIds],
        techniqueIds: [...bundleFormData.techniqueIds],
        evaluationIds: [...bundleFormData.evaluationIds],
        addOnIds: [...bundleFormData.addOnIds],
        bundledPrice: bundleFormData.bundledPrice,
        status: bundleFormData.status
      }
    }
  } else {
    allBundles.value.push({
      id: `bundle-${Date.now()}`,
      name: bundleFormData.name,
      machineIds: [...bundleFormData.machineIds],
      techniqueIds: [...bundleFormData.techniqueIds],
      evaluationIds: [...bundleFormData.evaluationIds],
      addOnIds: [...bundleFormData.addOnIds],
      bundledPrice: bundleFormData.bundledPrice,
      status: bundleFormData.status
    })
  }

  writePromosStorageArray(props.bundleStorageKey, allBundles.value)
  bundleDialogVisible.value = false
  successToast(toast, editingBundleId.value ? "Bundle updated" : "Bundle added")
  refreshAll()
}

const confirmDeleteBundle = (bundle: BundledService): void => {
  confirm.require({
    message: `Delete bundle "${bundle.name}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      allBundles.value = allBundles.value.filter(entry => entry.id !== bundle.id)
      writePromosStorageArray(props.bundleStorageKey, allBundles.value)
      successToast(toast, "Bundle deleted")
      refreshAll()
    }
  })
}

const openAddPackageDialog = (): void => {
  editingPackageId.value = null
  packageFormData.name = ""
  packageFormData.bundleId = undefined
  packageFormData.bundleQty = 1
  packageFormData.machineIds = []
  packageFormData.machineItems = []
  packageFormData.techniqueIds = []
  packageFormData.techniqueItems = []
  packageFormData.evaluationIds = []
  packageFormData.evaluationItems = []
  packageFormData.addOnIds = []
  packageFormData.addOnItems = []
  packageFormData.packagePrice = 0
  packageFormData.status = "Active"
  packageDialogVisible.value = true
}

const openEditPackageDialog = (item: PackageService): void => {
  editingPackageId.value = item.id
  packageFormData.name = item.name
  packageFormData.bundleId = item.bundleId
  packageFormData.bundleQty = item.bundleQty
  packageFormData.machineIds = [...(item.machineIds ?? [])]
  packageFormData.machineItems = (item.machineItems?.length
    ? item.machineItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (item.machineIds ?? []).map(id => ({id, qty: Number(item.machineQty ?? 1)}))
  )
  packageFormData.techniqueIds = [...(item.techniqueIds ?? [])]
  packageFormData.techniqueItems = (item.techniqueItems?.length
    ? item.techniqueItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (item.techniqueIds ?? []).map(id => ({id, qty: Number(item.techniqueQty ?? 1)}))
  )
  packageFormData.evaluationIds = [...item.evaluationIds]
  packageFormData.evaluationItems = (item.evaluationItems?.length
    ? item.evaluationItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (item.evaluationIds ?? []).map(id => ({id, qty: Number(item.evaluationQty ?? 1)}))
  )
  packageFormData.addOnIds = [...(item.addOnIds ?? [])]
  packageFormData.addOnItems = (item.addOnItems?.length
    ? item.addOnItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (item.addOnIds ?? []).map(id => ({id, qty: Number(item.addOnQty ?? 1)}))
  )
  packageFormData.sessionIds = [...(item.sessionIds ?? [])]
  packageFormData.sessionItems = (item.sessionItems?.length
    ? item.sessionItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (item.sessionIds ?? []).map(id => ({id, qty: Number(item.sessionQty ?? 1)}))
  )
  packageFormData.packagePrice = item.packagePrice
  packageFormData.status = item.status
  packageDialogVisible.value = true
}

const savePackage = (): void => {
  if (!packageFormData.name.trim()) {
    errorToast(toast, "Package name is required")
    return
  }
  const hasBundle = !!packageFormData.bundleId
  const hasMachine = packageFormData.machineIds.length > 0
  const hasTechnique = packageFormData.techniqueIds.length > 0
  const hasEvaluation = packageFormData.evaluationIds.length > 0
  const hasAddOn = packageFormData.addOnIds.length > 0
  const hasSession = packageFormData.sessionIds.length > 0
  if (!hasBundle && !hasMachine && !hasTechnique && !hasEvaluation && !hasAddOn && !hasSession) {
    errorToast(toast, "Add at least one item from Machine & Modalities, Technique, Evaluations, Add-ons, or Recurring PT Sessions")
    return
  }
  const hasInvalidQty = [
    packageFormData.bundleQty,
    ...packageFormData.machineItems.map(entry => entry.qty),
    ...packageFormData.techniqueItems.map(entry => entry.qty),
    ...packageFormData.evaluationItems.map(entry => entry.qty),
    ...packageFormData.addOnItems.map(entry => entry.qty),
    ...packageFormData.sessionItems.map(entry => entry.qty)
  ].some(value => Number(value) < 1)

  if (hasInvalidQty) {
    errorToast(toast, "Quantities must be at least 1")
    return
  }
  if (packageFormData.packagePrice < 0) {
    errorToast(toast, "Package price must be 0 or greater")
    return
  }

  const payload: PackageService = {
    id: editingPackageId.value ?? `package-${Date.now()}`,
    name: packageFormData.name,
    bundleId: packageFormData.bundleId,
    bundleQty: Number(packageFormData.bundleQty ?? 1),
    machineIds: [...packageFormData.machineIds],
    machineQty: 1,
    machineItems: packageFormData.machineItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)})),
    techniqueIds: [...packageFormData.techniqueIds],
    techniqueQty: 1,
    techniqueItems: packageFormData.techniqueItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)})),
    evaluationIds: [...packageFormData.evaluationIds],
    evaluationQty: 1,
    evaluationItems: packageFormData.evaluationItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)})),
    addOnIds: [...packageFormData.addOnIds],
    addOnQty: 1,
    addOnItems: packageFormData.addOnItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)})),
    sessionIds: [...packageFormData.sessionIds],
    sessionQty: 1,
    sessionItems: packageFormData.sessionItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)})),
    packagePrice: Number(packageFormData.packagePrice ?? 0),
    status: packageFormData.status
  }

  if (editingPackageId.value) {
    const index = allPackages.value.findIndex(item => item.id === editingPackageId.value)
    if (index >= 0) allPackages.value[index] = payload
  } else {
    allPackages.value.push(payload)
  }

  writePromosStorageArray(props.packageStorageKey, allPackages.value)
  packageDialogVisible.value = false
  successToast(toast, editingPackageId.value ? "Package updated" : "Package added")
  refreshAll()
}

const confirmDeletePackage = (item: PackageService): void => {
  confirm.require({
    message: `Delete package "${item.name}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      allPackages.value = allPackages.value.filter(entry => entry.id !== item.id)
      writePromosStorageArray(props.packageStorageKey, allPackages.value)
      successToast(toast, "Package deleted")
      refreshAll()
    }
  })
}

onMounted(() => {
  void refreshAll()
})
</script>
