import type {AxiosResponse} from "axios";
import {fileServerTanstackService} from "@/services/file-server.tanstack.service.ts";
import type {QueryClient} from "@tanstack/vue-query";
import type {FSAPayload} from "@/models/file-server.ts";

export const previewAttachment = async (queryClient: QueryClient,
                                        payload: FSAPayload): Promise<void> => {

  const win: Window | null = window.open('', '_blank')
  if (!win) return

  const fetchedFile: AxiosResponse<Blob> | undefined = await fileServerTanstackService.retrieveFile(queryClient, payload)
  if (!fetchedFile) return

  win.location.href = URL.createObjectURL(fetchedFile?.data)
}
