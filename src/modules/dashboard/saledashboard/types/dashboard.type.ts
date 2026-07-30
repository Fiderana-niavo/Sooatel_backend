export interface DateFilters {
  startDate: string;
  endDate: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface SummaryResult {
  total: number;
  chartData: ChartPoint[];
}

export interface TopProduct {
  idMenu: string;
  name: string;
  value: number;
  percentage: number;
}

export interface TopProductsResult {
  top5: TopProduct[];
}

export interface ProductDetailResult {
  idMenu: string;
  name: string;
  value: number;
  globalTotal: number;
  percentage: number;
  chartData: ChartPoint[];
}
