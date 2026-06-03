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
      :root {
        --invoice-accent: #d31d6e;
        --invoice-accent-soft: #f3a8c8;
        --invoice-border: #e5e7eb;
        --invoice-text: #000000;
        --invoice-muted: #374151;
        --invoice-card: #ffffff;
        --invoice-footer: #1ea5d7;
      }

      @page {
        size: auto;
        margin: 8mm;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      html,
      body {
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
        width: 100%;
        max-width: 210mm;
        min-height: auto;
        margin: 0 auto;
        padding: 12px 16px 10px;
        border: 1px solid #d1d5db;
        background: #ffffff;
        font-family: "Canva Sans", "Segoe UI", Tahoma, Arial, sans-serif;
        color: #000000;
      }

      /* =========================
         HEADER - SAME STYLE AS FIRST PRINTABLE
      ========================= */

      .invoice-top {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
      }

      .invoice-heading {
        width: 100%;
        min-width: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .logo {
        max-height: 60px;
        width: auto;
        flex-shrink: 0;
      }

      .invoice-title-block {
        width: 100%;
        text-align: center;
      }

      .invoice-title {
        width: 100%;
        margin: 2px 0 0;
        text-align: center;
        font-size: clamp(20px, 2.2vw, 24px);
        line-height: 1.1;
        letter-spacing: 0.05em;
        font-weight: 800;
        color: #111827;
        font-family: "Montserrat", sans-serif;
      }

      .invoice-title span {
        text-decoration: underline;
        text-decoration-thickness: 1.5px;
        text-underline-offset: 3px;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 2px 8px;
        min-width: min(320px, 100%);
        max-width: 420px;
        font-size: 12px;
        line-height: 1.25;
        font-family: "Montserrat", sans-serif;
        font-weight: 600;
      }

      .meta-grid strong {
        white-space: nowrap;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .meta-grid span {
        min-width: 0;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      /* =========================
         DETAILS
      ========================= */

      .patient-doctor-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 8px;
        padding: 8px 10px;
        border: 1px solid var(--invoice-accent);
        background: #ffffff;
        font-size: 12px;
        line-height: 1.35;
      }

      .patient-doctor-grid > div {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .line {
        display: grid;
        grid-template-columns: minmax(100px, 32%) minmax(0, 1fr);
        gap: 6px;
        min-width: 0;
      }

      .label {
        font-family: "Montserrat", sans-serif;
        font-weight: 700;
        color: #000000;
        white-space: normal;
      }

      .divider {
        border-top: 3px solid var(--invoice-accent);
        margin-top: 8px;
        margin-bottom: 4px;
      }

      /* =========================
         TABLE
      ========================= */

      table {
        width: 100%;
        min-width: 0;
        table-layout: fixed;
        border-collapse: collapse;
        margin-top: 6px;
        background: #ffffff;
        font-family: "Canva Sans", "Segoe UI", Tahoma, Arial, sans-serif;
        font-size: 11px;
        color: #000000;
      }

      th,
      td {
        padding: 4px 5px;
        vertical-align: top;
        border: 1px solid var(--invoice-border);
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      th {
        text-align: center;
        font-family: "Montserrat", sans-serif;
        font-weight: 800;
        font-size: 10px;
        line-height: 1.12;
        background: #ffffff;
        border-top: 3px solid var(--invoice-accent);
        border-bottom: 3px solid var(--invoice-accent);
      }

      tbody tr {
        background: #ffffff;
      }

      tbody tr.item-group-start td {
        border-top: 2px solid var(--invoice-accent);
      }

      tbody tr.line-item-child td {
        border-top: 1px dashed var(--invoice-accent-soft);
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
        border-bottom: 2px solid var(--invoice-accent);
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

      /* =========================
         PROFILE / CUSTOM BODY SUPPORT
      ========================= */

      .profile-summary {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 12px;
        align-items: center;
        margin-top: 8px;
        padding: 10px;
        border: 1px solid var(--invoice-accent);
        background: #ffffff;
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
        border-top: 3px solid var(--invoice-accent);
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
        border-bottom: 1px solid var(--invoice-accent-soft);
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

      /* =========================
         TOTALS
      ========================= */

      .totals {
        margin-top: 6px;
        margin-left: auto;
        width: min(280px, 100%);
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 3px 0;
        font-size: 12px;
        font-weight: 700;
        font-family: "Montserrat", sans-serif;
      }

      .grand-total {
        color: var(--invoice-accent);
        font-size: 13px;
        font-weight: 900;
      }

      /* =========================
         BOTTOM
      ========================= */

      .bottom {
        width: 100%;
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .payment-box {
        flex: 1;
        min-width: 0;
        padding: 10px;
        border: 1px solid var(--invoice-border);
        border-radius: 10px;
        background: #ffffff;
        font-size: 12px;
        font-family: "Canva Sans", sans-serif;
      }

      .payment-box h3 {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 800;
        font-family: "Montserrat", sans-serif;
      }

      .approval-card {
        width: min(320px, 100%);
        padding: 14px 16px;
        border: 1px solid var(--invoice-border);
        border-radius: 10px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        text-align: left;
        font-family: "Canva Sans", sans-serif;
      }

      .approval-label {
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #374151;
      }

      .approval-name {
        font-size: 13px;
        font-weight: 800;
        color: #111827;
        text-transform: uppercase;
        font-family: "Montserrat", sans-serif;
      }

      .approval-line {
        width: min(260px, 100%);
        margin: 2px auto;
        border-bottom: 1px solid #111827;
      }

      .approval-title {
        margin-top: 2px;
        font-size: 12px;
        color: #4b5563;
      }

      .approval-signed {
        margin-top: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #374151;
      }

      /* =========================
         FOOTER
      ========================= */

      .footer {
        margin-top: 8px;
        background: var(--invoice-footer);
        color: #0f172a;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        padding: 4px 8px;
        font-size: 11px;
        font-family: "Montserrat", sans-serif;
        font-weight: 600;
      }

      .footer span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      @media screen and (max-width: 768px) {
        .invoice-heading,
        .bottom {
          flex-direction: column;
        }

        .meta-grid {
          width: 100%;
          max-width: none;
        }

        .patient-doctor-grid,
        .profile-grid {
          grid-template-columns: 1fr;
        }

        .footer {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        body {
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .invoice-sheet {
          width: 100% !important;
          max-width: none !important;
          min-height: 0 !important;
          height: auto !important;
          margin: 0 auto !important;
          padding: 5mm !important;
          border: none !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        .invoice-top {
          gap: 4px !important;
          margin-bottom: 5px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .invoice-heading {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          gap: 8px !important;
        }

        .logo {
          max-height: 42px !important;
        }

        .invoice-title {
          margin: 1px 0 0 !important;
          font-size: 16px !important;
          line-height: 1.1 !important;
          text-align: center !important;
        }

        .meta-grid {
          gap: 1px 5px !important;
          min-width: 180px !important;
          max-width: 260px !important;
          width: auto !important;
          font-size: 8px !important;
          line-height: 1.15 !important;
        }

        .patient-doctor-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 6px 10px !important;
          padding: 5px !important;
          font-size: 8.5px !important;
          line-height: 1.18 !important;
          border: 1px solid var(--invoice-accent) !important;
          background: #ffffff !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .line {
          grid-template-columns: 95px minmax(0, 1fr) !important;
          gap: 4px !important;
        }

        .divider {
          border-top: 2px solid var(--invoice-accent) !important;
          margin-top: 5px !important;
          margin-bottom: 3px !important;
        }

        table {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          margin-top: 4px !important;
          font-size: 9px !important;
        }

        th,
        td {
          padding: 3px 4px !important;
          font-size: inherit !important;
          line-height: 1.15 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          vertical-align: top !important;
        }

        th {
          font-size: 9px !important;
          border-top: 2px solid var(--invoice-accent) !important;
          border-bottom: 2px solid var(--invoice-accent) !important;
        }

        .profile-summary,
        .profile-section,
        .bottom,
        .payment-box,
        .approval-card {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .profile-summary {
          border: 1px solid var(--invoice-accent) !important;
          background: #ffffff !important;
        }

        .totals {
          margin-top: 5px !important;
          width: 250px !important;
        }

        .totals-row {
          font-size: 9px !important;
          padding: 2px 0 !important;
        }

        .grand-total {
          font-size: 9px !important;
        }

        .bottom {
          margin-top: 8px !important;
          gap: 8px !important;
        }

        .payment-box {
          padding: 8px !important;
          border-radius: 0 !important;
          font-size: 8px !important;
        }

        .payment-box h3 {
          font-size: 10px !important;
        }

        .approval-card {
          width: 260px !important;
          padding: 8px 10px !important;
          border-radius: 0 !important;
        }

        .approval-label,
        .approval-title,
        .approval-signed {
          font-size: 8px !important;
        }

        .approval-name {
          font-size: 9px !important;
        }

        .approval-line {
          width: 210px !important;
        }

        .footer {
          margin-top: 6px !important;
          padding: 3px 6px !important;
          font-size: 7.5px !important;
          background: var(--invoice-footer) !important;
          background-color: var(--invoice-footer) !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    </style>
  </head>

  <body>
    <section class="invoice-sheet">
      <header class="invoice-top">
        <div class="invoice-heading">
          <img class="logo" src="/app-logo.png" alt="PhysioAve" />

          <div class="meta-grid">
            ${topMetaRows}
          </div>
        </div>

        <div class="invoice-title-block">
          <h1 class="invoice-title">
            <span>${escapeHtml(invoice.headerTitle || "Billing Summary")}</span>
          </h1>
        </div>
      </header>

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
              <div class="line"><span class="label">Physical Therapist:</span><span>${escapeHtml(invoice.physicalTherapist || "N/A")}</span></div>
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

        <section class="approval-card">
          <div class="approval-label">
            Approved by:
          </div>

          <div class="approval-name">
            ${escapeHtml(invoice.approvedBy || "RENALOU B. CORDOVA, PTRP, UK-PT")}
          </div>

          <div class="approval-line"></div>

          <div class="approval-title">
            ${escapeHtml(invoice.approverTitle || "Chief Operations Officer")}
          </div>

          <div class="approval-signed">
            Date Signed: ${escapeHtml(formatDate(invoice.dateSigned || printedDate))}
          </div>
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
