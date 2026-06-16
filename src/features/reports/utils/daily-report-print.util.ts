import type {PtEndOfDayReport} from "@/features/appointments/api/appointment-phase1.service"
import type {DailyIncomeExpenseReport} from "@/features/billing/api/billing-phase1.service"

interface DailyReportPrintOptions {
  report?: DailyIncomeExpenseReport
  eodReport?: PtEndOfDayReport
  selectedDateLabel: string
  selectedClinicName?: string | null
  selectedClinicScheduleLabel: string
  selectedEodWindowLabel: string
  generatedBy?: string | null
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const asCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number(value ?? 0))

const formatTime = (value?: string | null): string => {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  })
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

const numberValue = (value: unknown): number => Number(value ?? 0)
const SYSTEM_PRINT_FONT_STACK = '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const openPrintWindow = (): Window => {
  const printWindow = window.open("", "_blank")
  if (!printWindow || printWindow.closed) {
    throw new Error("Unable to open print window. Allow pop-ups for this site, then try again.")
  }
  return printWindow
}

const summaryCell = (label: string, value: string): string => `
  <div class="metric">
    <div class="metric-label">${escapeHtml(label)}</div>
    <div class="metric-value">${escapeHtml(value)}</div>
  </div>
`

const emptyRow = (colspan: number, message: string): string => `
  <tr>
    <td colspan="${colspan}" class="empty">${escapeHtml(message)}</td>
  </tr>
`

const getBillingRecordId = (row: { id: number; public_id?: string | null }): string =>
  row.public_id?.trim() || `BILLING-${row.id}`

