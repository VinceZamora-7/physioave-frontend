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
      :rows="25"
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

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Edit Package' : 'Add New Package'" modal :style="{ width: '820px' }">
      <div class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <IftaLabel>
            <InputText v-model="form.name" fluid />
            <label>Package Name</label>
          </IftaLabel>

          <IftaLabel>
            <InputNumber v-model="form.packagePrice" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
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

        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm">
          <div class="flex flex-wrap gap-3 items-center justify-between">
            <div class="opacity-70">Regular Total</div>
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
import { computed, onMounted, reactive, ref } from "vue"
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
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast } from "@/utils/toast.util"
import type { Pageable } from "@/models/paging"

type BundleLookup = { id: number; name: string; bundled_price?: number; is_active: boolean }
type PackageDTO = any

export type PackageService = {
  id: number
  name: string
  bundleId?: number | string | null
  bundleQty: number
  machineIds?: string[]
  machineQty?: number
  machineItems?: Array<{ id: string; qty: number }>
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: Array<{ id: string; qty: number }>
  evaluationIds: string[]
  evaluationQty?: number
  evaluationItems?: Array<{ id: string; qty: number }>
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

const emit = defineEmits<{ refreshed: [] }>()

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const packages = ref<PackageService[]>([])
const activePackages = computed(() => packages.value.filter(p => p.status !== "Inactive"))

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

const calcPackageRegularTotal = (item: any): number => {
  const bundleIdRaw = item.bundleId
  const bundleId = bundleIdRaw === undefined || bundleIdRaw === null || String(bundleIdRaw).trim() === "" ? null : Number(bundleIdRaw)
  const bundle = bundleId ? bundles.value.find(b => b.id === bundleId) : undefined
  const bundleRegularTotal = Number(bundle?.bundledPrice ?? 0) * Number(item.bundleQty ?? 1)

  const machineRegularTotal = (item.machineItems?.length
    ? item.machineItems
    : (item.machineIds ?? []).map((id: string) => ({ id, qty: Number(item.machineQty ?? 1) }))
  ).reduce((sum: number, entry: any) => sum + (props.getServicePrice(entry.id) * Number(entry.qty ?? 1)), 0)

  const techniqueRegularTotal = (item.techniqueItems?.length
    ? item.techniqueItems
    : (item.techniqueIds ?? []).map((id: string) => ({ id, qty: Number(item.techniqueQty ?? 1) }))
  ).reduce((sum: number, entry: any) => sum + (props.getServicePrice(entry.id) * Number(entry.qty ?? 1)), 0)

  const evaluationRegularTotal = (item.evaluationItems?.length
    ? item.evaluationItems
    : (item.evaluationIds ?? []).map((id: string) => ({ id, qty: Number(item.evaluationQty ?? 1) }))
  ).reduce((sum: number, entry: any) => sum + (props.getServicePrice(entry.id) * Number(entry.qty ?? 1)), 0)

  return bundleRegularTotal + machineRegularTotal + techniqueRegularTotal + evaluationRegularTotal
}

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<any>({
  name: "",
  bundleId: null,
  bundleQty: 1,
  machineIds: [] as string[],
  machineQty: 1,
  techniqueIds: [] as string[],
  techniqueQty: 1,
  evaluationIds: [] as string[],
  evaluationQty: 1,
  packagePrice: 0,
})

const openAddDialog = (): void => {
  editingId.value = null
  form.name = ""
  form.bundleId = null
  form.bundleQty = 1
  form.machineIds = []
  form.machineQty = 1
  form.techniqueIds = []
  form.techniqueQty = 1
  form.evaluationIds = []
  form.evaluationQty = 1
  form.packagePrice = 0
  dialogVisible.value = true
}

const openEditDialog = (row: PackageService): void => {
  editingId.value = row.id
  form.name = row.name
  form.bundleId = row.bundleId ?? null
  form.bundleQty = Number(row.bundleQty ?? 1)
  form.machineIds = [...(row.machineIds ?? [])]
  form.machineQty = Number(row.machineQty ?? 1)
  form.techniqueIds = [...(row.techniqueIds ?? [])]
  form.techniqueQty = Number(row.techniqueQty ?? 1)
  form.evaluationIds = [...(row.evaluationIds ?? [])]
  form.evaluationQty = Number(row.evaluationQty ?? 1)
  form.packagePrice = Number(row.packagePrice ?? 0)
  dialogVisible.value = true
}

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const loadBundles = async (): Promise<void> => {
  try {
    const res = await pamsAPI.get<Pageable<BundleLookup>>("/service-bundles", {
      params: { page: 1, size: 1000, name: "", status: "ALL" }
    })
    bundles.value = (res.data?.content ?? []).map(row => ({
      id: Number((row as any).id),
      name: (row as any).name,
      bundledPrice: Number((row as any).bundled_price ?? 0),
      status: (row as any).is_active ? "Active" : "Inactive"
    }))
  } catch {
    bundles.value = []
  }
}

const loadPackages = async (): Promise<void> => {
  isLoading.value = true
  try {
    const res = await pamsAPI.get<Pageable<PackageDTO>>("/package-service-offers", {
      params: { page: 1, size: 1000, name: "", status: "ALL", scope: props.offerScope ?? "GLOBAL" }
    })
    const raw = (res.data?.content ?? []) as any[]
    packages.value = raw.map((row) => ({
      id: Number(row.id),
      name: row.name,
      bundleId: row.bundle_template_id ?? row.bundleId ?? null,
      bundleQty: Number(row.bundle_qty ?? row.bundleQty ?? 1),
      machineIds: (row.machine_ids ?? row.machineIds ?? []).map((id: number) => `machine-${id}`),
      machineQty: Number(row.machine_qty ?? row.machineQty ?? 1),
      techniqueIds: (row.technique_ids ?? row.techniqueIds ?? []).map((id: number) => `technique-${id}`),
      techniqueQty: Number(row.technique_qty ?? row.techniqueQty ?? 1),
      evaluationIds: (row.evaluation_ids ?? row.evaluationIds ?? []).map((id: number) => `evaluation-${id}`),
      evaluationQty: Number(row.evaluation_qty ?? row.evaluationQty ?? 1),
      packagePrice: Number(row.package_price ?? row.packagePrice ?? 0),
      offerScope: row.offer_scope ?? row.offerScope ?? "GLOBAL",
      status: row.is_active ? "Active" : "Inactive"
    }))
    emit("refreshed")
  } catch {
    packages.value = []
    errorToast(toast, "Failed to load packages")
  } finally {
    isLoading.value = false
  }
}

const save = async (): Promise<void> => {
  if (!props.canEdit) return
  if (!String(form.name ?? "").trim()) {
    errorToast(toast, "Package name is required")
    return
  }
  if (Number(form.packagePrice ?? 0) < 0) {
    errorToast(toast, "Package price must be 0 or greater")
    return
  }
  if ((form.evaluationIds ?? []).length === 0 && (form.machineIds ?? []).length === 0 && (form.techniqueIds ?? []).length === 0 && !form.bundleId) {
    errorToast(toast, "Select at least one service or a bundle")
    return
  }

  isLoading.value = true
  try {
    const apiPayload = {
      name: String(form.name).trim(),
      bundle_template_id: form.bundleId ? Number(form.bundleId) : null,
      bundle_qty: Number(form.bundleQty ?? 1),
      machine_ids: (form.machineIds ?? []).map((id: string) => parseNumericId(id, "machine-")).filter(Boolean),
      machine_qty: Number(form.machineQty ?? 1),
      technique_ids: (form.techniqueIds ?? []).map((id: string) => parseNumericId(id, "technique-")).filter(Boolean),
      technique_qty: Number(form.techniqueQty ?? 1),
      evaluation_ids: (form.evaluationIds ?? []).map((id: string) => parseNumericId(id, "evaluation-")).filter(Boolean),
      evaluation_qty: Number(form.evaluationQty ?? 1),
      session_ids: [],
      session_qty: 1,
      package_price: Number(form.packagePrice ?? 0),
      offer_scope: props.offerScope ?? "GLOBAL"
    }

    if (editingId.value) {
      await pamsAPI.put(`/package-service-offers/${editingId.value}`, apiPayload)
      successToast(toast, "Package updated")
    } else {
      await pamsAPI.post(`/package-service-offers`, apiPayload)
      successToast(toast, "Package added")
    }

    dialogVisible.value = false
    await loadPackages()
  } catch {
    errorToast(toast, "Failed to save package")
  } finally {
    isLoading.value = false
  }
}

const confirmDeactivate = (row: PackageService): void => {
  if (!props.canEdit) return
  confirm.require({
    message: `If you proceed, \"${row.name}\" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      isLoading.value = true
      try {
        await pamsAPI.patch(`/package-service-offers/${row.id}/status`)
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
  await Promise.all([loadBundles(), loadPackages()])
})
</script>
