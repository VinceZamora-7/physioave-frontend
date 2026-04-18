<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Specialty Manager"
    :style="{ width: '900px' }"
    :breakpoints="{ '1280px': '96vw', '768px': '100vw' }"
  >
    <div class="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="text-sm font-semibold text-[rgb(var(--app-fg))]">Specialty Directory</div>
            <div class="text-xs text-[rgb(var(--app-fg))]/60">Add specialties like Neuro, Ortho, Pediatric, and more.</div>
          </div>
          <Button
            label="New Specialty"
            icon="pi pi-plus"
            size="small"
            :disabled="isBusy"
            @click="startCreateSpecialty"
          />
        </div>

        <IftaLabel class="mt-4">
          <InputText
            v-model="search"
            fluid
            placeholder="Search specialties"
            :disabled="isBusy"
          />
          <label>Search</label>
        </IftaLabel>

        <SelectButton
          v-model="statusFilter"
          class="mt-4"
          :options="statusFilterOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          :disabled="isBusy"
        />

        <div class="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <button
            v-for="specialty in filteredSpecialties"
            :key="specialty.id"
            type="button"
            :disabled="isBusy"
            :class="[
              'w-full rounded-2xl border px-3 py-3 text-left transition',
              selectedSpecialtyId === specialty.id
                ? 'border-[rgb(var(--app-primary))] bg-[rgb(var(--app-card))] shadow-sm'
                : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] hover:bg-[rgb(var(--app-card))]'
            ]"
            @click="selectSpecialty(specialty)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="font-medium text-[rgb(var(--app-fg))]">{{ specialty.name }}</div>
              <Tag :value="specialty.is_active ? 'Active' : 'Inactive'" :severity="specialty.is_active ? 'success' : 'secondary'" />
            </div>
          </button>

          <div
            v-if="!filteredSpecialties.length && !isLoading"
            class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-4 py-8 text-center text-sm text-[rgb(var(--app-fg))]/60"
          >
            No specialties found.
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-[rgb(var(--app-fg))]">
              {{ isCreateMode ? "Create Specialty" : `Edit ${selectedSpecialty?.name || "Specialty"}` }}
            </h3>
            <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/60">
              These specialties are used in staff setup and appointment booking.
            </p>
          </div>
          <Tag
            :value="isCreateMode ? 'Draft' : (selectedSpecialty?.is_active ? 'Active' : 'Inactive')"
            :severity="isCreateMode ? 'contrast' : (selectedSpecialty?.is_active ? 'success' : 'secondary')"
          />
        </div>

        <div class="mt-4 space-y-4">
          <IftaLabel>
            <InputText
              v-model="specialtyName"
              fluid
              placeholder="Specialty name"
              :disabled="isBusy"
            />
            <label>Specialty Name</label>
          </IftaLabel>

          <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3 text-sm text-[rgb(var(--app-fg))]/70">
            Example entries: `Neuro`, `Musculoskeletal`, `Pediatric`, `Sports Rehab`, `Geriatric`. Inactive specialties stay on file but are hidden from appointment scheduling choices.
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <Button
              v-if="!isCreateMode"
              :label="selectedSpecialty?.is_active ? 'Deactivate Specialty' : 'Activate Specialty'"
              :icon="selectedSpecialty?.is_active ? 'pi pi-times-circle' : 'pi pi-refresh'"
              :severity="selectedSpecialty?.is_active ? 'danger' : 'success'"
              outlined
              :disabled="isBusy"
              @click="toggleSpecialtyStatus"
            />
            <Button
              label="Reset"
              icon="pi pi-refresh"
              outlined
              :disabled="isBusy"
              @click="resetForm"
            />
            <Button
              :label="isCreateMode ? 'Create Specialty' : 'Save Specialty'"
              :icon="isCreateMode ? 'pi pi-plus' : 'pi pi-save'"
              :loading="isSaving"
              :disabled="isBusy"
              @click="saveSpecialty"
            />
          </div>
        </div>
      </section>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputText from "primevue/inputtext"
import SelectButton from "primevue/selectbutton"
import Tag from "primevue/tag"
import { useToast } from "primevue"

import type { Pageable } from "@/models/paging"
import type { SpecialtyTag } from "@/models/reference"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import { Status } from "@/utils/global.type"

const emit = defineEmits<{
  (e: "specialtiesUpdated"): void
}>()

const toast = useToast()

