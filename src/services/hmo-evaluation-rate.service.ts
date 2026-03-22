import { pamsAPI } from "@/utils/axios-interceptor.ts";
import { errorHandler } from "@/utils/error-handler.ts";

export interface HmoEvaluationRate {
  evaluation_id: number;
  evaluation_name: string;
  rate: number;
}

interface HmoEvaluationRateService {
  getAll(hmoId: number): Promise<HmoEvaluationRate[] | undefined>;
  upsert(hmoId: number, evaluationId: number, rate: number): Promise<void | undefined>;
  remove(hmoId: number, evaluationId: number): Promise<void | undefined>;
}

export const hmoEvaluationRateService: HmoEvaluationRateService = {
  async getAll(hmoId: number): Promise<HmoEvaluationRate[] | undefined> {
    try {
      const { data } = await pamsAPI.get<HmoEvaluationRate[]>(`/hmos/${hmoId}/evaluation-rates`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async upsert(hmoId: number, evaluationId: number, rate: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.put<void>(`/hmos/${hmoId}/evaluation-rates/${evaluationId}`, { rate });
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async remove(hmoId: number, evaluationId: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.delete<void>(`/hmos/${hmoId}/evaluation-rates/${evaluationId}`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  }
};
