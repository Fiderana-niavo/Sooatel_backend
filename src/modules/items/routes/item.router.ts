import { Router } from "express";
import { itemController } from "../controllers/item.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const itemRouter = Router();

itemRouter.use(authMiddleware);

itemRouter.get("/select", authorize("stock.read"), itemController.getSelect("idItem", "label"));
itemRouter.get("/", authorize("stock.read"), itemController.findAll);
itemRouter.get("/:id", authorize("stock.read"), itemController.getOne);
itemRouter.post("/", authorize("stock.manage"), itemController.save);
itemRouter.put("/:id", authorize("stock.manage"), itemController.update);
itemRouter.delete("/:id", authorize("stock.manage"), itemController.remove);

export default itemRouter;
