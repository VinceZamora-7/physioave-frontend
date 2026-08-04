import { pamsAPI } from "@/utils/axios-interceptor"

export interface ServiceChargeSetting {
  rate: number
}

let cachedServiceChargeRate = 3.5

export const systemSettingsService = {
  getCachedServiceChargeRate(): number {
    return cachedServiceChargeRate
  },

  async getServiceCharge(): Promise<ServiceChargeSetting> {
    const { data } = await pamsAPI.get<ServiceChargeSetting>("/system-settings/service-charge")
    cachedServiceChargeRate = Number(data.rate ?? 3.5)
    return { rate: cachedServiceChargeRate }
  },

  async updateServiceCharge(rate: number): Promise<ServiceChargeSetting> {
    const { data } = await pamsAPI.put<ServiceChargeSetting>("/system-settings/service-charge", { rate })
    cachedServiceChargeRate = Number(data.rate ?? rate)
    return { rate: cachedServiceChargeRate }
  }
}
