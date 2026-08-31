
export interface PaymentSummaryItem {
  idPayment: string;
  ref: string;
  date: string;
  amount: number;
  method: string;
  methodBalance?: number;
  isDeposit?: boolean;

}

﻿export interface AllocationDto {
  allocationType: "DELIVERY" | "SUPPLIER_CREDIT";
  idDelivery?: string;
  amount: number;
}

export interface CreateSupplierPaymentDto {
  amount: number;
  idPaymentMethod: string;
  paymentDate?: string;
  notes?: string;
  allocations: AllocationDto[];
}

export interface DeliveryPaymentSummary {
  idDelivery: string;
  ref: string;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  idSupplier: string;
  supplierCredit: number;
  payments?: { ref: string; date: Date | string; amount: number; method: string }[];
}

export interface AvailableDestinations {
  deliveries: {
    idDelivery: string;
    ref: string;
    deliveryDate: Date;
    balanceDue: number;
  }[];
  purchases: {
    idPurchase: string;
    ref: string;
    totalAmount: number;
  }[];
  unvalidatedDeliveriesCount?: number;
}
