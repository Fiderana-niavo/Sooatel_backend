export interface PermissionCategoryResponse {
  idCategory: string;
  name: string;
  code: string;
}
export interface PermissionCategoryDto {
  name: string;
  code: string;
}
export interface PermissionCategorySearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "code";
  sortOrder?: "ASC" | "DESC";
}

export interface PermissionResponse {
  idPermission: string;
  name: string;
  code: string;
  description: string | null;
  idCategory: string;
  category?: PermissionCategoryResponse;
}

export interface PermissionDto {
  name: string;
  code: string;
  description?: string;
  idCategory: string;
}

export interface PermissionSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  idCategory?: string;
  sortBy?: "name" | "code";
  sortOrder?: "ASC" | "DESC";
}

export interface PermissionItem {
  idPermission: string;
  code: string;
  name: string;
}
