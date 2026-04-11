<template>
  <section class="app-section-card-comfy mt-4 space-y-6">

    <header class="rounded-3xl border border-[#A91D8B]/15 bg-[linear-gradient(120deg,rgba(36,39,87,0.03),rgba(169,29,139,0.08))] p-5 shadow-sm sm:p-6">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-[rgb(var(--app-fg))]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/60 border border-[rgb(var(--app-fg))]/10">
              Infrastructure
            </span>
            <Tag v-if="selectedClinic" severity="secondary" :value="selectedClinic.name" class="!rounded-md" />
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-[rgb(var(--app-fg))]">Treatment Areas</h2>
          <p class="text-sm text-[rgb(var(--app-fg))]/60">
            Define and manage rooms for appointment scheduling and color-coded calendar views.
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <Button
            v-if="selectedClinic"
            icon="pi pi-refresh"
            outlined
            v-tooltip.bottom="'Reload data'"
            :loading="isLoading"
            :pt="ptOutlinedBtn"
            @click="loadTreatmentAreas"
            class="!rounded-xl"
          />
          <Button
            v-if="selectedClinic && canManage"
            label="New Area"
            icon="pi pi-plus"
            :pt="ptPrimaryBtn"
            @click="openCreate"
            class="!rounded-xl shadow-md"
          />
        </div>
      </div>
    </header>

    <div v-if="!selectedClinic" class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))]/50 py-20 text-center">
      <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
        <i class="pi pi-map text-3xl text-[rgb(var(--app-fg))]/20" />
      </div>
      <h3 class="text-xl font-bold text-[rgb(var(--app-fg))]">No Clinic Selected</h3>
      <p class="mt-2 max-w-xs text-[rgb(var(--app-fg))]/50">Please select a clinic branch from the main dashboard to configure its rooms.</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article v-for="stat in statsCards" :key="stat.label" :class="['rounded-2xl border p-4 transition-all', stat.class]">
          <div class="flex items-center justify-between opacity-70">
            <span class="text-[10px] font-bold uppercase tracking-widest">{{ stat.label }}</span>
            <i :class="[stat.icon, 'text-xs']" />
          </div>
          <div class="mt-2 text-3xl font-black">{{ stat.value }}</div>
        </article>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        <div class="lg:col-span-8 space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[rgb(var(--app-bg))] p-2 rounded-2xl border border-[rgb(var(--app-border))] shadow-sm">
            <div class="relative flex-1">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--app-fg))]/30" />
              <InputText 
                v-model="searchTerm" 
                placeholder="Search by room name..." 
                class="w-full !border-none !bg-transparent !pl-10 focus:!ring-0"
                :pt="ptInputText"
              />
            </div>
            
            <div class="flex items-center gap-1 bg-[rgb(var(--app-fg))]/5 p-1 rounded-xl">
              <button
                v-for="opt in statusFilterOptions"
                :key="opt.value"
                @click="statusFilter = opt.value"
                :class="[
                  'px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                  statusFilter === opt.value ? 'bg-white text-[rgb(var(--app-fg))] shadow-sm' : 'text-[rgb(var(--app-fg))]/40 hover:text-[rgb(var(--app-fg))]/70'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>

            <Button
              v-if="hasActiveFilters"
              label="Reset"
              icon="pi pi-filter-slash"
              text
              class="!rounded-xl"
              @click="resetFilters"
            />
          </div>

          <article class="overflow-hidden rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] shadow-sm">
            <DataTable
              :value="filteredTreatmentAreas"
              :loading="isLoading"
              v-model:selection="selectedTreatmentArea"
              selectionMode="single"
              dataKey="id"
              scrollable
              scrollHeight="500px"
              :rowClass="resolveRowClass"
              responsiveLayout="stack"
              breakpoint="640px"
              class="text-sm"
            >
              <Column field="name" header="Room Details">
                <template #body="{ data }">
                  <div class="flex items-center gap-4">
                    <div class="h-10 w-10 shrink-0 rounded-xl border-2 border-white shadow-sm" :style="{ backgroundColor: data.color }" />
                    <div class="flex flex-col">
                      <span class="font-bold text-[rgb(var(--app-fg))]">{{ data.name }}</span>
                      <span class="text-[10px] uppercase tracking-tight text-[rgb(var(--app-fg))]/40">ID: #{{ data.id }}</span>
                    </div>
                  </div>
                </template>
              </Column>

              <Column field="is_active" header="Status" class="hidden sm:table-cell">
                <template #body="{ data }">
                  <Tag :severity="data.is_active ? 'success' : 'secondary'" :value="data.is_active ? 'Operational' : 'Inactive'" rounded />
                </template>
              </Column>

              <Column v-if="canManage" header="Actions" headerClass="text-right" bodyClass="text-right">
                <template #body="{ data }">
                  <div class="flex justify-end gap-1">
                    <Button icon="pi pi-pencil" text rounded size="small" @click="openEdit(data)" />
                    <Button 
                      :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check-circle'" 
                      :severity="data.is_active ? 'danger' : 'success'" 
                      text rounded size="small" 
                      @click="confirmToggleStatus(data)" 
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </article>
        </div>

        <aside class="lg:col-span-4 lg:sticky lg:top-6 h-fit">
          <div v-if="activeTreatmentArea" class="space-y-4 rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-6 shadow-md">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--app-fg))]/40">Selected Area</h3>
            
            <div class="flex flex-col items-center py-6 text-center">
              <div class="mb-4 h-20 w-20 rounded-3xl border-4 border-white shadow-xl" :style="{ backgroundColor: activeTreatmentArea.color }" />
              <h4 class="text-2xl font-bold">{{ activeTreatmentArea.name }}</h4>
              <p class="text-sm text-[rgb(var(--app-fg))]/50">Managed Branch: {{ selectedClinic.name }}</p>
            </div>

            <div class="divide-y divide-[rgb(var(--app-border))] rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-fg))]/5">
              <div class="flex justify-between p-3 text-sm">
                <span class="text-[rgb(var(--app-fg))]/50">Hex Code</span>
                <span class="font-mono font-bold uppercase">{{ activeTreatmentArea.color }}</span>
              </div>
              <div class="flex justify-between p-3 text-sm">
                <span class="text-[rgb(var(--app-fg))]/50">Status</span>
                <span :class="activeTreatmentArea.is_active ? 'text-emerald-600' : 'text-slate-500'" class="font-bold">
                  {{ activeTreatmentArea.is_active ? 'Active' : 'Disabled' }}
                </span>
              </div>
            </div>

            <div class="pt-4 space-y-2">
              <Button
                v-if="canManage"
                label="Edit Area Settings"
                icon="pi pi-sliders-h"
                fluid
                outlined
                class="!rounded-xl"
                @click="openEdit(activeTreatmentArea)"
              />
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[rgb(var(--app-border))] p-10 text-center opacity-50">
            <i class="pi pi-info-circle text-2xl mb-2" />
            <p class="text-sm">Select a room to view details</p>
          </div>
        </aside>
      </div>

      <Dialog
        v-model:visible="editorVisible"
        modal
        :closable="!isSaving"
        :dismissableMask="!isSaving"
        :draggable="false"
        :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
        :header="draftId ? 'Edit Treatment Area' : 'Create Treatment Area'"
      >
        <div class="space-y-5">
          <p class="text-sm text-[rgb(var(--app-fg))]/65">
            {{ draftId
              ? 'Update the room name and color used during scheduling.'
              : 'Add a new room or treatment area for the selected clinic.' }}
          </p>

          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/55">Treatment Area Name</label>
            <InputText
              v-model="draftName"
              fluid
              placeholder="Example: Room A, Pediatric Bay, Gym 1"
              :disabled="isSaving"
              :pt="ptInputText"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/55">Color Code</label>
            <div class="flex items-center gap-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
              <input
                v-model="draftColor"
                type="color"
                class="h-12 w-16 cursor-pointer rounded-xl border-0 bg-transparent"
                :disabled="isSaving"
              >
              <InputText
                v-model="draftColor"
                fluid
                placeholder="#2563EB"
                :disabled="isSaving"
                :pt="ptInputText"
              />
            </div>
            <p class="text-xs text-[rgb(var(--app-fg))]/50">
              Use a full hex color like #2563EB. This color appears in appointment scheduling views.
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              :pt="ptOutlinedBtn"
              :disabled="isSaving"
              @click="editorVisible = false"
            />
            <Button
              :label="draftId ? 'Save Changes' : 'Create Area'"
              icon="pi pi-check"
              :pt="ptPrimaryBtn"
              :loading="isSaving"
              @click="submit"
            />
          </div>
        </template>
      </Dialog>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Tag from "primevue/tag"
