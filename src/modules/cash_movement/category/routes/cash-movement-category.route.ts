import { Router } from "express";
import { cashMovementCategoryController } from "../controllers/cash-movement-category.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const CashMovementCategoryRouter = Router();

CashMovementCategoryRouter.use(authMiddleware);

CashMovementCategoryRouter.get("/", cashMovementCategoryController.findAll);
CashMovementCategoryRouter.get("/:id", cashMovementCategoryController.getOne);
CashMovementCategoryRouter.post("/", cashMovementCategoryController.save);
CashMovementCategoryRouter.put("/:id", cashMovementCategoryController.update);
CashMovementCategoryRouter.delete("/:id", cashMovementCategoryController.remove);

export default CashMovementCategoryRouter;
