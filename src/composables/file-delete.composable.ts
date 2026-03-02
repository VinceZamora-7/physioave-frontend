import type {UUID} from "@/utils/global.type.ts";
import type {FSAPayload} from "@/models/file-server.ts";
import {fileServerTanstackService} from "@/services/file-server.tanstack.service.ts";
import type {Ref} from "vue";
import type {Patient} from "@/models/patient.ts";

export const useFileDelete = (patient: Ref<Patient | undefined>) => {
  const {
    mutateAsync: fileDeleteMutation
  } = fileServerTanstackService.deleteFile()

  const deleteFn = async (fileId: UUID | undefined): Promise<void> => {
    if (!patient.value?.folder)
      throw new Error("Folder not exists")

    if (!fileId) throw new Error("File id not exist")

    const fsaPayload: FSAPayload = {
      folder: patient.value.folder,
      file: fileId
    }

    await fileDeleteMutation(fsaPayload)
  }

  return {
    deleteFn
  }
}
