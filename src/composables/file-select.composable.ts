import {ref, watch} from "vue";
import type {FileUploadSelectEvent} from "primevue/fileupload";

export const useFileSelect = () => {
  const selected = ref<File | undefined>()
  const preview = ref<string | undefined>()

  const onSelect = (event: FileUploadSelectEvent): void => {
    const file: File | undefined = event.files?.[0] ?? undefined;
    selected.value = file
    if (file) preview.value = URL.createObjectURL(file)
  }

  const reset = (): void => {
    if (preview.value) URL.revokeObjectURL(preview.value)

    selected.value = undefined
    preview.value = undefined
  }

  watch(selected, (_: File | undefined, oldFile: File | undefined) => {
    if (oldFile && preview.value) URL.revokeObjectURL(preview.value)
  })

  return {
    selected,
    preview,

    onSelect,
    reset
  }
}
