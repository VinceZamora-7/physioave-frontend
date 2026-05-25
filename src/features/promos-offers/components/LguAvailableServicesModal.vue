<template>
  <Dialog
    v-model:visible="visible"
    header="All Available Services"
    modal
    maximizable
    :style="{width: '95vw', maxWidth: '1400px'}"
    :breakpoints="{'960px': '95vw'}"
    @show="onShow"
  >
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="option in serviceCatalogFilterOptions"
          :key="option.value"
          :label="option.label"
          size="small"
          :severity="selectedFilters.includes(option.value) ? 'primary' : 'secondary'"
          :outlined="!selectedFilters.includes(option.value)"
          @click="toggleFilter(option.value)"
        />
        <Button
          v-if="hasFilters"
          label="Show All"
          size="small"
          text
          @click="clearFilters"
        />
        <Button
          label="Refresh"
          size="small"
          icon="pi pi-refresh"
          text
          :loading="catalog.isLoading.value"
          @click="catalog.load()"
        />
      </div>

      <p class="text-xs opacity-70">
        With no filter selected, the catalog stays in a four-column service table. Choose a filter to switch back to the detailed management list for just that service family.
      </p>

      <DataTable
        v-if="hasFilters"
        :value="filteredItems"
        dataKey="id"
        paginator
        :rows="10"
        :loading="catalog.isLoading.value"
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
            <div v-if="isLocalEditable(data)" class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEditDialog(data)" v-tooltip="'Edit'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDelete(data)" v-tooltip="'Deactivate'" />
            </div>
            <Tag v-else value="Managed in master data" severity="secondary" class="text-xs" />
          </template>
        </Column>
      </DataTable>

      <DataTable
        v-else
        :value="matrixRows"
        dataKey="key"
        paginator
        :rows="10"
        :loading="catalog.isLoading.value"
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
    </div>

    <!-- Edit Service Dialog -->
    <Dialog v-model:visible="editDialogVisible" :header="editingId ? 'Edit Service' : 'Add New Service'" modal :style="{width: '480px'}">
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
        <Button label="Cancel" text @click="editDialogVisible = false" />
        <Button label="Save" icon="pi pi-check" @click="saveService" :loading="saving" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </Dialog>
</template>

<script setup lang="ts">
import {computed, reactive, ref} from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import ConfirmDialog from "primevue/confirmdialog"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import {useConfirm} from "primevue/useconfirm"
import {useToast} from "primevue/usetoast"
import {pamsAPI} from "@/utils/axios-interceptor"
import {errorToast, successToast} from "@/utils/toast.util"
import {isLocalEditablePromosService} from "@/features/promos-offers/composables/promos-master-catalog.composable"
import {useLguPromosCatalog} from "@/features/promos-offers/composables/lgu-promos-catalog.composable"
import type {ServiceType, SingleService} from "@/features/promos-offers/composables/lgu-promos-catalog.composable"

const visible = defineModel<boolean>("visible", {default: false})

const toast = useToast()
const confirm = useConfirm()
const catalog = useLguPromosCatalog()
const loaded = ref(false)

const onShow = async () => {
  if (!loaded.value) {
    await catalog.load()
    loaded.value = true
  }
}

type ServiceCatalogFilter = "machine" | "technique" | "evaluation" | "add-ons"

const selectedFilters = ref<ServiceCatalogFilter[]>([])
const hasFilters = computed(() => selectedFilters.value.length > 0)

const serviceCatalogFilterOptions: Array<{label: string; value: ServiceCatalogFilter}> = [
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-Ons", value: "add-ons"},
]

const normalizeFilter = (type: ServiceType): ServiceCatalogFilter => {
  if (type === "machine") return "machine"
  if (type === "technique") return "technique"
  if (type === "evaluation") return "evaluation"
  return "add-ons"
}

const toggleFilter = (filter: ServiceCatalogFilter) => {
  selectedFilters.value = selectedFilters.value.includes(filter)
    ? selectedFilters.value.filter(f => f !== filter)
    : [...selectedFilters.value, filter]
}
const clearFilters = () => { selectedFilters.value = [] }

const filteredItems = computed(() =>
  catalog.allServices.value.filter(s => selectedFilters.value.includes(normalizeFilter(s.type)))
)

const matrixRows = computed(() => {
  const machine = catalog.allServices.value.filter(s => normalizeFilter(s.type) === "machine")
  const technique = catalog.allServices.value.filter(s => normalizeFilter(s.type) === "technique")
  const evaluation = catalog.allServices.value.filter(s => normalizeFilter(s.type) === "evaluation")
  const addOns = catalog.allServices.value.filter(s => normalizeFilter(s.type) === "add-ons")
  const maxRows = Math.max(machine.length, technique.length, evaluation.length, addOns.length, 0)
  return Array.from({length: maxRows}, (_, i) => ({
    key: i + 1,
    machine: machine[i],
    technique: technique[i],
    evaluation: evaluation[i],
    addOns: addOns[i],
  }))
})

