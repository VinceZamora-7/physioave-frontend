<template>
  <Dialog
    v-model:visible="visibleProxy"
    modal
    :style="{ width: 'min(1100px, 96vw)' }"
    :header="props.recycleOnly ? 'Recycle Bin' : 'Manage Catalog'"
  >
    <div class="space-y-4">
      <div v-if="!props.recycleOnly" class="flex flex-wrap items-center gap-2">
        <Button
          :label="'Services'"
          size="small"
          :severity="activeSection === 'services' ? 'primary' : 'secondary'"
          :outlined="activeSection !== 'services'"
          @click="activeSection = 'services'"
        />
        <Button
          :label="'Bundles'"
          size="small"
          :severity="activeSection === 'bundles' ? 'primary' : 'secondary'"
          :outlined="activeSection !== 'bundles'"
          @click="activeSection = 'bundles'"
        />

        <div class="flex-1" />

        <Button
          label="Recycle Bin"
          icon="pi pi-trash"
          size="small"
          outlined
          @click="recycleVisible = true"
        />
        <Button label="Refresh" icon="pi pi-refresh" size="small" text outlined @click="refreshAll" />
      </div>

      <div v-else class="flex items-center justify-between gap-2">
        <p class="m-0 text-sm opacity-70">Inactive records live here. Restore to make them active again.</p>
        <Button label="Refresh" icon="pi pi-refresh" size="small" text outlined @click="refreshAll" />
      </div>

      <section v-if="!props.recycleOnly && activeSection === 'services'" class="space-y-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div class="space-y-1">
            <h3 class="text-sm font-semibold">Service Masters</h3>
            <p class="text-xs opacity-70">Shared catalog used across Self Pay, Package, HMO, and LGU modules.</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              v-if="canCreateService"
              label="Add Service"
              icon="pi pi-plus"
              size="small"
              @click="openAddServiceDialog"
            />
            <Button
              v-for="option in serviceFilterOptions"
              :key="option.value"
              :label="option.label"
              size="small"
              :severity="selectedServiceFilters.includes(option.value) ? 'primary' : 'secondary'"
              :outlined="!selectedServiceFilters.includes(option.value)"
              @click="toggleServiceFilter(option.value)"
            />
            <Button
              v-if="selectedServiceFilters.length"
              label="Show All"
              size="small"
              text
              @click="selectedServiceFilters = []"
            />
          </div>
        </div>

        <DataTable
          :value="filteredServices"
          dataKey="id"
          paginator
          :rows="25"
          :loading="isLoadingServices"
          class="rounded-lg border border-[rgb(var(--app-border))]"
        >
          <template #empty>
            <p class="m-0 text-sm opacity-70">No services found.</p>
          </template>

          <Column field="type" header="Type" style="width: 140px">
            <template #body="{ data }">
              <Tag :value="formatType(data.type)" :severity="getTypeSeverity(data.type)" />
            </template>
          </Column>
          <Column field="name" header="Service Name" />
          <Column field="price" header="Price" style="width: 140px">
            <template #body="{ data }">{{ asCurrency(data.price) }}</template>
          </Column>
          <Column field="status" header="Status" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
            </template>
          </Column>
          <Column header="Actions" style="width: 110px">
            <template #body="{ data }">
              <div v-if="canUpdateService" class="flex gap-1">
                <Button size="small" text icon="pi pi-pencil" @click="openEditServiceDialog(data)" v-tooltip="'Edit'" />
                <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeactivateService(data)" v-tooltip="'Deactivate'" />
              </div>
              <span v-else class="text-xs opacity-50">Read-only</span>
            </template>
          </Column>
        </DataTable>
      </section>

      <section v-else-if="!props.recycleOnly" class="space-y-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div class="space-y-1">
            <h3 class="text-sm font-semibold">Service Bundles</h3>
            <p class="text-xs opacity-70">Reusable bundles referenced by Packages, HMO, and LGU offers.</p>
          </div>
          <Button v-if="canCreateBundle" label="Add Bundle" icon="pi pi-plus" size="small" @click="openAddBundleDialog" />
        </div>

        <DataTable
          :value="activeBundles"
          dataKey="id"
          paginator
          :rows="20"
          :loading="isLoadingBundles"
          class="rounded-lg border border-[rgb(var(--app-border))]"
        >
          <template #empty>
            <p class="m-0 text-sm opacity-70">No bundles found.</p>
          </template>

          <Column field="name" header="Bundle Name" />
          <Column field="status" header="Status" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
            </template>
          </Column>
          <Column header="Actions" style="width: 110px">
            <template #body="{ data }">
              <div v-if="canUpdateBundle" class="flex gap-1">
                <Button size="small" text icon="pi pi-pencil" @click="openEditBundleDialog(data)" v-tooltip="'Edit'" />
                <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeactivateBundle(data)" v-tooltip="'Deactivate'" />
              </div>
              <span v-else class="text-xs opacity-50">Read-only</span>
            </template>
          </Column>
        </DataTable>
      </section>
    </div>

    <Dialog v-model:visible="serviceDialogVisible" :header="editingServiceId ? 'Edit Service' : 'Add Service'" modal :style="{ width: '480px' }">
      <div class="space-y-3">
        <IftaLabel>
          <Select
            v-model="serviceForm.type"
            :options="serviceTypeOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <label>Service Type</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="serviceForm.name" fluid />
          <label>Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber
            v-model="serviceForm.price"
            :min="0"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
          />
          <label>Price</label>
        </IftaLabel>

        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" text @click="serviceDialogVisible = false" />
          <Button :label="editingServiceId ? 'Save' : 'Create'" icon="pi pi-check" @click="saveService" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="bundleDialogVisible" :header="editingBundleId ? 'Edit Bundle' : 'Add Bundle'" modal :style="{ width: '520px' }">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="bundleForm.name" fluid />
          <label>Bundle Name</label>
        </IftaLabel>

        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" text @click="bundleDialogVisible = false" />
          <Button :label="editingBundleId ? 'Save' : 'Create'" icon="pi pi-check" @click="saveBundle" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="recycleVisible" header="Recycle Bin" modal :style="{ width: 'min(1050px, 96vw)' }">
      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <Button
            label="Services"
            size="small"
            :severity="recycleSection === 'services' ? 'primary' : 'secondary'"
            :outlined="recycleSection !== 'services'"
            @click="recycleSection = 'services'"
          />
          <Button
            label="Bundles"
            size="small"
            :severity="recycleSection === 'bundles' ? 'primary' : 'secondary'"
            :outlined="recycleSection !== 'bundles'"
            @click="recycleSection = 'bundles'"
          />
          <Button
            label="Packages"
            size="small"
            :severity="recycleSection === 'packages' ? 'primary' : 'secondary'"
            :outlined="recycleSection !== 'packages'"
            @click="recycleSection = 'packages'"
          />

          <div class="flex-1" />

          <Button label="Refresh" icon="pi pi-refresh" size="small" text outlined @click="refreshAll" />
        </div>

        <section v-if="recycleSection === 'services'" class="space-y-3">
          <DataTable
            :value="inactiveServices"
            dataKey="id"
            paginator
            :rows="25"
            :loading="isLoadingServices"
            class="rounded-lg border border-[rgb(var(--app-border))]"
          >
            <template #empty>
              <p class="m-0 text-sm opacity-70">No inactive services.</p>
            </template>

            <Column field="type" header="Type" style="width: 140px">
              <template #body="{ data }">
                <Tag :value="formatType(data.type)" :severity="getTypeSeverity(data.type)" />
              </template>
            </Column>
            <Column field="name" header="Service Name" />
            <Column field="price" header="Price" style="width: 140px">
              <template #body="{ data }">{{ asCurrency(data.price) }}</template>
            </Column>
            <Column header="Actions" style="width: 120px">
              <template #body="{ data }">
                <Button
                  v-if="canUpdateService"
                  size="small"
                  icon="pi pi-undo"
                  label="Restore"
                  @click="restoreService(data)"
                />
                <span v-else class="text-xs opacity-50">Read-only</span>
              </template>
            </Column>
          </DataTable>
        </section>

        <section v-else-if="recycleSection === 'bundles'" class="space-y-3">
          <DataTable
            :value="inactiveBundles"
            dataKey="id"
            paginator
            :rows="20"
            :loading="isLoadingBundles"
            class="rounded-lg border border-[rgb(var(--app-border))]"
          >
            <template #empty>
              <p class="m-0 text-sm opacity-70">No inactive bundles.</p>
            </template>

            <Column field="name" header="Bundle Name" />
            <Column header="Actions" style="width: 120px">
              <template #body="{ data }">
                <Button
                  v-if="canUpdateBundle"
                  size="small"
                  icon="pi pi-undo"
                  label="Restore"
                  @click="restoreBundle(data)"
                />
                <span v-else class="text-xs opacity-50">Read-only</span>
              </template>
            </Column>
          </DataTable>
        </section>

        <section v-else class="space-y-3">
          <DataTable
            :value="inactivePackages"
            dataKey="id"
            paginator
            :rows="20"
            :loading="isLoadingPackages"
            class="rounded-lg border border-[rgb(var(--app-border))]"
          >
            <template #empty>
              <p class="m-0 text-sm opacity-70">No inactive packages.</p>
            </template>

            <Column field="name" header="Package Name" />
            <Column field="status" header="Status" style="width: 120px">
              <template #body="{ data }">
                <Tag :value="data.status || 'Inactive'" severity="danger" />
              </template>
            </Column>
            <Column header="Actions" style="width: 120px">
              <template #body="{ data }">
                <Button
                  v-if="canUpdateBundle"
                  size="small"
                  icon="pi pi-undo"
                  label="Restore"
                  @click="restorePackage(data)"
                />
                <span v-else class="text-xs opacity-50">Read-only</span>
              </template>
            </Column>
          </DataTable>
        </section>
      </div>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import IftaLabel from "primevue/iftalabel"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast } from "@/utils/toast.util"
