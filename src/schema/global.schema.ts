import {z} from "zod";

const allowedFileMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'application/pdf'
])

const allowedFileExtensions = new Set(['png', 'jpg', 'jpeg', 'pdf'])

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
    .refine((file) => {
      const normalizedMimeType = file.type.trim().toLowerCase()
      if (allowedFileMimeTypes.has(normalizedMimeType)) {
        return true
      }

      // Some devices/browsers omit or mislabel MIME types for valid files.
      const extension = file.name.split('.').pop()?.trim().toLowerCase()
      return Boolean(extension && allowedFileExtensions.has(extension))
    }, {
      message: 'Only file extensions allowed is jpeg, jpg, png, and pdf'
    })
}

export const stringSchema = z.strictObject({
  name: z
    .string('name is required')
    .max(100, "Name must be 100 characters and below only")
})
export type StringSchemaFormState = z.infer<typeof stringSchema>
