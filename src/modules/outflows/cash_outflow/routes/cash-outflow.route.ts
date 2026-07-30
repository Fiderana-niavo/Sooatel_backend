import { Router } from "express";
import { cashOutflowController } from "../controllers/cash-outflow.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const cashOutflowRouter = Router();

cashOutflowRouter.use(authMiddleware);

cashOutflowRouter.get("/", cashOutflowController.findAll);
cashOutflowRouter.get("/:id", cashOutflowController.getOne);
cashOutflowRouter.post("/", cashOutflowController.save);
cashOutflowRouter.put("/:id", cashOutflowController.update);
cashOutflowRouter.delete("/:id", cashOutflowController.remove);

export default cashOutflowRouter;
