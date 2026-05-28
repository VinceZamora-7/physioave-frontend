import {
  asCurrency,
  escapeHtml,
  formatDate,
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "./invoice-layout.util"

export interface HmoInvoiceLine {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  treatmentDate?: string
  laterality?: string
  bodyArea?: string
}

export interface HmoInvoiceData {
  billingDate?: string
  referenceNumber: string
  patientName: string
  patientAddress?: string
  patientAge?: string
  patientGender?: string
  physicalTherapist?: string
  doctor?: string
  diagnosis?: string
  hmoName?: string
  hmoTypeName?: string
  hmoCompanyName?: string
  hmoApprovalCode?: string
  hmoValidityStart?: string
  hmoValidityEnd?: string
  subtotal: number
  discount: number
  grandTotal: number
  approvedBy?: string
  approverTitle?: string
  dateSigned?: string
  lines: HmoInvoiceLine[]
}

const hasMeaningfulValue = (value?: string): boolean => {
  const normalized = String(value ?? "").trim()
  return !!normalized && !["N/A", "-", "NONE"].includes(normalized.toUpperCase())
}

const parseDiagnosisParts = (diagnosis?: string): { laterality?: string; bodyArea?: string } => {
  const value = String(diagnosis ?? "").trim()
  if (!hasMeaningfulValue(value)) return {}

  const markerMatch = value.match(/^\((L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\)\s*(.*)$/i)
  if (markerMatch) {
    const marker = markerMatch[1].toUpperCase()
    const laterality = marker === "L" || marker === "LEFT"
      ? "Left"
      : marker === "R" || marker === "RIGHT"
        ? "Right"
        : "Both"
    return {
      laterality,
      bodyArea: markerMatch[2]?.trim() || undefined
    }
  }

  const wordMatch = value.match(/^(LEFT|RIGHT|BOTH|BILATERAL)\b[\s,;:-]*(.*)$/i)
  if (wordMatch) {
    const marker = wordMatch[1].toUpperCase()
    return {
      laterality: marker === "LEFT" ? "Left" : marker === "RIGHT" ? "Right" : "Both",
      bodyArea: wordMatch[2]?.trim() || undefined
    }
  }

  return { bodyArea: value }
}

export function renderHmoInvoiceWindow(
  printWindow: Window,
  invoice: HmoInvoiceData,
  options?: {title?: string; fileName?: string}
): void {
  const diagnosisParts = parseDiagnosisParts(invoice.diagnosis)
  const lineRows = invoice.lines.map((line, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
      <td>${escapeHtml(line.name)}</td>
      <td class="text-center">${line.quantity}</td>
      <td class="text-center">${escapeHtml(hasMeaningfulValue(line.laterality) ? line.laterality : diagnosisParts.laterality || "N/A")}</td>
      <td class="text-center">${escapeHtml(hasMeaningfulValue(line.bodyArea) ? line.bodyArea : diagnosisParts.bodyArea || "N/A")}</td>
      <td class="text-right">${escapeHtml(asCurrency(line.unitPrice))}</td>
      <td class="text-right">${escapeHtml(asCurrency(line.lineTotal))}</td>
    </tr>
  `).join("")

  const detailRows: InvoiceDetailRow[] = [
    { label: "Billing To", value: invoice.hmoName || "N/A" },
    { label: "HMO Type", value: invoice.hmoTypeName || "N/A" },
    { label: "Company Name", value: invoice.hmoCompanyName || "N/A" },
    { label: "LOA Approval No.", value: invoice.hmoApprovalCode || "N/A" },
    { label: "LOA Validity", value: `${formatDate(invoice.hmoValidityStart)} - ${formatDate(invoice.hmoValidityEnd)}` }
  ]

  renderStandardInvoiceWindow(printWindow, {
    title: options?.title?.trim() || "HMO Invoice",
    fileName: options?.fileName?.trim() || invoice.referenceNumber,
    billingDate: invoice.billingDate,
    referenceNumber: invoice.referenceNumber,
    patientName: invoice.patientName,
    patientAddress: invoice.patientAddress,
    patientAge: invoice.patientAge,
    patientGender: invoice.patientGender,
    physicalTherapist: invoice.physicalTherapist,
    doctor: invoice.doctor,
    diagnosis: invoice.diagnosis,
    columns: [
      { label: "ITEM No.", width: "60px", align: "center" },
      { label: "TREATMENT DATE", width: "100px", align: "center" },
      { label: "PT SERVICE RENDERED" },
      { label: "QTY", width: "50px", align: "center" },
      { label: "LATERALITY", width: "100px", align: "center" },
      { label: "BODY AREA", width: "110px", align: "center" },
      { label: "UNIT PRICE", width: "110px", align: "right" },
      { label: "UNIT TOTAL", width: "110px", align: "right" }
    ],
    tableRowsHtml: lineRows,
    emptyStateColspan: 8,
    discount: invoice.discount,
    grandTotal: invoice.grandTotal,
    detailBoxTitle: "HMO DETAILS",
    detailRows,
    approvedBy: invoice.approvedBy,
    approverTitle: invoice.approverTitle,
    dateSigned: invoice.dateSigned,
    pageSize: "A4 landscape",
    maxWidthPx: 1200,
    renderErrorMessage: "The HMO invoice could not be rendered. Please try again."
  })
}
