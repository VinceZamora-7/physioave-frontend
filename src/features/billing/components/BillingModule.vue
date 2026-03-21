<template>
  <main class="app-page-shell space-y-4">
    <section class="app-section-card-comfy space-y-3">
      <h2 class="app-section-title">Billing POS</h2>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <IftaLabel>
          <Select
            v-model="form.patient_id"
            :options="patientOptions"
            optionLabel="name"
            optionValue="id"
            filter
            showClear
            fluid
            placeholder="Select patient"
          />
          <label>Patient Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="form.appointment_id" :min="1" fluid />
          <label>Appointment ID (optional)</label>
        </IftaLabel>

        <IftaLabel>
          <Select v-model="form.billing_type" :options="billingTypeOptions" optionLabel="label" optionValue="value" fluid />
          <label>Billing Type</label>
        </IftaLabel>
      </div>

      <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-semibold">Line Items</h4>
          <div class="flex items-center gap-2">
            <small v-if="existingBundleMatchName" class="text-xs opacity-60">Matches existing bundle: {{ existingBundleMatchName }}</small>
            <Button
              v-if="canCreateBundleFromSelection"
              size="small"
              outlined
              icon="pi pi-box"
              label="Create Bundle From Selection"
              @click="openCreateBundleFromSelection"
            />
            <Button
              v-if="form.patient_id"
              size="small"
              outlined
              icon="pi pi-history"
              label="Copy from Last Session"
              :loading="copyingFromLastSession"
              @click="copyFromLastSession"
            />
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IftaLabel>
            <Select
              v-model="selectedPackageOfferId"
              :options="activePackageOffers"
              optionLabel="name"
              optionValue="id"
              showClear
              filter
              fluid
              placeholder="Optional package offer"
            />
            <label>Package Offer</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="selectedLineType"
              :options="lineTypeOptions"
              optionLabel="label"
              optionValue="value"
              fluid
            />
            <label>Service Type</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="selectedLineId"
              :options="currentLineTypeOptions"
              optionLabel="name"
              optionValue="id"
              showClear
              filter
              fluid
              placeholder="Select item"
            />
            <label>Service / Add-on</label>
          </IftaLabel>

          <div class="grid grid-cols-[120px_1fr] gap-2 items-end">
            <IftaLabel>
              <InputNumber v-model="selectedLineQty" :min="1" fluid />
              <label>Qty</label>
            </IftaLabel>
            <Button label="Add Line" icon="pi pi-plus" outlined @click="addSelectedLine" />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            label="Add Package Offer"
            icon="pi pi-box"
            text
            :disabled="!selectedPackageOfferId"
            @click="addSelectedPackageOffer"
          />
        </div>

        <div v-if="selectedLines.length === 0" class="text-sm opacity-70 py-4 text-center">
          No line items added yet
        </div>

        <DataTable v-else :value="selectedLines" size="small" dataKey="key" class="rounded-lg border border-[rgb(var(--app-border))]">
          <Column field="name" header="Service">
            <template #body="{data}">
              <div>
                <div class="flex items-center gap-1">
                  <Tag v-if="data.type === 'bundle'" value="Bundle" severity="contrast" class="text-xs" />
                  <Tag v-else-if="data.type === 'package'" value="Package" severity="info" class="text-xs" />
                  <span>{{ data.name }}</span>
                </div>
                <div v-if="data.type === 'bundle'" class="pl-2 mt-1 space-y-0.5">
                  <div v-for="comp in getBundleComponents(data.id, data.name)" :key="comp.id" class="text-xs opacity-55 flex items-center gap-1">
                    <i class="pi pi-angle-right" style="font-size:0.6rem"></i>
                    <span>{{ comp.name }}</span>
                    <span class="ml-auto">{{ asCurrency(comp.price) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Unit Price" style="width: 140px">
            <template #body="{data}">
              <div>
                <div>{{ asCurrency(data.price) }}</div>
                <div v-if="data.type === 'bundle' && data.originalPrice && data.originalPrice > data.price" class="text-xs opacity-50 line-through">{{ asCurrency(data.originalPrice) }}</div>
              </div>
            </template>
          </Column>
          <Column header="Qty" style="width: 80px">
            <template #body="{data}">
              <InputNumber
                :modelValue="data.quantity"
                :min="1"
                inputClass="w-16"
                @update:modelValue="setLineQuantity(data.key, $event)"
              />
            </template>
          </Column>
          <Column header="Line Total" style="width: 130px">
            <template #body="{data}">
              <div>
                <div>{{ asCurrency(data.price * data.quantity) }}</div>
                <div
                  v-if="data.type === 'bundle' && data.originalPrice && data.originalPrice > data.price"
                  class="text-xs opacity-50 line-through"
                >
                  {{ asCurrency(data.originalPrice * data.quantity) }}
                </div>
              </div>
            </template>
          </Column>
          <Column header="Actions" style="width: 80px">
            <template #body="{data}">
              <Button
                size="small"
                text
                severity="danger"
                icon="pi pi-trash"
                @click="removeLine(data.key)"
              />
            </template>
          </Column>
        </DataTable>
      </section>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <InputText v-model="form.service_name" fluid placeholder="Optional label for this billing" />
          <label>Service Name / Label</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-if="isSelfPay"
            v-model="form.payment_type"
            :options="selfPayPaymentOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <InputText v-else :modelValue="form.billing_type === 'HMO_BILLING' ? 'HMO' : 'LGU'" fluid readonly />
          <label>Payment Type</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="form.amount_paid" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Paid</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="form.amount_tendered" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Tendered</label>
        </IftaLabel>
      </div>

      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
        <div class="mb-2">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.senior_pwd_id_presented" type="checkbox" />
            <span>Senior/PWD ID presented</span>
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-3">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="manualDiscountEnabled" type="checkbox" />
            <span>Apply Custom Discount</span>
          </label>

          <IftaLabel v-if="manualDiscountEnabled">
            <Select
              v-model="manualDiscountType"
              :options="discountTypeOptions"
              optionLabel="label"
              optionValue="value"
              fluid
            />
            <label>Discount Type</label>
          </IftaLabel>

          <IftaLabel v-if="manualDiscountEnabled">
            <InputNumber
              v-model="manualDiscountValue"
              :min="0"
              :max="manualDiscountType === 'PERCENTAGE' ? 100 : undefined"
              fluid
            />
            <label>{{ manualDiscountType === "PERCENTAGE" ? "Discount %" : "Discount Amount" }}</label>
          </IftaLabel>

          <IftaLabel v-if="manualDiscountEnabled">
            <InputText v-model="manualDiscountReason" fluid placeholder="Optional reason" />
            <label>Discount Reason</label>
          </IftaLabel>
        </div>

        <div v-if="form.senior_pwd_id_presented || manualDiscountEnabled" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mb-3 text-sm">
          <div v-if="form.senior_pwd_id_presented"><span class="opacity-70">Senior/PWD:</span> <strong>{{ asCurrency(posSummary.seniorDiscountAmount) }}</strong></div>
          <div v-if="manualDiscountEnabled"><span class="opacity-70">Custom Discount:</span> <strong>{{ asCurrency(posSummary.customDiscountAmount) }}</strong></div>
          <div v-if="manualDiscountEnabled && manualDiscountReason.trim()"><span class="opacity-70">Reason:</span> <strong>{{ manualDiscountReason }}</strong></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
          <div><span class="opacity-70">Original Total:</span> <strong>{{ asCurrency(posSummary.originalSubtotal) }}</strong></div>
          <div><span class="opacity-70">Subtotal:</span> <strong>{{ asCurrency(posSummary.subtotal) }}</strong></div>
          <div><span class="opacity-70">Discount:</span> <strong>{{ asCurrency(posSummary.discountAmount) }}</strong></div>
          <!-- VAT breakdown — visible only when vatEnabled (Non-VAT mode: hidden) -->
          <template v-if="vatEnabled">
            <div><span class="opacity-70">Vatable Amount:</span> <strong>{{ asCurrency(posSummary.vatableAmount) }}</strong></div>
            <div><span class="opacity-70">VAT ({{ (VAT_RATE * 100).toFixed(0) }}%):</span> <strong>{{ asCurrency(posSummary.vatAmount) }}</strong></div>
          </template>
          <div><span class="opacity-70">Total Due:</span> <strong>{{ asCurrency(posSummary.totalDue) }}</strong></div>
          <div><span class="opacity-70">Change:</span> <strong>{{ asCurrency(posSummary.changeAmount) }}</strong></div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button :label="editingBillingId ? 'Update Billing' : 'Create Billing'" icon="pi pi-save" @click="createBilling" />
        <Button v-if="editingBillingId" label="New Billing" icon="pi pi-plus" text @click="resetBillingForm" />
        <Button label="Refresh Table" icon="pi pi-refresh" outlined @click="fetchBillings" />
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold">Advanced Filters</h3>
            <p class="text-xs opacity-60">Narrow the billing records by text, type, payment, status, date, and amount.</p>
          </div>
          <Button label="Clear Filters" text @click="resetTableFilters" />
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IftaLabel>
            <InputText v-model="tableFilterQuery" fluid placeholder="Search patient, label, ID" />
            <label>Search</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="tableFilterBillingType"
              :options="billingTypeOptions"
              optionLabel="label"
              optionValue="value"
              showClear
              fluid
            />
            <label>Billing Type</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="tableFilterPaymentType"
              :options="tablePaymentTypeOptions"
              optionLabel="label"
              optionValue="value"
              showClear
              fluid
            />
            <label>Payment Type</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="tableFilterStatus"
              :options="tableStatusOptions"
              optionLabel="label"
              optionValue="value"
              showClear
              fluid
            />
            <label>Billing Status</label>
          </IftaLabel>


        </div>

        <label class="inline-flex items-center gap-2 text-sm">
          <input v-model="tableFilterOutstandingOnly" type="checkbox" />
          <span>Outstanding balances only</span>
        </label>

        <div class="text-xs opacity-60">Showing {{ filteredBillings.length }} of {{ billings.length }} billing record{{ billings.length === 1 ? '' : 's' }}</div>
      </div>

      <DataTable :value="filteredBillings" dataKey="id" paginator :rows="10" :loading="isLoading">
        <Column field="created_at" header="Created" style="width: 160px" />
        <Column field="patient_name" header="Patient" style="width: 150px" />
        <Column field="billing_type" header="Billing Type" style="width: 160px" />
        <Column field="service_name" header="Label">
          <template #body="{data}">{{ data.service_name || "—" }}</template>
        </Column>
        <Column header="Due" style="width: 120px">
          <template #body="{data}">{{ asCurrency(data.amount_due) }}</template>
        </Column>
        <Column header="Paid" style="width: 120px">
          <template #body="{data}">{{ asCurrency(data.amount_paid) }}</template>
        </Column>
        <Column header="Actions" style="width: 220px">
          <template #body="{data}">
            <div class="flex items-center gap-1">
              <Button size="small" outlined icon="pi pi-eye" label="View Full Billing" @click="openBillingDetails(data.id)" />
              <Button size="small" text icon="pi pi-pencil" @click="loadBillingForEdit(data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="billingDetailsVisible" header="Full Billing Information" modal :style="{width: '760px'}">
      <div v-if="selectedBillingDetail" class="space-y-4">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
          <div><span class="opacity-60">Patient:</span> <strong>{{ selectedBillingDetail.patient_name || selectedBillingDetail.patient_id }}</strong></div>
          <div><span class="opacity-60">Appointment ID:</span> <strong>{{ selectedBillingDetail.appointment_id || '—' }}</strong></div>
          <div><span class="opacity-60">Billing Type:</span> <strong>{{ selectedBillingDetail.billing_type }}</strong></div>
          <div><span class="opacity-60">Payment Type:</span> <strong>{{ selectedBillingDetail.payment_reference || '—' }}</strong></div>
          <div><span class="opacity-60">Created:</span> <strong>{{ selectedBillingDetail.created_at }}</strong></div>
          <div><span class="opacity-60">Label:</span> <strong>{{ selectedBillingDetail.service_name || '—' }}</strong></div>
        </div>

        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
          <h4 class="text-sm font-semibold">Line Items</h4>
          <div v-if="selectedBillingLines.length === 0" class="text-sm opacity-60">No line items found.</div>
          <div v-else class="space-y-3">
            <div v-for="line in selectedBillingLines" :key="line.key" class="rounded-lg border border-[rgb(var(--app-border))] p-3 text-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <Tag v-if="line.type === 'bundle'" value="Bundle" severity="contrast" class="text-xs" />
                    <Tag v-else-if="line.type === 'package'" value="Package" severity="info" class="text-xs" />
                    <span class="font-medium">{{ line.name }}</span>
                  </div>
                  <div class="text-xs opacity-60">Qty: {{ line.quantity }}</div>
                </div>
                <div class="text-right shrink-0">
                  <div class="font-medium">{{ asCurrency(line.price * line.quantity) }}</div>
                  <div v-if="line.originalPrice && line.originalPrice > line.price" class="text-xs opacity-50 line-through">
                    {{ asCurrency(line.originalPrice * line.quantity) }}
                  </div>
                </div>
              </div>

              <div v-if="line.type === 'bundle'" class="mt-2 pl-2 space-y-1">
                <template v-for="cat in getBundleCategoryGroups(line.id, line.name)" :key="cat.label">
                  <div v-if="cat.items.length" class="text-xs">
                    <div class="font-semibold opacity-70 mb-1">{{ cat.label }}</div>
                    <div v-for="comp in cat.items" :key="comp.id" class="flex items-center gap-2 pl-2 opacity-60">
                      <i class="pi pi-circle-fill" style="font-size: 0.35rem"></i>
                      <span>{{ comp.name }}</span>
                      <span class="ml-auto">{{ asCurrency(comp.price) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5 text-sm">
          <div><span class="opacity-60">Original Total:</span> <strong>{{ asCurrency(selectedBillingOriginalTotal) }}</strong></div>
          <div><span class="opacity-60">Subtotal:</span> <strong>{{ asCurrency(selectedBillingDetail.subtotal_amount ?? selectedBillingDetail.amount_due) }}</strong></div>
          <div><span class="opacity-60">Discount:</span> <strong>{{ asCurrency(selectedBillingDetail.discount_amount ?? 0) }}</strong></div>
          <!-- VAT breakdown from saved record -->
          <template v-if="selectedBillingDetail.vat_enabled">
            <div><span class="opacity-60">Vatable Amount:</span> <strong>{{ asCurrency(selectedBillingDetail.vatable_amount ?? 0) }}</strong></div>
            <div><span class="opacity-60">VAT ({{ ((selectedBillingDetail.vat_rate ?? 0) * 100).toFixed(0) }}%):</span> <strong>{{ asCurrency(selectedBillingDetail.vat_amount ?? 0) }}</strong></div>
          </template>
          <div><span class="opacity-60">Total Due:</span> <strong>{{ asCurrency(selectedBillingDetail.total_amount ?? selectedBillingDetail.amount_due) }}</strong></div>
          <div><span class="opacity-60">Paid:</span> <strong>{{ asCurrency(selectedBillingDetail.amount_paid ?? 0) }}</strong></div>
        </div>
      </div>
      <template #footer>
        <Button label="Close" text @click="billingDetailsVisible = false" />
      </template>
    </Dialog>

    <Dialog v-model:visible="createBundleDialogVisible" header="Create New Bundle" modal :style="{width: '520px'}">
      <div class="space-y-3">
        <p class="text-sm opacity-70">
          Save the selected individual items as a reusable bundled service with discounted price.
        </p>

        <IftaLabel>
          <InputText v-model="createBundleName" fluid placeholder="Enter bundled service name" />
          <label>Bundle Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber
            v-model="createBundleDiscountedPrice"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
            :min="0"
          />
          <label>Bundled Price</label>
        </IftaLabel>

        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="opacity-60">Original Total</span><strong>{{ asCurrency(selectionOriginalTotal) }}</strong></div>
          <div class="flex justify-between"><span class="opacity-60">Bundled Price</span><strong>{{ asCurrency(Number(createBundleDiscountedPrice ?? 0)) }}</strong></div>
          <div class="flex justify-between text-green-600" v-if="Number(createBundleDiscountedPrice ?? 0) < selectionOriginalTotal">
            <span>You Save</span>
            <strong>{{ asCurrency(selectionOriginalTotal - Number(createBundleDiscountedPrice ?? 0)) }}</strong>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createBundleDialogVisible = false" />
        <Button label="Save As Bundle" icon="pi pi-check" @click="saveBundleFromSelection" />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import {useToast} from "primevue/usetoast"
import {patientService} from "@/features/patients/api/patient.service"
import {
  billingPhase1Service,
  type BillingLineItem,
  type BillingListItem,
  type BillingRequest,
  type BillingType,
  type DiscountType,
  type ServiceType
} from "@/features/billing/api/billing-phase1.service"
import {pamsAPI} from "@/utils/axios-interceptor"
import type {Lookup} from "@/models/global.model"
import type {Pageable} from "@/models/paging"
import {defaultPage, defaultPageSize} from "@/models/paging"
import type {OfferLookupDTO} from "@/models/global.model"
import type {Patient} from "@/features/patients/types/patient"
import {type BillingPickerLookup} from "@/features/billing/components/SingleServiceItemPicker.vue"
import {errorToast, successToast} from "@/utils/toast.util"
import {Status} from "@/utils/global.type"

const toast = useToast()
const isLoading = ref(false)
const copyingFromLastSession = ref(false)
const billings = ref<BillingListItem[]>([])
const editingBillingId = ref<number>()
const billingDetailsVisible = ref(false)
const selectedBillingDetail = ref<BillingListItem>()

// ── VAT ──────────────────────────────────────────────────────────────────────
// Philippines standard VAT rate. Currently Non-VAT; logic is prepared for
// future VAT registration. Toggle vatEnabled to activate the VAT flow.
const VAT_RATE = 0.12
const vatEnabled = ref(false) // set true when clinic becomes VAT-registered
// ─────────────────────────────────────────────────────────────────────────────
const createBundleDialogVisible = ref(false)
const createBundleName = ref("")
const createBundleDiscountedPrice = ref<number>(0)
const tableFilterQuery = ref("")
const tableFilterBillingType = ref<BillingType>()
const tableFilterPaymentType = ref<string>()
const tableFilterStatus = ref<string>()
const tableFilterDateFrom = ref<Date>()
const tableFilterDateTo = ref<Date>()
const tableFilterMinDue = ref<number | null>(null)
const tableFilterMaxDue = ref<number | null>(null)
const tableFilterOutstandingOnly = ref(false)

type LocalService = { id: string; type: string; name: string; price: number; status: string }
type LocalBundle = { id: string; name: string; machineIds: string[]; techniqueIds: string[]; evaluationIds: string[]; addOnIds: string[]; bundledPrice: number; status: string }
type LocalPackageOffer = { id: string; name: string; packagePrice: number; status: string }
const localServices = ref<LocalService[]>([])
const localBundles = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const patientOptions = ref<Lookup[]>([])

const formatPatientName = (patient: Partial<Patient>): string => {
  const fallback = (patient as {full_name?: string}).full_name
  if (fallback && fallback.trim()) return fallback.trim()
  return [patient.first_name, patient.middle_name, patient.last_name]
    .filter((part): part is string => !!part && part.toLowerCase() !== "null")
    .join(" ")
}

const loadPatientOptions = async (): Promise<void> => {
  const lookupResponse = await patientService.getAllLookup({
    pageable_request: {
      page: defaultPage,
      size: 1000,
      name: undefined,
      status: Status.ACTIVE
    },
    clinic_id: undefined
  })

  if ((lookupResponse?.content?.length ?? 0) > 0) {
    patientOptions.value = lookupResponse?.content ?? []
    return
  }

  const allPatientsResponse = await patientService.getAll({
    pageable_request: {
      page: defaultPage,
      size: 1000,
      name: undefined,
      status: Status.ACTIVE
    },
    clinic_id: undefined
  })

  patientOptions.value = (allPatientsResponse?.content ?? []).map(patient => ({
    id: patient.id,
    name: formatPatientName(patient)
  }))
}

const loadLocalData = (): void => {
  try { localServices.value = JSON.parse(localStorage.getItem("singlePayServices") || "[]") } catch { localServices.value = [] }
  try { localBundles.value = JSON.parse(localStorage.getItem("bundledServices") || "[]") } catch { localBundles.value = [] }
  try { localPackageOffers.value = JSON.parse(localStorage.getItem("packageServiceOffers") || "[]") } catch { localPackageOffers.value = [] }
}

const findBundle = (bundleId?: string | number, bundleName?: string): LocalBundle | undefined => {
  const normalizedId = String(bundleId ?? "").trim()
  if (normalizedId) {
    const matchedById = localBundles.value.find(b => b.id === normalizedId)
    if (matchedById) return matchedById
  }
  const normalizedName = (bundleName ?? "").trim().toLowerCase()
  if (!normalizedName) return undefined
  return localBundles.value.find(b => b.name.trim().toLowerCase() === normalizedName)
}

const getBundleComponents = (bundleId?: string | number, bundleName?: string): LocalService[] => {
  const bundle = findBundle(bundleId, bundleName)
  if (!bundle) return []
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds, ...bundle.addOnIds]
  return ids.map(id => localServices.value.find(s => s.id === id)).filter(Boolean) as LocalService[]
}

const getBundleCategoryGroups = (bundleId?: string | number, bundleName?: string): { label: string; items: LocalService[] }[] => {
  const bundle = findBundle(bundleId, bundleName)
  if (!bundle) return []
  const resolve = (ids: string[]) => ids.map(id => localServices.value.find(s => s.id === id)).filter(Boolean) as LocalService[]
  return [
    { label: "Machines", items: resolve(bundle.machineIds) },
    { label: "Techniques", items: resolve(bundle.techniqueIds) },
    { label: "Evaluations", items: resolve(bundle.evaluationIds) },
    { label: "Add-ons", items: resolve(bundle.addOnIds) },
  ]
}

type ParsedLine = { key: string; id: string; type: string; name: string; price: number; quantity: number; originalPrice?: number }

const parsedLineItems = (raw?: string): ParsedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{ id?: string | number; type?: string; name?: string; price?: number; originalPrice?: number; quantity?: number }>
    if (!Array.isArray(parsed)) return []
    return parsed.map((line, i) => ({
      key: `${i}-${line.id ?? line.name}`,
      id: String(line.id ?? ""),
      type: line.type ?? "service",
      name: line.name ?? "—",
      price: Number(line.price ?? 0),
      quantity: Math.max(1, Number(line.quantity ?? 1)),
      originalPrice: line.originalPrice ? Number(line.originalPrice) : undefined
    }))
  } catch {
    return []
  }
}

const selectedBillingLines = computed(() => parsedLineItems(selectedBillingDetail.value?.line_items_json))

const selectedBillingOriginalTotal = computed(() =>
  selectedBillingLines.value.reduce((sum, line) => sum + Number(line.originalPrice ?? line.price ?? 0) * Number(line.quantity ?? 1), 0)
)

const derivePaymentType = (billing: BillingListItem): string => {
  if (billing.payment_reference?.trim()) return billing.payment_reference.trim()
  const normalized = billing.billing_type?.trim().toUpperCase()
  if (normalized === "HMO_BILLING" || normalized === "HMO") return "HMO"
  if (normalized === "LGU_BILLING" || normalized === "LGU") return "LGU"
  return ""
}

const tablePaymentTypeOptions = computed(() => {
  const values = new Set(selfPayPaymentOptions.map(option => option.value))
  values.add("HMO")
  values.add("LGU")
  billings.value.forEach(billing => {
    const paymentType = derivePaymentType(billing)
    if (paymentType) values.add(paymentType)
  })
  return Array.from(values).map(value => ({label: value, value}))
})

const tableStatusOptions = computed(() => {
  const values = new Set<string>()
  billings.value.forEach(billing => {
    const status = billing.billing_status?.trim()
    if (status) values.add(status)
  })
  return Array.from(values).sort().map(value => ({label: value, value}))
})

const filteredBillings = computed(() => {
  const query = tableFilterQuery.value.trim().toLowerCase()
  const fromDate = tableFilterDateFrom.value ? new Date(tableFilterDateFrom.value) : undefined
  const toDate = tableFilterDateTo.value ? new Date(tableFilterDateTo.value) : undefined
  if (toDate) toDate.setHours(23, 59, 59, 999)

  return billings.value.filter(billing => {
    if (query) {
      const haystack = [
        String(billing.id ?? ""),
        String(billing.patient_id ?? ""),
        billing.patient_name ?? "",
        billing.service_name ?? "",
        String(billing.appointment_id ?? ""),
        billing.billing_type ?? ""
      ].join(" ").toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (tableFilterBillingType.value && billing.billing_type !== tableFilterBillingType.value) return false

    if (tableFilterPaymentType.value && derivePaymentType(billing) !== tableFilterPaymentType.value) return false

    if (tableFilterStatus.value && (billing.billing_status ?? "") !== tableFilterStatus.value) return false

    const createdAt = billing.created_at ? new Date(billing.created_at) : undefined
    if (fromDate && (!createdAt || createdAt < fromDate)) return false
    if (toDate && (!createdAt || createdAt > toDate)) return false

    const amountDue = Number(billing.amount_due ?? 0)
    const amountPaid = Number(billing.amount_paid ?? 0)
    if (tableFilterMinDue.value != null && amountDue < Number(tableFilterMinDue.value)) return false
    if (tableFilterMaxDue.value != null && amountDue > Number(tableFilterMaxDue.value)) return false
    if (tableFilterOutstandingOnly.value && amountPaid >= amountDue) return false

    return true
  })
})

const resetTableFilters = (): void => {
  tableFilterQuery.value = ""
  tableFilterBillingType.value = undefined
  tableFilterPaymentType.value = undefined
  tableFilterStatus.value = undefined
  tableFilterDateFrom.value = undefined
  tableFilterDateTo.value = undefined
  tableFilterMinDue.value = null
  tableFilterMaxDue.value = null
  tableFilterOutstandingOnly.value = false
}

const selfPayPaymentOptions = [
  { label: "Cash", value: "Cash" },
  { label: "GCash", value: "GCash" },
  { label: "E-wallet", value: "E-wallet" },
  { label: "Other", value: "Other" },
]

const discountTypeOptions: Array<{label: string; value: DiscountType}> = [
  {label: "Percentage", value: "PERCENTAGE"},
  {label: "Fixed Amount", value: "FIXED"},
]

const isSelfPay = computed(() =>
  form.value.billing_type === "SELF_PAY_SINGLE" || form.value.billing_type === "SELF_PAY_PACKAGE"
)

const machines = ref<BillingPickerLookup[]>([])
const techniques = ref<BillingPickerLookup[]>([])
const evaluations = ref<BillingPickerLookup[]>([])
const addOnMachines = ref<BillingPickerLookup[]>([])
const addOnTechniques = ref<BillingPickerLookup[]>([])
const addOnHomeServices = ref<BillingPickerLookup[]>([])

type SelectedLine = {
  key: string
  id: number | string
  type: string
  name: string
  price: number
  quantity: number
  originalPrice?: number
}

const selectedLines = ref<SelectedLine[]>([])
const selectedLineType = ref<SelectedLine["type"]>("machine")
const selectedLineId = ref<number | string>()
const selectedLineQty = ref<number>(1)
const selectedPackageOfferId = ref<string>()
const manualDiscountEnabled = ref(false)
const manualDiscountType = ref<DiscountType>("PERCENTAGE")
const manualDiscountValue = ref<number>(0)
const manualDiscountReason = ref("")

const activePackageOffers = computed(() =>
  localPackageOffers.value.filter(item => item.status !== "Inactive")
)

const lineTypeOptions: Array<{label: string; value: SelectedLine["type"]}> = [
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-on (Machine)", value: "add-on-machine"},
  {label: "Add-on (Technique)", value: "add-on-technique"},
  {label: "Add-on (Home Service)", value: "add-on-home-service"},
]

const currentLineTypeOptions = computed(() => {
  const type = selectedLineType.value
  if (type === "machine") return machines.value
  if (type === "technique") return techniques.value
  if (type === "evaluation") return evaluations.value
  if (type === "add-on-machine") return addOnMachines.value
  if (type === "add-on-technique") return addOnTechniques.value
  return addOnHomeServices.value
})

const selectedIndividualLines = computed(() =>
  selectedLines.value.filter(line => line.type !== "bundle" && line.type !== "package")
)

const selectionOriginalTotal = computed(() =>
  selectedIndividualLines.value.reduce((sum, line) => sum + Number(line.price ?? 0) * Number(line.quantity ?? 1), 0)
)

const buildBundlePartsFromSelection = (): {
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
} => {
  const machineIds = new Set<string>()
  const techniqueIds = new Set<string>()
  const evaluationIds = new Set<string>()
  const addOnIds = new Set<string>()

  selectedIndividualLines.value.forEach(line => {
    const id = String(line.id)
    if (line.type === "machine") machineIds.add(id)
    else if (line.type === "technique") techniqueIds.add(id)
    else if (line.type === "evaluation") evaluationIds.add(id)
    else if (line.type === "add-on-machine" || line.type === "add-on-technique" || line.type === "add-on-home-service") addOnIds.add(id)
  })

  return {
    machineIds: Array.from(machineIds),
    techniqueIds: Array.from(techniqueIds),
    evaluationIds: Array.from(evaluationIds),
    addOnIds: Array.from(addOnIds),
  }
}

const normalizeIds = (ids: string[]): string[] => [...ids].map(String).sort()

const isSameStringSet = (a: string[], b: string[]): boolean => {
  const left = normalizeIds(a)
  const right = normalizeIds(b)
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

const findExistingBundleFromSelection = computed(() => {
  const parts = buildBundlePartsFromSelection()
  const hasAny = parts.machineIds.length + parts.techniqueIds.length + parts.evaluationIds.length + parts.addOnIds.length > 0
  if (!hasAny) return undefined

  return localBundles.value.find(bundle =>
    isSameStringSet(bundle.machineIds, parts.machineIds)
    && isSameStringSet(bundle.techniqueIds, parts.techniqueIds)
    && isSameStringSet(bundle.evaluationIds, parts.evaluationIds)
    && isSameStringSet(bundle.addOnIds, parts.addOnIds)
  )
})

const existingBundleMatchName = computed(() => findExistingBundleFromSelection.value?.name)

const canCreateBundleFromSelection = computed(() => {
  if (!selectedLines.value.length) return false
  if (selectedLines.value.some(line => line.type === "bundle" || line.type === "package")) return false
  if (!selectedIndividualLines.value.length) return false
  if (selectionOriginalTotal.value <= 0) return false
  return !findExistingBundleFromSelection.value
})

const billingTypeOptions = [
  {label: "Self Pay: Single Service", value: "SELF_PAY_SINGLE"},
  {label: "Self Pay: Package Service", value: "SELF_PAY_PACKAGE"},
  {label: "HMO", value: "HMO_BILLING"},
  {label: "LGU", value: "LGU_BILLING"}
]

const fetchLookup = async (path: string): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<OfferLookupDTO>>(path, {
    params: {
      page: 1,
      size: 500,
      status: Status.ACTIVE
    }
  })
  return (data?.content ?? []).map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price ?? 0)
  }))
}

