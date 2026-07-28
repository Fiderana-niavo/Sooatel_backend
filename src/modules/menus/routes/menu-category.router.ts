import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { menuCategoryController } from "../controllers/menu-category.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const menuCategoryRouter = Router();

menuCategoryRouter.use(authMiddleware);
generateCrudRoutes(menuCategoryRouter, menuCategoryController, { valueField: "idCategory", labelField: "label" });

export default menuCategoryRouter;
