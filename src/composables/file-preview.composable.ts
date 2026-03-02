import type {FSAPayload} from "@/models/file-server.ts";
import {previewAttachment} from "@/utils/preview-attachment.util.ts";
import type {Ref} from "vue";
import type {Patient} from "@/models/patient.ts";
import type {UUID} from "@/utils/global.type.ts";
import {useQueryClient} from "@tanstack/vue-query";

export const useFilePreview = (patient: Ref<Patient | undefined>) => {
  const queryClient = useQueryClient()

  const previewFn = async (file: UUID | undefined): Promise<void> => {
    if (!patient.value?.folder)
      throw new Error("Folder not exists")

    if (!file)
      throw new Error("No file provided")

    const payload: FSAPayload = {
      folder: patient.value.folder,
      file: file
    }

    await previewAttachment(queryClient, payload)
  }

  return {
    previewFn
  }
}
