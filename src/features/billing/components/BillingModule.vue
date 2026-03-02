<template>
  <main class="h-full p-3 sm:p-5 bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold">Billing and Finance</h2>
          <p class="text-sm opacity-70">Package-style billing history per session plus daily income/expense</p>
        </div>
        <Tag v-if="selectedPatientName" :value="`Patient: ${selectedPatientName}`" severity="info" />
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <InputText v-model="billForm.patient_name" fluid />
          <label>Patient</label>
        </IftaLabel>

        <IftaLabel>
          <DatePicker v-model="billDate" fluid :manualInput="false" />
          <label>Session Date</label>
        </IftaLabel>

        <IftaLabel>
          <Select v-model="billForm.service_type" :options="serviceTypes" fluid />
          <label>Service Type</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="billForm.service_name" fluid />
          <label>Service Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="billForm.package_name" fluid />
          <label>Package Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="billForm.session_no" :min="1" fluid />
          <label>Session No.</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="billForm.amount_due" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Due</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="billForm.amount_paid" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Paid</label>
        </IftaLabel>

        <IftaLabel>
          <Select v-model="billForm.payment_method" :options="paymentMethods" fluid />
          <label>Payment Method</label>
        </IftaLabel>
      </div>

      <Button label="Add Billing Session" icon="pi pi-plus" @click="submitBill" />

      <DataTable :value="billRows" dataKey="id" paginator :rows="8" responsiveLayout="scroll" size="small">
        <Column field="session_date" header="Date" />
        <Column field="patient_name" header="Patient" />
        <Column field="service_type" header="Type" />
        <Column field="package_name" header="Package" />
        <Column field="session_no" header="Session #" />
        <Column field="amount_due" header="Due">
          <template #body="{ data }">{{ asCurrency(data.amount_due) }}</template>
        </Column>
        <Column field="amount_paid" header="Paid">
          <template #body="{ data }">{{ asCurrency(data.amount_paid) }}</template>
        </Column>
        <Column field="payment_method" header="Method" />
        <Column header="Actions">
          <template #body="{ data }">
            <Button text severity="danger" icon="pi pi-trash" @click="removeBillRow(data.id)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="mt-5 rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 space-y-4">
      <h3 class="text-lg font-semibold">Daily Income and Expense</h3>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <IftaLabel>
          <DatePicker v-model="reportDateModel" fluid :manualInput="false" />
          <label>Report Date</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="expenseForm.category" fluid />
          <label>Expense Category</label>
        </IftaLabel>

        <IftaLabel class="xl:col-span-2">
          <InputText v-model="expenseForm.notes" fluid />
          <label>Expense Notes</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="expenseForm.amount" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Expense Amount</label>
        </IftaLabel>
      </div>

      <Button label="Add Expense" icon="pi pi-minus-circle" severity="warn" @click="submitExpense" />

      <div class="grid gap-3 sm:grid-cols-3">
        <Card>
          <template #title>Income</template>
          <template #content><span class="text-xl font-semibold">{{ asCurrency(summary.income) }}</span></template>
        </Card>
        <Card>
          <template #title>Expenses</template>
          <template #content><span class="text-xl font-semibold">{{ asCurrency(summary.expenses) }}</span></template>
        </Card>
        <Card>
          <template #title>Net</template>
          <template #content><span class="text-xl font-semibold">{{ asCurrency(summary.net) }}</span></template>
        </Card>
      </div>

      <DataTable :value="expenseRows" dataKey="id" paginator :rows="6" responsiveLayout="scroll" size="small">
        <Column field="expense_date" header="Date" />
        <Column field="category" header="Category" />
        <Column field="notes" header="Notes" />
        <Column field="amount" header="Amount">
          <template #body="{ data }">{{ asCurrency(data.amount) }}</template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button text severity="danger" icon="pi pi-trash" @click="removeExpenseRow(data.id)" />
          </template>
        </Column>
      </DataTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {useToast} from "primevue";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import IftaLabel from "primevue/iftalabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import {billStore, type BillingServiceType, type PaymentMethod} from "@/stores/bill.store";
import {auditStore} from "@/stores/audit.store";
import {successToast, warningToast} from "@/utils/toast.util";

const useBillStore = billStore()
const useAuditStore = auditStore()
const toast = useToast()

const selectedPatientName = computed(() => useBillStore.patient?.full_name)
const reportDateModel = ref<Date>(new Date())
const billDate = ref<Date>(new Date())

const serviceTypes: BillingServiceType[] = ["single", "package", "home-service"]
const paymentMethods: PaymentMethod[] = ["cash", "gcash", "bank-transfer", "card"]

const billForm = ref({
  patient_name: selectedPatientName.value ?? "",
  service_type: "package" as BillingServiceType,
  service_name: "",
  package_name: "",
  session_no: 1,
  amount_due: 0,
  amount_paid: 0,
  payment_method: "cash" as PaymentMethod
})

const expenseForm = ref({
  category: "",
  amount: 0,
  notes: ""
})

const reportDate = computed(() => reportDateModel.value.toISOString().slice(0, 10))
const billRows = computed(() => useBillStore.selectedPatientBills)
const expenseRows = computed(() => useBillStore.expenses.filter(expense => expense.expense_date === reportDate.value))
const summary = computed(() => useBillStore.getDailySummary(reportDate.value))

const asCurrency = (value: number): string =>
  value.toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const submitBill = (): void => {
  const patientId = useBillStore.patient?.id
  if (!patientId || !billForm.value.patient_name.trim() || billForm.value.amount_due <= 0) {
    warningToast(toast, "Patient and amount due are required")
    return
  }

  const created = useBillStore.addBill({
    patient_id: patientId,
    patient_name: billForm.value.patient_name.trim(),
    session_date: billDate.value.toISOString().slice(0, 10),
    service_type: billForm.value.service_type,
    service_name: billForm.value.service_name.trim() || "Session",
    package_name: billForm.value.package_name.trim() || undefined,
    session_no: billForm.value.session_no || undefined,
    amount_due: billForm.value.amount_due,
    amount_paid: billForm.value.amount_paid,
    payment_method: billForm.value.payment_method,
    notes: undefined
  })

  useAuditStore.logAction({
    user: "Current User",
    module: "Billing",
    action: "Create",
    details: `Created billing for ${created.patient_name} (${created.service_type})`
  })
  successToast(toast, "Billing session added")
}

const removeBillRow = (id: string): void => {
  useBillStore.removeBill(id)
  useAuditStore.logAction({
    user: "Current User",
    module: "Billing",
    action: "Delete",
    details: "Deleted billing record"
  })
}

const submitExpense = (): void => {
  if (!expenseForm.value.category.trim() || expenseForm.value.amount <= 0) {
    warningToast(toast, "Expense category and amount are required")
    return
  }

  const created = useBillStore.addExpense({
    expense_date: reportDate.value,
    category: expenseForm.value.category.trim(),
    amount: expenseForm.value.amount,
    notes: expenseForm.value.notes.trim() || undefined,
    created_by: "Current User"
  })

  useAuditStore.logAction({
    user: "Current User",
    module: "Finance",
    action: "Create Expense",
    details: `Logged ${created.category} expense`
  })
  successToast(toast, "Expense added")
}

const removeExpenseRow = (id: string): void => {
  useBillStore.removeExpense(id)
  useAuditStore.logAction({
    user: "Current User",
    module: "Finance",
    action: "Delete Expense",
    details: "Deleted expense record"
  })
}
</script>