import { loadBackendPromosMasterCatalog } from "@/features/promos-offers/composables/promos-master-catalog.composable"
import { useAuthSessionStore } from "@/stores/auth-session.store"

type ServiceType =
  | "machine"
  | "technique"
  | "evaluation"
  | "add-on-machine"
  | "add-on-technique"
  | "add-on-home-service"

type ServiceFilter = "machine" | "technique" | "evaluation" | "add-ons"

type BundleRow = { id: number; name: string; status: "Active" | "Inactive" }
type PackageRow = { id: number; name: string; status: "Active" | "Inactive" }

type CatalogServiceRow = {
  id: string
  type: ServiceType
  name: string
  price: number
  status: "Active" | "Inactive"
}

type Pageable<T> = { content: T[] }

interface Props {
  visible: boolean
  recycleOnly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  "update:visible": [value: boolean]
  refreshed: []
}>()

const visibleProxy = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
})

const toast = useToast()
const confirm = useConfirm()
const authSession = useAuthSessionStore()
const { roleName } = storeToRefs(authSession)

const activeSection = ref<"services" | "bundles">("services")
const recycleVisible = ref(false)
const recycleSection = ref<"services" | "bundles" | "packages">("services")
// Main list should only show Active records (inactive are visible via Recycle Bin).
const activeOnly = ref(true)

