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
            :disabled="isReadOnly || isLoading"
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
            v-model="$field.value"
            :fluid="true"
            :loading="isLoading"
            :disabled="isReadOnly || isLoading"
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
            v-model="$field.value"
            :fluid="true"
            :loading="isLoading"
            :disabled="isReadOnly || isLoading"
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField v-slot="$field" name="member_id">
          <IftaLabel>
            <InputText id="member_id" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter member ID" />
            <label for="member_id">Member ID</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="card_number">
          <IftaLabel>
            <InputText id="card_number" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter card number" />
            <label for="card_number">Card Number</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="plan_name">
          <IftaLabel>
            <InputText id="plan_name" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter plan name" />
            <label for="plan_name">Plan Name</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="principal_name">
          <IftaLabel>
            <InputText id="principal_name" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter principal name" />
            <label for="principal_name">Principal Name</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="relationship_to_principal">
          <IftaLabel>
            <InputText id="relationship_to_principal" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter relationship" />
            <label for="relationship_to_principal">Relationship To Principal</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="approval_code">
          <IftaLabel>
            <InputText id="approval_code" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter approval/reference code" />
            <label for="approval_code">Approval Code</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="validity_start_date">
          <IftaLabel>
            <InputText id="validity_start_date" v-model="$field.value" :disabled="isReadOnly || isLoading" type="date" fluid />
            <label for="validity_start_date">Validity Start Date</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>

        <FormField v-slot="$field" name="validity_end_date">
          <IftaLabel>
            <InputText id="validity_end_date" v-model="$field.value" :disabled="isReadOnly || isLoading" type="date" fluid />
            <label for="validity_end_date">Validity End Date</label>
            <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
              {{ $field.error.message }}
            </Message>
          </IftaLabel>
        </FormField>
      </div>

      <FormField v-slot="$field" name="notes">
        <IftaLabel>
          <InputText id="notes" v-model="$field.value" :disabled="isReadOnly || isLoading" fluid placeholder="Enter processing notes" />
          <label for="notes">Processing Notes</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <div class="flex justify-end gap-2 mt-4">
        <Button :loading="isLoading" :label="isReadOnly ? 'Close' : 'Cancel'" type="button" @click="onClose"/>
        <Button
          v-if="isReadOnly"
          :loading="isLoading"
          label="Enable Edit"
          icon="pi pi-pen-to-square"
          severity="contrast"
          :pt="ptModalPrimaryBtn"
          type="button"
          @click="enableEdit"
        />
        <Button
          v-else
          :loading="isLoading"
          :label="buttonProps.label"
          :icon="buttonProps.icon"
          :severity="buttonProps.severity"
          :pt="ptModalPrimaryBtn"
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
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles";
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
const editEnabled = ref(false)
const isReadOnly = computed<boolean>(() => isEditing.value && !editEnabled.value)

const resolver = ref(zodResolver(patientHMOInformationSchema))

const onSubmit = (event: FormSubmitEvent) => {
  if (isReadOnly.value) return
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
        member_id: eventt.values?.member_id,
        card_number: eventt.values?.card_number,
        plan_name: eventt.values?.plan_name,
        principal_name: eventt.values?.principal_name,
        relationship_to_principal: eventt.values?.relationship_to_principal,
        approval_code: eventt.values?.approval_code,
        validity_start_date: eventt.values?.validity_start_date,
        validity_end_date: eventt.values?.validity_end_date,
        notes: eventt.values?.notes,
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
  editEnabled.value = false
  await refetch()

  if (!isEditing.value) {
    form.value?.setValues({})
    return
  }

  const initialValues: Partial<PatientHMOInformationFormState> = {
    company_name: patientHMOInformation.value?.company_name,
    member_id: patientHMOInformation.value?.member_id,
    card_number: patientHMOInformation.value?.card_number,
    plan_name: patientHMOInformation.value?.plan_name,
    principal_name: patientHMOInformation.value?.principal_name,
    relationship_to_principal: patientHMOInformation.value?.relationship_to_principal,
    approval_code: patientHMOInformation.value?.approval_code,
    validity_start_date: patientHMOInformation.value?.validity_start_date,
    validity_end_date: patientHMOInformation.value?.validity_end_date,
    notes: patientHMOInformation.value?.notes,
    hmo: hmos.value?.find(h => h.id === patientHMOInformation.value?.hmo_id),
    hmo_type: hmoTypes.value?.find(ht => ht.id === patientHMOInformation.value?.hmo_type_id)
  }
  form.value?.setValues(initialValues)
}

const enableEdit = (): void => {
  editEnabled.value = true
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
