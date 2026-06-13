import {
  ensureSponsorInvoicePrintStyles,
  useSponsorInvoicePrintActions,
  type SponsorPrintOrientation,
  type SponsorPrintOrientationMode
} from "@/features/shared/invoices/sponsor-invoice.shared"

export type LguPrintOrientation = SponsorPrintOrientation
export type LguPrintOrientationMode = SponsorPrintOrientationMode

export const normalizeLguStatus = (value?: string | null): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")

export const isLguDropoutStatus = (value?: string | null): boolean => {
  const normalized = normalizeLguStatus(value)
  return normalized === "DROPPED_OUT" || normalized === "CROSS_MONTH_DROPPED_OUT"
}

export const isLguCompletedStatus = (value?: string | null): boolean => {
  const normalized = normalizeLguStatus(value)
  return normalized === "COMPLETED" || normalized === "ATTENDED"
}

export const formatLguStatus = (value?: string | null): string => {
  switch (normalizeLguStatus(value)) {
    case "COMPLETED":
    case "ATTENDED":
      return "Completed"
    case "DROPPED_OUT":
      return "Dropped Out"
    case "CROSS_MONTH_DROPPED_OUT":
      return "Cross Month Dropped Out"
    case "VOIDED_DROPOUT":
      return "Voided Dropout"
    case "PENDING":
      return "Pending"
    default:
      return String(value ?? "").trim() || "N/A"
  }
}

export const resolveLguPatientProgramStatus = (
  billingProgramStatus?: string | null,
  dropoutStatus?: string | null
): string => {
  const normalizedDropoutStatus = normalizeLguStatus(dropoutStatus)

  if (isLguDropoutStatus(normalizedDropoutStatus)) {
    return normalizedDropoutStatus
  }

  const normalizedBillingStatus = normalizeLguStatus(billingProgramStatus)
  if (normalizedBillingStatus) {
    return normalizedBillingStatus
  }

  return normalizedDropoutStatus
}

export const formatLguPatientProgramStatus = (
  billingProgramStatus?: string | null,
  dropoutStatus?: string | null
): string =>
  formatLguStatus(resolveLguPatientProgramStatus(billingProgramStatus, dropoutStatus))

export const ensureLguInvoicePrintStyles = ensureSponsorInvoicePrintStyles
export const useLguInvoicePrintActions = useSponsorInvoicePrintActions
