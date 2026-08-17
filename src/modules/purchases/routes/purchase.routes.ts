import { Router } from "express";
import { purchaseController } from "../controllers/purchase.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

router.post("/", purchaseController.create);
router.get("/", purchaseController.findAll);
router.get("/:id", purchaseController.getById);
router.get("/:id/details", purchaseController.getDetails);
router.get("/:id/deliveries", purchaseController.getDeliveries);

export default router;
