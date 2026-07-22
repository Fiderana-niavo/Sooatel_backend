export interface MenuItemDto {
  ref: string;
  idItem: string;
  salePrice: number;
  recipeCost?: number;
  idCategory: string;
}

export interface MenuItemSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  idCategory?: string;
}
