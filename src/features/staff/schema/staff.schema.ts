import {z} from "zod";
import {lookupSchema} from "@/schema/global.schema.ts";

export const staffSchema = z.strictObject({
  name: z.string('Name is required').max(255, "Name must be 255 characters and below only"),
  email: z.email().endsWith("@gmail.com").max(100, "Email must be 100 characters and below only"),
  clinic: lookupSchema('clinic is required'),
  role: lookupSchema('role is required')
})
export type StaffFormState = z.infer<typeof staffSchema>
