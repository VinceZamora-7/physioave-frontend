import { useRouter } from "vue-router"

const LGU_INVOICE_PRINT_STYLE_ID = "lgu-invoice-auto-print-style"
const PRINT_TABLE_SELECTOR = ".summary-table, .soa-table"

export type LguPrintOrientation = "portrait" | "landscape"

/*
  browser = respect the user's print dialog orientation
  auto = app decides and forces portrait/landscape
  portrait = force portrait
  landscape = force landscape
*/
export type LguPrintOrientationMode = LguPrintOrientation | "auto" | "browser"

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
): string =>
  formatLguStatus(resolveLguPatientProgramStatus(billingProgramStatus, dropoutStatus))

const getTableColumnCount = (table: HTMLTableElement): number => {
  const row = table.tHead?.rows?.[0] ?? table.rows?.[0]
  if (!row) return 0

  return Array.from(row.cells).reduce((total, cell) => {
    return total + Math.max(cell.colSpan || 1, 1)
  }, 0)
}

const resolveAutoPrintOrientation = (): LguPrintOrientation => {
  if (typeof document === "undefined") return "portrait"

  const sheet = document.querySelector<HTMLElement>(".lgu-invoice-sheet")
  const tables = Array.from(
    document.querySelectorAll<HTMLTableElement>(PRINT_TABLE_SELECTOR)
  )

  const maxColumnCount = tables.reduce((max, table) => {
    return Math.max(max, getTableColumnCount(table))
  }, 0)

  const hasOverflowingTable = tables.some((table) => {
    const wrapper = table.closest<HTMLElement>(".table-wrap")
    const availableWidth = wrapper?.clientWidth || table.clientWidth || 0

    return table.scrollWidth > availableWidth + 8
  })

  const sheetWidth = sheet?.scrollWidth ?? 0
  const sheetHeight = sheet?.scrollHeight ?? 0
  const contentLooksWide =
    sheetWidth > 0 && sheetHeight > 0 && sheetWidth > sheetHeight * 1.08

  if (hasOverflowingTable || maxColumnCount >= 6 || contentLooksWide) {
    return "landscape"
  }

  return "portrait"
}

const applyPrintOrientationClass = (orientation: LguPrintOrientation): void => {
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

const resolvePageSize = (
  orientationMode: LguPrintOrientationMode,
  detectedOrientation: LguPrintOrientation
): string => {
  /*
    browser = do not force portrait/landscape.
    This lets the user's selected print dialog orientation win.
  */
  if (orientationMode === "browser") {
    return "auto"
  }

  /*
    auto = app forces the detected orientation.
    Use this only when you really want automatic orientation.
  */
  if (orientationMode === "auto") {
    return detectedOrientation
  }

  /*
    portrait / landscape = app forces exact orientation.
  */
  return orientationMode
}

const buildPrintStyles = (
  orientationClass: LguPrintOrientation,
  pageSize: string
): string => `
  @page {
    size: ${pageSize};
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
    }

    .lgu-invoice-sheet:not(:last-child) {
      break-after: page !important;
      page-break-after: always !important;
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
    }

    a {
      color: inherit !important;
      text-decoration: none !important;
    }
  }
`

export const ensureLguInvoicePrintStyles = (
  orientationMode: LguPrintOrientationMode = "browser"
): LguPrintOrientation | void => {
  if (typeof document === "undefined") return

  const detectedOrientation =
    orientationMode === "auto" || orientationMode === "browser"
      ? resolveAutoPrintOrientation()
      : orientationMode

  const pageSize = resolvePageSize(orientationMode, detectedOrientation)

  applyPrintOrientationClass(detectedOrientation)

  let style = document.getElementById(LGU_INVOICE_PRINT_STYLE_ID) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement("style")
    style.id = LGU_INVOICE_PRINT_STYLE_ID
    document.head.appendChild(style)
  }

  style.textContent = buildPrintStyles(detectedOrientation, pageSize)

  return detectedOrientation
}

let printListenersBound = false

const bindPrintListeners = (): void => {
  if (typeof window === "undefined") return
  if (printListenersBound) return

  window.addEventListener("beforeprint", () => {
    ensureLguInvoicePrintStyles("browser")
  })

  window.addEventListener("afterprint", () => {
    resetPrintOrientationClass()
  })

  printListenersBound = true
}

export const useLguInvoicePrintActions = (): {
  printPage: (orientationMode?: LguPrintOrientationMode) => void
  goBack: () => void
  ensurePrintStyles: (orientationMode?: LguPrintOrientationMode) => void
} => {
  const router = useRouter()

  const ensurePrintStyles = (
    orientationMode: LguPrintOrientationMode = "browser"
  ): void => {
    bindPrintListeners()
    ensureLguInvoicePrintStyles(orientationMode)
  }

  const printPage = (
    orientationMode: LguPrintOrientationMode = "browser"
  ): void => {
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
