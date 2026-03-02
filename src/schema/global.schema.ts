import {z} from "zod";

export const lookupSchema = (message: string = 'required field') => {
  return z.object({
    id: z.number().min(1),
    name: z.string().max(100)
  }, message)
}

export const fileSchema = (message: string = 'required field') => {
  return z.file(message)
    .min(1)
    .max(import.meta.env.VITE_MAX_FILE_SIZE_IN_BYTES)
    .mime(['image/png', 'image/jpeg', 'application/pdf'])
}

export const stringSchema = z.strictObject({
  name: z
    .string('name is required')
    .max(100, "Name must be 100 characters and below only")
})
export type StringSchemaFormState = z.infer<typeof stringSchema>
