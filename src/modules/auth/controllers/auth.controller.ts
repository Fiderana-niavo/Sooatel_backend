import { Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import {
  ChangePasswordDto,
  LoginDto,
  PasswordResetRequestDto,
  ValidateResetKeyDto,
} from "../type/auth.type";
import { authService } from "../services/auth.service";

export class AuthController {
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const result = await authService.login(dto);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(401).json(ApiResponse.error(err.message));
      } else {
        res.status(401).json(ApiResponse.error("Authentification échouée."));
      }
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body as { token: string };
      if (!token) {
        res.status(400).json(ApiResponse.error("Token manquant."));
        return;
      }
      const result = await authService.refresh(token);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(401).json(ApiResponse.error(err.message));
      } else {
        res.status(401).json(ApiResponse.error("Refresh token invalide."));
      }
    }
  };

  generateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUser = req.params["id"] as string;
      const { type } = req.body as { type?: string };
      const result = await authService.generateUserToken(idUser, type);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(400).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Erreur lors de la génération du token."));
      }
    }
  };

  getToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUser = req.params["id"] as string;
      const result = await authService.getTokenForUser(idUser);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(400).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Erreur lors de la récupération du token."));
      }
    }
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as PasswordResetRequestDto;
      if (!dto.username) {
        res.status(400).json(ApiResponse.error("Le nom d'utilisateur est requis."));
        return;
      }
      const result = await authService.requestPasswordReset(dto);
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(400).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Erreur lors de la demande de réinitialisation."));
      }
    }
  };

  validateResetKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as ValidateResetKeyDto;
      if (!dto.key || !dto.username) {
        res.status(400).json(ApiResponse.error("La clé et le nom d'utilisateur sont requis."));
        return;
      }
      await authService.validateResetKey(dto);
      res.json(ApiResponse.success({ valid: true }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(400).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Erreur de validation de la clé."));
      }
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as ChangePasswordDto;
      if (!dto.key || !dto.newPassword || !dto.username) {
        res.status(400).json(ApiResponse.error("La clé, le nom d'utilisateur et le nouveau mot de passe sont requis."));
        return;
      }
      await authService.changePassword(dto);
      res.json(ApiResponse.success({ success: true }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(400).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Erreur lors du changement de mot de passe."));
      }
    }
  };
}

export const authController = new AuthController();
