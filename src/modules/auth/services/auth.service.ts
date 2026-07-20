import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import AppDataSource from "../../../database/data-source";
import { User } from "../../../database/Entities/User";
import { UserToken } from "../../../database/Entities/UserToken";
import { UserPermission } from "../../../database/Entities/UserPermission";
import { RolePermission } from "../../../database/Entities/RolePermission";
import { UserRole } from "../../../database/Entities/UserRole";
import { Permission } from "../../../database/Entities/Permission";
import {
  AuthUser,
  ChangeAuthenticatedPasswordDto,
  ChangePasswordDto,
  GeneratedToken,
  LoginDto,
  LoginPayload,
  PasswordResetRequestDto,
  PasswordResetResult,
  TokenPayload,
  ValidateResetKeyDto,
} from "../type/auth.type";
import { PermissionItem } from "../../permissions/type/permission.type";
import { MailerService } from "../../../shared/mailer/mailer.service";
import { Employee } from "../../../database/Entities/Employee";

const SECRET = new TextEncoder().encode(process.env["JWT_SECRET"] ?? "sooatel_secret_key");
const ACCESS_EXPIRY = "1h";
const REFRESH_EXPIRY = "7d";

const activeRefreshTokens: string[] = [];

export class AuthService {
  async login(dto: LoginDto): Promise<LoginPayload> {
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.employee", "employee")
      .where("user.username = :identifier", { identifier: dto.username })
      .orWhere("employee.email_contact = :identifier", { identifier: dto.username })
      .getOne();

    if (!user) throw new Error("Identifiants invalides.");

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new Error("Identifiants invalides.");

    if (user.activeStatus !== 1) throw new Error("Compte désactivé.");

    const payload: TokenPayload = {
      idUser: user.idUser,
      ref: user.ref,
      username: user.username,
    };

    const accessToken = await this.signToken(payload, ACCESS_EXPIRY);
    const refreshToken = await this.signToken(payload, REFRESH_EXPIRY);

    // Track active refresh token
    activeRefreshTokens.push(refreshToken);

    const permissions = await this.resolvePermissions(user.idUser);

    const authUser: AuthUser = {
      idUser: user.idUser,
      ref: user.ref,
      username: user.username,
      idEmployee: user.idEmployee,
      name: user.employee?.name,
      lastname: user.employee?.lastname,
    };

    return { accessToken, refreshToken, user: authUser, permissions };
  }

  // ─────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────
  async refresh(token: string): Promise<{ accessToken: string }> {
    const idx = activeRefreshTokens.indexOf(token);
    if (idx === -1) throw new Error("Refresh token invalide ou expiré.");

    const { payload } = await jwtVerify(token, SECRET);

    const newAccess = await this.signToken(
      {
        idUser: payload["idUser"] as string,
        ref: payload["ref"] as string,
        username: payload["username"] as string,
      },
      ACCESS_EXPIRY,
    );

    return { accessToken: newAccess };
  }

  async generateUserToken(idUser: string, type = "ACCESS"): Promise<GeneratedToken> {
    const userRepo = AppDataSource.getRepository(User);
    const tokenRepo = AppDataSource.getRepository(UserToken);

    const user = await userRepo.findOne({ where: { idUser } });
    if (!user) throw new Error("Utilisateur introuvable.");

    const existingToken = await tokenRepo
      .createQueryBuilder("ut")
      .where("ut.id_user = :idUser", { idUser })
      .andWhere("ut.token_type = :type", { type })
      .andWhere("ut.used = false")
      .andWhere("ut.expires_at > NOW()")
      .getOne();

    if (existingToken) {
      return { token: existingToken.token, expiresAt: existingToken.expiresAt };
    }

    const token = randomUUID();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const record = tokenRepo.create({
      token,
      tokenType: type,
      expiresAt,
      used: false,
      createdAt: new Date(),
      idUser,
    });

    await tokenRepo.save(record);

    return { token, expiresAt };
  }
  async getTokenForUser(idUser: string): Promise<GeneratedToken> {
    return this.generateUserToken(idUser);
  }

