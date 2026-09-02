import { Router } from "express";
import { itemUnitController } from "../controllers/item-unit.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const itemUnitRouter = Router();

itemUnitRouter.use(authMiddleware);

itemUnitRouter.get("/", authorize("stock.manage"), itemUnitController.findAll);
itemUnitRouter.get("/:id", authorize("stock.manage"), itemUnitController.getOne);
itemUnitRouter.post("/", authorize("stock.manage"), itemUnitController.save);
itemUnitRouter.put("/:id", authorize("stock.manage"), itemUnitController.update);
itemUnitRouter.delete("/:id", authorize("stock.manage"), itemUnitController.remove);

export default itemUnitRouter;
