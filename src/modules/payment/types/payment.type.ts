export interface CreatePaymentDto {
  amount: number;
  idPaymentMethod: string;
  paymentDate?: string;
  paymentCode?: string;
}