const canCreateService = computed(() =>
  authSession.hasAnyPermission("Service::CREATE") ||
  /owner/i.test(roleName.value)
)
const canUpdateService = computed(() =>
  authSession.hasAnyPermission("Service::UPDATE", "Service::DELETE") ||
  /owner/i.test(roleName.value)
)

const canCreateBundle = computed(() =>
  authSession.hasAnyPermission("ServiceBundle::CREATE", "ServiceBundle::UPDATE") ||
  /owner/i.test(roleName.value)
)
const canUpdateBundle = computed(() =>
  authSession.hasAnyPermission("ServiceBundle::UPDATE", "ServiceBundle::DELETE") ||
  /owner/i.test(roleName.value)
)

const isLoadingServices = ref(false)
const isLoadingBundles = ref(false)
const isLoadingPackages = ref(false)

const selectedServiceFilters = ref<ServiceFilter[]>([])
const serviceFilterOptions: Array<{ label: string; value: ServiceFilter }> = [
  { label: "Machine", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluation", value: "evaluation" },
  { label: "Add-Ons", value: "add-ons" }
]

const toggleServiceFilter = (filter: ServiceFilter): void => {
  selectedServiceFilters.value = selectedServiceFilters.value.includes(filter)
    ? selectedServiceFilters.value.filter(entry => entry !== filter)
    : [...selectedServiceFilters.value, filter]
}

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatType = (type: ServiceType): string => {
  const typeMap: Record<ServiceType, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-on (Machine)",
    "add-on-technique": "Add-on (Technique)",
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
    "add-on-home-service": "secondary"
  }
  return severityMap[type] || "info"
}

