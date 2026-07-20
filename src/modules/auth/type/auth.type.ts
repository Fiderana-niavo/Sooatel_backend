import { PermissionItem } from "../../permissions/type/permission.type";

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  permissions: PermissionItem[];
}

export interface AuthUser {
  idUser: string;
  ref: string;
  username: string;
  idEmployee: string;
  name?: string;
  lastname?: string;
}

export interface TokenPayload {
  idUser: string;
  ref: string;
  username: string;
}

export interface GeneratedToken {
  token: string;
  expiresAt: Date;
}


export interface PasswordResetRequestDto {
  username: string;
}

export interface ValidateResetKeyDto {
  key: string;
  username: string;
}

export interface ChangePasswordDto {
  key: string;
  username: string;
  newPassword: string;
}

export interface ChangeAuthenticatedPasswordDto {
  idUser: string;
  currentPassword: string;
  newPassword: string;
}

export type PasswordResetResult =
  | { method: "email"; message: string; expiresAt: Date }
  | { method: "manual"; token: string; expiresAt: Date };
