type AppointmentProviderLike = {
  appointment_provider_type?: string | null
  secondary_appointment_provider_type?: string | null
  role_name?: string | null
  secondary_role_name?: string | null
}

export const isPtAppointmentProvider = (value?: AppointmentProviderLike | null): boolean => {
  if (!value) return false

  const providerType = String(value.appointment_provider_type ?? "").trim().toUpperCase()
  const secondaryProviderType = String(value.secondary_appointment_provider_type ?? "").trim().toUpperCase()
  const roleName = String(value.role_name ?? "").trim().toLowerCase()
  const secondaryRoleName = String(value.secondary_role_name ?? "").trim().toLowerCase()

  return providerType === "PHYSICAL_THERAPIST"
    || providerType === "PT_ASSISTANT"
    || providerType === "INTERN"
    || secondaryProviderType === "PHYSICAL_THERAPIST"
    || secondaryProviderType === "PT_ASSISTANT"
    || secondaryProviderType === "INTERN"
    || roleName.includes("physical therapist")
    || roleName.includes("pt assistant")
    || roleName.includes("intern")
    || secondaryRoleName.includes("physical therapist")
    || secondaryRoleName.includes("pt assistant")
    || secondaryRoleName.includes("intern")
}
