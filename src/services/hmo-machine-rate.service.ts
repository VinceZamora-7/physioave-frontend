import { pamsAPI } from "@/utils/axios-interceptor.ts";
import { errorHandler } from "@/utils/error-handler.ts";

export interface HmoMachineRate {
  machine_id: number;
  machine_name: string;
  rate: number;
}

interface HmoMachineRateService {
  getAll(hmoId: number): Promise<HmoMachineRate[] | undefined>;
  upsert(hmoId: number, machineId: number, rate: number): Promise<void | undefined>;
  remove(hmoId: number, machineId: number): Promise<void | undefined>;
}

export const hmoMachineRateService: HmoMachineRateService = {
  async getAll(hmoId: number): Promise<HmoMachineRate[] | undefined> {
    try {
      const { data } = await pamsAPI.get<HmoMachineRate[]>(`/hmos/${hmoId}/machine-rates`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async upsert(hmoId: number, machineId: number, rate: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.put<void>(`/hmos/${hmoId}/machine-rates/${machineId}`, { rate });
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async remove(hmoId: number, machineId: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.delete<void>(`/hmos/${hmoId}/machine-rates/${machineId}`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  }
};
