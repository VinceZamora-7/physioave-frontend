<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @hide="resetAttachments"
    @show="onShow"
  >
    <div v-if="patientAttachment?.file_id" class="flex justify-center items-center gap-4">
      <Button
        :loading="isLoading"
        icon="pi pi-file"
        severity="info"
        v-tooltip="patientAttachment?.file_id"
        label="Preview attachment"
        @click="filePreviewFn(patientAttachment?.file_id)"
      />

      <Button
        :loading="isLoading"
        icon="pi pi-trash"
        severity="danger"
        label="Remove attachment"
        @click="onDelete"
      />
    </div>

    <div class="card flex flex-col items-center gap-6 mt-4" v-else>
      <FileUpload
        mode="basic"

        :max-file-size="maxFileSize"
        :invalid-file-size-message="'Max upload size is 3MB'"

        :accept="acceptedFileTypes"
        :invalid-file-type-message="'Only file extensions allowed is jpeg, jpg, png, and pdf'"

        :preview-width="70"
        choose-label="Upload attachment"
        :custom-upload="true"
        :auto="true"
        :show-cancel-button="true"

        @select="onFileSelect"
        @remove="resetAttachments"
      />
      <Image v-if="selectedAttachment?.type.startsWith('image/')"
             :src="previewAttachment"
             :alt="selectedAttachment?.name"
             width="250"
             :preview="true"/>
      <div v-if="selectedAttachment?.type === 'application/pdf'">
        <span>
          Selected PDF attachment:
        </span>
        {{ selectedAttachment?.name }}
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <Button :loading="isLoading" label="Cancel" type="button" @click="onClose"/>
      <Button
        :loading="isLoading"
        :label="header"
        icon="pi pi-save"
        severity="info"
        @click="onSubmit"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">

import {useFileSelect} from "@/composables/file-select.composable.ts";
import {acceptedFileTypes, type DialogExpose, maxFileSize} from "@/utils/global.type.ts";
import Button from "primevue/button";
import Image from "primevue/image";
import Dialog from "primevue/dialog";
import FileUpload from "primevue/fileupload";
import {useToggle} from "@vueuse/core";
import {fileSchema} from "@/schema/global.schema.ts";
import {type APIError, zodErrorHandler} from "@/utils/error-handler.ts";
import {useConfirm, useToast} from "primevue";
import type {
  PatientAttachmentDialogFormEmits,
  PatientAttachmentDialogFormProps
} from "@/components/patient.type.ts";
import {computed, toRefs} from "vue";
import {useFileDelete} from "@/composables/file-delete.composable.ts";
import {useFileSave} from "@/composables/file-save.composable.ts";
import type {FileDTO} from "@/models/file-server.ts";
import {errorToast, successToast, warningToast} from "@/utils/toast.util.ts";
import type {PatientAttachmentPayload} from "@/models/patient-attachment.ts";
import {
  createPatientAttachmentTanstackService
} from "@/services/patient-attachment.tanstack.service.ts";
import {useFilePreview} from "@/composables/file-preview.composable.ts";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";

const confirm = useConfirm()
const toast = useToast()
const [visible, toggle] = useToggle()

const emit = defineEmits<PatientAttachmentDialogFormEmits>()
const props = defineProps<PatientAttachmentDialogFormProps>()
const {patient, patientAttachmentTanstackKey} = toRefs(props)

const {
  previewFn: filePreviewFn
} = useFilePreview(patient)

const {
  saveFn: fileSaveFn,
} = useFileSave(patient)

const {
  deleteFn: fileDeleteFn
} = useFileDelete(patient)

const {
  selected: selectedAttachment,
  preview: previewAttachment,

  onSelect: onFileSelect,
  reset: resetAttachments
} = useFileSelect()

const isLoading = useIsLoading(patientAttachmentTanstackKey.value)

const attachmentTanstackService = createPatientAttachmentTanstackService(patientAttachmentTanstackKey.value)

const patientId = computed<number | undefined>(() => patient.value?.id)
const {
  data: patientAttachment,
  refetch
} = attachmentTanstackService.get(patientId)

const {
  mutate: saveMutation
} = attachmentTanstackService.save()

const {
  mutate: deleteMutation
} = attachmentTanstackService.delete()

const onDelete = async (): Promise<void> => {
  confirm.require({
    message: `Are you sure you want to remove this patient ${patient.value?.full_name} ${patientAttachmentTanstackKey.value}? This action cannot be undone.`,
    header: `Remove ${patientAttachmentTanstackKey.value} attachment`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: 'Remove',
      severity: 'danger',
      icon: 'pi pi-trash',
      loading: isLoading
    },
    accept: async () => {
      if (!patient.value) {
        warningToast(toast, "No patient selected")
        return
      }

      deleteMutation(patient.value.id, {
        async onSuccess() {
          successToast(toast, 'Record successfully removed.')
          await Promise.all([
            fileDeleteFn(patientAttachment.value?.file_id),
            refetch()
          ])
        },
        async onError(error: APIError) {
          errorToast(toast, `Failed to uploaded record: ${error.message}`)
        }
      })
    },
  })

}

const onSubmit = (): void => {
  confirm.require({
    message: 'Are you sure you want to proceed?',
    header: `Save patient ${patientAttachmentTanstackKey.value} attachment confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: `Save patient ${patientAttachmentTanstackKey.value} attachment`,
      severity: `info`,
      icon: `pi pi-save`,
      loading: isLoading
    },
    accept: async () => {
      try {
        if (!patient.value) {
          warningToast(toast, "No patient selected")
          return
        }

        fileSchema("Attachment is required").parse(selectedAttachment.value)
        const fileDTO: FileDTO | undefined = await fileSaveFn(selectedAttachment.value)
        if (!fileDTO) {
          errorToast(toast, "File failed to be saved")
          return
        }

        const payload: PatientAttachmentPayload = {
          patient_id: patient.value.id,
          attachment: {
            file_id: fileDTO.file_id,
            checksum: fileDTO.checksum,
            media_type: fileDTO.media_type,
            extension: fileDTO.extension
          }
        }

        saveMutation(payload, {
          async onSuccess() {
            successToast(toast, 'Record successfully uploaded.')
            await refetch()
            resetAttachments()
          },
          async onError(error: Error) {
            errorToast(toast, `Failed to uploaded record: ${error.message}`)
            await fileDeleteFn(fileDTO.file_id)
          }
        })
      } catch (error: unknown) {
        zodErrorHandler(toast, error)
      }
    }
  })
}

const onShow = async (): Promise<void> => {
  await refetch()
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>
