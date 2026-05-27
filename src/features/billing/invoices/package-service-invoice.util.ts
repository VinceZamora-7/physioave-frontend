import {
  asCurrency,
  escapeHtml,
  formatDate,
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "./invoice-layout.util"

export interface PackageInvoiceSubItem {
  name: string
  quantity: number
  children?: PackageInvoiceSubItem[]
}

export interface PackageInvoiceLine {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  treatmentDate?: string
  sessionSequence?: string
  subItems?: PackageInvoiceSubItem[]
}

export interface PackageServiceInvoiceData {
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
  lines: PackageInvoiceLine[]
}

function buildLineRows(lines: PackageInvoiceLine[]): string {
  const renderSubItems = (items: PackageInvoiceSubItem[], depth = 0): string =>
    items.map(sub => `
      <div class="sub-item sub-item-depth-${depth}">
        - ${sub.quantity} ${escapeHtml(sub.name)}
      </div>
      ${sub.children?.length ? renderSubItems(sub.children, depth + 1) : ""}
    `).join("")

  return lines.map((line, index) => {
    const subItems = renderSubItems(line.subItems ?? [])
    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
        <td>
          <div class="package-line">${escapeHtml(line.name)}</div>
          ${subItems}
        </td>
        <td class="text-center">${escapeHtml(line.sessionSequence || "-")}</td>
        <td class="text-right">${escapeHtml(asCurrency(line.unitPrice))}</td>
      </tr>
    `
  }).join("")
}

export function renderPackageServiceInvoiceWindow(
  printWindow: Window,
  invoice: PackageServiceInvoiceData,
  options?: {title?: string; fileName?: string}
): void {
  const detailRows: InvoiceDetailRow[] = [
    { label: "Payment Method", value: invoice.paymentMethod || "Cash/Card/Online Transfer" },
    { label: "Payment", value: "" },
    { label: "Reference No.", value: invoice.paymentReferenceNo || "N/A" }
  ]

  renderStandardInvoiceWindow(printWindow, {
    title: options?.title?.trim() || "Package Service Invoice",
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
    emptyStateColspan: 5,
    discount: invoice.discount,
    grandTotal: invoice.grandTotal,
    detailBoxTitle: "PAYMENT DETAILS",
    detailRows,
    approvedBy: invoice.approvedBy,
    approverTitle: invoice.approverTitle,
    dateSigned: invoice.dateSigned,
    renderErrorMessage: "The package service invoice could not be rendered. Please try again."
  })
}
