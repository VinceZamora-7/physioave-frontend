<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Promos And Offers</p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">Single Pay: Single Service Management</h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            Manage individual service items (machines, techniques, evaluations, add-ons) with prices. These items are available for selection when creating Single Pay: Single Service appointments and billings. Home Service add-ons created here will automatically switch an appointment to Home Care when selected.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Add New Service" icon="pi pi-plus" @click="openAddDialog" />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="loadServices" />
        </div>
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">All Available Services</h3>
          <p class="text-xs opacity-70">
            With no filter selected, the catalog stays in a four-column service table. Choose a filter to switch back to the detailed management list for just that service family.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            v-for="option in serviceCatalogFilterOptions"
            :key="option.value"
            :label="option.label"
            size="small"
            :severity="selectedServiceCatalogFilters.includes(option.value) ? 'primary' : 'secondary'"
            :outlined="!selectedServiceCatalogFilters.includes(option.value)"
            @click="toggleServiceCatalogFilter(option.value)"
          />
          <Button
            v-if="hasServiceCatalogFilters"
            label="Show All"
            size="small"
            text
            @click="clearServiceCatalogFilters"
          />
        </div>
      </div>

      <DataTable
        v-if="hasServiceCatalogFilters"
        :value="filteredServiceCatalogItems"
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
              <Button
                size="small"
                text
                icon="pi pi-pencil"
                @click="openEditDialog(data)"
                v-tooltip="'Edit'"
              />
              <Button
                size="small"
                text
                severity="danger"
                icon="pi pi-trash"
                @click="confirmDelete(data)"
                v-tooltip="'Delete'"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <DataTable
        v-else
        :value="serviceCatalogMatrixRows"
        dataKey="key"
        paginator
        :rows="15"
        :loading="isLoading"
        class="rounded-lg border border-[rgb(var(--app-border))]"
      >
        <Column header="Machine">
          <template #body="{data}">
            <div v-if="data.machine" class="space-y-1 rounded-xl border border-sky-200/70 bg-sky-50/60 p-3">
              <div class="font-medium">{{ data.machine.name }}</div>
              <div class="text-xs opacity-70">{{ asCurrency(data.machine.price) }}</div>
              <Tag :value="data.machine.status || 'Active'" :severity="data.machine.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Technique">
          <template #body="{data}">
            <div v-if="data.technique" class="space-y-1 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3">
              <div class="font-medium">{{ data.technique.name }}</div>
              <div class="text-xs opacity-70">{{ asCurrency(data.technique.price) }}</div>
              <Tag :value="data.technique.status || 'Active'" :severity="data.technique.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Evaluation">
          <template #body="{data}">
            <div v-if="data.evaluation" class="space-y-1 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
              <div class="font-medium">{{ data.evaluation.name }}</div>
              <div class="text-xs opacity-70">{{ asCurrency(data.evaluation.price) }}</div>
              <Tag :value="data.evaluation.status || 'Active'" :severity="data.evaluation.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Add-Ons">
          <template #body="{data}">
            <div v-if="data.addOns" class="space-y-1 rounded-xl border border-violet-200/70 bg-violet-50/60 p-3">
              <div class="font-medium">{{ data.addOns.name }}</div>
              <div class="text-xs opacity-70">{{ asCurrency(data.addOns.price) }}</div>
              <Tag :value="data.addOns.status || 'Active'" :severity="data.addOns.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- Bundled Services Section -->
    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Bundled Services</h3>
          <p class="text-xs opacity-70">Create service bundles combining multiple services at a discounted price.</p>
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

    <!-- Add/Edit Dialog -->
    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Edit Service' : 'Add New Service'" modal :style="{width: '480px'}">
      <div class="space-y-3">
        <IftaLabel>
          <Select
            v-model="formData.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <label>Service Type</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="formData.name" fluid :placeholder="serviceNamePlaceholder" />
          <label>Service Name</label>
        </IftaLabel>
        <small class="block opacity-70">{{ serviceTypeGuidance }}</small>

        <Message v-if="formData.type === 'add-on-home-service'" severity="info" :closable="false">
          Use this for travel-based Home Service add-ons like <span class="font-medium">Add-on: Home Service - 1 km</span>. Appointments will treat this type as Home Care automatically.
        </Message>

        <IftaLabel>
          <InputNumber
            v-model="formData.price"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
            :min="0"
          />
          <label>Price</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="formData.status"
            :options="[
              {label: 'Active', value: 'Active'},
              {label: 'Inactive', value: 'Inactive'}
            ]"
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

    <!-- Add/Edit Bundle Dialog -->
    <Dialog v-model:visible="bundleDialogVisible" :header="editingBundleId ? 'Edit Bundle' : 'Add New Bundle'" modal :style="{width: '600px'}">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="bundleFormData.name" fluid placeholder="Enter bundle name" />
          <label>Bundle Name</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect
            v-model="bundleFormData.machineIds"
            :options="allServices.filter(s => s.type === 'machine')"
            optionLabel="name"
            optionValue="id"
            filter
            placeholder="Select machines"
            fluid
          />
          <label>Machines</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect
            v-model="bundleFormData.techniqueIds"
            :options="allServices.filter(s => s.type === 'technique')"
            optionLabel="name"
            optionValue="id"
            filter
            placeholder="Select techniques"
            fluid
          />
          <label>Techniques</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect
            v-model="bundleFormData.evaluationIds"
            :options="allServices.filter(s => s.type === 'evaluation')"
            optionLabel="name"
            optionValue="id"
            filter
            placeholder="Select evaluations"
            fluid
          />
          <label>Evaluations</label>
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
          <InputNumber
            v-model="bundleFormData.bundledPrice"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
            :min="0"
          />
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

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import ConfirmDialog from "primevue/confirmdialog"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import MultiSelect from "primevue/multiselect"
import Tag from "primevue/tag"
import { useConfirm, useToast } from "primevue"
import { errorToast, successToast } from "@/utils/toast.util"
import { pamsAPI } from "@/utils/axios-interceptor"
import {
  BUNDLED_SERVICES_KEY,
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
  addOnIds?: string[]
  bundledPrice: number
  status: string
}

