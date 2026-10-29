import { Router } from "express";
import { itemTypeController } from "../controllers/item-type.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const itemTypeRouter = Router();

itemTypeRouter.use(authMiddleware);

itemTypeRouter.get("/select", authorize("stock.read"), itemTypeController.getSelect("idProductType", "label"));
itemTypeRouter.get("/", authorize("stock.read"), itemTypeController.findAll);
itemTypeRouter.get("/:id", authorize("stock.read"), itemTypeController.getOne);
itemTypeRouter.post("/", authorize("stock.manage"), itemTypeController.save);
itemTypeRouter.put("/:id", authorize("stock.manage"), itemTypeController.update);
itemTypeRouter.delete("/:id", authorize("stock.manage"), itemTypeController.remove);

export default itemTypeRouter;
