import {
  asCurrency,
  escapeHtml,
  formatDate,
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "./invoice-layout.util"

export interface LguInvoiceSubItem {
  name: string
  quantity: number
}

export interface LguInvoiceLine {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  treatmentDate?: string
  sessionSequence?: string
  subItems?: LguInvoiceSubItem[]
}

export interface LguInvoiceData {
  billingDate?: string
  referenceNumber: string
  patientName: string
  patientAddress?: string
  patientAge?: string
  patientGender?: string
  physicalTherapist?: string
  doctor?: string
  diagnosis?: string
  lguProgramName?: string
  lguReferenceLabel?: string
  lguDateIssued?: string
  subtotal: number
  discount: number
  surchargeAmount?: number
  grandTotal: number
  approvedBy?: string
  approverTitle?: string
  dateSigned?: string
  lines: LguInvoiceLine[]
}

function buildLineRows(lines: LguInvoiceLine[]): string {
  return lines.map((line, index) => {
    const subItemRows = (line.subItems ?? [])
      .map(sub => `
        <tr class="sub-item-row">
          <td></td>
          <td></td>
          <td class="sub-item">-${sub.quantity} ${escapeHtml(sub.name)}</td>
          <td></td>
          <td></td>
        </tr>
      `).join("")

    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
        <td>${escapeHtml(line.name)}</td>
        <td class="text-center">${escapeHtml(line.sessionSequence || "-")}</td>
        <td class="text-right">${escapeHtml(asCurrency(line.unitPrice))}</td>
      </tr>
      ${subItemRows}
    `
  }).join("")
}

export function renderLguInvoiceWindow(
  printWindow: Window,
  invoice: LguInvoiceData,
  options?: {title?: string; fileName?: string}
): void {
  const detailRows: InvoiceDetailRow[] = [
    { label: "Billing To", value: invoice.lguProgramName || "N/A" },
    { label: "Referral Form No.", value: invoice.lguReferenceLabel || "N/A" },
    { label: "Date Issued", value: formatDate(invoice.lguDateIssued) }
  ]

  renderStandardInvoiceWindow(printWindow, {
    title: options?.title?.trim() || "LGU Invoice",
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
      { label: "ITEM No.", width: "68px", align: "center" },
      { label: "TREATMENT DATE", width: "110px", align: "center" },
      { label: "PT SERVICE RENDERED" },
      { label: "SESSION SEQUENCE", width: "120px", align: "center" },
      { label: "UNIT PRICE", width: "126px", align: "right" }
    ],
    tableRowsHtml: buildLineRows(invoice.lines),
    emptyStateColspan: 4,
    discount: invoice.discount,
    surchargeAmount: invoice.surchargeAmount,
    surchargeLabel: "Retroactive Adjustment Surcharge",
    grandTotal: invoice.grandTotal,
    detailBoxTitle: "LGU DETAILS",
    detailRows,
    approvedBy: invoice.approvedBy,
    approverTitle: invoice.approverTitle,
    dateSigned: invoice.dateSigned,
    renderErrorMessage: "The LGU invoice could not be rendered. Please try again."
  })
}
