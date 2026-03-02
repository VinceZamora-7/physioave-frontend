<template>
  <Message severity="error" v-if="isError"> Something went wrong!</Message>
  <Dialog
    v-else
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @show="onShow"
  >
    <Form :resolver="resolver" @submit="onSubmit"
          class="flex flex-col gap-2"
          ref="form">

      <FormField v-slot="$field" name="company_name">
        <IftaLabel>
          <InputText
            id="company_name"
            v-model="$field.value"
            fluid
            placeholder="Enter company name"
          />
          <label for="company_name">Company name</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="hmo_type">
        <IftaLabel>
          <Select
            id="hmo_type"
            :fluid="true"
            :loading="isLoading"
            :options="hmoTypes"
            placeholder="Select HMO Type"
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
          <label for="hmo_type">HMO Type</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="hmo">
        <IftaLabel>
          <Select
            id="hmo"
            :fluid="true"
            :loading="isLoading"
            :options="hmos"
            placeholder="Select HMO"
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
          <label for="hmo">HMO</label>
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


import type {DialogExpose} from "@/utils/global.type.ts";
import Dialog from "primevue/dialog";
import {useToggle} from "@vueuse/core";
import type {
  PatientHMOInformationFormEmits,
  PatientHMOInformationFormProps
} from "@/components/patient.type.ts";
import {Form, FormField, type FormInstance, type FormSubmitEvent} from "@primevue/forms";
import {computed, ref, toRefs, useTemplateRef} from "vue";
import Button from "primevue/button";
import {zodResolver} from "@primevue/forms/resolvers/zod";
import {
  type PatientHMOInformationFormState,
  patientHMOInformationSchema
} from "@/schema/patient.schema.ts";
import {
  patientHmoInformationTanstackService
} from "@/services/patient-hmo-information.tanstack.service.ts";
import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import type {
  PatientHMOInformation,
  PatientHMOInformationPayload
} from "@/models/hmo-information.ts";
import Message from "primevue/message";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";
import {type ButtonProps, useConfirm, useToast} from "primevue";
import InputText from "primevue/inputtext";
import IftaLabel from "primevue/iftalabel";
import Select from "primevue/select";
import {useQueryClient} from "@tanstack/vue-query";
import {errorToast, successToast} from "@/utils/toast.util.ts";

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()
const form = useTemplateRef<FormInstance>('form')

const emit = defineEmits<PatientHMOInformationFormEmits>()
const props = defineProps<PatientHMOInformationFormProps>()
const {patient, hmoTypes, hmos, isLoading: isParentLoading} = toRefs(props)

const isPatientHMOInformationLoading = useIsLoading(PatientTanstackKey.PATIENT_HMO_INFORMATION)
const isLoading = computed<boolean>(() => isParentLoading.value || isPatientHMOInformationLoading.value)

const header = computed<string>(() => patientHMOInformation.value ? `Edit ${patient.value?.full_name} HMO Information` : `Save ${patient.value?.full_name} HMO Information`)
const buttonProps = computed<ButtonProps>(() => ({
  label: patientHMOInformation.value ? `Edit` : `Save`,
  icon: patientHMOInformation.value ? 'pi pi-pen-to-square' : 'pi pi-save',
  severity: patientHMOInformation.value ? 'success' : 'info'
}))

const [visible, toggle] = useToggle()

const patientId = computed<number>(() => patient.value?.id ?? 0)
const {
  data: patientHMOInformation,
  isError,
  error,
  refetch
} = patientHmoInformationTanstackService.getByPatientId(patientId)
useRefreshToken<PatientHMOInformation | undefined>(error, refetch)

const {
  mutate: saveMutation
} = patientHmoInformationTanstackService.save()

const {
  mutate: editMutation
} = patientHmoInformationTanstackService.updateByPatientId()


const isEditing = computed<boolean>(() => !!patientHMOInformation.value)

const resolver = ref(zodResolver(patientHMOInformationSchema))

const onSubmit = (event: FormSubmitEvent) => {
  if (!event.valid) return

  confirm.require({
    message: 'Are you sure you want to proceed?',
    header: `${buttonProps.value?.label} Confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: `${buttonProps.value?.label}`,
      severity: `${buttonProps.value?.severity}`,
      icon: `${buttonProps.value?.icon}`,
      loading: isLoading
    },
    accept: (): void => {
      const eventt: FormSubmitEvent<PatientHMOInformationFormState> = event as FormSubmitEvent<PatientHMOInformationFormState>
      const payload: PatientHMOInformationPayload = {
        company_name: eventt.values?.company_name,
        hmo_id: eventt.values?.hmo.id,
        hmo_type_id: eventt.values?.hmo_type.id,
        patient_id: patientId.value
      }

      if (isEditing.value) {
        editMutation(payload, {
          async onSuccess() {
            toggle()
            successToast(toast, "Editing Patient HMO Information success")
            await resetQueries()
          },
          async onError() {
            errorToast(toast, "Editing Patient HMO Information failed")
            await resetQueries()
          },
        })
        return
      }

      saveMutation(payload, {
        async onSuccess() {
          toggle()
          successToast(toast, "Saving Patient HMO Information success")
          event.reset()
          await resetQueries()
        },
        async onError() {
          errorToast(toast, "Saving Patient HMO Information failed")
          await resetQueries()
        },
      })
    }
  })
}

const onShow = async (): Promise<void> => {
  await refetch()

  if (!isEditing.value) return

  const initialValues: Partial<PatientHMOInformationFormState> = {
    company_name: patientHMOInformation.value?.company_name,
    hmo: hmos.value?.find(h => h.id === patientHMOInformation.value?.hmo_id),
    hmo_type: hmoTypes.value?.find(ht => ht.id === patientHMOInformation.value?.hmo_type_id)
  }
  form.value?.setValues(initialValues)
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

const resetQueries = async (): Promise<void> => {
  await queryClient.prefetchQuery({queryKey: [PatientTanstackKey.PATIENT_HMO_INFORMATION]})
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>
