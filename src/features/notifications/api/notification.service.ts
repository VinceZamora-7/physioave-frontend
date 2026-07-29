import { pamsAPI } from "@/utils/axios-interceptor"

export interface StaffNotification {
  id: number
  notification_type: string
  title: string
  message: string
  action_path: string | null
  read_at: string | null
  created_at: string
  created_by_name: string
  metadata?: {
    billing_document_id?: number
    document_number?: string | null
    payer_type?: "HMO" | "LGU"
    billing_status?: string
    patient_name?: string
    sponsor_name?: string | null
    clinic_name?: string | null
    balance_amount?: number
    blockers?: string[]
    assigned_staff_name?: string | null
    eod_date?: string
  } | null
}

export interface OutstandingSponsorBilling {
  id: number
  document_number: string | null
  document_status: string
  payer_type: "HMO" | "LGU"
  patient_name: string
  clinic_id: number | null
  clinic_name: string | null
  sponsor_name: string | null
  document_date: string
  balance_amount: number
}

export interface PendingEodAssignment {
  appointment_id: number
  starts_at: string
  patient_name: string
  clinic_id: number
  clinic_name: string
  assigned_staff_id: number | null
  assigned_staff_name: string | null
  appointment_status: string
  blockers: string[]
}

export const notificationService = {
  async list(): Promise<StaffNotification[]> {
    const { data } = await pamsAPI.get<StaffNotification[]>("/notifications")
    return data
  },
  async unreadCount(): Promise<number> {
    const { data } = await pamsAPI.get<{ unread_count: number }>("/notifications/unread-count")
    return Number(data.unread_count ?? 0)
  },
  async markRead(id: number): Promise<void> {
    await pamsAPI.patch(`/notifications/${id}/read`)
  },
  async markAllRead(): Promise<void> {
    await pamsAPI.patch("/notifications/read-all")
  },
  async outstandingBillings(): Promise<OutstandingSponsorBilling[]> {
    const { data } = await pamsAPI.get<OutstandingSponsorBilling[]>("/notifications/outstanding-billings")
    return data
  },
  async pendingEod(): Promise<PendingEodAssignment[]> {
    const { data } = await pamsAPI.get<PendingEodAssignment[]>("/notifications/pending-eod")
    return data
  },
  async sendBillingReview(payload: { billing_document_id: number; message?: string }): Promise<{ recipients: number }> {
    const { data } = await pamsAPI.post<{ recipients: number }>("/notifications/billing-review", payload)
    return data
  },
  async sendEodReminder(payload: { appointment_id: number; message?: string }): Promise<{ recipients: number }> {
    const { data } = await pamsAPI.post<{ recipients: number }>("/notifications/eod-reminder", payload)
    return data
  }
}
