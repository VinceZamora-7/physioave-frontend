<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Promos And Offers</p>
          <h1 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">HMO Service Management</h1>
          <p class="max-w-3xl text-sm leading-6 opacity-80">
            Manage the shared individual service catalog from the HMO workspace. Changes here are reflected in Self Pay: Single Service as well.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button v-if="canViewConfidentialRates" label="Add New HMO Service" icon="pi pi-plus" @click="openAddDialog" />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="loadServices" />
        </div>
      </div>
    </section>

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
          <h3 class="text-sm font-semibold">HMO Profiles & Custom Price Lists</h3>
          <p class="text-xs opacity-70">Create an HMO profile and upload a CSV price list so staff can use in-app negotiated rates.</p>
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
        <h3 class="text-sm font-semibold">Custom Rates For Selected Profile</h3>
        <p class="text-xs opacity-70">Maintain custom negotiated rates manually without CSV upload.</p>
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
          <template #body="{data, index}">
            <div class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEditRateDialog(data, index)" v-tooltip="'Edit rate'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeleteRate(data, index)" v-tooltip="'Delete rate'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="space-y-2">
        <h3 class="text-sm font-semibold">All Available HMO Services</h3>
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
            :options="allServices"
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
import Tag from "primevue/tag"
import { useConfirm, useToast } from "primevue"
import {authMeService} from "@/services/auth-me.service"
import { errorToast, successToast } from "@/utils/toast.util"
import {
  HMO_PRICE_LISTS_KEY,
  HMO_PROFILES_KEY,
  SINGLE_PAY_SERVICES_KEY,
  readPromosStorageArray,
  writePromosStorageArray
} from "@/features/promos-offers/composables/promos-storage.composable"

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

const toast = useToast()
const confirm = useConfirm()
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const profileDialogVisible = ref(false)
const rateDialogVisible = ref(false)
const editingRateIndex = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const currentRoleName = ref<string>("")

const PRIVILEGED_ROLE_KEYWORDS = [
  "chief operations officer",
  "coo",
  "operations manager",
  "owner"
]

const allServices = ref<HmoService[]>([])
const hmoProfiles = ref<HmoProfile[]>([])
const hmoPriceLists = ref<Record<string, HmoPriceListRate[]>>({})
const selectedProfileId = ref<string>()

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

const selectedProfileRates = computed(() =>
  selectedProfileId.value ? (hmoPriceLists.value[selectedProfileId.value] ?? []) : []
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
  const normalized = currentRoleName.value.trim().toLowerCase()
  if (!normalized) return false
  return PRIVILEGED_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const resolveRoleFromStorage = (): string => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = String(parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole ?? "").trim()
      if (role) return role

      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
        const first = parsed.roles[0]
        if (typeof first === "string" && first.trim()) return first.trim()
        if (first && typeof first === "object") {
          const roleObj = first as Record<string, unknown>
          const nested = String(roleObj.name ?? roleObj.role ?? "").trim()
          if (nested) return nested
        }
      }
    } catch {
      // Ignore malformed storage entries.
    }
  }
  return ""
}

const ensureConfidentialAccess = (): boolean => {
  if (canViewConfidentialRates.value) return true
  errorToast(toast, "Confidential negotiated HMO rates are restricted to COO/Operations Manager")
  return false
}

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
    allServices.value = readPromosStorageArray<HmoService>(SINGLE_PAY_SERVICES_KEY)
  } catch {
    errorToast(toast, "Failed to load HMO services")
  } finally {
    isLoading.value = false
  }
}

const loadProfilesAndRates = (): void => {
  try {
    hmoProfiles.value = readPromosStorageArray<HmoProfile>(HMO_PROFILES_KEY)
  } catch {
    hmoProfiles.value = []
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(HMO_PRICE_LISTS_KEY) || "{}") as Record<string, HmoPriceListRate[]>
    hmoPriceLists.value = parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    hmoPriceLists.value = {}
  }

  if (!selectedProfileId.value && hmoProfiles.value.length) {
    selectedProfileId.value = hmoProfiles.value[0].id
  }
}

const persistProfilesAndRates = (): void => {
  writePromosStorageArray(HMO_PROFILES_KEY, hmoProfiles.value)
  localStorage.setItem(HMO_PRICE_LISTS_KEY, JSON.stringify(hmoPriceLists.value))
}

const openProfileDialog = (): void => {
  if (!ensureConfidentialAccess()) return
  profileForm.name = ""
  profileForm.code = ""
  profileDialogVisible.value = true
}

