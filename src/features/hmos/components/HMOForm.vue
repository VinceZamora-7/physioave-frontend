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
    <Form :resolver="resolver" @submit="onSubmit" class="flex flex-col gap-2"
          ref="form">

      <FormField v-slot="$field" name="name">
        <IftaLabel>
          <InputText
            id="name"
            v-model="$field.value"
            fluid
            placeholder="Enter name"
          />
          <label for="name">Name</label>
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

import Dialog from "primevue/dialog";
import {useToggle} from "@vueuse/core";
import {Form, FormField, type FormInstance, type FormSubmitEvent} from "@primevue/forms";
import type {DialogExpose} from "@/utils/global.type.ts";
import type {HMOFormEmits, HMOFormProps} from "@/features/hmos/components/hmo.type";
import {computed, ref, toRefs, useTemplateRef} from "vue";
import {stringSchema, type StringSchemaFormState} from "@/schema/global.schema.ts";
import Button from "primevue/button";
import IftaLabel from "primevue/iftalabel";
import Message from "primevue/message";
import InputText from "primevue/inputtext";
import {zodResolver} from "@primevue/forms/resolvers/zod";

const form = useTemplateRef<FormInstance>('form')

const [visible, toggle] = useToggle()

const emit = defineEmits<HMOFormEmits>()
const props = defineProps<HMOFormProps>()
const {selectedHMO} = toRefs(props)

const isEditing = computed<boolean>(() => !!selectedHMO.value)

const resolver = ref(zodResolver(stringSchema))

/**
 * When saving fetch the APIs and populate when there's draft values
 * When editing fetch the APIs and populate from the currently selected values
 */
const onShow = async (): Promise<void> => {
  if (!isEditing.value) return

  const initialValues: Partial<StringSchemaFormState> = {
    name: selectedHMO.value?.name,
  }
  form.value?.setValues(initialValues)
}

const onSubmit = (event: FormSubmitEvent) => {
  if (!event.valid) return
  emit('onSubmit', event as FormSubmitEvent<StringSchemaFormState>)
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>

