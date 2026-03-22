<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '50rem' }"
    :header="header"
    modal
    :draggable="false"
    :resizable="false"
    @hide="resetAttachment"
  >
    <IftaLabel v-if="!selectedMedicalImagingProp">
      <Select
        v-model="selectedMedicalImaging"
        :fluid="true"
        :loading="isLoading"
        :options="medicalImagings"
        placeholder="Select Medical Imaging"
        :filter="true"
        :filter-fields="['name']"
      >
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center">
            <div>{{ slotProps.value?.name }}</div>
          </div>
          <span v-else>
            {{ slotProps.placeholder }}
          </span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <div>{{ slotProps.option?.name }}</div>
          </div>
        </template>
      </Select>
      <label for="medicalImaging">Medical Imaging</label>
    </IftaLabel>

    <div
      v-else
      class="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3"
    >
      <div class="text-xs uppercase tracking-wide opacity-70">Medical Imaging</div>
      <div class="font-medium">{{ selectedMedicalImagingProp.name }}</div>
    </div>

    <div class="card mt-4 flex flex-col items-center gap-6">
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
        @remove="resetAttachment"
      />

      <Image
        v-if="selectedAttachment?.type.startsWith('image/')"
        :src="previewAttachment"
        :alt="selectedAttachment?.name"
        width="250"
        :preview="true"
      />

      <div v-if="selectedAttachment?.type === 'application/pdf'">
        <span>Selected PDF attachment:</span>
        {{ selectedAttachment?.name }}
      </div>
    </div>

    <div class="mt-4 flex justify-end gap-2">
      <Button :loading="isLoading" label="Cancel" type="button" @click="onClose" />
      <Button
        :loading="isLoading"
        label="Add patient medical imaging"
        icon="pi pi-save"
        severity="info"
        :pt="ptModalPrimaryBtn"
        @click="onSubmit"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Image from "primevue/image"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import FileUpload from "primevue/fileupload"
import IftaLabel from "primevue/iftalabel"
import Select from "primevue/select"
import { useToast } from "primevue"
import { ref, toRefs, watch } from "vue"
import { useToggle } from "@vueuse/core"
import type {
  PatientMedicalImagingDialogFormEmits,
  PatientMedicalImagingDialogFormProps,
  PatientMedicalImagingDialogFormSubmitEvent
} from "@/components/patient.type.ts"
import { useFileSelect } from "@/composables/file-select.composable.ts"
import type { MedicalImaging } from "@/models/reference.ts"
import { fileSchema, lookupSchema } from "@/schema/global.schema.ts"
import { zodErrorHandler } from "@/utils/error-handler.ts"
import { acceptedFileTypes, type DialogExpose, maxFileSize } from "@/utils/global.type.ts"
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles"

const toast = useToast()

const emit = defineEmits<PatientMedicalImagingDialogFormEmits>()
const props = defineProps<PatientMedicalImagingDialogFormProps>()
const { selectedMedicalImaging: selectedMedicalImagingProp } = toRefs(props)

const [visible, toggle] = useToggle()
const selectedMedicalImaging = ref<MedicalImaging | undefined>()

const {
  selected: selectedAttachment,
  preview: previewAttachment,
  onSelect: onFileSelect,
  reset: resetAttachments
} = useFileSelect()

const resetAttachment = (): void => {
  selectedMedicalImaging.value = selectedMedicalImagingProp.value
  resetAttachments()
}

watch(selectedMedicalImagingProp, (value) => {
  selectedMedicalImaging.value = value
}, { immediate: true })

const onSubmit = async (): Promise<void> => {
  try {
    await Promise.all([
      lookupSchema("Medical imaging is required").parse(selectedMedicalImaging.value),
      fileSchema("Attachment is required").parse(selectedAttachment.value)
    ])

    const submitEvent: PatientMedicalImagingDialogFormSubmitEvent = {
      medicalImaging: selectedMedicalImaging.value,
      attachment: selectedAttachment.value
    }

    emit("onSubmit", submitEvent)
  } catch (error: unknown) {
    zodErrorHandler(toast, error)
  }
}

const onClose = (): void => {
  resetAttachment()
  toggle()
  emit("onClose")
}

defineExpose<DialogExpose>({
  toggleDialog: toggle
})
</script>