const visible = ref(false)
const specialties = ref<SpecialtyTag[]>([])
const selectedSpecialtyId = ref<number | null>(null)
const specialtyName = ref("")
const search = ref("")
const statusFilter = ref<Status>(Status.ALL)
const isLoading = ref(false)
const isSaving = ref(false)

const selectedSpecialty = computed(() =>
  specialties.value.find(specialty => specialty.id === selectedSpecialtyId.value)
)
const isCreateMode = computed(() => selectedSpecialtyId.value == null)
const isBusy = computed(() => isLoading.value || isSaving.value)
const filteredSpecialties = computed(() => {
  const normalized = search.value.trim().toLowerCase()
  return specialties.value.filter(specialty => {
    const matchesSearch = !normalized || specialty.name.toLowerCase().includes(normalized)
    const matchesStatus =
      statusFilter.value === Status.ALL
        || (statusFilter.value === Status.ACTIVE && specialty.is_active)
        || (statusFilter.value === Status.INACTIVE && !specialty.is_active)

    return matchesSearch && matchesStatus
  })
})

const statusFilterOptions = [
  { label: "All", value: Status.ALL },
  { label: "Active", value: Status.ACTIVE },
  { label: "Inactive", value: Status.INACTIVE }
]

function extractApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Reference permissions in Role Access",
    invalidInputHint: "Specialty values are invalid. Review the form and try again.",
    retryHint: "Please try again."
  })
}

function applySelectedSpecialty(specialty?: SpecialtyTag): void {
  specialtyName.value = specialty?.name ?? ""
}

async function fetchSpecialties(preferredSpecialtyId?: number | null): Promise<void> {
  isLoading.value = true
  try {
    const { data } = await pamsAPI.get<Pageable<SpecialtyTag>>("/references/specialty-tags", {
      params: { page: 1, size: 500, status: "ALL" }
    })

    specialties.value = data?.content ?? []
    const nextSpecialty =
      specialties.value.find(specialty => specialty.id === preferredSpecialtyId) ??
      specialties.value.find(specialty => specialty.id === selectedSpecialtyId.value) ??
      specialties.value[0]

    if (nextSpecialty) {
      selectSpecialty(nextSpecialty)
      return
    }

    startCreateSpecialty()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to load specialties"))
  } finally {
    isLoading.value = false
  }
}

function selectSpecialty(specialty: SpecialtyTag): void {
  selectedSpecialtyId.value = specialty.id
  applySelectedSpecialty(specialty)
}

function startCreateSpecialty(): void {
  selectedSpecialtyId.value = null
  applySelectedSpecialty()
}

function resetForm(): void {
  applySelectedSpecialty(selectedSpecialty.value)
}

async function saveSpecialty(): Promise<void> {
  const name = specialtyName.value.trim()
  if (!name) {
    errorToast(toast, "Specialty name is required")
    return
  }

  const wasCreating = isCreateMode.value

  isSaving.value = true
  try {
    if (isCreateMode.value) {
      await pamsAPI.post("/references/specialty-tags", { name })
      successToast(toast, "Specialty created")
    } else if (selectedSpecialtyId.value) {
      await pamsAPI.put(`/references/specialty-tags/${selectedSpecialtyId.value}`, { name })
      successToast(toast, "Specialty updated")
    }

    emit("specialtiesUpdated")
    await fetchSpecialties(selectedSpecialtyId.value)
    if (wasCreating) {
      const createdSpecialty = specialties.value.find(specialty => specialty.name.toLowerCase() === name.toLowerCase())
      if (createdSpecialty) {
        selectSpecialty(createdSpecialty)
      }
    }
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to save specialty"))
  } finally {
    isSaving.value = false
  }
}

async function toggleSpecialtyStatus(): Promise<void> {
  if (!selectedSpecialtyId.value) return

  isSaving.value = true
  try {
    await pamsAPI.patch(`/references/specialty-tags/${selectedSpecialtyId.value}/status`)
    successToast(toast, selectedSpecialty.value?.is_active ? "Specialty deactivated" : "Specialty activated")
    emit("specialtiesUpdated")
    await fetchSpecialties(selectedSpecialtyId.value)
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to update specialty status"))
  } finally {
    isSaving.value = false
  }
}

async function open(): Promise<void> {
  visible.value = true
  await fetchSpecialties(selectedSpecialtyId.value)
}

defineExpose({ open })
</script>
