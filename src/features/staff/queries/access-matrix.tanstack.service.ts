import type { QueryClient } from "@tanstack/vue-query"

import type { Pageable } from "@/models/paging"
import type { Permission } from "@/models/reference"
import { accessMatrixService, type PermissionListParams } from "@/features/staff/api/access-matrix.service"
import { AccessMatrixTanstackKey } from "@/utils/keys/tanstack-key"

const defaultPermissionListParams = (roleId: number): PermissionListParams => ({
  role_id: roleId,
  page: 1,
  size: 500,
  status: "ACTIVE",
})

export const accessMatrixTanstackService = {
  assignedPermissionsKey(roleId: number) {
    return [AccessMatrixTanstackKey.ASSIGNED_PERMISSIONS, roleId] as const
  },

  unassignedPermissionsKey(roleId: number) {
    return [AccessMatrixTanstackKey.UNASSIGNED_PERMISSIONS, roleId] as const
  },

  assignedPermissionIdsKey(roleId: number) {
    return [AccessMatrixTanstackKey.ASSIGNED_PERMISSION_IDS, roleId] as const
  },

  fetchAssignedPermissions(queryClient: QueryClient, roleId: number): Promise<Pageable<Permission>> {
    return queryClient.fetchQuery({
      queryKey: this.assignedPermissionsKey(roleId),
      queryFn: () => accessMatrixService.getAssignedPermissions(defaultPermissionListParams(roleId)),
      staleTime: 1000 * 60 * 5,
    })
  },

  fetchUnassignedPermissions(queryClient: QueryClient, roleId: number): Promise<Pageable<Permission>> {
    return queryClient.fetchQuery({
      queryKey: this.unassignedPermissionsKey(roleId),
      queryFn: () => accessMatrixService.getUnassignedPermissions(defaultPermissionListParams(roleId)),
      staleTime: 1000 * 60 * 5,
    })
  },

  fetchAssignedPermissionIds(queryClient: QueryClient, roleId: number): Promise<Set<number>> {
    return queryClient.fetchQuery({
      queryKey: this.assignedPermissionIdsKey(roleId),
      queryFn: () => accessMatrixService.getAssignedPermissionIds(roleId),
      staleTime: 1000 * 60 * 5,
    })
  },

  async invalidateRole(queryClient: QueryClient, roleId: number): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: this.assignedPermissionsKey(roleId) }),
      queryClient.invalidateQueries({ queryKey: this.unassignedPermissionsKey(roleId) }),
      queryClient.invalidateQueries({ queryKey: this.assignedPermissionIdsKey(roleId) }),
    ])
  },
}
