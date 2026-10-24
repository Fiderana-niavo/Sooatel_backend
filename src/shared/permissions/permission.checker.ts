import { getUserPermissions } from "../services/UserPermissionCache";

/**
 * Pure business-logic permission check.
 * Decoupled from HTTP — works in any context (middleware, agent, service).
 *
 * @returns true if the user has the permission, false otherwise.
 */
export async function checkPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * Asserts that a user holds a given permission.
 * Throws a structured error if the check fails — agents can catch it cleanly.
 *
 * @throws PermissionDeniedError
 */
export async function assertPermission(
  userId: string,
  permission: string,
): Promise<void> {
  const granted = await checkPermission(userId, permission);

  if (!granted) {
    throw new PermissionDeniedError(userId, permission);
  }
}

// ─── Domain Error ─────────────────────────────────────────────────────────────

export class PermissionDeniedError extends Error {
  readonly userId: string;
  readonly permission: string;

  constructor(userId: string, permission: string) {
    super(`Access denied: user "${userId}" is missing permission "${permission}".`);
    this.name = "PermissionDeniedError";
    this.userId = userId;
    this.permission = permission;
  }
}
