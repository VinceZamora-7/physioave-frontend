type AppointmentProviderLike = {
  appointment_provider_type?: string | null
  secondary_appointment_provider_type?: string | null
}

export const isPtAppointmentProvider = (value?: AppointmentProviderLike | null): boolean => {
  if (!value) return false

  return value.appointment_provider_type === "PHYSICAL_THERAPIST"
    || value.appointment_provider_type === "PT_ASSISTANT"
    || value.appointment_provider_type === "INTERN"
    || value.secondary_appointment_provider_type === "PHYSICAL_THERAPIST"
    || value.secondary_appointment_provider_type === "PT_ASSISTANT"
    || value.secondary_appointment_provider_type === "INTERN"
}
