import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"

export type LguMachineRow = {
  id: number
  name: string
  price?: number
  is_active?: boolean
}

export async function listLguMachines(): Promise<Pageable<LguMachineRow>> {
  const { data } = await pamsAPI.get<Pageable<LguMachineRow>>("/lgu-machines", {
    params: { page: 1, size: 1000, name: "", status: "ALL" }
  })
  return data
}
