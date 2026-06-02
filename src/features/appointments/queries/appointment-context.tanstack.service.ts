import type {QueryClient} from "@tanstack/vue-query"
import {
  appointmentPhase1Service,
  type AppointmentContext
} from "@/features/appointments/api/appointment-phase1.service"
import {AppointmentTanstackKey} from "@/utils/keys/tanstack-key"

export const appointmentContextTanstackService = {
  fetchContext(
    queryClient: QueryClient,
    appointmentId: number,
    key: AppointmentTanstackKey = AppointmentTanstackKey.APPOINTMENT_CONTEXT
  ) {
    return queryClient.fetchQuery<AppointmentContext>({
      queryKey: [key, appointmentId],
      queryFn: () => appointmentPhase1Service.getContext(appointmentId),
      staleTime: 1000 * 60 * 5,
    })
  },
}
