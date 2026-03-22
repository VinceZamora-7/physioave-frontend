import { pamsAPI } from "@/utils/axios-interceptor.ts";
import { errorHandler } from "@/utils/error-handler.ts";

export interface HmoTechniqueRate {
  technique_id: number;
  technique_name: string;
  rate: number;
}

interface HmoTechniqueRateService {
  getAll(hmoId: number): Promise<HmoTechniqueRate[] | undefined>;
  upsert(hmoId: number, techniqueId: number, rate: number): Promise<void | undefined>;
  remove(hmoId: number, techniqueId: number): Promise<void | undefined>;
}

export const hmoTechniqueRateService: HmoTechniqueRateService = {
  async getAll(hmoId: number): Promise<HmoTechniqueRate[] | undefined> {
    try {
      const { data } = await pamsAPI.get<HmoTechniqueRate[]>(`/hmos/${hmoId}/technique-rates`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async upsert(hmoId: number, techniqueId: number, rate: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.put<void>(`/hmos/${hmoId}/technique-rates/${techniqueId}`, { rate });
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async remove(hmoId: number, techniqueId: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.delete<void>(`/hmos/${hmoId}/technique-rates/${techniqueId}`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  }
};