const form = ref<{
  patient_id?: number
  appointment_id?: number
  billing_type: BillingType
  service_type: ServiceType
  service_name?: string
  amount_paid: number
  amount_tendered?: number
  payment_type?: string
  senior_pwd_id_presented?: boolean
  senior_pwd_id_reference?: string
}>({
  billing_type: "SELF_PAY_SINGLE",
  service_type: "SINGLE",
  amount_paid: 0,
  amount_tendered: 0,
  senior_pwd_id_presented: false
})

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const formatType = (type: string): string => {
  const typeMap: Record<string, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-on (Machine)",
    "add-on-technique": "Add-on (Technique)",
    "add-on-home-service": "Add-on (Home Service)"
  }
  return typeMap[type] || type
}

const removeLine = (key: string): void => {
  selectedLines.value = selectedLines.value.filter(item => item.key !== key)
}

const setLineQuantity = (key: string, value: number | null | undefined): void => {
  const qty = Math.max(1, Number(value ?? 1))
  selectedLines.value = selectedLines.value.map(item =>
    item.key === key
      ? {
        ...item,
        quantity: qty
      }
      : item
  )
}

const addSelectedLine = (): void => {
  if (!selectedLineId.value) return
  const found = currentLineTypeOptions.value.find(item => String(item.id) === String(selectedLineId.value))
  if (!found) return

  selectedLines.value.push({
    key: crypto.randomUUID(),
    id: found.id,
    type: selectedLineType.value,
    name: found.name,
    price: Number(found.price ?? 0),
    quantity: Math.max(1, Number(selectedLineQty.value ?? 1))
  })

  selectedLineId.value = undefined
  selectedLineQty.value = 1
}

