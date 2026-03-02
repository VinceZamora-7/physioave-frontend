import {z} from "zod";
import {lookupSchema} from "@/schema/global.schema.ts";

export const clinicSchema = z.strictObject({
  name: z
    .string('name is required')
    .max(100, "Name must be 100 characters and below only"),

  start_day: lookupSchema('start_day is required'),
  end_day: lookupSchema('end_day is required'),

  start_time: z.date("start_time is required"),
  end_time: z.date("end_time is required"),
})
export type ClinicFormState = z.infer<typeof clinicSchema>
