import { Router } from "express";
import { deliveryController } from "../controllers/delivery.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", authorize("supplier.read"), deliveryController.findAll);
router.get("/pending/:idSupplier", authorize("supplier.read"), deliveryController.getPendingBySupplier);
router.get("/:id/details", authorize("supplier.read"), deliveryController.getDetails);
router.post("/", authorize("stock.manage"), deliveryController.create);
router.put("/:id", authorize("stock.manage"), deliveryController.update);
router.delete("/:id", authorize("stock.manage"), deliveryController.delete);
router.put("/:id/validate", authorize("stock.manage"), deliveryController.validate);

export default router;
