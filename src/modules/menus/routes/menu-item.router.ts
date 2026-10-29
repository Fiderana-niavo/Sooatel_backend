import { Router } from "express";
import { menuItemController } from "../controllers/menu-item.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const menuItemRouter = Router();

menuItemRouter.use(authMiddleware);

menuItemRouter.get("/select", authorize("sales.pos"), menuItemController.getCustomSelect);
menuItemRouter.get("/", authorize("sales.pos"), menuItemController.findAll);
menuItemRouter.get("/:id", authorize("sales.pos"), menuItemController.getOne);
menuItemRouter.post("/", authorize("sale.manage"), menuItemController.save);
menuItemRouter.put("/:id", authorize("sale.manage"), menuItemController.update);
menuItemRouter.delete("/:id", authorize("sale.manage"), menuItemController.remove);

export default menuItemRouter;
