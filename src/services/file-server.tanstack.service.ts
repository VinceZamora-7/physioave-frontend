import {type QueryClient, useMutation} from "@tanstack/vue-query";
import {type UUID} from "@/utils/global.type.ts";
import {fileServerService} from "@/services/file-server.service.ts";
import type {FileDTO, FSAPayload, FSARequestPayload} from "@/models/file-server.ts";
import {FileServerTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {AxiosResponse} from "axios";

export const fileServerTanstackService = {
  saveFolder(key: FileServerTanstackKey = FileServerTanstackKey.FSA) {
    return useMutation<UUID | undefined, Error>({
      mutationKey: [key],
      mutationFn: fileServerService.saveFolder
    })
  },

  deleteFolder(key: FileServerTanstackKey = FileServerTanstackKey.FSA) {
    return useMutation<void | undefined, Error, UUID>({
      mutationKey: [key],
      mutationFn: fileServerService.deleteFolder
    })
  },

  saveFile(key: FileServerTanstackKey = FileServerTanstackKey.FSA) {
    return useMutation<FileDTO | undefined, Error, FSARequestPayload>({
      mutationKey: [key],
      mutationFn: fileServerService.saveFile
    })
  },

  deleteFile(key: FileServerTanstackKey = FileServerTanstackKey.FSA) {
    return useMutation<void | undefined, Error, FSAPayload>({
      mutationKey: [key],
      mutationFn: fileServerService.deleteFile
    })
  },

  retrieveFile(
    queryClient: QueryClient,
    payload: FSAPayload,
    key: FileServerTanstackKey = FileServerTanstackKey.FSA_RETRIEVE_FILE
  ) {
    return queryClient.fetchQuery<AxiosResponse<Blob> | undefined>({
      queryKey: [key],
      queryFn: () => fileServerService.retrieveFile(payload),
      retry: 2
    })
  },

  verifyFile(
    queryClient: QueryClient,
    payload: FSAPayload,
    key: FileServerTanstackKey = FileServerTanstackKey.FSA_VERIFY_FILE
  ) {
    return queryClient.fetchQuery<boolean | undefined>({
      queryKey: [key],
      queryFn: () => fileServerService.verifyFile(payload)
    })
  }
}
