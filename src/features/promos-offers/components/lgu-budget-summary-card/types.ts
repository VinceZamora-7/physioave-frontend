import type { LguPatientSession } from "@/features/lgu-billing/api/lgu-billing.service"

export type LguInvoiceSessionOption = {
  key: string
  label: string
  packageName: string
  serviceName: string
  appointmentId: number
  appointmentDate: string
  sessionSequence: number
  totalSessions: number
  billingId: number | null
  claimLabel: string
  session: LguPatientSession
}
