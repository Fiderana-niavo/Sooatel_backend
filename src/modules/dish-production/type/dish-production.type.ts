export interface DishProductionDto {
  idItem: string;
  quantity: number;
  productionDate?: string;
  notes?: string;
}

export interface DishProductionSearchOptions {
  page?: number;
  limit?: number;
  idItem?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
}
