<template>
  <main class="app-page-shell space-y-5">
    <!-- Main header -->
    <section v-if="props.showHero" class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Promos And Offers
          </p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">
            {{ props.pageTitle }}
          </h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            {{ props.pageDescription }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            v-if="canCreateService"
            label="Add New Service"
            icon="pi pi-plus"
            @click="openAddDialog"
          />
          <Button
            label="Recycle Bin"
            icon="pi pi-trash"
            outlined
            @click="catalogManagerVisible = true"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            text
            outlined
            @click="loadServices"
          />
        </div>
      </div>
    </section>

    <PromosCatalogManagerDialog v-model:visible="catalogManagerVisible" recycleOnly @refreshed="loadServices" />

    <!-- All available services -->
    <section v-if="props.showServiceCatalog" class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">All Available Services</h3>
          <p class="text-xs opacity-70">
            With no filter selected, the catalog stays in a four‑column service table. Choose a filter
            to switch back to the detailed management list for just that service family.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            :label="showInactiveServices ? 'Show Active' : 'Show Inactive'"
            :icon="showInactiveServices ? 'pi pi-check-circle' : 'pi pi-eye'"
            size="small"
            :severity="showInactiveServices ? 'secondary' : 'warning'"
            :outlined="!showInactiveServices"
            @click="showInactiveServices = !showInactiveServices"
          />
          <Button
            v-for="option in serviceCatalogFilterOptions"
            :key="option.value"
            :label="option.label"
            size="small"
            :severity="
              selectedServiceCatalogFilters.includes(option.value) ? 'primary' : 'secondary'
            "
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

      <!-- Filtered service list -->
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
          <template #body="{ data }">
            <Tag
              :value="formatType(data.type)"
              :severity="getTypeSeverity(data.type)"
            />
          </template>
        </Column>
        <Column field="name" header="Service Name" />
        <Column field="price" header="Price" style="width: 120px">
          <template #body="{ data }">
            {{ asCurrency(data.price) }}
          </template>
        </Column>
        <Column field="status" header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="data.status || 'Active'"
              :severity="data.status === 'Inactive' ? 'danger' : 'success'"
            />
          </template>
        </Column>
        <Column header="Actions" style="width: 100px">
          <template #body="{ data }">
            <div v-if="isLocalEditableService(data)" class="flex gap-1">
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
            <Tag
              v-else
              value="Managed in master data"
              severity="secondary"
              class="text-xs"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Catalog matrix (4‑column view) -->
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
          <template #body="{ data }">
            <div
              v-if="data.machine"
              class="space-y-1 rounded-xl border border-sky-200/70 bg-sky-50/60 p-3"
            >
              <div class="font-medium">{{ data.machine.name }}</div>
              <div class="text-xs opacity-70">
                {{ asCurrency(data.machine.price) }}
              </div>
              <Tag
                :value="data.machine.status || 'Active'"
                :severity="data.machine.status === 'Inactive' ? 'danger' : 'success'"
                class="text-xs"
              />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>

        <Column header="Technique">
          <template #body="{ data }">
            <div
              v-if="data.technique"
              class="space-y-1 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3"
            >
              <div class="font-medium">{{ data.technique.name }}</div>
              <div class="text-xs opacity-70">
                {{ asCurrency(data.technique.price) }}
              </div>
              <Tag
                :value="data.technique.status || 'Active'"
                :severity="data.technique.status === 'Inactive' ? 'danger' : 'success'"
                class="text-xs"
              />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>

        <Column header="Evaluation">
          <template #body="{ data }">
            <div
              v-if="data.evaluation"
              class="space-y-1 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3"
            >
              <div class="font-medium">{{ data.evaluation.name }}</div>
              <div class="text-xs opacity-70">
                {{ asCurrency(data.evaluation.price) }}
              </div>
              <Tag
                :value="data.evaluation.status || 'Active'"
                :severity="data.evaluation.status === 'Inactive' ? 'danger' : 'success'"
                class="text-xs"
              />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>

        <Column header="Add‑Ons">
          <template #body="{ data }">
            <div
              v-if="data.addOns"
              class="space-y-1 rounded-xl border border-violet-200/70 bg-violet-50/60 p-3"
            >
              <div class="font-medium">{{ data.addOns.name }}</div>
              <div class="text-xs opacity-70">
                {{ asCurrency(data.addOns.price) }}
              </div>
              <Tag
                :value="data.addOns.status || 'Active'"
                :severity="data.addOns.status === 'Inactive' ? 'danger' : 'success'"
                class="text-xs"
              />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- Bundled services -->
    <ServiceBundlesManager
      v-if="props.showBundledServices"
      title="Bundled Services"
      description="Create service bundles combining multiple services at a discounted price."
      :can-edit="canCreateService"
      :machine-options="bundleMachineOptions"
      :technique-options="bundleTechniqueOptions"
      :evaluation-options="bundleEvaluationOptions"
      :get-service-name="getServiceName"
      :get-service-price="getServicePrice"
      @refreshed="loadServices"
    />

    <!-- Legacy section kept for reference; replaced by ServiceBundlesManager -->
    <section v-if="false" class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">Bundled Services</h3>
          <p class="text-xs opacity-70">
            Create service bundles combining multiple services at a discounted price.
          </p>
        </div>
        <Button
          v-if="canCreateService"
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
        <Column field="name" header="Bundle Name" />

        <Column header="Machines">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="id in data.machineIds"
                :key="id"
                :value="getServiceName(id)"
                severity="info"
                class="text-xs"
              />
              <span v-if="!data.machineIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>

        <Column header="Techniques">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="id in data.techniqueIds"
                :key="id"
                :value="getServiceName(id)"
                severity="success"
                class="text-xs"
              />
              <span v-if="!data.techniqueIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>

        <Column header="Evaluations">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="id in data.evaluationIds"
                :key="id"
                :value="getServiceName(id)"
                severity="warning"
                class="text-xs"
              />
              <span v-if="!data.evaluationIds.length" class="text-xs opacity-40">—</span>
            </div>
          </template>
        </Column>

        <Column header="Original Price" style="width: 140px">
          <template #body="{ data }">
            <span class="line-through opacity-50 text-xs">
              {{ asCurrency(calcOriginalPrice(data)) }}
            </span>
          </template>
        </Column>

        <Column
          field="bundledPrice"
          header="Bundled Price"
          style="width: 140px"
        >
          <template #body="{ data }">
            <span class="font-semibold text-green-600">
              {{ asCurrency(data.bundledPrice) }}
            </span>
          </template>
        </Column>

        <Column field="status" header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="data.status || 'Active'"
              :severity="data.status === 'Inactive' ? 'danger' : 'success'"
            />
          </template>
        </Column>

        <Column header="Actions" style="width: 100px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                size="small"
                text
                icon="pi pi-pencil"
                @click="openEditBundleDialog(data)"
                v-tooltip="'Edit'"
              />
              <Button
                size="small"
                text
                severity="danger"
                icon="pi pi-trash"
                @click="confirmDeleteBundle(data)"
                v-tooltip="'Delete'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- Add/Edit service dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Edit Service' : 'Add New Service'"
      modal
      :style="{ width: '480px' }"
    >
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

        <IftaLabel v-if="formData.type !== 'add-on-home-service'">
          <InputText
            v-model="formData.name"
            fluid
            :placeholder="serviceNamePlaceholder"
          />
          <label>Service Name</label>
        </IftaLabel>

        <IftaLabel v-else>
          <InputNumber
            v-model="formData.homeServiceStart"
            fluid
            :min="1"
            suffix=" km"
            placeholder="Starting distance"
          />
          <label>Home Service Distance</label>
        </IftaLabel>
        <small class="block opacity-70">{{ serviceTypeGuidance }}</small>

        <Message
          v-if="formData.type === 'add-on-home-service'"
          severity="info"
          :closable="false"
        >
          Use this for travel‑based Home Service add‑ons like
          <span class="font-medium">Add‑on: Home Service - 1 km</span>.
          Appointments will treat this type as Home Care automatically.
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
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' }
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

    <!-- Add/Edit bundle dialog -->
    <Dialog
      v-model:visible="bundleDialogVisible"
      :header="editingBundleId ? 'Edit Bundle' : 'Add New Bundle'"
      modal
      :style="{ width: '600px' }"
    >
      <div class="space-y-3">
        <IftaLabel>
          <InputText
            v-model="bundleFormData.name"
            fluid
            placeholder="Enter bundle name"
          />
          <label>Bundle Name</label>
        </IftaLabel>

        <IftaLabel>
          <MultiSelect
            v-model="bundleFormData.machineIds"
            :options="machineServices"
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
            :options="techniqueServices"
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

        <div
          v-if="bundlePreviewOriginalPrice > 0"
          class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-1 text-sm"
        >
          <div class="flex justify-between text-xs opacity-60">
            <span>Original total</span>
            <span class="line-through">
              {{ asCurrency(bundlePreviewOriginalPrice) }}
            </span>
          </div>

          <div
            v-if="
              bundleFormData.bundledPrice > 0 &&
              bundleFormData.bundledPrice < bundlePreviewOriginalPrice
            "
            class="flex justify-between text-xs text-green-600"
          >
            <span>You save</span>
            <span>
              {{ asCurrency(bundlePreviewOriginalPrice - bundleFormData.bundledPrice) }}
            </span>
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
            :options="[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' }
            ]"
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

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import MultiSelect from "primevue/multiselect"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { errorToast, successToast } from "@/utils/toast.util"

