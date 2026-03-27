<template>
  <section class="app-section-card-comfy mt-4 space-y-4">
    <div class="rounded-3xl border border-[#A91D8B]/15 bg-[linear-gradient(120deg,rgba(36,39,87,0.10),rgba(94,24,105,0.07),rgba(169,29,139,0.12))] p-4 shadow-[0_18px_40px_rgba(36,39,87,0.08)] sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-white/35 bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--app-fg))]">
              Clinic Setup
            </span>
            <Tag
              v-if="selectedClinic"
              severity="contrast"
              :value="selectedClinic.name"
            />
          </div>

          <div class="space-y-1">
            <h2 class="text-2xl font-semibold text-[rgb(var(--app-fg))]">
              Treatment Areas
            </h2>
            <p class="max-w-3xl text-sm leading-6 text-[rgb(var(--app-fg))]/75">
              Manage the clinic rooms available for appointment booking. Each treatment area belongs to the selected clinic and carries the color coding used across Appointments.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="selectedClinic"
            label="Refresh"
            icon="pi pi-refresh"
            outlined
            :loading="isLoading"
            :pt="ptOutlinedBtn"
            @click="loadTreatmentAreas"
          />
          <Button
            v-if="selectedClinic && canManage"
            label="Add Treatment Area"
            icon="pi pi-plus"
            :pt="ptPrimaryBtn"
            @click="openCreate"
          />
        </div>
      </div>
    </div>

    <div
      v-if="!selectedClinic"
      class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-6 py-12 text-center"
    >
      <div class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(36,39,87,0.08)] text-2xl text-[rgb(var(--app-fg))]">
        <i class="pi pi-building" />
      </div>
      <div class="text-lg font-semibold text-[rgb(var(--app-fg))]">
        Select a clinic to manage its treatment areas
      </div>
      <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--app-fg))]/70">
        Once you select a clinic from the table above, this workspace will show its rooms, colors, operational status, and quick actions.
      </p>
    </div>

    <template v-else>
      <div class="grid gap-3 md:grid-cols-3">
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--app-fg))]/60">
            Total Areas
          </div>
          <div class="mt-2 text-3xl font-semibold text-[rgb(var(--app-fg))]">
            {{ summary.total }}
          </div>
          <div class="mt-1 text-sm text-[rgb(var(--app-fg))]/65">
            All configured rooms for this clinic
          </div>
        </article>

        <article class="rounded-2xl border border-emerald-200/60 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0.72))] p-4">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
            Operational
          </div>
          <div class="mt-2 text-3xl font-semibold text-emerald-900">
            {{ summary.active }}
          </div>
          <div class="mt-1 text-sm text-emerald-900/65">
            Available for new appointments
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200/70 bg-[linear-gradient(135deg,rgba(148,163,184,0.10),rgba(255,255,255,0.76))] p-4">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700/70">
            Non Operational
          </div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">
            {{ summary.inactive }}
          </div>
          <div class="mt-1 text-sm text-slate-900/65">
            Hidden from active room selection
          </div>
        </article>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_340px]">
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] shadow-sm">
          <div class="flex flex-col gap-3 border-b border-[rgb(var(--app-border))] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-1">
              <div class="text-lg font-semibold text-[rgb(var(--app-fg))]">
                Treatment Area Table
              </div>
              <div class="text-sm text-[rgb(var(--app-fg))]/65">
                Search by room name, filter by status, then select a row to inspect or edit it.
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div class="relative min-w-[220px]">
                <i class="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--app-fg))]/45" />
                <InputText
                  v-model="searchTerm"
                  fluid
                  placeholder="Search treatment areas"
                  class="pl-10"
                  :pt="ptInputText"
                />
              </div>

              <SelectButton
                v-model="statusFilter"
                :options="statusFilterOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              />

              <Button
                v-if="hasActiveFilters"
                label="Reset"
                icon="pi pi-filter-slash"
                text
                @click="resetFilters"
              />
            </div>
          </div>

          <DataTable
            :value="filteredTreatmentAreas"
            :loading="isLoading"
            :selection="selectedTreatmentArea"
            showGridlines
            dataKey="id"
            size="small"
            scrollable
            scrollHeight="420px"
            :rowClass="resolveRowClass"
            :pt="tablePt"
            @update:selection="selectedTreatmentArea = $event ?? undefined"
          >
            <template #empty>
              <div class="px-6 py-12 text-center">
                <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(36,39,87,0.08)] text-xl text-[rgb(var(--app-fg))]">
                  <i class="pi pi-inbox" />
                </div>
                <div class="text-lg font-semibold text-[rgb(var(--app-fg))]">
                  No treatment areas match your filters
                </div>
                <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-[rgb(var(--app-fg))]/65">
                  Try clearing the search or switching the status filter. Authorized users can also add a new treatment area for this clinic.
                </p>
              </div>
            </template>

            <Column
              selectionMode="single"
              headerStyle="width: 3rem"
            />

            <Column
              field="name"
              header="Treatment Area"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <span
                    class="h-3.5 w-3.5 rounded-full border border-white/70 shadow-sm"
                    :style="{ backgroundColor: data.color }"
                  />
                  <div class="space-y-1">
                    <div class="font-medium text-[rgb(var(--app-fg))]">
                      {{ data.name }}
                    </div>
                    <div class="text-xs text-[rgb(var(--app-fg))]/55">
                      Used as a bookable clinic room
                    </div>
                  </div>
                </div>
              </template>
            </Column>

            <Column
              field="color"
              header="Color"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-3">
                  <div
                    class="h-8 w-8 rounded-xl border border-[rgb(var(--app-border))] shadow-inner"
                    :style="{ backgroundColor: data.color }"
                  />
                  <span class="font-mono text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/70">
                    {{ data.color }}
                  </span>
                </div>
              </template>
            </Column>

            <Column
              field="is_active"
              header="Status"
            >
              <template #body="{ data }">
                <Tag
                  :severity="data.is_active ? 'success' : 'secondary'"
                  :value="data.is_active ? 'Operational' : 'Non operational'"
                />
              </template>
            </Column>

            <Column
              v-if="canManage"
              header="Actions"
              :pt="{ headerCell: { class: 'w-[170px]' }, bodyCell: { class: 'w-[170px]' } }"
            >
              <template #body="{ data }">
                <div class="flex flex-wrap justify-end gap-2">
                  <Button
                    text
                    size="small"
                    icon="pi pi-pencil"
                    label="Edit"
                    @click="openEdit(data)"
                  />
                  <Button
                    text
                    size="small"
                    :severity="data.is_active ? 'danger' : 'success'"
                    :icon="data.is_active ? 'pi pi-times-circle' : 'pi pi-refresh'"
                    :label="data.is_active ? 'Deactivate' : 'Activate'"
                    @click="confirmToggleStatus(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </article>

        <aside class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 shadow-sm">
          <div class="space-y-1">
            <div class="text-lg font-semibold text-[rgb(var(--app-fg))]">
              Area Details
            </div>
            <div class="text-sm text-[rgb(var(--app-fg))]/65">
              Select a treatment area from the table to inspect its settings and quick actions.
            </div>
          </div>

          <div
            v-if="activeTreatmentArea"
            class="mt-4 space-y-4"
          >
            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
              <div class="flex items-start justify-between gap-3">
                <TreatmentAreaChip
                  :name="activeTreatmentArea.name"
                  :color="activeTreatmentArea.color"
                />
                <Tag
                  :severity="activeTreatmentArea.is_active ? 'success' : 'secondary'"
                  :value="activeTreatmentArea.is_active ? 'Operational' : 'Non operational'"
                />
              </div>

              <div class="mt-4 grid gap-3">
                <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--app-fg))]/55">
                    Color Code
                  </div>
                  <div class="mt-2 flex items-center gap-3">
                    <div
                      class="h-10 w-10 rounded-2xl border border-[rgb(var(--app-border))]"
                      :style="{ backgroundColor: activeTreatmentArea.color }"
                    />
                    <div class="font-mono text-sm uppercase text-[rgb(var(--app-fg))]">
                      {{ activeTreatmentArea.color }}
                    </div>
                  </div>
                </div>

                <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm leading-6 text-[rgb(var(--app-fg))]/70">
                  This treatment area appears in appointment create flows for <span class="font-semibold text-[rgb(var(--app-fg))]">{{ selectedClinic.name }}</span>. Deactivating it keeps old records intact while removing it from active selection lists.
                </div>
              </div>
            </div>

            <div
              v-if="canManage"
              class="flex flex-col gap-2"
            >
              <Button
                label="Edit Selected Area"
                icon="pi pi-pencil"
                outlined
                :pt="ptOutlinedBtn"
                @click="openEdit(activeTreatmentArea)"
              />
              <Button
                :label="activeTreatmentArea.is_active ? 'Deactivate Selected Area' : 'Activate Selected Area'"
                :icon="activeTreatmentArea.is_active ? 'pi pi-times-circle' : 'pi pi-refresh'"
                :severity="activeTreatmentArea.is_active ? 'danger' : 'success'"
                @click="confirmToggleStatus(activeTreatmentArea)"
              />
            </div>
          </div>

          <div
            v-else
            class="mt-4 rounded-2xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-5 py-10 text-center"
          >
            <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(36,39,87,0.08)] text-xl text-[rgb(var(--app-fg))]">
              <i class="pi pi-clone" />
            </div>
            <div class="font-semibold text-[rgb(var(--app-fg))]">
              No area selected yet
            </div>
            <p class="mt-2 text-sm leading-6 text-[rgb(var(--app-fg))]/65">
              Pick a row from the table to preview its status, color, and management actions here.
            </p>
          </div>
        </aside>
      </div>
    </template>

    <Dialog
      v-model:visible="editorVisible"
      modal
      :header="draftId ? 'Edit Treatment Area' : 'New Treatment Area'"
      :style="{ width: '560px' }"
    >
      <div class="space-y-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
          <div class="space-y-1">
            <div class="text-sm font-semibold text-[rgb(var(--app-fg))]">
              {{ selectedClinic?.name }}
            </div>
            <div class="text-sm text-[rgb(var(--app-fg))]/65">
              Treatment areas created here will be available only within this clinic.
            </div>
          </div>
        </div>

        <div class="float-label">
          <InputText
            v-model="draftName"
            fluid
            placeholder="Enter treatment area name"
          />
          <label>Treatment Area Name</label>
        </div>

        <div class="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Color</label>
            <input
              v-model="draftColor"
              type="color"
              class="h-12 w-full rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-2"
            >
          </div>

          <div class="space-y-2">
            <div class="text-sm font-medium">Preview</div>
            <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
              <TreatmentAreaChip
                :name="draftName || 'Treatment Area Preview'"
                :color="draftColor"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          text
          @click="editorVisible = false"
        />
        <Button
          :label="draftId ? 'Update Treatment Area' : 'Create Treatment Area'"
          :loading="isSaving"
          :pt="ptPrimaryBtn"
          @click="submit"
        />
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import SelectButton from "primevue/selectbutton"
import Tag from "primevue/tag"
import { useConfirm, useToast } from "primevue"

