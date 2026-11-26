import AppDataSource from "../../../../database/data-source";
import { QueryIntent, QueryResult } from "./analytics.types";
import { getUserPermissions } from "../../../../shared/services/UserPermissionCache";

import { checkTableGuards } from "./analytics.guards";

async function isAllowed(userId: string, sql: string, claimedPerm: string): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms.includes(claimedPerm)) {
    return false;
  }

  return checkTableGuards(sql, userPerms);
}

// ─── SQL Safety Guard ─────────────────────────────────────────────────────────
// Rejects any query that is not a pure SELECT statement.

const FORBIDDEN_PATTERN =
  /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CALL)\b/i;

function isSafeQuery(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return trimmed.startsWith("SELECT") && !FORBIDDEN_PATTERN.test(sql);
}

// ─── Single Query Executor ────────────────────────────────────────────────────

async function executeIntent(userId: string, intent: QueryIntent): Promise<QueryResult> {
  // 1. Permission check with table guard
  const granted = await isAllowed(userId, intent.sql, intent.requiredPermission);
  if (!granted) {
    return { label: intent.label, rows: [], denied: true };
  }

  // 2. Safety check — never execute non-SELECT queries
  if (!isSafeQuery(intent.sql)) {
    console.warn(`[ANALYTICS] ⚠️  Unsafe query blocked: ${intent.sql.slice(0, 80)}...`);
    return { label: intent.label, rows: [], denied: false };
  }

  // 3. Execute with parameterized query
  try {
    const rows = (await AppDataSource.query(intent.sql, intent.params)) as Record<
      string,
      unknown
    >[];
    return { label: intent.label, rows, denied: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ANALYTICS] ❌ Query failed for "${intent.label}": ${message}`);
    console.error(`[ANALYTICS] SQL: ${intent.sql}`);
    return { label: intent.label, rows: [], denied: false };
  }
}

// ─── Batch Executor ───────────────────────────────────────────────────────────
// Runs all intents sequentially to avoid overwhelming the DB.

export async function executeQueryPlan(
  userId: string,
  intents: QueryIntent[],
): Promise<QueryResult[]> {
  const results: QueryResult[] = [];

  for (const intent of intents) {
    const result = await executeIntent(userId, intent);
    results.push(result);
  }

  return results;
}
