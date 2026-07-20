import AppDataSource from "../../database/data-source";
import { Permission } from "../../database/Entities/Permission";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

// In-memory cache: userId -> CacheEntry
const cache = new Map<string, CacheEntry>();

/**
 * Resolves the effective permission names for a user.
 * Merges role-based permissions with direct user permissions,
 * respecting explicit allow/deny overrides.
 */
async function resolveFromDb(idUser: string): Promise<string[]> {
  const perms = await AppDataSource.getRepository(Permission)
    .createQueryBuilder("p")
    .select("p.code", "code")
    .where(
      `p.id_permission IN (
        SELECT up.id_permission FROM user_permission up
        WHERE up.id_user = :idUser AND up.is_allowed = true
      )`,
    )
    .orWhere(
      `p.id_permission IN (
        SELECT rp.id_permission FROM role_permission rp
        JOIN user_role ur ON ur.id_role = rp.id_role
        WHERE ur.id_user = :idUser
      )
      AND p.id_permission NOT IN (
        SELECT up.id_permission FROM user_permission up
        WHERE up.id_user = :idUser AND up.is_allowed = false
      )`,
    )
    .setParameter("idUser", idUser)
    .getRawMany<{ code: string }>();

  return perms.map((p) => p.code);
}

/**
 * Returns the cached permissions for a user, fetching from DB if expired or missing.
 */
export async function getUserPermissions(idUser: string): Promise<string[]> {
  const now = Date.now();
  const entry = cache.get(idUser);

  if (entry && entry.expiresAt > now) {
    console.log(`[CACHE] 🟢 Permissions de l'utilisateur ${idUser} récupérées depuis le CACHE.`);
    return entry.permissions;
  }

  const permissions = await resolveFromDb(idUser);
  console.log(`[CACHE] 🟡 Permissions de l'utilisateur ${idUser} récupérées depuis la BASE DE DONNÉES.`);
  cache.set(idUser, { permissions, expiresAt: now + TTL_MS });
  return permissions;
}

/**
 * Invalidates the cached permissions for a specific user.
 * Call this when a user's roles or direct permissions are modified.
 */
export function invalidateUserCache(idUser: string): void {
  cache.delete(idUser);
}

/**
 * Invalidates the permissions for ALL users.
 * Call this when a role's permission set is modified globally.
 */
export function invalidateAllCache(): void {
  cache.clear();
}
