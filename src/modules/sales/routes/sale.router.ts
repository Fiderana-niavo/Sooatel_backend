import { Router } from "express";
import { createSale, updateSale, findAll, getSaleById, cancelSale, reopenSale, deleteSale, closeSale, adjustPayment, refundPayment } from "../controllers/sale.controller";
import { RevenueController } from "../controllers/revenue.controller";

import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const saleRouter = Router();
const revenueController = new RevenueController();

saleRouter.get("/revenue", authMiddleware, revenueController.getRevenue.bind(revenueController));
saleRouter.get("/", authMiddleware, findAll);
saleRouter.get("/:id", authMiddleware, getSaleById);
saleRouter.post("/", authMiddleware, authorize("sales.pos"), createSale);
saleRouter.put("/:id", authMiddleware, authorize("sales.pos"), updateSale);
saleRouter.patch("/:id/cancel", authMiddleware, authorize("sale.manage"), cancelSale);
saleRouter.patch("/:id/reopen", authMiddleware, authorize("sale.manage"), reopenSale);
saleRouter.patch("/:id/close", authMiddleware, authorize("sale.manage"), closeSale);
saleRouter.patch("/:id/payments/:idPayment/adjust", authMiddleware, authorize("sale.manage"), adjustPayment);
saleRouter.post("/:id/payments/refund", authMiddleware, authorize("sale.manage"), refundPayment);

saleRouter.delete("/:id", authMiddleware, authorize("sale.manage"), deleteSale);

export default saleRouter;
