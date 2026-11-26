import { DateFilters } from "../types/dashboard.type";
import { CA_EXPR, BENEFIT_EXPR } from "../utils/dashboard.util";
import { fetchSummary, fetchTopProducts, fetchProductDetail } from "./dashboard.queries";

export class DashboardService {
  // CA
  getCaSummary(filters: DateFilters) {
    return fetchSummary(CA_EXPR, filters);
  }
  getCaTopProducts(filters: DateFilters) {
    return fetchTopProducts(CA_EXPR, filters);
  }
  getCaProductDetail(idMenu: string, filters: DateFilters) {
    return fetchProductDetail(idMenu, CA_EXPR, filters);
  }

  // Bénéfice
  getBenefitSummary(filters: DateFilters) {
    return fetchSummary(BENEFIT_EXPR, filters);
  }
  getBenefitTopProducts(filters: DateFilters) {
    return fetchTopProducts(BENEFIT_EXPR, filters);
  }
  getBenefitProductDetail(idMenu: string, filters: DateFilters) {
    return fetchProductDetail(idMenu, BENEFIT_EXPR, filters);
  }
}
