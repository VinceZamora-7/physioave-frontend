import {z} from "zod";

export const offerSchema = z.strictObject({
  name: z
    .string('name is required')
    .max(100, "Name must be 100 characters and below only"),
  price: z.number('price is required').positive('price must be positive'),
})
export type OfferFormState = z.infer<typeof offerSchema>
