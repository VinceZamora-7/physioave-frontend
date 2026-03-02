import type {HMO} from "@/features/hmos/types/hmo";
import type {ButtonProps} from "primevue";
import type {FormSubmitEvent} from "@primevue/forms";
import type {StringSchemaFormState} from "@/schema/global.schema.ts";

export interface HMOFormProps {
  selectedHMO: HMO | undefined
  isLoading: boolean
  buttonProps: ButtonProps
}

export interface HMOFormEmits {
  onClose: []
  onSubmit: [event: FormSubmitEvent<StringSchemaFormState>]
}

