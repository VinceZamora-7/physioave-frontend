import { useLguInvoicePrintActions } from "@/features/lgu-billing/invoices/lgu-invoice.shared"

export const normalizeHmoStatus = (value?: string | null): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")

export const formatHmoStatus = (value?: string | null): string => {
  switch (normalizeHmoStatus(value)) {
    case "PAID":
      return "Paid"
    case "BILLED":
      return "Billed"
    case "PARTIALLY_PAID":
      return "Partially Paid"
    case "PENDING":
      return "Pending"
    case "VOID":
      return "Void"
    default:
      return String(value ?? "").trim() || "N/A"
  }
}

export const useHmoInvoicePrintActions = useLguInvoicePrintActions
