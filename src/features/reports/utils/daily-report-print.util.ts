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

const buildIncomeRows = (report?: DailyIncomeExpenseReport): string => {
  const rows = report?.incomes ?? []
  if (!rows.length) return emptyRow(10, "No billing activity recorded for this date.")

  return rows.map((row, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>
        <strong>${escapeHtml(row.patient_name)}</strong>
        <span>${escapeHtml(row.patient_public_id)}</span>
      </td>
      <td>
        ${escapeHtml(row.pt_service)}
        <span>${escapeHtml(formatTime(row.created_at))}</span>
      </td>
      <td class="center">${escapeHtml(row.billing_route)}</td>
      <td class="right">${escapeHtml(asCurrency(row.payment_amount))}</td>
      <td class="right">${escapeHtml(asCurrency(row.collected_amount))}</td>
      <td>${escapeHtml(row.mode_of_payment || "--")}</td>
      <td>${escapeHtml(row.sponsor_reference || "--")}</td>
      <td class="right">${escapeHtml(asCurrency(row.balance))}</td>
      <td>${escapeHtml(row.invoice_number || row.public_id)}</td>
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
          @import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap");

          @page {
            size: A4 landscape;
            margin: 8mm;
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
            font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
          }
          body {
            padding: 10px;
          }
          .page {
            width: 100%;
            max-width: 286mm;
            margin: 0 auto;
          }
          .sheet {
            width: 100%;
            min-height: 190mm;
            padding: 12px 16px 10px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 6px;
          }
          .logo {
            display: block;
            width: auto;
            height: 72px;
            object-fit: contain;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 2px 8px;
            min-width: 330px;
            max-width: 460px;
            font-size: 10px;
            line-height: 1.25;
            font-weight: 600;
          }
          .meta-grid strong {
            white-space: nowrap;
            font-family: "Bebas Neue", "Open Sans", sans-serif;
            font-size: 14px;
            letter-spacing: 0.06em;
          }
          .meta-grid span {
            min-width: 0;
            word-break: break-word;
          }
          .title-block {
            margin: 0 0 10px;
            text-align: center;
          }
          .title {
            width: 100%;
            margin: 0;
            text-align: center;
            font-family: "Bebas Neue", "Open Sans", sans-serif;
            font-size: 25px;
            line-height: 1.1;
            letter-spacing: 0.06em;
            font-weight: 800;
            color: #111827;
          }
          .title span {
            text-decoration: underline;
            text-decoration-thickness: 1.5px;
            text-underline-offset: 3px;
          }
          .subtitle {
            margin: 4px auto 0;
            max-width: 780px;
            text-align: center;
            color: #374151;
            font-size: 10px;
            line-height: 1.35;
            text-transform: uppercase;
          }
          .section {
            margin-top: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .section-title {
            margin: 0 0 6px;
            color: #111827;
            font-family: "Bebas Neue", "Open Sans", sans-serif;
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
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #ffffff;
            padding: 8px 9px;
            min-height: 50px;
          }
          .metric-label {
            color: #4b5563;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .metric-value {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #d1d5db;
            background: #ffffff;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 4px 6px;
            vertical-align: top;
            word-break: break-word;
          }
          th {
            background: #f4f4f5;
            color: #111827;
            font-family: "Bebas Neue", "Open Sans", sans-serif;
            font-size: 11px;
            letter-spacing: 0.07em;
            font-weight: 800;
            text-transform: uppercase;
            text-align: left;
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
          .footer {
            display: flex;
            justify-content: center;
            gap: 18px;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #d1d5db;
            color: #374151;
            font-size: 9px;
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
            html, body {
              background: #ffffff;
            }
            body {
              padding: 0;
            }
            .page {
              max-width: none;
            }
            .sheet {
              border-radius: 0;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <article class="sheet">
            <header>
              <div class="top">
                <img class="logo" src="/physioave-logo-dark-updated.png" alt="PhysioAve Logo" />
                <div class="meta-grid">
                  <strong>Report Date:</strong><span>${escapeHtml(options.selectedDateLabel)}</span>
                  <strong>Branch:</strong><span>${escapeHtml(options.selectedClinicName || "All branches")}</span>
                  <strong>Generated:</strong><span>${escapeHtml(generatedAt)}</span>
                  <strong>Generated By:</strong><span>${escapeHtml(options.generatedBy || "--")}</span>
                  <strong>Income Rows:</strong><span>${escapeHtml(summary?.income_entry_count ?? 0)}</span>
                  <strong>Expense Rows:</strong><span>${escapeHtml(summary?.expense_entry_count ?? 0)}</span>
                </div>
              </div>

              <div class="title-block">
                <h1 class="title"><span>Daily Report</span></h1>
                <div class="subtitle">${escapeHtml(options.selectedClinicScheduleLabel)}</div>
              </div>
            </header>

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
              <table>
                <thead>
                  <tr>
                    <th style="width: 60%">Primary PT</th>
                    <th style="width: 20%">Pending</th>
                    <th style="width: 20%">Eligible</th>
                  </tr>
                </thead>
                <tbody>${buildPendingPtRows(options.eodReport)}</tbody>
              </table>
            </section>

            <section class="section">
              <h2 class="section-title">Daily Income</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 4%">No.</th>
                    <th style="width: 16%">Patient</th>
                    <th style="width: 15%">PT Service</th>
                    <th style="width: 8%">Sponsor</th>
                    <th style="width: 10%">Payment</th>
                    <th style="width: 10%">Collected</th>
                    <th style="width: 9%">Mode</th>
                    <th style="width: 10%">Ref</th>
                    <th style="width: 8%">Balance</th>
                    <th style="width: 10%">Invoice</th>
                  </tr>
                </thead>
                <tbody>${buildIncomeRows(report)}</tbody>
              </table>
            </section>

            <section class="section">
              <h2 class="section-title">Expenses</h2>
              <table>
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

            <footer class="footer">
              <span>www.physioave.com</span>
              <span>+63-965-571-2455</span>
              <span>admin@physioave.com</span>
            </footer>
          </article>
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
