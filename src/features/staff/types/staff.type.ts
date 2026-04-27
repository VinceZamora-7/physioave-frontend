import type {FormSubmitEvent} from "@primevue/forms";
import type {ButtonProps} from "primevue/button";
import type {Staff} from "@/features/staff/types/staff";
import type {Role, SpecialtyTag} from "@/models/reference.ts";
import type {Lookup} from "@/models/global.model.ts";
import type {DraftService} from "@/services/draft.service.ts";
import type {StaffFormState} from "@/features/staff/schema/staff.schema";


export interface StaffFormEmits {
  onSubmit: [event: FormSubmitEvent]
  onClose: []
  specialtyCreated: []
}

export interface StaffFormProps {
  selectedStaff?: Staff
  isLoading: boolean
  buttonProps: ButtonProps
  draftService: DraftService<StaffFormState>
  formMode?: "ADMIN" | "PT"
  canManageHighestRole?: boolean
  highestRoleIds?: number[]

  roles: Role[]
  ptRoles: Role[]
  clinics: Lookup[]
  specialties: SpecialtyTag[]
}
