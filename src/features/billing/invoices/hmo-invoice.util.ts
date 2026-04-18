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

export function renderHmoInvoiceWindow(
  printWindow: Window,
  invoice: HmoInvoiceData,
  options?: {title?: string; fileName?: string}
): void {
  const lineRows = invoice.lines.map((line, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
      <td>${escapeHtml(line.name)}</td>
      <td class="text-center">${line.quantity}</td>
      <td class="text-center">${escapeHtml(line.laterality || "N/A")}</td>
      <td class="text-center">${escapeHtml(line.bodyArea || "N/A")}</td>
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
    emptyStateColspan: 7,
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
