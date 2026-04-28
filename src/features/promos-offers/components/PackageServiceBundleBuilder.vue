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
          <Button
            label="Recycle Bin"
            icon="pi pi-trash"
            outlined
            @click="catalogManagerVisible = true"
          />
          <Button label="Refresh" icon="pi pi-refresh" text outlined @click="refreshAll" />
        </div>
      </div>
    </section>

    <PromosCatalogManagerDialog v-model:visible="catalogManagerVisible" recycleOnly @refreshed="refreshAll" />

    <PackageOffersManager
      title="Package Builder"
      description="Regular Total = (Bundled Price x Qty/Sessions) + (Evaluation original Price x Qty)."
      :can-edit="true"
      :machine-options="bundleMachineOptions"
      :technique-options="bundleTechniqueOptions"
      :evaluation-options="bundleEvaluationOptions"
      :session-options="sessionServices.map(s => ({ id: s.id, name: s.name, price: s.price }))"
      :get-service-name="getServiceName"
      :get-service-price="getServicePrice"
      @refreshed="refreshAll"
    />

    <!-- Legacy section kept for reference; replaced by PackageOffersManager -->
    <section v-if="false" class="app-section-card-comfy space-y-3">
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
            <div v-if="isLocalEditableService(data)" class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEditDialog(data)" v-tooltip="'Edit'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="confirmDelete(data)" v-tooltip="'Delete'" />
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

    <ServiceBundlesManager
      :title="props.bundledSectionTitle"
      :description="props.bundledSectionDescription"
      :can-edit="true"
      :machine-options="bundleMachineOptions"
      :technique-options="bundleTechniqueOptions"
      :evaluation-options="bundleEvaluationOptions"
      :get-service-name="getServiceName"
      :get-service-price="getServicePrice"
      @refreshed="refreshAll"
    />

    <!-- Legacy section kept for reference; replaced by ServiceBundlesManager -->
    <section v-if="false" class="app-section-card-comfy space-y-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold">{{ props.bundledSectionTitle }}</h3>
          <p class="text-xs opacity-70">{{ props.bundledSectionDescription }}</p>
        </div>
        <Button label="Add New Bundle" icon="pi pi-plus" @click="openAddBundleDialog" />
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
import {useConfirm} from "primevue/useconfirm"
import {useToast} from "primevue/usetoast"
import type {Pageable} from "@/models/paging.ts"
import type {OfferLookupDTO} from "@/models/global.model.ts"
import {pamsAPI} from "@/utils/axios-interceptor"
import {OfferResourceKey} from "@/utils/keys/resource-key"
import {errorToast, successToast} from "@/utils/toast.util"
import PromosCatalogManagerDialog from "@/features/promos-offers/components/PromosCatalogManagerDialog.vue"
import {
  // legacy local storage helpers are intentionally no longer used for services/bundles/packages
} from "@/features/promos-offers/composables/promos-storage.composable"
import {
  isLocalEditablePromosService,
  loadBackendPromosMasterCatalog,
  normalizePromosServiceName
} from "@/features/promos-offers/composables/promos-master-catalog.composable"
import ServiceBundlesManager from "@/features/promos-offers/components/ServiceBundlesManager.vue"
import PackageOffersManager from "@/features/promos-offers/components/PackageOffersManager.vue"

type ServiceType = "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"

interface SingleService {
  id: string
  type: ServiceType
  name: string
  price: number
  status: string
}

interface BundledService {
  id: number
  name: string
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
  bundledPrice: number
  status: string
}

