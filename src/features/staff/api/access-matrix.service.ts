import type { Pageable } from "@/models/paging"
import type { Permission } from "@/models/reference"
import { pamsAPI } from "@/utils/axios-interceptor"

export type PermissionListParams = {
  role_id: number
  page?: number
  size?: number
  status?: "ACTIVE" | "INACTIVE" | "ALL"
  name?: string
}

type BulkPermissionPayload = {
  grant_permission_ids?: number[]
  revoke_permission_ids?: number[]
}

const defaultPermissionListParams = (roleId: number): PermissionListParams => ({
  role_id: roleId,
  page: 1,
  size: 500,
  status: "ACTIVE",
})

export const accessMatrixService = {
  async getAssignedPermissions(params: PermissionListParams): Promise<Pageable<Permission>> {
    const { data } = await pamsAPI.get<Pageable<Permission>>("/references/permissions/assigned", { params })
    return data
  },

  async getUnassignedPermissions(params: PermissionListParams): Promise<Pageable<Permission>> {
    const { data } = await pamsAPI.get<Pageable<Permission>>("/references/permissions/unassigned", { params })
    return data
  },

  async getAssignedPermissionIds(roleId: number): Promise<Set<number>> {
    const permissions = await this.getAssignedPermissions(defaultPermissionListParams(roleId))
    return new Set((permissions.content ?? []).map(permission => permission.id))
  },

  async grantPermission(roleId: number, permissionId: number): Promise<void> {
    await pamsAPI.post("/access-matrix", null, {
      params: { role_id: roleId, permission_id: permissionId }
    })
  },

  async revokePermission(roleId: number, permissionId: number): Promise<void> {
    await pamsAPI.delete("/access-matrix", {
      params: { role_id: roleId, permission_id: permissionId }
    })
  },

  async applyPermissionChanges(roleId: number, payload: BulkPermissionPayload): Promise<void> {
    const grantPermissionIds = payload.grant_permission_ids ?? []
    const revokePermissionIds = payload.revoke_permission_ids ?? []

    if (!grantPermissionIds.length && !revokePermissionIds.length) {
      return
    }

    await pamsAPI.patch("/access-matrix", {
      grant_permission_ids: grantPermissionIds,
      revoke_permission_ids: revokePermissionIds,
    }, {
      params: { role_id: roleId }
    })
  },

  async grantOwnerEquivalent(roleId: number): Promise<void> {
    await pamsAPI.post("/access-matrix/owner-equivalent", null, {
      params: { role_id: roleId }
    })
  },
}
