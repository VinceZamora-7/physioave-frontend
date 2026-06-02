import { useRouter } from "vue-router"

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
): string => formatLguStatus(resolveLguPatientProgramStatus(billingProgramStatus, dropoutStatus))

export const useLguInvoicePrintActions = (): {
  printPage: () => void
  goBack: () => void
  ensurePrintStyles: () => void
} => {
  const router = useRouter()

  const ensurePrintStyles = (): void => {
    // A5 print rules live in LguInvoiceLayout/lgu-invoice.shared.css.
  }

  const printPage = (): void => {
    ensurePrintStyles()

    requestAnimationFrame(() => {
      window.print()
    })
  }

  const goBack = (): void => router.back()

  return {
    printPage,
    goBack,
    ensurePrintStyles
  }
}