import {
  isLocalEditablePromosService,
  loadBackendPromosMasterCatalog,
  normalizePromosServiceName,
  partitionPromosCustomServices,
  remapLegacyPromosServiceId
} from "@/features/promos-offers/composables/promos-master-catalog.composable"
import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"
import PromosCatalogManagerDialog from "@/features/promos-offers/components/PromosCatalogManagerDialog.vue"
import ServiceBundlesManager from "@/features/promos-offers/components/ServiceBundlesManager.vue"

const props = withDefaults(defineProps<{
  pageTitle?: string
  pageDescription?: string
  showHero?: boolean
  showServiceCatalog?: boolean
  showBundledServices?: boolean
}>(), {
  pageTitle: "Single Pay: Single Service Management",
  pageDescription: "Machines and techniques are synced from their backend master data. Manage evaluations and add-ons with prices here. These items are available for selection when creating Single Pay: Single Service appointments and billings. Home Service add-ons created here will automatically switch an appointment to Home Care when selected.",
  showHero: true,
  showServiceCatalog: true,
  showBundledServices: true,
})

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceType =
  | "machine"
  | "technique"
  | "evaluation"
  | "add-on-machine"
  | "add-on-technique"
  | "add-on-home-service"

interface SingleService {
  id: string
  type: ServiceType
  name: string
  price: number
  status: string
  sourceId?: string
  homeServiceStart?: number
}

