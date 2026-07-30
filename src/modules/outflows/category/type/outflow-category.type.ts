export interface OutflowCategoryDto {
  label: string;
  code?: string | null;
}

export interface OutflowCategorySearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
