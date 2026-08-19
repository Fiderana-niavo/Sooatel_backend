export interface DeliveryLineDto {
  idSuppliedItem: string;
  quantity: number;
}

export interface CreateDeliveryDto {
  
  idPurchases: string[];
  lines: DeliveryLineDto[];
}
