import { Router } from "express";
import { cashMovementController } from "../controllers/cash-movement.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../../shared/middlewares/authorize.middleware";

const cashMovementRouter = Router();

cashMovementRouter.use(authMiddleware);

cashMovementRouter.get("/", authorize("restaurant.purchases"), cashMovementController.findAll);
cashMovementRouter.get("/:id", authorize("restaurant.purchases"), cashMovementController.getOne);
cashMovementRouter.post("/", authorize("restaurant.purchases"), cashMovementController.save);
cashMovementRouter.put("/:id", authorize("restaurant.purchases"), cashMovementController.update);
cashMovementRouter.delete("/:id", authorize("restaurant.purchases"), cashMovementController.remove);

export default cashMovementRouter;
