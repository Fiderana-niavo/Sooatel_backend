import { Router } from "express";
import { cashMovementCategoryController } from "../controllers/cash-movement-category.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../../shared/middlewares/authorize.middleware";

const CashMovementCategoryRouter = Router();

CashMovementCategoryRouter.use(authMiddleware);

CashMovementCategoryRouter.get(
  "/",
  authorize("restaurant.purchases"),
  cashMovementCategoryController.findAll,
);
CashMovementCategoryRouter.get(
  "/:id",
  authorize("restaurant.purchases"),
  cashMovementCategoryController.getOne,
);
CashMovementCategoryRouter.post(
  "/",
  authorize("restaurant.purchases"),
  cashMovementCategoryController.save,
);
CashMovementCategoryRouter.put(
  "/:id",
  authorize("restaurant.purchases"),
  cashMovementCategoryController.update,
);
CashMovementCategoryRouter.delete(
  "/:id",
  authorize("restaurant.purchases"),
  cashMovementCategoryController.remove,
);

export default CashMovementCategoryRouter;
