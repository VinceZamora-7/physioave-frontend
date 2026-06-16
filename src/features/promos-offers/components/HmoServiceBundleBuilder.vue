<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner space-y-3">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-fg))]/50">Promos And Offers</p>
          <h1 class="text-xl font-semibold tracking-tight text-[rgb(var(--app-fg))]">HMO Service Management</h1>
          <p class="max-w-3xl text-sm leading-6 text-[rgb(var(--app-fg))]/70">
            Machines and techniques are synced from backend master data. Manage HMO-specific evaluation and add-on entries here. Changes here are reflected in Self Pay: Single Service as well.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button v-if="canManageCatalog" label="Add New HMO Service" icon="pi pi-plus" :pt="ptPrimaryBtn" @click="openAddDialog" />
          <Button
            label="Recycle Bin"
            icon="pi pi-trash"
            outlined
            @click="catalogManagerVisible = true"
          />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="loadServices" />
        </div>
      </div>
    </section>

    <PromosCatalogManagerDialog v-model:visible="catalogManagerVisible" recycleOnly @refreshed="loadServices" />

    <HmoRecentTransactionsCard />

    <section v-if="!canViewConfidentialRates" class="app-section-card-comfy">
      <p class="text-sm font-medium text-amber-700">
        Negotiated HMO rates are hidden for your role.
      </p>
      <p class="mt-1 text-xs opacity-70">
        Contact COO/Operations Manager for pricing concerns.
      </p>
    </section>

    <section v-if="canViewConfidentialRates" class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="app-section-title">HMO Profiles &amp; Custom Price Lists</h3>
          <p class="text-sm opacity-70">Create an HMO profile and upload a CSV price list so staff can use in-app negotiated rates.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button label="Create HMO Profile" icon="pi pi-id-card" outlined @click="openProfileDialog" />
          <Button label="Add Custom Rate" icon="pi pi-plus" text :disabled="!selectedProfileId" @click="openAddRateDialog" />
          <Button label="Download CSV Template" icon="pi pi-download" text @click="downloadTemplate" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <IftaLabel>
          <Select
            v-model="selectedProfileId"
            :options="activeProfiles"
            optionLabel="name"
            optionValue="id"
            showClear
            filter
            fluid
            placeholder="Select HMO profile"
          />
          <label>Active HMO Profile</label>
        </IftaLabel>

        <div class="flex flex-wrap gap-2 items-end">
          <input ref="fileInputRef" type="file" accept=".csv,text/csv" class="hidden" @change="onSelectPriceListFile" />
          <Button label="Upload Price List CSV" icon="pi pi-upload" :disabled="!selectedProfileId" @click="openFilePicker" />
          <Button label="Clear Uploaded List" icon="pi pi-trash" text severity="danger" :disabled="!selectedProfileId || !selectedProfileRates.length" @click="clearSelectedProfilePriceList" />
        </div>
      </div>

      <small v-if="selectedProfileName" class="opacity-70">Current profile: <strong>{{ selectedProfileName }}</strong> | Uploaded custom rates: {{ selectedProfileRates.length }}</small>
    </section>

    <section v-if="canViewConfidentialRates" class="app-section-card-comfy space-y-3">
      <div class="space-y-1">
        <h3 class="app-section-title">Custom Rates For Selected Profile</h3>
        <p class="text-sm opacity-70">Maintain custom negotiated rates manually without CSV upload.</p>
      </div>

      <DataTable
        :value="selectedProfileRates"
        dataKey="serviceName"
        paginator
        :rows="10"
        class="rounded-lg border border-[rgb(var(--app-border))]"
      >
        <template #empty>
          <p class="m-0 text-sm opacity-70">No custom rates found for this profile.</p>
        </template>
        <Column header="Service" style="min-width: 240px">
          <template #body="{data}">{{ getRateServiceLabel(data) }}</template>
        </Column>
        <Column field="rate" header="Custom Rate" style="width: 160px">
          <template #body="{data}">{{ asCurrency(data.rate) }}</template>
        </Column>
        <Column header="Actions" style="width: 120px">
          <template #body="{data}">
            <div class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEditRateDialog(data, selectedProfileRates.findIndex(item => item.serviceId === data.serviceId))" v-tooltip="'Edit rate'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeleteRate(data)" v-tooltip="'Delete rate'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="app-section-card-comfy">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h3 class="app-section-title">All Available HMO Services</h3>
          <p class="text-sm opacity-70">View the full catalog of machines, techniques, evaluations, and add-ons.</p>
        </div>
        <Button label="View Catalog" icon="pi pi-table" outlined @click="serviceCatalogVisible = true" />
      </div>
    </section>

    <Dialog
      v-model:visible="serviceCatalogVisible"
      header="All Available HMO Services"
      modal
      :style="{width: '92vw', maxWidth: '1200px'}"
      :pt="{content: {class: 'space-y-4'}}"
    >
      <div class="flex flex-wrap gap-2 pb-1">
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

      <p class="text-xs opacity-70 -mt-1">
        With no filter selected, the catalog shows a four-column overview. Choose a filter to switch to the detailed management list for that service family.
      </p>

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
        <Column v-if="canViewConfidentialRates" field="price" header="Base Price" style="width: 130px">
          <template #body="{data}">{{ asCurrency(data.price) }}</template>
        </Column>
        <Column v-if="canViewConfidentialRates" header="Custom HMO Rate" style="width: 140px">
          <template #body="{data}">
            {{ getCustomRateLabel(data) }}
          </template>
        </Column>
        <Column v-if="canViewConfidentialRates" header="Effective Rate" style="width: 140px">
          <template #body="{data}">
            <strong>{{ asCurrency(getEffectivePrice(data)) }}</strong>
          </template>
        </Column>
        <Column v-else header="Rate" style="width: 140px">
          <template #body>
            Hidden
          </template>
        </Column>
        <Column field="status" header="Status" style="width: 100px">
          <template #body="{data}">
            <Tag :value="data.status || 'Active'" :severity="data.status === 'Inactive' ? 'danger' : 'success'" />
          </template>
        </Column>
        <Column v-if="canViewConfidentialRates" header="Actions" style="width: 100px">
          <template #body="{data}">
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
            <Tag v-else value="Managed in master data" severity="secondary" class="text-xs" />
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
              <div v-if="canViewConfidentialRates" class="text-xs opacity-70">Base: {{ asCurrency(data.machine.price) }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs font-medium">Effective: {{ asCurrency(getEffectivePrice(data.machine)) }}</div>
              <div v-else class="text-xs opacity-70">Rates hidden</div>
              <Tag :value="data.machine.status || 'Active'" :severity="data.machine.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Technique">
          <template #body="{data}">
            <div v-if="data.technique" class="space-y-1 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3">
              <div class="font-medium">{{ data.technique.name }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs opacity-70">Base: {{ asCurrency(data.technique.price) }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs font-medium">Effective: {{ asCurrency(getEffectivePrice(data.technique)) }}</div>
              <div v-else class="text-xs opacity-70">Rates hidden</div>
              <Tag :value="data.technique.status || 'Active'" :severity="data.technique.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Evaluation">
          <template #body="{data}">
            <div v-if="data.evaluation" class="space-y-1 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
              <div class="font-medium">{{ data.evaluation.name }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs opacity-70">Base: {{ asCurrency(data.evaluation.price) }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs font-medium">Effective: {{ asCurrency(getEffectivePrice(data.evaluation)) }}</div>
              <div v-else class="text-xs opacity-70">Rates hidden</div>
              <Tag :value="data.evaluation.status || 'Active'" :severity="data.evaluation.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
        <Column header="Add-Ons">
          <template #body="{data}">
            <div v-if="data.addOns" class="space-y-1 rounded-xl border border-violet-200/70 bg-violet-50/60 p-3">
              <div class="font-medium">{{ data.addOns.name }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs opacity-70">Base: {{ asCurrency(data.addOns.price) }}</div>
              <div v-if="canViewConfidentialRates" class="text-xs font-medium">Effective: {{ asCurrency(getEffectivePrice(data.addOns)) }}</div>
              <div v-else class="text-xs opacity-70">Rates hidden</div>
              <Tag :value="data.addOns.status || 'Active'" :severity="data.addOns.status === 'Inactive' ? 'danger' : 'success'" class="text-xs" />
            </div>
            <span v-else class="text-xs opacity-40">—</span>
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button label="Close" icon="pi pi-times" text @click="serviceCatalogVisible = false" />
      </template>
    </Dialog>

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Edit HMO Service' : 'Add New HMO Service'" modal :style="{width: '480px'}">
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
          <InputText v-model="formData.name" fluid placeholder="Enter HMO service name" />
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
          <label>Negotiated Price</label>
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

    <Dialog v-model:visible="profileDialogVisible" header="Create HMO Profile" modal :style="{width: '460px'}">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="profileForm.name" fluid placeholder="e.g. Maxicare Corporate A" />
          <label>Profile Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="profileForm.code" fluid placeholder="e.g. MAXI-CORP-A" />
          <label>Profile Code (optional)</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="profileDialogVisible = false" />
        <Button label="Save Profile" icon="pi pi-check" @click="saveProfile" />
      </template>
    </Dialog>

    <Dialog v-model:visible="rateDialogVisible" :header="editingRateIndex == null ? 'Add Custom Rate' : 'Edit Custom Rate'" modal :style="{width: '520px'}">
      <div class="space-y-3">
        <IftaLabel>
          <Select
            v-model="rateForm.serviceId"
            :options="machineRateOptions"
            optionLabel="name"
            optionValue="id"
            showClear
            filter
            fluid
            placeholder="Select service from catalog (optional)"
            @update:modelValue="onRateServiceSelected"
          />
          <label>Catalog Service</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="rateForm.serviceName" fluid placeholder="Enter service name" />
          <label>Service Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber
            v-model="rateForm.rate"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
            :min="0"
          />
          <label>Custom Rate</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="rateDialogVisible = false" />
        <Button label="Save Rate" icon="pi pi-check" @click="saveRate" />
      </template>
    </Dialog>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useQueryClient } from "@tanstack/vue-query"
import { storeToRefs } from "pinia"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { hmoMachineRateService } from "@/services/hmo-machine-rate.service"
import { hmoService } from "@/services/hmo.service"
import { Status } from "@/utils/global.type"
import { errorToast, successToast } from "@/utils/toast.util"
import PromosCatalogManagerDialog from "@/features/promos-offers/components/PromosCatalogManagerDialog.vue"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import { isLocalEditablePromosService } from "@/features/promos-offers/composables/promos-master-catalog.composable"
import { pamsAPI } from "@/utils/axios-interceptor"
import HmoRecentTransactionsCard from "@/features/promos-offers/components/HmoRecentTransactionsCard.vue"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { serviceCatalogContextTanstackService } from "@/features/services/queries/service-catalog-context.tanstack.service"
import { ServiceCatalogTanstackKey } from "@/utils/keys/tanstack-key"
import type { ServiceCatalogItem } from "@/features/services/api/service-catalog-context.service"

type ServiceType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

interface HmoService {
  id: string
  type: ServiceType
  name: string
  price: number
  status: string
}

interface HmoProfile {
  id: string
  name: string
  code?: string
  status: "Active" | "Inactive"
}

interface HmoPriceListRate {
  serviceId?: string
  serviceName: string
  rate: number
}

type ServiceCatalogFilter = "machine" | "technique" | "evaluation" | "add-ons"

type ServiceCatalogMatrixRow = {
  key: number
  machine?: HmoService
  technique?: HmoService
  evaluation?: HmoService
  addOns?: HmoService
}

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()
const authSession = useAuthSessionStore()
const { roleName } = storeToRefs(authSession)

const catalogManagerVisible = ref(false)
const serviceCatalogVisible = ref(false)
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const profileDialogVisible = ref(false)
const rateDialogVisible = ref(false)
const editingRateIndex = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const PRIVILEGED_ROLE_KEYWORDS = [
  "chief operations officer",
  "coo",
  "operations manager",
  "owner"
]

const customServices = ref<HmoService[]>([])
const machineServices = ref<HmoService[]>([])
const techniqueServices = ref<HmoService[]>([])
const allServices = computed<HmoService[]>(() => [
  ...machineServices.value,
  ...techniqueServices.value,
  ...customServices.value
])
const machineCatalog = ref<Array<{ id: number; name: string; price: number }>>([])
const hmoProfiles = ref<HmoProfile[]>([])
const selectedProfileId = ref<string>()
const selectedProfileRates = ref<HmoPriceListRate[]>([])
const selectedServiceCatalogFilters = ref<ServiceCatalogFilter[]>([])

const profileForm = reactive<{
  name: string
  code: string
}>({
  name: "",
  code: ""
})

const rateForm = reactive<{
  serviceId?: string
  serviceName: string
  rate: number
}>({
  serviceId: undefined,
  serviceName: "",
  rate: 0
})

const activeProfiles = computed(() =>
  hmoProfiles.value.filter(profile => profile.status === "Active")
)

const selectedProfileName = computed(() =>
  activeProfiles.value.find(profile => profile.id === selectedProfileId.value)?.name
)

const machineRateOptions = computed(() =>
  machineCatalog.value.map(machine => ({
    id: String(machine.id),
    name: machine.name,
    price: machine.price
  }))
)

const selectedProfileRateMap = computed(() => {
  const map = new Map<string, number>()
  selectedProfileRates.value.forEach(rate => {
    if (rate.serviceId) map.set(`id:${rate.serviceId}`, rate.rate)
    map.set(`name:${rate.serviceName.trim().toLowerCase()}`, rate.rate)
  })
  return map
})

const canViewConfidentialRates = computed(() => {
  const normalized = roleName.value.trim().toLowerCase()
  if (!normalized) return false
  return PRIVILEGED_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const canManageCatalog = computed(() => {
  if (/owner/i.test(roleName.value)) return true
  return authSession.hasAnyPermission(
    "Service::CREATE",
    "Service::UPDATE",
    "Service::DELETE"
  )
})

const ensureConfidentialAccess = (): boolean => {
  if (canViewConfidentialRates.value) return true
  errorToast(toast, "Confidential negotiated HMO rates are restricted to COO/Operations Manager")
  return false
}

const invalidateSelectedProfileRates = async (): Promise<void> => {
  const hmoId = Number(selectedProfileId.value)
  if (!Number.isFinite(hmoId) || hmoId <= 0) return
  await queryClient.invalidateQueries({queryKey: [ServiceCatalogTanstackKey.SERVICE_CATALOG_CONTEXT, "HMO", hmoId]})
}

const typeOptions = [
  { label: "Machine", value: "machine" },
  { label: "Technique", value: "technique" },
  { label: "Evaluations", value: "evaluation" },
  { label: "Add-Ons", value: "add-on-machine" }
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

const isLocalEditableService = (service: HmoService): boolean => isLocalEditablePromosService(service)

const formData = reactive<{
  type: ServiceType
  name: string
  price: number
  status: string
}>({
  type: "evaluation",
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

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const catalogItemToHmoService = (type: ServiceType, item: ServiceCatalogItem): HmoService => ({
  id: `${type}-${item.id}`,
  type,
  name: item.name,
  price: Number(item.price ?? item.effective_price ?? 0),
  status: item.is_active ? "Active" : "Inactive"
})

const invalidateGlobalServiceCatalog = async (): Promise<void> => {
  await queryClient.invalidateQueries({queryKey: [ServiceCatalogTanstackKey.SERVICE_CATALOG_CONTEXT, "GLOBAL", null]})
}

const loadServices = async (): Promise<void> => {
  try {
    isLoading.value = true
    const context = await serviceCatalogContextTanstackService.fetchContext(queryClient, {scope: "GLOBAL"})
    machineServices.value = (context?.services.machines ?? []).map(item => catalogItemToHmoService("machine", item))
    techniqueServices.value = (context?.services.techniques ?? []).map(item => catalogItemToHmoService("technique", item))
    customServices.value = [
      ...(context?.services.evaluations ?? []).map(item => catalogItemToHmoService("evaluation", item)),
      ...(context?.services.add_on_machines ?? []).map(item => catalogItemToHmoService("add-on-machine", item)),
      ...(context?.services.add_on_techniques ?? []).map(item => catalogItemToHmoService("add-on-technique", item)),
      ...(context?.services.add_on_home_services ?? []).map(item => catalogItemToHmoService("add-on-home-service", item)),
    ]
  } catch {
    machineServices.value = []
    techniqueServices.value = []
    customServices.value = []
    errorToast(toast, "Failed to load HMO services")
  } finally {
    isLoading.value = false
  }
}

const loadMachineCatalog = async (): Promise<void> => {
  try {
    const context = await serviceCatalogContextTanstackService.fetchContext(queryClient, {scope: "GLOBAL"})
    machineCatalog.value = (context?.services.machines ?? [])
      .filter(machine => machine.is_active)
      .map(machine => ({
        id: Number(machine.id),
        name: machine.name,
        price: Number(machine.price ?? 0)
      }))
  } catch {
    machineCatalog.value = []
  }
}

const loadSelectedProfileRates = async (): Promise<void> => {
  if (!selectedProfileId.value) {
    selectedProfileRates.value = []
    return
  }

  const hmoId = Number(selectedProfileId.value)
  if (!Number.isFinite(hmoId) || hmoId <= 0) {
    selectedProfileRates.value = []
    return
  }

  const catalogContext = await serviceCatalogContextTanstackService.fetchContext(queryClient, {scope: "HMO", hmo_id: hmoId})
  selectedProfileRates.value = (catalogContext?.services.machines ?? [])
    .filter(machine => machine.hmo_rate != null)
    .map(machine => ({
      serviceId: String(machine.id),
      serviceName: machine.name,
      rate: Number(machine.hmo_rate)
    }))
}

const loadProfilesAndRates = async (): Promise<void> => {
  const paged = await hmoService.getAllLookup({
    page: 1,
    size: 1000,
    name: "",
    status: Status.ACTIVE
  })

  hmoProfiles.value = (paged?.content ?? []).map(profile => ({
    id: String(profile.id),
    name: profile.name,
    status: "Active"
  }))

  if (!selectedProfileId.value || !hmoProfiles.value.some(profile => profile.id === selectedProfileId.value)) {
    selectedProfileId.value = hmoProfiles.value[0]?.id
  }

  await loadSelectedProfileRates()
}

const openProfileDialog = (): void => {
  if (!ensureConfidentialAccess()) return
  profileForm.name = ""
  profileForm.code = ""
  profileDialogVisible.value = true
}

const saveProfile = async (): Promise<void> => {
  if (!ensureConfidentialAccess()) return
  const name = profileForm.name.trim()
  if (!name) {
    errorToast(toast, "Profile name is required")
    return
  }

  const exists = hmoProfiles.value.some(profile => profile.name.trim().toLowerCase() === name.toLowerCase())
  if (exists) {
    errorToast(toast, "Profile name already exists")
    return
  }

  await hmoService.save({ name })
  await loadProfilesAndRates()
  const created = hmoProfiles.value.find(profile => profile.name.trim().toLowerCase() === name.toLowerCase())
  if (created) {
    selectedProfileId.value = created.id
    await loadSelectedProfileRates()
  }
  profileDialogVisible.value = false
  successToast(toast, "HMO profile created")
}

const getRateServiceLabel = (rate: HmoPriceListRate): string => {
  if (rate.serviceId) {
    const matched = allServices.value.find(service => service.id === rate.serviceId)
    if (matched?.name) return matched.name
  }
  return rate.serviceName
}

const onRateServiceSelected = (serviceId?: string): void => {
  if (!serviceId) return
  const matched = machineCatalog.value.find(service => String(service.id) === serviceId)
  if (matched) {
    rateForm.serviceName = matched.name
  }
}

const openAddRateDialog = (): void => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) {
    errorToast(toast, "Select an HMO profile first")
    return
  }
  editingRateIndex.value = null
  rateForm.serviceId = undefined
  rateForm.serviceName = ""
  rateForm.rate = 0
  rateDialogVisible.value = true
}

const openEditRateDialog = (rate: HmoPriceListRate, index: number): void => {
  if (!ensureConfidentialAccess()) return
  editingRateIndex.value = index
  rateForm.serviceId = rate.serviceId
  rateForm.serviceName = rate.serviceName
  rateForm.rate = rate.rate
  rateDialogVisible.value = true
}

const saveRate = async (): Promise<void> => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) {
    errorToast(toast, "Select an HMO profile first")
    return
  }

  if (!rateForm.serviceId) {
    errorToast(toast, "Select a machine from the catalog")
    return
  }

  const serviceName = rateForm.serviceName.trim()
  if (!serviceName) {
    errorToast(toast, "Service name is required")
    return
  }
  if (rateForm.rate < 0) {
    errorToast(toast, "Custom rate must be 0 or greater")
    return
  }

  const machineId = Number(rateForm.serviceId)
  if (!Number.isFinite(machineId) || machineId <= 0) {
    errorToast(toast, "Selected machine is invalid")
    return
  }

  const matchedMachine = machineCatalog.value.find(machine => machine.id === machineId)
  if (!matchedMachine) {
    errorToast(toast, "Selected machine is not available")
    return
  }

  await hmoMachineRateService.upsert(Number(selectedProfileId.value), machineId, Number(rateForm.rate))
  await invalidateSelectedProfileRates()
  await loadSelectedProfileRates()
  rateDialogVisible.value = false
  successToast(toast, editingRateIndex.value == null ? "Custom rate added" : "Custom rate updated")
}

const confirmDeleteRate = (rate: HmoPriceListRate): void => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) return
  confirm.require({
    message: `Delete custom rate for "${getRateServiceLabel(rate)}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      const machineId = Number(rate.serviceId)
      if (!Number.isFinite(machineId) || machineId <= 0) {
        errorToast(toast, "Selected custom rate cannot be deleted")
        return
      }

      await hmoMachineRateService.remove(Number(selectedProfileId.value), machineId)
      await invalidateSelectedProfileRates()
      await loadSelectedProfileRates()
      successToast(toast, "Custom rate deleted")
    }
  })
}

const openFilePicker = (): void => {
  if (!ensureConfidentialAccess()) return
  fileInputRef.value?.click()
}

const parseCsvRow = (line: string): string[] => {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

const toRate = (raw: string): number | undefined => {
  const normalized = raw.replace(/[^\d.-]/g, "")
  const value = Number(normalized)
  return Number.isFinite(value) ? value : undefined
}

const onSelectPriceListFile = async (event: Event): Promise<void> => {
  if (!ensureConfidentialAccess()) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!selectedProfileId.value) {
    errorToast(toast, "Select an HMO profile first")
    return
  }

  try {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) {
      errorToast(toast, "CSV must include a header row and at least one data row")
      return
    }

    const headers = parseCsvRow(lines[0]).map(header => header.trim().toLowerCase())
    const serviceNameIndex = headers.findIndex(header => ["service", "service_name", "name"].includes(header))
    const priceIndex = headers.findIndex(header => ["rate", "price", "hmo_rate", "negotiated_rate"].includes(header))

    if (serviceNameIndex < 0 || priceIndex < 0) {
      errorToast(toast, "CSV headers must include service_name (or name) and rate (or price)")
      return
    }

    const uploadedRates: Array<{ machineId: number; rate: number }> = []
    let skippedCount = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i])
      const serviceName = String(cols[serviceNameIndex] ?? "").trim()
      const rate = toRate(String(cols[priceIndex] ?? ""))
      if (!serviceName || rate == null || rate < 0) {
        skippedCount++
        continue
      }

      const service = machineCatalog.value.find(item => item.name.trim().toLowerCase() === serviceName.toLowerCase())
      if (!service) {
        skippedCount++
        continue
      }

      uploadedRates.push({ machineId: service.id, rate })
    }

    if (!uploadedRates.length) {
      errorToast(toast, "No valid rows found in CSV")
      return
    }

    await Promise.all(
      uploadedRates.map((entry) =>
        hmoMachineRateService.upsert(Number(selectedProfileId.value), entry.machineId, entry.rate)
      )
    )
    await invalidateSelectedProfileRates()
    await loadSelectedProfileRates()

    if (skippedCount > 0) {
      successToast(toast, `Price list uploaded (${uploadedRates.length} rows). Skipped ${skippedCount} invalid row(s).`)
    } else {
      successToast(toast, `Price list uploaded (${uploadedRates.length} rows).`)
    }
  } catch {
    errorToast(toast, "Failed to parse CSV")
  } finally {
    input.value = ""
  }
}

const clearSelectedProfilePriceList = async (): Promise<void> => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) return

  try {
    const deleteTasks = selectedProfileRates.value
      .map(rate => Number(rate.serviceId))
      .filter(machineId => Number.isFinite(machineId) && machineId > 0)
      .map(machineId => hmoMachineRateService.remove(Number(selectedProfileId.value), machineId))

    await Promise.all(deleteTasks)
    await invalidateSelectedProfileRates()
    await loadSelectedProfileRates()
    successToast(toast, "Custom price list cleared")
  } catch {
    errorToast(toast, "Failed to clear custom price list")
  }
}

const getCustomRate = (service: HmoService): number | undefined => {
  const byId = selectedProfileRateMap.value.get(`id:${service.id}`)
  if (byId != null) return byId

  if (service.type === "machine" && service.id.startsWith("machine-")) {
    const machineId = service.id.replace("machine-", "")
    const byMachineId = selectedProfileRateMap.value.get(`id:${machineId}`)
    if (byMachineId != null) return byMachineId
  }

  const normalizedName = (service.name ?? "").trim().toLowerCase()
  if (!normalizedName) return undefined
  return selectedProfileRateMap.value.get(`name:${normalizedName}`)
}

const getCustomRateLabel = (service: HmoService): string => {
  const custom = getCustomRate(service)
  if (custom == null) return "-"
  return asCurrency(custom)
}

const getEffectivePrice = (service: HmoService): number => {
  return getCustomRate(service) ?? service.price
}

const downloadTemplate = (): void => {
  if (!ensureConfidentialAccess()) return
  const csv = "service_name,rate\nSample Evaluation,1200\nSample Technique,800\n"
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "hmo-price-list-template.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

const openAddDialog = (): void => {
  if (!canManageCatalog.value) {
    errorToast(toast, "You don't have access to manage the service catalog.")
    return
  }
  editingId.value = null
  formData.type = "evaluation"
  formData.name = ""
  formData.price = 0
  formData.status = "Active"
  dialogVisible.value = true
}

const openEditDialog = (service: HmoService): void => {
  if (!canManageCatalog.value) {
    errorToast(toast, "You don't have access to manage the service catalog.")
    return
  }
  if (!isLocalEditableService(service)) {
    errorToast(toast, `This ${service.type} is managed in its dedicated master data module.`)
    return
  }
  editingId.value = service.id
  formData.type = service.type.startsWith("add-on") ? "add-on-machine" : service.type
  formData.name = service.name
  formData.price = service.price
  formData.status = service.status
  dialogVisible.value = true
}

const saveService = async (): Promise<void> => {
  if (!canManageCatalog.value) {
    errorToast(toast, "You don't have access to manage the service catalog.")
    return
  }

  if (!formData.name.trim()) {
    errorToast(toast, "Service name is required")
    return
  }
  if (formData.price < 0) {
    errorToast(toast, "Price must be 0 or greater")
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
    if (formData.type === "machine" || formData.type === "technique") {
      errorToast(toast, `Edit ${formData.type} in its master data module.`)
      return
    }

    const payload = { name: formData.name, price: Number(formData.price ?? 0) }

    if (editingId.value) {
      const id =
        formData.type === "evaluation" ? parseNumericId(editingId.value, "evaluation-")
          : formData.type === "add-on-machine" ? parseNumericId(editingId.value, "add-on-machine-")
            : formData.type === "add-on-technique" ? parseNumericId(editingId.value, "add-on-technique-")
              : parseNumericId(editingId.value, "add-on-home-service-")
      if (!id) throw new Error("Invalid id")
      await pamsAPI.put(`${endpoint}/${id}`, payload)
      successToast(toast, "HMO service updated")
    } else {
      await pamsAPI.post(`${endpoint}`, payload)
      successToast(toast, "HMO service added")
    }

    dialogVisible.value = false
    await invalidateGlobalServiceCatalog()
    await loadServices()
  } catch {
    errorToast(toast, "Failed to save HMO service")
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = (service: HmoService): void => {
  if (!canManageCatalog.value) {
    errorToast(toast, "You don't have access to manage the service catalog.")
    return
  }
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
          service.type === "evaluation" ? "/evaluations"
            : service.type === "add-on-machine" ? "/add-on-machines"
              : service.type === "add-on-technique" ? "/add-on-techniques"
                : "/add-on-home-services"
        const id =
          service.type === "evaluation" ? parseNumericId(service.id, "evaluation-")
            : service.type === "add-on-machine" ? parseNumericId(service.id, "add-on-machine-")
              : service.type === "add-on-technique" ? parseNumericId(service.id, "add-on-technique-")
                : parseNumericId(service.id, "add-on-home-service-")
        if (!id) throw new Error("Invalid id")
        await pamsAPI.patch(`${endpoint}/${id}/status`)
        successToast(toast, "HMO service updated")
        await invalidateGlobalServiceCatalog()
        await loadServices()
      } catch {
        errorToast(toast, "Failed to update service status")
      } finally {
        isLoading.value = false
      }
    }
  })
}

onMounted(async () => {
  await authSession.ensureLoaded().catch(() => undefined)
  void loadServices()
  if (canViewConfidentialRates.value) {
    void loadProfilesAndRates()
    void loadMachineCatalog()
  } else {
    hmoProfiles.value = []
    selectedProfileRates.value = []
    machineCatalog.value = []
  }
})

watch(selectedProfileId, () => {
  if (!canViewConfidentialRates.value) {
    selectedProfileRates.value = []
    return
  }

  void loadSelectedProfileRates()
})
</script>
