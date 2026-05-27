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
  const hasContractRate = (item: LguInvoiceSubItem): boolean => {
    const unitPrice = Number(item.unitPrice)
    return item.unitPrice !== undefined && Number.isFinite(unitPrice) && unitPrice >= 0
  }

  const hasExplicitSubItemPricing = (items?: LguInvoiceSubItem[]): boolean =>
    Boolean((items ?? []).some(item => {
      return hasContractRate(item) || hasExplicitSubItemPricing(item.children)
    }))

  const formatContractRate = (amount: number): string =>
    amount > 0 ? escapeHtml(asCurrency(amount)) : "FREE"

  const renderSubItems = (items: LguInvoiceSubItem[], depth = 0): string =>
    items.map(sub => `
      <div class="sub-item sub-item-depth-${Math.min(depth, 2)}">
        - ${Math.max(1, Number(sub.quantity ?? 1))} ${escapeHtml(sub.name)}
      </div>
      ${sub.children?.length ? renderSubItems(sub.children, depth + 1) : ""}
    `).join("")

  const renderBlankSubItemPrices = (items: LguInvoiceSubItem[], depth = 0): string =>
    items.map(sub => `
      <div class="sub-item sub-item-depth-${Math.min(depth, 2)}">&nbsp;</div>
      ${sub.children?.length ? renderBlankSubItemPrices(sub.children, depth + 1) : ""}
    `).join("")

  const renderSubItemPrices = (items: LguInvoiceSubItem[], depth = 0): string =>
    items.map(sub => {
      const hasUnitPrice = hasContractRate(sub)
      const quantity = Math.max(1, Number(sub.quantity ?? 1))
      const unitPrice = Number(sub.unitPrice ?? 0)
      const childPriceHtml = sub.children?.length
        ? hasUnitPrice
          ? renderBlankSubItemPrices(sub.children, depth + 1)
          : renderSubItemPrices(sub.children, depth + 1)
        : ""
      return `
        <div class="sub-item sub-item-depth-${Math.min(depth, 2)}">
          ${hasUnitPrice ? formatContractRate(Number((quantity * unitPrice).toFixed(2))) : "&nbsp;"}
        </div>
        ${childPriceHtml}
      `
    }).join("")

  const sessionKey = (line: LguInvoiceLine): string =>
    `${formatDate(line.treatmentDate)}|${line.sessionSequence || "-"}`

  return lines.map((line, index) => {
    const currentSessionKey = sessionKey(line)
    const nextSessionKey = lines[index + 1] ? sessionKey(lines[index + 1]) : ""
    const isSessionEnd = currentSessionKey !== nextSessionKey
    const hasSubItemPricing = hasExplicitSubItemPricing(line.subItems)
    const subItems = renderSubItems(line.subItems ?? [])
    const unitPriceHtml = hasSubItemPricing
      ? `<div class="package-line">&nbsp;</div>${renderSubItemPrices(line.subItems ?? [])}`
      : line.unitPrice > 0
        ? escapeHtml(asCurrency(line.unitPrice))
        : "-"

    return `
      <tr class="${isSessionEnd ? "session-divider-row" : ""}">
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
        <td>
          <div class="package-line">${escapeHtml(line.name)}</div>
          ${subItems}
        </td>
        <td class="text-center">${escapeHtml(line.sessionSequence || "")}</td>
        <td class="text-right">${unitPriceHtml}</td>
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
    emptyStateColspan: 5,
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
