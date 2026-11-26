export interface EventDto {
  eventName: string;
  startDate: Date;
  endDate?: Date;
}

export interface EventSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
