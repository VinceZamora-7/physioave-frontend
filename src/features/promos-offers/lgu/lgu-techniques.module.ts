import { pamsAPI } from "@/utils/axios-interceptor"
import type { Pageable } from "@/models/paging"

export type LguTechniqueRow = {
  id: number
  name: string
  price?: number
  is_active?: boolean
}

export async function listLguTechniques(): Promise<Pageable<LguTechniqueRow>> {
  const { data } = await pamsAPI.get<Pageable<LguTechniqueRow>>("/lgu-techniques", {
    params: { page: 1, size: 1000, name: "", status: "ALL" }
  })
  return data
}
