<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @hide="onHide"
    @show="onShow"
  >
    <div v-if="patientAttachment?.file_id" class="space-y-4">
      <div class="flex justify-center items-center gap-4">
        <Button
          :loading="isBusy"
          icon="pi pi-file"
          severity="info"
          :pt="ptModalPrimaryBtn"
          v-tooltip="patientAttachment?.file_id"
          label="Preview attachment"
          @click="onPreview"
        />

        <Button
          :loading="isBusy"
          icon="pi pi-trash"
          severity="danger"
          label="Remove attachment"
          @click="onDelete"
        />
      </div>

      <div class="space-y-3">
        <div v-if="attachmentPreviewError" class="text-sm text-center text-red-500">
          {{ attachmentPreviewError }}
        </div>

        <div
          v-else-if="attachmentPreviewUrl"
          class="border border-surface-200 rounded-xl bg-surface-50 p-3 flex justify-center relative min-h-[12rem]"
        >
          <div v-if="isPreviewLoading" class="absolute inset-0 flex items-center justify-center text-sm opacity-70 bg-surface-50/80 rounded-xl">
            <span><i class="pi pi-spin pi-spinner mr-2" />Loading attachment preview...</span>
          </div>
          <img
            v-if="isImagePreview"
            :src="attachmentPreviewUrl"
            :alt="`${patient?.full_name ?? 'Patient'} attachment preview`"
            class="max-h-[28rem] max-w-full object-contain rounded-lg"
            @load="onAttachmentPreviewLoad"
            @error="onAttachmentPreviewError"
          />
          <iframe
            v-else-if="isPdfPreview"
            :src="attachmentPreviewUrl"
            class="h-[32rem] w-full rounded-lg bg-white"
            title="Attachment preview"
            @load="onAttachmentPreviewLoad"
          />
        </div>
      </div>
    </div>

    <div class="card flex flex-col items-center gap-6 mt-4" v-else>
      <FileUpload
        mode="basic"

        :max-file-size="maxFileSize"
        :invalid-file-size-message="'Max upload size is 3MB'"

        :accept="acceptedTypes"
        :invalid-file-type-message="invalidFileTypeMessage"

        :preview-width="70"
        :disabled="isBusy"
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
      <div v-if="isUploading" class="text-sm opacity-70">
        <i class="pi pi-spin pi-spinner mr-2" />
        Uploading attachment...
      </div>
      <div v-if="isUploading" class="w-full max-w-md space-y-1">
        <ProgressBar :value="uploadProgress" style="height: 0.5rem" />
        <p class="text-xs text-center opacity-70">{{ uploadProgress }}%</p>
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <Button :loading="isBusy" label="Cancel" type="button" @click="onClose"/>
      <Button
        :loading="isBusy"
        :label="header"
        icon="pi pi-save"
        severity="info"
        :pt="ptModalPrimaryBtn"
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
import ProgressBar from "primevue/progressbar";
import {useToggle} from "@vueuse/core";
import {fileSchema} from "@/schema/global.schema.ts";
import {errorHandler, type APIError, zodErrorHandler} from "@/utils/error-handler.ts";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import type {
  PatientAttachmentDialogFormEmits,
  PatientAttachmentDialogFormProps
} from "@/components/patient.type.ts";
import {computed, onBeforeUnmount, ref, toRefs} from "vue";
import {errorToast, successToast, warningToast} from "@/utils/toast.util.ts";
import {
  createPatientAttachmentTanstackService
} from "@/services/patient-attachment.tanstack.service.ts";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {PatientAttachmentTanstackKey} from "@/utils/keys/tanstack-key.ts";
import { getApiErrorMessage } from "@/utils/actionable-error.util";
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles";

const confirm = useConfirm()
const toast = useToast()
const [visible, toggle] = useToggle()

const emit = defineEmits<PatientAttachmentDialogFormEmits>()
const props = defineProps<PatientAttachmentDialogFormProps>()
const {patient, patientAttachmentTanstackKey} = toRefs(props)

const {
  selected: selectedAttachment,
  preview: previewAttachment,

  onSelect: onFileSelect,
  reset: resetAttachments
} = useFileSelect()

const isLoading = useIsLoading(patientAttachmentTanstackKey.value)

const attachmentTanstackService = createPatientAttachmentTanstackService(patientAttachmentTanstackKey.value)

