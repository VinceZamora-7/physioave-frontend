import { useRouter } from "vue-router"

const LANDSCAPE_PRINT_STYLE_ID = "lgu-invoice-landscape-print-style"

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
    if (typeof document === "undefined") return

    if (document.getElementById(LANDSCAPE_PRINT_STYLE_ID)) {
      return
    }

    const style = document.createElement("style")
    style.id = LANDSCAPE_PRINT_STYLE_ID
    style.textContent = `
      @page {
        size: A4 landscape;
        margin: 8mm;
      }

      @media print {
        html,
        body {
          width: 297mm !important;
          min-width: 297mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }

        .lgu-invoice-page {
          background: #ffffff !important;
        }

        .lgu-invoice-sheet {
          width: 297mm !important;
          max-width: 297mm !important;
          min-height: 210mm !important;
          margin: 0 auto !important;
          padding: 5mm !important;
          border: none !important;
          box-shadow: none !important;
        }

        .table-wrap {
          width: 100% !important;
          overflow: visible !important;
        }

        .summary-table,
        .soa-table {
          width: 100% !important;
          min-width: 0 !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          font-size: 8.2px !important;
        }

        .summary-table th,
        .summary-table td,
        .soa-table th,
        .soa-table td {
          padding: 2px 3px !important;
          font-size: 8.2px !important;
          line-height: 1.1 !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }

        .details-grid {
          padding: 5px !important;
          gap: 8px !important;
          font-size: 9px !important;
          line-height: 1.2 !important;
          background: #ffffff !important;
          border: 1px solid #d31d6e !important;
        }

        .line {
          grid-template-columns: 95px minmax(0, 1fr) !important;
          gap: 4px !important;
        }

        .profile-details,
        .profile-card,
        .profile-status-banner,
        .payment-box,
        .approval {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .patient-total-row td,
        .grand-total-row td,
        .summary-table th,
        .soa-table th {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `

    document.head.appendChild(style)
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
