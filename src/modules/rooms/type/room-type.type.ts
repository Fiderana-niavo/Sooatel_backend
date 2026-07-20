export interface RoomTypeDto {
  label: string;
  Description?: string;
}

export interface RoomTypeSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
