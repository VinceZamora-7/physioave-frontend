<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] space-y-4">
    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-3">
      <h2 class="text-lg font-semibold">Billing Core (Phase 1)</h2>
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
        <IftaLabel>
          <InputNumber v-model="form.amount_due" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Due</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="form.amount_paid" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Paid</label>
        </IftaLabel>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button label="Create Billing" icon="pi pi-save" @click="createBilling" />
        <Button label="Refresh Table" icon="pi pi-refresh" outlined @click="fetchBillings" />
      </div>
    </section>

    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-3">
      <div class="flex flex-wrap items-end gap-2">
        <IftaLabel>
          <InputText v-model="filters.name" fluid />
          <label>Patient filter</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="filters.billing_status" fluid placeholder="PAID/PENDING/PARTIAL" />
          <label>Status</label>
        </IftaLabel>
        <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportCsv" />
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
      </DataTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useToast} from "primevue";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, {type DataTablePageEvent} from "primevue/datatable";
import IftaLabel from "primevue/iftalabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {billingPhase1Service, type BillingRequest, type BillingType, type PackageLookup, type ServiceType, type BillingListItem} from "@/features/billing/api/billing-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {errorToast, successToast} from "@/utils/toast.util";

const toast = useToast()
const isLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const billings = ref<BillingListItem[]>([])
const packageOptions = ref<PackageLookup[]>([])

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
}>({
  billing_type: "INDIVIDUAL_PRICING",
  service_type: "SINGLE",
  amount_due: 0,
  amount_paid: 0,
})

const filters = ref({
  name: "",
  billing_status: ""
})

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const statusSeverity = (status: string): "success" | "warn" | "danger" | "info" => {
  const normalized = status.toUpperCase()
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}

const formatDateTime = (value: string): string => new Date(value).toLocaleString()

const loadPackages = async (): Promise<void> => {
  packageOptions.value = await billingPhase1Service.getPackages() ?? []
}

const fetchBillings = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await billingPhase1Service.getAll({
      page: page.value,
      size: pageSize.value,
      name: filters.value.name.trim() || undefined,
      billing_status: filters.value.billing_status.trim() || undefined
    })
    billings.value = response?.content ?? []
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

  const payload: BillingRequest = {
    patient_id: form.value.patient_id,
    appointment_id: form.value.appointment_id,
    package_id: form.value.package_id,
    billing_type: form.value.billing_type,
    service_type: form.value.service_type,
    service_name: form.value.service_name?.trim() || undefined,
    amount_due: form.value.amount_due,
    amount_paid: form.value.amount_paid,
  }

  try {
    await billingPhase1Service.save(payload)
    successToast(toast, "Billing created")
    await fetchBillings()
  } catch (error: unknown) {
    errorToast(toast, "Failed to create billing")
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
  await Promise.all([loadPackages(), fetchBillings()])
})
</script>

