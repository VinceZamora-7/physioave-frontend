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

      <FormField v-slot="$field" name="role">
        <IftaLabel>
          <Select
            v-model="$field.value"
            :options="filteredRoles"
            :fluid="true"
            :filter="true"
            :filter-fields="['name']"
            :loading="isRolesLoading"
            placeholder="Select job title">
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
          <label for="role_id">Job Title</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-if="selectedRoleAllowsSpecialty" v-slot="$field" name="specialty">
        <IftaLabel>
          <Select
            v-model="$field.value"
            :options="specialties"
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
        <p class="px-1 text-xs text-[rgb(var(--app-fg))]/60">
          {{ selectedRoleRequiresSpecialty
            ? "This job title requires a specialty."
            : "Specialty is optional for this provider job title." }}
        </p>
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

const form = useTemplateRef<FormInstance>('form')

const emit = defineEmits<StaffFormEmits>()
const props = defineProps<StaffFormProps>()
const {selectedStaff, isLoading: isParentLoading, roles, clinics, specialties} = toRefs(props)

const isClinicsLoading = useIsLoading(ClinicTanstackKey.CLINICS)
const isRolesLoading = useIsLoading(ReferenceTanstackKey.ROLES)

const [visible, toggle] = useToggle()

const isEditing = computed<boolean>(() => !!selectedStaff.value)
const isLoading = computed<boolean>(() => isParentLoading.value || isClinicsLoading.value || isRolesLoading.value)
const filteredRoles = computed(() => {
  const allowedRoles = props.canManageHighestRole
    ? (roles.value ?? [])
    : (roles.value?.filter(role => role.name !== "Owner") ?? [])
  const selectedRole = roles.value?.find(role => role.id === selectedStaff.value?.role_id)

  if (!selectedRole || allowedRoles.some(role => role.id === selectedRole.id)) {
    return allowedRoles
  }

  return [selectedRole, ...allowedRoles]
})
const selectedRoleAllowsSpecialty = computed(() => {
  const providerType = (form.value?.states?.role?.value as {appointment_provider_type?: string} | undefined)?.appointment_provider_type
  return Boolean(providerType && providerType !== "NONE")
})
const selectedRoleRequiresSpecialty = computed(() =>
  Boolean((form.value?.states?.role?.value as {requires_specialty_tag?: boolean} | undefined)?.requires_specialty_tag)
)

const resolver = ref(zodResolver(staffSchema))

/**
 * When saving fetch the APIs and populate when there's draft values
 * When editing fetch the APIs and populate from the currently selected values
 */
const onShow = async (): Promise<void> => {
  if (!isEditing.value) {
    await populateOnDraft()
    return
  }

  const initialValues: Partial<StaffFormState> = {
    name: selectedStaff.value?.name,
    email: selectedStaff.value?.email,
    clinic: clinics.value?.find(c => c.id === selectedStaff.value?.clinic_id),
    role: filteredRoles.value?.find(r => r.id === selectedStaff.value?.role_id),
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
</script>
