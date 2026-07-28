import { Router } from "express";
import { createSale, updateSale, findAll, getSaleById, cancelSale, reopenSale, deleteSale, paySale, closeSale } from "../controllers/sale.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const saleRouter = Router();

saleRouter.get("/", authMiddleware, findAll);
saleRouter.get("/:id", authMiddleware, getSaleById);
saleRouter.post("/", authMiddleware, authorize("sales.pos"), createSale);
saleRouter.put("/:id", authMiddleware, authorize("sales.pos"), updateSale);
saleRouter.patch("/:id/cancel", authMiddleware, authorize("sale.manage"), cancelSale);
saleRouter.patch("/:id/reopen", authMiddleware, authorize("sale.manage"), reopenSale);
saleRouter.patch("/:id/close", authMiddleware, authorize("sale.manage"), closeSale);
saleRouter.patch("/:id/pay", authMiddleware, authorize("sale.manage"), paySale);
saleRouter.delete("/:id", authMiddleware, authorize("sale.manage"), deleteSale);

export default saleRouter;