const addSelectedPackageOffer = (): void => {
  if (!selectedPackageOfferId.value) return
  const found = activePackageOffers.value.find(item => item.id === selectedPackageOfferId.value)
  if (!found) return

  selectedLines.value.push({
    key: crypto.randomUUID(),
    id: found.id,
    type: "package",
    name: found.name,
    price: Number(found.packagePrice ?? 0),
    quantity: 1
  })

  selectedPackageOfferId.value = undefined
}

const lineItemsAsPayload = computed((): BillingLineItem[] =>
  selectedLines.value.map(item => ({
    id: item.id,
    type: item.type as BillingLineItem["type"],
    name: item.name,
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    originalPrice: item.originalPrice != null ? Number(item.originalPrice) : undefined
  }))
)

const originalSubtotalFromLines = computed(() =>
  selectedLines.value.reduce((sum, line) => {
    const originalUnitPrice = Number(line.originalPrice ?? line.price ?? 0)
    return sum + originalUnitPrice * Number(line.quantity ?? 1)
  }, 0)
)

const subtotalFromLines = computed(() =>
  lineItemsAsPayload.value.reduce((sum, line) => sum + line.price * line.quantity, 0)
)

const posSummary = computed(() => {
  const originalSubtotal = Number(originalSubtotalFromLines.value)
  const subtotal = Number(subtotalFromLines.value)
  const seniorDiscountAmount = form.value.senior_pwd_id_presented ? Math.max(0, subtotal * 0.2) : 0
  const remainingAfterSenior = Math.max(0, subtotal - seniorDiscountAmount)
  const customDiscountAmount = manualDiscountEnabled.value
    ? manualDiscountType.value === "PERCENTAGE"
      ? Math.max(0, remainingAfterSenior * (Number(manualDiscountValue.value ?? 0) / 100))
      : Math.max(0, Number(manualDiscountValue.value ?? 0))
    : 0
  const discountAmount = Math.min(subtotal, seniorDiscountAmount + customDiscountAmount)
  const vatableAmount = Math.max(0, subtotal - discountAmount)
  const vatAmount = vatEnabled.value ? Math.round(vatableAmount * VAT_RATE * 100) / 100 : 0
  const totalDue = Math.max(0, vatableAmount + vatAmount)
  const tendered = Number(form.value.amount_tendered ?? 0)
  const changeAmount = Math.max(0, tendered - totalDue)
  return {
    originalSubtotal,
    subtotal,
    discountAmount,
    vatableAmount,
    vatAmount,
    totalDue,
    changeAmount,
    seniorDiscountAmount,
    customDiscountAmount
  }
})

