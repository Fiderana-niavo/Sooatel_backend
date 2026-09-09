import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";
import { inventoryController } from "../controllers/inventory.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", authorize("stock.manage"), inventoryController.submitInventory);

export default router;
