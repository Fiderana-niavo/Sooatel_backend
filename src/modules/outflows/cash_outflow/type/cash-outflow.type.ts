export interface CashOutflowDto {
  ref: string;
  amount: number;
  outflowDate?: number | string;
  reason?: string | null;
  invoiceReference?: string | null;
  idProcessedBy: string;
  idJournal: string;
  status?: number;
  idOutflowCategory?: string | null;
}

export interface CashOutflowSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
