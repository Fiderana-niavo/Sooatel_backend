import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import {
  ChangeAuthenticatedPasswordDto,
  ChangePasswordDto,
  LoginDto,
  PasswordResetRequestDto,
  ValidateResetKeyDto,
} from "../type/auth.type";
import { authService } from "../services/auth.service";
import { BadRequestError } from "../../../shared/errors/AppError";

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const result = await authService.login(dto);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body as { token: string };
      if (!token) {
        next(new BadRequestError("Token manquant."));
        return;
      }
      const result = await authService.refresh(token);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  generateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idUser = req.params["id"] as string;
      const { type } = (req.body || {}) as { type?: string };
      const result = await authService.generateUserToken(idUser, type);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  getToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idUser = req.params["id"] as string;
      const result = await authService.getTokenForUser(idUser);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as PasswordResetRequestDto;
      if (!dto.username) {
        next(new BadRequestError("Le nom d'utilisateur est requis."));
        return;
      }
      const result = await authService.requestPasswordReset(dto);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      next(err);
    }
  };

  validateResetKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ValidateResetKeyDto;
      if (!dto.key || !dto.username) {
        next(new BadRequestError("La clé et le nom d'utilisateur sont requis."));
        return;
      }
      await authService.validateResetKey(dto);
      res.json(ApiResponse.success({ valid: true }));
    } catch (err: unknown) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ChangePasswordDto;
      if (!dto.key || !dto.newPassword || !dto.username) {
        next(new BadRequestError("La clé, le nom d'utilisateur et le nouveau mot de passe sont requis."));
        return;
      }
      await authService.changePassword(dto);
      res.json(ApiResponse.success({ success: true }));
    } catch (err: unknown) {
      next(err);
    }
  };

  changeAuthenticatedPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ChangeAuthenticatedPasswordDto;
      if (!dto.idUser || !dto.currentPassword || !dto.newPassword) {
        next(new BadRequestError("L'identifiant utilisateur, le mot de passe actuel et le nouveau mot de passe sont requis."));
        return;
      }
      await authService.changeAuthenticatedPassword(dto);
      res.json(ApiResponse.success({ success: true }));
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const authController = new AuthController();