const normalizeServiceFilter = (type: ServiceType): ServiceFilter => {
  if (type === "machine") return "machine"
  if (type === "technique") return "technique"
  if (type === "evaluation") return "evaluation"
  return "add-ons"
}

const services = ref<CatalogServiceRow[]>([])
const filteredServices = computed(() => {
  const base = activeOnly.value ? services.value.filter(s => s.status !== "Inactive") : services.value
  if (!selectedServiceFilters.value.length) return base
  return base.filter(service => selectedServiceFilters.value.includes(normalizeServiceFilter(service.type)))
})

const inactiveServices = computed(() => services.value.filter(s => s.status === "Inactive"))

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const loadServices = async (): Promise<void> => {
  isLoadingServices.value = true
  try {
    const { machineServices, techniqueServices } = await loadBackendPromosMasterCatalog()

    const results = await Promise.allSettled([
      pamsAPI.get<Pageable<{ id: number; name: string; price: number; is_active: boolean }>>("/evaluations", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      }),
      pamsAPI.get<Pageable<{ id: number; name: string; price: number; is_active: boolean }>>("/add-on-machines", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      }),
      pamsAPI.get<Pageable<{ id: number; name: string; price: number; is_active: boolean }>>("/add-on-techniques", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      }),
      pamsAPI.get<Pageable<{ id: number; name: string; price: number; is_active: boolean }>>("/add-on-home-services", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      })
    ])

    const getContent = <T,>(idx: number): T[] => {
      const res = results[idx]
      if (res?.status !== "fulfilled") return []
      return (res.value.data?.content ?? []) as T[]
    }

    const evalServices: CatalogServiceRow[] = getContent<{ id: number; name: string; price: number; is_active: boolean }>(0).map(item => ({
      id: `evaluation-${item.id}`,
      type: "evaluation",
      name: item.name,
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive"
    }))
    const addOnMachineServices: CatalogServiceRow[] = getContent<{ id: number; name: string; price: number; is_active: boolean }>(1).map(item => ({
      id: `add-on-machine-${item.id}`,
      type: "add-on-machine",
      name: item.name,
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive"
    }))
    const addOnTechniqueServices: CatalogServiceRow[] = getContent<{ id: number; name: string; price: number; is_active: boolean }>(2).map(item => ({
      id: `add-on-technique-${item.id}`,
      type: "add-on-technique",
      name: item.name,
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive"
    }))
    const addOnHomeServices: CatalogServiceRow[] = getContent<{ id: number; name: string; price: number; is_active: boolean }>(3).map(item => ({
      id: `add-on-home-service-${item.id}`,
      type: "add-on-home-service",
      name: item.name,
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive"
    }))

    services.value = [
      ...(machineServices as unknown as CatalogServiceRow[]),
      ...(techniqueServices as unknown as CatalogServiceRow[]),
      ...evalServices,
      ...addOnMachineServices,
      ...addOnTechniqueServices,
      ...addOnHomeServices
    ]
  } catch {
    services.value = []
    errorToast(toast, "Failed to load services catalog")
  } finally {
    isLoadingServices.value = false
  }
}

const bundles = ref<BundleRow[]>([])
const inactiveBundles = computed(() => bundles.value.filter(b => b.status === "Inactive"))
const activeBundles = computed(() => bundles.value.filter(b => b.status !== "Inactive"))

const packages = ref<PackageRow[]>([])
const inactivePackages = computed(() => packages.value.filter(p => p.status === "Inactive"))
const loadBundles = async (): Promise<void> => {
  isLoadingBundles.value = true
  try {
    const res = await pamsAPI.get<Pageable<{ id: number; name: string; is_active: boolean }>>("/service-bundles", {
      params: { page: 1, size: 1000, name: "", status: "ALL" }
    })
    bundles.value = (res.data?.content ?? []).map(row => ({
      id: Number(row.id),
      name: row.name,
      status: row.is_active ? "Active" : "Inactive"
    }))
  } catch {
    bundles.value = []
    errorToast(toast, "Failed to load bundles")
  } finally {
    isLoadingBundles.value = false
  }
}

const loadPackages = async (): Promise<void> => {
  isLoadingPackages.value = true
  try {
    const res = await pamsAPI.get<Pageable<{ id: number; name: string; is_active: boolean }>>("/package-service-offers", {
      params: { page: 1, size: 1000, name: "", status: "ALL" }
    })
    packages.value = (res.data?.content ?? []).map(row => ({
      id: Number(row.id),
      name: row.name,
      status: row.is_active ? "Active" : "Inactive"
    }))
  } catch {
    packages.value = []
    errorToast(toast, "Failed to load packages")
  } finally {
    isLoadingPackages.value = false
  }
}

