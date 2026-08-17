import { Router } from "express";
import { deliveryController } from "../controllers/delivery.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", deliveryController.findAll);
router.get("/pending/:idSupplier", deliveryController.getPendingBySupplier);
router.get("/:id/details", deliveryController.getDetails);
router.post("/", deliveryController.create);
router.put("/:id", deliveryController.update);
router.delete("/:id", deliveryController.delete);
router.put("/:id/validate", deliveryController.validate);

export default router;