import { useConfirm, useToast } from "primevue"

import type { Clinic } from "@/features/clinics/types/clinic"
import { clinicTreatmentAreaService } from "@/features/clinics/api/clinic-treatment-area.service"
import { ptInputText, ptOutlinedBtn, ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type { TreatmentArea } from "@/models/reference"
import { defaultPage } from "@/models/paging"
import { Status } from "@/utils/global.type"
import { errorToast, successToast } from "@/utils/toast.util"

const props = defineProps<{
  selectedClinic?: Clinic
  canManage: boolean
}>()

const toast = useToast()
const confirm = useConfirm()

const treatmentAreas = ref<TreatmentArea[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const editorVisible = ref(false)
const draftId = ref<number>()
const draftName = ref("")
const draftColor = ref("#2563EB")
const searchTerm = ref("")
const statusFilter = ref<Status>(Status.ALL)
const selectedTreatmentArea = ref<TreatmentArea>()

  // Improved Computed Property for Stats
const statsCards = computed(() => [
  { 
    label: "Total Areas", 
    value: summary.value.total, 
    icon: "pi pi-box", 
    class: "bg-white border-[rgb(var(--app-border))] text-[rgb(var(--app-fg))]" 
  },
  { 
    label: "Operational", 
    value: summary.value.active, 
    icon: "pi pi-check-circle", 
    class: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
  },
  { 
    label: "Inactive", 
    value: summary.value.inactive, 
    icon: "pi pi-eye-slash", 
    class: "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-500/10 dark:border-slate-500/20" 
  }
])

const statusFilterOptions = [
  { label: "All", value: Status.ALL },
  { label: "Operational", value: Status.ACTIVE },
  { label: "Non operational", value: Status.INACTIVE }
]

const summary = computed(() => ({
  total: treatmentAreas.value.length,
  active: treatmentAreas.value.filter(area => area.is_active).length,
  inactive: treatmentAreas.value.filter(area => !area.is_active).length
}))

const filteredTreatmentAreas = computed(() => {
  const search = searchTerm.value.trim().toLowerCase()
  return treatmentAreas.value.filter((area) => {
    const matchesSearch = !search || area.name.toLowerCase().includes(search)
    const matchesStatus =
      statusFilter.value === Status.ALL
        || (statusFilter.value === Status.ACTIVE && area.is_active)
        || (statusFilter.value === Status.INACTIVE && !area.is_active)
    return matchesSearch && matchesStatus
  })
})

const activeTreatmentArea = computed(() => {
  if (selectedTreatmentArea.value) return selectedTreatmentArea.value
  return filteredTreatmentAreas.value[0]
})

const hasActiveFilters = computed(() =>
  Boolean(searchTerm.value.trim()) || statusFilter.value !== Status.ALL
)

const resetDraft = (): void => {
  draftId.value = undefined
  draftName.value = ""
  draftColor.value = "#2563EB"
}

const resetFilters = (): void => {
  searchTerm.value = ""
  statusFilter.value = Status.ALL
}

const resolveRowClass = (data: TreatmentArea): string => {
  const isSelected = selectedTreatmentArea.value?.id === data.id
  const base = "cursor-pointer transition-colors"
  if (!data.is_active) {
    return isSelected ? `${base} bg-[rgba(148,163,184,0.16)]` : `${base} opacity-60`
  }
  return isSelected ? `${base} bg-[rgba(169,29,139,0.08)]` : base
}

const syncSelectedTreatmentArea = (): void => {
  const currentId = selectedTreatmentArea.value?.id
  if (!filteredTreatmentAreas.value.length) { selectedTreatmentArea.value = undefined; return }
  const matched = currentId ? filteredTreatmentAreas.value.find((area) => area.id === currentId) : undefined
  selectedTreatmentArea.value = matched ?? filteredTreatmentAreas.value[0]
}

const loadTreatmentAreas = async (): Promise<void> => {
  if (!props.selectedClinic?.id) {
    treatmentAreas.value = []
    selectedTreatmentArea.value = undefined
    return
  }
  try {
    isLoading.value = true
    const response = await clinicTreatmentAreaService.getAll(props.selectedClinic.id, {
      page: defaultPage,
      size: 200,
      status: Status.ALL,
      name: undefined
    })
    treatmentAreas.value = response?.content ?? []
    syncSelectedTreatmentArea()
  } catch (error: unknown) {
    errorToast(toast, error instanceof Error ? error.message : "Failed to load treatment areas")
    treatmentAreas.value = []
    selectedTreatmentArea.value = undefined
  } finally {
    isLoading.value = false
  }
}

const openCreate = (): void => {
  if (!props.canManage) return
  resetDraft()
  editorVisible.value = true
}

const openEdit = (treatmentArea: TreatmentArea): void => {
  if (!props.canManage) return
  selectedTreatmentArea.value = treatmentArea
  draftId.value = treatmentArea.id
  draftName.value = treatmentArea.name
  draftColor.value = treatmentArea.color || "#2563EB"
  editorVisible.value = true
}

const submit = async (): Promise<void> => {
  if (!props.selectedClinic?.id) { errorToast(toast, "Select a clinic first"); return }
  const name = draftName.value.trim()
  if (!name) { errorToast(toast, "Treatment area name is required"); return }
  const color = draftColor.value.trim().toUpperCase()
  if (!/^#[0-9A-F]{6}$/.test(color)) { errorToast(toast, "Treatment area color must look like #2563EB"); return }

  try {
    isSaving.value = true
    if (draftId.value) {
      await clinicTreatmentAreaService.update(props.selectedClinic.id, draftId.value, { name, color })
      successToast(toast, "Treatment area updated")
    } else {
      await clinicTreatmentAreaService.create(props.selectedClinic.id, { name, color })
      successToast(toast, "Treatment area created")
    }
    editorVisible.value = false
    resetDraft()
    await loadTreatmentAreas()
  } catch (error: unknown) {
    errorToast(toast, error instanceof Error ? error.message : "Failed to save treatment area")
  } finally {
    isSaving.value = false
  }
}

const confirmToggleStatus = (treatmentArea: TreatmentArea): void => {
  if (!props.selectedClinic?.id) { errorToast(toast, "Select a clinic first"); return }
  confirm.require({
    message: `${treatmentArea.name} will become ${treatmentArea.is_active ? "non operational" : "operational"}.`,
    header: `${treatmentArea.is_active ? "Deactivate" : "Activate"} Treatment Area`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: {
      label: treatmentArea.is_active ? "Deactivate" : "Activate",
      severity: treatmentArea.is_active ? "danger" : "success"
    },
    accept: async () => {
      try {
        await clinicTreatmentAreaService.toggleStatus(props.selectedClinic!.id, treatmentArea.id)
        successToast(toast, treatmentArea.is_active ? "Treatment area deactivated" : "Treatment area activated")
        await loadTreatmentAreas()
      } catch (error: unknown) {
        errorToast(toast, error instanceof Error ? error.message : "Failed to update treatment area status")
      }
    }
  })
}

watch(
  () => props.selectedClinic?.id,
  async () => {
    editorVisible.value = false
    resetDraft()
    resetFilters()
    await loadTreatmentAreas()
  },
  { immediate: true }
)

watch(filteredTreatmentAreas, () => {
  syncSelectedTreatmentArea()
})
</script>