<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Referral Sources"
    :style="{ width: 'min(980px, 96vw)' }"
  >
    <div class="space-y-4">
      <Message v-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex gap-2">
          <Button
            label="Add"
            icon="pi pi-plus"
            severity="info"
            :loading="busy"
            @click="openCreate"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            :loading="busy"
            @click="fetchRows"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs opacity-70">Status</span>
          <Select
            v-model="status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="busy"
            placeholder="Status"
            class="w-44"
          />
        </div>
      </div>

      <DataTable
        :value="rows"
        :loading="busy"
        dataKey="id"
        class="text-sm"
      >
        <Column field="name" header="Referral Source" />
        <Column field="referral_channel" header="Category" style="width: 180px">
          <template #body="{ data }">
            <Tag
              :value="data.referral_channel === 'ONLINE' ? 'Online' : 'Offline'"
              :severity="data.referral_channel === 'ONLINE' ? 'info' : 'secondary'"
            />
          </template>
        </Column>
        <Column header="Status" style="width: 140px">
          <template #body="{ data }">
            <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column header="Actions" style="width: 220px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                size="small"
                :disabled="busy"
                @click="openEdit(data)"
              />
              <Button
                :label="data.is_active ? 'Deactivate' : 'Activate'"
                :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check'"
                :severity="data.is_active ? 'danger' : 'success'"
                outlined
                size="small"
                :disabled="busy"
                @click="confirmToggleStatus(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="editorVisible"
      modal
      :header="editorMode === 'create' ? 'Add Referral Source' : 'Edit Referral Source'"
      :style="{ width: 'min(520px, 96vw)' }"
    >
      <div class="space-y-4">
        <Message v-if="editorError" severity="error" :closable="false">{{ editorError }}</Message>

        <div class="grid grid-cols-1 gap-3">
          <IftaLabel>
            <InputText v-model="draftName" fluid placeholder="Enter referral source name" />
            <label>Referral Source</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="draftChannel"
              :options="channelOptions"
              optionLabel="label"
              optionValue="value"
              :fluid="true"
              placeholder="Select category"
            />
            <label>Referral Category</label>
          </IftaLabel>
        </div>

        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" outlined :disabled="busy" @click="editorVisible = false" />
          <Button
            :label="editorMode === 'create' ? 'Add' : 'Save'"
            :icon="editorMode === 'create' ? 'pi pi-plus' : 'pi pi-save'"
            severity="info"
            :loading="busy"
            @click="submitEditor"
          />
        </div>
      </div>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import Dialog from "primevue/dialog"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import Button from "primevue/button"
import Tag from "primevue/tag"
import Message from "primevue/message"
import Select from "primevue/select"
import InputText from "primevue/inputtext"
import IftaLabel from "primevue/iftalabel"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"

import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"

type Status = "ACTIVE" | "INACTIVE" | "ALL"
type ReferralChannel = "ONLINE" | "OFFLINE"

type ModeOfReferralRow = {
  id: number
  name: string
  referral_channel: ReferralChannel
  is_active: boolean
}

const confirm = useConfirm()
const toast = useToast()

const visible = ref(false)
const busy = ref(false)
const loadError = ref("")

const status = ref<Status>("ALL")
const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
]

const rows = ref<ModeOfReferralRow[]>([])

const editorVisible = ref(false)
const editorMode = ref<"create" | "edit">("create")
const editorId = ref<number | null>(null)
const editorError = ref("")
const draftName = ref("")
const draftChannel = ref<ReferralChannel>("OFFLINE")
const channelOptions = [
  { label: "Online", value: "ONLINE" },
  { label: "Offline", value: "OFFLINE" },
]

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Reference access (Create/Update) in Role Access",
    invalidInputHint: "Invalid input. Review the fields and try again.",
    retryHint: "Please try again.",
  })

const open = async (): Promise<void> => {
  visible.value = true
  await fetchRows()
}

const fetchRows = async (): Promise<void> => {
  busy.value = true
  loadError.value = ""
  try {
    const { data } = await pamsAPI.get<{ content: ModeOfReferralRow[] }>("/references/mode-of-referrals", {
      params: { page: 1, size: 500, status: status.value }
    })
    rows.value = data?.content ?? []
  } catch (error: unknown) {
    loadError.value = extractApiErrorMessage(error, "Failed to load referral sources")
  } finally {
    busy.value = false
  }
}

const openCreate = (): void => {
  editorMode.value = "create"
  editorId.value = null
  editorError.value = ""
  draftName.value = ""
  draftChannel.value = "OFFLINE"
  editorVisible.value = true
}

const openEdit = (row: ModeOfReferralRow): void => {
  editorMode.value = "edit"
  editorId.value = row.id
  editorError.value = ""
  draftName.value = row.name
  draftChannel.value = row.referral_channel
  editorVisible.value = true
}

const submitEditor = async (): Promise<void> => {
  const name = draftName.value.trim()
  if (!name) {
    editorError.value = "Referral source name is required."
    return
  }

  busy.value = true
  editorError.value = ""
  try {
    if (editorMode.value === "create") {
      await pamsAPI.post("/references/mode-of-referrals", {
        name,
        referral_channel: draftChannel.value,
      })
      toast.add({ severity: "success", summary: "Added", detail: "Referral source added.", life: 2500 })
    } else {
      const id = editorId.value
      if (!id) throw new Error("Missing record id")
      await pamsAPI.put(`/references/mode-of-referrals/${id}`, {
        name,
        referral_channel: draftChannel.value,
      })
      toast.add({ severity: "success", summary: "Saved", detail: "Referral source updated.", life: 2500 })
    }

    editorVisible.value = false
    await fetchRows()
  } catch (error: unknown) {
    editorError.value = extractApiErrorMessage(error, "Failed to save referral source")
  } finally {
    busy.value = false
  }
}

const confirmToggleStatus = (row: ModeOfReferralRow): void => {
  confirm.require({
    message: `If you proceed, "${row.name}" will become ${row.is_active ? "inactive" : "active"}.`,
    header: `${row.is_active ? "Deactivate" : "Activate"} Referral Source`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: { label: row.is_active ? "Deactivate" : "Activate", severity: row.is_active ? "danger" : "success" },
    accept: async () => {
      busy.value = true
      try {
        await pamsAPI.patch(`/references/mode-of-referrals/${row.id}/status`)
        toast.add({ severity: "success", summary: "Updated", detail: "Status updated.", life: 2500 })
        await fetchRows()
      } catch (error: unknown) {
        loadError.value = extractApiErrorMessage(error, "Failed to update status")
      } finally {
        busy.value = false
      }
    }
  })
}

defineExpose({
  open
})
</script>
