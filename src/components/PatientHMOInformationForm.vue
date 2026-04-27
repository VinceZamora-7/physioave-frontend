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
  <div class="flex flex-col gap-1">

    <label
      for="relationship_to_principal"
      class="text-xs text-surface-500"
    >
      Relationship to Principal (First-degree only)
    </label>

    <Select
      id="relationship_to_principal"
      v-model="$field.value"
      :options="firstDegreeFamilyRelationshipOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Select relationship"
      :disabled="isReadOnly || isLoading"
      showClear
      filter
      class="w-full"
    />

    <Message
      v-if="$field?.invalid"
      severity="error"
      size="small"
      variant="simple"
    >
      {{ $field.error.message }}
    </Message>

  </div>
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

      <section class="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <div class="text-sm font-semibold text-surface-900">Previous HMO Details</div>
            <div class="text-xs text-surface-500">Older HMO details stay visible here whenever the current HMO record is changed.</div>
          </div>
          <span class="rounded-full bg-surface-200 px-2 py-1 text-xs font-medium text-surface-700">
            {{ patientHMOHistoryEntries.length }} {{ patientHMOHistoryEntries.length > 1 ? 'records' : 'record' }}
          </span>
        </div>

        <Message v-if="historyLoadError" severity="warn" size="small" variant="simple" class="mb-2">
          {{ historyLoadError }}
        </Message>

        <div v-if="!patientHMOHistoryEntries.length" class="rounded-lg border border-dashed border-surface-300 bg-white p-4 text-sm text-surface-600">
          No previous HMO records yet. Once this patient's current HMO details are updated, the older HMO details will appear here.
        </div>

        <div v-else class="max-h-72 space-y-3 overflow-y-auto pr-1">
          <article
            v-for="history in patientHMOHistoryEntries"
            :key="history.id"
            class="rounded-lg border border-surface-200 bg-white p-3 shadow-sm"
          >
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div class="font-medium text-surface-900">{{ history.hmo_name }} • {{ history.hmo_type_name }}</div>
              <span class="text-xs text-surface-500">Archived {{ formatDateTime(history.archived_at) }}</span>
            </div>
            <div class="grid grid-cols-1 gap-2 text-sm text-surface-700 md:grid-cols-2">
              <div><span class="font-medium text-surface-900">Company:</span> {{ history.company_name || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Member ID:</span> {{ history.member_id || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Card Number:</span> {{ history.card_number || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Plan Name:</span> {{ history.plan_name || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Principal:</span> {{ history.principal_name || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Relationship:</span> {{ history.relationship_to_principal || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Approval Code:</span> {{ history.approval_code || 'N/A' }}</div>
              <div><span class="font-medium text-surface-900">Validity:</span> {{ formatDateRange(history.validity_start_date, history.validity_end_date) }}</div>
              <div class="md:col-span-2"><span class="font-medium text-surface-900">Notes:</span> {{ history.notes || 'N/A' }}</div>
            </div>
          </article>
        </div>
      </section>

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
import {computed, nextTick, ref, toRefs, useTemplateRef, watch} from "vue";
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
import {patientHMOInformationService} from "@/services/patient-hmo-information.service.ts";
import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import type {
  PatientHMOInformation,
  PatientHMOInformationHistoryEntry,
  PatientHMOInformationPayload
} from "@/models/hmo-information.ts";
import Message from "primevue/message";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {PatientTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {ButtonProps} from "primevue/button";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import InputText from "primevue/inputtext";
import IftaLabel from "primevue/iftalabel";
import Select from "primevue/select";
import SelectButton from "primevue/selectbutton";
import {useQueryClient} from "@tanstack/vue-query";
import { getApiErrorMessage } from "@/utils/actionable-error.util";
import {errorToast, successToast} from "@/utils/toast.util.ts";
import { FIRST_DEGREE_FAMILY_RELATIONSHIPS } from "@/schema/patient.schema";

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()
const form = useTemplateRef<FormInstance>('form')

const emit = defineEmits<PatientHMOInformationFormEmits>()
const props = defineProps<PatientHMOInformationFormProps>()
const {patient, hmoTypes, hmos, isLoading: isParentLoading} = toRefs(props)

const isPatientHMOInformationLoading = useIsLoading(PatientTanstackKey.PATIENT_HMO_INFORMATION)
const isPatientHMOHistoryLoading = useIsLoading(PatientTanstackKey.PATIENT_HMO_INFORMATION_HISTORY)
const isLoading = computed<boolean>(() => isParentLoading.value || isPatientHMOInformationLoading.value || isPatientHMOHistoryLoading.value)

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
  data: patientHMOHistory,
} = patientHmoInformationTanstackService.getHistoryByPatientId(patientId)
const patientHMOHistoryEntries = ref<PatientHMOInformationHistoryEntry[]>(patientHMOHistory.value ?? [])
const historyLoadError = ref<string>("")

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

const firstDegreeFamilyRelationshipOptions = FIRST_DEGREE_FAMILY_RELATIONSHIPS.map((relationship) => ({
  label: relationship,
  value: relationship
}))

type FirstDegreeFamilyRelationship = typeof FIRST_DEGREE_FAMILY_RELATIONSHIPS[number]

const relationshipToPrincipalMap = new Map<string, FirstDegreeFamilyRelationship>(
  FIRST_DEGREE_FAMILY_RELATIONSHIPS.map((relationship) => [relationship.toLowerCase(), relationship])
)

const normalizeRelationshipToPrincipal = (value?: string | null): FirstDegreeFamilyRelationship | undefined => {
  if (!value) return undefined
  const normalizedKey = value.trim().toLowerCase()
  return relationshipToPrincipalMap.get(normalizedKey)
}

const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatDateRange = (start?: string | null, end?: string | null): string => {
  if (!start && !end) return 'N/A'
  return `${formatDate(start)} - ${formatDate(end)}`
}

const loadDialogData = async (): Promise<void> => {
  historyLoadError.value = ""
  await nextTick()

  if (patientId.value <= 0) {
    patientHMOHistoryEntries.value = []
    historyLoadError.value = "Unable to resolve selected patient for HMO history. Please close and reopen this dialog from the patient row."
    form.value?.setValues({})
    return
  }

  try {
    const [hmoResponse, historyResponse] = await Promise.all([
      refetch(),
      patientHMOInformationService.getHistoryByPatientId(patientId.value)
    ])

    patientHMOHistoryEntries.value = historyResponse ?? []

    if (!hmoResponse.data) {
      form.value?.setValues({})
      return
    }
  } catch (error: unknown) {
    patientHMOHistoryEntries.value = []
    historyLoadError.value = getApiErrorMessage(error, {
      baseMessage: "Unable to load HMO history",
      retryHint: "Please close and reopen this dialog."
    })
  }
}

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
          async onError(error: unknown) {
            errorToast(toast, getApiErrorMessage(error, {
              baseMessage: "Editing Patient HMO Information failed",
              permissionHint: "Patient access (Can Edit) in Role Access",
              invalidInputHint: "Some HMO fields are invalid. Review required fields and try again.",
              retryHint: "Please try again."
            }))
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
        async onError(error: unknown) {
          errorToast(toast, getApiErrorMessage(error, {
            baseMessage: "Saving Patient HMO Information failed",
            permissionHint: "Patient access (Can Edit) in Role Access",
            invalidInputHint: "Some HMO fields are invalid. Review required fields and try again.",
            retryHint: "Please try again."
          }))
          await resetQueries()
        },
      })
    }
  })
}

const onShow = async (): Promise<void> => {
  editEnabled.value = false
  await loadDialogData()

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
    relationship_to_principal: normalizeRelationshipToPrincipal(patientHMOInformation.value?.relationship_to_principal),
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

watch(patientId, () => {
  if (!visible.value) return
  void loadDialogData()
})

const resetQueries = async (): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: [PatientTanstackKey.PATIENT_HMO_INFORMATION]}),
    queryClient.invalidateQueries({queryKey: [PatientTanstackKey.PATIENT_HMO_INFORMATION_HISTORY]})
  ])
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>
