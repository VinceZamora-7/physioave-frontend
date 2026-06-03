<template>
  <Dialog v-model:visible="visible" :header="title" modal :style="{ width: '720px' }">
    <ConfirmDialog />

    <div class="space-y-3">
      <Message v-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <span class="text-xs opacity-70">{{ description }}</span>
        <Button label="Add" icon="pi pi-plus" size="small" @click="openAdd" />
      </div>

      <DataTable :value="rows" dataKey="id" :loading="loading" paginator :rows="10" class="rounded-lg border border-[rgb(var(--app-border))]">
        <template #empty>
          <p class="m-0 text-sm opacity-70">No options yet.</p>
        </template>

        <Column field="name" header="Name" />
        <Column header="Status" style="width: 120px">
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

    <Dialog v-model:visible="editorVisible" :header="editingId ? `Edit ${itemLabel}` : `Add ${itemLabel}`" modal :style="{ width: '480px' }">
      <div class="space-y-3">
        <IftaLabel>
          <InputText v-model="formName" fluid />
          <label>Name</label>
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
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"

type Row = { id: number; name: string; is_active: boolean }

const props = defineProps<{
  title: string
  itemLabel: string
  endpoint: string
  description: string
}>()

const visible = ref(false)
const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)
const loadError = ref("")

const editorVisible = ref(false)
const editingId = ref<number | null>(null)
const formName = ref("")

const toast = useToast()
const confirm = useConfirm()

const apiError = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Reference access (Create/Update) in Role Access",
    invalidInputHint: "Review the name and try again.",
    retryHint: "Please try again."
  })

const load = async (): Promise<void> => {
  loading.value = true
  loadError.value = ""
  try {
    const { data } = await pamsAPI.get<{ content: Row[] }>(props.endpoint, {
      params: { page: 1, size: 1000, name: "", status: "ALL" }
    })
    rows.value = data?.content ?? []
  } catch (error: unknown) {
    rows.value = []
    loadError.value = apiError(error, `Failed to load ${props.title.toLowerCase()}`)
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
  editorVisible.value = true
}

const openEdit = (row: Row): void => {
  editingId.value = row.id
  formName.value = row.name
  editorVisible.value = true
}

const save = async (): Promise<void> => {
  const name = formName.value.trim()
  if (!name) {
    errorToast(toast, "Name is required")
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await pamsAPI.put(`${props.endpoint}/${editingId.value}`, { name })
      successToast(toast, `${props.itemLabel} updated`)
    } else {
      await pamsAPI.post(props.endpoint, { name })
      successToast(toast, `${props.itemLabel} added`)
    }
    editorVisible.value = false
    await load()
  } catch (error: unknown) {
    errorToast(toast, apiError(error, `Failed to save ${props.itemLabel.toLowerCase()}`))
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
        await pamsAPI.patch(`${props.endpoint}/${row.id}/status`)
        successToast(toast, `${props.itemLabel} updated`)
        await load()
      } catch (error: unknown) {
        errorToast(toast, apiError(error, `Failed to update ${props.itemLabel.toLowerCase()}`))
      }
    }
  })
}

defineExpose({ open })
</script>
