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
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            line-height: 1.35;
            background: #ffffff;
          }
          .sheet { width: 100%; }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            padding-bottom: 10px;
            border-bottom: 2px solid #111827;
          }
          .title { margin: 0; font-size: 20px; letter-spacing: 0.04em; text-transform: uppercase; }
          .subtitle { margin-top: 4px; color: #4b5563; font-size: 11px; }
          .meta { min-width: 260px; text-align: right; color: #374151; }
          .meta div { margin-bottom: 2px; }
          .section { margin-top: 12px; page-break-inside: avoid; break-inside: avoid; }
          .section-title {
            margin: 0 0 6px;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #111827;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 6px;
          }
          .metrics.eod { grid-template-columns: repeat(4, 1fr); }
          .metric {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 7px;
            min-height: 48px;
          }
          .metric-label {
            color: #6b7280;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .metric-value {
            margin-top: 4px;
            font-size: 13px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            vertical-align: top;
            word-break: break-word;
          }
          th {
            background: #f3f4f6;
            color: #374151;
            font-size: 8px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            text-align: left;
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
          .signature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin-top: 22px;
          }
          .signature-line {
            padding-top: 24px;
            border-top: 1px solid #111827;
            text-align: center;
            color: #374151;
            font-size: 9px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="header">
            <div>
              <h1 class="title">Daily Report</h1>
              <div class="subtitle">${escapeHtml(options.selectedDateLabel)}</div>
              <div class="subtitle">${escapeHtml(options.selectedClinicName || "All branches")}</div>
              <div class="subtitle">${escapeHtml(options.selectedClinicScheduleLabel)}</div>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
              <div><strong>Generated By:</strong> ${escapeHtml(options.generatedBy || "--")}</div>
              <div><strong>Income Rows:</strong> ${escapeHtml(summary?.income_entry_count ?? 0)}</div>
              <div><strong>Expense Rows:</strong> ${escapeHtml(summary?.expense_entry_count ?? 0)}</div>
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
        </main>
        <script>
          window.addEventListener("load", () => {
            window.focus();
            window.setTimeout(() => window.print(), 100);
          });
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
