export interface BillingReceiptPrintSubItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface BillingReceiptPrintBreakdownGroup {
  label: string
  items: BillingReceiptPrintSubItem[]
}

export interface BillingReceiptPrintLine {
  typeLabel: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  originalLineTotal?: number
  breakdownGroups?: BillingReceiptPrintBreakdownGroup[]
}

export interface BillingReceiptPrintData {
  receiptNumber: string
  billingId: number | string
  patientRecordId?: string
  patientName: string
  appointmentId?: number | string
  createdAt: string
  billingType: string
  paymentType?: string
  serviceLabel?: string
  receiptMode?: "standard" | "lgu_claim"
  subtotal: number
  discount: number
  totalDue: number
  amountPaid: number
  outstanding: number
  changeAmount: number
  lines: BillingReceiptPrintLine[]
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

const ensurePrintWindowIsUsable = (printWindow: Window | null): Window => {
  if (!printWindow || printWindow.closed) {
    throw new Error("Please allow pop-ups so the receipt copy can open.")
  }
  return printWindow
}

const writePrintWindowDocument = (printWindow: Window, html: string): void => {
  ensurePrintWindowIsUsable(printWindow)

  try {
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  } catch {
    throw new Error("The receipt copy could not be rendered. Please try again.")
  }
}

export function openBillingReceiptWindow(title = "Receipt Copy"): Window {
  const printWindow = ensurePrintWindowIsUsable(window.open("", "_blank"))

  writePrintWindowDocument(printWindow, `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <div style="font-size: 14px; color: #475569;">Preparing receipt copy...</div>
      </body>
    </html>
  `)

  return printWindow
}

export function renderBillingReceiptWindow(
  printWindow: Window,
  receipt: BillingReceiptPrintData,
  options?: { title?: string; fileName?: string }
): void {
  const title = options?.title?.trim() || "Receipt Copy"
  const fileName = options?.fileName?.trim() || receipt.receiptNumber
  const isLguClaimReceipt = receipt.receiptMode === "lgu_claim"
  const shouldSuppressMainLinePrice = (line: BillingReceiptPrintLine): boolean =>
    isLguClaimReceipt && Boolean(line.breakdownGroups?.some(group => group.items.length > 0))

  const lineRows = receipt.lines.map((line) => `
    <tr>
      <td>
        <div class="line-name">${escapeHtml(line.name)}</div>
        <div class="line-meta">${escapeHtml(line.typeLabel)}</div>
        ${line.breakdownGroups?.length
          ? `
            <div class="line-breakdown">
              ${line.breakdownGroups.map((group) => `
                <div class="breakdown-group">
                  <div class="breakdown-label">${escapeHtml(group.label)}</div>
                  ${group.items.map((item) => `
                    <div class="breakdown-row">
                      <span>${escapeHtml(item.name)}</span>
                      <span>x${item.quantity}</span>
                      <span>${escapeHtml(asCurrency(item.unitPrice))}</span>
                      <span>${escapeHtml(asCurrency(item.totalPrice))}</span>
                    </div>
                  `).join("")}
                </div>
              `).join("")}
            </div>
          `
          : ""}
      </td>
      <td class="text-right">${line.quantity}</td>
      <td class="text-right">${shouldSuppressMainLinePrice(line) ? "-" : escapeHtml(asCurrency(line.unitPrice))}</td>
      <td class="text-right">
        <div>${shouldSuppressMainLinePrice(line) ? "-" : escapeHtml(asCurrency(line.lineTotal))}</div>
        ${line.originalLineTotal && line.originalLineTotal > line.lineTotal
          ? `<div class="line-original">${escapeHtml(asCurrency(line.originalLineTotal))}</div>`
          : ""}
      </td>
    </tr>
  `).join("")

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(fileName)}</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 5mm;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            color: #0f172a;
            background: #f8fafc;
          }
          body {
            padding: 18px;
          }
          .receipt-shell {
            border: 2px solid #0f766e;
            border-radius: 24px;
            background: linear-gradient(180deg, #ffffff, #f8fafc);
            padding: 22px;
          }
          .receipt-top {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            padding-bottom: 16px;
            border-bottom: 1px solid #dbe4ee;
          }
          .brand {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.28em;
            color: #0f766e;
            font-weight: 800;
          }
          .title {
            margin-top: 10px;
            font-size: 28px;
            font-weight: 800;
          }
          .subtitle {
            margin-top: 6px;
            font-size: 13px;
            color: #475569;
          }
          .copy-pill {
            border-radius: 999px;
            background: #ccfbf1;
            color: #115e59;
            padding: 10px 14px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          .meta-card, .summary-card {
            border: 1px solid #dbe4ee;
            border-radius: 16px;
            background: white;
            padding: 12px 14px;
          }
          .meta-label, .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #64748b;
            margin-bottom: 6px;
          }
          .meta-value, .summary-value {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.45;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            background: white;
            border-radius: 18px;
            overflow: hidden;
          }
          th, td {
            border-bottom: 1px solid #e2e8f0;
            padding: 12px 14px;
            vertical-align: top;
            font-size: 12px;
          }
          th {
            background: #ecfeff;
            color: #155e75;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 11px;
            text-align: left;
          }
          .text-right {
            text-align: right;
          }
          .line-name {
            font-weight: 700;
            font-size: 13px;
          }
          .line-meta {
            margin-top: 4px;
            color: #64748b;
            font-size: 11px;
          }
          .line-original {
            margin-top: 4px;
            color: #94a3b8;
            text-decoration: line-through;
            font-size: 11px;
          }
          .line-breakdown {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #dbe4ee;
          }
          .breakdown-group + .breakdown-group {
            margin-top: 10px;
          }
          .breakdown-label {
            font-size: 11px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 6px;
          }
          .breakdown-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 50px 90px 90px;
            gap: 10px;
            color: #475569;
            font-size: 11px;
            padding-left: 8px;
          }
          .totals-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-top: 18px;
          }
          .summary-card.alert {
            border-color: #fecaca;
            background: #fef2f2;
          }
          .summary-card.alert .summary-value {
            color: #b91c1c;
          }
          .footer-note {
            margin-top: 16px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <section class="receipt-shell">
          <div class="receipt-top">
            <div>
              <div class="brand">PhysioAve</div>
              <div class="title">${escapeHtml(title)}</div>
              <div class="subtitle">${
                isLguClaimReceipt
                  ? "Printable LGU billing copy with availed items and claim-ready details."
                  : "Printable billing receipt copy with full billed products and nested inclusions."
              }</div>
            </div>
            <div class="copy-pill">Receipt Copy</div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Receipt No.</div>
              <div class="meta-value">${escapeHtml(receipt.receiptNumber)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Billing ID</div>
              <div class="meta-value">${escapeHtml(receipt.billingId)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Created</div>
              <div class="meta-value">${escapeHtml(formatDateTime(receipt.createdAt))}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Patient</div>
              <div class="meta-value">${escapeHtml(receipt.patientName)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Patient Record ID</div>
              <div class="meta-value">${escapeHtml(receipt.patientRecordId || "N/A")}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Appointment ID</div>
              <div class="meta-value">${escapeHtml(receipt.appointmentId || "N/A")}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Billing Route</div>
              <div class="meta-value">${escapeHtml(receipt.billingType)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">${escapeHtml(isLguClaimReceipt ? "Billing Mode" : "Payment Type")}</div>
              <div class="meta-value">${escapeHtml((isLguClaimReceipt ? receipt.billingType : receipt.paymentType) || "N/A")}</div>
            </div>
            <div class="meta-card" style="grid-column: span 2;">
              <div class="meta-label">Billing Label</div>
              <div class="meta-value">${escapeHtml(receipt.serviceLabel || "N/A")}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineRows || `<tr><td colspan="4">No billed items were found for this receipt.</td></tr>`}
            </tbody>
          </table>

          <div class="totals-grid">
            ${
              isLguClaimReceipt
                ? `
                  <div class="summary-card" style="grid-column: span 2;">
                    <div class="summary-label">Total Billing Amount</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.totalDue))}</div>
                  </div>
                  <div class="summary-card" style="grid-column: span 2;">
                    <div class="summary-label">Claim Note</div>
                    <div class="summary-value">This LGU billing copy excludes POS settlement fields because payment is handled between the LGU and the clinic.</div>
                  </div>
                `
                : `
                  <div class="summary-card">
                    <div class="summary-label">Subtotal</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.subtotal))}</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-label">Discount</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.discount))}</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-label">Paid</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.amountPaid))}</div>
                  </div>
                  <div class="summary-card ${receipt.outstanding > 0 ? "alert" : ""}">
                    <div class="summary-label">Outstanding</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.outstanding))}</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-label">Total Due</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.totalDue))}</div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-label">Change</div>
                    <div class="summary-value">${escapeHtml(asCurrency(receipt.changeAmount))}</div>
                  </div>
                `
            }
          </div>

          <div class="footer-note">
            Generated on ${escapeHtml(formatDateTime(new Date().toISOString()))}. This copy reflects the billed products saved in the EMR at the time of printing.
          </div>
        </section>
      </body>
    </html>
  `

  writePrintWindowDocument(printWindow, html)
  printWindow.focus()

  window.setTimeout(() => {
    if (printWindow.closed) return
    printWindow.focus()
    printWindow.print()
  }, 350)
}
