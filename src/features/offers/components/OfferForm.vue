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

      <FormField v-slot="$field" name="price">
        <IftaLabel>
          <InputNumber
            :allow-empty="true"
            input-id="integeronly"
            mode="decimal"
            fluid
            placeholder="Enter Price"
          />
          <label for="price">Price</label>
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
import {computed, ref, toRefs, useTemplateRef} from "vue";
import type {OfferFormEmits, OfferFormProps} from "@/features/offers/components/offer.type";
import type {Machine} from "@/features/offers/types/offer";
import {useToggle} from "@vueuse/core";
import {Form, FormField, type FormInstance, type FormSubmitEvent} from "@primevue/forms";
import type {DialogExpose} from "@/utils/global.type.ts";
import {type OfferFormState, offerSchema} from "@/features/offers/schema/offer.schema";
import {zodResolver} from "@primevue/forms/resolvers/zod";
import Button from "primevue/button";
import IftaLabel from "primevue/iftalabel";
import Message from "primevue/message";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";

const form = useTemplateRef<FormInstance>('form')

const [visible, toggle] = useToggle()

const emit = defineEmits<OfferFormEmits>()
const props = defineProps<OfferFormProps<Machine>>()
const {selectedOffer} = toRefs(props)

const resolver = ref(zodResolver(offerSchema))
const isEditing = computed<boolean>(() => !!selectedOffer.value)

/**
 * When saving fetch the APIs and populate when there's draft values
 * When editing fetch the APIs and populate from the currently selected values
 */
const onShow = async (): Promise<void> => {
  if (!isEditing.value) return

  const initialValues: Partial<OfferFormState> = {
    name: selectedOffer.value?.name,
    price: selectedOffer.value?.price,
  }
  form.value?.setValues(initialValues)
}

const onSubmit = (event: FormSubmitEvent) => {
  if (!event.valid) return
  emit('onSubmit', event as FormSubmitEvent<OfferFormState>)
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>

