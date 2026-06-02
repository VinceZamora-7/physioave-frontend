export type RouteAccessRule = {
  anyOf: string[]
}

export const MODULE_ACCESS_RULES = {
  dashboard: ["Dashboard::READ"],
  patients: ["Patient::READ", "Patient::LOOKUP", "Patient::CREATE", "Patient::UPDATE"],
  appointments: ["Appointment::READ", "Appointment::LOOKUP", "Appointment::CREATE", "Appointment::UPDATE"],
  patientDailyLog: ["Appointment::READ", "Appointment::LOOKUP", "Patient::READ", "Patient::LOOKUP"],
  billing: ["Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"],
  reports: ["Appointment::READ", "Patient::READ", "Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS"],
  offersPromotions: ["Reference::LOOKUP", "Reference::READ", "Reference::CREATE", "Reference::UPDATE"],
  accessMatrix: ["AccessMatrix::READ"],
  adminSetup: ["Staff::READ", "Staff::LOOKUP", "Staff::CREATE", "Staff::UPDATE"],
  clinics: ["Clinic::READ", "Clinic::LOOKUP", "Clinic::CREATE", "Clinic::UPDATE"],
} as const

export const ROUTE_ACCESS_RULES: Record<string, RouteAccessRule> = {
  dashboard: {
    anyOf: [...MODULE_ACCESS_RULES.dashboard],
  },
  patients: {
    anyOf: [...MODULE_ACCESS_RULES.patients],
  },
  appointments: {
    anyOf: [...MODULE_ACCESS_RULES.appointments],
  },
  "patient-daily-log": {
    anyOf: [...MODULE_ACCESS_RULES.patientDailyLog],
  },
  billing: {
    anyOf: [...MODULE_ACCESS_RULES.billing],
  },
  reports: {
    anyOf: [...MODULE_ACCESS_RULES.reports],
  },
  "promos-offers": {
    anyOf: [...MODULE_ACCESS_RULES.offersPromotions],
  },
  "promos-offers-single-service": {
    anyOf: [...MODULE_ACCESS_RULES.offersPromotions],
  },
  "promos-offers-package-service": {
    anyOf: [...MODULE_ACCESS_RULES.offersPromotions],
  },
  "promos-offers-hmo": {
    anyOf: [...MODULE_ACCESS_RULES.offersPromotions],
  },
  "promos-offers-lgu": {
    anyOf: [...MODULE_ACCESS_RULES.offersPromotions],
  },
  "general-settings": {
    anyOf: [...MODULE_ACCESS_RULES.accessMatrix],
  },
  "pt-team-setup": {
    anyOf: [...MODULE_ACCESS_RULES.accessMatrix],
  },
  "admin-setup": {
    anyOf: [...MODULE_ACCESS_RULES.adminSetup],
  },
  clinics: {
    anyOf: [...MODULE_ACCESS_RULES.clinics],
  },

}

export const SYSTEM_ADMIN_PERMISSIONS = [
  "Dashboard::READ",

  "AccessMatrix::READ",
  "AccessMatrix::CREATE",
  "AccessMatrix::UPDATE",
  "AccessMatrix::DELETE",

  "Reference::LOOKUP",
  "Reference::READ",
  "Reference::CREATE",
  "Reference::UPDATE",
  "Reference::DELETE",

  "Clinic::LOOKUP",
  "Clinic::READ",
  "Clinic::CREATE",
  "Clinic::UPDATE",
  "Clinic::DELETE",
  "Clinic::MANAGE_STAFFS",
  "Clinic::MANAGE_PATIENTS",

  "Staff::LOOKUP",
  "Staff::READ",
  "Staff::CREATE",
  "Staff::UPDATE",
  "Staff::DELETE",
  "Staff::MANAGE_APPOINTMENTS",
  "Staff::MANAGE_STATUS",

  "Patient::LOOKUP",
  "Patient::READ",
  "Patient::CREATE",
  "Patient::UPDATE",
  "Patient::DELETE",
  "Patient::MANAGE_BILLS",
  "Patient::MANAGE_APPOINTMENTS",
  "Patient::MANAGE_ATTACHMENTS",
  "Patient::MANAGE_MEDICAL_INFORMATION",

  "Appointment::LOOKUP",
  "Appointment::READ",
  "Appointment::CREATE",
  "Appointment::UPDATE",
  "Appointment::DELETE",
  "Appointment::MANAGE_BILL",
  "Appointment::MANAGE_STATUS",
  "Appointment::OVERRIDE_RESCHEDULE_LIMIT",

  "Service::LOOKUP",
  "Service::READ",
  "Service::CREATE",
  "Service::UPDATE",
  "Service::DELETE",

  "HMO::LOOKUP",
  "HMO::READ",
  "HMO::CREATE",
  "HMO::UPDATE",
  "HMO::DELETE",
  "HMO::MANAGE_EVALUATIONS",
  "HMO::MANAGE_MACHINES",
  "HMO::MANAGE_TECHNIQUES",

  "CashBill::LOOKUP",
  "CashBill::READ",
  "CashBill::CREATE",
  "CashBill::UPDATE",
  "CashBill::DELETE",
  "CashBill::MANAGE_STATUS",
  "CashBill::APPLY_DISCOUNT",
  "CashBill::MANAGE_CONFORMED_DETAILS",
  "CashBill::MANAGE_PAYMENT_DETAILS",
  "CashBill::MANAGE_SERVICE_ITEMS",
  "CashBill::MANAGE_ADD_ON_ITEMS",

  "HMOBill::LOOKUP",
  "HMOBill::READ",
  "HMOBill::CREATE",
  "HMOBill::UPDATE",
  "HMOBill::DELETE",
  "HMOBill::MANAGE_STATUS",
  "HMOBill::APPLY_DISCOUNT",
  "HMOBill::MANAGE_CONFORMED_DETAILS",
  "HMOBill::MANAGE_PAYMENT_DETAILS",
  "HMOBill::MANAGE_LOA_DETAILS",
  "HMOBill::MANAGE_SERVICE_ITEMS",
] as const

export const hasSystemAdminPermissions = (permissions: ReadonlySet<string>): boolean =>
  SYSTEM_ADMIN_PERMISSIONS.every(permission => permissions.has(permission))

export const hasAnyPermissionInSet = (permissions: ReadonlySet<string>, requiredPermissions: readonly string[]): boolean =>
  requiredPermissions.some(permission => permissions.has(permission))

export const hasAllPermissionsInSet = (permissions: ReadonlySet<string>, requiredPermissions: readonly string[]): boolean =>
  requiredPermissions.every(permission => permissions.has(permission))