const loadLookups = async (): Promise<void> => {
  const [machinesRes, techniquesRes, evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes] = await Promise.all([
    fetchLookup("/machines/lookup"),
    fetchLookup("/techniques/lookup"),
    fetchLookup("/evaluations/lookup"),
    fetchLookup("/add-on-machines/lookup"),
    fetchLookup("/add-on-techniques/lookup"),
    fetchLookup("/add-on-home-services/lookup")
  ])

  await loadPatientOptions()
  machines.value = machinesRes
  techniques.value = techniquesRes
  evaluations.value = evaluationsRes
  addOnMachines.value = addOnMachinesRes
  addOnTechniques.value = addOnTechniquesRes
  addOnHomeServices.value = addOnHomeRes
  loadLocalData()
}

const fetchBillings = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await billingPhase1Service.getAll({page: 1, size: 20})
    billings.value = response?.content ?? []
  } catch {
    errorToast(toast, "Failed to load billings")
  } finally {
    isLoading.value = false
  }
}

const resetBillingForm = (): void => {
  editingBillingId.value = undefined
  selectedLines.value = []
  selectedLineType.value = "machine"
  selectedLineId.value = undefined
  selectedLineQty.value = 1
  selectedPackageOfferId.value = undefined
  manualDiscountEnabled.value = false
  manualDiscountType.value = "PERCENTAGE"
  manualDiscountValue.value = 0
  manualDiscountReason.value = ""
  createBundleDialogVisible.value = false
  createBundleName.value = ""
  createBundleDiscountedPrice.value = 0
  form.value = {
    billing_type: "SELF_PAY_SINGLE",
    service_type: "SINGLE",
    amount_paid: 0,
    amount_tendered: 0,
    payment_type: undefined,
    senior_pwd_id_presented: false
  }
}

