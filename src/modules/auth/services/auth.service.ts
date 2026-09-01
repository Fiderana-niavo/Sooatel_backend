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
const REFRESH_EXPIRY_DAYS = 7;

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
      idEmployee: user.idEmployee,
    };

    const accessToken = await this.signToken(payload, ACCESS_EXPIRY);
    const refreshToken = await this.signToken(payload, REFRESH_EXPIRY);

    // Persist hashed refresh token in DB
    await this.saveRefreshToken(user.idUser, refreshToken);

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
  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify JWT signature and expiry
    let payload: Record<string, unknown>;
    try {
      const verified = await jwtVerify(token, SECRET);
      payload = verified.payload as Record<string, unknown>;
    } catch {
      throw new Error("Refresh token expiré ou invalide.");
    }

    // 2. Check token exists in DB and is not used/revoked
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const records = await tokenRepo.find({
      where: { idUser: payload["idUser"] as string, tokenType: "REFRESH", used: false },
    });

    let validRecord: UserToken | null = null;
    for (const record of records) {
      const match = await bcrypt.compare(token, record.token);
      if (match) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) throw new Error("Refresh token invalide ou révoqué.");
    if (validRecord.expiresAt < new Date()) throw new Error("Refresh token expiré.");

    // 3. Rotate: revoke old token and issue a new pair
    await tokenRepo.update({ idToken: validRecord.idToken }, { used: true });

    const tokenPayload: TokenPayload = {
      idUser: payload["idUser"] as string,
      ref: payload["ref"] as string,
      username: payload["username"] as string,
      idEmployee: payload["idEmployee"] as string,
    };

    const newAccessToken = await this.signToken(tokenPayload, ACCESS_EXPIRY);
    const newRefreshToken = await this.signToken(tokenPayload, REFRESH_EXPIRY);

    await this.saveRefreshToken(tokenPayload.idUser, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  private async saveRefreshToken(idUser: string, rawToken: string): Promise<void> {
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);

    const record = tokenRepo.create({
      token: hashedToken,
      tokenType: "REFRESH",
      expiresAt,
      used: false,
      createdAt: new Date(),
      idUser,
    });
    await tokenRepo.save(record);
  }

  async generateUserToken(idUser: string, type = "ACCESS"): Promise<GeneratedToken> {
    const userRepo = AppDataSource.getRepository(User);
    const tokenRepo = AppDataSource.getRepository(UserToken);

    const user = await userRepo.findOne({ where: { idUser } });
    if (!user) throw new Error("Utilisateur introuvable.");

    // Invalidate existing unused tokens of this type
    await tokenRepo
      .createQueryBuilder()
      .update(UserToken)
      .set({ used: true })
      .where("id_user = :idUser AND token_type = :type AND used = false", { idUser, type })
      .execute();

    const token = randomUUID();
    const hashedToken = await bcrypt.hash(token, 10);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const record = tokenRepo.create({
      token: hashedToken,
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
    const hashedKey = await bcrypt.hash(key, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const record = tokenRepo.create({
      token: hashedKey,
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

    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoin("user.employee", "employee")
      .where("user.username = :identifier", { identifier: dto.username })
      .orWhere("employee.email_contact = :identifier", { identifier: dto.username })
      .getOne();

    if (!user) throw new Error("Utilisateur introuvable.");

    const records = await tokenRepo.find({
      where: { idUser: user.idUser, tokenType: "PWD_RESET", used: false },
    });

    let validRecord = null;
    for (const record of records) {
      const match = await bcrypt.compare(dto.key, record.token);
      if (match) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) throw new Error("Clé incorrecte ou déjà utilisée.");
    if (validRecord.expiresAt < new Date()) throw new Error("Cette clé a expiré.");
  }

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoin("user.employee", "employee")
      .where("user.username = :identifier", { identifier: dto.username })
      .orWhere("employee.email_contact = :identifier", { identifier: dto.username })
      .getOne();

    if (!user) throw new Error("Utilisateur introuvable.");

    const records = await tokenRepo.find({
      where: { idUser: user.idUser, tokenType: "PWD_RESET", used: false },
    });

    let validRecord = null;
    for (const record of records) {
      const match = await bcrypt.compare(dto.key, record.token);
      if (match) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) throw new Error("Clé incorrecte ou déjà utilisée.");
    if (validRecord.expiresAt < new Date()) throw new Error("Cette clé a expiré.");

    const hashed = await bcrypt.hash(dto.newPassword, 12);

    await AppDataSource.transaction(async (manager) => {
      await manager.update(User, { idUser: validRecord.idUser }, { passwordHash: hashed });
      await manager.update(UserToken, { idToken: validRecord.idToken }, { used: true });
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
