export type RouteAccessRule = {
  anyOf: string[]
}

export const ROUTE_ACCESS_RULES: Record<string, RouteAccessRule> = {
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
    anyOf: ["Reference::LOOKUP", "Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-single-service": {
    anyOf: ["Reference::LOOKUP", "Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-package-service": {
    anyOf: ["Reference::LOOKUP", "Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-hmo": {
    anyOf: ["Reference::LOOKUP", "Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  "promos-offers-lgu": {
    anyOf: ["Reference::LOOKUP", "Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  },
  settings: {
    anyOf: ["Clinic::READ", "Clinic::LOOKUP", "Staff::READ", "Staff::LOOKUP", "Reference::LOOKUP", "AccessMatrix::READ"],
  },
  clinics: {
    anyOf: ["Clinic::READ", "Clinic::LOOKUP", "Clinic::CREATE", "Clinic::UPDATE"],
  },
  staffs: {
    anyOf: ["Staff::READ", "Staff::LOOKUP", "Staff::CREATE", "Staff::UPDATE"],
  },
}

export const DASHBOARD_ROLES = new Set([
  "Owner",
  "Clinic Admin",
  "Chief Operations Officer - COO (Admin 1 Account)",
  "Operations Manager (Admin 2 Account)",
  "Admin/Receptionist",
  "Secretary"
])