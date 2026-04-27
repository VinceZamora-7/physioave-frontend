<template>
  <StaffForm ref="formRef" v-bind="staffFormProps" @on-submit="onSubmit" @specialty-created="emit('specialtyCreated')" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import { useQueryClient } from "@tanstack/vue-query"
import type { FormSubmitEvent } from "@primevue/forms"

import StaffForm from "@/features/staff/components/StaffForm.vue"
import type { Lookup } from "@/models/global.model"
import type { Role, SpecialtyTag } from "@/models/reference"
import type { APIError } from "@/utils/error-handler"
import type { Staff, StaffEditRequestPayload, StaffRequestBody } from "@/features/staff/types/staff"
import type { StaffFormProps } from "@/features/staff/types/staff.type"
import type { StaffFormState } from "@/features/staff/schema/staff.schema"

import { staffTanstackService } from "@/features/staff/queries/staff.tanstack.service"
import { createDraftService } from "@/services/draft.service"
import { IndexedDBKey } from "@/utils/keys/indexeddb-key"
import { StaffTanstackKey } from "@/utils/keys/tanstack-key"
import { errorToast, successToast } from "@/utils/toast.util"

const isPtProviderType = (providerType?: string | null): boolean =>
  providerType === "PHYSICAL_THERAPIST" || providerType === "PT_ASSISTANT" || providerType === "INTERN"

const props = defineProps<{
  roles: Role[]
  ptRoles: Role[]
  clinics: Lookup[]
  specialties: SpecialtyTag[]
  isLoading: boolean
  formMode?: "ADMIN" | "PT"
  canManageHighestRole?: boolean
  highestRoleIds?: number[]
}>()
const emit = defineEmits<{
  (e: "saved"): void
  (e: "specialtyCreated"): void
}>()

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const formRef = ref<InstanceType<typeof StaffForm> | null>(null)
const selectedStaff = ref<Staff | undefined>(undefined)
const draftService = createDraftService<StaffFormState>(IndexedDBKey.STAFF)

const { mutate: saveMutation, isPending: isSaving } = staffTanstackService.save()
const { mutate: editMutation, isPending: isEditing } = staffTanstackService.update()

const busy = computed(() => props.isLoading || isSaving.value || isEditing.value)

const staffFormProps = computed(
  () =>
    ({
      selectedStaff: selectedStaff.value,
      isLoading: busy.value,
      buttonProps: {
        label: selectedStaff.value
          ? `Edit ${selectedStaff.value.name}`
          : (props.formMode === "PT" ? "Save PT Staff" : "Save Admin Staff"),
        icon: selectedStaff.value ? "pi pi-pen-to-square" : "pi pi-save",
        severity: selectedStaff.value ? "success" : "info",
      },
      draftService,
      formMode: props.formMode ?? "ADMIN",
      canManageHighestRole: props.canManageHighestRole,
      highestRoleIds: props.highestRoleIds ?? [],
      roles: props.roles,
      ptRoles: props.ptRoles,
      clinics: props.clinics,
      specialties: props.specialties,
    }) satisfies StaffFormProps
)

const resetQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: [StaffTanstackKey.STAFFS] })
}

const closeDialog = () => {
  formRef.value?.toggleDialog()
}

const openCreate = () => {
  selectedStaff.value = undefined
  formRef.value?.toggleDialog()
}

const openEdit = (staff: Staff) => {
  selectedStaff.value = staff
  formRef.value?.toggleDialog()
}

defineExpose({ openCreate, openEdit })

const onSubmit = (event: FormSubmitEvent) => {
  confirm.require({
    message: "Are you sure you want to proceed?",
    header: `${staffFormProps.value.buttonProps.label} Confirmation`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
      loading: busy.value,
    },
    acceptProps: {
      label: staffFormProps.value.buttonProps.label,
      severity: staffFormProps.value.buttonProps.severity as any,
      icon: staffFormProps.value.buttonProps.icon,
      loading: busy.value,
    },
    accept: () => {
      const isPtMode = (props.formMode ?? "ADMIN") === "PT"
      const existingStaff = selectedStaff.value
      const editingDualRolePt = Boolean(
        isPtMode
        && existingStaff
        && !isPtProviderType(existingStaff.appointment_provider_type)
        && isPtProviderType(existingStaff.secondary_appointment_provider_type)
      )
      const selectedProviderRole = isPtMode
        ? event.values.role
        : (event.values.also_pt ? event.values.secondary_role : event.values.role)
      const body: StaffRequestBody = {
        name: event.values.name,
        email: event.values.email,
        clinic_id: event.values.clinic?.id,
        role_id: editingDualRolePt ? (existingStaff?.role_id ?? event.values.role?.id) : event.values.role?.id,
        can_view_all_branches: Boolean(event.values.can_view_all_branches),
        secondary_role_id: isPtMode
          ? (editingDualRolePt ? event.values.role?.id : undefined)
          : (event.values.also_pt ? event.values.secondary_role?.id : undefined),
        specialty_tag_id: selectedProviderRole?.appointment_provider_type !== "NONE" ? event.values.specialty?.id : undefined,
      }

      if (selectedStaff.value?.id) {
        const payload: StaffEditRequestPayload = { id: selectedStaff.value.id, ...body }
        editMutation(payload, {
          async onSuccess() {
            closeDialog()
            successToast(toast, "Edit success")
            event.reset()
            await resetQueries()
            emit("saved")
          },
          async onError(err: APIError) {
            errorToast(toast, `Edit failed ${err.message}`)
            await resetQueries()
          },
        })
        return
      }

      saveMutation(body, {
        async onSuccess() {
          closeDialog()
          successToast(toast, "Save success")
          event.reset()
          await Promise.all([resetQueries(), draftService.delete()])
          emit("saved")
        },
        async onError(err: APIError) {
          errorToast(toast, `Save failed ${err.message}`)
          await resetQueries()
        },
      })
    },
  })
}
</script>
