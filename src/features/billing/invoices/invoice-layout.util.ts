export interface InvoiceColumn {
  label: string
  width?: string
  align?: "left" | "center" | "right"
}

export interface InvoiceDetailRow {
  label: string
  value: string
}

export interface InvoiceLayoutInput {
  title?: string
  fileName: string
  billingDate?: string
  referenceNumber: string
  patientName: string
  patientAddress?: string
  patientAge?: string
  patientGender?: string
  physicalTherapist?: string
  doctor?: string
  diagnosis?: string
  columns: InvoiceColumn[]
  tableRowsHtml: string
  emptyStateColspan: number
  discount: number
  surchargeAmount?: number
  surchargeLabel?: string
  grandTotal: number
  detailBoxTitle: string
  detailRows: InvoiceDetailRow[]
  approvedBy?: string
  approverTitle?: string
  dateSigned?: string
  pageSize?: "A4" | "A4 landscape"
  maxWidthPx?: number
  renderErrorMessage: string
  autoPrint?: boolean
}

const WEBSITE_LABEL = "www.physioave.com"
const PHONE_LABEL = "+63-965-571-2455"
const EMAIL_LABEL = "admin@physioave.com"

export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")

export const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

export const formatDate = (value?: string): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

export const ensurePrintWindowIsUsable = (printWindow: Window | null): Window => {
  if (!printWindow || printWindow.closed) {
    throw new Error("Please allow pop-ups so the invoice copy can open.")
  }
  return printWindow
}

export const writePrintWindowDocument = (
  printWindow: Window,
  html: string,
  errorMessage: string
): void => {
  ensurePrintWindowIsUsable(printWindow)

  try {
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  } catch {
    throw new Error(errorMessage)
  }
}

const columnAlignClass = (align?: "left" | "center" | "right"): string => {
  if (align === "center") return "text-center"
  if (align === "right") return "text-right"
  return ""
}

