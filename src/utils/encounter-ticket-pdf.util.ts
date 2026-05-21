export interface EncounterTicketPdfCard {
  slipNumber: string
  encounterTicketId?: number | string
  patientName: string
  providerName: string
  serviceName: string
  specialtyName?: string
  specialtyIsActive?: boolean
  treatmentAreaName?: string
  treatmentAreaColor?: string
  treatmentAreaIsActive?: boolean
  billingRoute: string
  attendanceStatus: string
  attendedAt: string
  signedOffAt: string
  lockedAt?: string
  appointmentId?: number | string
  billingId?: number | string
  activeBillingPackageLabel?: string
  activeBillingPackageSource?: string
  deductionSummary: string
  signatureDataUrl?: string
  ptSignatureDataUrl?: string
  sessionSequenceLabel?: string
}

export interface EncounterTicketPdfOptions {
  title?: string
  subtitle?: string
  fileName?: string
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

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

const normalizeRouteKey = (route: string): "HMO" | "LGU" | "SELF_PAY" | "OTHER" => {
  const normalized = String(route ?? "").trim().toUpperCase()
  if (normalized.includes("HMO")) return "HMO"
  if (normalized.includes("LGU")) return "LGU"
  if (normalized.includes("SELF")) return "SELF_PAY"
  return "OTHER"
}

const getRoutePalette = (route: string): { accent: string; pill: string; soft: string } => {
  const key = normalizeRouteKey(route)
  if (key === "HMO") {
    return {accent: "#0f766e", pill: "#ccfbf1", soft: "#f0fdfa"}
  }
  if (key === "LGU") {
    return {accent: "#166534", pill: "#dcfce7", soft: "#f0fdf4"}
  }
  if (key === "SELF_PAY") {
    return {accent: "#b45309", pill: "#fef3c7", soft: "#fffbeb"}
  }
  return {accent: "#334155", pill: "#e2e8f0", soft: "#f8fafc"}
}

const summarizeRouteCounts = (cards: EncounterTicketPdfCard[]): string =>
  Object.entries(cards.reduce<Record<string, number>>((acc, card) => {
    const route = card.billingRoute || "Other"
    acc[route] = (acc[route] ?? 0) + 1
    return acc
  }, {}))
    .map(([route, count]) => `${route}: ${count}`)
    .join(" | ")

const safeSignatureImage = (value?: string): string =>
  value?.startsWith("data:image/") ? value : ""

const ensurePrintWindowIsUsable = (printWindow: Window | null): Window => {
  if (!printWindow || printWindow.closed) {
    throw new Error("Please allow pop-ups so the PDF export window can open.")
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
    throw new Error("The PDF export window could not be rendered. Please try the export again.")
  }
}

export function openEncounterTicketPdfWindow(title = "Encounter Ticket PDF"): Window {
  const printWindow = ensurePrintWindowIsUsable(window.open("", "_blank"))

  writePrintWindowDocument(printWindow, `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <div style="font-size: 14px; color: #475569;">Preparing encounter ticket PDF...</div>
      </body>
    </html>
  `)
  return printWindow
}

export function renderEncounterTicketPdfWindow(
  printWindow: Window,
  cards: EncounterTicketPdfCard[],
  options: EncounterTicketPdfOptions = {}
): void {
  if (!cards.length) {
    throw new Error("No locked encounter tickets were found to export.")
  }

  const title = options.title?.trim() || "Encounter Ticket PDF"
  const subtitle = options.subtitle?.trim() || "Attendance / Treatment Card Export"
  const fileName = options.fileName?.trim() || title
  const generatedAt = new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })

  const coverPage = `
    <section class="cover-page print-page">
      <div class="cover-shell">
        <div class="cover-eyebrow">PhysioAve</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        <div class="cover-grid">
          <div class="cover-card">
            <div class="cover-label">Generated</div>
            <div class="cover-value">${escapeHtml(generatedAt)}</div>
          </div>
          <div class="cover-card">
            <div class="cover-label">Total Tickets</div>
            <div class="cover-value">${cards.length}</div>
          </div>
          <div class="cover-card cover-card-wide">
            <div class="cover-label">Route Mix</div>
            <div class="cover-value">${escapeHtml(summarizeRouteCounts(cards) || "N/A")}</div>
          </div>
        </div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Slip No.</th>
              <th>Patient</th>
              <th>Route</th>
              <th>Signed</th>
            </tr>
          </thead>
          <tbody>
            ${cards.map((card) => `
              <tr>
                <td>${escapeHtml(card.slipNumber)}</td>
                <td>${escapeHtml(card.patientName)}</td>
                <td>${escapeHtml(card.billingRoute)}</td>
                <td>${escapeHtml(formatDateTime(card.signedOffAt))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `

  const pages = cards.map((card) => {
    const palette = getRoutePalette(card.billingRoute)
    const signatureSrc   = safeSignatureImage(card.signatureDataUrl)
    const ptSignatureSrc = safeSignatureImage(card.ptSignatureDataUrl)
    return `
      <section class="print-page">
        <article class="ticket-shell" style="--ticket-accent:${palette.accent}; --ticket-pill:${palette.pill}; --ticket-soft:${palette.soft};">
          <div class="ticket-hero">
            <div>
              <div class="ticket-brand">PhysioAve Attendance / Treatment Card</div>
              <div class="ticket-title">${escapeHtml(card.slipNumber)}</div>
              <div class="ticket-meta">Locked proof of attendance for billing and monthly invoice support</div>
            </div>
            <div class="ticket-badge">${escapeHtml(card.billingRoute)}</div>
          </div>

          <div class="ticket-grid">
            <div class="ticket-panel">
              <div class="ticket-label">Patient</div>
              <div class="ticket-value">${escapeHtml(card.patientName)}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Provider</div>
              <div class="ticket-value">${escapeHtml(card.providerName)}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Encounter Ticket ID</div>
              <div class="ticket-value">${escapeHtml(card.encounterTicketId == null ? "N/A" : `ET-${card.encounterTicketId}`)}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Service Rendered</div>
              <div class="ticket-value">${escapeHtml(card.serviceName)}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Session Sequence</div>
              <div class="ticket-value">${escapeHtml(card.sessionSequenceLabel || "N/A")}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Specialty</div>
              <div class="ticket-value">${escapeHtml(card.specialtyName || "N/A")}</div>
              ${card.specialtyName && card.specialtyIsActive === false
                ? `<div class="ticket-note">Inactive now, preserved for historical audit.</div>`
                : ""}
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Treatment Area</div>
              <div class="ticket-value">
                ${card.treatmentAreaColor
                  ? `<span class="room-dot" style="background:${escapeHtml(card.treatmentAreaColor)};"></span>`
                  : ""}
                ${escapeHtml(card.treatmentAreaName || "N/A")}
              </div>
              ${card.treatmentAreaName && card.treatmentAreaIsActive === false
                ? `<div class="ticket-note">Inactive now, preserved for historical audit.</div>`
                : ""}
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Billing Package Link</div>
              <div class="ticket-value">${escapeHtml(card.activeBillingPackageLabel || "No active billing package linked")}</div>
              ${card.activeBillingPackageSource
                ? `<div class="ticket-note">${escapeHtml(card.activeBillingPackageSource)}</div>`
                : ""}
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Attendance</div>
              <div class="ticket-value">${escapeHtml(card.attendanceStatus)}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Attended At</div>
              <div class="ticket-value">${escapeHtml(formatDateTime(card.attendedAt))}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Signed Off</div>
              <div class="ticket-value">${escapeHtml(formatDateTime(card.signedOffAt))}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Locked At</div>
              <div class="ticket-value">${escapeHtml(formatDateTime(card.lockedAt || card.signedOffAt))}</div>
            </div>
            <div class="ticket-panel">
              <div class="ticket-label">Linked Billing</div>
              <div class="ticket-value">Billing #${escapeHtml(card.billingId || "N/A")}</div>
            </div>
          </div>

          <div class="deduction-banner">
            <div class="ticket-label">Session / Authorization Note</div>
            <div class="ticket-value">${escapeHtml(card.deductionSummary)}</div>
          </div>

          <div class="ticket-footer">
            <div class="signature-panel">
              <div class="ticket-label">Patient Signature</div>
              ${signatureSrc
                ? `<img src="${signatureSrc}" alt="Patient signature" class="signature-image" />`
                : `<div class="signature-missing">No patient signature stored.</div>`}
            </div>
            <div class="signature-panel">
              <div class="ticket-label">Physical Therapist Signature</div>
              ${ptSignatureSrc
                ? `<img src="${ptSignatureSrc}" alt="PT signature" class="signature-image" />`
                : `<div class="signature-missing">No PT signature stored.</div>`}
            </div>
            <div class="footnote-panel footnote-full">
              <div class="ticket-label">Record Notes</div>
              <div class="footnote-copy">
                Appointment #${escapeHtml(card.appointmentId || "N/A")} is linked to this locked attendance record.
                This document is intended as proof of attendance for HMO and LGU monthly invoice packets.
              </div>
            </div>
          </div>
        </article>
      </section>
    `
  }).join("")

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(fileName)}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
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
            counter-reset: page;
          }

          .print-page {
            page-break-after: always;
            break-after: page;
            min-height: calc(297mm - 24mm);
          }

          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .cover-page {
            display: flex;
            align-items: stretch;
          }

          .cover-shell {
            width: 100%;
            min-height: 100%;
            border: 2px solid #e11d48;
            border-radius: 28px;
            background: linear-gradient(135deg, #fff1f2, #f8fafc 42%, #fdf2f8);
            padding: 28px;
          }

          .cover-eyebrow {
            font-size: 12px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #9f1239;
            font-weight: 700;
          }

          .cover-shell h1 {
            margin: 10px 0 6px;
            font-size: 30px;
            line-height: 1.1;
          }

          .cover-shell p {
            margin: 0 0 20px;
            color: #475569;
            font-size: 14px;
          }

          .cover-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }

          .cover-card {
            border: 1px solid #fbcfe8;
            border-radius: 18px;
            background: rgba(255,255,255,0.78);
            padding: 14px;
          }

          .cover-card-wide {
            grid-column: span 1;
          }

          .cover-label,
          .ticket-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #64748b;
            margin-bottom: 6px;
          }

          .cover-value,
          .ticket-value {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.45;
          }

          .ticket-value {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 22px;
          }

          .ticket-note {
            margin-top: 6px;
            font-size: 11px;
            line-height: 1.5;
            color: #64748b;
          }

          .room-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 999px;
            border: 1px solid rgba(15, 23, 42, 0.12);
            flex: 0 0 auto;
          }

          .summary-table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 18px;
            background: white;
          }

          .summary-table th,
          .summary-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            font-size: 12px;
          }

          .summary-table thead th {
            background: #fdf2f8;
            color: #9f1239;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .ticket-shell {
            min-height: 100%;
            border-radius: 28px;
            border: 2px solid var(--ticket-accent);
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.92), rgba(255,255,255,0.82)),
              linear-gradient(140deg, var(--ticket-soft), white 48%, var(--ticket-soft));
            padding: 24px;
            position: relative;
            overflow: hidden;
          }

          .ticket-shell::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 12px;
            background: var(--ticket-accent);
          }

          .ticket-hero {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-left: 8px;
          }

          .ticket-brand {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.28em;
            color: var(--ticket-accent);
            font-weight: 700;
          }

          .ticket-title {
            margin-top: 10px;
            font-size: 28px;
            font-weight: 800;
            line-height: 1.1;
          }

          .ticket-meta {
            margin-top: 8px;
            color: #475569;
            font-size: 13px;
          }

          .ticket-badge {
            padding: 10px 14px;
            border-radius: 999px;
            background: var(--ticket-pill);
            color: var(--ticket-accent);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .ticket-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 16px;
            padding-left: 8px;
          }

          .ticket-panel,
          .deduction-banner,
          .signature-panel,
          .footnote-panel {
            border: 1px solid rgba(148, 163, 184, 0.35);
            border-radius: 18px;
            background: rgba(255,255,255,0.88);
            padding: 14px;
          }

          .deduction-banner {
            margin: 0 0 16px 8px;
            background: linear-gradient(135deg, var(--ticket-pill), rgba(255,255,255,0.92));
            border-color: rgba(15, 23, 42, 0.08);
          }

          .ticket-footer {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            padding-left: 8px;
          }

          .footnote-full {
            grid-column: 1 / -1;
          }

          .signature-image {
            display: block;
            width: 100%;
            max-height: 165px;
            object-fit: contain;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            background: white;
            padding: 8px;
          }

          .signature-missing {
            min-height: 120px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            border: 1px dashed #cbd5e1;
            background: #f8fafc;
            color: #64748b;
            font-size: 13px;
          }

          .footnote-copy {
            font-size: 13px;
            line-height: 1.6;
            color: #334155;
          }
        </style>
      </head>
      <body>
        ${cards.length > 1 ? coverPage : ""}
        ${pages}
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

// ── Compact bulk export (2 cards per A4 page) ─────────────────────────────────

export function renderEncounterTicketBulkPdfWindow(
  printWindow: Window,
  cards: EncounterTicketPdfCard[],
  options: EncounterTicketPdfOptions = {}
): void {
  if (!cards.length) {
    throw new Error("No locked encounter tickets were found to export.")
  }

  const title = options.title?.trim() || "Encounter Ticket Bulk Export"
  const subtitle = options.subtitle?.trim() || "Compact attendance record export"
  const fileName = options.fileName?.trim() || title
  const generatedAt = new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })

  // Pair cards: [[c1,c2],[c3,c4],...]
  const pairs: Array<[EncounterTicketPdfCard, EncounterTicketPdfCard | undefined]> = []
  for (let i = 0; i < cards.length; i += 2) {
    pairs.push([cards[i], cards[i + 1]])
  }

  const renderCompactCard = (card: EncounterTicketPdfCard, divider: boolean): string => {
    const palette = getRoutePalette(card.billingRoute)
    const signatureSrc   = safeSignatureImage(card.signatureDataUrl)
    const ptSignatureSrc = safeSignatureImage(card.ptSignatureDataUrl)
    return `
      <article class="compact-card" style="--ticket-accent:${palette.accent}; --ticket-pill:${palette.pill}; --ticket-soft:${palette.soft};">
        <div class="compact-hero">
          <div class="compact-hero-left">
            <div class="compact-brand">PhysioAve Attendance Record</div>
            <div class="compact-title">${escapeHtml(card.slipNumber)}</div>
          </div>
          <div class="ticket-badge">${escapeHtml(card.billingRoute)}</div>
        </div>

        <div class="compact-grid">
          <div class="compact-panel">
            <div class="ticket-label">Patient</div>
            <div class="ticket-value">${escapeHtml(card.patientName)}</div>
          </div>
          <div class="compact-panel">
            <div class="ticket-label">Physical Therapist</div>
            <div class="ticket-value">${escapeHtml(card.providerName)}</div>
          </div>
          <div class="compact-panel">
            <div class="ticket-label">Service Rendered</div>
            <div class="ticket-value">${escapeHtml(card.serviceName)}</div>
          </div>
          <div class="compact-panel">
            <div class="ticket-label">Session</div>
            <div class="ticket-value">${escapeHtml(card.sessionSequenceLabel || "N/A")}</div>
          </div>
          <div class="compact-panel">
            <div class="ticket-label">Attended At</div>
            <div class="ticket-value">${escapeHtml(formatDateTime(card.attendedAt))}</div>
          </div>
          <div class="compact-panel">
            <div class="ticket-label">Signed Off</div>
            <div class="ticket-value">${escapeHtml(formatDateTime(card.signedOffAt))}</div>
          </div>
        </div>

        <div class="compact-sigs">
          <div class="signature-panel">
            <div class="ticket-label">Patient Signature</div>
            ${signatureSrc
              ? `<img src="${signatureSrc}" alt="Patient signature" class="compact-sig-image" />`
              : `<div class="compact-sig-missing">No patient signature stored.</div>`}
          </div>
          <div class="signature-panel">
            <div class="ticket-label">Physical Therapist Signature</div>
            ${ptSignatureSrc
              ? `<img src="${ptSignatureSrc}" alt="PT signature" class="compact-sig-image" />`
              : `<div class="compact-sig-missing">No PT signature stored.</div>`}
          </div>
        </div>
      </article>
      ${divider ? `<div class="pair-divider"></div>` : ""}
    `
  }

  const pages = pairs.map(([a, b]) => `
    <section class="print-page">
      ${renderCompactCard(a, !!b)}
      ${b ? renderCompactCard(b, false) : ""}
    </section>
  `).join("")

  const coverPage = `
    <section class="print-page">
      <div class="cover-shell">
        <div class="cover-eyebrow">PhysioAve</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        <div class="cover-grid">
          <div class="cover-card">
            <div class="cover-label">Generated</div>
            <div class="cover-value">${escapeHtml(generatedAt)}</div>
          </div>
          <div class="cover-card">
            <div class="cover-label">Total Tickets</div>
            <div class="cover-value">${cards.length}</div>
          </div>
          <div class="cover-card">
            <div class="cover-label">Route Mix</div>
            <div class="cover-value">${escapeHtml(summarizeRouteCounts(cards) || "N/A")}</div>
          </div>
        </div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Slip No.</th>
              <th>Patient</th>
              <th>PT</th>
              <th>Service</th>
              <th>Attended At</th>
              <th>Signed Off</th>
            </tr>
          </thead>
          <tbody>
            ${cards.map((card) => `
              <tr>
                <td>${escapeHtml(card.slipNumber)}</td>
                <td>${escapeHtml(card.patientName)}</td>
                <td>${escapeHtml(card.providerName)}</td>
                <td>${escapeHtml(card.serviceName)}</td>
                <td>${escapeHtml(formatDateTime(card.attendedAt))}</td>
                <td>${escapeHtml(formatDateTime(card.signedOffAt))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(fileName)}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; background: #f8fafc; }

          .print-page {
            page-break-after: always;
            break-after: page;
            min-height: calc(297mm - 20mm);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .print-page:last-child { page-break-after: auto; break-after: auto; }

          /* ── Cover ── */
          .cover-shell {
            width: 100%; min-height: 100%;
            border: 2px solid #e11d48; border-radius: 28px;
            background: linear-gradient(135deg, #fff1f2, #f8fafc 42%, #fdf2f8);
            padding: 28px;
          }
          .cover-eyebrow { font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: #9f1239; font-weight: 700; }
          .cover-shell h1 { margin: 10px 0 6px; font-size: 30px; line-height: 1.1; }
          .cover-shell p { margin: 0 0 20px; color: #475569; font-size: 14px; }
          .cover-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 20px; }
          .cover-card { border: 1px solid #fbcfe8; border-radius: 18px; background: rgba(255,255,255,0.78); padding: 14px; }
          .cover-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #64748b; margin-bottom: 6px; }
          .cover-value { font-size: 15px; font-weight: 600; }
          .summary-table { width: 100%; border-collapse: collapse; border-radius: 18px; overflow: hidden; background: white; }
          .summary-table th, .summary-table td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 12px; }
          .summary-table thead th { background: #fdf2f8; color: #9f1239; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }

          /* ── Compact card ── */
          .compact-card {
            flex: 1;
            border-radius: 22px;
            border: 2px solid var(--ticket-accent);
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.92), rgba(255,255,255,0.82)),
              linear-gradient(140deg, var(--ticket-soft), white 48%, var(--ticket-soft));
            padding: 14px 18px 14px 26px;
            position: relative;
            overflow: hidden;
          }
          .compact-card::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 10px;
            background: var(--ticket-accent);
          }

          .compact-hero {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .compact-brand { font-size: 10px; text-transform: uppercase; letter-spacing: 0.26em; color: var(--ticket-accent); font-weight: 700; }
          .compact-title { font-size: 20px; font-weight: 800; line-height: 1.1; margin-top: 4px; }

          .ticket-badge {
            padding: 7px 12px; border-radius: 999px;
            background: var(--ticket-pill); color: var(--ticket-accent);
            font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
          }

          .compact-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 10px;
          }
          .compact-panel {
            border: 1px solid rgba(148,163,184,0.35);
            border-radius: 14px;
            background: rgba(255,255,255,0.88);
            padding: 10px 12px;
          }
          .ticket-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #64748b; margin-bottom: 4px; }
          .ticket-value { font-size: 13px; font-weight: 600; line-height: 1.35; }

          .compact-sigs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .signature-panel {
            border: 1px solid rgba(148,163,184,0.35);
            border-radius: 14px;
            background: rgba(255,255,255,0.88);
            padding: 10px 12px;
          }
          .compact-sig-image {
            display: block; width: 100%; max-height: 80px;
            object-fit: contain; border-radius: 10px;
            border: 1px solid #cbd5e1; background: white; padding: 4px;
          }
          .compact-sig-missing {
            min-height: 60px; display: grid; place-items: center;
            border-radius: 10px; border: 1px dashed #cbd5e1;
            background: #f8fafc; color: #94a3b8; font-size: 11px;
          }

          .pair-divider {
            height: 1px;
            margin: 10px 0;
            background: repeating-linear-gradient(to right, #cbd5e1 0, #cbd5e1 6px, transparent 6px, transparent 12px);
          }
        </style>
      </head>
      <body>
        ${coverPage}
        ${pages}
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