interface PackageService {
  id: number
  name: string
  bundleId?: number
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
const catalogManagerVisible = ref(false)
const props = withDefaults(defineProps<{
  pageTitle?: string
  pageDescription?: string
  bundledSectionTitle?: string
  bundledSectionDescription?: string
}>(), {
  pageTitle: "Self Pay: Package Service Management",
  pageDescription: "Manage the same service inventory used by single-service billing, reuse service bundles, and assemble package offers with session counts, evaluations, regular totals, and package prices.",
  bundledSectionTitle: "Bundled Services",
  bundledSectionDescription: "Same bundled-services table and logic used in Self Pay: Single Service.",
})
const isLoading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const bundleDialogVisible = ref(false)
const editingBundleId = ref<number | null>(null)
const packageDialogVisible = ref(false)
const editingPackageId = ref<number | null>(null)
const refreshPromise = ref<Promise<unknown> | null>(null)

const customServices = ref<SingleService[]>([])
const machineServices = ref<SingleService[]>([])
const techniqueServices = ref<SingleService[]>([])
const allServices = computed<SingleService[]>(() => [
  ...machineServices.value,
  ...techniqueServices.value,
  ...customServices.value
])
const allBundles = ref<BundledService[]>([])
const allPackages = ref<PackageService[]>([])
const selectedServiceCatalogFilters = ref<ServiceCatalogFilter[]>([])
const sessionLookupServices = ref<Array<{id: string; name: string; price: number}>>([])

const parseNumericId = (value: string, prefix: string): number => {
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

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
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluations", value: "evaluation"},
  {label: "Add-Ons", value: "add-on-machine"}
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

const isLocalEditableService = (service: SingleService): boolean => isLocalEditablePromosService(service)

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
  bundleId?: any
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
  () => packageFormData.sessionIds,
  (ids) => {
    packageFormData.sessionItems = syncItemsFromSelection(ids, packageFormData.sessionItems)
  },
  {deep: true}
)

const evaluationServices = computed(() => allServices.value.filter(service => service.type === "evaluation"))
const sessionServices = computed(() => sessionLookupServices.value)
const activeBundles = computed(() => allBundles.value.filter(bundle => bundle.status !== "Inactive"))
const bundleMachineOptions = computed(() =>
  machineServices.value.filter(s => s.status !== "Inactive").map(s => ({id: s.id, name: s.name}))
)
const bundleTechniqueOptions = computed(() =>
  techniqueServices.value.filter(s => s.status !== "Inactive").map(s => ({id: s.id, name: s.name}))
)
const bundleEvaluationOptions = computed(() =>
  customServices.value.filter(s => s.type === "evaluation" && s.status !== "Inactive").map(s => ({id: s.id, name: s.name}))
)

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
const getBundleName = (id: number | string): string => {
  const parsed = typeof id === "string" ? Number(id) : id
  if (Number.isFinite(parsed)) {
    const found = allBundles.value.find(bundle => bundle.id === parsed)
    if (found?.name) return found.name
  }
  return String(id)
}

const calcOriginalPrice = (bundle: BundledService): number => {
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds]
  return ids.reduce((sum, id) => sum + getServicePrice(id), 0)
}

const calcPackageRegularTotal = (item: PackageService | {bundleId?: number | string; bundleQty: number; machineIds?: string[]; machineItems?: Array<{id: string; qty: number}>; techniqueIds?: string[]; techniqueItems?: Array<{id: string; qty: number}>; evaluationIds: string[]; evaluationItems?: Array<{id: string; qty: number}>; addOnIds?: string[]; addOnItems?: Array<{id: string; qty: number}>; sessionIds?: string[]; sessionItems?: Array<{id: string; qty: number}>}): number => {
  const typed = item as PackageService
  const bundleId = (typed.bundleId === undefined || typed.bundleId === null || String(typed.bundleId).trim() === "")
    ? null
    : Number(typed.bundleId)
  const bundle = bundleId ? allBundles.value.find(entry => entry.id === bundleId) : undefined
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
  const sessionRegularTotal = (typed.sessionItems?.length
    ? typed.sessionItems
    : (typed.sessionIds ?? []).map(id => ({id, qty: Number(typed.sessionQty ?? 1)}))
  ).reduce((sum, itemEntry) => sum + (getServicePrice(itemEntry.id) * Number(itemEntry.qty ?? 1)), 0)
  return bundleRegularTotal + machineRegularTotal + techniqueRegularTotal + evaluationRegularTotal + sessionRegularTotal
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
  id: 0,
  name: "preview",
  machineIds: bundleFormData.machineIds,
  techniqueIds: bundleFormData.techniqueIds,
  evaluationIds: bundleFormData.evaluationIds,
  addOnIds: bundleFormData.addOnIds,
  bundledPrice: bundleFormData.bundledPrice,
  status: bundleFormData.status
}))

