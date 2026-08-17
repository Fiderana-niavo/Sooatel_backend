export const STOCK_MOVEMENT_TYPE = {
  RECEPTION_FOURNISSEUR: 1,
} as const;

export type StockMovementType = typeof STOCK_MOVEMENT_TYPE[keyof typeof STOCK_MOVEMENT_TYPE];
