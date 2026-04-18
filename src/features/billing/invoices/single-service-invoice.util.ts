import {
  asCurrency,
  escapeHtml,
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "./invoice-layout.util"

export interface SingleServiceInvoiceLine {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface SingleServiceInvoiceData {
  billingDate?: string
  referenceNumber: string
  patientName: string
  patientAddress?: string
  patientAge?: string
  patientGender?: string
  physicalTherapist?: string
  doctor?: string
  diagnosis?: string
  paymentMethod?: string
  paymentReferenceNo?: string
  subtotal: number
  discount: number
  grandTotal: number
  approvedBy?: string
  approverTitle?: string
  dateSigned?: string
  lines: SingleServiceInvoiceLine[]
}

export function renderSingleServiceInvoiceWindow(
  printWindow: Window,
  invoice: SingleServiceInvoiceData,
  options?: {title?: string; fileName?: string}
): void {
  const lineRows = invoice.lines.map((line, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${escapeHtml(line.name)}</td>
      <td class="text-center">${line.quantity}</td>
      <td class="text-right">${escapeHtml(asCurrency(line.unitPrice))}</td>
      <td class="text-right">${escapeHtml(asCurrency(line.lineTotal))}</td>
    </tr>
  `).join("")

  const detailRows: InvoiceDetailRow[] = [
    { label: "Payment Method", value: invoice.paymentMethod || "Cash/Card/Online Transfer" },
    { label: "Payment", value: "" },
    { label: "Reference No.", value: invoice.paymentReferenceNo || "N/A" }
  ]

  renderStandardInvoiceWindow(printWindow, {
    title: options?.title?.trim() || "Single Service Invoice",
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
      { label: "PT SERVICE RENDERED" },
      { label: "QTY", width: "72px", align: "center" },
      { label: "UNIT PRICE", width: "126px", align: "right" },
      { label: "UNIT TOTAL", width: "132px", align: "right" }
    ],
    tableRowsHtml: lineRows,
    emptyStateColspan: 4,
    discount: invoice.discount,
    grandTotal: invoice.grandTotal,
    detailBoxTitle: "PAYMENT DETAILS",
    detailRows,
    approvedBy: invoice.approvedBy,
    approverTitle: invoice.approverTitle,
    dateSigned: invoice.dateSigned,
    renderErrorMessage: "The single service invoice could not be rendered. Please try again.",
    autoPrint: true
  })
}
