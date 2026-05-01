<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="buttonProps.label"
    modal
    :draggable="false"
    :resizable="false"
    @show="onShow"
  >
    <Form :resolver="resolver" @submit="onSubmit"
          class="flex flex-col gap-2"
          ref="form">
      <Message severity="info" :closable="false" class="mb-1">
        {{ formIntroText }}
      </Message>

      <FormField v-slot="$field" name="name">
        <IftaLabel>
          <InputText
            id="name"
            v-model="$field.value"
            fluid
            placeholder="Enter Name"
          />
          <label for="name">Name</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="email">
        <IftaLabel>
          <InputText
            id="email"
            v-model="$field.value"
            type="email"
            fluid
            placeholder="Enter email"
          />
          <label for="email">Email</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="clinic">
        <IftaLabel>
          <Select
            v-model="$field.value"
            :options="clinics"
            :fluid="true"
            :filter="true"
            :filter-fields="['name']"
            :loading="isClinicsLoading"
            :disabled="canViewAllBranches && !isPtForm"
            placeholder="Select Clinic">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="clinic_id">Clinic</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-if="showAllBranchesField" v-slot="$field" name="can_view_all_branches">
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3">
          <div class="flex items-center gap-2">
            <Checkbox
              input-id="can_view_all_branches"
              v-model="$field.value"
              :binary="true"
            />
            <label for="can_view_all_branches" class="text-sm font-medium">Can view all branches data</label>
          </div>
          <p class="mt-2 text-xs text-[rgb(var(--app-fg))]/60">
            Turn this on for high admins who are allowed to switch and see all branch records.
          </p>
        </div>
      </FormField>

      <FormField v-slot="$field" name="role">
        <IftaLabel>
          <Select
            v-model="$field.value"
            :options="filteredRoles"
            :fluid="true"
            :filter="true"
            :filter-fields="['name']"
            :loading="isRolesLoading"
            :placeholder="rolePlaceholder">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="role_id">{{ roleLabel }}</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-if="showAdminPtToggle" v-slot="$field" name="also_pt">
        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3">
          <div class="flex items-center gap-2">
            <Checkbox
              input-id="also_pt"
              v-model="$field.value"
              :binary="true"
            />
            <label for="also_pt" class="text-sm font-medium">Also use this admin as PT in appointments</label>
          </div>
          <p class="mt-2 text-xs text-[rgb(var(--app-fg))]/60">
            Enable this if the same person should also appear in PT selection during appointment booking.
          </p>
        </div>
      </FormField>

      <FormField v-if="showSecondaryPtRoleField" v-slot="$field" name="secondary_role">
        <IftaLabel>
          <Select
            v-model="$field.value"
            :options="ptRoles"
            :fluid="true"
            :filter="true"
            :filter-fields="['name']"
            :loading="isRolesLoading"
            :placeholder="ptRolePlaceholder">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="secondary_role_id">PT Job Title</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-if="showSpecialtyField" v-slot="$field" name="specialty">
        <IftaLabel>
          <Select
            v-model="$field.value"
            :options="allSpecialties"
            :fluid="true"
            :filter="true"
            :filter-fields="['name']"
            placeholder="Select Specialty">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="specialty_tag_id">Specialty</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
        <div class="flex items-start justify-between gap-2">
          <p class="px-1 text-xs text-[rgb(var(--app-fg))]/60">
            {{ selectedRoleRequiresSpecialty
              ? "This job title requires a specialty."
              : "Specialty is optional for this provider job title." }}
          </p>
          <button
            v-if="!showInlineSpecialtyAdd"
            type="button"
            class="shrink-0 text-xs text-[#A91D8B] hover:underline"
            @click="showInlineSpecialtyAdd = true"
          >
            + Add new
          </button>
        </div>
        <div v-if="showInlineSpecialtyAdd" class="flex items-center gap-2 pt-1">
          <InputText
            v-model="newSpecialtyName"
            placeholder="New specialty name..."
            class="flex-1"
            size="small"
            autofocus
            @keydown.enter.prevent="addInlineSpecialty"
            @keydown.escape="cancelInlineSpecialtyAdd"
          />
          <Button
            icon="pi pi-check"
            size="small"
            :loading="isAddingSpecialty"
            :disabled="!newSpecialtyName.trim() || isAddingSpecialty"
            @click="addInlineSpecialty"
          />
          <Button
            icon="pi pi-times"
            size="small"
            severity="secondary"
            outlined
            :disabled="isAddingSpecialty"
            @click="cancelInlineSpecialtyAdd"
          />
        </div>
      </FormField>

      <div class="flex justify-end gap-2 mt-4">
        <Button :loading="isLoading" label="Cancel" type="button" @click="onClose"/>
        <Button
          :loading="isLoading"
          :label="buttonProps.label"
          :icon="buttonProps.icon"
          :severity="buttonProps.severity"
          type="submit"
        />
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import Select from "primevue/select";
import Dialog from "primevue/dialog";
import Checkbox from "primevue/checkbox";
import {Form, FormField, type FormInstance, type FormSubmitEvent} from "@primevue/forms";
import {useToggle, watchDebounced} from "@vueuse/core";
import {
  defaultDraftDebounce,
  defaultDraftMaxWaitDebounce,
  type DialogExpose
} from "@/utils/global.type.ts";
import {zodResolver} from "@primevue/forms/resolvers/zod";
import {computed, ref, toRefs, useTemplateRef} from "vue";
import Button from "primevue/button";
import type {StaffFormEmits, StaffFormProps} from "@/features/staff/types/staff.type";
import IftaLabel from "primevue/iftalabel";
import Message from "primevue/message";
import InputText from "primevue/inputtext";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {type StaffFormState, staffSchema} from "@/features/staff/schema/staff.schema";
import {ClinicTanstackKey, ReferenceTanstackKey} from "@/utils/keys/tanstack-key.ts";
import { useToast } from "primevue/usetoast";
import { pamsAPI } from "@/utils/axios-interceptor";
import { errorToast, successToast } from "@/utils/toast.util";
import type { SpecialtyTag } from "@/models/reference";

