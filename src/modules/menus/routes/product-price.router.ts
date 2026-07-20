import { Router } from "express";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { productPriceController } from "../controllers/product-price.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const productPriceRouter = Router();

productPriceRouter.use(authMiddleware);
generateCrudRoutes(productPriceRouter, productPriceController);

export default productPriceRouter;
