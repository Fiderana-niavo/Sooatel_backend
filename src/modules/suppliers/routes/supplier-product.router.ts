import { Router } from "express";
import { supplierProductController } from "../controllers/supplier-product.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

router.use(authMiddleware);

// --- SUPPLIER PRODUCTS ---
router.get("/list", authorize("supplier.manage"), supplierProductController.findAll);
router.get("/:id", authorize("supplier.manage"), supplierProductController.getOne);
router.post("/", authorize("supplier.manage"), supplierProductController.save);
router.put("/:id", authorize("supplier.manage"), supplierProductController.update);
router.delete("/:id", authorize("supplier.manage"), supplierProductController.remove);

// --- PRODUCT PRICING ---
router.get("/:id/price-history", authorize("supplier.manage"), supplierProductController.getPriceHistory);
router.post("/:id/price", authorize("supplier.manage"), supplierProductController.changePrice);
router.put("/:id/price/fix", authorize("supplier.manage"), supplierProductController.fixPriceError);

export default router;
