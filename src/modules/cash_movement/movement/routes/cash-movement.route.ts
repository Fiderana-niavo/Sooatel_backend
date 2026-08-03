import { Router } from "express";
import { cashMovementController } from "../controllers/cash-movement.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const cashMovementRouter = Router();

cashMovementRouter.use(authMiddleware);

cashMovementRouter.get("/", cashMovementController.findAll);
cashMovementRouter.get("/:id", cashMovementController.getOne);
cashMovementRouter.post("/", cashMovementController.save);
cashMovementRouter.put("/:id", cashMovementController.update);
cashMovementRouter.delete("/:id", cashMovementController.remove);

export default cashMovementRouter;
