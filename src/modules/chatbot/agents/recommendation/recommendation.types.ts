import { QueryResult } from "../analytics/analytics.types";

export type RecommendationDomain =
  | "sales"
  | "pricing"
  | "supplier"
  | "performance"
  | "stock"
  | "general";

export interface RecommendationContext {
  domain: RecommendationDomain;
  userQuestion: string;
  queryResults: QueryResult[];
}
