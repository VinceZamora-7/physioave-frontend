import type {
  PatientHMOInformation,
  PatientHMOInformationHistoryEntry,
  PatientHMOInformationPayload,
  PatientHMOInformationRequest
} from "@/models/hmo-information.ts";
import {errorHandler} from "@/utils/error-handler.ts";
import {pamsAPI} from "@/utils/axios-interceptor.ts";
import {ResourceKey} from "@/utils/keys/resource-key.ts";
import type {AxiosResponse} from "axios";

interface PatientHMOInformationService {
  save(payload: PatientHMOInformationPayload): Promise<void | undefined>

  updateByPatientId(payload: PatientHMOInformationPayload): Promise<void | undefined>

  getByPatientId(patientId: number): Promise<PatientHMOInformation[]>

  getHistoryByPatientId(patientId: number): Promise<PatientHMOInformationHistoryEntry[]>
}

export const patientHMOInformationService: PatientHMOInformationService = {
  async getByPatientId(patientId: number): Promise<PatientHMOInformation[]> {
    try {
      const {data: response} = await pamsAPI.get<PatientHMOInformation[]>(`/${ResourceKey.PATIENTS}/${patientId}/${ResourceKey.HMO_INFORMATION}`)

      return response ?? []
    } catch (error: unknown) {
      errorHandler(error)
      return []
    }
  },

  async getHistoryByPatientId(patientId: number): Promise<PatientHMOInformationHistoryEntry[]> {
    try {
      const {data: response} = await pamsAPI.get<PatientHMOInformationHistoryEntry[]>(`/${ResourceKey.PATIENTS}/${patientId}/${ResourceKey.HMO_INFORMATION}/history`)
      return response ?? []
    } catch (error: unknown) {
      errorHandler(error)
      return []
    }
  },

  async save(payload: PatientHMOInformationPayload): Promise<void | undefined> {
    try {
      const {patient_id, ...body} = payload
      const {data: response} = await pamsAPI.post<void, AxiosResponse<void>, PatientHMOInformationRequest>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.HMO_INFORMATION}`, body)
      return response
    } catch (error: unknown) {
      errorHandler(error)
      return undefined
    }
  },

  async updateByPatientId(payload: PatientHMOInformationPayload): Promise<void | undefined> {
    try {
      const {patient_id, ...body} = payload
      const {data: response} = await pamsAPI.put<void, AxiosResponse<void>, PatientHMOInformationRequest>(`/${ResourceKey.PATIENTS}/${patient_id}/${ResourceKey.HMO_INFORMATION}`, body)
      return response
    } catch (error: unknown) {
      errorHandler(error)
      return undefined
    }
  }

}
