import { Router } from "express";
import { outflowCategoryController } from "../controllers/outflow-category.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const outflowCategoryRouter = Router();

outflowCategoryRouter.use(authMiddleware);

outflowCategoryRouter.get("/", outflowCategoryController.findAll);
outflowCategoryRouter.get("/:id", outflowCategoryController.getOne);
outflowCategoryRouter.post("/", outflowCategoryController.save);
outflowCategoryRouter.put("/:id", outflowCategoryController.update);
outflowCategoryRouter.delete("/:id", outflowCategoryController.remove);

export default outflowCategoryRouter;
