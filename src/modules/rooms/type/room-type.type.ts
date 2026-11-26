export interface RoomTypeDto {
  label: string;
  description?: string;
}

export interface RoomTypeSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