const saveProfile = (): void => {
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

  const profile: HmoProfile = {
    id: `hmo-profile-${Date.now()}`,
    name,
    code: profileForm.code.trim() || undefined,
    status: "Active"
  }
  hmoProfiles.value.push(profile)
  selectedProfileId.value = profile.id
  persistProfilesAndRates()
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
  const matched = allServices.value.find(service => service.id === serviceId)
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

const saveRate = (): void => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) {
    errorToast(toast, "Select an HMO profile first")
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

  const rates = [...selectedProfileRates.value]
  const duplicateIndex = rates.findIndex((rate, index) => {
    if (editingRateIndex.value != null && index === editingRateIndex.value) return false
    if (rateForm.serviceId && rate.serviceId) return rate.serviceId === rateForm.serviceId
    return rate.serviceName.trim().toLowerCase() === serviceName.toLowerCase()
  })
  if (duplicateIndex >= 0) {
    errorToast(toast, "A custom rate for this service already exists")
    return
  }

  const payload: HmoPriceListRate = {
    serviceId: rateForm.serviceId,
    serviceName,
    rate: Number(rateForm.rate)
  }

  if (editingRateIndex.value == null) {
    rates.push(payload)
  } else {
    rates[editingRateIndex.value] = payload
  }

  hmoPriceLists.value[selectedProfileId.value] = rates
  persistProfilesAndRates()
  rateDialogVisible.value = false
  successToast(toast, editingRateIndex.value == null ? "Custom rate added" : "Custom rate updated")
}

const confirmDeleteRate = (rate: HmoPriceListRate, index: number): void => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) return
  confirm.require({
    message: `Delete custom rate for "${getRateServiceLabel(rate)}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      const rates = [...selectedProfileRates.value]
      rates.splice(index, 1)
      hmoPriceLists.value[selectedProfileId.value as string] = rates
      persistProfilesAndRates()
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

    const uploadedRates: HmoPriceListRate[] = []
    let skippedCount = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i])
      const serviceName = String(cols[serviceNameIndex] ?? "").trim()
      const rate = toRate(String(cols[priceIndex] ?? ""))
      if (!serviceName || rate == null || rate < 0) {
        skippedCount++
        continue
      }

      const service = allServices.value.find(item => item.name.trim().toLowerCase() === serviceName.toLowerCase())
      uploadedRates.push({
        serviceId: service?.id,
        serviceName,
        rate
      })
    }

    if (!uploadedRates.length) {
      errorToast(toast, "No valid rows found in CSV")
      return
    }

    hmoPriceLists.value[selectedProfileId.value] = uploadedRates
    persistProfilesAndRates()

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

const clearSelectedProfilePriceList = (): void => {
  if (!ensureConfidentialAccess()) return
  if (!selectedProfileId.value) return
  delete hmoPriceLists.value[selectedProfileId.value]
  persistProfilesAndRates()
  successToast(toast, "Custom price list cleared")
}

const getCustomRate = (service: HmoService): number | undefined => {
  const byId = selectedProfileRateMap.value.get(`id:${service.id}`)
  if (byId != null) return byId
  return selectedProfileRateMap.value.get(`name:${service.name.trim().toLowerCase()}`)
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
  if (!ensureConfidentialAccess()) return
  editingId.value = null
  formData.type = "machine"
  formData.name = ""
  formData.price = 0
  formData.status = "Active"
  dialogVisible.value = true
}

const openEditDialog = (service: HmoService): void => {
  if (!ensureConfidentialAccess()) return
  editingId.value = service.id
  formData.type = service.type.startsWith("add-on") ? "add-on-machine" : service.type
  formData.name = service.name
  formData.price = service.price
  formData.status = service.status
  dialogVisible.value = true
}

const saveService = (): void => {
  if (!ensureConfidentialAccess()) return
  if (!formData.name.trim()) {
    errorToast(toast, "Service name is required")
    return
  }
  if (formData.price < 0) {
    errorToast(toast, "Price must be 0 or greater")
    return
  }

  if (editingId.value) {
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
    allServices.value.push({
      id: `hmo-service-${Date.now()}`,
      type: formData.type,
      name: formData.name,
      price: formData.price,
      status: formData.status
    })
  }

  writePromosStorageArray(SINGLE_PAY_SERVICES_KEY, allServices.value)
  dialogVisible.value = false
  successToast(toast, editingId.value ? "HMO service updated" : "HMO service added")
}

const confirmDelete = (service: HmoService): void => {
  if (!ensureConfidentialAccess()) return
  confirm.require({
    message: `Delete "${service.name}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      allServices.value = allServices.value.filter(s => s.id !== service.id)
      writePromosStorageArray(SINGLE_PAY_SERVICES_KEY, allServices.value)
      successToast(toast, "HMO service deleted")
    }
  })
}

onMounted(() => {
  currentRoleName.value = resolveRoleFromStorage()
  void authMeService.get()
    .then((me) => {
      const role = String(me?.role_name ?? "").trim()
      if (!role) return

      const wasPrivileged = canViewConfidentialRates.value
      currentRoleName.value = role
      if (!wasPrivileged && canViewConfidentialRates.value) {
        loadProfilesAndRates()
      }
    })
    .catch(() => {
      // Keep storage-derived role fallback.
    })

  loadServices()
  if (canViewConfidentialRates.value) {
    loadProfilesAndRates()
  } else {
    hmoProfiles.value = []
    hmoPriceLists.value = {}
  }
})
</script>