const copyFromLastSession = async (): Promise<void> => {
  if (!form.value.patient_id) return
  copyingFromLastSession.value = true
  try {
    // Look in already-loaded billings first
    const localMatch = billings.value
      .filter(b => b.patient_id === form.value.patient_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    let billingId: number | undefined = localMatch?.id

    // If not found locally, try fetching from the API with a patient_id param
    if (!billingId) {
      const apiResult = await billingPhase1Service.getAll({
        patient_id: form.value.patient_id,
        page: 1,
        size: 1
      })
      billingId = apiResult?.content?.[0]?.id
    }

    if (!billingId) {
      errorToast(toast, "No previous billing found for this patient")
      return
    }

    const detail = await billingPhase1Service.getById(billingId)
    if (!detail) {
      errorToast(toast, "Failed to load previous billing details")
      return
    }

    const lines = parseBillingLines(detail.line_items_json)
    if (!lines.length) {
      errorToast(toast, "Previous billing had no line items to copy")
      return
    }

    selectedLines.value = lines
    successToast(toast, `Copied ${lines.length} item${lines.length === 1 ? '' : 's'} from last session (${detail.created_at})`)
  } catch {
    errorToast(toast, "Failed to copy from last session")
  } finally {
    copyingFromLastSession.value = false
  }
}

const openCreateBundleFromSelection = (): void => {
  createBundleName.value = form.value.service_name?.trim() || `Custom Bundle ${new Date().toLocaleDateString("en-PH")}`
  createBundleDiscountedPrice.value = selectionOriginalTotal.value
  createBundleDialogVisible.value = true
}

const saveBundleFromSelection = (): void => {
  if (!canCreateBundleFromSelection.value) {
    errorToast(toast, "Selected items cannot be saved as a new bundle")
    return
  }

  const bundleName = createBundleName.value.trim()
  const discountedPrice = Number(createBundleDiscountedPrice.value ?? 0)

  if (!bundleName) {
    errorToast(toast, "Bundle name is required")
    return
  }
  if (discountedPrice < 0) {
    errorToast(toast, "Bundled price must be 0 or greater")
    return
  }

  const parts = buildBundlePartsFromSelection()
  const newBundle: LocalBundle = {
    id: `bundle-${Date.now()}`,
    name: bundleName,
    machineIds: parts.machineIds,
    techniqueIds: parts.techniqueIds,
    evaluationIds: parts.evaluationIds,
    addOnIds: parts.addOnIds,
    bundledPrice: discountedPrice,
    status: "Active"
  }

  localBundles.value = [...localBundles.value, newBundle]
  localStorage.setItem("bundledServices", JSON.stringify(localBundles.value))

  selectedLines.value = [{
    key: crypto.randomUUID(),
    id: newBundle.id,
    type: "bundle",
    name: newBundle.name,
    price: newBundle.bundledPrice,
    quantity: 1,
    originalPrice: selectionOriginalTotal.value
  }]

  form.value.service_name = newBundle.name
  createBundleDialogVisible.value = false
  successToast(toast, "Bundle created and applied to this billing")
}

const createBilling = async (): Promise<void> => {
  if (!form.value.patient_id) {
    errorToast(toast, "Patient ID is required")
    return
  }

  if (!selectedLines.value.length) {
    errorToast(toast, "Please add at least one availed product/service")
    return
  }

  const payload: BillingRequest = {
    patient_id: form.value.patient_id,
    appointment_id: form.value.appointment_id,
    billing_type: form.value.billing_type,
    service_type: form.value.service_type,
    service_name: form.value.service_name?.trim() || undefined,
    line_items_json: JSON.stringify(lineItemsAsPayload.value),
    amount_due: posSummary.value.totalDue,
    amount_paid: Number(form.value.amount_paid ?? 0),
    payment_reference: form.value.payment_type,
    discount_type: manualDiscountEnabled.value
      ? manualDiscountType.value
      : (form.value.senior_pwd_id_presented ? "PERCENTAGE" : undefined),
    discount_value: manualDiscountEnabled.value
      ? Number(manualDiscountValue.value ?? 0)
      : (form.value.senior_pwd_id_presented ? 20 : undefined),
    discount_amount: posSummary.value.discountAmount,
    subtotal_amount: posSummary.value.subtotal,
    total_amount: posSummary.value.totalDue,
    amount_tendered: form.value.amount_tendered,
    change_amount: posSummary.value.changeAmount,
    senior_pwd_id_presented: !!form.value.senior_pwd_id_presented,
    senior_pwd_id_reference: form.value.senior_pwd_id_reference?.trim() || undefined,
    notes: manualDiscountReason.value.trim() || undefined,
    // VAT fields — persisted even in Non-VAT mode for future accounting reconciliation
    vat_enabled: vatEnabled.value,
    vat_rate: vatEnabled.value ? VAT_RATE : 0,
    vatable_amount: posSummary.value.vatableAmount,
    vat_amount: posSummary.value.vatAmount,
  }

  try {
    if (editingBillingId.value) {
      await billingPhase1Service.update(editingBillingId.value, payload)
      successToast(toast, "Billing updated")
    } else {
      await billingPhase1Service.save(payload)
      successToast(toast, "Billing created")
    }
    await fetchBillings()
    resetBillingForm()
  } catch {
    errorToast(toast, "Failed to save billing")
  }
}

const loadBillingForEdit = async (billingId: number): Promise<void> => {
  const detail = await billingPhase1Service.getById(billingId)
  if (!detail) return

  editingBillingId.value = detail.id
  form.value = {
    patient_id: detail.patient_id,
    appointment_id: detail.appointment_id,
    billing_type: normalizeBillingType(detail.billing_type),
    service_type: normalizeServiceType(detail.service_type),
    service_name: detail.service_name,
    amount_paid: Number(detail.amount_paid ?? 0),
    amount_tendered: Number(detail.amount_tendered ?? 0),
    payment_type: detail.payment_reference ?? (detail.billing_type === "HMO_BILLING" ? "HMO" : detail.billing_type === "LGU_BILLING" ? "LGU" : undefined),
    senior_pwd_id_presented: !!detail.senior_pwd_id_presented,
    senior_pwd_id_reference: detail.senior_pwd_id_reference
  }

  if (detail.discount_type && detail.discount_value != null) {
    manualDiscountEnabled.value = true
    manualDiscountType.value = detail.discount_type
    manualDiscountValue.value = Number(detail.discount_value ?? 0)
  }

  selectedLines.value = parseBillingLines(detail.line_items_json)
}

const openBillingDetails = async (billingId: number): Promise<void> => {
  const detail = await billingPhase1Service.getById(billingId)
  if (!detail) {
    errorToast(toast, "Failed to load billing details")
    return
  }

  selectedBillingDetail.value = detail
  billingDetailsVisible.value = true
}

const normalizeBillingType = (value: string): BillingType => {
  const normalized = value.trim().toLowerCase()
  if (normalized === "self pay: single service") return "SELF_PAY_SINGLE"
  if (normalized === "self pay: package service") return "SELF_PAY_PACKAGE"
  if (normalized === "hmo") return "HMO_BILLING"
  if (normalized === "lgu") return "LGU_BILLING"
  if (normalized === "individual pricing") return "INDIVIDUAL_PRICING"
  if (normalized === "package billing") return "PACKAGE_BILLING"
  return "ALA_CARTE"
}

const normalizeServiceType = (value: string): ServiceType => {
  const normalized = value.trim().toLowerCase()
  if (normalized === "package") return "PACKAGE"
  if (normalized === "hmo") return "HMO"
  if (normalized === "lgu") return "LGU"
  return "SINGLE"
}

const parseBillingLines = (raw?: string): SelectedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{id?: string | number; type?: string; name?: string; price?: number; quantity?: number; originalPrice?: number}>
    if (!Array.isArray(parsed)) return []
    return parsed.map(line => ({
      key: crypto.randomUUID(),
      id: line.id ?? "",
      type: line.type ?? "service",
      name: line.name ?? "—",
      price: Number(line.price ?? 0),
      quantity: Math.max(1, Number(line.quantity ?? 1)),
      originalPrice: line.originalPrice ? Number(line.originalPrice) : undefined
    }))
  } catch {
    return []
  }
}

watch(
  () => form.value.billing_type,
  (value) => {
    const serviceTypeMap: Record<BillingType, ServiceType> = {
      SELF_PAY_SINGLE: "SINGLE",
      SELF_PAY_PACKAGE: "PACKAGE",
      HMO_BILLING: "HMO",
      LGU_BILLING: "LGU",
      INDIVIDUAL_PRICING: "SINGLE",
      PACKAGE_BILLING: "PACKAGE",
      ALA_CARTE: "SINGLE",
    }
    form.value.service_type = serviceTypeMap[value] ?? "SINGLE"
    if (value === "HMO_BILLING") form.value.payment_type = "HMO"
    else if (value === "LGU_BILLING") form.value.payment_type = "LGU"
    else form.value.payment_type = undefined
  }
)

onMounted(async () => {
  await loadLookups()
  await fetchBillings()
})
</script>
