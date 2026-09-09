export const STOCK_MOVEMENT_TYPE = {
  RECEPTION_FOURNISSEUR: 1,
  MANUEL: 2,
  PERTE: 3,
  INVENTAIRE: 4,
} as const;

export type StockMovementType = typeof STOCK_MOVEMENT_TYPE[keyof typeof STOCK_MOVEMENT_TYPE];

export const STOCK_MOVEMENT_STATUS = {
  VALIDATED: 0,
  DRAFT: 5,
} as const;

export const STOCK_MOVEMENT_DIRECTION = {
  IN: 5,
  OUT: -5,
} as const;

