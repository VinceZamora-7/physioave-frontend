import { useRouter } from "vue-router"

const SPONSOR_INVOICE_PRINT_STYLE_ID = "sponsor-invoice-auto-print-style"

export type SponsorPrintOrientation = "portrait" | "landscape"
export type SponsorPrintOrientationMode = SponsorPrintOrientation | "auto"

const resolveAutoPrintOrientation = (): SponsorPrintOrientation => {
  return "portrait"
}

const applyPrintOrientationClass = (orientation: SponsorPrintOrientation): void => {
  if (typeof document === "undefined") return

  const root = document.documentElement

  root.classList.remove("lgu-print-portrait", "lgu-print-landscape")
  root.classList.add(`lgu-print-${orientation}`)
  root.dataset.lguPrintOrientation = orientation
}

const resetPrintOrientationClass = (): void => {
  if (typeof document === "undefined") return

  const root = document.documentElement

  root.classList.remove("lgu-print-portrait", "lgu-print-landscape")
  delete root.dataset.lguPrintOrientation
}

const buildPrintStyles = (orientation: SponsorPrintOrientation): string => `
  @page {
    size: ${orientation};
    margin: 8mm;
  }

  @media print {
    *,
    *::before,
    *::after {
      box-sizing: border-box !important;
    }

    html,
    body,
    #app {
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .no-print,
    .print-hidden,
    button,
    [data-print-hidden="true"] {
      display: none !important;
    }

    .lgu-invoice-page {
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    .lgu-invoice-sheet {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 auto !important;
      padding: 5mm !important;
      overflow: visible !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      transform: none !important;
      break-after: page !important;
      page-break-after: always !important;
    }

    .lgu-invoice-sheet:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    .table-wrap {
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
    }

    .summary-table,
    .soa-table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      font-size: clamp(6.8px, 0.85vw, 9px) !important;
    }

    .summary-table th,
    .summary-table td,
    .soa-table th,
    .soa-table td {
      padding: 2px 3px !important;
      font-size: inherit !important;
      line-height: 1.12 !important;
      white-space: normal !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      vertical-align: top !important;
    }

    .lgu-print-portrait .summary-table,
    .lgu-print-portrait .soa-table {
      font-size: clamp(6.5px, 1vw, 8.2px) !important;
    }

    .lgu-print-landscape .summary-table,
    .lgu-print-landscape .soa-table {
      font-size: clamp(7px, 0.75vw, 9px) !important;
    }

    .details-grid {
      width: 100% !important;
      padding: 5px !important;
      gap: 8px !important;
      font-size: clamp(7.5px, 0.9vw, 9px) !important;
      line-height: 1.2 !important;
      background: #ffffff !important;
      border: 1px solid #d31d6e !important;
    }

    .line {
      grid-template-columns: minmax(70px, 25%) minmax(0, 1fr) !important;
      gap: 4px !important;
    }

    .profile-details,
    .profile-card,
    .profile-status-banner,
    .payment-box,
    .approval,
    .details-grid {
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

    a {
      color: inherit !important;
      text-decoration: none !important;
    }
  }
`

export const ensureSponsorInvoicePrintStyles = (
  orientationMode: SponsorPrintOrientationMode = "auto"
): SponsorPrintOrientation | void => {
  if (typeof document === "undefined") return

  const orientation =
    orientationMode === "auto" ? resolveAutoPrintOrientation() : orientationMode

  applyPrintOrientationClass(orientation)

  let style = document.getElementById(SPONSOR_INVOICE_PRINT_STYLE_ID) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement("style")
    style.id = SPONSOR_INVOICE_PRINT_STYLE_ID
    document.head.appendChild(style)
  }

  style.textContent = buildPrintStyles(orientation)

  return orientation
}

let printListenersBound = false

const bindPrintListeners = (): void => {
  if (typeof window === "undefined") return
  if (printListenersBound) return

  window.addEventListener("beforeprint", () => {
    ensureSponsorInvoicePrintStyles("portrait")
  })

  window.addEventListener("afterprint", () => {
    resetPrintOrientationClass()
  })

  printListenersBound = true
}

export const useSponsorInvoicePrintActions = (): {
  printPage: (orientationMode?: SponsorPrintOrientationMode) => void
  goBack: () => void
  ensurePrintStyles: (orientationMode?: SponsorPrintOrientationMode) => void
} => {
  const router = useRouter()

  const ensurePrintStyles = (orientationMode: SponsorPrintOrientationMode = "portrait"): void => {
    bindPrintListeners()
    ensureSponsorInvoicePrintStyles(orientationMode)
  }

  const printPage = (orientationMode: SponsorPrintOrientationMode = "portrait"): void => {
    ensurePrintStyles(orientationMode)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()
      })
    })
  }

  const goBack = (): void => router.back()

  return {
    printPage,
    goBack,
    ensurePrintStyles
  }
}
