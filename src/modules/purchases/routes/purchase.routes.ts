import { Router } from "express";
import { purchaseController } from "../controllers/purchase.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

router.get("/", authorize("stock.manage"), purchaseController.findAll);
router.get("/:id", authorize("stock.manage"), purchaseController.getById);
router.get("/:id/details", authorize("stock.manage"), purchaseController.getDetails);
router.get("/:id/deliveries", authorize("stock.manage"), purchaseController.getDeliveries);
router.post("/", authorize("stock.manage"), purchaseController.create);
router.put("/:id", authorize("stock.manage"), purchaseController.update);
router.post("/:id/confirm", authorize("stock.manage"), purchaseController.confirm);
router.post("/:id/cancel", authorize("stock.manage"), purchaseController.cancel);

export default router;