const isPtProviderType = (providerType?: string | null): boolean =>
  providerType === "PHYSICAL_THERAPIST" || providerType === "PT_ASSISTANT" || providerType === "INTERN"

const form = useTemplateRef<FormInstance>('form')

const emit = defineEmits<StaffFormEmits>()
const props = defineProps<StaffFormProps>()
const {selectedStaff, isLoading: isParentLoading, roles, ptRoles, clinics, specialties} = toRefs(props)

const toast = useToast()
const isClinicsLoading = useIsLoading(ClinicTanstackKey.CLINICS)
const isRolesLoading = useIsLoading(ReferenceTanstackKey.ROLES)

const [visible, toggle] = useToggle()

const showInlineSpecialtyAdd = ref(false)
const newSpecialtyName = ref("")
const isAddingSpecialty = ref(false)
const localAddedSpecialties = ref<SpecialtyTag[]>([])

const allSpecialties = computed<SpecialtyTag[]>(() => {
  const base = specialties.value ?? []
  const baseIds = new Set(base.map(s => s.id))
  const extras = localAddedSpecialties.value.filter(s => !baseIds.has(s.id))
  return [...base, ...extras]
})

const isEditing = computed<boolean>(() => !!selectedStaff.value)
const isLoading = computed<boolean>(() => isParentLoading.value || isClinicsLoading.value || isRolesLoading.value)
const formMode = computed<"ADMIN" | "PT">(() => props.formMode ?? "ADMIN")
const isPtForm = computed(() => formMode.value === "PT")
const selectedStaffUsesSecondaryPtRole = computed(() =>
  Boolean(
    selectedStaff.value
    && !isPtProviderType(selectedStaff.value.appointment_provider_type)
    && isPtProviderType(selectedStaff.value.secondary_appointment_provider_type)
  )
)
const formIntroText = computed(() =>
  isPtForm.value
    ? "PT Staff Form: add physical therapists, assistants, and interns."
    : "Admin Staff Form: add admin office users and optionally toggle them as PTs for appointments."
)
const roleLabel = computed(() => (isPtForm.value ? "PT Job Title" : "Admin Job Title"))
const rolePlaceholder = computed(() => (isPtForm.value ? "Select PT job title" : "Select admin job title"))
const ptRolePlaceholder = computed(() => "Select PT job title")
const highestRoleIdSet = computed(() => new Set(props.highestRoleIds ?? []))
const filteredRoles = computed(() => {
  const allowedRoles = props.canManageHighestRole
    ? (roles.value ?? [])
    : (roles.value?.filter(role => !highestRoleIdSet.value.has(role.id)) ?? [])
  const selectedRole = roles.value?.find(role => role.id === selectedStaff.value?.role_id)

  if (!selectedRole || allowedRoles.some(role => role.id === selectedRole.id)) {
    return allowedRoles
  }

  return [selectedRole, ...allowedRoles]
})
const selectedProviderRole = computed(() => {
  if (isPtForm.value) {
    return form.value?.states?.role?.value as {appointment_provider_type?: string; requires_specialty_tag?: boolean} | undefined
  }

  const alsoPt = Boolean(form.value?.states?.also_pt?.value)
  return (alsoPt
    ? form.value?.states?.secondary_role?.value
    : form.value?.states?.role?.value) as {appointment_provider_type?: string; requires_specialty_tag?: boolean} | undefined
})
const selectedRoleAllowsSpecialty = computed(() => {
  const providerType = selectedProviderRole.value?.appointment_provider_type
  return Boolean(providerType && providerType !== "NONE")
})
const showAdminPtToggle = computed(() => !isPtForm.value)
const showAllBranchesField = computed(() => !isPtForm.value)
const showSecondaryPtRoleField = computed(() => !isPtForm.value && Boolean(form.value?.states?.also_pt?.value))
const showSpecialtyField = computed(() => selectedRoleAllowsSpecialty.value)
const selectedRoleRequiresSpecialty = computed(() =>
  Boolean(selectedProviderRole.value?.requires_specialty_tag)
)
const canViewAllBranches = computed(() => Boolean(form.value?.states?.can_view_all_branches?.value))

