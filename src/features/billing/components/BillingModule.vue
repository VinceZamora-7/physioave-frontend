<template>
  <main class="app-page-shell space-y-4">
    <section v-if="drillDownLabel" class="app-inline-banner">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-sm font-medium">{{ drillDownLabel }}</div>
        <Button label="Clear Drill-down" text size="small" icon="pi pi-times" @click="clearDrillDown" />
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <h2 class="app-section-title">Billing POS</h2>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <InputNumber v-model="form.patient_id" :min="1" fluid />
          <label>Patient ID</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="form.appointment_id" :min="1" fluid />
          <label>Appointment ID (optional)</label>
        </IftaLabel>
        <IftaLabel>
          <Select v-model="form.billing_type" :options="billingTypeOptions" optionLabel="label" optionValue="value" fluid />
          <label>Billing Type</label>
        </IftaLabel>
        <IftaLabel>
          <Select v-model="form.service_type" :options="serviceTypeOptions" optionLabel="label" optionValue="value" fluid />
          <label>Service Type</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="form.amount_due" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Due</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="form.amount_paid" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Paid</label>
        </IftaLabel>
      </div>

      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <h4 class="text-sm font-semibold">Important Details</h4>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <Select
            v-model="form.payment_method_id"
            :options="paymentMethodOptions"
            optionLabel="name"
            optionValue="id"
            filter
            showClear
            fluid
          />
          <label>Payment Method</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="form.senior_pwd_id_reference" fluid :disabled="!form.senior_pwd_id_presented" />
          <label>Senior/PWD ID Reference</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="form.amount_tendered" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Tendered</label>
        </IftaLabel>
        </div>
      </div>

      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <h4 class="text-sm font-semibold">Additional Details</h4>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <Select
            v-model="form.package_id"
            :options="packageOptions"
            optionLabel="name"
            optionValue="id"
            filter
            showClear
            fluid
          />
          <label>Package (sorted)</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="form.service_name" fluid />
          <label>Service Name</label>
        </IftaLabel>
        </div>
      </div>
      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
        <div class="mb-2">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.senior_pwd_id_presented" type="checkbox" />
            <span>Senior/PWD ID presented</span>
          </label>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <div><span class="opacity-70">Subtotal:</span> <strong>{{ asCurrency(posSummary.subtotal) }}</strong></div>
          <div><span class="opacity-70">Discount:</span> <strong>{{ asCurrency(posSummary.discountAmount) }}</strong></div>
          <div><span class="opacity-70">Total Due:</span> <strong>{{ asCurrency(posSummary.totalDue) }}</strong></div>
          <div><span class="opacity-70">Change:</span> <strong>{{ asCurrency(posSummary.changeAmount) }}</strong></div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          :label="editingBillingId ? 'Update Billing' : 'Create Billing'"
          icon="pi pi-save"
          @click="createBilling"
        />
        <Button
          v-if="editingBillingId"
          label="New Billing"
          icon="pi pi-plus"
          text
          :disabled="!!focusedAppointmentId"
          @click="resetBillingForm"
        />
        <Button
          v-if="editingBillingId"
          label="Print Receipt"
          icon="pi pi-print"
          severity="secondary"
          outlined
          @click="printReceipt"
        />
        <Button label="Refresh Table" icon="pi pi-refresh" outlined @click="fetchBillings" />
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="flex flex-wrap items-end gap-2">
        <IftaLabel>
          <InputText v-model="filters.name" fluid />
          <label>Patient filter</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="filters.billing_status" fluid placeholder="PAID/PENDING/PARTIAL" />
          <label>Status</label>
        </IftaLabel>
        <Button label="Export CSV" icon="pi pi-download" severity="secondary" outlined @click="exportCsv" />
      </div>

      <DataTable
        :value="billings"
        dataKey="id"
        paginator
        :rows="pageSize"
        :first="(page - 1) * pageSize"
        :totalRecords="totalElements"
        :loading="isLoading"
        @page="onPage"
      >
        <Column field="created_at" header="Created">
          <template #body="{data}">{{ formatDateTime(data.created_at) }}</template>
        </Column>
        <Column field="patient_name" header="Patient" />
        <Column field="billing_type" header="Billing Type" />
        <Column field="service_type" header="Service Type" />
        <Column field="package_name" header="Package" />
        <Column field="payment_method_name" header="Payment Method" />
        <Column field="billing_status" header="Status">
          <template #body="{data}">
            <Tag :value="data.billing_status" :severity="statusSeverity(data.billing_status)" />
          </template>
        </Column>
        <Column field="amount_due" header="Due">
          <template #body="{data}">{{ asCurrency(data.amount_due) }}</template>
        </Column>
        <Column field="amount_paid" header="Paid">
          <template #body="{data}">{{ asCurrency(data.amount_paid) }}</template>
        </Column>
        <Column header="Actions">
          <template #body="{data}">
            <div class="flex items-center gap-1">
              <Button size="small" text icon="pi pi-eye" @click="openBillingModal(data.id)" />
              <Button v-if="canDeleteBillings" size="small" text severity="danger" icon="pi pi-trash" @click="confirmDeleteBilling(data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="billingModalVisible" modal header="Billing Details" :style="{width:'720px'}">
      <div v-if="selectedBillingDetail" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Billing ID</div>
          <div class="font-medium">{{ selectedBillingDetail.id }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Created</div>
          <div class="font-medium">{{ formatDateTime(selectedBillingDetail.created_at) }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Patient</div>
          <div class="font-medium">{{ selectedBillingDetail.patient_name }} (#{{ selectedBillingDetail.patient_id }})</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Appointment</div>
          <div class="font-medium">{{ selectedBillingDetail.appointment_id ?? "N/A" }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Billing Type</div>
          <div class="font-medium">{{ selectedBillingDetail.billing_type }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Service</div>
          <div class="font-medium">{{ selectedBillingDetail.service_name ?? selectedBillingDetail.package_name ?? "N/A" }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Payment Method</div>
          <div class="font-medium">{{ selectedBillingDetail.payment_method_name ?? "N/A" }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Status</div>
          <Tag :value="selectedBillingDetail.billing_status" :severity="statusSeverity(selectedBillingDetail.billing_status)" />
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Subtotal</div>
          <div class="font-medium">{{ asCurrency(Number(selectedBillingDetail.subtotal_amount ?? selectedBillingDetail.amount_due ?? 0)) }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Discount</div>
          <div class="font-medium">{{ asCurrency(Number(selectedBillingDetail.discount_amount ?? 0)) }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Amount Due</div>
          <div class="font-medium">{{ asCurrency(selectedBillingDetail.amount_due) }}</div>
        </div>
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
          <div class="text-xs opacity-70">Amount Paid</div>
          <div class="font-medium">{{ asCurrency(selectedBillingDetail.amount_paid) }}</div>
        </div>
      </div>
      <template #footer>
        <Button label="Close" text @click="billingModalVisible = false" />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useConfirm, useToast} from "primevue";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, {type DataTablePageEvent} from "primevue/datatable";
import Dialog from "primevue/dialog";
import IftaLabel from "primevue/iftalabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {billingPhase1Service, type BillingRequest, type BillingType, type BillingListItem, type PackageLookup, type PaymentMethodLookup, type ServiceType} from "@/features/billing/api/billing-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {errorToast, successToast} from "@/utils/toast.util";
import {PROMO_OFFERS_CATALOG} from "@/features/promos-offers/data/promos-offers.data";

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const roleName = ref("")
const isLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const billings = ref<BillingListItem[]>([])
const packageOptions = ref<PackageLookup[]>([])
const paymentMethodOptions = ref<PaymentMethodLookup[]>([])
const billingModalVisible = ref(false)
const selectedBillingDetail = ref<BillingListItem>()

const billingTypeOptions = [
  {label: "Individual Pricing", value: "INDIVIDUAL_PRICING"},
  {label: "Package Billing", value: "PACKAGE_BILLING"},
  {label: "Ala Carte", value: "ALA_CARTE"},
]

const serviceTypeOptions = [
  {label: "Single", value: "SINGLE"},
  {label: "Package", value: "PACKAGE"},
  {label: "HMO", value: "HMO"},
]

const form = ref<{
  patient_id?: number
  appointment_id?: number
  package_id?: number
  billing_type: BillingType
  service_type: ServiceType
  service_name?: string
  amount_due: number
  amount_paid: number
  payment_method_id?: number
  senior_pwd_id_presented?: boolean
  senior_pwd_id_reference?: string
  amount_tendered?: number
}>({
  billing_type: "INDIVIDUAL_PRICING",
  service_type: "SINGLE",
  amount_due: 0,
  amount_paid: 0,
  senior_pwd_id_presented: false,
})

const filters = ref({
  name: "",
  billing_status: "",
  patient_id: undefined as number | undefined
})

const focusedBillingId = ref<number>()
const focusedAppointmentId = ref<number>()
const editingBillingId = ref<number>()

const drillDownLabel = computed(() => {
  const labels: string[] = []
  if (filters.value.patient_id) labels.push(`Patient ID: ${filters.value.patient_id}`)
  if (focusedAppointmentId.value) labels.push(`Appointment ID: ${focusedAppointmentId.value}`)
  if (focusedBillingId.value) labels.push(`Billing ID: ${focusedBillingId.value}`)
  return labels.length ? `Drill-down active (${labels.join(" | ")})` : ""
})
const canDeleteBillings = computed(() => roleName.value === "Owner")

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const posSummary = computed(() => {
  const subtotal = Number(form.value.amount_due ?? 0)
  const discountAmount = form.value.senior_pwd_id_presented ? Math.max(0, subtotal * 0.2) : 0
  const totalDue = Math.max(0, subtotal - discountAmount)
  const tendered = Number(form.value.amount_tendered ?? 0)
  const changeAmount = Math.max(0, tendered - totalDue)
  return {subtotal, discountAmount, totalDue, changeAmount}
})

const selectedPaymentMethodName = computed(() => {
  const selected = paymentMethodOptions.value.find(item => item.id === form.value.payment_method_id)
  return selected?.name || ""
})

const matchedPromoOffer = computed(() => {
  const serviceName = (form.value.service_name || "").trim().toLowerCase()
  if (!serviceName) return undefined
  return PROMO_OFFERS_CATALOG.find(item => item.name.trim().toLowerCase() === serviceName)
})

const resolveOfferSubtotal = (): number | undefined => {
  if (!matchedPromoOffer.value) return undefined
  const isHmoPayment = selectedPaymentMethodName.value.toLowerCase().includes("hmo")
  return isHmoPayment ? matchedPromoOffer.value.regular_price : matchedPromoOffer.value.promo_price
}

const statusSeverity = (status: string): "success" | "warn" | "danger" | "info" => {
  const normalized = status.toUpperCase()
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const mapDetailToForm = (detail: BillingListItem): void => {
  form.value = {
    patient_id: detail.patient_id,
    appointment_id: detail.appointment_id,
    package_id: detail.package_id,
    billing_type: String(detail.billing_type).toUpperCase().replace(/ /g, "_") as BillingType,
    service_type: String(detail.service_type).toUpperCase() as ServiceType,
    service_name: detail.service_name ?? undefined,
    amount_due: Number(detail.subtotal_amount ?? detail.amount_due ?? 0),
    amount_paid: Number(detail.amount_paid ?? 0),
    payment_method_id: detail.payment_method_id,
    senior_pwd_id_presented: !!detail.senior_pwd_id_presented,
    senior_pwd_id_reference: detail.senior_pwd_id_reference ?? undefined,
    amount_tendered: Number(detail.amount_tendered ?? 0),
  }
}

const resetBillingForm = (): void => {
  editingBillingId.value = undefined
  form.value = {
    patient_id: filters.value.patient_id,
    appointment_id: focusedAppointmentId.value,
    package_id: undefined,
    billing_type: "INDIVIDUAL_PRICING",
    service_type: "SINGLE",
    service_name: undefined,
    amount_due: 0,
    amount_paid: 0,
    payment_method_id: undefined,
    senior_pwd_id_presented: false,
    senior_pwd_id_reference: undefined,
    amount_tendered: 0,
  }
}

const loadPackages = async (): Promise<void> => {
  packageOptions.value = await billingPhase1Service.getPackages() ?? []
  paymentMethodOptions.value = await billingPhase1Service.getPaymentMethods() ?? []
}

const fetchBillings = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await billingPhase1Service.getAll({
      page: page.value,
      size: pageSize.value,
      name: filters.value.name.trim() || undefined,
      billing_status: filters.value.billing_status.trim() || undefined,
      patient_id: filters.value.patient_id,
      appointment_id: focusedAppointmentId.value
    })
    let content = response?.content ?? []
    if (focusedBillingId.value) {
      content = content.filter(b => b.id === focusedBillingId.value)
    }
    billings.value = content
    totalElements.value = response?.total_elements ?? 0
  } catch (error: unknown) {
    errorToast(toast, "Failed to load billings")
  } finally {
    isLoading.value = false
  }
}

const createBilling = async (): Promise<void> => {
  if (!form.value.patient_id || form.value.amount_due <= 0) {
    errorToast(toast, "Patient ID and amount due are required")
    return
  }
  if (focusedAppointmentId.value && !editingBillingId.value) {
    errorToast(toast, "This appointment should update the pre-created billing record")
    return
  }

  const payload: BillingRequest = {
    patient_id: form.value.patient_id,
    appointment_id: form.value.appointment_id,
    package_id: form.value.package_id,
    billing_type: form.value.billing_type,
    service_type: form.value.service_type,
    service_name: form.value.service_name?.trim() || undefined,
    amount_due: posSummary.value.totalDue,
    amount_paid: form.value.amount_tendered != null
      ? Math.min(posSummary.value.totalDue, Number(form.value.amount_tendered))
      : form.value.amount_paid,
    payment_method_id: form.value.payment_method_id,
    discount_type: form.value.senior_pwd_id_presented ? "PERCENTAGE" : undefined,
    discount_value: form.value.senior_pwd_id_presented ? 20 : undefined,
    discount_amount: posSummary.value.discountAmount,
    subtotal_amount: posSummary.value.subtotal,
    total_amount: posSummary.value.totalDue,
    amount_tendered: form.value.amount_tendered,
    change_amount: posSummary.value.changeAmount,
    receipt_number: editingBillingId.value ? `OR-${String(editingBillingId.value).padStart(6, "0")}` : undefined,
    senior_pwd_id_presented: !!form.value.senior_pwd_id_presented,
    senior_pwd_id_reference: form.value.senior_pwd_id_reference?.trim() || undefined,
  }

  try {
    if (editingBillingId.value) {
      await billingPhase1Service.update(editingBillingId.value, payload)
      successToast(toast, "Billing updated")
    } else {
      const newId = await billingPhase1Service.save(payload)
      if (newId) editingBillingId.value = newId
      successToast(toast, "Billing created")
    }
    await fetchBillings()
  } catch (error: unknown) {
    errorToast(toast, editingBillingId.value ? "Failed to update billing" : "Failed to create billing")
  }
}

const printReceipt = (): void => {
  if (!editingBillingId.value) {
    errorToast(toast, "No billing selected for receipt printing")
    return
  }

  const receiptNo = `OR-${String(editingBillingId.value).padStart(6, "0")}`
  const patientId = form.value.patient_id ?? "-"
  const serviceLabel = form.value.service_name || "N/A"
  const paymentMethodName = paymentMethodOptions.value.find(option => option.id === form.value.payment_method_id)?.name || "N/A"
  const html = `
    <html>
      <head><title>Receipt ${receiptNo}</title></head>
      <body style="font-family:Arial,sans-serif;padding:16px;max-width:420px;">
        <h2 style="margin:0 0 8px;">PhysioAve Receipt</h2>
        <div style="font-size:12px;margin-bottom:12px;">Receipt No: ${receiptNo}</div>
        <div style="font-size:13px;line-height:1.5;">
          <div><strong>Patient ID:</strong> ${patientId}</div>
          <div><strong>Appointment ID:</strong> ${form.value.appointment_id ?? "-"}</div>
          <div><strong>Service:</strong> ${serviceLabel}</div>
          <div><strong>Payment Method:</strong> ${paymentMethodName}</div>
          <hr />
          <div><strong>Subtotal:</strong> ${asCurrency(posSummary.value.subtotal)}</div>
          <div><strong>Discount:</strong> ${asCurrency(posSummary.value.discountAmount)}</div>
          <div><strong>Total Due:</strong> ${asCurrency(posSummary.value.totalDue)}</div>
          <div><strong>Tendered:</strong> ${asCurrency(Number(form.value.amount_tendered ?? 0))}</div>
          <div><strong>Change:</strong> ${asCurrency(posSummary.value.changeAmount)}</div>
        </div>
      </body>
    </html>
  `
  const popup = window.open("", "_blank", "width=520,height=700")
  if (!popup) {
    errorToast(toast, "Unable to open print window")
    return
  }
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

const syncRoleFromStorage = () => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole
      if (typeof role === "string" && role.trim()) {
        roleName.value = role.trim()
        return
      }
    } catch {
      // ignore malformed value
    }
  }
  roleName.value = ""
}

const confirmDeleteBilling = (billingId: number): void => {
  confirm.require({
    message: `Delete billing #${billingId}?`,
    header: "Delete Billing",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
      icon: "pi pi-trash",
    },
    accept: async () => {
      try {
        await billingPhase1Service.delete(billingId)
        successToast(toast, "Billing deleted")
        if (focusedBillingId.value === billingId) {
          focusedBillingId.value = undefined
        }
        await fetchBillings()
      } catch {
        errorToast(toast, "Delete billing failed")
      }
    },
  })
}

const openBillingModal = async (billingId: number): Promise<void> => {
  const detail = await billingPhase1Service.getById(billingId)
  if (!detail) {
    errorToast(toast, "Failed to load billing details")
    return
  }
  selectedBillingDetail.value = detail
  billingModalVisible.value = true
}

const clearDrillDown = async (): Promise<void> => {
  focusedBillingId.value = undefined
  focusedAppointmentId.value = undefined
  filters.value.patient_id = undefined
  resetBillingForm()
  await router.replace({path: "/billing", query: {}})
  await fetchBillings()
}

const applyRouteDrillDown = async (): Promise<void> => {
  const patientIdRaw = route.query.patientId
  const appointmentIdRaw = route.query.appointmentId
  const billingIdRaw = route.query.billingId

  const patientId = Number(Array.isArray(patientIdRaw) ? patientIdRaw[0] : patientIdRaw)
  const appointmentId = Number(Array.isArray(appointmentIdRaw) ? appointmentIdRaw[0] : appointmentIdRaw)
  const billingId = Number(Array.isArray(billingIdRaw) ? billingIdRaw[0] : billingIdRaw)

  filters.value.patient_id = Number.isFinite(patientId) && patientId > 0 ? patientId : undefined
  focusedAppointmentId.value = Number.isFinite(appointmentId) && appointmentId > 0 ? appointmentId : undefined
  focusedBillingId.value = Number.isFinite(billingId) && billingId > 0 ? billingId : undefined

  if (filters.value.patient_id) {
    form.value.patient_id = filters.value.patient_id
  }
  if (focusedAppointmentId.value) {
    form.value.appointment_id = focusedAppointmentId.value
  }

  if (focusedBillingId.value) {
    const detail = await billingPhase1Service.getById(focusedBillingId.value)
    if (detail) {
      billings.value = [detail]
      totalElements.value = 1
      editingBillingId.value = detail.id
      mapDetailToForm(detail)
      return
    }
  }

  await fetchBillings()

  if (focusedAppointmentId.value && billings.value.length > 0) {
    const target = billings.value.find(item => item.appointment_id === focusedAppointmentId.value) ?? billings.value[0]
    editingBillingId.value = target.id
    mapDetailToForm(target)
    return
  }

  if (focusedAppointmentId.value && billings.value.length === 0) {
    resetBillingForm()
  }
}

const exportCsv = async (): Promise<void> => {
  const response = await billingPhase1Service.exportCsv({
    name: filters.value.name.trim() || undefined,
    billing_status: filters.value.billing_status.trim() || undefined
  })
  if (!response) return
  exportToExcel(response)
}

const onPage = async (event: DataTablePageEvent): Promise<void> => {
  page.value = Math.floor((event.first ?? 0) / (event.rows ?? pageSize.value)) + 1
  pageSize.value = event.rows ?? pageSize.value
  await fetchBillings()
}

onMounted(async () => {
  syncRoleFromStorage()
  await loadPackages()
  await applyRouteDrillDown()
})

watch(
  () => route.query,
  async () => {
    await applyRouteDrillDown()
  }
)

watch(
  () => [form.value.payment_method_id, form.value.service_name],
  () => {
    const offerSubtotal = resolveOfferSubtotal()
    if (offerSubtotal != null) {
      form.value.amount_due = offerSubtotal
    }
  }
)

watch(
  () => form.value.senior_pwd_id_presented,
  (presented) => {
    if (!presented) {
      form.value.senior_pwd_id_reference = undefined
    }
  }
)
</script>