const packageRegularTotal = computed(() => calcPackageRegularTotal(packageFormData))

const loadServices = async (): Promise<void> => {
  try {
    const { machineServices: backendMachines, techniqueServices: backendTechniques } = await loadBackendPromosMasterCatalog()
    machineServices.value = backendMachines as SingleService[]
    techniqueServices.value = backendTechniques as SingleService[]

    // DB-backed "custom" services: evaluations + add-ons
    const [evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes] = await Promise.all([
      withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/evaluations", { params: { page: 1, size: 1000, name: "", status: "ALL" } })),
      withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/add-on-machines", { params: { page: 1, size: 1000, name: "", status: "ALL" } })),
      withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/add-on-techniques", { params: { page: 1, size: 1000, name: "", status: "ALL" } })),
      withRefreshRetry(() => pamsAPI.get<Pageable<any>>("/add-on-home-services", { params: { page: 1, size: 1000, name: "", status: "ALL" } })),
    ])

    const evalServices: SingleService[] = (evaluationsRes.data?.content ?? []).map((item: any) => ({
      id: `evaluation-${item.id}`,
      type: "evaluation",
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive",
    }))
    const addOnMachineServices: SingleService[] = (addOnMachinesRes.data?.content ?? []).map((item: any) => ({
      id: `add-on-machine-${item.id}`,
      type: "add-on-machine",
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive",
    }))
    const addOnTechniqueServices: SingleService[] = (addOnTechniquesRes.data?.content ?? []).map((item: any) => ({
      id: `add-on-technique-${item.id}`,
      type: "add-on-technique",
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive",
    }))
    const addOnHomeServices: SingleService[] = (addOnHomeRes.data?.content ?? []).map((item: any) => ({
      id: `add-on-home-service-${item.id}`,
      type: "add-on-home-service",
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      status: item.is_active ? "Active" : "Inactive",
    }))

    customServices.value = [...evalServices, ...addOnMachineServices, ...addOnTechniqueServices, ...addOnHomeServices]

    // Package offers are DB-backed (package_service_offer table).
    const { data } = await withRefreshRetry(() =>
      pamsAPI.get<Pageable<any>>("/package-service-offers", {
        params: { page: 1, size: 500, name: "", status: "ALL" }
      })
    )

    const rawPackages = (data?.content ?? []) as Array<Record<string, any>>
    allPackages.value = rawPackages.map((row) => ({
      id: Number(row.id),
      name: String(row.name ?? ""),
      bundleId: row.bundle_template_id === null || row.bundle_template_id === undefined ? undefined : Number(row.bundle_template_id),
      bundleQty: Number(row.bundle_qty ?? 1),
      machineIds: (row.machine_ids ?? []).map((id: any) => String(id)),
      machineQty: Number(row.machine_qty ?? 1),
      machineItems: (row.machine_items ?? []).map((entry: any) => ({ id: String(entry.id), qty: Number(entry.qty ?? 1) })),
      techniqueIds: (row.technique_ids ?? []).map((id: any) => String(id)),
      techniqueQty: Number(row.technique_qty ?? 1),
      techniqueItems: (row.technique_items ?? []).map((entry: any) => ({ id: String(entry.id), qty: Number(entry.qty ?? 1) })),
      evaluationIds: (row.evaluation_ids ?? []).map((id: any) => String(id)),
      evaluationQty: Number(row.evaluation_qty ?? 1),
      evaluationItems: (row.evaluation_items ?? []).map((entry: any) => ({ id: String(entry.id), qty: Number(entry.qty ?? 1) })),
      addOnIds: (row.add_on_ids ?? []).map((id: any) => String(id)),
      addOnQty: Number(row.add_on_qty ?? 1),
      addOnItems: (row.add_on_items ?? []).map((entry: any) => ({ id: String(entry.id), qty: Number(entry.qty ?? 1) })),
      sessionIds: (row.session_ids ?? []).map((id: any) => String(id)),
      sessionQty: Number(row.session_qty ?? 1),
      sessionItems: (row.session_items ?? []).map((entry: any) => ({ id: String(entry.id), qty: Number(entry.qty ?? 1) })),
      packagePrice: Number(row.package_price ?? 0),
      status: String(row.status ?? (row.is_active ? "Active" : "Inactive"))
    }))
  } catch {
    machineServices.value = []
    techniqueServices.value = []
    customServices.value = []
    allPackages.value = []
  }
}

