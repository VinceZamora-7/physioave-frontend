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
  unitPrice?: number
  children?: LguInvoiceSubItem[]
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
  lguStatus?: string
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
  const collectPricedSubItems = (items: LguInvoiceSubItem[]): Array<{name: string; quantity: number; unitPrice: number}> =>
    items.flatMap(item => {
      if (item.children?.length) return collectPricedSubItems(item.children)
      const unitPrice = Number(item.unitPrice ?? 0)
      return unitPrice > 0
        ? [{ name: item.name, quantity: Math.max(1, Number(item.quantity ?? 1)), unitPrice }]
        : []
    })

  const renderSubItems = (items: LguInvoiceSubItem[], depth = 0): string =>
    items.map(sub => `
      <div class="sub-item sub-item-depth-${depth}">
        - ${sub.quantity} ${escapeHtml(sub.name)}
      </div>
      ${sub.children?.length ? renderSubItems(sub.children, depth + 1) : ""}
    `).join("")

  return lines.map((line, index) => {
    const pricedSubItems = line.unitPrice <= 0 ? collectPricedSubItems(line.subItems ?? []) : []
    if (pricedSubItems.length) {
      return pricedSubItems.map((item, itemIndex) => `
        <tr>
          <td class="text-center">${itemIndex === 0 ? index + 1 : ""}</td>
          <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
          <td>${escapeHtml(`${item.quantity} ${item.name}`)}</td>
          <td class="text-center">${escapeHtml(line.sessionSequence || "-")}</td>
          <td class="text-right">${escapeHtml(asCurrency(item.unitPrice))}</td>
        </tr>
      `).join("")
    }

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
        <td class="text-right">${line.unitPrice > 0 ? escapeHtml(asCurrency(line.unitPrice)) : "-"}</td>
      </tr>
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
    { label: "Date Issued", value: formatDate(invoice.lguDateIssued) },
    { label: "Patient Program Status", value: invoice.lguStatus || "N/A" }
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
