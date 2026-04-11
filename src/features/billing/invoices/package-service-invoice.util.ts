export interface PackageInvoiceSubItem {
  name: string
  quantity: number
}

export interface PackageInvoiceLine {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
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

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const formatDate = (value?: string): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

const ensurePrintWindowIsUsable = (printWindow: Window | null): Window => {
  if (!printWindow || printWindow.closed) {
    throw new Error("Please allow pop-ups so the invoice copy can open.")
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
    throw new Error("The package service invoice could not be rendered. Please try again.")
  }
}

function buildLineRows(lines: PackageInvoiceLine[]): string {
  return lines.map((line, index) => {
    const subItemRows = (line.subItems ?? [])
      .map(sub => `
        <tr class="sub-item-row">
          <td></td>
          <td class="sub-item">-${sub.quantity} ${escapeHtml(sub.name)}</td>
          <td></td>
          <td></td>
        </tr>
      `).join("")

    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${escapeHtml(line.name)}</td>
        <td class="text-center">${line.quantity}</td>
        <td class="text-right">${escapeHtml(asCurrency(line.unitPrice))}</td>
      </tr>
      ${subItemRows}
    `
  }).join("")
}

export function renderPackageServiceInvoiceWindow(
  printWindow: Window,
  invoice: PackageServiceInvoiceData,
  options?: {title?: string; fileName?: string}
): void {
  const fileName = options?.fileName?.trim() || invoice.referenceNumber

  const lineRows = buildLineRows(invoice.lines)

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(fileName)}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: "Segoe UI", Tahoma, Arial, sans-serif;
            color: #1f2937;
            background: #f5f5f5;
          }
          body {
            padding: 10px;
          }
          .invoice-sheet {
            background: #ffffff;
            width: 100%;
            max-width: 980px;
            margin: 0 auto;
            border: 1px solid #d1d5db;
            padding: 18px 22px 14px;
          }
          .top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 14px;
            align-items: start;
          }
          .logo {
            max-height: 72px;
            width: auto;
          }
          .invoice-title {
            text-align: center;
            margin: 8px 0 0;
            font-size: 34px;
            letter-spacing: 0.03em;
            font-weight: 800;
            color: #111827;
          }
          .invoice-title span {
            text-decoration: underline;
            text-decoration-thickness: 1.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 2px 10px;
            font-size: 13px;
            min-width: 215px;
            padding-top: 10px;
          }
          .meta-grid strong {
            white-space: nowrap;
          }
          .patient-doctor-grid {
            margin-top: 12px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 24px;
            font-size: 14px;
            line-height: 1.6;
          }
          .line {
            display: grid;
            grid-template-columns: 110px minmax(0, 1fr);
            gap: 10px;
          }
          .label {
            font-weight: 700;
            white-space: nowrap;
          }
          .divider {
            border-top: 4px solid #d31d6e;
            margin-top: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
          }
          th, td {
            border-bottom: 2px solid #d31d6e;
            padding: 4px 7px;
            vertical-align: top;
          }
          th {
            text-align: left;
            font-weight: 700;
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
            padding-left: 18px;
            font-size: 12px;
            color: #374151;
          }
          .totals {
            margin-top: 4px;
            margin-left: auto;
            width: 320px;
            font-size: 24px;
          }
          .totals-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 12px;
            padding: 2px 0;
            font-size: 14px;
            font-weight: 700;
          }
          .grand-total {
            color: #d31d6e;
            font-size: 22px;
          }
          .bottom {
            margin-top: 16px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 18px;
            align-items: start;
          }
          .payment-box {
            border: 3px solid #d31d6e;
            padding: 8px;
            min-height: 98px;
            font-size: 14px;
          }
          .payment-box h3 {
            margin: 0 0 6px;
            font-size: 29px;
            font-weight: 800;
          }
          .approval {
            text-align: center;
            padding-top: 10px;
            font-size: 24px;
          }
          .approval .name {
            margin-top: 14px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .approval .title {
            font-size: 13px;
          }
          .approval .signed {
            margin-top: 8px;
            font-size: 13px;
            text-align: right;
          }
          .footer {
            margin-top: 16px;
            background: #13b7de;
            color: #0f172a;
            font-size: 12px;
            padding: 5px 8px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
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
                <th style="width: 68px;">ITEM No.</th>
                <th>PT SERVICE RENDERED</th>
                <th class="text-center" style="width: 72px;">QTY</th>
                <th class="text-right" style="width: 126px;">UNIT PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${lineRows || `<tr><td class="text-center">1</td><td colspan="3">No services found.</td></tr>`}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row"><span>Discount:</span><span>${escapeHtml(asCurrency(invoice.discount))}</span></div>
            <div class="totals-row grand-total"><span>Grand Total:</span><span>${escapeHtml(asCurrency(invoice.grandTotal))}</span></div>
          </div>

          <div class="bottom">
            <section class="payment-box">
              <h3>PAYMENT DETAILS</h3>
              <div><strong>Payment Method:</strong> ${escapeHtml(invoice.paymentMethod || "Cash/Card/Online Transfer")}</div>
              <div><strong>Payment</strong></div>
              <div><strong>Reference No.:</strong> ${escapeHtml(invoice.paymentReferenceNo || "N/A")}</div>
            </section>

            <section class="approval">
              <div><strong>Approved By:</strong></div>
              <div class="name">${escapeHtml(invoice.approvedBy || "RENALOU B. CORDOVA, PTRP, UK-PT")}</div>
              <div class="title">${escapeHtml(invoice.approverTitle || "Chief Operations Officer")}</div>
              <div class="signed"><strong>Date Signed:</strong> ${escapeHtml(formatDate(invoice.dateSigned || invoice.billingDate))}</div>
            </section>
          </div>

          <footer class="footer">
            <span>www.physioave.com</span>
            <span>+63-965-571-2455</span>
            <span>admin@physioave.com</span>
          </footer>
        </section>
      </body>
    </html>
  `

  writePrintWindowDocument(printWindow, html)
}
