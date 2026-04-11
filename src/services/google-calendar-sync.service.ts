import { pamsAPI, pamsBaseURL } from "@/utils/axios-interceptor"

export interface GoogleCalendarSyncStatus {
  google_oauth_configured: boolean
  is_physical_therapist: boolean
  is_mobile_calendar_eligible: boolean
  is_staff_active: boolean
  connected: boolean
  sync_enabled: boolean
  google_email?: string
  calendar_id?: string
  authorized_at?: string
  last_synced_at?: string
  last_error?: string
}

interface GoogleCalendarSyncService {
  getMyStatus(): Promise<GoogleCalendarSyncStatus | undefined>
  disconnect(): Promise<void>
  resync(): Promise<{ synced_appointments: number } | undefined>
  startAuthorization(returnTo?: string): void
}

export const googleCalendarSyncService: GoogleCalendarSyncService = {
  async getMyStatus(): Promise<GoogleCalendarSyncStatus | undefined> {
    const { data } = await pamsAPI.get<GoogleCalendarSyncStatus>("/calendar-sync/me")
    return data
  },

  async disconnect(): Promise<void> {
    await pamsAPI.delete("/calendar-sync/me")
  },

  async resync(): Promise<{ synced_appointments: number } | undefined> {
    const { data } = await pamsAPI.post<{ synced_appointments: number }>("/calendar-sync/me/resync")
    return data
  },

  startAuthorization(returnTo = "/settings"): void {
    const url = new URL(`${pamsBaseURL}/calendar-sync/google/authorize`)
    url.searchParams.set("return_to", returnTo)
    window.location.assign(url.toString())
  }
}
