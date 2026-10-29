import { PermissionKey } from "../../../../shared/permissions/permission.constants";


export interface QueryIntent {
  label: string;
  requiredPermission: PermissionKey;
  sql: string;
  params: (string | number | boolean)[];
}

export interface QueryPlan {
  isRecommendation?: boolean;
  directAnswer?: string;
  intents: QueryIntent[];
}

// ─── Query Result ─────────────────────────────────────────────────────────────

export interface QueryResult {
  label: string;
  rows: Record<string, unknown>[];
  /** True if the user lacked permission — rows will be empty */
  denied: boolean;
}
