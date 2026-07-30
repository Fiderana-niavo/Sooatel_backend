import { type Granularity } from "../../../../shared/utils/date.util";

export const CA_EXPR = "SUM(si.total_amount)";
export const BENEFIT_EXPR = "SUM(si.total_amount - (mi.unit_cost * si.quantity))";

export const groupByExpr = (col: string, granularity: Granularity): string => {
  if (granularity === "day")
    return `TO_CHAR(${col}, 'YYYY-MM-DD')`;
  if (granularity === "week")
    return `TO_CHAR(DATE_TRUNC('week', ${col}::date), 'YYYY-MM-DD')`;
  return `TO_CHAR(DATE_TRUNC('month', ${col}::date), 'YYYY-MM')`;
};

export const formatLabel = (raw: string, granularity: Granularity): string => {
  const date = new Date(`${raw}T00:00:00`);
  if (granularity === "day")
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  if (granularity === "week")
    return `Sem. ${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`;
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

export const baseWhere = `
  s.sale_date BETWEEN $1 AND $2
  AND s.total_amount > 0
  AND s.status >= 0
`;
