export interface DeliveryLineDto {
  idSuppliedItem: string;
  quantity: number;
}

export interface CreateDeliveryDto {
  idPurchaseClicked: string;
  idPurchases: string[];
  lines: DeliveryLineDto[];
}
