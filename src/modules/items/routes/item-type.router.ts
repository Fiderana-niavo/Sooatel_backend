import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { itemTypeController } from "../controllers/item-type.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const itemTypeRouter = Router();

itemTypeRouter.use(authMiddleware);
generateCrudRoutes(itemTypeRouter, itemTypeController);

export default itemTypeRouter;
