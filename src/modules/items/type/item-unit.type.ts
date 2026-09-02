export interface CreateItemUnitDto {
  idItem: string;
  alternativeUnitId: string;
  toStockRatio: number;
}

export interface UpdateItemUnitDto {
  idItem?: string;
  alternativeUnitId?: string;
  toStockRatio?: number;
}