const patientId = computed<number | undefined>(() => patient.value?.id)
const isValidIdAttachment = computed(() =>
  patientAttachmentTanstackKey.value === PatientAttachmentTanstackKey.VALID_ID ||
  patientAttachmentTanstackKey.value === PatientAttachmentTanstackKey.VALID_ID_BACK
)
const acceptedTypes = computed(() => isValidIdAttachment.value
  ? '.jpg,.jpeg,.png,image/jpeg,image/jpg,image/pjpeg,image/png'
  : acceptedFileTypes)
const invalidFileTypeMessage = computed(() => isValidIdAttachment.value
  ? 'Only file extensions allowed is jpeg, jpg, and png'
  : 'Only file extensions allowed is jpeg, jpg, png, and pdf')
const {
  data: patientAttachment,
  refetch
} = attachmentTanstackService.get(patientId)

const {
  mutate: deleteMutation
} = attachmentTanstackService.delete()

const isUploading = ref(false)
const uploadProgress = ref(0)
const isPreviewLoading = ref(false)
const attachmentPreviewError = ref<string | null>(null)
const attachmentPreviewUrl = ref<string | null>(null)
const attachmentPreviewMediaType = ref<string | null>(null)
const isBusy = computed(() => isLoading.value || isUploading.value || isPreviewLoading.value)
const isImagePreview = computed(() => Boolean(attachmentPreviewMediaType.value?.startsWith('image/')))
const isPdfPreview = computed(() => attachmentPreviewMediaType.value === 'application/pdf')

const revokeAttachmentPreview = (): void => {
  if (attachmentPreviewUrl.value) {
    URL.revokeObjectURL(attachmentPreviewUrl.value)
  }
  attachmentPreviewUrl.value = null
  attachmentPreviewError.value = null
  attachmentPreviewMediaType.value = null
}

const loadAttachmentPreview = async (force = false): Promise<void> => {
  if (!patient.value || !patientAttachment.value?.file_id) {
    revokeAttachmentPreview()
    return
  }

  if (attachmentPreviewUrl.value && !force) {
    return
  }

  isPreviewLoading.value = true
  revokeAttachmentPreview()
  attachmentPreviewError.value = null

  try {
    const response = await pamsAPI.get<Blob>(
      `/patients/${patient.value.id}/attachments/${patientAttachmentTanstackKey.value}/file?t=${Date.now()}`,
      {
        responseType: 'blob'
      }
    )

    attachmentPreviewMediaType.value = response.data.type || patientAttachment.value.media_type || null

    if (!isImagePreview.value && !isPdfPreview.value) {
      throw new Error('Only image and PDF attachment previews are supported in the modal')
    }

    attachmentPreviewUrl.value = URL.createObjectURL(response.data)
  } catch (error: unknown) {
    isPreviewLoading.value = false
    attachmentPreviewError.value = getApiErrorMessage(error, {
      baseMessage: "Failed to load the attachment preview",
      permissionHint: "Patient access (Read) in Role Access",
      retryHint: "Please try again."
    })
  }
}

const onAttachmentPreviewLoad = (): void => {
  isPreviewLoading.value = false
  attachmentPreviewError.value = null
}

const onAttachmentPreviewError = (): void => {
  isPreviewLoading.value = false
  attachmentPreviewError.value = 'Failed to load the attachment preview.'
  attachmentPreviewUrl.value = null
}

