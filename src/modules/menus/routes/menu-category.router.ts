import { Router } from "express";
import { menuCategoryController } from "../controllers/menu-category.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const menuCategoryRouter = Router();

menuCategoryRouter.use(authMiddleware);

menuCategoryRouter.get("/select", authorize("sales.pos"), menuCategoryController.getSelect("idCategory", "label"));
menuCategoryRouter.get("/", authorize("sales.pos"), menuCategoryController.findAll);
menuCategoryRouter.get("/:id", authorize("sales.pos"), menuCategoryController.getOne);
menuCategoryRouter.post("/", authorize("sale.manage"), menuCategoryController.save);
menuCategoryRouter.put("/:id", authorize("sale.manage"), menuCategoryController.update);
menuCategoryRouter.delete("/:id", authorize("sale.manage"), menuCategoryController.remove);

export default menuCategoryRouter;