type ServiceCatalogFilter = "machine" | "technique" | "evaluation" | "add-ons"

type ServiceCatalogMatrixRow = {
  key: number
  machine?: SingleService
  technique?: SingleService
  evaluation?: SingleService
  addOns?: SingleService
}

const toast = useToast()
const confirm = useConfirm()
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

const allServices = ref<SingleService[]>([])
const allBundles = ref<BundledService[]>([])
const selectedServiceCatalogFilters = ref<ServiceCatalogFilter[]>([])

// Bundle dialog state
const bundleDialogVisible = ref(false)
const editingBundleId = ref<string | null>(null)
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

const getServiceName = (id: string): string =>
  allServices.value.find(s => s.id === id)?.name ?? id

const calcOriginalPrice = (bundle: BundledService): number => {
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds]
  return ids.reduce((sum, id) => sum + (allServices.value.find(s => s.id === id)?.price ?? 0), 0)
}

const bundlePreviewOriginalPrice = computed(() => {
  const ids = [...bundleFormData.machineIds, ...bundleFormData.techniqueIds, ...bundleFormData.evaluationIds]
  return ids.reduce((sum, id) => sum + (allServices.value.find(s => s.id === id)?.price ?? 0), 0)
})

const typeOptions = [
  { label: "Machine & Modalities", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluations", value: "evaluation" },
  { label: "Add-ons", value: "add-on-machine" },
  { label: "Add-on (Home Service)", value: "add-on-home-service" }
]

const serviceCatalogFilterOptions: Array<{label: string; value: ServiceCatalogFilter}> = [
  { label: "Machine", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluation", value: "evaluation" },
  { label: "Add-Ons", value: "add-ons" }
]

const normalizeServiceCatalogFilter = (type: ServiceType): ServiceCatalogFilter => {
  if (type === "machine") return "machine"
  if (type === "technique") return "technique"
  if (type === "evaluation") return "evaluation"
  return "add-ons"
}

const serviceCatalogBuckets = computed(() => ({
  machine: allServices.value.filter(service => normalizeServiceCatalogFilter(service.type) === "machine"),
  technique: allServices.value.filter(service => normalizeServiceCatalogFilter(service.type) === "technique"),
  evaluation: allServices.value.filter(service => normalizeServiceCatalogFilter(service.type) === "evaluation"),
  "add-ons": allServices.value.filter(service => normalizeServiceCatalogFilter(service.type) === "add-ons")
}))

const hasServiceCatalogFilters = computed(() => selectedServiceCatalogFilters.value.length > 0)

const filteredServiceCatalogItems = computed(() =>
  allServices.value.filter(service => selectedServiceCatalogFilters.value.includes(normalizeServiceCatalogFilter(service.type)))
)

const serviceCatalogMatrixRows = computed<ServiceCatalogMatrixRow[]>(() => {
  const buckets = serviceCatalogBuckets.value
  const maxRows = Math.max(
    buckets.machine.length,
    buckets.technique.length,
    buckets.evaluation.length,
    buckets["add-ons"].length,
    0
  )

  return Array.from({ length: maxRows }, (_, index) => ({
    key: index + 1,
    machine: buckets.machine[index],
    technique: buckets.technique[index],
    evaluation: buckets.evaluation[index],
    addOns: buckets["add-ons"][index]
  }))
})

const toggleServiceCatalogFilter = (filter: ServiceCatalogFilter): void => {
  selectedServiceCatalogFilters.value = selectedServiceCatalogFilters.value.includes(filter)
    ? selectedServiceCatalogFilters.value.filter(entry => entry !== filter)
    : [...selectedServiceCatalogFilters.value, filter]
}

const clearServiceCatalogFilters = (): void => {
  selectedServiceCatalogFilters.value = []
}

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

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const serviceNamePlaceholder = computed(() => {
  if (formData.type === "add-on-home-service") return "Example: Add-on: Home Service - 1 km"
  return "Enter service name"
})

const serviceTypeGuidance = computed(() => {
  if (formData.type === "add-on-home-service") {
    return "Home Service add-ons are used for travel tiers and will mark Appointments as Home Care when selected."
  }
  if (formData.type === "add-on-machine") {
    return "Use this for regular add-ons that should stay under the Add-ons picker."
  }
  return "Choose a clear service name so staff can find it quickly during booking and billing."
})

const formatType = (type: ServiceType): string => {
  const typeMap: Record<ServiceType, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-ons",
    "add-on-technique": "Add-ons",
    "add-on-home-service": "Add-on (Home Service)"
  }
  return typeMap[type] || type
}

const getTypeSeverity = (type: ServiceType): string => {
  const severityMap: Record<ServiceType, string> = {
    machine: "info",
    technique: "success",
    evaluation: "warning",
    "add-on-machine": "secondary",
    "add-on-technique": "secondary",
    "add-on-home-service": "warn"
  }
  return severityMap[type] || "info"
}

const loadServices = async (): Promise<void> => {
  try {
    isLoading.value = true
    allServices.value = readPromosStorageArray<SingleService>(SINGLE_PAY_SERVICES_KEY)
  } catch (error: unknown) {
    errorToast(toast, "Failed to load services")
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
  formData.type = service.type === "add-on-home-service"
    ? "add-on-home-service"
    : service.type.startsWith("add-on")
      ? "add-on-machine"
      : service.type
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
    // Update existing
    const index = allServices.value.findIndex(s => s.id === editingId.value)
    if (index >= 0) {
      allServices.value[index] = {
        id: editingId.value,
        type: formData.type,
        name: formData.name,
        price: formData.price,
        status: formData.status
      }
    }
  } else {
    // Add new
    allServices.value.push({
      id: `service-${Date.now()}`,
      type: formData.type,
      name: formData.name,
      price: formData.price,
      status: formData.status
    })
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
      allServices.value = allServices.value.filter(s => s.id !== service.id)
      writePromosStorageArray(SINGLE_PAY_SERVICES_KEY, allServices.value)
      successToast(toast, "Service deleted")
    }
  })
}

