export interface ProductPriceDto {
  idMenu: string;
  specialPrice?: number;
  idRoomType?: string;
  idEvent?: string;
}

export interface ProductPriceSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
}