const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer()
  let binary = ''
  const chunkSize = 0x8000
  const view = new Uint8Array(bytes)

  for (let index = 0; index < view.length; index += chunkSize) {
    const chunk = view.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

const uploadAttachmentWithRetry = async (
  patientId: number,
  pathSegment: string,
  payload: { file_name: string; media_type: string; content_base64: string }
): Promise<void> => {
  const executeUpload = async (): Promise<void> => {
    await pamsAPI.post(
      `/patients/${patientId}/attachments/${pathSegment}/upload`,
      payload,
      {
        onUploadProgress: (event) => {
          if (!event.total) {
            uploadProgress.value = 95
            return
          }
          const percentage = Math.round((event.loaded / event.total) * 100)
          uploadProgress.value = Math.max(0, Math.min(100, percentage))
        }
      }
    )
  }

  await executeUpload()
}

const onDelete = async (): Promise<void> => {
  confirm.require({
    message: `Are you sure you want to remove this patient ${patient.value?.full_name} ${patientAttachmentTanstackKey.value}? This action cannot be undone.`,
    header: `Remove ${patientAttachmentTanstackKey.value} attachment`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isBusy.value
    },
    acceptProps: {
      label: 'Remove',
      severity: 'danger',
      icon: 'pi pi-trash',
      loading: isBusy.value
    },
    accept: async () => {
      if (!patient.value) {
        warningToast(toast, "No patient selected")
        return
      }

      deleteMutation(patient.value.id, {
        async onSuccess() {
          successToast(toast, 'Record successfully removed.')
          revokeAttachmentPreview()
          await refetch()
        },
        async onError(error: APIError) {
          errorToast(toast, getApiErrorMessage(error, {
            baseMessage: "Failed to remove patient attachment",
            permissionHint: "Patient access (Can Edit) in Role Access",
            retryHint: "Please try again."
          }))
        }
      })
    },
  })

}

const onPreview = async (): Promise<void> => {
  try {
    if (!patient.value) {
      warningToast(toast, "No patient selected")
      return
    }

    await refetch()
    await loadAttachmentPreview(true)
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, {
      baseMessage: "Failed to preview attachment",
      permissionHint: "Patient access (Read) in Role Access",
      retryHint: "Please try again."
    }))
  }
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
      loading: isBusy.value
    },
    acceptProps: {
      label: `Save patient ${patientAttachmentTanstackKey.value} attachment`,
      severity: `info`,
      icon: `pi pi-save`,
      loading: isBusy.value
    },
    accept: async () => {
      try {
        isUploading.value = true
        uploadProgress.value = 0

        if (!patient.value) {
          warningToast(toast, "No patient selected")
          uploadProgress.value = 0
          isUploading.value = false
          return
        }

        fileSchema("Attachment is required").parse(selectedAttachment.value)
        const attachment = selectedAttachment.value
        if (!attachment) {
          warningToast(toast, 'Attachment is required')
          uploadProgress.value = 0
          isUploading.value = false
          return
        }

        const normalizedMimeType = attachment.type.toLowerCase()
        const extension = attachment.name.split('.').pop()?.toLowerCase()
        const isAllowedValidIdImage = normalizedMimeType.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extension ?? '')
        const isAllowedGeneralAttachment = isAllowedValidIdImage || normalizedMimeType === 'application/pdf' || extension === 'pdf'

        if (isValidIdAttachment.value ? !isAllowedValidIdImage : !isAllowedGeneralAttachment) {
          warningToast(
            toast,
            isValidIdAttachment.value
              ? 'Only jpeg, jpg, and png files are allowed for Valid ID'
              : 'Only jpeg, jpg, png, and pdf files are allowed for this attachment'
          )
          uploadProgress.value = 0
          isUploading.value = false
          return
        }

        const contentBase64 = await fileToBase64(attachment)
        await uploadAttachmentWithRetry(patient.value.id, patientAttachmentTanstackKey.value, {
          file_name: attachment.name,
          media_type: attachment.type,
          content_base64: contentBase64
        })

        successToast(toast, 'Record successfully uploaded.')
        await refetch()
        await loadAttachmentPreview(true)
        resetAttachments()
        uploadProgress.value = 100
        isUploading.value = false
      } catch (error: unknown) {
        const zodLikeError = error as { issues?: unknown }
        if (error instanceof Error && 'issues' in zodLikeError) {
          zodErrorHandler(toast, error)
        } else {
          try {
            errorHandler(error)
          } catch (apiError: unknown) {
            errorToast(toast, getApiErrorMessage(apiError, {
              baseMessage: "Failed to upload patient attachment",
              permissionHint: "Patient access (Can Edit) in Role Access",
              invalidInputHint: "Attachment values are invalid. Check the selected file type and try again.",
              retryHint: "Please try again."
            }))
          }
        }
        uploadProgress.value = 0
        isUploading.value = false
      }
    }
  })
}

const onShow = async (): Promise<void> => {
  await refetch()

  if (patientAttachment.value?.file_id) {
    await loadAttachmentPreview(true)
  }
}

const onHide = (): void => {
  resetAttachments()
  revokeAttachmentPreview()
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})

onBeforeUnmount(() => {
  revokeAttachmentPreview()
})
</script>
