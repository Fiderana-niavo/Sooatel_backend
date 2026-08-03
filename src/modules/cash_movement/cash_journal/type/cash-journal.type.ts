export interface CashJournalDto {
  ref: string;
  journalOpening: string | number | Date;
  journalClosing?: string | number | Date | null;
  expectedClosingBalance: number;
  actualClosingBalance?: number | null;
  cashDiscrepancy?: number | null;
  idCashier: string;
}

export interface CashJournalSearchOptions {
  page?: number;
  limit?: number;
  date?: string;
}
