export interface SupplierDto {
  ref?: string;
  name: string;
  address?: string;
  description?: string;
  providesDelivery?: boolean;
  deliveryDelay?: number;
  notes?: string;
  phoneNumber?: string;
  email?: string;
}

export interface SupplierSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SupplierProductDto {
  ref?: string;
  name: string;
  actualPrice: number;
  minPurchaseNumber?: number;
  idSupplier: string;
  notes?: string;
}

export interface SupplierProductSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  idSupplier?: string;
}

export interface SupplierProductPriceDto {
  price: number;
  changeDate: Date | string;
  idSupplierProduct: string;
}

export interface SuppliedItemDto {
  idItem: string;
  idSupplierProduct: string;
}
