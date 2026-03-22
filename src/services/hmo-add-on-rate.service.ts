import { pamsAPI } from "@/utils/axios-interceptor.ts";
import { errorHandler } from "@/utils/error-handler.ts";

export type HmoAddOnType = "ADD_ON_MACHINE" | "ADD_ON_TECHNIQUE" | "ADD_ON_HOME_SERVICE";

export interface HmoAddOnRate {
  id: number;
  add_on_type: HmoAddOnType;
  add_on_machine_id: number | null;
  add_on_technique_id: number | null;
  add_on_home_service_id: number | null;
  item_name: string | null;
  rate: number;
}

interface HmoAddOnRateService {
  getAll(hmoId: number): Promise<HmoAddOnRate[] | undefined>;
  upsert(hmoId: number, addOnType: HmoAddOnType, addOnId: number, rate: number): Promise<void | undefined>;
  remove(hmoId: number, addOnType: HmoAddOnType, addOnId: number): Promise<void | undefined>;
}

export const hmoAddOnRateService: HmoAddOnRateService = {
  async getAll(hmoId: number): Promise<HmoAddOnRate[] | undefined> {
    try {
      const { data } = await pamsAPI.get<HmoAddOnRate[]>(`/hmos/${hmoId}/add-on-rates`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async upsert(hmoId: number, addOnType: HmoAddOnType, addOnId: number, rate: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.put<void>(`/hmos/${hmoId}/add-on-rates/${addOnType}/${addOnId}`, { rate });
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  },

  async remove(hmoId: number, addOnType: HmoAddOnType, addOnId: number): Promise<void | undefined> {
    try {
      const { data } = await pamsAPI.delete<void>(`/hmos/${hmoId}/add-on-rates/${addOnType}/${addOnId}`);
      return data;
    } catch (error: unknown) {
      errorHandler(error);
    }
  }
};
