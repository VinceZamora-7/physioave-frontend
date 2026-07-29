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
  metadata?: { payer_types?: string[] } | null
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
  async sendBillingReview(payload: { payer_types: string[]; message?: string }): Promise<{ recipients: number }> {
    const { data } = await pamsAPI.post<{ recipients: number }>("/notifications/billing-review", payload)
    return data
  }
}
