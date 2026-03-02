import {z} from "zod";

export const regionSchema = z.object({
  id: z.number().min(1),
  name: z.string(),
  description: z.string()
}, "Required field")

export const provinceSchema = z.object({
  id: z.number().min(1),
  name: z.string(),
  region_id: z.number().min(1)
}, "Required field")

export const citySchema = provinceSchema.extend({
  province_id: z.number().min(1),
})

export const baranggaySchema = citySchema.extend({
  city_id: z.number().min(1)
})
