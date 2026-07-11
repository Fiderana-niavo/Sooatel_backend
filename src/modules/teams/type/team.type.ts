export interface TeamDto {
  teamName: string;
  description?: string;
}

export interface TeamSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
