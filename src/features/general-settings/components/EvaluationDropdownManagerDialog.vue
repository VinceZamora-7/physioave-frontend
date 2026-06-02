<template>
  <Dialog v-model:visible="visible" modal header="Evaluation Visit Dropdowns" :style="{ width: 'min(1180px, 98vw)' }">
    <ConfirmDialog />

    <div class="space-y-4">
      <Message v-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>

      <div class="grid gap-4 xl:grid-cols-3">
        <section
          v-for="section in sections"
          :key="section.key"
          class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold">{{ section.title }}</div>
              <div class="text-xs opacity-65">{{ section.description }}</div>
            </div>

            <Button
              label="Add"
              icon="pi pi-plus"
              size="small"
              :loading="loadingState[section.key]"
              @click="openCreate(section.key)"
            />
          </div>

          <DataTable
            :value="rows[section.key]"
            dataKey="id"
            :loading="loadingState[section.key]"
            class="rounded-xl border border-[rgb(var(--app-border))] text-sm"
          >
            <template #empty>
              <p class="m-0 p-3 text-sm opacity-70">No records yet.</p>
            </template>

            <Column field="name" :header="section.columnLabel" />
            <Column header="Status" style="width: 120px">
              <template #body="{ data }">
                <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column header="Actions" style="width: 180px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button size="small" text icon="pi pi-pencil" @click="openEdit(section.key, data)" />
                  <Button
                    size="small"
                    text
                    :severity="data.is_active ? 'danger' : 'success'"
                    :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check'"
                    @click="confirmToggle(section.key, data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </section>
      </div>
    </div>

    <Dialog v-model:visible="editorVisible" modal :header="editorHeader" :style="{ width: 'min(480px, 96vw)' }">
      <div class="space-y-4">
        <Message v-if="editorError" severity="error" :closable="false">{{ editorError }}</Message>

        <IftaLabel>
          <InputText v-model="draftName" fluid placeholder="Enter name" />
          <label>{{ editorFieldLabel }}</label>
        </IftaLabel>

        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" outlined :disabled="busy" @click="editorVisible = false" />
          <Button :label="editorMode === 'create' ? 'Add' : 'Save'" :icon="editorMode === 'create' ? 'pi pi-plus' : 'pi pi-save'" :loading="busy" @click="submitEditor" />
        </div>
      </div>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useQueryClient } from "@tanstack/vue-query"
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
import { ReferenceTanstackKey } from "@/utils/keys/tanstack-key"

type SectionKey = "medical-categories" | "medical-diagnoses" | "pt-case-impressions"

type Row = {
  id: number
  name: string
  is_active: boolean
}

type SectionConfig = {
  key: SectionKey
  title: string
  description: string
  columnLabel: string
  endpoint: string
}

const confirm = useConfirm()
const toast = useToast()
const queryClient = useQueryClient()

const visible = ref(false)
const busy = ref(false)
const loadError = ref("")

const sections: SectionConfig[] = [
  {
    key: "medical-categories",
    title: "Medical Categories",
    description: "Used by the evaluation visit log Medical Category dropdown.",
    columnLabel: "Medical Category",
    endpoint: "medical-categories",
  },
  {
    key: "medical-diagnoses",
    title: "Doctor Diagnoses",
    description: "Used by the evaluation visit log Doctor Diagnosis dropdown.",
    columnLabel: "Doctor Diagnosis",
    endpoint: "medical-diagnoses",
  },
  {
    key: "pt-case-impressions",
    title: "PT Case Impressions",
    description: "Used by the evaluation visit log PT Case Impression dropdown.",
    columnLabel: "PT Case Impression",
    endpoint: "pt-case-impressions",
  },
]

const rows = reactive<Record<SectionKey, Row[]>>({
  "medical-categories": [],
  "medical-diagnoses": [],
  "pt-case-impressions": [],
})

const loadingState = reactive<Record<SectionKey, boolean>>({
  "medical-categories": false,
  "medical-diagnoses": false,
  "pt-case-impressions": false,
})

const editorVisible = ref(false)
const editorMode = ref<"create" | "edit">("create")
const editorSection = ref<SectionKey>("medical-categories")
const editorId = ref<number | null>(null)
const editorError = ref("")
const draftName = ref("")