const resolver = ref(zodResolver(staffSchema))

const addInlineSpecialty = async (): Promise<void> => {
  const name = newSpecialtyName.value.trim()
  if (!name || isAddingSpecialty.value) return

  const existing = allSpecialties.value.find(s => s.name.toLowerCase() === name.toLowerCase())
  if (existing) {
    form.value?.setValues({
      name: String(form.value.states?.name?.value ?? ""),
      email: String(form.value.states?.email?.value ?? ""),
      clinic: form.value.states?.clinic?.value,
        can_view_all_branches: Boolean(form.value.states?.can_view_all_branches?.value),
      role: form.value.states?.role?.value,
        also_pt: Boolean(form.value.states?.also_pt?.value),
        secondary_role: form.value.states?.secondary_role?.value,
      specialty: existing,
    })
    showInlineSpecialtyAdd.value = false
    newSpecialtyName.value = ""
    return
  }

  isAddingSpecialty.value = true
  try {
    await pamsAPI.post("/references/specialty-tags", { name })
    const { data } = await pamsAPI.get<{ content: SpecialtyTag[] }>("/references/specialty-tags", {
      params: { page: 1, size: 500, status: "ACTIVE" }
    })
    const created = data?.content?.find(s => s.name.toLowerCase() === name.toLowerCase())
    if (created) {
      localAddedSpecialties.value.push(created)
      form.value?.setValues({
        name: String(form.value.states?.name?.value ?? ""),
        email: String(form.value.states?.email?.value ?? ""),
        clinic: form.value.states?.clinic?.value,
        can_view_all_branches: Boolean(form.value.states?.can_view_all_branches?.value),
        role: form.value.states?.role?.value,
        also_pt: Boolean(form.value.states?.also_pt?.value),
        secondary_role: form.value.states?.secondary_role?.value,
        specialty: created,
      })
    }
    successToast(toast, `"${name}" added and selected`)
    showInlineSpecialtyAdd.value = false
    newSpecialtyName.value = ""
    emit('specialtyCreated')
  } catch {
    errorToast(toast, "Failed to add specialty")
  } finally {
    isAddingSpecialty.value = false
  }
}

