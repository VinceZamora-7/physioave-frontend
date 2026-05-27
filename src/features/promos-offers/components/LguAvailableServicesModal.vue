<template>
  <Dialog
    v-model:visible="visible"
    :header="LGU_TABLE_NAMES.services"
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
        <Button
          label="Import Global"
          size="small"
          icon="pi pi-download"
          outlined
          @click="openImportDialog"
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

    <Dialog v-model:visible="importDialogVisible" header="Import from Global" modal :style="{width: '720px'}" :breakpoints="{'760px': '95vw'}">
      <div class="space-y-3">
        <div class="flex flex-wrap items-end gap-2">
          <IftaLabel class="min-w-[220px]">
            <Select v-model="importType" :options="importTypeOptions" optionLabel="label" optionValue="value" fluid />
            <label>Global Catalog</label>
          </IftaLabel>
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            text
            :loading="importLoading"
            @click="loadGlobalImportRows"
          />
        </div>

        <DataTable
          :value="globalImportRows"
          dataKey="id"
          paginator
          :rows="8"
          :loading="importLoading"
          class="rounded-lg border border-[rgb(var(--app-border))]"
        >
          <template #empty>
            <span class="text-sm opacity-70">No global services available.</span>
          </template>
          <Column field="name" header="Service Name" />
          <Column field="price" header="Price" style="width: 130px">
            <template #body="{data}">{{ asCurrency(data.price) }}</template>
          </Column>
          <Column header="Status" style="width: 160px">
            <template #body="{data}">
              <Tag :value="getImportStatusLabel(data)" :severity="getImportStatusSeverity(data)" />
            </template>
          </Column>
          <Column header="Actions" style="width: 120px">
            <template #body="{data}">
              <Button
                label="Import"
                icon="pi pi-download"
                size="small"
                :disabled="!canImportGlobalService(data)"
                :loading="importingGlobalId === data.id"
                @click="importGlobalService(data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

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
import {computed, reactive, ref, watch} from "vue"
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
import type {Pageable} from "@/models/paging"
import {pamsAPI} from "@/utils/axios-interceptor"
import {errorToast, successToast} from "@/utils/toast.util"
import {useLguPromosCatalog} from "@/features/promos-offers/composables/lgu-promos-catalog.composable"
import type {ServiceType, SingleService} from "@/features/promos-offers/composables/lgu-promos-catalog.composable"
import {
  LGU_LOCAL_SERVICE_PREFIXES
} from "@/features/promos-offers/lgu/lgu-module.config"
import {LGU_TABLE_NAMES} from "@/features/promos-offers/lgu/lgu-module.config"
import {
  createLguLocalService,
  toggleLguLocalServiceStatus,
  updateLguLocalService
} from "@/features/promos-offers/lgu/lgu-module.api"

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
type ImportableServiceType = ServiceType

type GlobalImportRow = {
  id: number
  name: string
  price: number
  is_active?: boolean
  add_on_price?: number | null
  machine_id?: number | null
  machine_name?: string | null
  technique_id?: number | null
  technique_name?: string | null
  start?: number | null
  label?: string | null
}

const selectedFilters = ref<ServiceCatalogFilter[]>([])
const hasFilters = computed(() => selectedFilters.value.length > 0)

const serviceCatalogFilterOptions: Array<{label: string; value: ServiceCatalogFilter}> = [
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-Ons", value: "add-ons"},
]

const importTypeOptions: Array<{label: string; value: ImportableServiceType}> = [
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-Ons (Machine)", value: "add-on-machine"},
  {label: "Add-Ons (Technique)", value: "add-on-technique"},
  {label: "Add-Ons (Home Service)", value: "add-on-home-service"},
]

const GLOBAL_IMPORT_ENDPOINTS: Record<ImportableServiceType, string> = {
  machine: "/machines",
  technique: "/techniques",
  evaluation: "/evaluations",
  "add-on-machine": "/add-on-machines",
  "add-on-technique": "/add-on-techniques",
  "add-on-home-service": "/add-on-home-services",
}

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

const isLocalEditable = (_service: SingleService) => true

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
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-Ons (Machine)", value: "add-on-machine"},
  {label: "Add-Ons (Technique)", value: "add-on-technique"},
  {label: "Add-Ons (Home Service)", value: "add-on-home-service"},
]

const importDialogVisible = ref(false)
const importType = ref<ImportableServiceType>("machine")
const importLoading = ref(false)
const importingGlobalId = ref<number | null>(null)
const globalImportRows = ref<GlobalImportRow[]>([])

const normalizeServiceName = (value: string) => value.trim().toLowerCase()

const getGlobalImportName = (row: Partial<GlobalImportRow>) =>
  String(row.name ?? row.machine_name ?? row.technique_name ?? row.label ?? (row.start ? `Add-on: Home Service - ${row.start} km` : "")).trim()

const getGlobalImportPrice = (row: Partial<GlobalImportRow>) => Number(row.price ?? row.add_on_price ?? 0)

const findImportedParent = (type: Extract<ServiceType, "machine" | "technique">, name?: string | null) => {
  const normalizedName = normalizeServiceName(String(name ?? ""))
  if (!normalizedName) return null
  return catalog.allServices.value.find(service =>
    service.type === type && normalizeServiceName(service.name) === normalizedName
  ) ?? null
}

