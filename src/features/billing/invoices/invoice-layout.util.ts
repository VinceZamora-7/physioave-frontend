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
  headerTitle?: string
  fileName: string
  billingDate?: string
  referenceNumber: string
  topMetaRows?: InvoiceDetailRow[]
  patientName: string
  patientAddress?: string
  patientAge?: string
  patientGender?: string
  hidePatientDoctorHeader?: boolean
  physicalTherapist?: string
  doctor?: string
  diagnosis?: string
  columns: InvoiceColumn[]
  tableRowsHtml: string
  emptyStateColspan: number
  customBodyHtml?: string
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
  hideFinancialSummary?: boolean
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
  const printedDate = new Date().toISOString()
  const tableHeaders = invoice.columns.map(column => `
    <th class="${columnAlignClass(column.align)}"${column.width ? ` style="width: ${escapeHtml(column.width)};"` : ""}>${escapeHtml(column.label)}</th>
  `).join("")

  const detailRows = invoice.detailRows.map(row =>
    `<div><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</div>`
  ).join("")
  const topMetaRows = (invoice.topMetaRows?.length
    ? invoice.topMetaRows
    : [
        { label: "BILLING DATE", value: formatDate(invoice.billingDate) },
        { label: "BILLING RECORD ID", value: invoice.referenceNumber }
      ]
  ).map(row => `
    <strong>${escapeHtml(row.label)}:</strong><span>${escapeHtml(row.value)}</span>
  `).join("")

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
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            display: flex;
            gap: 10px;
            width: 100%;
            justify-content: space-between;
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
            display: flex;
            justify-content: space-between;
            width: 100%;
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
            padding: 3px 6px;
            vertical-align: top;
          }
          th {
            text-align: left;
            font-weight: 700;
            font-family: "Montserrat", sans-serif;
            background: #f3f4f6;
            border-bottom: 2px solid #d31d6e;
          }
          tbody tr.item-group-start td {
            border-top: 2px solid #d31d6e;
          }
          tbody tr.line-item-child td {
            border-top: 1px dashed #f3a8c8;
            color: #374151;
          }
          tbody tr.line-item-child td.text-right {
            color: #1f2937;
            font-weight: 600;
          }
          tbody tr:first-child td {
            border-top: none;
          }
          tbody tr.session-divider-row td {
            border-bottom: 2px solid #d31d6e;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .package-line {
            font-weight: 700;
            margin-bottom: 2px;
          }
          .sub-item {
            padding-left: 16px;
            font-size: 11px;
            color: #374151;
          }
          .sub-item-depth-1 {
            padding-left: 32px;
          }
          .sub-item-depth-2 {
            padding-left: 48px;
          }
          tr.line-item-child td:nth-child(3) {
            padding-left: 18px;
            font-size: 11px;
          }
          tr.line-item-child.hierarchy-depth-2 td:nth-child(3) {
            padding-left: 30px;
          }
          tr.line-item-child.hierarchy-depth-3 td:nth-child(3) {
            padding-left: 42px;
          }
          .profile-summary {
            display: grid;
            grid-template-columns: 92px 1fr;
            gap: 12px;
            align-items: center;
            margin-top: 8px;
            padding: 10px;
            border: 2px solid #d31d6e;
            background: #fef5f9;
            font-size: 12px;
          }
          .profile-photo {
            width: 82px;
            height: 82px;
            border-radius: 999px;
            object-fit: cover;
            border: 2px solid #ffffff;
            background: #ffffff;
          }
          .profile-photo-fallback {
            width: 82px;
            height: 82px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            background: #f3f4f6;
            color: #111827;
            font-size: 24px;
            font-weight: 800;
            font-family: "Montserrat", sans-serif;
          }
          .profile-name {
            margin: 0 0 4px;
            font-size: 18px;
            font-weight: 800;
            font-family: "Montserrat", sans-serif;
            color: #111827;
          }
          .profile-subtitle {
            margin: 0;
            color: #4b5563;
            font-size: 12px;
          }
          .profile-section {
            margin-top: 8px;
            border-top: 3px solid #d31d6e;
            padding-top: 6px;
          }
          .profile-section h2 {
            margin: 0 0 6px;
            font-size: 14px;
            font-weight: 800;
            font-family: "Montserrat", sans-serif;
            color: #111827;
            text-transform: uppercase;
          }
          .profile-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px 10px;
            font-size: 11px;
          }
          .profile-field {
            border-bottom: 1px solid #f3a8c8;
            padding-bottom: 3px;
            min-height: 30px;
          }
          .profile-field strong {
            display: block;
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            font-family: "Montserrat", sans-serif;
            margin-bottom: 1px;
          }
          .profile-field-wide {
            grid-column: span 2;
          }
          .profile-field-full {
            grid-column: 1 / -1;
          }
          .compact-table {
            margin-top: 4px;
            font-size: 11px;
          }
          .compact-table th,
          .compact-table td {
            padding: 3px 5px;
          }
          .totals {
            margin-top: 6px;
            margin-left: auto;
            width: 280px;
          }
          .totals-row {
          border-left: 1px solid #d1d5db;
          display: flex;
          justify-content: center;
          align-items: center;
            gap: 5px;
            padding: 2px 0;
            font-size: 12px;
            font-weight: 700;
            font-family: "Montserrat", sans-serif;
          }
          .grand-total {
            color: #d31d6e;
            font-size: 12px;
          }
          .bottom {
            margin-top: 10px;
           display: flex;
           justify-content: space-between;
            align-items: center;
          }
          .payment-box {
          width: 540px;
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
          width: 200px;
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
          }
          .footer {
            margin-top: 8px;
            background: #13b7de;
            background-color: #13b7de;
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
            .profile-summary {
              break-inside: avoid;
            }
            .profile-section {
              break-inside: avoid;
            }
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .invoice-sheet {
              border: none;
            }
            .footer {
              background: #13b7de !important;
              background-color: #13b7de !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <section class="invoice-sheet">
          <div class="top">
            <div>
              <img class="logo" src="/app-logo.png" alt="PhysioAve" />
              <h1 class="invoice-title"><span>${escapeHtml(invoice.headerTitle || "INVOICE BILLING")}</span></h1>
            </div>
            <div class="meta-grid">
              ${topMetaRows}
            </div>
          </div>

          ${invoice.hidePatientDoctorHeader
            ? ""
            : `<div class="patient-doctor-grid">
                <div>
                  <div class="line"><span class="label">Patient's Name:</span><span>${escapeHtml(invoice.patientName)}</span></div>
                  <div class="line"><span class="label">Address:</span><span>${escapeHtml(invoice.patientAddress || "N/A")}</span></div>
                  <div class="line"><span class="label">Age:</span><span>${escapeHtml(invoice.patientAge || "N/A")}</span></div>
                  <div class="line"><span class="label">Gender:</span><span>${escapeHtml(invoice.patientGender || "N/A")}</span></div>
                </div>
                <div>
                  <div class="line"><span class="label">Physical <br /> Therapist:</span><span>${escapeHtml(invoice.physicalTherapist || "N/A")}</span></div>
                  <div class="line"><span class="label">Doctor:</span><span>${escapeHtml(invoice.doctor || "N/A")}</span></div>
                  <div class="line"><span class="label">Diagnosis:</span><span>${escapeHtml(invoice.diagnosis || "N/A")}</span></div>
                </div>
              </div>`}

          <div class="divider"></div>

          ${invoice.customBodyHtml
            ? invoice.customBodyHtml
            : `<table>
                <thead>
                  <tr>
                    ${tableHeaders}
                  </tr>
                </thead>
                <tbody>
                  ${invoice.tableRowsHtml || `<tr><td class="text-center">1</td><td colspan="${invoice.emptyStateColspan}">No services found.</td></tr>`}
                </tbody>
              </table>`}

          ${invoice.hideFinancialSummary
            ? ""
            : `<div class="totals">
                ${Number(invoice.surchargeAmount ?? 0) > 0
                  ? `<div class="totals-row"><span>${escapeHtml(invoice.surchargeLabel || "Surcharge")}:</span><span>${escapeHtml(asCurrency(Number(invoice.surchargeAmount ?? 0)))}</span></div>`
                  : ""}
                <div class="totals-row grand-total"><span>Grand Total:</span><span>${escapeHtml(asCurrency(invoice.grandTotal))}</span></div>
              </div>`}

                        <div class="divider"></div>


          <div class="bottom">
            <section class="payment-box">
              <h3>${escapeHtml(invoice.detailBoxTitle)}</h3>
              ${detailRows}
            </section>

            <section class="approval">
              <div><strong>Approved By:</strong></div>
              <div class="name">${escapeHtml(invoice.approvedBy || "RENALOU B. CORDOVA, PTRP, UK-PT")}</div>
              <div class="title">${escapeHtml(invoice.approverTitle || "Chief Operations Officer")}</div>
              <div class="signed"><strong>Date Signed:</strong> ${escapeHtml(formatDate(invoice.dateSigned || printedDate))}</div>
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
