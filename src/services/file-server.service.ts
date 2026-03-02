import type {UUID} from "@/utils/global.type.ts";
import type {FileDTO, FSAPayload, FSARequestPayload} from "@/models/file-server.ts";
import {fsaAPI} from "@/utils/axios-interceptor.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import type {AxiosResponse} from "axios";

interface FileService {
  saveFolder(): Promise<UUID | undefined>

  saveFile(payload: FSARequestPayload): Promise<FileDTO | undefined>

  retrieveFile(payload: FSAPayload): Promise<AxiosResponse<Blob> | undefined>

  verifyFile(payload: FSAPayload): Promise<boolean | undefined>

  deleteFile(payload: FSAPayload): Promise<void | undefined>
}

interface FolderService {
  deleteFolder(folder: UUID): Promise<void | undefined>

  saveFolder(): Promise<UUID | undefined>
}

export const fileServerService: FileService & FolderService = {
  async deleteFile(payload: FSAPayload): Promise<void | undefined> {
    try {
      const {folder, file} = payload
      const {data: response} = await fsaAPI.delete<void>(`/folders/${folder}/files/${file}`);
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async deleteFolder(folder: UUID): Promise<void | undefined> {
    try {
      const {data: response} = await fsaAPI.delete<void>(`/folders/${folder}`)
      return response
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async retrieveFile(payload: FSAPayload): Promise<AxiosResponse<Blob> | undefined> {
    try {
      const {folder, file} = payload
      return await fsaAPI.get(`/folders/${folder}/files/${file}`, {
        responseType: 'blob'
      })
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async saveFolder(): Promise<UUID | undefined> {
    try {
      const {data: folderId} = await fsaAPI.post<UUID>(`/folders`)

      return folderId
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async saveFile(payload: FSARequestPayload): Promise<FileDTO | undefined> {
    try {
      const {folder, file} = payload

      const formData = new FormData()
      formData.append("file", file)

      const {data: fileDTO} = await fsaAPI.post<FileDTO, AxiosResponse<FileDTO>, FormData>(`/folders/${folder}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return fileDTO
    } catch (error: unknown) {
      errorHandler(error)
    }
  },

  async verifyFile(payload: FSAPayload): Promise<boolean | undefined> {
    try {
      const {folder, file} = payload
      const {data: isChecksumMatched} = await fsaAPI.get<boolean>(`/folders/${folder}/files/${file}/verify`)

      return isChecksumMatched
    } catch (error: unknown) {
      errorHandler(error)
    }
  }
}
