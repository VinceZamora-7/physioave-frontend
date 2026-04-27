import type {FormSubmitEvent} from "@primevue/forms";
import type {Clinic} from "@/features/clinics/types/clinic";
import type {ButtonProps} from "primevue/button";
import type {DraftService} from "@/services/draft.service.ts";
import type {ClinicFormState} from "@/features/clinics/schema/clinic.schema";

export interface ClinicFormProps {
  selectedClinic?: Clinic
  isLoading: boolean
  buttonProps: ButtonProps
  draftService: DraftService<ClinicFormState>
}

export interface ClinicFormEmits {
  onSubmit: [event: FormSubmitEvent]
  onClose: []
}
