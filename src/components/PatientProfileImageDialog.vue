<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="`Patient Profile Image - ${patient?.full_name}`"
    modal
    :draggable="false"
    :resizable="false"
    @hide="onHide"
    @show="onShow"
  >
    <div class="space-y-4">
      <div v-if="previewError" class="text-sm text-center text-red-500">
        {{ previewError }}
      </div>

      <div
        v-if="previewUrl"
        class="border border-surface-200 rounded-xl bg-surface-50 p-3 flex justify-center items-center relative min-h-[20rem]"
      >
        <div v-if="isPreviewLoading" class="absolute inset-0 flex items-center justify-center text-sm opacity-70 bg-surface-50/80 rounded-xl">
          <span><i class="pi pi-spin pi-spinner mr-2" />Loading image...</span>
        </div>
        <img
          :src="previewUrl"
          :alt="`${patient?.full_name ?? 'Patient'} profile image`"
          class="max-h-[30rem] max-w-full object-contain rounded-lg"
          @load="onPreviewLoad"
          @error="onPreviewError"
        />
      </div>

      <div v-else class="rounded-xl border border-dashed border-surface-300 p-6 text-center text-sm opacity-70">
        No profile image uploaded yet.
      </div>

      <div class="card flex flex-col items-center gap-4 mt-2">
        <div class="flex w-full max-w-md gap-2">
          <Button
            label="Upload"
            icon="pi pi-upload"
            class="flex-1"
            :severity="inputMode === 'upload' ? 'info' : 'secondary'"
            outlined
            :disabled="isBusy || isUploading"
            @click="inputMode = 'upload'"
          />
          <Button
            label="Capture"
            icon="pi pi-camera"
            class="flex-1"
            :severity="inputMode === 'capture' ? 'info' : 'secondary'"
            outlined
            :disabled="isBusy || isUploading"
            @click="inputMode = 'capture'"
          />
        </div>

        <FileUpload
          v-if="inputMode === 'upload'"
          mode="basic"
          :max-file-size="maxFileSize"
          :invalid-file-size-message="'Max upload size is 5MB'"
          :accept="acceptedTypes"
          :invalid-file-type-message="invalidFileTypeMessage"
          :disabled="isBusy || isUploading"
          choose-label="Choose Profile Image"
          :custom-upload="true"
          :auto="false"
          :show-cancel-button="false"
          @select="onFileSelect"
          @remove="resetSelection"
        />

        <div v-else class="w-full max-w-md space-y-3">
          <video
            ref="cameraVideo"
            autoplay
            playsinline
            muted
            class="w-full rounded-xl border border-surface-200 bg-black"
          />
          <canvas ref="captureCanvas" class="hidden" />
          <div class="flex gap-2">
            <Button
              label="Start Camera"
              icon="pi pi-video"
              outlined
              class="flex-1"
              :disabled="cameraActive || isBusy || isUploading"
              @click="startCamera"
            />
            <Button
              label="Capture"
              icon="pi pi-camera"
              class="flex-1"
              :disabled="!cameraActive || isBusy || isUploading"
              @click="captureFromCamera"
            />
            <Button
              label="Stop"
              icon="pi pi-stop"
              severity="secondary"
              outlined
              class="flex-1"
              :disabled="!cameraActive"
              @click="stopCamera"
            />
          </div>
        </div>

        <Image
          v-if="selectedPreviewUrl"
          :src="selectedPreviewUrl"
          :alt="selectedFile?.name"
          width="220"
          :preview="true"
        />

        <div v-if="isUploading" class="w-full max-w-md space-y-1">
          <ProgressBar :value="uploadProgress" style="height: 0.5rem" />
          <p class="text-xs text-center opacity-70">{{ uploadProgress }}%</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button label="Close" text :disabled="isBusy || isUploading" @click="close" />
        <Button
          v-if="hasProfileImage"
          label="Remove"
          icon="pi pi-trash"
          severity="danger"
          outlined
          :loading="isBusy"
          :disabled="isUploading"
          @click="onDelete"
        />
        <Button
          label="Upload"
          icon="pi pi-save"
          severity="info"
          :loading="isUploading"
          :disabled="!selectedFile || isBusy"
          @click="onUpload"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Image from 'primevue/image'
import ProgressBar from 'primevue/progressbar'
import { useToast } from 'primevue/usetoast'
import type { Patient } from '@/features/patients/types/patient'
import { patientService } from '@/services/patient.service'
import { pamsAPI } from '@/utils/axios-interceptor.ts'
import { getApiErrorMessage } from '@/utils/actionable-error.util'
import { errorToast, successToast, warningToast } from '@/utils/toast.util.ts'
import { fileToBase64 } from '@/utils/file.util.ts'

