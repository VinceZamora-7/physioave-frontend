export type RouteAccessRule = {
  anyOf: string[]
}

export const ROUTE_ACCESS_RULES: Record<string, RouteAccessRule> = {
  dashboard: {
    anyOf: ["Dashboard::READ"],
  },
  patients: {
    anyOf: ["Patient::READ", "Patient::LOOKUP", "Patient::CREATE", "Patient::UPDATE"],
  },
  appointments: {
    anyOf: ["Appointment::READ", "Appointment::LOOKUP", "Appointment::CREATE", "Appointment::UPDATE"],
  },
  "patient-daily-log": {
    anyOf: ["Appointment::READ", "Appointment::LOOKUP", "Patient::READ", "Patient::LOOKUP"],
  },
  billing: {
    anyOf: ["Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"],
  },
  reports: {
    anyOf: ["Appointment::READ", "Patient::READ", "Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"],
  },
  "promos-offers": {
    anyOf: ["Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-single-service": {
    anyOf: ["Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-package-service": {
    anyOf: ["Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-hmo": {
    anyOf: ["Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-lgu": {
    anyOf: ["Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "general-settings": {
    anyOf: ["AccessMatrix::READ"],
  },
  "pt-team-setup": {
    anyOf: ["AccessMatrix::READ"],
  },
  "admin-setup": {
    anyOf: ["Staff::READ", "Staff::LOOKUP", "Staff::CREATE", "Staff::UPDATE"],
  },
  clinics: {
    anyOf: ["Clinic::READ", "Clinic::LOOKUP", "Clinic::CREATE", "Clinic::UPDATE"],
  },

}