export function renderStandardInvoiceWindow(printWindow: Window, invoice: InvoiceLayoutInput): void {
  const tableHeaders = invoice.columns.map(column => `
    <th class="${columnAlignClass(column.align)}"${column.width ? ` style="width: ${escapeHtml(column.width)};"` : ""}>${escapeHtml(column.label)}</th>
  `).join("")

  const detailRows = invoice.detailRows.map(row =>
    `<div><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</div>`
  ).join("")

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(invoice.fileName || invoice.title || "Invoice")}</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Canva+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: "Canva Sans", "Segoe UI", Tahoma, Arial, sans-serif;
            color: #1f2937;
            background: #f5f5f5;
          }
          body {
            padding: 10px;
          }
          .invoice-sheet {
            background: #ffffff;
            width: 100%;
            max-width: 210mm;
            height: 297mm;
            margin: 0 auto;
            border: 1px solid #d1d5db;
            padding: 12px 16px 10px;
            font-family: "Canva Sans", sans-serif;
          }
          .top {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px;
            align-items: start;
            margin-bottom: 8px;
          }
          .logo {
            max-height: 60px;
            width: auto;
          }
          .invoice-title {
            text-align: center;
            margin: 4px 0 0;
            font-size: 24px;
            letter-spacing: 0.05em;
            font-weight: 800;
            color: #111827;
            font-family: "Montserrat", sans-serif;
          }
          .invoice-title span {
            text-decoration: underline;
            text-decoration-thickness: 1.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 2px 8px;
            font-size: 12px;
            padding-top: 6px;
            font-family: "Montserrat", sans-serif;
            font-weight: 600;
          }
          .meta-grid strong {
            white-space: nowrap;
            font-weight: 700;
          }
          .patient-doctor-grid {
            margin-top: 8px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 16px;
            font-size: 12px;
            line-height: 1.5;
            border: 2px solid #d31d6e;
            padding: 10px;
            background: #fef5f9;
          }
          .patient-doctor-grid > div {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .line {
            display: grid;
            grid-template-columns: 100px minmax(0, 1fr);
            gap: 8px;
          }
          .label {
            font-weight: 700;
            white-space: nowrap;
            font-family: "Montserrat", sans-serif;
            color: #000;
          }
          .divider {
            border-top: 3px solid #d31d6e;
            margin-top: 8px;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 12px;
            font-family: "Canva Sans", sans-serif;
          }
          th, td {
            border-bottom: 2px solid #d31d6e;
            padding: 3px 6px;
            vertical-align: top;
          }
          th {
            text-align: left;
            font-weight: 700;
            font-family: "Montserrat", sans-serif;
            background: #f3f4f6;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .sub-item-row td {
            border-bottom: none;
            padding-top: 0;
            padding-bottom: 1px;
          }
          .sub-item {
            padding-left: 16px;
            font-size: 11px;
            color: #374151;
          }
          .totals {
            margin-top: 6px;
            margin-left: auto;
            width: 280px;
          }
          .totals-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 12px;
            padding: 2px 0;
            font-size: 12px;
            font-weight: 700;
            font-family: "Montserrat", sans-serif;
          }
          .grand-total {
            color: #d31d6e;
            font-size: 18px;
          }
          .bottom {
            margin-top: 10px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 12px;
            align-items: start;
          }
          .payment-box {
            border: 3px solid #d31d6e;
            padding: 8px;
            min-height: 80px;
            font-size: 12px;
            font-family: "Canva Sans", sans-serif;
          }
          .payment-box h3 {
            margin: 0 0 6px;
            font-size: 18px;
            font-weight: 800;
            font-family: "Montserrat", sans-serif;
          }
          .approval {
            text-align: center;
            padding-top: 8px;
            font-size: 11px;
            font-family: "Canva Sans", sans-serif;
          }
          .approval .name {
            margin-top: 12px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            font-family: "Montserrat", sans-serif;
          }
          .approval .title {
            font-size: 10px;
          }
          .approval .signed {
            margin-top: 6px;
            font-size: 10px;
            text-align: right;
          }
          .footer {
            margin-top: 8px;
            background: #13b7de;
            color: #0f172a;
            font-size: 11px;
            padding: 4px 6px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
            font-family: "Montserrat", sans-serif;
            font-weight: 600;
          }
          .footer span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .invoice-sheet {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <section class="invoice-sheet">
          <div class="top">
            <div>
              <img class="logo" src="/app-logo.png" alt="PhysioAve" />
              <h1 class="invoice-title"><span>INVOICE BILLING</span></h1>
            </div>
            <div class="meta-grid">
              <strong>BILLING DATE:</strong><span>${escapeHtml(formatDate(invoice.billingDate))}</span>
              <strong>REFERENCE NO.:</strong><span>${escapeHtml(invoice.referenceNumber)}</span>
            </div>
          </div>

          <div class="patient-doctor-grid">
            <div>
              <div class="line"><span class="label">Patient's Name:</span><span>${escapeHtml(invoice.patientName)}</span></div>
              <div class="line"><span class="label">Address:</span><span>${escapeHtml(invoice.patientAddress || "N/A")}</span></div>
              <div class="line"><span class="label">Age:</span><span>${escapeHtml(invoice.patientAge || "N/A")}</span></div>
              <div class="line"><span class="label">Gender:</span><span>${escapeHtml(invoice.patientGender || "N/A")}</span></div>
            </div>
            <div>
              <div class="line"><span class="label">Physical Therapist:</span><span>${escapeHtml(invoice.physicalTherapist || "N/A")}</span></div>
              <div class="line"><span class="label">Doctor:</span><span>${escapeHtml(invoice.doctor || "N/A")}</span></div>
              <div class="line"><span class="label">Diagnosis:</span><span>${escapeHtml(invoice.diagnosis || "N/A")}</span></div>
            </div>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                ${tableHeaders}
              </tr>
            </thead>
            <tbody>
              ${invoice.tableRowsHtml || `<tr><td class="text-center">1</td><td colspan="${invoice.emptyStateColspan}">No services found.</td></tr>`}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row"><span>Discount:</span><span>${escapeHtml(asCurrency(invoice.discount))}</span></div>
            ${Number(invoice.surchargeAmount ?? 0) > 0
              ? `<div class="totals-row"><span>${escapeHtml(invoice.surchargeLabel || "Surcharge")}:</span><span>${escapeHtml(asCurrency(Number(invoice.surchargeAmount ?? 0)))}</span></div>`
              : ""}
            <div class="totals-row grand-total"><span>Grand Total:</span><span>${escapeHtml(asCurrency(invoice.grandTotal))}</span></div>
          </div>

          <div class="bottom">
            <section class="payment-box">
              <h3>${escapeHtml(invoice.detailBoxTitle)}</h3>
              ${detailRows}
            </section>

            <section class="approval">
              <div><strong>Approved By:</strong></div>
              <div class="name">${escapeHtml(invoice.approvedBy || "RENALOU B. CORDOVA, PTRP, UK-PT")}</div>
              <div class="title">${escapeHtml(invoice.approverTitle || "Chief Operations Officer")}</div>
              <div class="signed"><strong>Date Signed:</strong> ${escapeHtml(formatDate(invoice.dateSigned || invoice.billingDate))}</div>
            </section>
          </div>

          <footer class="footer">
            <span>${WEBSITE_LABEL}</span>
            <span>${PHONE_LABEL}</span>
            <span>${EMAIL_LABEL}</span>
          </footer>
        </section>
      </body>
    </html>
  `

  writePrintWindowDocument(printWindow, html, invoice.renderErrorMessage)
  printWindow.focus()

  if (invoice.autoPrint !== true) {
    return
  }

  window.setTimeout(() => {
    if (printWindow.closed) return
    printWindow.focus()
    printWindow.print()
  }, 350)
}
