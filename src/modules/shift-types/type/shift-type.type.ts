export interface ShiftTypeDto {
  label: string;
  customStartTime: string;
  customEndTime: string;
  description?: string;
}

export interface ShiftTypeSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
