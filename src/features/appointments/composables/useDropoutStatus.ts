import { computed, ref, type Ref } from "vue"
import { useQueryClient } from "@tanstack/vue-query"
import type { ToastServiceMethods } from "primevue/toastservice"
import {
  appointmentPhase1Service,
  type AppointmentDetail
} from "@/features/appointments/api/appointment-phase1.service"
import { appointmentContextTanstackService } from "@/features/appointments/queries/appointment-context.tanstack.service"
import { AppointmentTanstackKey } from "@/utils/keys/tanstack-key"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"

type DropoutStatus = "ACTIVE" | "DROPPED_OUT" | "RETURNED"

const normalizeDropoutStatus = (value?: string | null): DropoutStatus => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "DROPPED_OUT" || normalized === "RETURNED") return normalized
  return "ACTIVE"
}

const extractDropoutErrorMessage = (error: unknown): string =>
  getApiErrorMessage(error, {
    baseMessage: "Failed to update dropout status",
    permissionHint: "Appointment update access",
    invalidInputHint: "The selected appointment cannot be updated for dropout status right now.",
    notFoundHint: "The selected appointment was not found. Refresh and try again.",
    retryHint: "Please try again."
  })

export function useDropoutStatus(
  selectedDetail: Ref<AppointmentDetail | undefined>,
  toast: ToastServiceMethods,
  onUpdated?: (detail: AppointmentDetail) => void
) {
  const queryClient = useQueryClient()
  const dropoutLoading = ref(false)
  const dropoutStatusValue = computed<DropoutStatus>(() =>
    normalizeDropoutStatus(selectedDetail.value?.dropout_status)
  )

  const dropoutStatusLabel = computed(() => {
    if (dropoutStatusValue.value === "DROPPED_OUT") return "Dropped Out"
    if (dropoutStatusValue.value === "RETURNED") return "Returned"
    return "Active"
  })

  const dropoutStatusSeverity = computed<"success" | "warn" | "danger">(() => {
    if (dropoutStatusValue.value === "DROPPED_OUT") return "danger"
    if (dropoutStatusValue.value === "RETURNED") return "warn"
    return "success"
  })

  const dropoutToggleLabel = computed(() =>
    dropoutStatusValue.value === "DROPPED_OUT" ? "Mark as Returned" : "Mark as Drop-out"
  )

  const dropoutToggleIcon = computed(() =>
    dropoutStatusValue.value === "DROPPED_OUT" ? "pi pi-undo" : "pi pi-times-circle"
  )

  const dropoutToggleSeverity = computed<"success" | "danger">(() =>
    dropoutStatusValue.value === "DROPPED_OUT" ? "success" : "danger"
  )

  const dropoutStatusDescription = computed(() => {
    if (dropoutStatusValue.value === "DROPPED_OUT") {
      return "Consumed LGU credits are converted into an individual-pricing dropout claim. Month-end package claims are blocked until the patient returns."
    }
    if (dropoutStatusValue.value === "RETURNED") {
      return "Patient returned after previously dropping out."
    }
    return selectedDetail.value?.lgu_credit_summary
      ? "Patient is active. Month-end LGU claims can only be created from consumed credits with both PT and patient signatures."
      : "Patient is actively participating in the LGU program."
  })

  const updateDropoutStatus = async (nextStatus: DropoutStatus, reason?: string): Promise<void> => {
    const appointmentId = selectedDetail.value?.id
    if (!appointmentId) return

    dropoutLoading.value = true
    try {
      const trimmedReason = reason?.trim()
      const result = await appointmentPhase1Service.updateDropoutStatus(appointmentId, {
        dropout_status: nextStatus,
        reason: trimmedReason || undefined
      })
      const baseMessage = `Status updated to ${nextStatus === "DROPPED_OUT" ? "Dropped Out" : "Returned"}`
      const clearedCount = result?.cleared_appointment_ids?.length ?? 0
      successToast(
        toast,
        result?.dropout_billing_public_id
          ? `${baseMessage}. Dropout claim ${result.dropout_billing_public_id} was created.${clearedCount ? ` ${clearedCount} future appointment${clearedCount === 1 ? "" : "s"} cleared.` : ""}`
          : `${baseMessage}.${clearedCount ? ` ${clearedCount} future appointment${clearedCount === 1 ? "" : "s"} cleared.` : ""}`
      )

      await queryClient.invalidateQueries({ queryKey: [AppointmentTanstackKey.APPOINTMENT_CONTEXT, appointmentId] })
      const refreshed = await appointmentContextTanstackService.fetchContext(queryClient, appointmentId)
      onUpdated?.(refreshed.appointment)
    } catch (error: unknown) {
      errorToast(toast, extractDropoutErrorMessage(error))
    } finally {
      dropoutLoading.value = false
    }
  }

  const toggleDropoutStatus = async (reason?: string): Promise<void> => {
    const nextStatus = dropoutStatusValue.value === "DROPPED_OUT" ? "RETURNED" : "DROPPED_OUT"
    await updateDropoutStatus(nextStatus, reason)
  }

  return {
    dropoutLoading,
    dropoutStatusValue,
    dropoutStatusLabel,
    dropoutStatusSeverity,
    dropoutToggleLabel,
    dropoutToggleIcon,
    dropoutToggleSeverity,
    dropoutStatusDescription,
    updateDropoutStatus,
    toggleDropoutStatus
  }
}
