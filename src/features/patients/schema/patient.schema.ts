import {z} from "zod";
import {lookupSchema} from "@/schema/global.schema.ts";
import {
  baranggaySchema,
  citySchema,
  provinceSchema,
  regionSchema
} from "@/schema/philippine-location.schema.ts";

export const patientSchema = z.strictObject({
  first_name: z.string("First name is required").max(100, "First name must be 100 characters and below only"),
  middle_name: z.preprocess(value => value === "" ? undefined : value, z.string().max(100).optional()),
  last_name: z.string("Last name is required").max(100, "Last name must be 100 characters and below only"),
  age: z.number("Age is required").min(1, "Must be minimum of 1").max(150, "Must be maximum of 150"),
  gender: lookupSchema('gender is required'),
  civil_status: lookupSchema('civil_status is required'),
  occupation: z.preprocess(value => value === "" ? undefined : value, z.string().max(100).optional()),
  religion: lookupSchema('religion is required'),
  mode_of_referral: z.preprocess(value => value ?? undefined, lookupSchema('mode_of_referral is required').optional()),
  referred_by: z.preprocess(value => value === "" ? undefined : value, z.string().max(100).optional()),
  clinic: lookupSchema('clinic is required'),

  // Contact information
  phone_number: z.string("Phone number is required").length(11).regex(/^09\d*$/, "Must start with 09 and contain only digits"),
  email: z.preprocess(value => value === "" ? undefined : value, z.email().max(100, "Email must be 100 characters and below only").optional()),
  fb_link: z.preprocess(value => value === "" ? undefined : value, z.url("Must be a valid url").max(100, "Facebook link must be 100 characters and below only").optional()),

  // Address information
  region: z.preprocess(value => value ?? undefined, regionSchema.optional()),
  province: z.preprocess(value => value ?? undefined, provinceSchema.optional()),
  city: z.preprocess(value => value ?? undefined, citySchema.optional()),
  baranggay: z.preprocess(value => value ?? undefined, baranggaySchema.optional()),

  details: z.preprocess(value => value === "" ? undefined : value, z.string().max(255).optional())
})
export type PatientFormState = z.infer<typeof patientSchema>

export const patientHMOInformationSchema = z.strictObject({
  company_name: z.string("Company name is required").max(100, "Company name must be 100 characters and below only"),
  hmo: lookupSchema('HMO is required'),
  hmo_type: lookupSchema('HMO Type is required')
})

export type PatientHMOInformationFormState = z.infer<typeof patientHMOInformationSchema>
