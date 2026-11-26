export interface StockMovementDto {
  idItem: string;
  quantity: number;
  direction: number;
  reason: string;
  movementDate?: string;
}

export interface LossDto {
  idItem: string;
  quantity: number;
  reason: string;
  movementDate?: string;
}

export interface InventoryLineDto {
  idItem: string;
  physicalQty: number;
}

export interface StockMovementSearchOptions {
  page?: number;
  limit?: number;
  idItem?: string;
  startDate?: string;
  endDate?: string;
  direction?: number;
  status?: number;
  movementType?: number;
}