const refreshAll = async (): Promise<void> => {
  await authSession.ensureLoaded()
  await Promise.all([loadServices(), loadBundles(), loadPackages()])
  emit("refreshed")
}

// Service CRUD
const serviceDialogVisible = ref(false)
const editingServiceId = ref<string | null>(null)

const serviceTypeOptions: Array<{ label: string; value: ServiceType }> = [
  { label: "Machine", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluation", value: "evaluation" },
  { label: "Add-on (Machine)", value: "add-on-machine" },
  { label: "Add-on (Technique)", value: "add-on-technique" },
  { label: "Add-on (Home Service)", value: "add-on-home-service" }
]

const serviceForm = reactive<{ type: ServiceType; name: string; price: number }>({
  type: "evaluation",
  name: "",
  price: 0
})

const openAddServiceDialog = (): void => {
  editingServiceId.value = null
  serviceForm.type = "evaluation"
  serviceForm.name = ""
  serviceForm.price = 0
  serviceDialogVisible.value = true
}

const openEditServiceDialog = (row: CatalogServiceRow): void => {
  editingServiceId.value = row.id
  serviceForm.type = row.type
  serviceForm.name = row.name
  serviceForm.price = Number(row.price ?? 0)
  serviceDialogVisible.value = true
}

const saveService = async (): Promise<void> => {
  if (!serviceForm.name.trim()) {
    errorToast(toast, "Service name is required")
    return
  }
  if (serviceForm.price < 0) {
    errorToast(toast, "Price must be 0 or greater")
    return
  }

  const endpoints: Record<ServiceType, string> = {
    machine: "/machines",
    technique: "/techniques",
    evaluation: "/evaluations",
    "add-on-machine": "/add-on-machines",
    "add-on-technique": "/add-on-techniques",
    "add-on-home-service": "/add-on-home-services"
  }

  try {
    isLoadingServices.value = true
    const payload = { name: serviceForm.name, price: Number(serviceForm.price ?? 0) }
    const endpoint = endpoints[serviceForm.type]

    if (editingServiceId.value) {
      const id =
        serviceForm.type === "machine" ? parseNumericId(editingServiceId.value, "machine-")
          : serviceForm.type === "technique" ? parseNumericId(editingServiceId.value, "technique-")
            : serviceForm.type === "evaluation" ? parseNumericId(editingServiceId.value, "evaluation-")
              : serviceForm.type === "add-on-machine" ? parseNumericId(editingServiceId.value, "add-on-machine-")
                : serviceForm.type === "add-on-technique" ? parseNumericId(editingServiceId.value, "add-on-technique-")
                  : parseNumericId(editingServiceId.value, "add-on-home-service-")
      if (!id) throw new Error("Invalid id")
      await pamsAPI.put(`${endpoint}/${id}`, payload)
      successToast(toast, "Service updated")
    } else {
      await pamsAPI.post(endpoint, payload)
      successToast(toast, "Service created")
    }

    serviceDialogVisible.value = false
    await loadServices()
  } catch {
    errorToast(toast, "Failed to save service")
  } finally {
    isLoadingServices.value = false
  }
}

const confirmDeactivateService = (row: CatalogServiceRow): void => {
  if (!canUpdateService.value) return

  confirm.require({
    message: `If you proceed, \"${row.name}\" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        isLoadingServices.value = true
        const endpoints: Record<ServiceType, string> = {
          machine: "/machines",
          technique: "/techniques",
          evaluation: "/evaluations",
          "add-on-machine": "/add-on-machines",
          "add-on-technique": "/add-on-techniques",
          "add-on-home-service": "/add-on-home-services"
        }
        const endpoint = endpoints[row.type]
        const id =
          row.type === "machine" ? parseNumericId(row.id, "machine-")
            : row.type === "technique" ? parseNumericId(row.id, "technique-")
              : row.type === "evaluation" ? parseNumericId(row.id, "evaluation-")
                : row.type === "add-on-machine" ? parseNumericId(row.id, "add-on-machine-")
                  : row.type === "add-on-technique" ? parseNumericId(row.id, "add-on-technique-")
                    : parseNumericId(row.id, "add-on-home-service-")
        if (!id) throw new Error("Invalid id")
        await pamsAPI.patch(`${endpoint}/${id}/status`)
        successToast(toast, "Service updated")
        await loadServices()
      } catch {
        errorToast(toast, "Failed to update service status")
      } finally {
        isLoadingServices.value = false
      }
    }
  })
}

const restoreService = async (row: CatalogServiceRow): Promise<void> => {
  if (!canUpdateService.value) return
  try {
    isLoadingServices.value = true
    const endpoints: Record<ServiceType, string> = {
      machine: "/machines",
      technique: "/techniques",
      evaluation: "/evaluations",
      "add-on-machine": "/add-on-machines",
      "add-on-technique": "/add-on-techniques",
      "add-on-home-service": "/add-on-home-services"
    }
    const endpoint = endpoints[row.type]
    const id =
      row.type === "machine" ? parseNumericId(row.id, "machine-")
        : row.type === "technique" ? parseNumericId(row.id, "technique-")
          : row.type === "evaluation" ? parseNumericId(row.id, "evaluation-")
            : row.type === "add-on-machine" ? parseNumericId(row.id, "add-on-machine-")
              : row.type === "add-on-technique" ? parseNumericId(row.id, "add-on-technique-")
                : parseNumericId(row.id, "add-on-home-service-")
    if (!id) throw new Error("Invalid id")
    await pamsAPI.patch(`${endpoint}/${id}/status`)
    successToast(toast, "Service restored")
    await loadServices()
  } catch {
    errorToast(toast, "Failed to restore service")
  } finally {
    isLoadingServices.value = false
  }
}

// Bundle CRUD (name only here; items are still managed in the bundle builders)
const bundleDialogVisible = ref(false)
const editingBundleId = ref<number | null>(null)
const bundleForm = reactive<{ name: string }>({ name: "" })

const openAddBundleDialog = (): void => {
  editingBundleId.value = null
  bundleForm.name = ""
  bundleDialogVisible.value = true
}

const openEditBundleDialog = (row: BundleRow): void => {
  editingBundleId.value = row.id
  bundleForm.name = row.name
  bundleDialogVisible.value = true
}

const saveBundle = async (): Promise<void> => {
  if (!bundleForm.name.trim()) {
    errorToast(toast, "Bundle name is required")
    return
  }

  try {
    isLoadingBundles.value = true
    const payload = { name: bundleForm.name }
    if (editingBundleId.value) {
      await pamsAPI.put(`/service-bundles/${editingBundleId.value}`, payload)
      successToast(toast, "Bundle updated")
    } else {
      await pamsAPI.post(`/service-bundles`, payload)
      successToast(toast, "Bundle created")
    }
    bundleDialogVisible.value = false
    await loadBundles()
  } catch {
    errorToast(toast, "Failed to save bundle")
  } finally {
    isLoadingBundles.value = false
  }
}

const confirmDeactivateBundle = (row: BundleRow): void => {
  if (!canUpdateBundle.value) return
  confirm.require({
    message: `If you proceed, \"${row.name}\" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        isLoadingBundles.value = true
        await pamsAPI.patch(`/service-bundles/${row.id}/status`)
        successToast(toast, "Bundle updated")
        await loadBundles()
      } catch {
        errorToast(toast, "Failed to update bundle status")
      } finally {
        isLoadingBundles.value = false
      }
    }
  })
}

const restoreBundle = async (row: BundleRow): Promise<void> => {
  if (!canUpdateBundle.value) return
  try {
    isLoadingBundles.value = true
    await pamsAPI.patch(`/service-bundles/${row.id}/status`)
    successToast(toast, "Bundle restored")
    await loadBundles()
  } catch {
    errorToast(toast, "Failed to restore bundle")
  } finally {
    isLoadingBundles.value = false
  }
}

const restorePackage = async (row: PackageRow): Promise<void> => {
  if (!canUpdateBundle.value) return
  try {
    isLoadingPackages.value = true
    await pamsAPI.patch(`/package-service-offers/${row.id}/status`)
    successToast(toast, "Package restored")
    await loadPackages()
  } catch {
    errorToast(toast, "Failed to restore package")
  } finally {
    isLoadingPackages.value = false
  }
}

watch(visibleProxy, (next) => {
  if (!next) return
  if (props.recycleOnly) {
    recycleVisible.value = true
  }
  void refreshAll()
})
</script>
