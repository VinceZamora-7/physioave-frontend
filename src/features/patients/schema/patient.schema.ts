import {z} from "zod";
import {lookupSchema} from "@/schema/global.schema.ts";
import type {ReferralChannel} from "@/models/reference.ts";
import {
  baranggaySchema,
  citySchema,
  provinceSchema,
  regionSchema
} from "@/schema/philippine-location.schema.ts";

const referralChannelSchema = z.enum(["ONLINE", "OFFLINE"])

export const patientSchema = z.strictObject({
  first_name: z.string("First name is required").trim().min(1, "First name is required").max(100, "First name must be 100 characters and below only"),
  middle_name: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().min(1, "Middle name is required").max(100).optional()),
  has_no_middle_name: z.boolean().optional().default(false),
  last_name: z.string("Last name is required").trim().min(1, "Last name is required").max(100, "Last name must be 100 characters and below only"),
  age: z.number("Age is required").min(1, "Must be minimum of 1").max(150, "Must be maximum of 150"),
  gender: lookupSchema('gender is required'),
  civil_status: lookupSchema('civil_status is required'),
  occupation: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  religion: z.preprocess(value => value ?? undefined, lookupSchema('religion is required').optional()),
  referral_channel: z.preprocess(value => value ?? undefined, referralChannelSchema.optional()),
  mode_of_referral: z.preprocess(value => value ?? undefined, lookupSchema('mode_of_referral is required').optional()),
  referred_by: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  referred_by_staff: z.preprocess(value => value ?? undefined, lookupSchema('Referring doctor is required').optional()),
  clinic: lookupSchema('clinic is required'),

  // Contact information
  phone_number: z.string("Phone number is required").length(11).regex(/^09\d*$/, "Must start with 09 and contain only digits"),
  email: z.preprocess(value => value === "" || value == null ? undefined : value, z.email().max(100, "Email must be 100 characters and below only").optional()),
  fb_link: z.preprocess(value => value === "" || value == null ? undefined : value, z.url("Must be a valid url").max(100, "Facebook link must be 100 characters and below only").optional()),

  // Address information
  region: z.preprocess(value => value ?? undefined, regionSchema),
  province: z.preprocess(value => value ?? undefined, provinceSchema),
  city: z.preprocess(value => value ?? undefined, citySchema),
  baranggay: z.preprocess(value => value ?? undefined, baranggaySchema),

  details: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(255).optional())
}).superRefine((value, ctx) => {
  if (!value.has_no_middle_name && !value.middle_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["middle_name"],
      message: "Middle name is required unless patient has no middle name."
    })
  }

  const selectedMode = value.mode_of_referral as ({name?: string; referral_channel?: ReferralChannel} | undefined)
  if (value.referral_channel && !selectedMode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mode_of_referral"],
      message: "Mode of referral is required when a referral category is selected."
    })
  }

  if (selectedMode && !value.referral_channel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["referral_channel"],
      message: "Referral category is required when a mode of referral is selected."
    })
  }

  if (selectedMode?.referral_channel && value.referral_channel && selectedMode.referral_channel !== value.referral_channel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mode_of_referral"],
      message: "Mode of referral does not belong to the selected referral category."
    })
  }

  if (String(selectedMode?.name ?? "").trim().toLowerCase() === "doctor referral" && !value.referred_by_staff && !value.referred_by) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["referred_by_staff"],
      message: "Referring doctor is required for doctor referrals."
    })
  }
})
export type PatientFormState = z.infer<typeof patientSchema>

export const FIRST_DEGREE_FAMILY_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister"
] as const

export const patientHMOInformationSchema = z.strictObject({
  company_name: z.string("Company name is required").max(100, "Company name must be 100 characters and below only"),
  member_id: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  card_number: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  plan_name: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  principal_name: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  relationship_to_principal: z.preprocess(
    value => value === "" || value == null ? undefined : value,
    z.enum(FIRST_DEGREE_FAMILY_RELATIONSHIPS, {
      error: "Relationship must be a first-degree family member"
    }).optional()
  ),
  approval_code: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(100).optional()),
  validity_start_date: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional()),
  validity_end_date: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional()),
  notes: z.preprocess(value => value === "" || value == null ? undefined : value, z.string().trim().max(255).optional()),
  hmo: lookupSchema('HMO is required'),
  hmo_type: lookupSchema('HMO Type is required')
})

export type PatientHMOInformationFormState = z.infer<typeof patientHMOInformationSchema>