const loadBundles = async (): Promise<void> => {
  try {
    const { data } = await withRefreshRetry(() =>
      pamsAPI.get<Pageable<any>>("/service-bundles", {
        params: { page: 1, size: 500, name: "", status: "ALL" }
      })
    )

    const rows = (data?.content ?? []) as Array<Record<string, any>>
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
    allBundles.value = []
  }
}

const loadPackages = (): void => {
  // DB-backed; handled in loadServices().
  allPackages.value = []
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
    await loadServices()
    await loadBundles()
    await loadSessionLookupServices()
  } finally {
    isLoading.value = false
  }
}

const openAddDialog = (): void => {
  editingId.value = null
  formData.type = "evaluation"
  formData.name = ""
  formData.price = 0
  formData.status = "Active"
  dialogVisible.value = true
}

const openEditDialog = (service: SingleService): void => {
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
    const payload = { name: formData.name, price: Number(formData.price ?? 0) }

    if (editingId.value) {
      const id =
        formData.type === "machine" ? parseNumericId(editingId.value, "machine-")
          : formData.type === "technique" ? parseNumericId(editingId.value, "technique-")
            : formData.type === "evaluation" ? parseNumericId(editingId.value, "evaluation-")
              : formData.type === "add-on-machine" ? parseNumericId(editingId.value, "add-on-machine-")
                : formData.type === "add-on-technique" ? parseNumericId(editingId.value, "add-on-technique-")
                  : parseNumericId(editingId.value, "add-on-home-service-")
      if (!id) throw new Error("Invalid id")
      await withRefreshRetry(() => pamsAPI.put(`${endpoint}/${id}`, payload))
      successToast(toast, "Service updated")
    } else {
      await withRefreshRetry(() => pamsAPI.post(`${endpoint}`, payload))
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
        await withRefreshRetry(() => pamsAPI.patch(`${endpoint}/${id}/status`))
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
  const total = bundleFormData.machineIds.length + bundleFormData.techniqueIds.length + bundleFormData.evaluationIds.length
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
      await withRefreshRetry(() => pamsAPI.put(`/service-bundles/${editingBundleId.value}`, apiPayload))
      successToast(toast, "Bundle updated")
    } else {
      await withRefreshRetry(() => pamsAPI.post(`/service-bundles`, apiPayload))
      successToast(toast, "Bundle added")
    }

    bundleDialogVisible.value = false
    await loadBundles()
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
        await withRefreshRetry(() => pamsAPI.patch(`/service-bundles/${bundle.id}/status`))
        successToast(toast, "Bundle updated")
        await loadBundles()
      } catch {
        errorToast(toast, "Failed to update bundle status")
      } finally {
        isLoading.value = false
      }
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
  packageFormData.addOnIds = []
  packageFormData.addOnItems = []
  packageFormData.sessionIds = [...(item.sessionIds ?? [])]
  packageFormData.sessionItems = (item.sessionItems?.length
    ? item.sessionItems.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (item.sessionIds ?? []).map(id => ({id, qty: Number(item.sessionQty ?? 1)}))
  )
  packageFormData.packagePrice = item.packagePrice
  packageFormData.status = item.status
  packageDialogVisible.value = true
}