const isLocalEditable = (service: SingleService) => isLocalEditablePromosService(service)

const asCurrency = (value: number) => Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const formatType = (type: ServiceType): string => ({
  machine: "Machine",
  technique: "Technique",
  evaluation: "Evaluation",
  "add-on-machine": "Add-Ons",
  "add-on-technique": "Add-Ons",
  "add-on-home-service": "Add-Ons",
}[type] ?? type)

const getTypeSeverity = (type: ServiceType): string => ({
  machine: "info",
  technique: "success",
  evaluation: "warning",
  "add-on-machine": "secondary",
  "add-on-technique": "secondary",
  "add-on-home-service": "secondary",
}[type] ?? "info")

const typeOptions = [
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-Ons (Machine)", value: "add-on-machine"},
  {label: "Add-Ons (Technique)", value: "add-on-technique"},
  {label: "Add-Ons (Home Service)", value: "add-on-home-service"},
]

const editDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const formData = reactive<{type: ServiceType; name: string; price: number; status: string}>({
  type: "evaluation",
  name: "",
  price: 0,
  status: "Active",
})

const openEditDialog = (service: SingleService) => {
  if (!isLocalEditable(service)) {
    errorToast(toast, `This ${service.type} is managed in its dedicated master data module.`)
    return
  }
  editingId.value = service.id
  formData.type = service.type.startsWith("add-on") ? "add-on-machine" : service.type as ServiceType
  formData.name = service.name
  formData.price = service.price
  formData.status = service.status
  editDialogVisible.value = true
}

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const saveService = async () => {
  if (!formData.name.trim()) { errorToast(toast, "Service name is required"); return }
  if (formData.price < 0) { errorToast(toast, "Price must be 0 or greater"); return }

  saving.value = true
  try {
    const endpoints: Record<ServiceType, string> = {
      machine: "/machines",
      technique: "/techniques",
      evaluation: "/lgu-evaluations",
      "add-on-machine": "/add-on-machines",
      "add-on-technique": "/add-on-techniques",
      "add-on-home-service": "/add-on-home-services",
    }
    const endpoint = endpoints[formData.type]
    const payload: Record<string, unknown> = {name: formData.name, price: Number(formData.price ?? 0)}

    if (editingId.value) {
      const prefixMap: Record<ServiceType, string> = {
        machine: "machine-", technique: "technique-", evaluation: "evaluation-",
        "add-on-machine": "add-on-machine-", "add-on-technique": "add-on-technique-",
        "add-on-home-service": "add-on-home-service-",
      }
      const id = parseNumericId(editingId.value, prefixMap[formData.type])
      if (!id) throw new Error("Invalid id")
      await catalog.withRefreshRetry(() => pamsAPI.put(`${endpoint}/${id}`, payload))
      successToast(toast, "Service updated")
    } else {
      await catalog.withRefreshRetry(() => pamsAPI.post(endpoint, payload))
      successToast(toast, "Service added")
    }

    editDialogVisible.value = false
    await catalog.load()
  } catch {
    errorToast(toast, "Failed to save service")
  } finally {
    saving.value = false
  }
}

const confirmDelete = (service: SingleService) => {
  if (!isLocalEditable(service)) {
    errorToast(toast, `This ${service.type} is managed in its dedicated master data module.`)
    return
  }
  confirm.require({
    message: `If you proceed, "${service.name}" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        const endpointMap: Record<ServiceType, string> = {
          machine: "/machines", technique: "/techniques", evaluation: "/lgu-evaluations",
          "add-on-machine": "/add-on-machines", "add-on-technique": "/add-on-techniques",
          "add-on-home-service": "/add-on-home-services",
        }
        const prefixMap: Record<ServiceType, string> = {
          machine: "machine-", technique: "technique-", evaluation: "evaluation-",
          "add-on-machine": "add-on-machine-", "add-on-technique": "add-on-technique-",
          "add-on-home-service": "add-on-home-service-",
        }
        const endpoint = endpointMap[service.type]
        const id = parseNumericId(service.id, prefixMap[service.type])
        if (!id) throw new Error("Invalid id")
        await catalog.withRefreshRetry(() => pamsAPI.patch(`${endpoint}/${id}/status`))
        successToast(toast, "Service deactivated")
        await catalog.load()
      } catch {
        errorToast(toast, "Failed to update service status")
      }
    },
  })
}
</script>