const loadBundles = (): void => {
  try {
    allBundles.value = readPromosStorageArray<BundledService>(BUNDLED_SERVICES_KEY)
  } catch {
    allBundles.value = []
  }
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
  bundleFormData.addOnIds = []
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
    const index = allBundles.value.findIndex(b => b.id === editingBundleId.value)
    if (index >= 0) {
      allBundles.value[index] = {
        id: editingBundleId.value,
        name: bundleFormData.name,
        machineIds: [...bundleFormData.machineIds],
        techniqueIds: [...bundleFormData.techniqueIds],
        evaluationIds: [...bundleFormData.evaluationIds],
        addOnIds: [],
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
      addOnIds: [],
      bundledPrice: bundleFormData.bundledPrice,
      status: bundleFormData.status
    })
  }

  writePromosStorageArray(BUNDLED_SERVICES_KEY, allBundles.value)
  bundleDialogVisible.value = false
  successToast(toast, editingBundleId.value ? "Bundle updated" : "Bundle added")
}

const confirmDeleteBundle = (bundle: BundledService): void => {
  confirm.require({
    message: `Delete bundle "${bundle.name}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      allBundles.value = allBundles.value.filter(b => b.id !== bundle.id)
      writePromosStorageArray(BUNDLED_SERVICES_KEY, allBundles.value)
      successToast(toast, "Bundle deleted")
    }
  })
}

onMounted(() => {
  loadServices()
  loadBundles()
})
</script>
