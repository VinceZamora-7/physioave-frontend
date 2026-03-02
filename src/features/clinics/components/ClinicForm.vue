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
            fluid
            placeholder="Enter Clinic Name"
          />
          <label for="name">Clinic Name</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="start_day">
        <IftaLabel>
          <Select
            :fluid="true"
            :loading="isLoading"
            :options="dayOfWeeks"
            placeholder="Select Start Day"
            :filter="true"
            :filter-fields="['name']">
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
          <label for="start_day">Start Day</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="end_day">
        <IftaLabel>
          <Select
            :fluid="true"
            :loading="isLoading"
            :options="dayOfWeeks"
            placeholder="Select End Day"
            :filter="true"
            :filter-fields="['name']"
          >
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
          <label for="end_day">End Day</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="start_time">
        <IftaLabel>
          <DatePicker id="datepicker-timeonly" hour-format="12"
                      :time-only="true"
                      :fluid="true"
                      :show-icon="true"
                      :manual-input="false" placeholder="Select Start Time"
                      date-format="HH mm a"
                      icon-display="input">
            <template v-slot:inputicon="slotProps">
              <i :class="[isLoading ? 'pi pi-spinner' : 'pi pi-calendar-clock']"
                 @click="slotProps.clickCallback"/>
            </template>
          </DatePicker>
          <label for="start_time">Start Time</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="end_time">
        <IftaLabel>
          <DatePicker id="datepicker-timeonly" hour-format="12" :time-only="true" :fluid="true"
                      :show-icon="true"
                      :manual-input="false" placeholder="Select End Time"
                      date-format="HH mm a"
                      icon-display="input">
            <template v-slot:inputicon="slotProps">
              <i :class="[isLoading ? 'pi pi-spinner' : 'pi pi-calendar-clock']"
                 @click="slotProps.clickCallback"/>
            </template>
          </DatePicker>
          <label for="end_time">End Time</label>
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
import {Form, FormField, type FormInstance, type FormSubmitEvent} from '@primevue/forms'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from "primevue/inputtext";
import IftaLabel from 'primevue/iftalabel'
import {computed, ref, toRefs, useTemplateRef} from 'vue'
import {zodResolver} from '@primevue/forms/resolvers/zod';
import type {ClinicFormEmits, ClinicFormProps} from "@/features/clinics/types/clinic.type";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import {
  type DayOfWeek,
  defaultDraftDebounce,
  defaultDraftMaxWaitDebounce,
  type DialogExpose
} from "@/utils/global.type.ts";
import {getAllDayOfWeeks} from "@/services/day-of-week.service.ts";
import {useToggle, watchDebounced} from "@vueuse/core";
import {type ClinicFormState, clinicSchema} from "@/features/clinics/schema/clinic.schema";


const form = useTemplateRef<FormInstance>('form')

const emit = defineEmits<ClinicFormEmits>()
const props = defineProps<ClinicFormProps>()
const {selectedClinic} = toRefs(props)

const [visible, toggle] = useToggle()

const dayOfWeeks = ref<DayOfWeek[]>(getAllDayOfWeeks())

const isEditing = computed<boolean>(() => !!selectedClinic.value)

const resolver = ref(
  zodResolver(
    clinicSchema
      .refine((data) => data.end_time >= data.start_time, {
        message: "end_time must be greater than or equal to start_time",
        path: ["end_time"],
      })
      .refine((data) => data.end_day.id >= data.start_day.id, {
        message: "end_day must be greater than or equal to start_day",
        path: ["end_day"],
      })
  ),
)

watchDebounced(() => form.value?.states, async (newValues): Promise<void> => {
  if (isEditing.value) return
  await props.draftService.save(newValues)
}, {
  debounce: defaultDraftDebounce,
  maxWait: defaultDraftMaxWaitDebounce,
  deep: true,
  flush: "post"
})

/**
 * When saving fetch the APIs and populate when there's draft values
 * When editing fetch the APIs and populate from the currently selected values
 */
const onShow = async (): Promise<void> => {
  if (!isEditing.value) {
    await populateOnDraft()
    return
  }

  const initialValues: Partial<ClinicFormState> = {
    name: selectedClinic.value?.name,
    start_day: dayOfWeeks.value?.find(d => d.id === selectedClinic.value?.start_day),
    end_day: dayOfWeeks.value?.find(d => d.id === selectedClinic.value?.end_day),
    start_time: selectedClinic.value?.start_time,
    end_time: selectedClinic.value?.end_time,
  }
  form.value?.setValues(initialValues)
}

const populateOnDraft = async (): Promise<void> => {
  const draft: ClinicFormState | undefined = await props.draftService.get()
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
</script>