const getLocalServiceNumericId = (service: SingleService | null, type: ServiceType) => {
  if (!service) return 0
  const raw = service.id.startsWith(LGU_LOCAL_SERVICE_PREFIXES[type])
    ? service.id.slice(LGU_LOCAL_SERVICE_PREFIXES[type].length)
    : service.id
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const isAlreadyImported = (row: GlobalImportRow) =>
  catalog.allServices.value.some(service =>
    service.type === importType.value && normalizeServiceName(service.name) === normalizeServiceName(row.name)
  )

const getMissingParentLabel = (row: GlobalImportRow) => {
  if (importType.value === "add-on-machine" && row.machine_name && !findImportedParent("machine", row.machine_name)) {
    return "Import machine first"
  }
  if (importType.value === "add-on-technique" && !findImportedParent("technique", row.technique_name)) {
    return "Import technique first"
  }
  return ""
}

const getImportStatusLabel = (row: GlobalImportRow) => {
  if (isAlreadyImported(row)) return "In LGU"
  return getMissingParentLabel(row) || "Available"
}

const getImportStatusSeverity = (row: GlobalImportRow) => {
  if (isAlreadyImported(row)) return "success"
  if (getMissingParentLabel(row)) return "warning"
  return "secondary"
}

const canImportGlobalService = (row: GlobalImportRow) => !isAlreadyImported(row) && !getMissingParentLabel(row)

const buildGlobalImportPayload = (row: GlobalImportRow): Record<string, unknown> => {
  const price = getGlobalImportPrice(row)

  if (importType.value === "add-on-machine") {
    const parent = findImportedParent("machine", row.machine_name)
    const machineId = getLocalServiceNumericId(parent, "machine")
    return machineId
      ? {machine_id: machineId, add_on_price: price}
      : {name: row.name, add_on_price: price}
  }

  if (importType.value === "add-on-technique") {
    const techniqueId = getLocalServiceNumericId(findImportedParent("technique", row.technique_name), "technique")
    if (!techniqueId) throw new Error("Technique must be imported before its add-on")
    return {technique_id: techniqueId, add_on_price: price}
  }

  if (importType.value === "add-on-home-service") {
    return {start: Number(row.start ?? 0), add_on_price: price}
  }

  return {name: row.name, price}
}

const loadGlobalImportRows = async () => {
  importLoading.value = true
  try {
    const {data} = await catalog.withRefreshRetry(() =>
      pamsAPI.get<Pageable<GlobalImportRow>>(GLOBAL_IMPORT_ENDPOINTS[importType.value], {
        params: {page: 1, size: 1000, name: "", status: "ACTIVE"}
      })
    )

    globalImportRows.value = (data.content ?? []).map(row => ({
      id: Number(row.id),
      name: getGlobalImportName(row),
      price: getGlobalImportPrice(row),
      is_active: Boolean(row.is_active ?? true),
      add_on_price: Number(row.add_on_price ?? row.price ?? 0),
      machine_id: row.machine_id == null ? null : Number(row.machine_id),
      machine_name: row.machine_name ?? null,
      technique_id: row.technique_id == null ? null : Number(row.technique_id),
      technique_name: row.technique_name ?? null,
      start: row.start == null ? null : Number(row.start),
      label: row.label ?? null,
    }))
  } catch {
    globalImportRows.value = []
    errorToast(toast, "Failed to load global services")
  } finally {
    importLoading.value = false
  }
}

const openImportDialog = async () => {
  importDialogVisible.value = true
  if (!loaded.value) {
    await catalog.load()
    loaded.value = true
  }
  await loadGlobalImportRows()
}

const importGlobalService = async (row: GlobalImportRow) => {
  if (!canImportGlobalService(row)) return

  importingGlobalId.value = row.id
  try {
    await catalog.withRefreshRetry(() =>
      createLguLocalService(importType.value, buildGlobalImportPayload(row))
    )
    successToast(toast, `${row.name} imported to LGU`)
    await catalog.load()
    await loadGlobalImportRows()
  } catch {
    errorToast(toast, "Failed to import global service")
  } finally {
    importingGlobalId.value = null
  }
}

watch(importType, () => {
  if (importDialogVisible.value) {
    void loadGlobalImportRows()
  }
})

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
    const payload: Record<string, unknown> = {name: formData.name, price: Number(formData.price ?? 0)}

    if (editingId.value) {
      const id = parseNumericId(editingId.value, LGU_LOCAL_SERVICE_PREFIXES[formData.type])
      if (!id) throw new Error("Invalid id")
      await catalog.withRefreshRetry(() => updateLguLocalService(formData.type, id, payload))
      successToast(toast, "Service updated")
    } else {
      await catalog.withRefreshRetry(() => createLguLocalService(formData.type, payload))
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
        const id = parseNumericId(service.id, LGU_LOCAL_SERVICE_PREFIXES[service.type])
        if (!id) throw new Error("Invalid id")
        await catalog.withRefreshRetry(() => toggleLguLocalServiceStatus(service.type, id))
        successToast(toast, "Service deactivated")
        await catalog.load()
      } catch {
        errorToast(toast, "Failed to update service status")
      }
    },
  })
}
</script>
