export interface SchoolCreateOrUpdateDto {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface SchoolDto {
  idSchool: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
}
