import { Router } from "express";
import { dishProductionController } from "../controllers/dish-production.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", authorize("stock.read"), dishProductionController.findAll);
router.post("/", authorize("stock.manage"), dishProductionController.create);
router.put("/:id", authorize("stock.manage"), dishProductionController.update);
router.put("/:id/validate", authorize("stock.manage"), dishProductionController.validate);
router.delete("/:id", authorize("stock.manage"), dishProductionController.delete);

export default router;
