export type Granularity = "day" | "week" | "month";

/**
 * Determines the chart grouping granularity based on the period length.
 *  - <= 14 days  → by day
 *  - <= 60 days  → by week
 *  - > 60 days   → by month
 */
export const getGranularity = (startDate: Date, endDate: Date): Granularity => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 14) return "day";
  if (diffDays <= 60) return "week";
  return "month";
};