import type { Clinic } from "@/features/clinics/types/clinic"
import { clinicTreatmentAreaService } from "@/features/clinics/api/clinic-treatment-area.service"
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue"
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
  if (selectedTreatmentArea.value) {
    return selectedTreatmentArea.value
  }

  return filteredTreatmentAreas.value[0]
})

const hasActiveFilters = computed(() =>
  Boolean(searchTerm.value.trim()) || statusFilter.value !== Status.ALL
)

const tablePt = {
  header: { class: "hidden" },
  table: { class: "min-w-[720px]" },
  column: {
    headerCell: { class: "bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] font-semibold" },
    bodyCell: { class: "align-middle" }
  }
} as const

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
    return isSelected
      ? `${base} bg-[rgba(148,163,184,0.16)]`
      : `${base} opacity-75`
  }

  return isSelected
    ? `${base} bg-[rgba(169,29,139,0.08)]`
    : base
}

const syncSelectedTreatmentArea = (): void => {
  const currentId = selectedTreatmentArea.value?.id
  if (!filteredTreatmentAreas.value.length) {
    selectedTreatmentArea.value = undefined
    return
  }

  const matched = currentId
    ? filteredTreatmentAreas.value.find((area) => area.id === currentId)
    : undefined

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
  resetDraft()
  editorVisible.value = true
}

const openEdit = (treatmentArea: TreatmentArea): void => {
  selectedTreatmentArea.value = treatmentArea
  draftId.value = treatmentArea.id
  draftName.value = treatmentArea.name
  draftColor.value = treatmentArea.color || "#2563EB"
  editorVisible.value = true
}

const submit = async (): Promise<void> => {
  if (!props.selectedClinic?.id) {
    errorToast(toast, "Select a clinic first")
    return
  }

  const name = draftName.value.trim()
  if (!name) {
    errorToast(toast, "Treatment area name is required")
    return
  }

  const color = draftColor.value.trim().toUpperCase()
  if (!/^#[0-9A-F]{6}$/.test(color)) {
    errorToast(toast, "Treatment area color must look like #2563EB")
    return
  }

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
  if (!props.selectedClinic?.id) {
    errorToast(toast, "Select a clinic first")
    return
  }

  confirm.require({
    message: `If you proceed, ${treatmentArea.name} will become ${treatmentArea.is_active ? "non operational" : "operational"}.`,
    header: `${treatmentArea.is_active ? "Deactivate" : "Activate"} Treatment Area`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true
    },
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
