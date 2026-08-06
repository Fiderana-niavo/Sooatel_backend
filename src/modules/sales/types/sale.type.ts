export interface CreateSaleDto {
  saleDate: Date;
  idSaler: string;
  tableNumber?: number | string;
  chargeToRoom: boolean;
  idRoom?: string;
  invoiceNumber: string;
  items: CreateSaleItemDto[];
  payment?: CreateSalesPaymentDto;
  forceTotal?: boolean;
  comment?: string;
  deliveryDate?: Date | string;
}

export interface CreateSaleItemDto {
  idMenu: string;
  quantity: number;
  unitPrice: number;
  idSaleItem?: string;
}

export interface CreateSalesPaymentDto {
  paymentDate: Date;
  amount: number;
  idPaymentMethod: string;
  paymentCode?: string;
}

export interface RefundDto {
  amount: number;
  idPaymentMethod: string;
  paymentDate?: Date;
}

export interface UpdateSaleDto {
  saleDate?: Date;
  idSaler?: string;
  tableNumber?: number | string;
  chargeToRoom?: boolean;
  idRoom?: string;
  invoiceNumber?: string;
  status?: number;
  items?: CreateSaleItemDto[];
  payment?: CreateSalesPaymentDto;
  overpaymentAction?: "REFUND" | "ADJUST";
  idPaymentMethodRefund?: string;
  idPaymentToAdjust?: string;
  comment?: string;
  deliveryDate?: Date | string;
}

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface SaleSearchOptions {
  page?: number;
  limit?: number;
  idMenu?: string;
  date?: string;
  status?: number[];
  paymentStatus?: PaymentStatus;
}

export const ALLOWED_AUDIT_KEYS = [
  "saleDate",
  "totalAmount",
  "balanceDue",
  "tableNumber",
  "chargeToRoom",
  "invoiceNumber",
  "status",
  "quantity",
  "unitPrice",
  "reason"
];