const savePackage = async (): Promise<void> => {
  if (!packageFormData.name.trim()) {
    errorToast(toast, "Package name is required")
    return
  }
  const hasBundle = !!packageFormData.bundleId
  const hasMachine = packageFormData.machineIds.length > 0
  const hasTechnique = packageFormData.techniqueIds.length > 0
  const hasEvaluation = packageFormData.evaluationIds.length > 0
  const hasSession = packageFormData.sessionIds.length > 0
  if (!hasBundle && !hasMachine && !hasTechnique && !hasEvaluation && !hasSession) {
    errorToast(toast, "Add at least one item from Machine & Modalities, Technique, Evaluations, or Recurring PT Sessions")
    return
  }
  const hasInvalidQty = [
    packageFormData.bundleQty,
    ...packageFormData.machineItems.map(entry => entry.qty),
    ...packageFormData.techniqueItems.map(entry => entry.qty),
    ...packageFormData.evaluationItems.map(entry => entry.qty),
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

  isLoading.value = true
  try {
    const apiPayload = {
      name: packageFormData.name,
      bundle_template_id: (typeof packageFormData.bundleId === "number" && Number.isFinite(packageFormData.bundleId) && packageFormData.bundleId > 0)
        ? packageFormData.bundleId
        : null,
      bundle_qty: Number(packageFormData.bundleQty ?? 1),
      machine_ids: [...packageFormData.machineIds].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
      machine_qty: 1,
      machine_items: packageFormData.machineItems.map(entry => ({ id: Number(entry.id), qty: Number(entry.qty ?? 1) })).filter((e) => Number.isFinite(e.id) && e.id > 0),
      technique_ids: [...packageFormData.techniqueIds].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
      technique_qty: 1,
      technique_items: packageFormData.techniqueItems.map(entry => ({ id: Number(entry.id), qty: Number(entry.qty ?? 1) })).filter((e) => Number.isFinite(e.id) && e.id > 0),
      evaluation_ids: [...packageFormData.evaluationIds].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
      evaluation_qty: 1,
      evaluation_items: packageFormData.evaluationItems.map(entry => ({ id: Number(entry.id), qty: Number(entry.qty ?? 1) })).filter((e) => Number.isFinite(e.id) && e.id > 0),
      add_on_ids: [],
      add_on_qty: 1,
      add_on_items: [],
      session_ids: [...packageFormData.sessionIds].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
      session_qty: 1,
      session_items: packageFormData.sessionItems.map(entry => ({ id: Number(entry.id), qty: Number(entry.qty ?? 1) })).filter((e) => Number.isFinite(e.id) && e.id > 0),
      package_price: Number(packageFormData.packagePrice ?? 0),
    }

    if (editingPackageId.value) {
      await withRefreshRetry(() =>
        pamsAPI.put(`/package-service-offers/${editingPackageId.value}`, apiPayload)
      )
      successToast(toast, "Package updated")
    } else {
      await withRefreshRetry(() =>
        pamsAPI.post(`/package-service-offers`, apiPayload)
      )
      successToast(toast, "Package added")
    }

    packageDialogVisible.value = false
    await refreshAll()
  } catch {
    errorToast(toast, "Failed to save package")
  } finally {
    isLoading.value = false
  }
}

const confirmDeletePackage = (item: PackageService): void => {
  confirm.require({
    message: `If you proceed, "${item.name}" will be deactivated.`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      isLoading.value = true
      try {
        await withRefreshRetry(() => pamsAPI.patch(`/package-service-offers/${item.id}/status`))
        successToast(toast, "Package deactivated")
        await refreshAll()
      } catch {
        errorToast(toast, "Failed to update package status")
      } finally {
        isLoading.value = false
      }
    }
  })
}

onMounted(() => {
  void refreshAll()
})
</script>
