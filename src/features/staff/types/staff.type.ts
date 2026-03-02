import type {FormSubmitEvent} from "@primevue/forms";
import type {ButtonProps} from "primevue";
import type {Staff} from "@/features/staff/types/staff";
import type {Role} from "@/models/reference.ts";
import type {Lookup} from "@/models/global.model.ts";
import type {DraftService} from "@/services/draft.service.ts";
import type {StaffFormState} from "@/features/staff/schema/staff.schema";


export interface StaffFormEmits {
  onSubmit: [event: FormSubmitEvent]
  onClose: []
}

export interface StaffFormProps {
  selectedStaff?: Staff
  isLoading: boolean
  buttonProps: ButtonProps
  draftService: DraftService<StaffFormState>

  roles: Role[]
  clinics: Lookup[]
}
