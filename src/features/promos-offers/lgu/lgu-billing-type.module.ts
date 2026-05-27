export const LGU_BILLING_TYPE = "LGU_BILLING" as const

export type LguBillingType = typeof LGU_BILLING_TYPE

export function buildLguBillingQuery(): { billing_type: LguBillingType } {
  return { billing_type: LGU_BILLING_TYPE }
}

export function isLguBillingType(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toUpperCase()
  return normalized === "LGU" || normalized === LGU_BILLING_TYPE
}
