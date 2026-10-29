import { Router } from "express";
import { productPriceController } from "../controllers/product-price.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const productPriceRouter = Router();

productPriceRouter.use(authMiddleware);

productPriceRouter.get("/", authorize("sales.pos"), productPriceController.findAll);
productPriceRouter.get("/:id", authorize("sales.pos"), productPriceController.getOne);
productPriceRouter.post("/", authorize("sale.manage"), productPriceController.save);
productPriceRouter.put("/:id", authorize("sale.manage"), productPriceController.update);
productPriceRouter.delete("/:id", authorize("sale.manage"), productPriceController.remove);

export default productPriceRouter;