interface BundledService {
  id: number
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

// ─── Composables ─────────────────────────────────────────────────────────────

const toast = useToast()
const confirm = useConfirm()

// ─── State ───────────────────────────────────────────────────────────────────

const isLoading = ref(false)
const canCreateService = ref(true) // adjust to your actual permission logic
const catalogManagerVisible = ref(false)

// Single service state
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const customServices = ref<SingleService[]>([])
const machineServices = ref<SingleService[]>([])
const techniqueServices = ref<SingleService[]>([])
const selectedServiceCatalogFilters = ref<ServiceCatalogFilter[]>([])
const showInactiveServices = ref(false)

const formData = reactive<{
  type: ServiceType
  name: string
  price: number
  status: string
  linkedServiceId: string | null
  homeServiceStart: number | null
}>({
  type: "evaluation",
  name: "",
  price: 0,
  status: "Active",
  linkedServiceId: null,
  homeServiceStart: null
})

// Bundle state
const bundleDialogVisible = ref(false)
const editingBundleId = ref<number | null>(null)
const allBundles = ref<BundledService[]>([])
const activeBundles = computed(() => allBundles.value.filter(bundle => bundle.status !== "Inactive"))

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

// ─── Constants ───────────────────────────────────────────────────────────────

const typeOptions = [
  { label: "Machine", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluations", value: "evaluation" },
  { label: "Add-ons", value: "add-on-machine" },
  { label: "Add-on (Home Service)", value: "add-on-home-service" }
]

const serviceCatalogFilterOptions: Array<{ label: string; value: ServiceCatalogFilter }> = [
  { label: "Machine", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluation", value: "evaluation" },
  { label: "Add-Ons", value: "add-ons" }
]

// ─── Computed ─────────────────────────────────────────────────────────────────

const allServices = computed<SingleService[]>(() => [
  ...machineServices.value,
  ...techniqueServices.value,
  ...customServices.value
])

const displayedServices = computed<SingleService[]>(() =>
  allServices.value.filter(service =>
    showInactiveServices.value ? service.status === "Inactive" : service.status !== "Inactive"
  )
)

const hasServiceCatalogFilters = computed(() => selectedServiceCatalogFilters.value.length > 0)

const filteredServiceCatalogItems = computed(() =>
  displayedServices.value.filter(service =>
    selectedServiceCatalogFilters.value.includes(normalizeServiceCatalogFilter(service.type))
  )
)

const serviceCatalogBuckets = computed(() => ({
  machine: displayedServices.value.filter(s => normalizeServiceCatalogFilter(s.type) === "machine"),
  technique: displayedServices.value.filter(s => normalizeServiceCatalogFilter(s.type) === "technique"),
  evaluation: displayedServices.value.filter(s => normalizeServiceCatalogFilter(s.type) === "evaluation"),
  "add-ons": displayedServices.value.filter(s => normalizeServiceCatalogFilter(s.type) === "add-ons")
}))

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

const bundlePreviewOriginalPrice = computed(() => {
  const ids = [
    ...bundleFormData.machineIds,
    ...bundleFormData.techniqueIds,
    ...bundleFormData.evaluationIds
  ]
  return ids.reduce((sum, id) => sum + (allServices.value.find(s => s.id === id)?.price ?? 0), 0)
})

const serviceNamePlaceholder = computed(() => {
  if (formData.type === "machine") return "Example: Ultrasound Machine, Traction Device"
  if (formData.type === "technique") return "Example: Manual Therapy, Hot Compress"
  if (formData.type === "add-on-machine") return "Example: Kinesio Tape, Additional Area"
  return "Enter service name"
})

const serviceTypeGuidance = computed(() => {
  if (formData.type === "machine")
    return "Create a physical therapy machine/equipment that can be assigned to sessions and bundled with techniques."
  if (formData.type === "technique")
    return "Create a treatment technique that can be paired with machines and assigned to sessions."
  if (formData.type === "add-on-home-service")
    return "Enter the starting distance for this travel tier. Appointments will treat this type as Home Care automatically."
  if (formData.type === "add-on-machine")
    return "Create a standalone add-on with its own name and price. It will appear under the Add-ons picker."
  return "Choose a clear service name so staff can find it quickly during booking and billing."
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const getServiceName = (id: string): string =>
  allServices.value.find(s => s.id === id)?.name ?? id

const getServicePrice = (id: string): number =>
  Number(allServices.value.find(s => s.id === id)?.price ?? 0)

const bundleMachineOptions = computed(() =>
  machineServices.value.filter(s => s.status !== "Inactive").map(s => ({ id: s.id, name: s.name }))
)
const bundleTechniqueOptions = computed(() =>
  techniqueServices.value.filter(s => s.status !== "Inactive").map(s => ({ id: s.id, name: s.name }))
)
const bundleEvaluationOptions = computed(() =>
  customServices.value.filter(s => s.type === "evaluation" && s.status !== "Inactive").map(s => ({ id: s.id, name: s.name }))
)

const calcOriginalPrice = (bundle: BundledService): number => {
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds]
  return ids.reduce((sum, id) => sum + (allServices.value.find(s => s.id === id)?.price ?? 0), 0)
}

const normalizeServiceCatalogFilter = (type: ServiceType): ServiceCatalogFilter => {
  if (type === "machine") return "machine"
  if (type === "technique") return "technique"
  if (type === "evaluation") return "evaluation"
  return "add-ons"
}

const formatType = (type: ServiceType): string => {
  const map: Record<ServiceType, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-ons",
    "add-on-technique": "Add-ons",
    "add-on-home-service": "Add-on (Home Service)"
  }
  return map[type] ?? type
}

const getTypeSeverity = (type: ServiceType): string => {
  const map: Record<ServiceType, string> = {
    machine: "info",
    technique: "success",
    evaluation: "warning",
    "add-on-machine": "secondary",
    "add-on-technique": "secondary",
    "add-on-home-service": "warn"
  }
  return map[type] ?? "info"
}

const isLocalEditableService = (service: SingleService): boolean =>
  isLocalEditablePromosService(service)

// ─── Filter actions ───────────────────────────────────────────────────────────

const toggleServiceCatalogFilter = (filter: ServiceCatalogFilter): void => {
  selectedServiceCatalogFilters.value = selectedServiceCatalogFilters.value.includes(filter)
    ? selectedServiceCatalogFilters.value.filter(f => f !== filter)
    : [...selectedServiceCatalogFilters.value, filter]
}

const clearServiceCatalogFilters = (): void => {
  selectedServiceCatalogFilters.value = []
}

// ─── Data loading ─────────────────────────────────────────────────────────────

const remapBundleIdsToBackendCatalog = (
  bundles: BundledService[],
  legacyServices: SingleService[]
): BundledService[] => {
  if (!bundles.length) return bundles

  const machineByName = new Map(
    machineServices.value.map(s => [normalizePromosServiceName(s.name), s.id])
  )
  const techniqueByName = new Map(
    techniqueServices.value.map(s => [normalizePromosServiceName(s.name), s.id])
  )
  const legacyById = new Map(legacyServices.map(s => [s.id, s]))

  const remapIds = (
    ids: string[],
    serviceType: "machine" | "technique",
    backendByName: Map<string, string>
  ): string[] =>
    ids
      .map(id => remapLegacyPromosServiceId(id, serviceType, backendByName, legacyById))
      .filter((id, index, array) => array.indexOf(id) === index)

  return bundles.map(bundle => ({
    ...bundle,
    machineIds: remapIds(bundle.machineIds, "machine", machineByName),
    techniqueIds: remapIds(bundle.techniqueIds, "technique", techniqueByName)
  }))
}

const loadServices = async (): Promise<void> => {
  try {
    isLoading.value = true

    const { machineServices: backendMachines, techniqueServices: backendTechniques } =
      await loadBackendPromosMasterCatalog()
    machineServices.value = backendMachines as SingleService[]
    techniqueServices.value = backendTechniques as SingleService[]

    // DB-backed "custom" services (evaluations + add-ons)
    const [evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes] = await Promise.all([
      pamsAPI.get<Pageable<{ id: number; name: string; price: number; is_active: boolean }>>("/evaluations", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      }),
      pamsAPI.get<Pageable<{ id: number; name: string; machine_id?: number | null; machine_name?: string | null; add_on_price: number; is_active: boolean }>>("/add-on-machines", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      }),
      pamsAPI.get<Pageable<{ id: number; technique_id: number; technique_name: string; add_on_price: number; is_active: boolean }>>("/add-on-techniques", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      }),
      pamsAPI.get<Pageable<{ id: number; start: number; label: string; add_on_price: number; is_active: boolean }>>("/add-on-home-services", {
        params: { page: 1, size: 1000, name: "", status: "ALL" }
      })
    ])

    const evalServices: SingleService[] = (evaluationsRes.data?.content ?? []).map(item => ({
      id: `evaluation-${item.id}`,
      type: "evaluation",
      name: item.name,
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive"
    }))
    const addOnMachineServices: SingleService[] = (addOnMachinesRes.data?.content ?? []).map(item => ({
      id: `add-on-machine-${item.id}`,
      type: "add-on-machine",
      name: `Add-on: ${item.name || item.machine_name || item.id}`,
      price: Number(item.add_on_price ?? 0),
      status: item.is_active ? "Active" : "Inactive"
    }))
    const addOnTechniqueServices: SingleService[] = (addOnTechniquesRes.data?.content ?? []).map(item => ({
      id: `add-on-technique-${item.id}`,
      type: "add-on-technique",
      name: `Add-on: ${item.technique_name}`,
      price: Number(item.add_on_price ?? 0),
      status: item.is_active ? "Active" : "Inactive",
      sourceId: `technique-${item.technique_id}`
    }))
    const addOnHomeServices: SingleService[] = (addOnHomeRes.data?.content ?? []).map(item => ({
      id: `add-on-home-service-${item.id}`,
      type: "add-on-home-service",
      name: item.label,
      price: Number(item.add_on_price ?? 0),
      status: item.is_active ? "Active" : "Inactive",
      homeServiceStart: Number(item.start ?? 0)
    }))

    customServices.value = [...evalServices, ...addOnMachineServices, ...addOnTechniqueServices, ...addOnHomeServices]

    // DB-backed bundles (service_bundle_template + items)
    const { data: bundlePaged } = await pamsAPI.get<Pageable<any>>("/service-bundles", {
      params: { page: 1, size: 500, name: "", status: "ALL" }
    })
    const rows = (bundlePaged?.content ?? []) as Array<Record<string, any>>
    allBundles.value = rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name ?? ""),
      machineIds: (row.machine_ids ?? []).map((id: any) => `machine-${Number(id)}`),
      techniqueIds: (row.technique_ids ?? []).map((id: any) => `technique-${Number(id)}`),
      evaluationIds: (row.evaluation_ids ?? []).map((id: any) => `evaluation-${Number(id)}`),
      addOnIds: [
        ...(row.add_on_machine_ids ?? []).map((id: any) => `add-on-machine-${Number(id)}`),
        ...(row.add_on_technique_ids ?? []).map((id: any) => `add-on-technique-${Number(id)}`),
        ...(row.add_on_home_service_ids ?? []).map((id: any) => `add-on-home-service-${Number(id)}`),
      ],
      bundledPrice: Number(row.bundled_price ?? 0),
      status: String(row.status ?? (row.is_active ? "Active" : "Inactive")),
    }))
  } catch {
    errorToast(toast, "Failed to load services")
  } finally {
    isLoading.value = false
  }
}