const sectionByKey = (key: SectionKey): SectionConfig => {
  const section = sections.find((item) => item.key === key)
  if (!section) throw new Error(`Missing section configuration for ${key}`)
  return section
}

const editorHeader = computed(() => {
  const section = sectionByKey(editorSection.value)
  return editorMode.value === "create" ? `Add ${section.title}` : `Edit ${section.title}`
})

const editorFieldLabel = computed(() => sectionByKey(editorSection.value).columnLabel)

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Reference access (Create/Update) in Role Access",
    invalidInputHint: "Invalid input. Review the fields and try again.",
    retryHint: "Please try again.",
  })

const open = async (): Promise<void> => {
  visible.value = true
  await fetchAll()
}

const fetchSection = async (key: SectionKey): Promise<void> => {
  const section = sectionByKey(key)
  loadingState[key] = true
  try {
    const { data } = await pamsAPI.get<{ content: Row[] }>(`/references/${section.endpoint}`, {
      params: { page: 1, size: 1000, status: "ALL" }
    })
    rows[key] = data?.content ?? []
  } catch (error: unknown) {
    throw new Error(extractApiErrorMessage(error, `Failed to load ${section.title.toLowerCase()}`))
  } finally {
    loadingState[key] = false
  }
}

const fetchAll = async (): Promise<void> => {
  busy.value = true
  loadError.value = ""
  try {
    await Promise.all(sections.map((section) => fetchSection(section.key)))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "Failed to load evaluation dropdowns."
  } finally {
    busy.value = false
  }
}

const refreshSection = async (key: SectionKey): Promise<void> => {
  loadError.value = ""
  try {
    await fetchSection(key)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "Failed to refresh dropdowns."
  }
}

const openCreate = (key: SectionKey): void => {
  editorMode.value = "create"
  editorSection.value = key
  editorId.value = null
  editorError.value = ""
  draftName.value = ""
  editorVisible.value = true
}

const openEdit = (key: SectionKey, row: Row): void => {
  editorMode.value = "edit"
  editorSection.value = key
  editorId.value = row.id
  editorError.value = ""
  draftName.value = row.name
  editorVisible.value = true
}

const submitEditor = async (): Promise<void> => {
  const name = draftName.value.trim()
  if (!name) {
    editorError.value = `${editorFieldLabel.value} is required.`
    return
  }

  const section = sectionByKey(editorSection.value)
  busy.value = true
  editorError.value = ""
  try {
    if (editorMode.value === "create") {
      await pamsAPI.post(`/references/${section.endpoint}`, { name })
      toast.add({ severity: "success", summary: "Added", detail: `${section.title} added.`, life: 2500 })
    } else {
      const id = editorId.value
      if (!id) throw new Error("Missing record id")
      await pamsAPI.put(`/references/${section.endpoint}/${id}`, { name })
      toast.add({ severity: "success", summary: "Saved", detail: `${section.title} updated.`, life: 2500 })
    }

    editorVisible.value = false
    await refreshSection(editorSection.value)
    await queryClient.invalidateQueries({ queryKey: [ReferenceTanstackKey.MEDICAL_CATEGORIES] })
    await queryClient.invalidateQueries({ queryKey: [ReferenceTanstackKey.MEDICAL_DIAGNOSES] })
    await queryClient.invalidateQueries({ queryKey: [ReferenceTanstackKey.PT_CASE_IMPRESSIONS] })
    window.dispatchEvent(new CustomEvent("reference-updated", { detail: { key: editorSection.value } }))
  } catch (error: unknown) {
    editorError.value = extractApiErrorMessage(error, `Failed to save ${section.title.toLowerCase()}`)
  } finally {
    busy.value = false
  }
}

const confirmToggle = (key: SectionKey, row: Row): void => {
  const section = sectionByKey(key)
  confirm.require({
    message: `${row.is_active ? "Deactivate" : "Restore"} ${row.name}?`,
    header: "Confirm",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        await pamsAPI.patch(`/references/${section.endpoint}/${row.id}/status`)
        toast.add({ severity: "success", summary: "Updated", detail: `${section.title} status updated.`, life: 2500 })
        await refreshSection(key)
      } catch (error: unknown) {
        loadError.value = extractApiErrorMessage(error, `Failed to update ${section.title.toLowerCase()}`)
      }
    }
  })
}

defineExpose({ open })
</script>
