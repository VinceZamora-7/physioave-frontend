export interface RefreshToken {
  id: number

  expires_at: Date
  expired_at_formatted: string
  revoked_at: Date
  revoked_at_formatted: string

  staff_id: number

  is_revoked: boolean
  is_expired: boolean
  is_not_valid: boolean
}
