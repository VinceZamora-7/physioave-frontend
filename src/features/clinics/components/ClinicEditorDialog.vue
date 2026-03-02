<!-- src/features/clinics/components/ClinicEditorDialog.vue -->
<template>
  <ClinicForm
    ref="formRef"
    v-bind="clinicFormProps"
    @on-submit="onSubmit"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useConfirm, useToast } from "primevue"
import { DateTime } from "luxon"
import { useQueryClient } from "@tanstack/vue-query"

import ClinicForm from "@/features/clinics/components/ClinicForm.vue"
import type { FormSubmitEvent } from "@primevue/forms"
import type { Clinic, ClinicEditRequestPayload, ClinicRequestBody } from "@/features/clinics/types/clinic"
import type { ClinicFormProps } from "@/features/clinics/types/clinic.type"
import type { ClinicFormState } from "@/features/clinics/schema/clinic.schema"
import type { APIError } from "@/utils/error-handler"

import { clinicTanstackService } from "@/features/clinics/queries/clinic.tanstack.service"
import { createDraftService } from "@/services/draft.service"
import { IndexedDBKey } from "@/utils/keys/indexeddb-key"
import { ClinicTanstackKey } from "@/utils/keys/tanstack-key"
import { errorToast, successToast } from "@/utils/toast.util"

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const formRef = ref<InstanceType<typeof ClinicForm> | null>(null)

const selectedClinic = ref<Clinic | undefined>(undefined)
const draftService = createDraftService<ClinicFormState>(IndexedDBKey.CLINIC)

const { mutate: saveMutation, isPending: isSaving } = clinicTanstackService.save()
const { mutate: editMutation, isPending: isEditing } = clinicTanstackService.update()

const busy = computed(() => isSaving.value || isEditing.value)

const clinicFormProps = computed(
  () =>
    ({
      selectedClinic: selectedClinic.value,
      isLoading: busy.value,
      buttonProps: {
        label: selectedClinic.value ? `Edit ${selectedClinic.value.name}` : "Save Clinic",
        icon: selectedClinic.value ? "pi pi-pen-to-square" : "pi pi-save",
        severity: selectedClinic.value ? "success" : "info",
      },
      draftService,
    }) satisfies ClinicFormProps
)

const resetQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: [ClinicTanstackKey.CLINICS] })
}

const closeDialog = () => {
  formRef.value?.toggleDialog()
}

const openCreate = () => {
  selectedClinic.value = undefined
  formRef.value?.toggleDialog()
}

const openEdit = (clinic: Clinic) => {
  selectedClinic.value = clinic
  formRef.value?.toggleDialog()
}

defineExpose({ openCreate, openEdit })

const onSubmit = (event: FormSubmitEvent) => {
  confirm.require({
    message: "Are you sure you want to proceed?",
    header: `${clinicFormProps.value.buttonProps.label} Confirmation`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: busy.value, // ✅ boolean
    },
    acceptProps: {
      label: clinicFormProps.value.buttonProps.label,
      severity: clinicFormProps.value.buttonProps.severity as any,
      icon: clinicFormProps.value.buttonProps.icon,
      loading: busy.value, // ✅ boolean
    },
    accept: () => {
      const body: ClinicRequestBody = {
        name: event.values.name,
        start_day: event.values.start_day?.id,
        end_day: event.values.end_day?.id,
        start_time: DateTime.fromJSDate(event.values.start_time).toFormat("HH:mm:ss"),
        end_time: DateTime.fromJSDate(event.values.end_time).toFormat("HH:mm:ss"),
      }

      if (selectedClinic.value?.id) {
        const payload: ClinicEditRequestPayload = { id: selectedClinic.value.id, ...body }
        editMutation(payload, {
          async onSuccess() {
            closeDialog()
            successToast(toast, "Edit success")
            await resetQueries()
          },
          async onError(err: APIError) {
            errorToast(toast, `Edit failed ${err.message}`)
            await resetQueries()
          },
        })
        return
      }

      saveMutation(body, {
        async onSuccess() {
          closeDialog()
          successToast(toast, "Save success")
          await Promise.all([resetQueries(), draftService.delete()])
        },
        async onError(err: APIError) {
          errorToast(toast, `Save failed ${err.message}`)
          await resetQueries()
        },
      })
    },
  })
}
</script>