const props = defineProps<{
  patient?: Patient | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const toast = useToast()

const visible = ref(false)
const isBusy = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const selectedFile = ref<File | null>(null)
const selectedPreviewUrl = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const isPreviewLoading = ref(false)
const previewError = ref<string | null>(null)
const hasProfileImage = ref(false)
const inputMode = ref<'upload' | 'capture'>('upload')
const cameraVideo = ref<HTMLVideoElement | null>(null)
const captureCanvas = ref<HTMLCanvasElement | null>(null)
const cameraStream = ref<MediaStream | null>(null)
const cameraActive = ref(false)

const maxFileSize = 5_242_880
const acceptedTypes = 'image/*'
const invalidFileTypeMessage = 'Please upload an image file (JPG, PNG, GIF, WebP)'

const profileImageFileUrl = computed(() => {
  if (!props.patient?.id) return ''
  return `/patients/${props.patient.id}/profile-image/file?t=${Date.now()}`
})

const open = (): void => {
  visible.value = true
}

const close = (): void => {
  visible.value = false
}

const revokePreview = (): void => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
}

const revokeSelectedPreview = (): void => {
  if (selectedPreviewUrl.value) {
    URL.revokeObjectURL(selectedPreviewUrl.value)
  }
  selectedPreviewUrl.value = null
}

const loadPreview = async (): Promise<void> => {
  if (!props.patient?.id) return
  isPreviewLoading.value = true
  previewError.value = null
  revokePreview()

  try {
    const response = await pamsAPI.get<Blob>(profileImageFileUrl.value, {
      responseType: 'blob'
    })
    previewUrl.value = URL.createObjectURL(response.data)
    hasProfileImage.value = true
  } catch (error: unknown) {
    hasProfileImage.value = false
    previewUrl.value = null
    previewError.value = null
  } finally {
    isPreviewLoading.value = false
  }
}

const onShow = async (): Promise<void> => {
  resetSelection()
  await loadPreview()
}

const onHide = (): void => {
  resetSelection()
  revokePreview()
  stopCamera()
}

const onFileSelect = (event: { files?: File[] }): void => {
  const file = event.files?.[0]
  if (!file) return
  selectedFile.value = file
  revokeSelectedPreview()
  selectedPreviewUrl.value = URL.createObjectURL(file)
}

const resetSelection = (): void => {
  selectedFile.value = null
  revokeSelectedPreview()
}

const startCamera = async (): Promise<void> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    warningToast(toast, 'Camera is not supported on this device/browser.')
    return
  }

  try {
    stopCamera()
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    cameraStream.value = stream
    if (cameraVideo.value) {
      cameraVideo.value.srcObject = stream
    }
    cameraActive.value = true
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, {
      baseMessage: 'Unable to access camera',
      retryHint: 'Check browser camera permissions and try again.'
    }))
  }
}

const stopCamera = (): void => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop())
  }
  cameraStream.value = null
  cameraActive.value = false
  if (cameraVideo.value) {
    cameraVideo.value.srcObject = null
  }
}

const captureFromCamera = (): void => {
  const video = cameraVideo.value
  const canvas = captureCanvas.value
  if (!video || !canvas || !cameraActive.value) {
    warningToast(toast, 'Start the camera first before capturing.')
    return
  }

  const width = video.videoWidth || 640
  const height = video.videoHeight || 480
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    warningToast(toast, 'Camera capture is not available right now.')
    return
  }
  context.drawImage(video, 0, 0, width, height)

  canvas.toBlob((blob) => {
    if (!blob) {
      warningToast(toast, 'Failed to capture photo.')
      return
    }

    const captured = new File([blob], `captured_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    })

    selectedFile.value = captured
    revokeSelectedPreview()
    selectedPreviewUrl.value = URL.createObjectURL(captured)
    successToast(toast, 'Photo captured. Click Upload to save it.')
  }, 'image/jpeg', 0.92)
}

const onUpload = async (): Promise<void> => {
  if (!props.patient?.id || !selectedFile.value) {
    warningToast(toast, 'Please select an image first.')
    return
  }

  try {
    isUploading.value = true
    uploadProgress.value = 15

    const file = selectedFile.value
    const contentBase64 = await fileToBase64(file)
    uploadProgress.value = 70

    await patientService.uploadProfileImage(props.patient.id, {
      file_name: file.name,
      media_type: file.type,
      content_base64: contentBase64
    })

    uploadProgress.value = 100
    successToast(toast, 'Profile image uploaded successfully.')
    resetSelection()
    await loadPreview()
    emit('updated')
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, {
      baseMessage: 'Failed to upload profile image',
      permissionHint: 'Patient access (Can Edit) in Role Access',
      retryHint: 'Please try again.'
    }))
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const onDelete = async (): Promise<void> => {
  if (!props.patient?.id) return
  try {
    isBusy.value = true
    await patientService.deleteProfileImage(props.patient.id)
    revokePreview()
    hasProfileImage.value = false
    successToast(toast, 'Profile image removed successfully.')
    emit('updated')
  } catch (error: unknown) {
    errorToast(toast, getApiErrorMessage(error, {
      baseMessage: 'Failed to remove profile image',
      permissionHint: 'Patient access (Can Edit) in Role Access',
      retryHint: 'Please try again.'
    }))
  } finally {
    isBusy.value = false
  }
}

const onPreviewLoad = (): void => {
  isPreviewLoading.value = false
}

const onPreviewError = (): void => {
  isPreviewLoading.value = false
  previewError.value = 'Failed to display image preview.'
}

defineExpose({
  open,
  close
})

onBeforeUnmount(() => {
  revokePreview()
  revokeSelectedPreview()
  stopCamera()
})
</script>
