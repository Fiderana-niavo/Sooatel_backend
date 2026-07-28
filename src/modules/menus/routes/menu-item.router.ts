import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { menuItemController } from "../controllers/menu-item.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const menuItemRouter = Router();

menuItemRouter.use(authMiddleware);
menuItemRouter.get("/select", menuItemController.getCustomSelect);
generateCrudRoutes(menuItemRouter, menuItemController);

export default menuItemRouter;
