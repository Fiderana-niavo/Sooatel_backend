import { Router } from "express";
import { stockMovementController } from "../controllers/stock-movement.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", authorize("stock.read"), stockMovementController.findAll);
router.post("/", authorize("stock.manage"), stockMovementController.create);
router.post("/loss", authorize("stock.manage"), stockMovementController.recordLoss);
router.put("/:id", authorize("stock.manage"), stockMovementController.update);
router.put("/:id/validate", authorize("stock.manage"), stockMovementController.validate);
router.delete("/:id", authorize("stock.manage"), stockMovementController.delete);

export default router;