const buildIncomeRows = (report?: DailyIncomeExpenseReport): string => {
  const rows = report?.incomes ?? []
  if (!rows.length) return emptyRow(8, "No billing activity recorded for this date.")

  return rows.map((row, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>
        <strong>${escapeHtml(row.patient_name)}</strong>
        <span>${escapeHtml(row.patient_public_id)}</span>
      </td>
      <td>
        ${escapeHtml(getBillingRecordId(row))}
        <span>${escapeHtml(formatTime(row.created_at))}</span>
      </td>
      <td class="center">${escapeHtml(row.billing_route)}</td>
      <td class="right">${escapeHtml(asCurrency(row.payment_amount))}</td>
      <td class="right">${escapeHtml(asCurrency(row.collected_amount))}</td>
      <td>${escapeHtml(row.mode_of_payment || "--")}</td>
      <td class="right">${escapeHtml(asCurrency(row.balance))}</td>
    </tr>
  `).join("")
}

const buildExpenseRows = (report?: DailyIncomeExpenseReport): string => {
  const rows = report?.expenses ?? []
  if (!rows.length) return emptyRow(5, "No expense entries recorded for this date.")

  return rows.map((row, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>
        <strong>${escapeHtml(row.item_name)}</strong>
        ${row.notes ? `<span>${escapeHtml(row.notes)}</span>` : ""}
      </td>
      <td class="right">${escapeHtml(asCurrency(row.amount))}</td>
      <td>${escapeHtml(row.created_by_name || "--")}</td>
      <td>${escapeHtml(formatDateTime(row.created_at))}</td>
    </tr>
  `).join("")
}

const buildPendingPtRows = (eodReport?: PtEndOfDayReport): string => {
  const rows = eodReport?.pending_pt_signatures_by_pt ?? []
  if (!rows.length) return emptyRow(3, "No pending PT signatures.")

  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.pt_name || "--")}</td>
      <td class="center">${escapeHtml(numberValue(row.pending_pt_signature_count))}</td>
      <td class="center">${escapeHtml(numberValue(row.eligible_appointment_count))}</td>
    </tr>
  `).join("")
}

export const printDailyReport = (options: DailyReportPrintOptions): void => {
  const printWindow = openPrintWindow()
  const report = options.report
  const summary = report?.summary
  const eodSummary = options.eodReport?.summary
  const generatedAt = new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Daily Report - ${escapeHtml(options.selectedDateLabel)}</title>
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap");

          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          :root {
            --system-font-family: ${SYSTEM_PRINT_FONT_STACK};
            --lgu-accent: #d31d6e;
            --lgu-accent-soft: #f3a8c8;
            --lgu-border: #e5e7eb;
            --lgu-text: #000000;
            --lgu-muted: #374151;
            --lgu-card: #ffffff;
            --lgu-soft-bg: #f8fafc;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            margin: 0;
            padding: 0;
            color: #000000;
            background: #f5f5f5;
            font-family: var(--system-font-family);
            font-size: 11px;
            line-height: 1.5;
          }
          button {
            font: inherit;
          }
          .lgu-invoice-page {
            min-height: 100vh;
            background: #f5f5f5;
            color: var(--lgu-text);
          }
          .lgu-invoice-container {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding: 16px;
          }
          .lgu-invoice-sheet {
            width: 100%;
            max-width: 297mm;
            min-height: 190mm;
            margin: 0 auto;
            padding: 12px 16px 10px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #ffffff;
            color: #000000;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .lgu-invoice-top {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 8px;
          }
          .lgu-invoice-heading {
            width: 100%;
            min-width: 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }
          .lgu-invoice-logo {
            display: block;
            height: 90px;
            width: auto;
            flex-shrink: 0;
            object-fit: contain;
          }
          .lgu-invoice-meta-grid {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 2px 8px;
            min-width: min(320px, 100%);
            max-width: 420px;
            font-size: 12px;
            line-height: 1.25;
            font-weight: 600;
          }
          .lgu-invoice-meta-grid strong {
            white-space: nowrap;
            font-weight: 800;
            font-family: var(--system-font-family);
            letter-spacing: 0.06em;
          }
          .lgu-invoice-meta-grid span {
            min-width: 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .lgu-invoice-title-block {
            width: 100%;
            text-align: center;
          }
          .lgu-invoice-title {
            width: 100%;
            margin: 2px 0 0;
            text-align: center;
            font-family: var(--system-font-family);
            font-size: 24px;
            line-height: 1.1;
            letter-spacing: 0.05em;
            font-weight: 800;
            color: #111827;
          }
          .lgu-invoice-title span {
            text-decoration: underline;
            text-decoration-thickness: 1.5px;
            text-underline-offset: 3px;
          }
          .lgu-invoice-subtitle,
          .subtitle {
            margin: 4px auto 0;
            max-width: 760px;
            text-align: center;
            color: #374151;
            font-size: 11px;
            line-height: 1.35;
            text-transform: uppercase;
          }
          .lgu-invoice-toolbar {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin: 8px 0 10px;
          }
          .print-action {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
          .print-action button {
            min-width: 80px;
            border: 1px solid var(--lgu-accent);
            border-radius: 6px;
            background: var(--lgu-accent);
            color: #ffffff;
            padding: 8px 12px;
            font-weight: 700;
            cursor: pointer;
          }
          .lgu-invoice-details {
            width: 100%;
            margin: 15px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            width: 100%;
            padding: 8px;
            border: 1px solid var(--lgu-accent);
            background: var(--lgu-card);
            font-size: 11px;
            line-height: 1.35;
          }
          .details-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
          }
          .line {
            display: grid;
            grid-template-columns: minmax(115px, 34%) minmax(0, 1fr);
            gap: 6px;
            min-width: 0;
          }
          .label {
            font-weight: 800;
            color: var(--lgu-text);
          }
          .value {
            min-width: 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .lgu-invoice-body {
            width: 100%;
            margin-top: 10px;
          }
          .table-wrap {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
          }
          .section {
            margin-top: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .section-title {
            margin: 0 0 6px;
            color: #111827;
            font-family: var(--system-font-family);
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 7px;
          }
          .metrics.eod { grid-template-columns: repeat(4, 1fr); }
          .metric {
            border: 1px solid var(--lgu-border);
            border-radius: 4px;
            background: #ffffff;
            padding: 6px 7px;
            min-height: 44px;
          }
          .metric-label {
            color: #4b5563;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .metric-value {
            margin-top: 3px;
            font-size: 10px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #d1d5db;
            background: #ffffff;
          }
          .summary-table {
            width: 100%;
            min-width: 0;
            table-layout: fixed;
            border-collapse: collapse;
            margin-top: 6px;
            background: var(--lgu-card);
            font-size: 9px;
            color: var(--lgu-text);
          }
          th, td {
            border: 1px solid var(--lgu-border);
            padding: 4px 5px;
            vertical-align: top;
            overflow-wrap: anywhere;
            word-break: normal;
          }
          th {
            background: var(--lgu-card);
            color: #111827;
            border-top: 3px solid var(--lgu-accent);
            border-bottom: 3px solid var(--lgu-accent);
            font-size: 8px;
            line-height: 1.12;
            font-weight: 800;
            text-align: center;
          }
          td {
            font-size: 9px;
          }
          td span {
            display: block;
            margin-top: 2px;
            color: #6b7280;
            font-size: 8px;
          }
          .right { text-align: right; }
          .center { text-align: center; }
          .empty {
            padding: 14px;
            color: #6b7280;
            text-align: center;
          }
          .totals {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .lgu-invoice-footer {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4px;
            margin-top: 14px;
            padding: 4px 8px;
            border-radius: 0 0 6px 6px;
            background: #1ea5d7;
            color: #fcfcfc;
            font-size: 9px;
            line-height: 1.2;
            font-weight: 700;
            text-align: center;
          }
          .footer-link {
            min-width: 0;
            color: #fcfcfc;
            text-decoration: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin-top: 20px;
          }
          .signature-line {
            padding-top: 24px;
            border-top: 1px solid #111827;
            text-align: center;
            color: #374151;
            font-size: 9px;
          }
          @media print {
            html,
            body {
              width: auto !important;
              min-width: 0 !important;
              max-width: none !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }
            .print-action,
            .lgu-invoice-toolbar {
              display: none !important;
            }
            .lgu-invoice-page {
              width: auto !important;
              min-width: 0 !important;
              max-width: none !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }
            .lgu-invoice-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .lgu-invoice-sheet {
              width: 100% !important;
              min-width: 0 !important;
              max-width: none !important;
              min-height: 0 !important;
              height: auto !important;
              margin: 0 auto !important;
              padding: 5mm !important;
              overflow: visible !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
            .lgu-invoice-heading {
              align-items: center !important;
              gap: 8px !important;
            }
            .lgu-invoice-logo {
              height: 76px !important;
            }
            .lgu-invoice-meta-grid {
              font-size: 9px !important;
              max-width: 380px !important;
            }
            .details-grid {
              width: 100% !important;
              padding: 5px !important;
              gap: 8px !important;
              font-size: 8px !important;
              line-height: 1.2 !important;
              background: #ffffff !important;
              border: 1px solid var(--lgu-accent) !important;
            }
            .table-wrap {
              width: 100% !important;
              max-width: 100% !important;
              overflow: visible !important;
            }
            .summary-table {
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              table-layout: fixed !important;
              font-size: 7px !important;
            }
            .summary-table th,
            .summary-table td {
              padding: 2px 3px !important;
              font-size: inherit !important;
              line-height: 1.12 !important;
              white-space: normal !important;
              word-break: break-word !important;
              overflow-wrap: anywhere !important;
            }
            .section,
            .details-grid,
            .signature-grid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <main class="lgu-invoice-page">
          <section class="lgu-invoice-container">
          <article class="lgu-invoice-sheet" role="article">
            <header class="lgu-invoice-top">
              <div class="lgu-invoice-heading">
                <img class="lgu-invoice-logo" src="/physioave-logo-dark-updated.png" alt="PhysioAve Logo" />
                <div class="lgu-invoice-meta-grid">
                  <strong>Report Date:</strong><span>${escapeHtml(options.selectedDateLabel)}</span>
                  <strong>Branch:</strong><span>${escapeHtml(options.selectedClinicName || "All branches")}</span>
                  <strong>Generated:</strong><span>${escapeHtml(generatedAt)}</span>
                  <strong>Generated By:</strong><span>${escapeHtml(options.generatedBy || "--")}</span>
                </div>
              </div>

              <div class="lgu-invoice-title-block">
                <h1 class="lgu-invoice-title"><span>Daily Report</span></h1>
              </div>
            </header>

            <div class="lgu-invoice-toolbar">
              <div class="print-action">
                <button onclick="window.print()">Print / Save PDF</button>
              </div>
            </div>

            <div class="lgu-invoice-details">
              <div class="details-grid">
                <div class="details-group">
                  <div class="line"><span class="label">Gross Charges:</span><span class="value">${escapeHtml(asCurrency(summary?.gross_income ?? 0))}</span></div>
                  <div class="line"><span class="label">Cash Collected:</span><span class="value">${escapeHtml(asCurrency(summary?.cash_collected ?? 0))}</span></div>
                  <div class="line"><span class="label">Outstanding:</span><span class="value">${escapeHtml(asCurrency(summary?.outstanding_balance ?? 0))}</span></div>
                </div>
                <div class="details-group">
                  <div class="line"><span class="label">Expenses:</span><span class="value">${escapeHtml(asCurrency(summary?.expense_total ?? 0))}</span></div>
                  <div class="line"><span class="label">Net Cash:</span><span class="value">${escapeHtml(asCurrency(summary?.net_cash ?? 0))}</span></div>
                  <div class="line"><span class="label">EOD Window:</span><span class="value">${escapeHtml(options.selectedEodWindowLabel || "No branch EOD window loaded.")}</span></div>
                </div>
              </div>
            </div>

            <div class="lgu-invoice-body">
            <section class="section">
              <h2 class="section-title">Finance Summary</h2>
              <div class="metrics">
                ${summaryCell("Gross Charges", asCurrency(summary?.gross_income ?? 0))}
                ${summaryCell("Cash Collected", asCurrency(summary?.cash_collected ?? 0))}
                ${summaryCell("Outstanding", asCurrency(summary?.outstanding_balance ?? 0))}
                ${summaryCell("Unbilled Appts", String(summary?.unbilled_appointment_count ?? 0))}
                ${summaryCell("Incomplete Bills", `${summary?.incomplete_billing_count ?? 0} / ${asCurrency(summary?.incomplete_billing_balance ?? 0)}`)}
                ${summaryCell("Expenses", asCurrency(summary?.expense_total ?? 0))}
                ${summaryCell("Net Income", asCurrency((summary?.gross_income ?? 0) - (summary?.expense_total ?? 0)))}
                ${summaryCell("Net Cash", asCurrency(summary?.net_cash ?? 0))}
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">End-of-Day Summary</h2>
              <div class="subtitle">${escapeHtml(options.selectedEodWindowLabel || "No branch EOD window loaded.")}</div>
              <div class="metrics eod">
                ${summaryCell("EOD Status", options.eodReport?.eod_report_generated ? "Generated" : "Waiting")}
                ${summaryCell("Pending PT Signatures", String(eodSummary?.pending_pt_signature_count ?? 0))}
                ${summaryCell("Billing Cleared", `${eodSummary?.billing_cleared_appointments ?? 0}/${eodSummary?.eligible_appointments ?? 0}`)}
                ${summaryCell("Eligible Appts", String(eodSummary?.eligible_appointments ?? 0))}
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">Pending PT Signature Blockers</h2>
              <div class="table-wrap">
              <table class="summary-table">
                <thead>
                  <tr>
                    <th style="width: 60%">Primary PT</th>
                    <th style="width: 20%">Pending</th>
                    <th style="width: 20%">Eligible</th>
                  </tr>
                </thead>
                <tbody>${buildPendingPtRows(options.eodReport)}</tbody>
              </table>
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">Daily Income</h2>
              <div class="table-wrap">
              <table class="summary-table income-table">
                <thead>
                  <tr>
                    <th style="width: 4%">No.</th>
                    <th style="width: 22%">Patient</th>
                    <th style="width: 18%">Billing Record ID</th>
                    <th style="width: 10%">Billing Type</th>
                    <th style="width: 12%">Price</th>
                    <th style="width: 12%">Collected</th>
                    <th style="width: 12%">Mode of Payment</th>
                    <th style="width: 10%">Balance</th>
                  </tr>
                </thead>
                <tbody>${buildIncomeRows(report)}</tbody>
              </table>
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">Expenses</h2>
              <div class="table-wrap">
              <table class="summary-table">
                <thead>
                  <tr>
                    <th style="width: 5%">No.</th>
                    <th style="width: 45%">Item</th>
                    <th style="width: 15%">Amount</th>
                    <th style="width: 18%">Created By</th>
                    <th style="width: 17%">Created At</th>
                  </tr>
                </thead>
                <tbody>${buildExpenseRows(report)}</tbody>
              </table>
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">Daily Totals</h2>
              <div class="totals">
                ${summaryCell("Cash Collected", asCurrency(summary?.cash_collected ?? 0))}
                ${summaryCell("Expense Total", asCurrency(summary?.expense_total ?? 0))}
                ${summaryCell("Net Cash", asCurrency(summary?.net_cash ?? 0))}
              </div>
            </section>

            <section class="signature-grid">
              <div class="signature-line">Prepared By</div>
              <div class="signature-line">Reviewed By</div>
              <div class="signature-line">Approved By</div>
            </section>

            </div>

            <footer class="lgu-invoice-footer" role="contentinfo">
              <a href="https://www.physioave.com" class="footer-link">www.physioave.com</a>
              <a href="tel:+639655712455" class="footer-link">+63-965-571-2455</a>
              <a href="mailto:admin@physioave.com" class="footer-link">admin@physioave.com</a>
            </footer>
          </article>
          </section>
        </main>
        <script>
          window.addEventListener("load", () => {
            window.focus();
            window.setTimeout(() => window.print(), 350);
          });
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
