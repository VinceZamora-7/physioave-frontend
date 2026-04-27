import {
  escapeHtml,
  formatDate,
  renderStandardInvoiceWindow,
  type InvoiceDetailRow
} from "./invoice-layout.util"

export interface PatientCopyInvoiceLine {
  name: string
  quantity: number
  treatmentDate?: string
  sessionSequence?: string
  laterality?: string
  bodyArea?: string
}

export interface PatientCopyInvoiceData {
  billingDate?: string
  referenceNumber: string
  patientName: string
  patientAddress?: string
  patientAge?: string
  patientGender?: string
  physicalTherapist?: string
  doctor?: string
  diagnosis?: string
  billingTypeLabel: string
  sponsorName?: string
  sponsorReference?: string
  approvedBy?: string
  approverTitle?: string
  dateSigned?: string
  lines: PatientCopyInvoiceLine[]
}

export function renderPatientCopyInvoiceWindow(
  printWindow: Window,
  invoice: PatientCopyInvoiceData,
  options?: { title?: string; fileName?: string }
): void {
  const lineRows = invoice.lines.map((line, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td class="text-center">${escapeHtml(formatDate(line.treatmentDate))}</td>
      <td>${escapeHtml(line.name)}</td>
      <td class="text-center">${line.quantity}</td>
      <td class="text-center">${escapeHtml(line.sessionSequence || line.laterality || "N/A")}</td>
      <td class="text-center">${escapeHtml(line.bodyArea || "N/A")}</td>
    </tr>
  `).join("")

  const detailRows: InvoiceDetailRow[] = [
    { label: "Billing Type", value: invoice.billingTypeLabel },
    { label: "Sponsor", value: invoice.sponsorName || "N/A" },
    { label: "Reference", value: invoice.sponsorReference || "N/A" },
    { label: "Note", value: "Patient copy only. Service prices are intentionally omitted." }
  ]

  renderStandardInvoiceWindow(printWindow, {
    title: options?.title?.trim() || "Patient Statement of Services",
    headerTitle: "STATEMENT OF SERVICES",
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
      { label: "ITEM No.", width: "60px", align: "center" },
      { label: "TREATMENT DATE", width: "110px", align: "center" },
      { label: "PT SERVICE RENDERED" },
      { label: "QTY", width: "70px", align: "center" },
      { label: "DETAIL", width: "110px", align: "center" },
      { label: "BODY AREA", width: "120px", align: "center" }
    ],
    tableRowsHtml: lineRows,
    emptyStateColspan: 5,
    discount: 0,
    grandTotal: 0,
    detailBoxTitle: "PATIENT STATEMENT DETAILS",
    detailRows,
    approvedBy: invoice.approvedBy,
    approverTitle: invoice.approverTitle,
    dateSigned: invoice.dateSigned,
    pageSize: "A4 landscape",
    maxWidthPx: 1200,
    hideFinancialSummary: true,
    renderErrorMessage: "The patient statement could not be rendered. Please try again."
  })
}
