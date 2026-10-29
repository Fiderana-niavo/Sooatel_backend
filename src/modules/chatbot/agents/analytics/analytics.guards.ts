export interface TableGuard {
  name: string;
  pattern: RegExp;
  permissions: string[];
}

/**
 * Hard security barriers verifying SQL queries against user permissions.
 * Matches all tables and views protected by corresponding backend API routes.
 */
export const TABLE_GUARDS: TableGuard[] = [
  // 1. Sales Analytics & Performance (Sellers Ranking, Margins & Gross Profit)
  {
    name: "sales_analytics",
    pattern: /\b(v_sellers|v_menu_sales)\b/i,
    permissions: ["sale.manage"],
  },

  // 2. Operational Sales, Invoicing & Cash Register (POS)
  {
    name: "sales_pos",
    pattern:
      /\b(sales|sale_items|invoice|payment|cash_journal|cash_movement|cash_movement_category|payment_method_balance)\b/i,
    permissions: ["sales.pos", "sale.manage", "restaurant.pos"],
  },

  // 3. Supplier Financials, Debts & Balances (Accounting & Payments)
  {
    name: "supplier_debts",
    pattern:
      /\b(v_supplier_debts|supplier_balance|supplier_payment|supplier_payment_allocation|supplier_payment_line)\b/i,
    permissions: ["restaurant.purchases"],
  },

  // 4. Supplier Logistics, Catalog & Deliveries
  {
    name: "purchases_logistics",
    pattern:
      /\b(purchases|purchase_details|product_delivery|delivery_details|purchase_delivery|supplier|supplier_products|supplier_products_price|supplied_items|v_supplier_catalog)\b/i,
    permissions: ["restaurant.purchases", "supplier.manage", "stock.manage"],
  },

  // 5. Sensitive HR: Base Salaries (High Confidentiality)
  {
    name: "salaries",
    pattern: /\b(base_salary)\b/i,
    permissions: ["hr.access", "security.access"],
  },

  // 6. HR: Leaves, Balances & Transactions
  {
    name: "hr_leaves",
    pattern:
      /\b(leaves|leave_types|leave_transactions|employee_leave_balances|employee_availabilities|employee_requirements)\b/i,
    permissions: ["hr.access", "security.access"],
  },

  // 7. HR: Schedules, Shifts & Attendances
  {
    name: "hr_schedules",
    pattern: /\b(attendances|schedules|shift_type)\b/i,
    permissions: ["hr.manage", "hr.access", "security.access"],
  },

  // 8. HR: Employees Records & Active Staff
  {
    name: "employees",
    pattern:
      /\b(employees|v_employees_active|internship|schools|employees_job)\b/i,
    permissions: ["employee.manage", "hr.access", "security.access"],
  },

  // 9. Kitchen Recipes & Portion Costs
  {
    name: "recipes",
    pattern: /\b(recipes|recipe_details|v_recipes|v_recipe_ingredients)\b/i,
    permissions: ["stock.read", "stock.manage", "stock.access", "restaurant.access"],
  },

  // 10. Stock Movements & Kitchen Production
  {
    name: "stock",
    pattern: /\b(stock_movement|dish_production|v_stock_alerts)\b/i,
    permissions: ["stock.read", "stock.manage", "stock.access", "stock.audit"],
  },

  // 11. Security: Users, Roles, Permissions, Tokens & Audit Logs
  {
    name: "security",
    pattern:
      /\b(users|user_role|role_permission|user_permission|user_tokens?|role|permission|permission_category|audit_logs)\b/i,
    permissions: ["security.access"],
  },

  // 12. Hotel: Rooms & Accommodation
  {
    name: "hotel",
    pattern: /\b(room|room_type)\b/i,
    permissions: ["hotel.access"],
  },
];

/**
 * Validates whether the user's permissions allow executing the given SQL query.
 * Returns false if any guarded table is queried without holding at least one of its required permissions.
 */
export function checkTableGuards(sql: string, userPerms: string[]): boolean {
  for (const guard of TABLE_GUARDS) {
    if (guard.pattern.test(sql)) {
      const allowed = guard.permissions.some((p) => userPerms.includes(p));
      if (!allowed) {
        return false;
      }
    }
  }

  return true;
}
