import { Router } from "express";
import {
  getCaSummary,
  getCaTopProducts,
  getCaProductDetail,
  getBenefitSummary,
  getBenefitTopProducts,
  getBenefitProductDetail,
} from "../controllers/dashboard.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../../shared/middlewares/authorize.middleware";

const saleDashboardRouter = Router();
const guard = [authMiddleware, authorize("sale.manage")];

saleDashboardRouter.get("/ca/summary", ...guard, getCaSummary);
saleDashboardRouter.get("/ca/top-products", ...guard, getCaTopProducts);
saleDashboardRouter.get("/ca/product/:idMenu", ...guard, getCaProductDetail);

saleDashboardRouter.get("/benefit/summary", ...guard, getBenefitSummary);
saleDashboardRouter.get("/benefit/top-products", ...guard, getBenefitTopProducts);
saleDashboardRouter.get("/benefit/product/:idMenu", ...guard, getBenefitProductDetail);

export default saleDashboardRouter;
