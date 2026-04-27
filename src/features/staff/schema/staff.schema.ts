import {z} from "zod";
import {lookupSchema} from "@/schema/global.schema.ts";

export const staffSchema = z.strictObject({
  name: z.string('Name is required').max(255, "Name must be 255 characters and below only"),
  email: z.email("Enter a valid email address").max(100, "Email must be 100 characters and below only"),
  clinic: lookupSchema('clinic is required'),
  can_view_all_branches: z.boolean().optional(),
  also_pt: z.boolean().optional(),
  role: lookupSchema('role is required'),
  secondary_role: lookupSchema('PT role is required').optional(),
  specialty: lookupSchema('specialty is required').optional()
}).superRefine((value, context) => {
  if (value.also_pt && !value.secondary_role?.id) {
    context.addIssue({
      code: "custom",
      path: ["secondary_role"],
      message: "PT role is required"
    })
  }

  const activeProviderRole = value.also_pt ? value.secondary_role : value.role
  const requiresSpecialty = Boolean((activeProviderRole as {requires_specialty_tag?: boolean} | undefined)?.requires_specialty_tag)
  if (requiresSpecialty && !value.specialty?.id) {
    context.addIssue({
      code: "custom",
      path: ["specialty"],
      message: "specialty is required"
    })
  }
})
export type StaffFormState = z.infer<typeof staffSchema>
