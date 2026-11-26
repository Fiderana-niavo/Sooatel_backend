export interface MenuCategoryDto {
  label: string;
  description?: string;
}

export interface MenuCategorySearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
