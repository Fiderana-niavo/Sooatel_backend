/**
 * Central registry of all permission keys.
 * Values MUST exactly match the `code` column in the `permission` table.
 * Sources: seed-admin.ts, seedPermissions.ts, addStockPerm.ts
 */
export const PERMISSIONS = {
  // ─── Ressources Humaines ─────────────────────────────────────────────────────
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  JOB_READ: "job.read",
  JOB_CREATE: "job.create",
  JOB_UPDATE: "job.update",
  JOB_DELETE: "job.delete",

  HR_ACCESS: "hr.access",
  HR_SCHEDULE: "hr.schedule",
  HR_WELFARE: "hr.welfare",

  // ─── Sécurité ─────────────────────────────────────────────────────────────────
  ROLE_READ: "role.read",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  PERMISSION_READ: "permission.read",
  PERMISSION_CREATE: "permission.create",
  PERMISSION_UPDATE: "permission.update",
  PERMISSION_DELETE: "permission.delete",

  SECURITY_ACCESS: "security.access",

  // ─── Navigation ───────────────────────────────────────────────────────────────
  HOTEL_ACCESS: "hotel.access",
  RESTAURANT_ACCESS: "restaurant.access",

  // ─── Restaurant ───────────────────────────────────────────────────────────────
  RESTAURANT_POS: "restaurant.pos",
  SALES_POS: "sales.pos",
  SALE_MANAGE: "sale.manage",
  RESTAURANT_PURCHASES: "restaurant.purchases",

  // ─── Stock & Logistique ───────────────────────────────────────────────────────
  STOCK_ACCESS: "stock.access",
  STOCK_READ: "stock.read",
  STOCK_AUDIT: "stock.audit",
  STOCK_FORECAST: "stock.forecast",
  STOCK_MANAGE: "stock.manage",

  // ─── Configuration ────────────────────────────────────────────────────────────
  SETTINGS_ACCESS: "settings.access",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "employee.read": "[employee.read]",
  "employee.create": "[employee.create]",
  "employee.update": "[employee.update]",
  "employee.delete": "[employee.delete]",
  "job.read": "[job.read]",
  "job.create": "[job.create]",
  "job.update": "[job.update]",
  "job.delete": "[job.delete]",
  "hr.access": "[hr.access]",
  "hr.schedule": "[hr.schedule]",
  "hr.welfare": "[hr.welfare]",
  "role.read": "[role.read]",
  "role.create": "[role.create]",
  "role.update": "[role.update]",
  "role.delete": "[role.delete]",
  "permission.read": "[permission.read]",
  "permission.create": "[permission.create]",
  "permission.update": "[permission.update]",
  "permission.delete": "[permission.delete]",
  "security.access": "[security.access]",
  "hotel.access": "[hotel.access]",
  "restaurant.access": "[restaurant.access]",
  "restaurant.pos": "[restaurant.pos]",
  "sales.pos": "[sales.pos]",
  "sale.manage": "[sale.manage]",
  "restaurant.purchases": "[restaurant.purchases]",
  "stock.access": "[stock.access]",
  "stock.read": "[stock.read]",
  "stock.audit": "[stock.audit]",
  "stock.forecast": "[stock.forecast]",
  "stock.manage": "[stock.manage]",
  "settings.access": "[settings.access]",
};
