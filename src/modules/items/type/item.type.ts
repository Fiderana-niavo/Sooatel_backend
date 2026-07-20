export interface ItemDto {
  ref: string;
  label: string;
  isProduced?: boolean;
  minimumStockLevel: number;
  reorderQuantity?: number;
  isPerishable: boolean;
  status: number;
  idProductType: string;
  idUnit: string;
  description?: string;
}

export interface ItemSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
