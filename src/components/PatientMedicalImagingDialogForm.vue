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
    <IftaLabel>
      <Select
        v-model="selectedMedicalImaging"
        :fluid="true"
        :loading="isLoading"
        :options="medicalImagings"
        placeholder="Select Medical Imaging"
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
      <label for="medicalImaging">Medical Imaging</label>
    </IftaLabel>

    <div class="card flex flex-col items-center gap-6 mt-4">
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
        label="Add patient medical imaging"
        icon="pi pi-save"
        severity="info"
        @click="onSubmit"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">

import Image from 'primevue/image';

import Dialog from "primevue/dialog";
import {useToggle} from "@vueuse/core";
import {acceptedFileTypes, type DialogExpose, maxFileSize} from "@/utils/global.type.ts";
import type {
  PatientMedicalImagingDialogFormEmits,
  PatientMedicalImagingDialogFormProps,
  PatientMedicalImagingDialogFormSubmitEvent
} from "@/components/patient.type.ts";
import {ref} from "vue";
import Select from "primevue/select";
import IftaLabel from "primevue/iftalabel";
import FileUpload from "primevue/fileupload";
import Button from "primevue/button";
import type {MedicalImaging} from "@/models/reference.ts";
import {fileSchema, lookupSchema} from "@/schema/global.schema.ts";
import {useToast} from "primevue";
import {zodErrorHandler} from "@/utils/error-handler.ts";
import {useFileSelect} from "@/composables/file-select.composable.ts";

const toast = useToast()

const emit = defineEmits<PatientMedicalImagingDialogFormEmits>()
defineProps<PatientMedicalImagingDialogFormProps>()

const [visible, toggle] = useToggle()

const selectedMedicalImaging = ref<MedicalImaging | undefined>()
const {
  selected: selectedAttachment,
  preview: previewAttachment,

  onSelect: onFileSelect,
  reset: resetAttachments
} = useFileSelect()

const resetAttachment = (): void => {
  selectedMedicalImaging.value = undefined
  resetAttachments()
}

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

    emit('onSubmit', submitEvent)
  } catch (error: unknown) {
    zodErrorHandler(toast, error)
  }
}

const onClose = (): void => {
  toggle()
  emit('onClose')
}

defineExpose<DialogExpose>({
  toggleDialog: toggle,
})
</script>
