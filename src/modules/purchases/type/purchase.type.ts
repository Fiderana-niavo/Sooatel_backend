export interface PurchaseDetailDto {
  idPurchaseDetail?: string;
  idPurchase?: string;
  idSuppliedItem: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface PurchaseDto {
  idPurchase?: string;
  ref?: string;
  purchaseDate: Date | string;
  totalAmount: number;
  balanceDue: number;
  status: number;
  idSupplier: string;
  idPurchaser: string;
  details?: PurchaseDetailDto[];
  advanceAmount?: number;
  idPaymentMethod?: string;
}