// ─── Single service CRUD ──────────────────────────────────────────────────────

const openAddDialog = (): void => {
  editingId.value = null
  formData.type = "evaluation"
  formData.name = ""
  formData.price = 0
  formData.status = "Active"
  formData.linkedServiceId = null
  formData.homeServiceStart = null
  dialogVisible.value = true
}

const openEditDialog = (service: SingleService): void => {
  if (!isLocalEditableService(service)) {
    errorToast(toast, `This ${service.type} is managed in its dedicated master data module.`)
    return
  }
  editingId.value = service.id
  formData.type = service.type
  formData.name = service.name
  formData.price = service.price
  formData.status = service.status
  formData.linkedServiceId = service.sourceId ?? null
  formData.homeServiceStart = service.homeServiceStart ?? null
  dialogVisible.value = true
}

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const saveService = async (): Promise<void> => {
  if (formData.type !== "add-on-home-service" && !formData.name.trim()) {
    errorToast(toast, "Service name is required")
    return
  }
  const price = Number(formData.price ?? 0)
  if (price < 0 || (formData.type.startsWith("add-on") && price <= 0)) {
    errorToast(toast, formData.type.startsWith("add-on") ? "Add-on price must be greater than 0" : "Price must be 0 or greater")
    return
  }
  if (formData.type === "add-on-home-service" && Number(formData.homeServiceStart ?? 0) <= 0) {
    errorToast(toast, "Home Service distance must be greater than 0")
    return
  }
  if (formData.type === "add-on-technique" && !formData.linkedServiceId) {
    errorToast(toast, "This technique-linked add-on is missing its source technique")
    return
  }

  isLoading.value = true
  try {
    const endpoints: Record<ServiceType, string> = {
      machine: "/machines",
      technique: "/techniques",
      evaluation: "/evaluations",
      "add-on-machine": "/add-on-machines",
      "add-on-technique": "/add-on-techniques",
      "add-on-home-service": "/add-on-home-services"
    }

    const endpoint = endpoints[formData.type]
    const payload =
      formData.type === "add-on-machine"
        ? { name: formData.name, price }
        : formData.type === "add-on-technique"
          ? { technique_id: parseNumericId(String(formData.linkedServiceId ?? ""), "technique-"), add_on_price: price }
          : formData.type === "add-on-home-service"
            ? { start: Number(formData.homeServiceStart ?? 0), add_on_price: price }
            : { name: formData.name, price }

    if (editingId.value) {
      const id =
        formData.type === "machine" ? parseNumericId(editingId.value, "machine-")
          : formData.type === "technique" ? parseNumericId(editingId.value, "technique-")
            : formData.type === "evaluation" ? parseNumericId(editingId.value, "evaluation-")
              : formData.type === "add-on-machine" ? parseNumericId(editingId.value, "add-on-machine-")
                : formData.type === "add-on-technique" ? parseNumericId(editingId.value, "add-on-technique-")
                  : parseNumericId(editingId.value, "add-on-home-service-")
      if (!id) throw new Error("Invalid id")
      await pamsAPI.put(`${endpoint}/${id}`, payload)
      successToast(toast, "Service updated")
    } else {
      await pamsAPI.post(`${endpoint}`, payload)
      successToast(toast, "Service added")
    }

    dialogVisible.value = false
    await loadServices()
  } catch {
    errorToast(toast, "Failed to save service")
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = (service: SingleService): void => {
  if (!isLocalEditableService(service)) {
    errorToast(toast, `This ${service.type} is managed in its dedicated master data module.`)
    return
  }
  confirm.require({
    message: `If you proceed, "${service.name}" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      isLoading.value = true
      try {
        const endpoint =
          service.type === "machine" ? "/machines"
            : service.type === "technique" ? "/techniques"
              : service.type === "evaluation" ? "/evaluations"
                : service.type === "add-on-machine" ? "/add-on-machines"
                  : service.type === "add-on-technique" ? "/add-on-techniques"
                    : "/add-on-home-services"
        const id =
          service.type === "machine" ? parseNumericId(service.id, "machine-")
            : service.type === "technique" ? parseNumericId(service.id, "technique-")
              : service.type === "evaluation" ? parseNumericId(service.id, "evaluation-")
                : service.type === "add-on-machine" ? parseNumericId(service.id, "add-on-machine-")
                  : service.type === "add-on-technique" ? parseNumericId(service.id, "add-on-technique-")
                    : parseNumericId(service.id, "add-on-home-service-")
        if (!id) throw new Error("Invalid id")
        await pamsAPI.patch(`${endpoint}/${id}/status`)
        successToast(toast, "Service deactivated")
        await loadServices()
      } catch {
        errorToast(toast, "Failed to update service status")
      } finally {
        isLoading.value = false
      }
    }
  })
}

// ─── Bundle CRUD ──────────────────────────────────────────────────────────────

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

const saveBundle = async (): Promise<void> => {
  if (!bundleFormData.name.trim()) {
    errorToast(toast, "Bundle name is required")
    return
  }
  const total =
    bundleFormData.machineIds.length +
    bundleFormData.techniqueIds.length +
    bundleFormData.evaluationIds.length
  if (total === 0) {
    errorToast(toast, "Add at least one machine, technique, or evaluation")
    return
  }
  if (bundleFormData.bundledPrice < 0) {
    errorToast(toast, "Bundled price must be 0 or greater")
    return
  }

  isLoading.value = true
  try {
    const apiPayload = {
      name: bundleFormData.name,
      bundled_price: Number(bundleFormData.bundledPrice ?? 0),
      machine_ids: [...bundleFormData.machineIds].map((id) => parseNumericId(id, "machine-")).filter(Boolean),
      technique_ids: [...bundleFormData.techniqueIds].map((id) => parseNumericId(id, "technique-")).filter(Boolean),
      evaluation_ids: [...bundleFormData.evaluationIds].map((id) => parseNumericId(id, "evaluation-")).filter(Boolean),
      add_on_machine_ids: ([] as number[]),
      add_on_technique_ids: ([] as number[]),
      add_on_home_service_ids: ([] as number[]),
    }

    if (editingBundleId.value) {
      await pamsAPI.put(`/service-bundles/${editingBundleId.value}`, apiPayload)
      successToast(toast, "Bundle updated")
    } else {
      await pamsAPI.post(`/service-bundles`, apiPayload)
      successToast(toast, "Bundle added")
    }

    bundleDialogVisible.value = false
    await loadServices()
  } catch {
    errorToast(toast, "Failed to save bundle")
  } finally {
    isLoading.value = false
  }
}

const confirmDeleteBundle = (bundle: BundledService): void => {
  confirm.require({
    message: `If you proceed, "${bundle.name}" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      isLoading.value = true
      try {
        await pamsAPI.patch(`/service-bundles/${bundle.id}/status`)
        successToast(toast, "Bundle updated")
        await loadServices()
      } catch {
        errorToast(toast, "Failed to update bundle status")
      } finally {
        isLoading.value = false
      }
    }
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  loadServices()
})
</script>
