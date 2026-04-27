import type {ButtonProps} from "primevue/button";
import type {FormSubmitEvent} from "@primevue/forms";
import type {OfferFormState} from "@/features/offers/schema/offer.schema";

export interface OfferFormProps<T> {
  selectedOffer: T | undefined
  isLoading: boolean
  buttonProps: ButtonProps
}

export interface OfferFormEmits {
  onClose: []
  onSubmit: [event: FormSubmitEvent<OfferFormState>]
}

