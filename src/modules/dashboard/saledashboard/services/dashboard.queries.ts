import AppDataSource from "../../../../database/data-source";
import { getGranularity } from "../../../../shared/utils/date.util";
import {
  DateFilters,
  SummaryResult,
  TopProductsResult,
  ProductDetailResult,
  TopProduct,
  ChartPoint,
} from "../types/dashboard.type";
import { groupByExpr, formatLabel, baseWhere } from "../utils/dashboard.util";

export async function fetchSummary(
  valueExpr: string,
  filters: DateFilters
): Promise<SummaryResult> {
  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);
  const granularity = getGranularity(start, end);
  const groupExpr = groupByExpr("s.sale_date", granularity);

  const rows: { label: string; value: string }[] = await AppDataSource.query(
    `
    SELECT
      ${groupExpr}              AS label,
      COALESCE(${valueExpr}, 0) AS value
    FROM sales s
    INNER JOIN sale_items si ON si.id_sale = s.id_sale
    INNER JOIN menu_items mi ON mi.id_menu = si.id_menu
    WHERE ${baseWhere}
    GROUP BY label
    ORDER BY label ASC
    `,
    [filters.startDate, filters.endDate]
  );

  const total = rows.reduce((acc, r) => acc + Number(r.value), 0);
  const chartData: ChartPoint[] = rows.map((r) => ({
    label: formatLabel(r.label, granularity),
    value: Number(r.value),
  }));

  return { total, chartData };
}

export async function fetchTopProducts(
  valueExpr: string,
  filters: DateFilters
): Promise<TopProductsResult> {
  const rows: {
    idMenu: string;
    name: string;
    value: string;
    percentage: string;
  }[] = await AppDataSource.query(
    `
    WITH global AS (
      SELECT COALESCE(${valueExpr}, 0) AS total
      FROM sales s
      INNER JOIN sale_items si ON si.id_sale = s.id_sale
      INNER JOIN menu_items mi ON mi.id_menu = si.id_menu
      WHERE ${baseWhere}
    ),
    per_product AS (
      SELECT
        mi.id_menu                                              AS "idMenu",
        i.label                                                 AS name,
        COALESCE(${valueExpr}, 0)                               AS value
      FROM sales s
      INNER JOIN sale_items si ON si.id_sale = s.id_sale
      INNER JOIN menu_items mi ON mi.id_menu = si.id_menu
      INNER JOIN items i ON i.id_item = mi.id_item
      WHERE ${baseWhere}
      GROUP BY mi.id_menu, i.label
    )
    SELECT
      pp."idMenu",
      pp.name,
      pp.value,
      CASE WHEN g.total > 0
        THEN ROUND((pp.value / g.total * 100)::numeric, 2)
        ELSE 0
      END AS percentage
    FROM per_product pp
    CROSS JOIN global g
    ORDER BY pp.value DESC
    LIMIT 5
    `,
    [filters.startDate, filters.endDate]
  );

  const top5: TopProduct[] = rows.map((r) => ({
    idMenu: r.idMenu,
    name: r.name,
    value: Number(r.value),
    percentage: Number(r.percentage),
  }));

  return { top5 };
}

export async function fetchProductDetail(
  idMenu: string,
  valueExpr: string,
  filters: DateFilters
): Promise<ProductDetailResult> {
  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);
  const granularity = getGranularity(start, end);
  const groupExpr = groupByExpr("s.sale_date", granularity);

  const chartRows: { label: string; value: string }[] =
    await AppDataSource.query(
      `
      SELECT
        ${groupExpr}              AS label,
        COALESCE(${valueExpr}, 0) AS value
      FROM sales s
      INNER JOIN sale_items si ON si.id_sale = s.id_sale
      INNER JOIN menu_items mi ON mi.id_menu = si.id_menu
      WHERE ${baseWhere}
        AND mi.id_menu = $3
      GROUP BY label
      ORDER BY label ASC
      `,
      [filters.startDate, filters.endDate, idMenu]
    );

  const [productRow]: {
    idMenu: string;
    name: string;
    value: string;
  }[] = await AppDataSource.query(
    `
    SELECT
      mi.id_menu                              AS "idMenu",
      i.label                                 AS name,
      COALESCE(${valueExpr}, 0)               AS value
    FROM sales s
    INNER JOIN sale_items si ON si.id_sale = s.id_sale
    INNER JOIN menu_items mi ON mi.id_menu = si.id_menu
    INNER JOIN items i ON i.id_item = mi.id_item
    WHERE ${baseWhere}
      AND mi.id_menu = $3
    GROUP BY mi.id_menu, i.label
    `,
    [filters.startDate, filters.endDate, idMenu]
  );

  const [globalRow]: { globalTotal: string }[] = await AppDataSource.query(
    `
    SELECT COALESCE(${valueExpr}, 0) AS "globalTotal"
    FROM sales s
    INNER JOIN sale_items si ON si.id_sale = s.id_sale
    INNER JOIN menu_items mi ON mi.id_menu = si.id_menu
    WHERE ${baseWhere}
    `,
    [filters.startDate, filters.endDate]
  );

  const value = productRow ? Number(productRow.value) : 0;
  const globalTotal = globalRow ? Number(globalRow.globalTotal) : 0;
  const percentage =
    globalTotal > 0 ? Math.round((value / globalTotal) * 10000) / 100 : 0;

  const chartData: ChartPoint[] = chartRows.map((r) => ({
    label: formatLabel(r.label, granularity),
    value: Number(r.value),
  }));

  return {
    idMenu,
    name: productRow?.name ?? "",
    value,
    globalTotal,
    percentage,
    chartData,
  };
}