  async requestPasswordReset(dto: PasswordResetRequestDto): Promise<PasswordResetResult> {
    const userRepo = AppDataSource.getRepository(User);
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const empRepo = AppDataSource.getRepository(Employee);

    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoin("user.employee", "employee")
      .where("user.username = :identifier", { identifier: dto.username })
      .orWhere("employee.email_contact = :identifier", { identifier: dto.username })
      .getOne();

    if (!user) throw new Error("Utilisateur introuvable.");

    // Invalidate previous unused PWD_RESET tokens for this user
    await tokenRepo
      .createQueryBuilder()
      .update(UserToken)
      .set({ used: true })
      .where("id_user = :id AND token_type = :type AND used = false", {
        id: user.idUser,
        type: "PWD_RESET",
      })
      .execute();

    const key = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const record = tokenRepo.create({
      token: key,
      tokenType: "PWD_RESET",
      expiresAt,
      used: false,
      createdAt: new Date(),
      idUser: user.idUser,
    });
    await tokenRepo.save(record);

    // Try to find the employee email
    const employee = await empRepo.findOne({ where: { idEmployee: user.idEmployee } });
    const email = employee?.emailContact ?? null;

    if (email) {
      await MailerService.sendPasswordReset(email, key, user.username);
      return { method: "email", message: "Un email de réinitialisation a été envoyé.", expiresAt };
    }

    return { method: "manual", token: key, expiresAt };
  }

  async validateResetKey(dto: ValidateResetKeyDto): Promise<void> {
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const userRepo = AppDataSource.getRepository(User);

    const record = await tokenRepo.findOne({
      where: { token: dto.key, tokenType: "PWD_RESET" },
    });

    if (!record) throw new Error("Clé incorrecte.");
    if (record.used) throw new Error("Cette clé a déjà été utilisée.");
    if (record.expiresAt < new Date()) throw new Error("Cette clé a expiré.");

    const user = await userRepo.findOne({ where: { idUser: record.idUser } });
    if (!user || user.username !== dto.username) {
      throw new Error("Cette clé n'appartient pas à ce nom d'utilisateur.");
    }
  }

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const userRepo = AppDataSource.getRepository(User);

    const record = await tokenRepo.findOne({
      where: { token: dto.key, tokenType: "PWD_RESET" },
    });

    if (!record) throw new Error("Clé incorrecte.");
    if (record.used) throw new Error("Cette clé a déjà été utilisée.");
    if (record.expiresAt < new Date()) throw new Error("Cette clé a expiré.");

    const user = await userRepo.findOne({ where: { idUser: record.idUser } });
    if (!user || user.username !== dto.username) {
      throw new Error("Cette clé n'appartient pas à ce nom d'utilisateur.");
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);

    await AppDataSource.transaction(async (manager) => {
      await manager.update(User, { idUser: record.idUser }, { passwordHash: hashed });
      await manager.update(UserToken, { idToken: record.idToken }, { used: true });
    });
  }

  async changeAuthenticatedPassword(dto: ChangeAuthenticatedPasswordDto): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { idUser: dto.idUser } });
    if (!user) throw new Error("Utilisateur introuvable.");

    const match = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!match) throw new Error("Mot de passe actuel incorrect.");

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await userRepo.update({ idUser: dto.idUser }, { passwordHash: hashed });
  }

  private async signToken(payload: TokenPayload, expiry: string): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(SECRET);
  }

  private async resolvePermissions(idUser: string): Promise<PermissionItem[]> {
    const perms = await AppDataSource.getRepository(Permission)
      .createQueryBuilder("p")
      .select(["p.id_permission AS \"idPermission\"", "p.code AS code", "p.name AS name"])
      .where(`p.id_permission IN (
        SELECT up.id_permission FROM user_permission up WHERE up.id_user = :idUser AND up.is_allowed = true
      )`)
      .orWhere(`
        p.id_permission IN (
          SELECT rp.id_permission FROM role_permission rp
          JOIN user_role ur ON ur.id_role = rp.id_role
          WHERE ur.id_user = :idUser
        ) 
        AND p.id_permission NOT IN (
          SELECT up.id_permission FROM user_permission up WHERE up.id_user = :idUser AND up.is_allowed = false
        )
      `)
      .setParameter("idUser", idUser)
      .getRawMany<PermissionItem>();

    return perms;
  }
}

export const authService = new AuthService();
