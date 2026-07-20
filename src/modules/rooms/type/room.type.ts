export interface RoomDto {
  roomNumber: string;
  idRoomType: string;
  description?: string;
}

export interface RoomSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
