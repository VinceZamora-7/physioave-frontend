<template>
  <Dialog v-model:visible="visible" header="Manage Monthly Expense Templates" modal :style="{ width: '780px' }">
    <ConfirmDialog />

    <div class="space-y-3">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <p class="m-0 text-xs opacity-70">Templates can be applied each month in Reports to auto-create expense entries.</p>
        <Button label="Add" icon="pi pi-plus" size="small" @click="openAdd" />
      </div>

      <DataTable :value="rows" dataKey="id" :loading="loading" paginator :rows="10" class="rounded-lg border border-[rgb(var(--app-border))]">
        <template #empty>
          <p class="m-0 text-sm opacity-70">No templates yet.</p>
        </template>

        <Column field="name" header="Name" />
        <Column field="amount" header="Amount" style="width: 160px">
          <template #body="{ data }">{{ asCurrency(data.amount) }}</template>
        </Column>
        <Column field="post_day" header="Post Day" style="width: 120px">
          <template #body="{ data }">Day {{ data.post_day || 1 }}</template>
        </Column>
        <Column field="status" header="Status" style="width: 120px">
          <template #body="{ data }">
            <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
          </template>
        </Column>
        <Column header="Actions" style="width: 110px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button size="small" text icon="pi pi-pencil" @click="openEdit(data)" v-tooltip="'Edit'" />
              <Button size="small" text severity="danger" icon="pi pi-trash" @click="toggleStatus(data)" v-tooltip="'Deactivate/Restore'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="editorVisible" :header="editingId ? 'Edit Template' : 'Add Template'" modal :style="{ width: '520px' }">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="formName" fluid />
          <label>Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="formAmount" :min="0" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="formPostDay" :min="1" :max="31" fluid />
          <label>Post Day</label>
        </IftaLabel>

        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" text @click="editorVisible = false" />
          <Button label="Save" icon="pi pi-check" :loading="saving" @click="save" />
        </div>
      </div>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import ConfirmDialog from "primevue/confirmdialog"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorToast, successToast } from "@/utils/toast.util"

type Row = { id: number; name: string; amount: number; post_day: number; is_active: boolean }

const visible = ref(false)
const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)

const editorVisible = ref(false)
const editingId = ref<number | null>(null)
const formName = ref("")
const formAmount = ref(0)
const formPostDay = ref(1)

const toast = useToast()
const confirm = useConfirm()

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const load = async (): Promise<void> => {
  loading.value = true
  try {
    const { data } = await pamsAPI.get<Row[]>("/billings/monthly-expense-templates")
    rows.value = data ?? []
  } catch {
    rows.value = []
    errorToast(toast, "Failed to load monthly expense templates")
  } finally {
    loading.value = false
  }
}

const open = async (): Promise<void> => {
  visible.value = true
  await load()
}

const openAdd = (): void => {
  editingId.value = null
  formName.value = ""
  formAmount.value = 0
  formPostDay.value = 1
  editorVisible.value = true
}

const openEdit = (row: Row): void => {
  editingId.value = row.id
  formName.value = row.name
  formAmount.value = Number(row.amount ?? 0)
  formPostDay.value = Number(row.post_day ?? 1)
  editorVisible.value = true
}

const save = async (): Promise<void> => {
  const name = formName.value.trim()
  const amount = Number(formAmount.value ?? 0)
  const post_day = Number(formPostDay.value ?? 1)
  if (!name) return errorToast(toast, "Name is required")
  if (!Number.isFinite(amount) || amount < 0) return errorToast(toast, "Amount must be 0 or greater")
  if (!Number.isFinite(post_day) || post_day < 1 || post_day > 31) return errorToast(toast, "Post day must be from 1 to 31")

  saving.value = true
  try {
    if (editingId.value) {
      await pamsAPI.put(`/billings/monthly-expense-templates/${editingId.value}`, { name, amount, post_day })
      successToast(toast, "Template updated")
    } else {
      await pamsAPI.post("/billings/monthly-expense-templates", { name, amount, post_day })
      successToast(toast, "Template added")
    }
    editorVisible.value = false
    await load()
  } catch {
    errorToast(toast, "Failed to save template")
  } finally {
    saving.value = false
  }
}

const toggleStatus = (row: Row): void => {
  confirm.require({
    message: `Update status for "${row.name}"?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        await pamsAPI.patch(`/billings/monthly-expense-templates/${row.id}/status`)
        successToast(toast, "Template updated")
        await load()
      } catch {
        errorToast(toast, "Failed to update template")
      }
    }
  })
}

defineExpose({ open })
</script>
