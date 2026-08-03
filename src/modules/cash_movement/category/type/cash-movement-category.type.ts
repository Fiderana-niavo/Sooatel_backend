export interface CashMovementCategoryDto {
  label: string;
  allowedDirection: number;
}

export interface CashMovementCategorySearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
