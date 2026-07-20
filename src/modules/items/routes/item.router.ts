import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { itemController } from "../controllers/item.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const itemRouter = Router();

itemRouter.use(authMiddleware);
generateCrudRoutes(itemRouter, itemController);

export default itemRouter;
