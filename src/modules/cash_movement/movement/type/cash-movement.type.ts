export interface cashMovementDto {
  ref: string;
  amount: number;
  movementDate?: number | string;
  reason?: string | null;
  invoiceReference?: string | null;
  direction: number;
  idProcessedBy: string;
  idJournal: string;
  status?: number;
  idCashMovementCategory?: string | null;
  idPaymentMethod: string;
}

export interface cashMovementSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
