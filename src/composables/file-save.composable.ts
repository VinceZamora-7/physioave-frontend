import type {FileDTO, FSARequestPayload} from "@/models/file-server.ts";
import type {Ref} from "vue";
import type {Patient} from "@/models/patient.ts";
import {fileServerTanstackService} from "@/services/file-server.tanstack.service.ts";

export const useFileSave = (patient: Ref<Patient | undefined>) => {

  const {
    mutateAsync: fileSaveFn
  } = fileServerTanstackService.saveFile()

  const saveFn = async (attachment: File | undefined): Promise<FileDTO | undefined> => {
    if (!patient.value?.folder)
      throw new Error("Folder is required")

    if (!attachment)
      throw new Error("Attachment is required")

    const fsaRequestPayload: FSARequestPayload = {
      folder: patient.value.folder,
      file: attachment
    }

    return await fileSaveFn(fsaRequestPayload)
  }

  return {
    saveFn
  }
}
