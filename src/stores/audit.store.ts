import {computed} from "vue";
import {defineStore} from "pinia";
import {useStorage} from "@vueuse/core";

export interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  module: string
  action: string
  details: string
}

export interface PermissionRule {
  role: string
  module: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

const makeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const defaultPermissions = (): PermissionRule[] => ([
  {role: "Admin", module: "Appointments", can_view: true, can_create: true, can_edit: true, can_delete: true},
  {role: "Admin", module: "Billing", can_view: true, can_create: true, can_edit: true, can_delete: true},
  {role: "Admin", module: "Reports", can_view: true, can_create: true, can_edit: true, can_delete: true},
  {role: "Therapist", module: "Appointments", can_view: true, can_create: true, can_edit: true, can_delete: false},
  {role: "Therapist", module: "Billing", can_view: true, can_create: false, can_edit: false, can_delete: false},
  {role: "Therapist", module: "Reports", can_view: true, can_create: false, can_edit: false, can_delete: false},
  {role: "Cashier", module: "Appointments", can_view: true, can_create: false, can_edit: false, can_delete: false},
  {role: "Cashier", module: "Billing", can_view: true, can_create: true, can_edit: true, can_delete: false},
  {role: "Cashier", module: "Reports", can_view: true, can_create: false, can_edit: false, can_delete: false},
])

export const auditStore = defineStore("auditStore", () => {
  const logs = useStorage<AuditLogEntry[]>("pams:audit-logs", [])
  const permissions = useStorage<PermissionRule[]>("pams:permission-rules", defaultPermissions())

  const sortedLogs = computed(() =>
    [...logs.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const logAction = (payload: Omit<AuditLogEntry, "id" | "timestamp">): void => {
    logs.value = [
      {
        ...payload,
        id: makeId(),
        timestamp: new Date().toISOString()
      },
      ...logs.value
    ]
  }

  const clearLogs = (): void => {
    logs.value = []
  }

  return {
    logs,
    permissions,
    sortedLogs,
    logAction,
    clearLogs
  }
})