const cancelInlineSpecialtyAdd = (): void => {
  showInlineSpecialtyAdd.value = false
  newSpecialtyName.value = ""
}

/**
 * When saving fetch the APIs and populate when there's draft values
 * When editing fetch the APIs and populate from the currently selected values
 */
const onShow = async (): Promise<void> => {
  if (!isEditing.value) {
    await populateOnDraft()
    return
  }

  const effectivePtRole = selectedStaffUsesSecondaryPtRole.value
    ? ptRoles.value?.find(role => role.id === selectedStaff.value?.secondary_role_id)
    : undefined
  const primaryRole = filteredRoles.value?.find(r => r.id === selectedStaff.value?.role_id)

  const initialValues: Partial<StaffFormState> = {
    name: selectedStaff.value?.name,
    email: selectedStaff.value?.email,
    clinic: clinics.value?.find(c => c.id === selectedStaff.value?.clinic_id),
    can_view_all_branches: Boolean(selectedStaff.value?.can_view_all_branches),
    also_pt: Boolean(selectedStaff.value?.secondary_role_id),
    role: isPtForm.value ? (effectivePtRole ?? primaryRole) : primaryRole,
    secondary_role: ptRoles.value?.find(role => role.id === selectedStaff.value?.secondary_role_id),
    specialty: specialties.value?.find(specialty => specialty.id === selectedStaff.value?.specialty_tag_id)
  }
  form.value?.setValues(initialValues)
}

const populateOnDraft = async (): Promise<void> => {
  const draft: StaffFormState | undefined = await props.draftService.get()
  if (!draft) return
  form.value?.setValues(draft)
}

const onSubmit = (event: FormSubmitEvent) => {
  if (!event.valid) return
  emit('onSubmit', event)
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})

watchDebounced(() => form.value?.states, async (newValues): Promise<void> => {
  if (isEditing.value) return
  await props.draftService.save(newValues)
}, {
  debounce: defaultDraftDebounce,
  maxWait: defaultDraftMaxWaitDebounce,
  deep: true,
  flush: "post"
})

// If an admin can view all branches, we still need a "home" clinic for record ownership/back-end constraints.
// Auto-pick the first clinic if none is selected, and lock the picker to avoid confusion.
watchDebounced(
  () => ({
    allBranches: Boolean(form.value?.states?.can_view_all_branches?.value),
    clinicId: (form.value?.states?.clinic?.value as any)?.id ?? null,
    clinicsCount: clinics.value?.length ?? 0
  }),
  async ({ allBranches, clinicId, clinicsCount }) => {
    if (isPtForm.value) return
    if (!allBranches) return
    if (clinicId) return
    if (!clinicsCount) return
    const fallback = clinics.value?.[0]
    if (!fallback) return

    form.value?.setValues({
      name: String(form.value?.states?.name?.value ?? ""),
      email: String(form.value?.states?.email?.value ?? ""),
      clinic: fallback,
      can_view_all_branches: true,
      role: form.value?.states?.role?.value,
      also_pt: Boolean(form.value?.states?.also_pt?.value),
      secondary_role: form.value?.states?.secondary_role?.value,
      specialty: form.value?.states?.specialty?.value
    })
  },
  { debounce: 50, maxWait: 200, deep: false }
)
</script>
