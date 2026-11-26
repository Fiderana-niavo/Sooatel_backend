export interface ItemTypeDto {
  label: string;
  description?: string;
}

export interface ItemTypeSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
