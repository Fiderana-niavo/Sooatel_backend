export interface RoleResponse {
  idRole: string;
  label: string;
  description: string | null;
}

export interface RolePermissionItem {
  idPermission: string;
  permissionName: string;
  description: string | null;
  categoryLabel: string | null;
}

export interface RoleWithPermissions {
  idRole: string;
  label: string;
  description: string | null;
  permissions: RolePermissionItem[];
}

export interface RoleDto {
  label: string;
  description?: string;
}

export interface RoleCreateOrUpdateDto {
  label: string;
  description?: string;
  permissionIds: string[];
}

export interface RoleSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
