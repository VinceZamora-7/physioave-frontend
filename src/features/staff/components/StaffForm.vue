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
            :options="roles"
            :fluid="true"
            :filter="true"
            :filter-fields="['name']"
            :loading="isRolesLoading"
            placeholder="Select Role">
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
          <label for="role_id">Role</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
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
const {selectedStaff, isLoading: isParentLoading, roles, clinics} = toRefs(props)

const isClinicsLoading = useIsLoading(ClinicTanstackKey.CLINICS)
const isRolesLoading = useIsLoading(ReferenceTanstackKey.ROLES)

const [visible, toggle] = useToggle()

const isEditing = computed<boolean>(() => !!selectedStaff.value)
const isLoading = computed<boolean>(() => isParentLoading.value || isClinicsLoading.value || isRolesLoading.value)

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
    role: roles.value?.find(r => r.id === selectedStaff.value?.role_id)
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
