<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Promos And Offers</p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">Single Pay: Single Service Management</h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            Manage individual service items (machines, techniques, evaluations, add-ons) with prices. These items are available for selection when creating Single Pay: Single Service appointments and billings.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Add New Service" icon="pi pi-plus" @click="openAddDialog" />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="loadServices" />
        </div>
      </div>
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
      </div>
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
          <InputText v-model="formData.name" fluid placeholder="Enter service name" />
          <label>Service Name</label>
        </IftaLabel>

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

        <IftaLabel>
          <MultiSelect
            v-model="bundleFormData.addOnIds"
            :options="allServices.filter(s => s.type.startsWith('add-on'))"
            optionLabel="name"
            optionValue="id"
            filter
            placeholder="Select add-ons (optional)"
            fluid
          />
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
  addOnIds: string[]
  bundledPrice: number
  status: string
}

const toast = useToast()
const confirm = useConfirm()
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

const allServices = ref<SingleService[]>([])
const allBundles = ref<BundledService[]>([])

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
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds, ...bundle.addOnIds]
  return ids.reduce((sum, id) => sum + (allServices.value.find(s => s.id === id)?.price ?? 0), 0)
}

const bundlePreviewOriginalPrice = computed(() => {
  const ids = [...bundleFormData.machineIds, ...bundleFormData.techniqueIds, ...bundleFormData.evaluationIds, ...bundleFormData.addOnIds]
  return ids.reduce((sum, id) => sum + (allServices.value.find(s => s.id === id)?.price ?? 0), 0)
})

const typeOptions = [
  { label: "Machine & Modalities", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluations", value: "evaluation" },
  { label: "Add-Ons", value: "add-on-machine" }
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

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatType = (type: ServiceType): string => {
  const typeMap: Record<ServiceType, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-Ons",
    "add-on-technique": "Add-Ons",
    "add-on-home-service": "Add-Ons"
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
    "add-on-home-service": "secondary"
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
    const index = allBundles.value.findIndex(b => b.id === editingBundleId.value)
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
